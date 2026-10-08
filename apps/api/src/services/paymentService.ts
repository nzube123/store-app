import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: { status: string; reference: string; amount: number; currency: string; customer: { email: string } };
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!env.paystackSecretKey) throw new AppError('Payments are not configured yet. Please try again later.', 503, 'PAYMENTS_UNAVAILABLE');
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.paystackSecretKey}`, 'Content-Type': 'application/json', ...init?.headers },
  });
  const body: unknown = await response.json();
  if (!response.ok) throw new AppError('The payment provider could not process this request.', 502, 'PAYMENT_PROVIDER_ERROR');
  return body as T;
}

export async function initializePayment(input: { email: string; amountKobo: number; reference: string; orderId: string }) {
  const result = await paystackRequest<PaystackInitializeResponse>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: 'NGN',
      reference: input.reference,
      callback_url: `${env.frontendUrl}/payment/return`,
      metadata: { orderId: input.orderId, cancel_action: `${env.frontendUrl}/cart` },
    }),
  });
  if (!result.status || !result.data) throw new AppError('Could not start your payment. Please try again.', 502, 'PAYMENT_INITIALIZATION_FAILED');
  return { authorizationUrl: result.data.authorization_url, reference: result.data.reference };
}

export async function verifyPayment(reference: string) {
  const result = await paystackRequest<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!result.status || !result.data) throw new AppError('Could not verify this payment.', 502, 'PAYMENT_VERIFICATION_FAILED');
  return result.data;
}
