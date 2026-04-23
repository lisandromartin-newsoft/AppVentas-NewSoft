export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const VALID_EMAIL = "roldan@newsoft.mx";
const VALID_PASSWORD = "newsoft2026";
const SESSION_TOKEN = "ns-valid-session-2026";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (
    email?.toLowerCase().trim() !== VALID_EMAIL ||
    password !== VALID_PASSWORD
  ) {
    return NextResponse.json(
      { error: "Credenciales incorrectas" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ns-auth", SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: "/",
  });
  return res;
}
