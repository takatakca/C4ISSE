import { readMenu, validateCart, createCloverOrder, type CartLine } from '@/lib/clover/menu';
import { isCtx, requireMerchantOrDevice } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';

export const dynamic = 'force-dynamic';

// { lines: [{ itemId, quantity, modifierIds?, note? }], note? } → checked against the live Clover menu → Clover order.
// The device then takes the payment on that order with Clover's Payments API.
export async function POST(req: Request) {
  const c = await requireMerchantOrDevice(req);
  if (!isCtx(c)) return c;
  const b = await readJson(req);
  if (!b || !Array.isArray(b.lines)) return fail('{ lines: [...] } required');
  const m = await readMenu(c.merchantId);
  if (!m.ok) return fail(m.error, 502);
  const v = validateCart(m.menu, b.lines as CartLine[]);
  if (!v.ok) return fail(v.error, 422);
  const r = await createCloverOrder(c.merchantId, b.lines as CartLine[], { title: 'C4ISSE', note: typeof b.note === 'string' ? b.note : undefined });
  return r.ok ? ok({ orderId: r.orderId, totalCents: r.totalCents, estimate: v }) : fail(r.error, 502);
}
