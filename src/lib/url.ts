export function getAppBaseUrl(requestOrigin?: string): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    requestOrigin ||
    "http://localhost:3000"
  );
}

export function getPublicCampaignUrl(slug: string): string {
  return `${getAppBaseUrl()}/c/${slug}`;
}
