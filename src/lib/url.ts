export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  );
}

export function getPublicCampaignUrl(slug: string): string {
  return `${getAppBaseUrl()}/c/${slug}`;
}
