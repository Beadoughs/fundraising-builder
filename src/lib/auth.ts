import { saveDevMagicLink } from "@/lib/dev-magic-link";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Resend({
      from: process.env.EMAIL_FROM || "Fundraising Builder <onboarding@resend.dev>",
      sendVerificationRequest: async ({ identifier: email, url }) => {
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
            "Fundraising Builder <onboarding@resend.dev>",
          to: email,
          subject: "Sign in to Fundraising Builder",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#E8590C">Sign in to Fundraising Builder</h2>
              <p>Click the button below to sign in. This link expires in 24 hours.</p>
              <a href="${url}" style="display:inline-block;background:#E8590C;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Sign in</a>
              <p style="color:#666;font-size:13px">If you didn't request this, you can ignore this email.</p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
