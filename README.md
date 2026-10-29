# C4ISSE by TAKATAK

**App ID Clover (production) :** `VDV7XAH5TPB78`
**Développeur :** TAKATAK (compte développeur Clover 9KJ25ATT15TTW)
**État au portail :** brouillon (draft) — rien de soumis.
**Dépôt :** takatakca/C4ISSE

## Ce que fait l'app

Couche caisse (register) TAKATAK qui coexiste avec le Register Clover : écran de vente rapide pour le comptoir, bâti sur le SDK Android Clover et les connecteurs sur appareil.

## Module caisse-photo — « Picture Register » fait partie de C4ISSE

**Correction de Matt, 2026-10-28 18:30 : « Picture Register, c'est C4ISSE ».** L'entrée portail « TAKATAK Picture Register » (`J0H36VTJBSBBP`) n'est pas un produit distinct : c'est le **module caisse-photo de C4ISSE** — l'interface du comptoir où l'on touche la photo de l'article plutôt qu'un code (vitesse + formation du personnel). Il n'a ni fiche, ni prix, ni dépôt séparés : il vit dans les paliers de C4ISSE — **Premium** (photos d'articles depuis notre CDN) et **VIP** (synchronisation photo automatique, mode formation). Détail complet : `docs/modules/picture-register.md`. Le brouillon portail `J0H36VTJBSBBP` reste en place, **non soumis comme app distincte** (aucune suppression).

## Paliers (doctrine de prix de Matt, 2026-10-28)

Chaque app a SES propres paliers. Base = le nécessaire essentiel · Premium = plus d'avantages · VIP = le full kit, tout ce que Clover offre pour la catégorie.

- **Base 50 $/mois** — vente au comptoir via connecteurs Android et Android Payments API ; panier sur le vrai menu ; tenders natifs + comptant, ouverture du tiroir ; impression des reçus.
- **Premium 100 $/mois** — + photos d'articles depuis notre CDN (module caisse-photo — voir `docs/modules/picture-register.md`) ; recherche client par téléphone ; rabais et frais de service ; modes de paiement personnalisés (carte-cadeau REW4RDS, compte client).
- **VIP 150 $/mois** — full kit : contrôle gérant maison (NIP journalisé) ; tenue de caisse complète (événements, fermeture) ; mode hors-ligne de consultation seulement (paiements hors ligne interdits au Canada) ; écrans clients pilotés avec saisie fidélité.

Prix facturés via les plans d'abonnement du Clover App Market (à créer au portail — voir DEPLOY.md).

## Permissions Clover visées

Orders R/W · Inventory R · Payments W (flux) · Customers R/W · Employees R · Merchant R

## Structure

- `docs/listing/` — fiche marketplace (description FR/EN) et textes légaux, depuis le package de soumission local (`~/workspace/clover-apps/`)
- `docs/modules/picture-register.md` — le module caisse-photo de C4ISSE (ex-entrée portail « TAKATAK Picture Register » `J0H36VTJBSBBP`, fusionnée le 2026-10-28)
- `app/api/clover/` — points d'entrée webhook + OAuth (scaffold, même patron que Food Hub)
- `lib/clover/config.ts` — configuration par variables d'environnement (aucun secret dans le code)
- `config/app.config.json` — identité de l'app et paliers
- `DEPLOY.md` — ce qui reste à faire, étape par étape, pour la vague portail

## Le système unique TAKATAK

Cette application fait partie de la suite TAKATAK sur Clover : toutes les apps partagent le même dos d'événements (webhooks Clover), le même **client unique reconnu par son numéro de téléphone** (+ courriel), et les mêmes commandes et paiements Clover. Aucune app ne vit en silo : les données qu'elle produit alimentent les autres apps de la suite (voir « Clover API — Main Stuff — Robot Notepad », section 3, déposé au Drive Opérations et dans `~/workspace/clover-apps/`).

## État du code (2026-10-28)

Application Next.js 16 qui fonctionne (tests verts, build OK). Mise en ligne : `DEPLOY.md` § 5.

**Ce qui marche :**
- **Commun (kit Suite TAKATAK, identique dans les 9 apps)** : connexion Clover OAuth v2 (jetons scellés, rafraîchis
  seuls, supprimés à la désinstallation) · webhook Clover (vérification, X-Clover-Auth, chaque événement une fois) ·
  base PostgreSQL (ou mémoire en dev) · session marchand · paliers Base / Premium / VIP lus depuis la facturation
  Clover (`OWN_MERCHANTS` = VIP) · marchand `RNVTBYMCKXEJ1` en lecture seule · lien Suite TAKATAK avec Food Hub ·
  page d'accueil FR/EN, tableau de bord `/app`, pages légales `/legal/*`, `/api/health`, `/api/cron`, clés d'appareils.
- **Tableau de bord premium (2026-10-29, kit commun)** : menu latéral avec sous-menus (les écrans de cette app,
  Suite TAKATAK, Mon compte, Aide) · Mon compte → Profil, Forfait et facturation, Actions autorisées, Appareils,
  Paiements et dépôts, Sécurité et données (export JSON), Journal d'activité · rôle Clover de la personne (propriétaire,
  administrateur, gérant, employé) vérifié par le serveur pour chaque action sensible, et noté au journal · sélecteur
  des 9 apps de la suite (annuaire Food Hub) · version mobile. Comment tout s'emboîte : `docs/SUITE_KIT.md`.
- Menu Clover réel pour l'écran de vente (`GET /api/register/menu`, photos pour Premium/VIP)
- Commande créée dans Clover depuis le panier, vérifiée contre le menu (`POST /api/register/orders`) — l'appareil
  prend ensuite le paiement avec la Payments API Clover
- Rapport du jour depuis les paiements Clover : modes de paiement, comptant, pourboires, taxes, remboursements (Base)
- Tiroir-caisse : fonds, attendu calculé depuis le comptant Clover, compté, écart (VIP)
- Module caisse-photo (Picture Register) : photo par article (Premium)

**Ce qui reste :**
- **L'application Android de comptoir** (SDK Clover, connecteurs, Payments API, tiroir, impression) : elle appelle
  les API ci-dessus avec une clé d'appareil. À bâtir dans Android Studio (hors de ce conteneur).
- Recherche client par téléphone, rabais/frais (Premium), contrôle gérant NIP (VIP).

**Développer :** `npm install` · `npm run dev` · `npm run typecheck` · `npm test` · `npm run build`. Règles pour
les agents : `AGENTS.md` ; journal : `WORKLOG.md`.
