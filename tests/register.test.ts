// C4ISSE: day report from Clover payments, cash drawer, photos.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDrawer, dayReport, openDrawer, photoMap, setPhoto, startDrawer, summarize } from '@/lib/domain/register';
import { connect, fakeClover, MID } from './helpers';

const CASH = { label: 'Comptant', labelKey: 'com.clover.tender.cash' };
const CARD = { label: 'Carte', labelKey: 'com.clover.tender.credit_card' };
let payments: any[] = [];

beforeEach(async () => {
  payments = [];
  fakeClover([(u) => (u.pathname.endsWith('/payments') ? { elements: payments } : undefined)]);
  await connect();
});
afterEach(() => vi.unstubAllGlobals());

describe('day report', () => {
  it('adds payments by tender; failed payments ignored; refunds and tips counted', () => {
    const r = summarize('2026-10-28', [
      { result: 'SUCCESS', amount: 1150, taxAmount: 150, tipAmount: 200, tender: CARD },
      { result: 'SUCCESS', amount: 2300, taxAmount: 300, tipAmount: 0, tender: CASH, refunds: { elements: [{ amount: 500, createdTime: 5 }] } },
      { result: 'FAIL', amount: 9999, tender: CARD },
    ], 0, 10);
    expect(r).toMatchObject({ payments: 2, grossCents: 3450, taxCents: 450, tipCents: 200, refundsCents: 500, netSalesCents: 2500, cashCents: 1800 });
    expect(r.byTender.map((t) => t.label)).toEqual(['Comptant', 'Carte']);
  });

  it('reads the day from Clover with a Montréal day window', async () => {
    payments = [{ result: 'SUCCESS', amount: 1000, taxAmount: 130, tipAmount: 0, tender: CARD }];
    const r = await dayReport(MID, '2026-10-28');
    expect(r).toMatchObject({ ok: true, report: { netSalesCents: 870 } });
  });
});

describe('cash drawer', () => {
  it('opens once, expects float + cash, records the variance', async () => {
    expect(await startDrawer(MID, -1, 'A')).toMatchObject({ ok: false });
    expect(await startDrawer(MID, 20000, 'Ana')).toMatchObject({ ok: true });
    expect(await startDrawer(MID, 20000, 'Ana')).toMatchObject({ ok: false });
    payments = [{ result: 'SUCCESS', amount: 2300, taxAmount: 300, tipAmount: 100, tender: CASH }, { result: 'SUCCESS', amount: 5000, tender: CARD }];
    const r = await closeDrawer(MID, 22300, 'Ana');
    expect(r).toMatchObject({ ok: true, drawer: { expectedCents: 22400, varianceCents: -100 } });
    expect(await openDrawer(MID)).toBeNull();
    expect(await closeDrawer(MID, 0, 'Ana')).toMatchObject({ ok: false });
  });
});

describe('photos', () => {
  it('keeps https photos per item only', async () => {
    expect(await setPhoto(MID, 'ITEMSODA0001', 'http://x/a.jpg')).toMatchObject({ ok: false });
    expect(await setPhoto(MID, 'ITEMSODA0001', 'https://cdn.example.ca/soda.jpg')).toEqual({ ok: true });
    expect(await photoMap(MID)).toEqual({ ITEMSODA0001: 'https://cdn.example.ca/soda.jpg' });
    expect(await setPhoto(MID, 'ITEMSODA0001', null)).toEqual({ ok: true });
    expect(await photoMap(MID)).toEqual({});
  });
});
