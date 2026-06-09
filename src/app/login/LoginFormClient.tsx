"use client";

import { Button } from "@/components/ui/Button";
import { FieldGroup, Label } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

type Mode = "signin" | "signup";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(
          result.error === "Configuration"
            ? "Sign-in is not set up on this server. If you are the organiser, check AUTH_SECRET is set and restart the app."
            : "Invalid email or password. Please try again."
        );
      } else if (result?.ok) {
        window.location.href = callbackUrl;
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Could not create account. Please try again.");
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setMode("signin");
        setError("Account created. Please sign in with your new password.");
      } else if (result?.ok) {
        window.location.href = callbackUrl;
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
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {mode === "signin"
            ? "Sign in with your email and password to manage your fundraising campaigns."
            : "Create an organiser account to start building fundraising campaigns."}
        </p>

        <div className="mt-6 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Create account
          </button>
        </div>

        <form
          onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
          className="mt-8"
        >
          {mode === "signup" && (
            <FieldGroup>
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                type="text"
                required
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FieldGroup>
          )}

          <FieldGroup>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@school.edu.au"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldGroup>

          <FieldGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signup" ? "At least 8 characters" : ""}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldGroup>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
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
