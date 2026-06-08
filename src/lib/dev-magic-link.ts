type DevLinkEntry = { url: string; createdAt: number };

const globalStore = globalThis as typeof globalThis & {
  __devMagicLinks?: Map<string, DevLinkEntry>;
};

function getStore(): Map<string, DevLinkEntry> {
  if (!globalStore.__devMagicLinks) {
    globalStore.__devMagicLinks = new Map();
  }
  return globalStore.__devMagicLinks;
}

export function saveDevMagicLink(email: string, url: string): void {
  getStore().set(email.toLowerCase().trim(), {
    url,
    createdAt: Date.now(),
  });
}

export function getDevMagicLink(email: string): string | null {
  const entry = getStore().get(email.toLowerCase().trim());
  if (!entry) return null;

  const maxAgeMs = 24 * 60 * 60 * 1000;
  if (Date.now() - entry.createdAt > maxAgeMs) {
    getStore().delete(email.toLowerCase().trim());
    return null;
  }

  return entry.url;
}

export function isDevMagicLinkEnabled(): boolean {
  return process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY;
}
