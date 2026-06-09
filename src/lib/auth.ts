import { saveDevMagicLink } from "@/lib/dev-magic-link";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/db";

function createEmailProvider(): Provider {
  return {
    id: "email",
    type: "email",
    name: "Email",
    from:
      process.env.EMAIL_FROM ||
      "Beadoughs <onboarding@resend.dev>",
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest({ identifier: email, url }) {
      saveDevMagicLink(email, url);

      if (!process.env.RESEND_API_KEY) {
        console.log("\n========================================");
        console.log(`Magic login link for ${email}:`);
        console.log(url);
        console.log("========================================\n");
        return;
      }

      const { Resend: ResendClient } = await import("resend");
      const resend = new ResendClient(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:
          process.env.EMAIL_FROM ||
          "Beadoughs <onboarding@resend.dev>",
        to: email,
        subject: "Sign in to Beadoughs",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#00337C">Sign in to Beadoughs</h2>
            <p>Click the button below to sign in. This link expires in 24 hours.</p>
            <a href="${url}" style="display:inline-block;background:#00337C;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Sign in</a>
            <p style="color:#666;font-size:13px">If you didn't request this, you can ignore this email.</p>
          </div>
        `,
      });
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  providers: [createEmailProvider()],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
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
