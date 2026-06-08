import { Header } from "@/components/Header";
import Link from "next/link";

const MESSAGES: Record<string, string> = {
  Verification:
    "This sign-in link is invalid or has already been used. Go back and request a fresh one.",
  Configuration:
    process.env.NODE_ENV === "development"
      ? "Sign-in failed — usually the magic link was incomplete, already used, or the dev server restarted. Request a new link and click Sign in now on the next screen."
      : "Sign-in is not configured correctly. Contact support.",
  AccessDenied: "You do not have access to sign in.",
  Default: "Something went wrong during sign-in. Please try again.",
};

export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = MESSAGES[error || ""] || MESSAGES.Default;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-md rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Sign-in failed</h1>
          <p className="mt-3 text-gray-600">{message}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Try again
          </Link>
        </div>
      </main>
    </div>
  );
}
