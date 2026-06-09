import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/db";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          onboardingComplete: user.onboardingComplete,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login/error",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = user.onboardingComplete;
        token.name = user.name;
      }
      if (trigger === "update" && session?.user) {
        if (session.user.onboardingComplete !== undefined) {
          token.onboardingComplete = session.user.onboardingComplete;
        }
        if (session.user.name !== undefined) {
          token.name = session.user.name;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string | null) ?? null;
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
      }
      return session;
    },
  },
});
