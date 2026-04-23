import { NextRequest, NextResponse } from "next/server";

const SESSION_TOKEN = "ns-valid-session-2026";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/debug-env",
  "/_next",
  "/favicon.ico",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("ns-auth")?.value;
  if (token !== SESSION_TOKEN) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
