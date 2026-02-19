import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();

  const { data: games, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ games });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, rewardDescription } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Název hry je povinný" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: game, error } = await supabase
    .from("games")
    .insert({
      name,
      description: description || null,
      reward_description: rewardDescription || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ game }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, description, rewardDescription, isActive } = body;

  if (!id) {
    return NextResponse.json({ error: "Chybí ID hry" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (rewardDescription !== undefined)
    updates.reward_description = rewardDescription;
  if (isActive !== undefined) updates.is_active = isActive;

  const { data: game, error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ game });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Chybí ID hry" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
