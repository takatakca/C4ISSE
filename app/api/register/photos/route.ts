import { isCtx, requireMerchant } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';
import { photoMap, setPhoto } from '@/lib/domain/register';

export const dynamic = 'force-dynamic';

// Picture Register module (Premium): item photos for the counter screen. PUT { itemId, url | null }.
export async function GET(req: Request) {
  const c = await requireMerchant(req, 'premium');
  if (!isCtx(c)) return c;
  return ok({ photos: await photoMap(c.merchantId) });
}

export async function PUT(req: Request) {
  const c = await requireMerchant(req, 'premium', { action: 'register.photos' });
  if (!isCtx(c)) return c;
  const b = await readJson(req);
  if (!b) return fail('JSON body required');
  const r = await setPhoto(c.merchantId, String(b.itemId ?? ''), b.url ? String(b.url) : null);
  return r.ok ? ok() : fail(r.error ?? 'Not saved');
}
