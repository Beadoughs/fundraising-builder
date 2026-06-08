import { Header } from "@/components/Header";
import { DevMagicLinkBanner } from "@/components/DevMagicLinkBanner";
import { isDevMagicLinkEnabled } from "@/lib/dev-magic-link";
import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const showDevLink = isDevMagicLinkEnabled() && email;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="mx-auto w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✉️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          {showDevLink ? (
            <>
              <p className="mt-3 text-gray-600">
                Dev mode for <strong>{email}</strong> — use the button below to
                sign in instantly.
              </p>
              <DevMagicLinkBanner email={email} />
            </>
          ) : (
            <p className="mt-3 text-gray-600">
              We sent a sign-in link to{" "}
              <strong>{email || "your email"}</strong>. Click the link in your
              email to access your dashboard.
            </p>
          )}
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
          >
            Use a different email
          </Link>
        </div>
      </main>
    </div>
  );
}
