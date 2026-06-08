"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function DevMagicLinkBanner({ email }: { email: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLink(attempt = 0) {
      try {
        const res = await fetch(
          `/api/auth/dev-link?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        if (!cancelled && data.url) {
          setUrl(data.url);
          setLoading(false);
          return;
        }
      } catch {
        /* retry */
      }

      if (!cancelled && attempt < 8) {
        setTimeout(() => fetchLink(attempt + 1), 400);
      } else if (!cancelled) {
        setLoading(false);
      }
    }

    fetchLink();
    return () => {
      cancelled = true;
    };
  }, [email]);

  if (loading && !url) {
    return (
      <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Preparing your sign-in link…
      </p>
    );
  }

  if (!url) {
    return (
      <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Sign-in link not found. Go back and request a new one.
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
      <p className="text-sm font-medium text-amber-900">Dev mode — click to sign in</p>
      <p className="mt-1 text-xs text-amber-800">
        No email was sent. Use the button below (valid for 24 hours).
      </p>
      <a
        href={url}
        className={cn(
          "mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
        )}
      >
        Sign in now
      </a>
      <p className="mt-3 break-all text-xs text-amber-700">{url}</p>
    </div>
  );
}
