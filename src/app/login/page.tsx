import { Header } from "@/components/Header";
import LoginFormClient from "./LoginFormClient";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <LoginFormClient />
      </main>
    </div>
  );
}
