import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// O proxy só precisa validar o JWT da sessão: usa a configuração LEVE (sem Prisma, bcrypt
// ou Redis). Importar o `auth` completo aqui deixava o cold start de toda página lento.
const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/historico",
  "/rank",
  "/programas",
  "/nutricao",
  "/conquistas",
  "/calendario",
  "/configuracoes",
  "/exercicios",
];

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const isProtected = PROTECTED_PREFIXES.some((p) =>
    req.nextUrl.pathname.startsWith(p),
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/historico/:path*",
    "/rank/:path*",
    "/programas/:path*",
    "/nutricao/:path*",
    "/conquistas/:path*",
    "/calendario/:path*",
    "/configuracoes/:path*",
    "/exercicios/:path*",
  ],
};
