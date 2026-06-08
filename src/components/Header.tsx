import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm text-white">
            FR
          </span>
          FundraiseOS
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/campaigns/new"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            New fundraiser
          </Link>
        </nav>
      </div>
    </header>
  );
}
