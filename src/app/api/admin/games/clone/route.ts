import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateQrToken } from "@/lib/nanoid";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gameId } = body;

  if (!gameId) {
    return NextResponse.json({ error: "Chybí ID hry" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Get original game
  const { data: original, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (gameError || !original) {
    return NextResponse.json({ error: "Hra nenalezena" }, { status: 404 });
  }

  // Create cloned game (inactive, with "Kopie" prefix)
  const { data: newGame, error: createError } = await supabase
    .from("games")
    .insert({
      name: `${original.name} (kopie)`,
      description: original.description,
      reward_description: original.reward_description,
      is_active: false,
    })
    .select()
    .single();

  if (createError || !newGame) {
    return NextResponse.json({ error: "Nepodařilo se vytvořit kopii hry" }, { status: 500 });
  }

  // Get original checkpoints
  const { data: checkpoints } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("game_id", gameId)
    .order("order_number", { ascending: true });

  // Clone checkpoints with new QR tokens
  if (checkpoints && checkpoints.length > 0) {
    const newCheckpoints = checkpoints.map((cp) => ({
      game_id: newGame.id,
      name: cp.name,
      question: cp.question,
      answers: cp.answers,
      correct_answer_index: cp.correct_answer_index,
      order_number: cp.order_number,
      qr_token: generateQrToken(),
    }));

    const { error: cpError } = await supabase
      .from("checkpoints")
      .insert(newCheckpoints);

    if (cpError) {
      console.error("Clone checkpoints error:", cpError);
    }
  }

  return NextResponse.json({ game: newGame }, { status: 201 });
}
