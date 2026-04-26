import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateCompletionCode } from "@/lib/nanoid";
import { sendCompletionEmail } from "@/lib/email";
import { generateQrDataUrl } from "@/lib/qr";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionToken } = body;

  if (!sessionToken) {
    return NextResponse.json(
      { error: "Chybí session token" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Get player with game info
  const { data: player } = await supabase
    .from("players")
    .select("*, games(*)")
    .eq("session_token", sessionToken)
    .single();

  if (!player) {
    return NextResponse.json(
      { error: "Hráč nenalezen" },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Already completed
  if (player.completion_code) {
    const verifyUrl = `${appUrl}/admin/verify?code=${player.completion_code}`;
    const qrDataUrl = await generateQrDataUrl(verifyUrl);
    return NextResponse.json({
      completionCode: player.completion_code,
      qrDataUrl,
      alreadyCompleted: true,
    });
  }

  // Verify all checkpoints answered
  const { count: totalCheckpoints } = await supabase
    .from("checkpoints")
    .select("*", { count: "exact", head: true })
    .eq("game_id", player.game_id);

  const { count: answeredCheckpoints } = await supabase
    .from("player_checkpoints")
    .select("*", { count: "exact", head: true })
    .eq("player_id", player.id);

  if (answeredCheckpoints !== totalCheckpoints) {
    return NextResponse.json(
      {
        error: "Ještě jste neodpověděli na všechny otázky",
        answeredCheckpoints,
        totalCheckpoints,
      },
      { status: 400 }
    );
  }

  // Generate unique completion code
  let completionCode: string;
  let attempts = 0;
  do {
    completionCode = generateCompletionCode();
    const { data: existing } = await supabase
      .from("players")
      .select("id")
      .eq("completion_code", completionCode)
      .single();
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  // Update player with completion code
  const { error } = await supabase
    .from("players")
    .update({
      completion_code: completionCode,
      completed_at: new Date().toISOString(),
    })
    .eq("id", player.id);

  if (error) {
    console.error("Complete error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se dokončit hru" },
      { status: 500 }
    );
  }

  // Send email (must await, otherwise Vercel kills the function before it finishes)
  const game = player.games;
  try {
    await sendCompletionEmail({
      playerName: player.name,
      playerEmail: player.email,
      completionCode,
      gameName: game.name,
      rewardDescription: game.reward_description || "Odměna v OC Centro Zlín",
    });
    console.log("Email sent successfully to", player.email);
  } catch (err) {
    console.error("Email send failed:", err);
  }

  // Generate QR code for verification URL
  const verifyUrl = `${appUrl}/admin/verify?code=${completionCode}`;
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  // Feature #5: Leaderboard comparison (only for free mode games)
  let leaderboard = null;
  if (!game.require_correct_answer) {
    // Count this player's correct answers
    const { count: playerCorrect } = await supabase
      .from("player_checkpoints")
      .select("*", { count: "exact", head: true })
      .eq("player_id", player.id)
      .eq("answered_correctly", true);

    // Find the best score among all completed players in this game
    const { data: allPlayers } = await supabase
      .from("players")
      .select("id")
      .eq("game_id", player.game_id)
      .not("completion_code", "is", null);

    let bestScore = 0;
    let playerRank = 1;

    if (allPlayers && allPlayers.length > 0) {
      const playerIds = allPlayers.map((p) => p.id);

      // Get correct answer counts for all completed players
      const { data: scores } = await supabase
        .from("player_checkpoints")
        .select("player_id")
        .in("player_id", playerIds)
        .eq("answered_correctly", true);

      // Count per player
      const scoreCounts: Record<string, number> = {};
      for (const s of scores || []) {
        scoreCounts[s.player_id] = (scoreCounts[s.player_id] || 0) + 1;
      }

      const allScores = Object.values(scoreCounts).sort((a, b) => b - a);
      bestScore = allScores[0] || 0;

      // Calculate rank
      const myScore = playerCorrect || 0;
      playerRank = allScores.filter((s) => s > myScore).length + 1;
    }

    leaderboard = {
      playerCorrect: playerCorrect || 0,
      bestScore,
      totalCheckpoints: totalCheckpoints || 0,
      playerRank,
      totalPlayers: allPlayers?.length || 1,
    };
  }

  return NextResponse.json({ completionCode, qrDataUrl, leaderboard });
}
