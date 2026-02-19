import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const sessionToken = searchParams.get("session");

  if (!token) {
    return NextResponse.json({ error: "Chybí QR token" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Find checkpoint by QR token
  const { data: checkpoint, error: cpError } = await supabase
    .from("checkpoints")
    .select("*, games(*)")
    .eq("qr_token", token)
    .single();

  if (cpError || !checkpoint) {
    return NextResponse.json(
      { error: "Neplatný QR kód" },
      { status: 404 }
    );
  }

  const game = checkpoint.games;

  if (!game.is_active) {
    return NextResponse.json(
      { error: "Tato hra není momentálně aktivní" },
      { status: 403 }
    );
  }

  // If no session token → new player, needs registration
  if (!sessionToken) {
    return NextResponse.json({
      action: "register",
      gameId: game.id,
      gameName: game.name,
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.name,
    });
  }

  // Find existing player by session token
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("session_token", sessionToken)
    .eq("game_id", game.id)
    .single();

  if (!player) {
    return NextResponse.json({
      action: "register",
      gameId: game.id,
      gameName: game.name,
      checkpointId: checkpoint.id,
      checkpointName: checkpoint.name,
    });
  }

  // Check if already completed the game
  if (player.completion_code) {
    return NextResponse.json({
      action: "completed",
      gameId: game.id,
      completionCode: player.completion_code,
    });
  }

  // Check if already answered this checkpoint
  const { data: existingAnswer } = await supabase
    .from("player_checkpoints")
    .select("*")
    .eq("player_id", player.id)
    .eq("checkpoint_id", checkpoint.id)
    .single();

  if (existingAnswer) {
    return NextResponse.json({
      action: "already_answered",
      gameId: game.id,
      checkpointName: checkpoint.name,
      answeredCorrectly: existingAnswer.answered_correctly,
    });
  }

  // Show the question
  return NextResponse.json({
    action: "question",
    gameId: game.id,
    checkpointId: checkpoint.id,
    checkpointName: checkpoint.name,
    question: checkpoint.question,
    answers: checkpoint.answers,
  });
}
