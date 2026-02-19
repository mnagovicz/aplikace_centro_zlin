import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionToken = searchParams.get("session");
  const gameId = searchParams.get("gameId");

  if (!sessionToken || !gameId) {
    return NextResponse.json(
      { error: "Chybí parametry" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Get player
  const { data: player } = await supabase
    .from("players")
    .select("id, completion_code")
    .eq("session_token", sessionToken)
    .eq("game_id", gameId)
    .single();

  if (!player) {
    return NextResponse.json(
      { error: "Hráč nenalezen" },
      { status: 404 }
    );
  }

  // Get all checkpoints for this game
  const { data: checkpoints } = await supabase
    .from("checkpoints")
    .select("id, name, order_number")
    .eq("game_id", gameId)
    .order("order_number", { ascending: true });

  // Get player's answered checkpoints
  const { data: playerCheckpoints } = await supabase
    .from("player_checkpoints")
    .select("checkpoint_id, answered_correctly")
    .eq("player_id", player.id);

  const answeredMap = new Map(
    (playerCheckpoints || []).map((pc) => [pc.checkpoint_id, pc.answered_correctly])
  );

  const statuses = (checkpoints || []).map((cp) => ({
    id: cp.id,
    name: cp.name,
    answered: answeredMap.has(cp.id),
    answeredCorrectly: answeredMap.get(cp.id) ?? undefined,
  }));

  return NextResponse.json({
    checkpoints: statuses,
    completionCode: player.completion_code,
  });
}
