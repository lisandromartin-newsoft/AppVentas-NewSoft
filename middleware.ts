export { default } from "next-auth/middleware";

export const config = {
  // Protege todas las rutas excepto /login y los callbacks de NextAuth
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
