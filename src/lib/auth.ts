import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const ip = clientIp(request.headers);
        const byIp = await rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
        const byAccount = await rateLimit(`login:acct:${email.toLowerCase()}`, 8, 15 * 60_000);
        if (!byIp.ok || !byAccount.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Always run bcrypt so response time doesn't reveal whether the email exists.
        const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
        if (!user || !valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
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
});
