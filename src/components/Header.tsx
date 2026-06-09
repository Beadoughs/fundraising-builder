import { signOutAction } from "@/app/actions/auth";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-blue-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-3">
          <Image
            src="/beadoughs-logo.png"
            alt="Beadoughs"
            width={140}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <nav className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-brand"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/payouts"
                className="text-sm font-medium text-gray-600 hover:text-brand"
              >
                Payouts
              </Link>
              <Link
                href="/dashboard/campaigns/new"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                New fundraiser
              </Link>
              <span className="hidden text-sm text-gray-400 sm:inline">
                {session.user.email}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
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
