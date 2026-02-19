import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code } = body;

  if (!code) {
    return NextResponse.json(
      { error: "Zadejte kód" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: player, error } = await supabase
    .from("players")
    .select("*, games(name, reward_description)")
    .eq("completion_code", code.toUpperCase().trim())
    .single();

  if (error || !player) {
    return NextResponse.json(
      { error: "Neplatný kód" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    playerName: player.name,
    playerEmail: player.email,
    gameName: player.games.name,
    rewardDescription: player.games.reward_description,
    completedAt: player.completed_at,
  });
}
