import { isCtx, requireMerchantOrDevice } from '@/lib/core/guard';
import { fail, ok } from '@/lib/core/http';
import { isDate, localDate } from '@/lib/core/time';
import { dayReport } from '@/lib/domain/register';

export const dynamic = 'force-dynamic';

// GET ?date=YYYY-MM-DD (default today, Montréal time): the day's report from Clover payments.
export async function GET(req: Request) {
  const c = await requireMerchantOrDevice(req);
  if (!isCtx(c)) return c;
  const date = new URL(req.url).searchParams.get('date') ?? localDate();
  if (!isDate(date)) return fail('date must be YYYY-MM-DD');
  const r = await dayReport(c.merchantId, date);
  return r.ok ? ok({ report: r.report }) : fail(r.error, 502);
}
