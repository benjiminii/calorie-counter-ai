/**
 * Thin QPay V2 merchant client.
 *
 * Based on the official spec at https://developer.qpay.mn/.
 * All credentials (QPAY_USERNAME / QPAY_PASSWORD / QPAY_INVOICE_CODE /
 * QPAY_BASE_URL) must be set on the Convex deployment:
 *
 *   npx convex env set QPAY_BASE_URL https://merchant-sandbox.qpay.mn
 *   npx convex env set QPAY_USERNAME ...
 *   npx convex env set QPAY_PASSWORD ...
 *   npx convex env set QPAY_INVOICE_CODE ...
 *
 * Nothing in this file is exported as a Convex action / mutation / query — it
 * is pure helpers imported by `convex/subscriptions.ts`.
 */

export type QPayDeepLink = {
  name: string;
  description: string;
  link: string;
};

export type QPayInvoiceResponse = {
  invoice_id: string;
  qr_text: string;
  qr_image: string; // raw base64 PNG (no data: prefix)
  urls: QPayDeepLink[];
};

export type QPayPaymentRow = {
  payment_id: string;
  payment_status: 'NEW' | 'FAILED' | 'PAID' | 'REFUNDED';
  payment_date: string;
  payment_fee: string | number;
  payment_amount: string | number;
  payment_currency: string;
  payment_wallet?: string;
  transaction_type?: string;
};

export type QPayPaymentCheckResponse = {
  count: number;
  paid_amount: number;
  rows: QPayPaymentRow[];
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  // ms since epoch at which the access token expires
  accessExpiresAt: number;
};

// In-memory per-instance cache. Convex may spawn multiple isolates, so each
// will fetch its own token the first time it's used. Fine — QPay allows it.
let cached: TokenPair | null = null;

function config() {
  const baseUrl = process.env.QPAY_BASE_URL;
  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;
  const invoiceCode = process.env.QPAY_INVOICE_CODE;
  if (!baseUrl || !username || !password || !invoiceCode) {
    throw new Error(
      'QPay env not configured. Set QPAY_BASE_URL, QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE on the Convex deployment.'
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), username, password, invoiceCode };
}

function base64(input: string): string {
  // Convex default runtime is V8 with btoa available.
  // eslint-disable-next-line no-undef
  return typeof btoa === 'function' ? btoa(input) : Buffer.from(input).toString('base64');
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`QPay ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`QPay returned non-JSON body (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function fetchNewToken(): Promise<TokenPair> {
  const { baseUrl, username, password } = config();
  const res = await fetch(`${baseUrl}/v2/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${base64(`${username}:${password}`)}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  const data = await readJson<{
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    refresh_expires_in?: number;
  }>(res);
  if (!data.access_token || !data.refresh_token) {
    throw new Error('QPay /v2/auth/token: missing tokens in response');
  }
  // `expires_in` from QPay is a unix timestamp (seconds since epoch), not a
  // relative TTL. Fall back to 50min if missing.
  const expiresAtMs = data.expires_in
    ? data.expires_in * 1000
    : Date.now() + 50 * 60 * 1000;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessExpiresAt: expiresAtMs,
  };
}

async function refreshToken(current: TokenPair): Promise<TokenPair> {
  const { baseUrl } = config();
  const res = await fetch(`${baseUrl}/v2/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${current.refreshToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!res.ok) {
    // Any failure falls back to a full re-auth. This handles revoked refresh
    // tokens, clock skew, etc.
    return fetchNewToken();
  }
  const data = await readJson<{
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  }>(res);
  const expiresAtMs = data.expires_in
    ? data.expires_in * 1000
    : Date.now() + 50 * 60 * 1000;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? current.refreshToken,
    accessExpiresAt: expiresAtMs,
  };
}

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  const skewMs = 60_000;
  if (cached && cached.accessExpiresAt - skewMs > now) {
    return cached.accessToken;
  }
  cached = cached ? await refreshToken(cached) : await fetchNewToken();
  return cached.accessToken;
}

async function authed<T>(
  path: string,
  init: RequestInit & { retried?: boolean } = {}
): Promise<T> {
  const { baseUrl } = config();
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  // If the token was just rotated on QPay's side we'll see a 401. Drop the
  // cache and retry exactly once.
  if (res.status === 401 && !init.retried) {
    cached = null;
    return authed<T>(path, { ...init, retried: true });
  }
  return readJson<T>(res);
}

export async function createSimpleInvoice(args: {
  senderInvoiceNo: string;
  invoiceReceiverCode: string;
  amount: number;
  description: string;
  callbackUrl: string;
}): Promise<QPayInvoiceResponse> {
  const { invoiceCode } = config();
  const body = {
    invoice_code: invoiceCode,
    sender_invoice_no: args.senderInvoiceNo,
    invoice_receiver_code: args.invoiceReceiverCode,
    invoice_description: args.description,
    amount: args.amount,
    callback_url: args.callbackUrl,
  };
  return authed<QPayInvoiceResponse>('/v2/invoice', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function checkPayment(invoiceId: string): Promise<QPayPaymentCheckResponse> {
  return authed<QPayPaymentCheckResponse>('/v2/payment/check', {
    method: 'POST',
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoiceId,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });
}

export async function cancelInvoice(invoiceId: string): Promise<void> {
  const { baseUrl } = config();
  const token = await getAccessToken();
  const res = await fetch(`${baseUrl}/v2/invoice/${invoiceId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`QPay cancelInvoice ${res.status}: ${text.slice(0, 200)}`);
  }
}

/** Pull the first PAID row out of a check response, or null. */
export function firstPaidRow(
  check: QPayPaymentCheckResponse
): QPayPaymentRow | null {
  const row = check.rows.find((r) => r.payment_status === 'PAID');
  return row ?? null;
}
