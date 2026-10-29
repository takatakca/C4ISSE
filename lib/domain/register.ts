// C4ISSE — the register backend the counter app (Android, Clover SDK) and the dashboard use:
//  - the real Clover menu with each item's photo (Picture Register module, Premium) for the touch screen;
//  - orders built from that menu, created in Clover (the device then takes the payment with Clover's Payments API);
//  - the day's report from Clover payments (tenders, cash, tips, taxes, refunds) — Base;
//  - cash drawer sessions: float, expected cash from Clover cash payments, counted cash, variance — VIP.
import crypto from 'node:crypto';
import { cloverGetAll, mpath } from '../clover/api';
import { readMenu, type Menu } from '../clover/menu';
import { getStore } from '../core/store';
import { localDayRange } from '../core/time';

export const CASH_TENDER = 'com.clover.tender.cash';

export interface DayReport {
  date: string; payments: number; grossCents: number; taxCents: number; tipCents: number; netSalesCents: number; refundsCents: number; cashCents: number;
  byTender: Array<{ label: string; count: number; amountCents: number; tipCents: number }>;
}

async function paymentsBetween(merchantId: string, start: number, end: number) {
  return cloverGetAll<any>(merchantId, mpath(merchantId, '/payments'), { filter: [`createdTime>=${start}`, `createdTime<${end}`], expand: 'tender,refunds' });
}

export function summarize(date: string, payments: any[], start = -Infinity, end = Infinity): DayReport {
  const r: DayReport = { date, payments: 0, grossCents: 0, taxCents: 0, tipCents: 0, netSalesCents: 0, refundsCents: 0, cashCents: 0, byTender: [] };
  const tenders = new Map<string, DayReport['byTender'][number]>();
  for (const p of payments) {
    if (p.result && p.result !== 'SUCCESS') continue;
    const amount = Number(p.amount) || 0; const tax = Number(p.taxAmount) || 0; const tip = Number(p.tipAmount) || 0;
    const label = String(p.tender?.label ?? 'Autre');
    r.payments++; r.grossCents += amount; r.taxCents += tax; r.tipCents += tip;
    const t = tenders.get(label) ?? { label, count: 0, amountCents: 0, tipCents: 0 };
    t.count++; t.amountCents += amount; t.tipCents += tip; tenders.set(label, t);
    const refunded = ((p.refunds?.elements ?? []) as any[]).filter((x) => { const at = Number(x.createdTime); return !Number.isFinite(at) || (at >= start && at < end); })
      .reduce((s, x) => s + (Number(x.amount) || 0), 0);
    r.refundsCents += refunded;
    if (p.tender?.labelKey === CASH_TENDER) r.cashCents += amount + tip - refunded;
  }
  r.netSalesCents = r.grossCents - r.taxCents - r.refundsCents;
  r.byTender = [...tenders.values()].sort((a, b) => b.amountCents - a.amountCents);
  return r;
}

export async function dayReport(merchantId: string, date: string): Promise<{ ok: true; report: DayReport } | { ok: false; error: string }> {
  const [start, end] = localDayRange(date);
  const p = await paymentsBetween(merchantId, start, end);
  if (!p.ok) return { ok: false, error: p.error ?? 'Could not read Clover payments.' };
  return { ok: true, report: summarize(date, p.items, start, end) };
}

// ---- cash drawer (VIP) ----
export interface Drawer { id: string; openedAt: string; openedBy: string; floatCents: number; closedAt: string | null; closedBy: string | null; countedCents: number | null; expectedCents: number | null; varianceCents: number | null; note: string | null }
export const DRAWERS = 'drawers';

export async function openDrawer(merchantId: string): Promise<Drawer | null> {
  return (await getStore().list<Drawer>(DRAWERS, { merchantId, limit: 20 })).map((d) => d.data).find((d) => !d.closedAt) ?? null;
}

export async function startDrawer(merchantId: string, floatCents: number, by: string): Promise<{ ok: true; drawer: Drawer } | { ok: false; error: string }> {
  if (!Number.isInteger(floatCents) || floatCents < 0 || floatCents > 1_000_000) return { ok: false, error: 'Float must be between 0 and 10 000 $.' };
  if (await openDrawer(merchantId)) return { ok: false, error: 'A drawer is already open: close it first.' };
  const drawer: Drawer = { id: crypto.randomUUID(), openedAt: new Date().toISOString(), openedBy: by.slice(0, 60), floatCents, closedAt: null, closedBy: null, countedCents: null, expectedCents: null, varianceCents: null, note: null };
  await getStore().put(DRAWERS, drawer.id, merchantId, drawer, drawer.openedAt);
  return { ok: true, drawer };
}

/** Close: expected = float + cash taken in Clover since opening (tips included, refunds removed); variance = counted − expected. */
export async function closeDrawer(merchantId: string, countedCents: number, by: string, note?: string): Promise<{ ok: true; drawer: Drawer } | { ok: false; error: string }> {
  const d = await openDrawer(merchantId);
  if (!d) return { ok: false, error: 'No open drawer.' };
  if (!Number.isInteger(countedCents) || countedCents < 0 || countedCents > 10_000_000) return { ok: false, error: 'Counted cash is not valid.' };
  const now = Date.now();
  const p = await paymentsBetween(merchantId, Date.parse(d.openedAt), now);
  if (!p.ok) return { ok: false, error: p.error ?? 'Could not read Clover payments.' };
  const cash = summarize('', p.items, Date.parse(d.openedAt), now).cashCents;
  const expected = d.floatCents + cash;
  const closed: Drawer = { ...d, closedAt: new Date(now).toISOString(), closedBy: by.slice(0, 60), countedCents, expectedCents: expected, varianceCents: countedCents - expected, note: note ? note.slice(0, 200) : null };
  await getStore().put(DRAWERS, d.id, merchantId, closed, d.openedAt);
  return { ok: true, drawer: closed };
}

// ---- photos (Picture Register module, Premium) ----
export const PHOTOS = 'photos';
const photoId = (mid: string, itemId: string) => `${mid}:${itemId}`;

export async function setPhoto(merchantId: string, itemId: string, url: string | null): Promise<{ ok: boolean; error?: string }> {
  if (!/^[A-Z0-9]{8,20}$/i.test(itemId)) return { ok: false, error: 'Unknown item.' };
  if (url === null) { await getStore().remove(PHOTOS, photoId(merchantId, itemId)); return { ok: true }; }
  try { if (new URL(url).protocol !== 'https:') return { ok: false, error: 'Photo address must be https.' }; } catch { return { ok: false, error: 'Photo address is not valid.' }; }
  await getStore().put(PHOTOS, photoId(merchantId, itemId), merchantId, { itemId, url: url.slice(0, 500) });
  return { ok: true };
}

export async function photoMap(merchantId: string): Promise<Record<string, string>> {
  return Object.fromEntries((await getStore().list<{ itemId: string; url: string }>(PHOTOS, { merchantId, limit: 5000 })).map((d) => [d.data.itemId, d.data.url]));
}

/** The register's menu: Clover items + photos (photos only for Premium and VIP). */
export async function registerMenu(merchantId: string, withPhotos: boolean): Promise<{ ok: true; menu: Menu; photos: Record<string, string> } | { ok: false; error: string }> {
  const m = await readMenu(merchantId);
  if (!m.ok) return m;
  return { ok: true, menu: m.menu, photos: withPhotos ? await photoMap(merchantId) : {} };
}
