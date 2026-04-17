export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "NO DEFINIDA";
  return NextResponse.json({
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_STARTS_WITH: dbUrl.substring(0, 15),
    DATABASE_URL_LENGTH: dbUrl.length,
    DIRECT_URL_EXISTS: !!process.env.DIRECT_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
