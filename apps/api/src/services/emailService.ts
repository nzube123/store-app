import Mailgun from 'mailgun.js';
import formData from 'form-data';
import type { OrderDto, UserDto } from '@shop/shared';
import { CURRENCY, STORE_NAME } from '@shop/shared';
import { env } from '../config/env.js';

const MailgunClient = Mailgun as unknown as new (FormData: typeof formData) => {
  client: (options: { username: string; key: string }) => {
    messages: {
      create: (domain: string, payload: Record<string, unknown>) => Promise<unknown>;
    };
  };
};

const currency = new Intl.NumberFormat('en-NG', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 });
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);

export async function sendOrderConfirmation(user: UserDto, order: OrderDto): Promise<boolean> {
  if (!env.mailgunApiKey || !env.mailgunDomain || !env.mailgunFrom) {
    console.warn('Order email skipped: Mailgun credentials are not configured.');
    return false;
  }
  const mailgun = new MailgunClient(formData);
  const client = mailgun.client({ username: 'api', key: env.mailgunApiKey });
  const rows = order.items.map((item) => `<tr><td style="padding:10px 0">${escapeHtml(item.productName)} × ${item.quantity}<br><span style="font-size:12px;color:#777">${currency.format(item.unitPrice)} each</span></td><td style="padding:10px 0;text-align:right">${currency.format(item.subtotal)}</td></tr>`).join('');
  const date = new Intl.DateTimeFormat('en-NG', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Lagos' }).format(new Date(order.createdAt));
  await client.messages.create(env.mailgunDomain, {
    from: env.mailgunFrom,
    to: [user.email],
    subject: `Order ${order.id.slice(-8).toUpperCase()} confirmed — ${STORE_NAME}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#28352c"><p style="letter-spacing:3px;color:#79846c">${STORE_NAME.toUpperCase()}</p><h1>Thank you, ${escapeHtml(user.name)}.</h1><p>Your order is confirmed. Here is everything you need to know.</p><p><strong>Order number:</strong> ${escapeHtml(order.id)}<br><strong>Date:</strong> ${escapeHtml(date)}<br><strong>Payment status:</strong> ${escapeHtml(order.paymentStatus)}<br><strong>Order status:</strong> ${escapeHtml(order.status)}</p><table style="width:100%;border-collapse:collapse">${rows}<tr><td style="padding:14px 0;border-top:1px solid #ddd"><strong>Total paid</strong></td><td style="padding:14px 0;border-top:1px solid #ddd;text-align:right"><strong>${currency.format(order.total)}</strong></td></tr></table><p>We are grateful you chose thoughtful things made to last.</p></div>`,
  });
  return true;
}
