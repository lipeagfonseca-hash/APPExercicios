// ============================================================================
// CONFIGURAÇÃO LEVE DO AUTH (sem banco, sem bcrypt, sem Redis)
// ----------------------------------------------------------------------------
// Tudo que é necessário para LER e VALIDAR a sessão (um JWT assinado). O proxy.ts
// usa só este arquivo: assim, a cada navegação ele não precisa carregar o Prisma,
// o bcrypt nem o cliente do Redis, que só servem para o login. Isso encurta o
// cold start de toda página protegida.
//
// O login em si (provedor de credenciais) fica em src/lib/auth.ts.
// ============================================================================

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // o provedor de credenciais é acrescentado em auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
