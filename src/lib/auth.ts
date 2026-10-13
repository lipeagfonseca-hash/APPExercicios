import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";

// bcrypt, banco e Redis só são necessários no LOGIN. Carregá-los de forma preguiçosa
// (dentro do authorize) tira esse peso do cold start de todas as outras funções que
// apenas leem a sessão com `auth()`.
let hashFalso: string | null = null;

// Revogação: a sessão (JWT) sozinha vale até expirar. Aqui conferimos no banco, no máximo a
// cada 5 minutos por usuário em cada instância, se a conta ainda existe e está ativa.
const VALIDADE_DA_CONFERENCIA_MS = 5 * 60_000;
let verificador: ((id: string) => Promise<boolean>) | null = null;

async function usuarioAtivo(id: string) {
  if (!verificador) {
    const [{ prisma }, { criarVerificadorDeUsuario }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/verificadorDeUsuario"),
    ]);
    verificador = criarVerificadorDeUsuario(
      (userId) => prisma.user.findUnique({ where: { id: userId }, select: { desativadoEm: true } }),
      VALIDADE_DA_CONFERENCIA_MS,
    );
  }
  return verificador(id);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      const token = authConfig.callbacks.jwt(params);
      // Devolver null encerra a sessão (conta apagada ou desativada).
      if (token.id && !(await usuarioAtivo(token.id as string))) return null;
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [{ default: bcrypt }, { prisma }, { clientIp, rateLimit }] = await Promise.all([
          import("bcryptjs"),
          import("@/lib/prisma"),
          import("@/lib/rateLimit"),
        ]);

        const ip = clientIp(request.headers);
        const byIp = await rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
        const byAccount = await rateLimit(`login:acct:${email.toLowerCase()}`, 8, 15 * 60_000);
        if (!byIp.ok || !byAccount.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Sempre roda o bcrypt, mesmo sem usuário, para o tempo de resposta não revelar se o email existe.
        hashFalso ??= bcrypt.hashSync("dummy-password-for-timing", 10);
        const valid = await bcrypt.compare(password, user?.password ?? hashFalso);
        if (!user || !valid || user.desativadoEm) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
