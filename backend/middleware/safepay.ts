import crypto from "crypto";

// Built directly against the official Node SDK's source (getsafepay/safepay-node)
// rather than a guess — verified: src/resources/payments.ts (order creation),
// src/utils/builder.ts + constants.ts (checkout URL), src/resources/verify.ts
// (webhook signature). Implemented by hand (no SDK dependency) since we only
// need these three operations.

type SafepayEnvironment = "sandbox" | "production";

const API_URL: Record<SafepayEnvironment, string> = {
  sandbox: "https://sandbox.api.getsafepay.com",
  production: "https://api.getsafepay.com",
};

const CHECKOUT_URL: Record<SafepayEnvironment, string> = {
  sandbox: "https://sandbox.api.getsafepay.com/checkout",
  production: "https://getsafepay.com/checkout",
};

function getEnvironment(): SafepayEnvironment {
  return process.env.SAFEPAY_ENVIRONMENT === "production" ? "production" : "sandbox";
}

// Amount is charged in whole rupees, NOT paisas — confirmed by a live test
// transaction (a Rs. 1,500 bill was charged as Rs. 150,000 when this sent
// amountInRupees * 100, so Safepay's PKR amount field wants the plain value).
export async function createSafepayOrder(input: {
  amountInRupees: number;
  currency: "PKR";
  orderId: string;
}): Promise<{ token: string }> {
  const environment = getEnvironment();

  const response = await fetch(`${API_URL[environment]}/order/v1/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(input.amountInRupees),
      client: process.env.SAFEPAY_PUBLIC_KEY,
      currency: input.currency,
      environment,
      metadata: { order_id: input.orderId },
    }),
  });

  const body = (await response.json().catch(() => null)) as { data?: { token?: string } } | null;
  const token = body?.data?.token;

  if (!response.ok || !token) {
    throw new Error(`Safepay order creation failed: ${response.status} ${JSON.stringify(body)}`);
  }

  return { token };
}

export function buildSafepayCheckoutUrl(input: {
  token: string;
  orderId: string;
  redirectUrl: string;
  cancelUrl: string;
}): string {
  const environment = getEnvironment();

  const params = new URLSearchParams({
    beacon: input.token,
    cancel_url: input.cancelUrl,
    env: environment,
    order_id: input.orderId,
    redirect_url: input.redirectUrl,
    source: "custom",
    webhooks: "true",
  });

  return `${CHECKOUT_URL[environment]}/pay?${params.toString()}`;
}

// Mirrors Verify.webhook() in the official SDK exactly: HMAC-SHA512 over
// JSON.stringify(body.data) using the webhook-specific secret (registered
// separately in the Safepay dashboard — NOT the same as SAFEPAY_SECRET_KEY).
export function verifySafepayWebhookSignature(bodyData: unknown, signatureHeader: string | undefined): boolean {
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signatureHeader) return false;

  const expected = crypto
    .createHmac("sha512", webhookSecret)
    .update(Buffer.from(JSON.stringify(bodyData)))
    .digest("hex");

  // Constant-time compare — both must be equal length for timingSafeEqual.
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
