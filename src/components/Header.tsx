import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-blue-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
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
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-brand"
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
