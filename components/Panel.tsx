import { readMenu } from '@/lib/clover/menu';
import { money, pick } from '@/lib/core/i18n';
import type { PageCtx } from '@/lib/core/page';
import { getStore } from '@/lib/core/store';
import { localDate } from '@/lib/core/time';
import { dayReport, DRAWERS, openDrawer, photoMap, type Drawer } from '@/lib/domain/register';
import { ApiForm } from './ApiForm';
import { DeviceKeys } from './DeviceKeys';
import { Badge, Banner, Card, Empty, Stat } from './ui';

// C4ISSE screens (lib/domain `sections`): today's report, cash drawer (VIP), Picture Register (Premium), the Clover
// menu, register devices. Plan and role are checked before (components/SectionPage.tsx) and again by each API.
export async function Panel({ ctx, section }: { ctx: PageCtx; section: string; query?: Record<string, string> }) {
  switch (section) {
    case '': return <Today ctx={ctx} />;
    case 'drawer': return <DrawerScreen ctx={ctx} />;
    case 'photos': return <Photos ctx={ctx} />;
    case 'menu': return <MenuScreen ctx={ctx} />;
    case 'devices': return <DeviceKeys merchantId={ctx.merchantId!} lang={ctx.lang} kind="register" title={pick(ctx.lang, 'Appareils de caisse', 'Register devices')}
      hint={pick(ctx.lang, 'Chaque appareil Clover qui fait tourner l’écran de vente C4ISSE reçoit sa clé (Bearer dk_…).', 'Each Clover device running the C4ISSE sales screen gets its own key (Bearer dk_…).')} canManage={ctx.can('account.devices')} />;
    default: return null;
  }
}

async function Today({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const today = localDate();
  if (!ctx.can('register.report')) return <Banner tone="info">{pick(lang, 'Le rapport de la journée est réservé à un autre rôle (Compte › Actions autorisées).', 'The day report is reserved for another role (Account › Authorized actions).')}</Banner>;
  const rep = await dayReport(merchantId!, today);
  if (!rep.ok) return <Banner tone="warn">{rep.error}</Banner>;
  const r = rep.report;
  return (
    <>
      <div className="grid">
        <Stat label={pick(lang, 'Ventes nettes', 'Net sales')} value={money(r.netSalesCents, lang)} note={`${r.payments} ${pick(lang, 'paiements', 'payments')} · ${today}`} />
        <Stat label={pick(lang, 'Taxes', 'Taxes')} value={money(r.taxCents, lang)} />
        <Stat label={pick(lang, 'Pourboires', 'Tips')} value={money(r.tipCents, lang)} />
        <Stat label={pick(lang, 'Comptant', 'Cash')} value={money(r.cashCents, lang)} />
        <Stat label={pick(lang, 'Remboursements', 'Refunds')} value={money(r.refundsCents, lang)} tone={r.refundsCents > 0 ? 'warn' : undefined} />
      </div>
      <Card title={pick(lang, 'Par mode de paiement', 'By tender')} icon="card">
        {r.byTender.length === 0 ? <Empty icon="card">{pick(lang, 'Aucun paiement aujourd’hui pour l’instant.', 'No payment today yet.')}</Empty> : (
          <div className="table-wrap"><table><thead><tr><th>{pick(lang, 'Mode de paiement', 'Tender')}</th><th className="right">#</th><th className="right">{pick(lang, 'Montant', 'Amount')}</th><th className="right">{pick(lang, 'Pourboires', 'Tips')}</th></tr></thead>
            <tbody>{r.byTender.map((t) => <tr key={t.label}><td>{t.label}</td><td className="right">{t.count}</td><td className="right">{money(t.amountCents, lang)}</td><td className="right">{money(t.tipCents, lang)}</td></tr>)}</tbody></table></div>
        )}
      </Card>
    </>
  );
}

async function DrawerScreen({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const [drawer, history] = await Promise.all([openDrawer(merchantId!), getStore().list<Drawer>(DRAWERS, { merchantId: merchantId!, limit: 20 })]);
  const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString(lang === 'en' ? 'en-CA' : 'fr-CA') : '—');
  const closes = history.map((d) => d.data).filter((d) => d.closedAt);
  const can = ctx.can('register.drawer');
  return (
    <>
      <Card title={drawer ? pick(lang, 'Tiroir ouvert', 'Drawer open') : pick(lang, 'Tiroir fermé', 'Drawer closed')} icon="drawer"
        right={drawer ? <Badge tone="ok">{pick(lang, 'Ouvert', 'Open')}</Badge> : <Badge>{pick(lang, 'Fermé', 'Closed')}</Badge>}
        sub={drawer ? `${pick(lang, 'Depuis', 'Since')} ${time(drawer.openedAt)} · ${pick(lang, 'fonds', 'float')} ${money(drawer.floatCents, lang)} · ${drawer.openedBy}` : undefined}>
        {!can ? <p className="muted">{pick(lang, 'Votre rôle ne permet pas d’ouvrir ou de fermer le tiroir.', 'Your role cannot open or close the drawer.')}</p>
          : drawer ? (
            <ApiForm action="/api/register/drawer" extra={{ action: 'close' }} fields={[{ name: 'countedCents', label: pick(lang, 'Comptant compté ($)', 'Cash counted ($)'), type: 'money', required: true }, { name: 'note', label: pick(lang, 'Note', 'Note') }]}
              submit={pick(lang, 'Fermer le tiroir', 'Close the drawer')} lang={lang} result={pick(lang, 'Écart : {drawer.varianceCents|money} (attendu {drawer.expectedCents|money})', 'Variance: {drawer.varianceCents|money} (expected {drawer.expectedCents|money})')} />
          ) : <ApiForm action="/api/register/drawer" extra={{ action: 'open' }} fields={[{ name: 'floatCents', label: pick(lang, 'Fonds de caisse ($)', 'Float ($)'), type: 'money', required: true }]} submit={pick(lang, 'Ouvrir le tiroir', 'Open the drawer')} />}
      </Card>
      <Card title={pick(lang, 'Dernières fermetures', 'Latest closes')} icon="log">
        {closes.length === 0 ? <Empty icon="drawer">{pick(lang, 'Aucune fermeture pour l’instant.', 'No close yet.')}</Empty> : (
          <div className="table-wrap"><table><thead><tr><th>{pick(lang, 'Fermé', 'Closed')}</th><th>{pick(lang, 'Par', 'By')}</th><th className="right">{pick(lang, 'Attendu', 'Expected')}</th><th className="right">{pick(lang, 'Compté', 'Counted')}</th><th className="right">{pick(lang, 'Écart', 'Variance')}</th></tr></thead>
            <tbody>{closes.map((d) => <tr key={d.id}><td className="nowrap">{time(d.closedAt)}</td><td>{d.closedBy}</td><td className="right">{money(d.expectedCents ?? 0, lang)}</td><td className="right">{money(d.countedCents ?? 0, lang)}</td>
              <td className="right">{(d.varianceCents ?? 0) === 0 ? <Badge tone="ok">{money(0, lang)}</Badge> : <Badge tone={Math.abs(d.varianceCents ?? 0) > 500 ? 'stop' : 'warn'}>{money(d.varianceCents ?? 0, lang)}</Badge>}</td></tr>)}</tbody></table></div>
        )}
      </Card>
    </>
  );
}

async function Photos({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const [menu, photos] = await Promise.all([readMenu(merchantId!), photoMap(merchantId!)]);
  if (!menu.ok) return <Banner tone="warn">{menu.error}</Banner>;
  const items = Object.values(menu.menu.items).sort((a, b) => a.name.localeCompare(b.name));
  const missing = items.filter((i) => !photos[i.id]);
  return (
    <>
      <div className="grid">
        <Stat label={pick(lang, 'Articles avec photo', 'Items with a photo')} value={`${items.length - missing.length}/${items.length}`} tone={missing.length ? 'warn' : 'ok'} />
      </div>
      <Card title={pick(lang, 'Ajouter ou changer une photo', 'Add or change a photo')} icon="camera" sub={pick(lang, 'Adresse https d’une image (JPG, PNG ou WebP), carrée de préférence.', 'An https address of an image (JPG, PNG or WebP), square if possible.')}>
        {ctx.can('register.photos') ? (
          <ApiForm action="/api/register/photos" method="PUT" fields={[
            { name: 'itemId', label: pick(lang, 'Article', 'Item'), type: 'select', options: items.map((i) => ({ value: i.id, label: `${photos[i.id] ? '✓ ' : ''}${i.name}` })) },
            { name: 'url', label: pick(lang, 'Adresse https de la photo', 'Photo https address'), type: 'url', required: true },
          ]} submit={pick(lang, 'Enregistrer', 'Save')} />
        ) : <p className="muted">{pick(lang, 'Votre rôle ne permet pas de changer les photos.', 'Your role cannot change photos.')}</p>}
      </Card>
      {items.some((i) => photos[i.id]) && (
        <Card title={pick(lang, 'Aperçu', 'Preview')} icon="grid">
          <div className="photo-grid">{items.filter((i) => photos[i.id]).map((i) => <figure key={i.id}><img src={photos[i.id]} alt={i.name} loading="lazy" referrerPolicy="no-referrer" /><figcaption>{i.name}</figcaption></figure>)}</div>
        </Card>
      )}
    </>
  );
}

async function MenuScreen({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const menu = await readMenu(merchantId!);
  if (!menu.ok) return <Banner tone="warn">{menu.error}</Banner>;
  const { categories, items } = menu.menu;
  const all = Object.values(items);
  const inCat = new Set(categories.flatMap((c) => c.itemIds));
  const groups = [...categories.map((c) => ({ id: c.id, name: c.name, list: c.itemIds.map((id) => items[id]).filter(Boolean) })), { id: '_', name: pick(lang, 'Sans catégorie', 'No category'), list: all.filter((i) => !inCat.has(i.id)) }].filter((g) => g.list.length);
  return (
    <>
      <div className="grid">
        <Stat label={pick(lang, 'Articles', 'Items')} value={all.length} note={`${all.filter((i) => !i.available).length} ${pick(lang, 'indisponibles', 'unavailable')}`} />
        <Stat label={pick(lang, 'Catégories', 'Categories')} value={categories.length} />
      </div>
      <p className="muted small">{pick(lang, 'Pour changer un article ou un prix : Clover → Inventaire. La caisse suit en moins d’une minute.', 'To change an item or a price: Clover → Inventory. The register follows within a minute.')}</p>
      {groups.map((g) => (
        <Card key={g.id} title={g.name} icon="list" right={<Badge>{g.list.length}</Badge>}>
          <div className="table-wrap"><table><thead><tr><th>{pick(lang, 'Article', 'Item')}</th><th className="right">{pick(lang, 'Prix', 'Price')}</th><th className="right">{pick(lang, 'Taxe', 'Tax')}</th><th>{pick(lang, 'Options', 'Options')}</th><th /></tr></thead>
            <tbody>{g.list.map((i) => <tr key={i.id}><td>{i.name}{i.sku ? <div className="muted small">{i.sku}</div> : null}</td><td className="right">{i.priceType === 'VARIABLE' ? pick(lang, 'variable', 'variable') : money(i.priceCents, lang)}</td><td className="right">{i.taxPct ? `${i.taxPct.toFixed(3).replace(/\.?0+$/, '')} %` : '—'}</td><td className="muted small">{i.groups.map((x) => x.name).join(', ') || '—'}</td><td>{!i.available && <Badge tone="warn">{pick(lang, 'Indisponible', 'Unavailable')}</Badge>}</td></tr>)}</tbody></table></div>
        </Card>
      ))}
    </>
  );
}
