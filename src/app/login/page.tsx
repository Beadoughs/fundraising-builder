import { Header } from "@/components/Header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginFormClient from "./LoginFormClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session?.user) {
    redirect(callbackUrl || "/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <LoginFormClient />
      </main>
    </div>
  );
}
