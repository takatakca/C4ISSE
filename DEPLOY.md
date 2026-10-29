# DEPLOY — C4ISSE by TAKATAK (`VDV7XAH5TPB78`)

État : brouillon au portail développeur, scaffold de code déposé dans ce dépôt le 2026-10-28. Voici exactement ce qui reste, pour la vague portail (aucun secret ici — noms de variables seulement).

## 1. Developer Dashboard (portail développeur Clover, compte 9KJ25ATT15TTW)

- [ ] Ouvrir l'app `VDV7XAH5TPB78` → vérifier nom, pays (Canada), type d'app.
- [ ] **Permissions** à demander : Orders R/W · Inventory R · Payments W (flux) · Customers R/W · Employees R · Merchant R (justifications dans `docs/listing/` quand un package existe).
- [ ] **OAuth** : régler l'URL de redirection à `{APP_BASE_URL}/api/clover/connect/callback`.
- [ ] **Webhooks** : régler l'URL à `{APP_BASE_URL}/api/clover/webhooks`, abonner les événements : O, P, I, A ; coller le `verificationCode` reçu au premier POST ; noter le code d'auth du webhook → variable `CLOVER_WEBHOOK_AUTH` (coffre/serveur, jamais ici).
- [ ] **Facturation App Market** : créer les 3 plans d'abonnement — **Base 50 $/mois · Premium 100 $/mois · VIP 150 $/mois** (CAD) et y associer les fonctionnalités du README. Les 3 plans couvrent aussi le module caisse-photo (Premium/VIP) — aucun plan séparé « Picture Register ».
- [ ] **Fiche marketplace** : téléverser description FR/EN + légaux depuis `docs/listing/` ; icône, couverture et captures (voir la liste de contrôle du package ; couvertures premium dans `~/workspace/clover-apps/assets-premium/` quand elles existent) ; vidéo de démo à tourner depuis le prototype.
- [ ] **Picture Register (`J0H36VTJBSBBP`) : NE PAS soumettre comme app distincte** — c'est le module caisse-photo de C4ISSE (correction de Matt, 2026-10-28 18:30 ; voir `docs/modules/picture-register.md`). Le brouillon portail reste en place, aucune suppression ; aucune permission, aucun plan de facturation, aucune fiche séparés pour lui. Ses fonctions se règlent ici, dans l'app C4ISSE.

## 2. Variables d'environnement (serveur de l'app — noms seulement)

`CLOVER_APP_ID` (= `VDV7XAH5TPB78`) · `CLOVER_CLIENT_ID` · `CLOVER_CLIENT_SECRET` · `CLOVER_WEBHOOK_AUTH` · `CLOVER_API_BASE` · `APP_BASE_URL` · `DATABASE_URL`

## 3. Test

- [ ] Installer l'app sur le marchand de test et compléter le flux OAuth (connect/start → callback).
- [ ] Déclencher un événement de chaque type abonné et vérifier la réception au webhook (200, en-tête X-Clover-Auth validé).
- [ ] Suivre les instructions de test du package (`docs/listing/PACKAGE.md`) pour la revue Clover.

## 4. Soumission

- [ ] Soumettre pour révision seulement quand la fiche, les plans et les tests ci-dessus sont verts.

## 5. Mise en ligne de l’app (Coolify) — ajouté 2026-10-28

Le code est maintenant une vraie application Next.js 16 (OAuth Clover, webhooks, base de données, tableau de bord).
Adresse proposée : `https://c4isse.on2go.ca` (à créer dans le DNS ; toute autre adresse https fonctionne).

### 5.1 Coolify (propriétaire)

1. Coolify → **New resource → Public/Private repository** → `takatakca/C4ISSE` → branche `main`
   (après fusion de la PR) → **Build pack : Dockerfile** → port **3000** → domaine `https://c4isse.on2go.ca`.
2. Base de données : Coolify → **New resource → PostgreSQL 16** (une par app, ou une base partagée avec un utilisateur
   par app) → copier l'URL interne dans `DATABASE_URL`. Les tables se créent seules au premier appel.
3. Variables d'environnement (Runtime) — **noms seulement ici, valeurs dans Coolify** :

| Variable | Valeur |
|---|---|
| `CLOVER_APP_ID` | `VDV7XAH5TPB78` |
| `CLOVER_CLIENT_SECRET` | App Secret (Developer Dashboard → app `VDV7XAH5TPB78` → App Settings) |
| `CLOVER_WEBHOOK_AUTH` | code d'auth du webhook (après la vérification, étape 5.2) |
| `CLOVER_API_BASE` | `https://api.clover.com` (sandbox : `https://apisandbox.dev.clover.com`) |
| `APP_BASE_URL` | `https://c4isse.on2go.ca` |
| `DATABASE_URL` | URL PostgreSQL de Coolify |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` (scelle les jetons Clover des marchands — ne jamais la changer après) |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `ADMIN_TOKEN` | `openssl rand -hex 24` |
| `OWN_MERCHANTS` | `YJ4W50YPJQSQ1` (On2GO.CA) et nos autres marchands : forfait VIP, jamais facturés |
| `NEVER_WRITE_MERCHANTS` | `RNVTBYMCKXEJ1` (On2GO.ca dormant — lecture seule) |
| `FOODHUB_URL` / `FOODHUB_SUITE_SECRET` | facultatif — lien Suite TAKATAK (voir 5.3) |

4. Deploy. Vérifier `https://c4isse.on2go.ca/api/health` → `"ok": true`, `"storageMode": "postgres"`, `"missing": []`.
5. Tâche planifiée Coolify (toutes les 5 min) : `curl -fsS -H "Authorization: Bearer $ADMIN_TOKEN" https://c4isse.on2go.ca/api/cron`.

### 5.2 Developer Dashboard Clover (app `VDV7XAH5TPB78`)

- **App Settings → Site URL** : `https://c4isse.on2go.ca` · **Alternate Launch Path** : `/api/clover/connect/callback`
- **REST Configuration → Default OAuth Response** : `Code`
- **Webhooks → URL** : `https://c4isse.on2go.ca/api/clover/webhooks` → Clover envoie un `verificationCode` : il apparaît dans les
  journaux Coolify (`[c4isse] Clover webhook verification code: …`) et ici :
  `curl -H "Authorization: Bearer $ADMIN_TOKEN" https://c4isse.on2go.ca/api/clover/webhooks` → le coller dans le Dashboard →
  copier le code d'auth affiché dans `CLOVER_WEBHOOK_AUTH` → redeploy.
- Événements : O, P, I, A.
- Plans de facturation : les noms doivent contenir **Base**, **Premium** ou **VIP** (l'app lit le palier depuis le nom du plan).
- Légaux : `https://c4isse.on2go.ca/legal/privacy`, `/legal/terms`, `/legal/confidentialite`, `/legal/conditions` (si présents dans `docs/legal/`).

### 5.3 Suite TAKATAK (facultatif, avec Food Hub)

Food Hub (Coolify) : `FOODHUB_SUITE_C4ISSE_URL=https://c4isse.on2go.ca/api/suite/events` et
`FOODHUB_SUITE_C4ISSE_SECRET=<openssl rand -hex 32>` ; ici : `FOODHUB_URL=https://foodhub.on2go.ca` et
`FOODHUB_SUITE_SECRET=<la même valeur>`. Contrat : `takatakca/foodhubca` → `docs/TAKATAK_SUITE.md`.

### 5.4 Test sur le marchand de test

Installer l'app sur le marchand de test → l'ouvrir depuis le tableau de bord Clover → on arrive sur
`https://c4isse.on2go.ca/app` connecté. Déclencher une commande / un paiement → vérifier dans les journaux que le webhook passe (200).

### 5.5 Ce qui reste (code)

Voir `README.md` › « État du code ».
