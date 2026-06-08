import { signOutAction } from "@/app/actions/auth";
import Link from "next/link";

export function Header({
  user,
}: {
  user?: { email?: string | null } | null;
}) {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm text-white">
            FB
          </span>
          Fundraising Builder
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/campaigns/new"
                className="hidden rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark sm:inline-flex"
              >
                New fundraiser
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
