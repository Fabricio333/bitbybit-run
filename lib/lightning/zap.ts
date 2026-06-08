/**
 * Manual "zap the winner" — a Lightning tip to the winner's `lud16` address
 * via LNURL-pay + WebLN (see ARCHITECTURE §7). No custody, no backend secrets:
 * the viewer's own wallet (Alby, etc.) pays an invoice we fetch from the
 * winner's Lightning address. Browser-only (`window.webln`); the pure URL
 * helpers are unit-tested.
 *
 * Thrown error messages are stable codes the UI maps to localized copy:
 *   invalid_lud16 · no_webln · lnurl_unreachable · not_pay_request ·
 *   invoice_failed
 */

/** Default tip, in sats. */
export const ZAP_SATS = 100;

/** `name@domain` → its LNURL-pay well-known URL. Throws on a malformed address. */
export function lnurlpUrl(lud16: string): string {
  const at = lud16.indexOf("@");
  if (at <= 0 || at === lud16.length - 1) throw new Error("invalid_lud16");
  const name = lud16.slice(0, at);
  const domain = lud16.slice(at + 1);
  if (!/^[a-z0-9._-]+$/i.test(name) || !/^[a-z0-9.-]+$/i.test(domain)) {
    throw new Error("invalid_lud16");
  }
  return `https://${domain}/.well-known/lnurlp/${name}`;
}

/**
 * Build an LNURL-pay callback URL with the `amount` (millisats) and an optional
 * `comment` (the zap message), preserving any existing query params.
 */
export function callbackWithAmount(
  callback: string,
  msats: number,
  comment?: string
): string {
  const url = new URL(callback);
  url.searchParams.set("amount", String(msats));
  if (comment) url.searchParams.set("comment", comment);
  return url.toString();
}

interface PayParams {
  callback: string;
  min: number; // millisats
  max: number; // millisats
  /** Max comment length the recipient accepts (0 = comments not supported). */
  commentAllowed: number;
}

async function fetchPayParams(lud16: string): Promise<PayParams> {
  let res: Response;
  try {
    res = await fetch(lnurlpUrl(lud16));
  } catch {
    throw new Error("lnurl_unreachable");
  }
  if (!res.ok) throw new Error("lnurl_unreachable");
  const data = await res.json();
  if (data?.tag !== "payRequest" || typeof data.callback !== "string") {
    throw new Error("not_pay_request");
  }
  return {
    callback: data.callback,
    min: Number(data.minSendable ?? 1000),
    max: Number(data.maxSendable ?? 100_000_000),
    commentAllowed: Number(data.commentAllowed ?? 0),
  };
}

async function fetchInvoice(
  callback: string,
  msats: number,
  comment?: string
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(callbackWithAmount(callback, msats, comment));
  } catch {
    throw new Error("invoice_failed");
  }
  if (!res.ok) throw new Error("invoice_failed");
  const data = await res.json();
  if (typeof data?.pr !== "string") throw new Error("invoice_failed");
  return data.pr;
}

/**
 * Zap a Lightning address: resolve LNURL-pay, fetch an invoice for `sats`
 * (clamped to the recipient's min/max) with an optional `comment` (sent only
 * when the recipient supports comments, truncated to their limit), and pay it
 * with WebLN. Resolves with the payment preimage on success.
 */
export async function zapLightningAddress(
  lud16: string,
  sats: number = ZAP_SATS,
  comment?: string
): Promise<string> {
  if (typeof window === "undefined" || !window.webln) {
    throw new Error("no_webln");
  }
  const { callback, min, max, commentAllowed } = await fetchPayParams(lud16);
  const msats = Math.min(Math.max(sats * 1000, min), max);
  const trimmed =
    comment && commentAllowed > 0
      ? comment.slice(0, commentAllowed)
      : undefined;
  const invoice = await fetchInvoice(callback, msats, trimmed);
  await window.webln.enable();
  const { preimage } = await window.webln.sendPayment(invoice);
  return preimage;
}
