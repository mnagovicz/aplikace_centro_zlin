import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateCompletionCode } from "@/lib/nanoid";
import { sendCompletionEmail } from "@/lib/email";

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

  // Already completed
  if (player.completion_code) {
    return NextResponse.json({
      completionCode: player.completion_code,
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

  // Send email (non-blocking)
  const game = player.games;
  sendCompletionEmail({
    playerName: player.name,
    playerEmail: player.email,
    completionCode,
    gameName: game.name,
    rewardDescription: game.reward_description || "Odměna v OC Centro Zlín",
  }).catch((err) => console.error("Email send failed:", err));

  return NextResponse.json({ completionCode });
}
