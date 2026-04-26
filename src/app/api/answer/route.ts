import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionToken, checkpointId, answerIndex } = body;

  if (!sessionToken || !checkpointId || answerIndex === undefined) {
    return NextResponse.json(
      { error: "Chybí povinné údaje" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Get player
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("session_token", sessionToken)
    .single();

  if (!player) {
    return NextResponse.json(
      { error: "Hráč nenalezen" },
      { status: 404 }
    );
  }

  // Get checkpoint with game info
  const { data: checkpoint } = await supabase
    .from("checkpoints")
    .select("*, games(require_correct_answer)")
    .eq("id", checkpointId)
    .eq("game_id", player.game_id)
    .single();

  if (!checkpoint) {
    return NextResponse.json(
      { error: "Stanoviště nenalezeno" },
      { status: 404 }
    );
  }

  const requireCorrect = checkpoint.games?.require_correct_answer ?? true;
  const answeredCorrectly = answerIndex === checkpoint.correct_answer_index;

  // Check if already answered
  const { data: existing } = await supabase
    .from("player_checkpoints")
    .select("id")
    .eq("player_id", player.id)
    .eq("checkpoint_id", checkpointId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Na tuto otázku jste již odpověděli" },
      { status: 409 }
    );
  }

  // If require_correct_answer is ON and answer is wrong → don't record, let player retry
  if (requireCorrect && !answeredCorrectly) {
    // Count progress without saving
    const { count: totalCheckpoints } = await supabase
      .from("checkpoints")
      .select("*", { count: "exact", head: true })
      .eq("game_id", player.game_id);

    const { count: answeredCheckpoints } = await supabase
      .from("player_checkpoints")
      .select("*", { count: "exact", head: true })
      .eq("player_id", player.id);

    return NextResponse.json({
      correct: false,
      correctAnswer: checkpoint.answers[checkpoint.correct_answer_index],
      answeredCheckpoints: answeredCheckpoints || 0,
      totalCheckpoints: totalCheckpoints || 0,
      allCompleted: false,
      canRetry: true,
      gameId: player.game_id,
    });
  }

  // Record answer
  const { error } = await supabase.from("player_checkpoints").insert({
    player_id: player.id,
    checkpoint_id: checkpointId,
    answered_correctly: answeredCorrectly,
  });

  if (error) {
    console.error("Answer error:", error);
    return NextResponse.json(
      { error: "Nepodařilo se uložit odpověď" },
      { status: 500 }
    );
  }

  // Count total checkpoints and player's answered checkpoints
  const { count: totalCheckpoints } = await supabase
    .from("checkpoints")
    .select("*", { count: "exact", head: true })
    .eq("game_id", player.game_id);

  const { count: answeredCheckpoints } = await supabase
    .from("player_checkpoints")
    .select("*", { count: "exact", head: true })
    .eq("player_id", player.id);

  const allCompleted = answeredCheckpoints === totalCheckpoints;

  return NextResponse.json({
    correct: answeredCorrectly,
    correctAnswer: checkpoint.answers[checkpoint.correct_answer_index],
    answeredCheckpoints,
    totalCheckpoints,
    allCompleted,
    canRetry: false,
    gameId: player.game_id,
  });
}
