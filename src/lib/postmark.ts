const POSTMARK_API_URL = "https://api.postmarkapp.com/email";

export function isPostmarkConfigured(): boolean {
  return Boolean(process.env.POSTMARK_SERVER_TOKEN);
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "Beadoughs <noreply@example.com>";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<void> {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    throw new Error("POSTMARK_SERVER_TOKEN is not set");
  }

  const response = await fetch(POSTMARK_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": token,
    },
    body: JSON.stringify({
      From: params.from ?? getEmailFrom(),
      To: params.to,
      Subject: params.subject,
      HtmlBody: params.html,
      MessageStream: "outbound",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Postmark API error (${response.status}): ${body}`);
  }
}
