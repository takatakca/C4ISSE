import { tierAtLeast } from '@/lib/app';
import { readMenu } from '@/lib/clover/menu';
import { money, pick } from '@/lib/core/i18n';
import type { PageCtx } from '@/lib/core/page';
import { localDate } from '@/lib/core/time';
import { dayReport, openDrawer, photoMap } from '@/lib/domain/register';
import { ApiForm } from './ApiForm';
import { DeviceKeys } from './DeviceKeys';
import { Banner, Card, Stat } from './ui';

// C4ISSE dashboard: today's register report, cash drawer (VIP), item photos (Premium), register device keys.
export async function Panel({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId, tier } = ctx;
  if (!merchantId) return null;
  const today = localDate();
  const [rep, drawer] = await Promise.all([dayReport(merchantId, today), tierAtLeast(tier, 'vip') ? openDrawer(merchantId) : Promise.resolve(null)]);
  return (
    <>
      <Card title={pick(lang, `Aujourd’hui (${today})`, `Today (${today})`)}>
        {!rep.ok ? <Banner tone="warn">{rep.error}</Banner> : (
          <>
            <div className="grid">
              <Stat label={pick(lang, 'Ventes nettes', 'Net sales')} value={money(rep.report.netSalesCents, lang)} note={`${rep.report.payments} ${pick(lang, 'paiements', 'payments')}`} />
              <Stat label={pick(lang, 'Taxes', 'Taxes')} value={money(rep.report.taxCents, lang)} />
              <Stat label={pick(lang, 'Pourboires', 'Tips')} value={money(rep.report.tipCents, lang)} />
              <Stat label={pick(lang, 'Comptant', 'Cash')} value={money(rep.report.cashCents, lang)} />
              <Stat label={pick(lang, 'Remboursements', 'Refunds')} value={money(rep.report.refundsCents, lang)} />
            </div>
            {rep.report.byTender.length > 0 && (
              <table style={{ marginTop: 12 }}><thead><tr><th>{pick(lang, 'Mode de paiement', 'Tender')}</th><th>#</th><th>{pick(lang, 'Montant', 'Amount')}</th><th>{pick(lang, 'Pourboires', 'Tips')}</th></tr></thead>
                <tbody>{rep.report.byTender.map((t) => <tr key={t.label}><td>{t.label}</td><td>{t.count}</td><td>{money(t.amountCents, lang)}</td><td>{money(t.tipCents, lang)}</td></tr>)}</tbody></table>
            )}
          </>
        )}
      </Card>
      {tierAtLeast(tier, 'vip') ? (
        <Card title={pick(lang, 'Tiroir-caisse', 'Cash drawer')}>
          {drawer ? (
            <>
              <p>{pick(lang, 'Ouvert depuis', 'Open since')} {new Date(drawer.openedAt).toLocaleTimeString(lang === 'en' ? 'en-CA' : 'fr-CA')} · {pick(lang, 'fonds', 'float')} {money(drawer.floatCents, lang)}</p>
              <ApiForm action="/api/register/drawer" extra={{ action: 'close' }} fields={[{ name: 'countedCents', label: pick(lang, 'Comptant compté ($)', 'Cash counted ($)'), type: 'money', required: true }, { name: 'note', label: pick(lang, 'Note', 'Note') }]}
                submit={pick(lang, 'Fermer le tiroir', 'Close the drawer')} onResult={(j) => `${pick(lang, 'Écart', 'Variance')} : ${money(j.drawer?.varianceCents ?? 0, lang)} (${pick(lang, 'attendu', 'expected')} ${money(j.drawer?.expectedCents ?? 0, lang)})`} />
            </>
          ) : (
            <ApiForm action="/api/register/drawer" extra={{ action: 'open' }} fields={[{ name: 'floatCents', label: pick(lang, 'Fonds de caisse ($)', 'Float ($)'), type: 'money', required: true }]} submit={pick(lang, 'Ouvrir le tiroir', 'Open the drawer')} />
          )}
        </Card>
      ) : <p className="muted">{pick(lang, 'Tenue de caisse complète (ouverture, fermeture, écarts) : forfait VIP.', 'Full cash management (open, close, variance): VIP plan.')}</p>}
      {tierAtLeast(tier, 'premium') ? <Photos merchantId={merchantId} lang={lang} /> : <p className="muted">{pick(lang, 'Caisse-photo (Picture Register) : forfait Premium.', 'Picture Register: Premium plan.')}</p>}
      <DeviceKeys merchantId={merchantId} lang={lang} kind="register" title={pick(lang, 'Appareils de caisse', 'Register devices')}
        hint={pick(lang, 'Chaque appareil Clover qui fait tourner l’écran de vente C4ISSE reçoit sa clé (Bearer dk_…).', 'Each Clover device running the C4ISSE sales screen gets its own key (Bearer dk_…).')} />
    </>
  );
}

async function Photos({ merchantId, lang }: { merchantId: string; lang: 'fr' | 'en' }) {
  const [menu, photos] = await Promise.all([readMenu(merchantId), photoMap(merchantId)]);
  const items = menu.ok ? Object.values(menu.menu.items) : [];
  const missing = items.filter((i) => !photos[i.id]);
  return (
    <Card title={pick(lang, 'Caisse-photo', 'Picture Register')}>
      <p className="muted">{items.length - missing.length}/{items.length} {pick(lang, 'articles ont une photo.', 'items have a photo.')}</p>
      <ApiForm action="/api/register/photos" method="PUT" fields={[
        { name: 'itemId', label: pick(lang, 'Article', 'Item'), type: 'select', options: items.map((i) => ({ value: i.id, label: `${photos[i.id] ? '✓ ' : ''}${i.name}` })) },
        { name: 'url', label: pick(lang, 'Adresse https de la photo', 'Photo https address'), type: 'url', required: true },
      ]} submit={pick(lang, 'Enregistrer', 'Save')} />
    </Card>
  );
}
