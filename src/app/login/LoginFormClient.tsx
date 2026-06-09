"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, Label } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(
          result.error === "Configuration"
            ? "Sign-in is not set up on this server. If you are the organiser, check AUTH_SECRET is set and restart the app."
            : "Could not send login link. Please try again."
        );
      } else if (result?.ok) {
        window.location.href = `/login/verify?email=${encodeURIComponent(email)}`;
      } else {
        setError("Could not send login link. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Sign in or create account</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a magic link. New organisers are
          registered automatically — no password needed.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <FieldGroup>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@school.edu.au"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldGroup>

          {error && (
            <p className="mb-4 text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          By signing in you agree to use this tool for legitimate fundraising
          campaigns.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/" className="hover:text-brand">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

export default function LoginFormClient() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
