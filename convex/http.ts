import { httpRouter } from 'convex/server';

import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { checkPayment, firstPaidRow } from './qpay';

const http = httpRouter();

/**
 * QPay server-to-server callback.
 *
 * QPay does NOT sign callbacks, so we treat the webhook as a hint only: we
 * re-verify by calling `/v2/payment/check` ourselves before granting access.
 *
 * Accepts `invoice_id` (or `object_id`) and/or `sender_invoice_no` from either
 * the query string or the JSON body. Always returns 200 — returning errors
 * would cause QPay to retry forever and doesn't help the user.
 */
const qpayCallback = httpAction(async (ctx, req) => {
  try {
    const url = new URL(req.url);
    let invoiceId: string | null =
      url.searchParams.get('invoice_id') ?? url.searchParams.get('object_id');
    let senderInvoiceNo: string | null = url.searchParams.get(
      'sender_invoice_no'
    );

    if (!invoiceId || !senderInvoiceNo) {
      const contentType = req.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          const body = (await req.json()) as Record<string, unknown>;
          invoiceId =
            invoiceId ??
            (typeof body.invoice_id === 'string' ? body.invoice_id : null) ??
            (typeof body.object_id === 'string' ? body.object_id : null);
          senderInvoiceNo =
            senderInvoiceNo ??
            (typeof body.sender_invoice_no === 'string'
              ? body.sender_invoice_no
              : null);
        } catch {
          // body parse errors are non-fatal
        }
      }
    }

    if (!invoiceId && senderInvoiceNo) {
      invoiceId = await ctx.runQuery(
        internal.payments.findInvoiceIdBySenderInvoiceNo,
        { senderInvoiceNo }
      );
    }

    if (!invoiceId) {
      console.warn('[qpay/callback] missing invoice_id and sender_invoice_no');
      return new Response(JSON.stringify({ ok: false, reason: 'missing-id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const check = await checkPayment(invoiceId);
    const paid = firstPaidRow(check);
    if (!paid) {
      console.log('[qpay/callback] not paid yet', invoiceId, check.rows.length);
      return new Response(JSON.stringify({ ok: true, status: 'pending' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await ctx.runMutation(internal.subscriptions.applyPayment, {
      invoiceId,
      qpayPaymentId: String(paid.payment_id),
      paidAmount: Number(paid.payment_amount),
    });

    return new Response(JSON.stringify({ ok: true, status: 'paid' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[qpay/callback] error', err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

http.route({ path: '/qpay/callback', method: 'POST', handler: qpayCallback });
http.route({ path: '/qpay/callback', method: 'GET', handler: qpayCallback });

export default http;
