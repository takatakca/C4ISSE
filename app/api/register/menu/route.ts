import { tierAtLeast } from '@/lib/app';
import { isCtx, requireMerchantOrDevice } from '@/lib/core/guard';
import { fail, ok } from '@/lib/core/http';
import { registerMenu } from '@/lib/domain/register';

export const dynamic = 'force-dynamic';

// The register's menu (Clover items, groups, taxes) + item photos for Premium/VIP. Signed-in merchant or device key.
export async function GET(req: Request) {
  const c = await requireMerchantOrDevice(req);
  if (!isCtx(c)) return c;
  const r = await registerMenu(c.merchantId, tierAtLeast(c.tier, 'premium'));
  return r.ok ? ok({ menu: r.menu, photos: r.photos }) : fail(r.error, 502);
}
