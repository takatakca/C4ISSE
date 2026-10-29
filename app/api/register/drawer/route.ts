import { isCtx, requireMerchantOrDevice } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';
import { getStore } from '@/lib/core/store';
import { closeDrawer, DRAWERS, openDrawer, startDrawer, type Drawer } from '@/lib/domain/register';

export const dynamic = 'force-dynamic';

// Cash drawer (VIP): GET = open drawer + last closes; POST { action: "open", floatCents } | { action: "close", countedCents, note? }
// (register.drawer; a device may add { by: "<cashier>" }).
export async function GET(req: Request) {
  const c = await requireMerchantOrDevice(req, 'vip');
  if (!isCtx(c)) return c;
  const recent = (await getStore().list<Drawer>(DRAWERS, { merchantId: c.merchantId, limit: 30 })).map((d) => d.data);
  return ok({ open: await openDrawer(c.merchantId), recent });
}

export async function POST(req: Request) {
  const c = await requireMerchantOrDevice(req, 'vip', { action: 'register.drawer' });
  if (!isCtx(c)) return c;
  const b = await readJson(req);
  if (!b) return fail('JSON body required');
  // The signed-in person, or the device plus the cashier's name it sends (never a name a person types for someone else).
  const by = c.device && typeof b.by === 'string' && b.by.trim() ? `${b.by.trim().slice(0, 40)} (${c.actor})` : c.actor;
  const r = b.action === 'open' ? await startDrawer(c.merchantId, Number(b.floatCents), by)
    : b.action === 'close' ? await closeDrawer(c.merchantId, Number(b.countedCents), by, typeof b.note === 'string' ? b.note : undefined)
      : { ok: false as const, error: 'action must be open or close' };
  return r.ok ? ok({ drawer: r.drawer }) : fail(r.error, 422);
}
