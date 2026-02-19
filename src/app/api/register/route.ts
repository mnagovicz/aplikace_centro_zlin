import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateSessionToken } from "@/lib/nanoid";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { gameId, name, email, gdprConsent, marketingConsent } = body;

  if (!gameId || !name || !email || !gdprConsent) {
    return NextResponse.json(
      { error: "Vyplňte všechna povinná pole a odsouhlaste GDPR" },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Neplatný formát e-mailu" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Check game exists and is active
  const { data: game } = await supabase
    .from("games")
    .select("id, is_active")
    .eq("id", gameId)
    .single();

  if (!game || !game.is_active) {
    return NextResponse.json(
      { error: "Hra není dostupná" },
      { status: 404 }
    );
  }

  // Check if player with same email already exists for this game
  const { data: existingPlayer } = await supabase
    .from("players")
    .select("session_token")
    .eq("game_id", gameId)
    .eq("email", email)
    .single();

  if (existingPlayer) {
    return NextResponse.json({
      sessionToken: existingPlayer.session_token,
      message: "Vítejte zpět! Pokračujte ve hře.",
    });
  }

  const sessionToken = generateSessionToken();

  const { error } = await supabase.from("players").insert({
    game_id: gameId,
    name,
    email,
    session_token: sessionToken,
    gdpr_consent: gdprConsent,
    marketing_consent: marketingConsent || false,
  });

  if (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registrace selhala. Zkuste to prosím znovu." },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionToken });
}
