import { Resend } from "resend";
import { formatCurrency } from "./utils";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendOrderReceipt(params: {
  to: string;
  customerName: string;
  campaignName: string;
  orgName: string;
  orderId: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}) {
  const { to, customerName, campaignName, orgName, orderId, total, items } =
    params;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#333">
      <h1 style="color:#E8590C;font-size:24px">Thank you for your order!</h1>
      <p>Hi ${customerName},</p>
      <p>Your order for <strong>${campaignName}</strong> (${orgName}) has been confirmed.</p>
      <p style="color:#666;font-size:14px">Order #${orderId.slice(-8).toUpperCase()}</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <thead>
          <tr style="border-bottom:2px solid #eee">
            <th style="text-align:left;padding:8px 0">Item</th>
            <th style="text-align:center;padding:8px 0">Qty</th>
            <th style="text-align:right;padding:8px 0">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 0;font-weight:bold">Total paid</td>
            <td style="padding:12px 0;font-weight:bold;text-align:right;color:#E8590C">${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="color:#666;font-size:14px">Questions? Contact ${orgName} directly.</p>
    </div>
  `;

  if (!resend) {
    console.log(`[DEV] Order receipt for ${to}:\n`, html);
    return { success: true, dev: true };
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "Fundraising Builder <onboarding@resend.dev>",
    to,
    subject: `Order confirmed — ${campaignName}`,
    html,
  });

  return { success: true };
}
