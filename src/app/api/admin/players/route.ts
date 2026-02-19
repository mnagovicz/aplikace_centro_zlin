import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  const format = searchParams.get("format");

  if (!gameId) {
    return NextResponse.json(
      { error: "Chybí ID hry" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: players, error } = await supabase
    .from("players")
    .select("*, player_checkpoints(checkpoint_id, answered_correctly)")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get total checkpoints for this game
  const { count: totalCheckpoints } = await supabase
    .from("checkpoints")
    .select("*", { count: "exact", head: true })
    .eq("game_id", gameId);

  if (format === "csv") {
    const csvHeader =
      "Jméno,Email,Registrace,Splněno stanovišť,Dokončeno,Kód odměny,Marketing souhlas\n";
    const csvRows = (players || [])
      .map((p) => {
        const answered = p.player_checkpoints?.length || 0;
        return [
          `"${p.name}"`,
          `"${p.email}"`,
          new Date(p.created_at).toLocaleString("cs-CZ"),
          `${answered}/${totalCheckpoints || 0}`,
          p.completed_at
            ? new Date(p.completed_at).toLocaleString("cs-CZ")
            : "Ne",
          p.completion_code || "-",
          p.marketing_consent ? "Ano" : "Ne",
        ].join(",");
      })
      .join("\n");

    return new NextResponse(csvHeader + csvRows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="players-${gameId}.csv"`,
      },
    });
  }

  return NextResponse.json({
    players: players || [],
    totalCheckpoints: totalCheckpoints || 0,
  });
}
