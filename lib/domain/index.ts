// C4ISSE's side of the shared shell: hooks, menu sections, authorized actions, device kinds, what each plan adds.
// The register reads Clover live; nothing to do on webhooks yet (the menu cache is 60 s).
import type { AppHooks } from '../hooks';
import type { AppAction, AppSection, DeviceKind, TierFeatures } from '../nav';

export const hooks: AppHooks = {};

export const sections: AppSection[] = [
  { slug: '', fr: 'Aujourd’hui', en: 'Today', icon: 'chart', hintFr: 'Ventes, taxes, pourboires et modes de paiement de la journée, lus dans Clover.', hintEn: 'Today’s sales, taxes, tips and tenders, read from Clover.' },
  { slug: 'register', fr: 'Caisse', en: 'Register', icon: 'register', hub: true, hintFr: 'Tiroir-caisse, caisse-photo, menu et appareils de caisse.', hintEn: 'Cash drawer, picture register, menu and register devices.' },
  { slug: 'drawer', parent: 'register', fr: 'Tiroir-caisse', en: 'Cash drawer', icon: 'drawer', tier: 'vip', hintFr: 'Ouverture avec un fonds de caisse, fermeture avec le comptage et l’écart.', hintEn: 'Open with a float, close with the count and the variance.' },
  { slug: 'photos', parent: 'register', fr: 'Caisse-photo', en: 'Picture Register', icon: 'camera', tier: 'premium', hintFr: 'Une photo par article pour vendre plus vite au comptoir.', hintEn: 'One photo per item to sell faster at the counter.' },
  { slug: 'menu', parent: 'register', fr: 'Menu Clover', en: 'Clover menu', icon: 'list', hintFr: 'Les articles et les prix que la caisse vend, lus dans Clover.', hintEn: 'The items and prices the register sells, read from Clover.' },
  { slug: 'devices', parent: 'register', fr: 'Appareils de caisse', en: 'Register devices', icon: 'device', hintFr: 'Une clé par appareil Clover qui fait tourner l’écran de vente.', hintEn: 'One key per Clover device running the sales screen.' },
];

export const actions: AppAction[] = [
  { key: 'register.sell', fr: 'Vendre au comptoir (créer une commande Clover)', en: 'Sell at the counter (create a Clover order)', min: 'employee' },
  { key: 'register.drawer', fr: 'Ouvrir et fermer le tiroir-caisse', en: 'Open and close the cash drawer', min: 'employee' },
  { key: 'register.report', fr: 'Voir le rapport de la journée', en: 'See the day’s report', min: 'employee' },
  { key: 'register.photos', fr: 'Changer les photos des articles', en: 'Change item photos', min: 'manager' },
];

export const deviceKinds: DeviceKind[] = [{ kind: 'register', fr: 'Caisse C4ISSE', en: 'C4ISSE register' }];

export const tierFeatures: TierFeatures = {
  base: [
    ['Vente au comptoir sur le vrai menu Clover', 'Counter sales on the real Clover menu'],
    ['Rapport de la journée : ventes, taxes, pourboires, modes de paiement', 'Day report: sales, taxes, tips, tenders'],
    ['Appareils de caisse, rôles et journal d’activité', 'Register devices, roles and activity log'],
  ],
  premium: [
    ['Caisse-photo : une photo par article à l’écran de vente', 'Picture Register: a photo per item on the sales screen'],
    ['Menu avec photos pour les appareils de caisse', 'Menu with photos for the register devices'],
  ],
  vip: [
    ['Tiroir-caisse : fonds, comptage, écart à la fermeture', 'Cash drawer: float, count, variance at close'],
    ['Historique des fermetures de tiroir', 'History of drawer closes'],
  ],
};
