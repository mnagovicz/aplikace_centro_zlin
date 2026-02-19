import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateQrToken } from "@/lib/nanoid";
import { generateQrDataUrl, generateQrZip } from "@/lib/qr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json(
      { error: "Chybí ID hry" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: checkpoints, error } = await supabase
    .from("checkpoints")
    .select("*")
    .eq("game_id", gameId)
    .order("order_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkpoints });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gameId, name, question, answers, correctAnswerIndex, orderNumber } =
    body;

  if (!gameId || !name || !question || !answers || correctAnswerIndex === undefined) {
    return NextResponse.json(
      { error: "Vyplňte všechna povinná pole" },
      { status: 400 }
    );
  }

  if (!Array.isArray(answers) || answers.length < 2) {
    return NextResponse.json(
      { error: "Zadejte alespoň 2 odpovědi" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const qrToken = generateQrToken();

  const { data: checkpoint, error } = await supabase
    .from("checkpoints")
    .insert({
      game_id: gameId,
      name,
      question,
      answers,
      correct_answer_index: correctAnswerIndex,
      order_number: orderNumber || 0,
      qr_token: qrToken,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkpoint }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, question, answers, correctAnswerIndex, orderNumber } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Chybí ID stanoviště" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (question !== undefined) updates.question = question;
  if (answers !== undefined) updates.answers = answers;
  if (correctAnswerIndex !== undefined)
    updates.correct_answer_index = correctAnswerIndex;
  if (orderNumber !== undefined) updates.order_number = orderNumber;

  const { data: checkpoint, error } = await supabase
    .from("checkpoints")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkpoint });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Chybí ID stanoviště" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("checkpoints").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/** Generate QR code for a single checkpoint */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { action, checkpointId, gameId } = body;

  const supabase = createServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (action === "qr-single" && checkpointId) {
    const { data: checkpoint } = await supabase
      .from("checkpoints")
      .select("qr_token, name")
      .eq("id", checkpointId)
      .single();

    if (!checkpoint) {
      return NextResponse.json(
        { error: "Stanoviště nenalezeno" },
        { status: 404 }
      );
    }

    const url = `${appUrl}/game/${gameId || ""}/scan/${checkpoint.qr_token}`;
    const qrDataUrl = await generateQrDataUrl(url);

    return NextResponse.json({ qrDataUrl, url });
  }

  if (action === "qr-zip" && gameId) {
    const { data: checkpoints } = await supabase
      .from("checkpoints")
      .select("qr_token, name, order_number")
      .eq("game_id", gameId)
      .order("order_number", { ascending: true });

    if (!checkpoints || checkpoints.length === 0) {
      return NextResponse.json(
        { error: "Žádná stanoviště" },
        { status: 404 }
      );
    }

    const items = checkpoints.map((cp, i) => ({
      filename: `${String(i + 1).padStart(2, "0")}_${cp.name.replace(/[^a-zA-Z0-9čďěňřšťůýžČĎĚŇŘŠŤŮÝŽ ]/g, "_")}.png`,
      url: `${appUrl}/game/${gameId}/scan/${cp.qr_token}`,
    }));

    const zipBuffer = await generateQrZip(items);

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="qr-codes-${gameId}.zip"`,
      },
    });
  }

  return NextResponse.json({ error: "Neplatná akce" }, { status: 400 });
}
