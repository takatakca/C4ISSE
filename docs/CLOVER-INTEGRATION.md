# INTÉGRATION CLOVER — POS « Commande tactile » (caisse en magasin)

**Ce que ce document fait :** il relie chaque fonction du prototype `pos-caisse/index.html`
à son équivalent réel sur la plateforme Clover, sur le compte marchand réel de Matt.
Le prototype ne fait **aucun appel externe** — tout y est simulé localement.
Ce document est la carte pour transformer le prototype en vraie application
installable depuis le Clover App Market.

---

## 1. Les comptes et l'application en jeu

| Élément | Valeur (vérifiée) |
|---|---|
| Marchand de production | **On2GO.CA** — ID marchand `YJ4W50YPJQSQ1` (6280 Somerled, Montréal) |
| Marchand dormant | On2GO.ca `RNVTBYMCKXEJ1` — **ne jamais modifier** |
| Vitrine en ligne du marchand | https://www.clover.com/online-ordering/6280 |
| Application sandbox existante | **TAKATAK — Commande tactile**, ID `5YD2CHATX3Q18` (brouillon, Canada, privé) |
| Permissions déjà réglées sur l'app | **Orders L+É · Customers L · Inventory L · Merchant L · Payments É** (revérifiées le 2026-10-25) |
| Marchand test sandbox | `AF39HKD1Y6A21` (US) |
| Compte développeur | Organisation « Groupe TAKATAK » ; compte Production « Matthieu Wallace Barnard » |
| Package de soumission | `~/workspace/clover-apps/commande-tactile/` — PACKAGE.md (fiche complète FR/EN), `legal/` (politique de confidentialité FR, privacy policy EN, conditions FR, terms EN), `video-script.md` |
| Données du prototype | `data/menu.json` = catalogue maître v3 (prix succursale), lui-même dérivé du menu Clover d'On2GO.CA : 198 items, 19 catégories |

Le prototype est le **volet employé (caisse)** du même produit dont la borne
client est `~/workspace/kiosque-tactile/` : même menu, mêmes règles de
modificateurs, même application Clover « Commande tactile » à terme.

---

## 2. Fonction par fonction : prototype → Clover réel

### 2.1 Chargement du menu (catégories, items, photos, prix)

- **Prototype :** lit `data/menu.json` local ; les groupes de modificateurs sont
  **reconstruits par règles** à partir des noms et descriptions (la « logique
  pure » héritée de la borne : TRIO/COMBO, inclus comptés lus dans le nom des
  MCX, composants des Bols, etc.).
- **Réel :** l'app lit l'inventaire du marchand connecté, en direct :
  - REST : `GET /v3/merchants/{mId}/categories`, `GET /v3/merchants/{mId}/items?expand=modifierGroups,taxRates`,
    `GET /v3/merchants/{mId}/modifier_groups`, `GET /v3/merchants/{mId}/modifiers`.
  - Sur appareil Clover (Android) : le SDK Clover donne le même inventaire via
    les fournisseurs de contenu de l'appareil, sans appel réseau sortant.
  - **Différence clé, dite plainement :** la vraie app n'a pas à « deviner »
    les groupes — elle lit les **groupes réels du marchand**, avec leurs ID.
    Exemples de groupes réels déjà en place chez On2GO.CA : « 3 breuvages
    inclus » (`B8CJW1591FTE8`), « Pizza Choice #2 » (`DREXEHRAR6XHT`),
    « Sauce à salade — Bol » (`AAGJ151HN2Z70`). Les règles du prototype servent
    de filet de validation (comptes exacts, groupes requis), pas de source.
  - Photos : URL d'image des items de l'inventaire Clover ; le prototype lit
    les fichiers de `~/workspace/meta-deploiement/photos-fiches-ppp/`
    (161 photos réelles du menu).
- **Permission :** Inventory L. ✔ déjà réglée.

### 2.2 Taxes (TPS 5 % / TVQ 9,975 %)

- **Prototype :** taux codés en dur dans la logique (TPS 5 %, TVQ 9,975 %),
  taxes arrondies au cent, total = sous-total + taxes arrondies.
- **Réel :** chaque item Clover porte ses `taxRates` ; Clover calcule les
  taxes de la commande. L'app affiche les montants retournés par Clover.
  Aucun taux à maintenir dans l'app.
- **Permission :** Inventory L (lecture des taux rattachés aux items).

### 2.3 Créer la vente (commande)

- **Prototype :** lignes en mémoire locale ; « AJOUTER À LA VENTE » fusionne
  les configurations identiques ; le nº de commande part à 92 comme sur la
  photo de référence, puis incrémente dans la session.
- **Réel :**
  - `POST /v3/merchants/{mId}/orders` → crée la commande (état « open »).
  - `POST /v3/merchants/{mId}/orders/{orderId}/line_items` pour chaque ligne,
    avec `modifications` = les modificateurs choisis (IDs réels des groupes du
    marchand, §2.1) et `unitQty` = quantité.
  - Type de commande : le champ type de la commande Clover distingue
    **SUR PLACE / EMPORTER / LIVRAISON** (les trois boutons du panneau) ;
    les commandes en ligne (site Clover, Food Hub) arrivent dans le même
    système avec leur propre source.
  - **Impression cuisine :** une commande créée dans Clover suit le routage
    d'impression du marchand (imprimantes et étiquettes configurées sur ses
    appareils Clover) — l'app n'a rien à imprimer elle-même.
  - Le nº affiché devient le nº de commande Clover réel.
- **Permission :** Orders É. ✔ déjà réglée.

### 2.4 Annuler une ligne / vider la vente

- **Prototype :** ANNULER LIGNE retire la ligne sélectionnée du panneau
  (fonction pure testée) ; VIDER VENTE repart à zéro.
- **Réel :** `DELETE /v3/merchants/{mId}/orders/{orderId}/line_items/{lineItemId}`
  avant encaissement ; une ligne déjà payée passe par le flux de
  remboursement/annulation de Clover (droits caissier/gérant selon les rôles
  du marchand — bouton MANAGER, §2.7).
- **Permission :** Orders É. ✔

### 2.5 Paiement COMPTANT (avec monnaie)

- **Prototype :** clavier montant remis, monnaie calculée, **arrondi au 5 ¢**
  (le Canada n'a plus de pièces de 1 ¢) et répartition en coupures
  (100/50/20/10/5/2/1/0,25/0,10/0,05) — fonctions pures testées.
- **Réel :** l'encaissement comptant se déclare dans Clover comme un paiement
  avec le tender « Cash » du marchand (`POST /v3/merchants/{mId}/orders/{orderId}/payments`
  ou, sur appareil, le flux de paiement de l'appareil) ; le tiroir-caisse
  rattaché à l'appareil Clover s'ouvre par le matériel. Le calcul de monnaie
  reste côté app (Clover n'impose rien là-dessus) — la logique du prototype
  se réutilise telle quelle.
- **Permission :** Payments É. ✔ déjà réglée.

### 2.6 Paiement CARTE (semi-intégré — l'app ne voit jamais la carte)

- **Prototype :** modale « Traitement sur le terminal Clover… » simulée
  (1,4 s), puis vente complétée.
- **Réel (semi-intégré, le modèle Clover) :**
  - Sur un appareil Clover : l'app lance le paiement via le **SDK Android
    Clover (PaymentConnector / intention de paiement sécurisé)** ; le terminal
    Clover associé fait tout (tapotement, puce, NIP), l'app reçoit seulement
    le résultat approuvé/refusé.
  - Sur un écran non-Clover (ex. la borne/tablette Samsung du projet) :
    **Remote Pay** (Cloud Pay Display / REST Pay) — l'app envoie le montant
    au terminal Clover jumelé par le réseau, même principe : aucun numéro de
    carte ne transite par l'app. C'est une exigence PCI autant qu'un choix.
- **Permission :** Payments É. ✔

### 2.7 RAPPEL, COMMANDE LIVRAISON, COMMANDE MOBILE, MANAGER

- **Prototype :** RAPPEL liste les ventes complétées de la session ;
  LIVRAISON/MOBILE affichent « aucune en attente » ; MANAGER affiche un
  message d'accès réservé.
- **Réel :**
  - RAPPEL : `GET /v3/merchants/{mId}/orders` (récents, filtrables par état)
    — Orders L. ✔
  - LIVRAISON / MOBILE : les commandes des canaux en ligne du marchand
    (commande en ligne Clover, applications branchées comme TAKATAK Food Hub)
    sont des commandes Clover comme les autres ; l'app les liste par source/
    type et les rappelle au même panneau. Les webhooks Clover peuvent pousser
    l'arrivée d'une nouvelle commande à l'app au lieu d'un sondage.
  - MANAGER : fonctions sensibles (annulation post-paiement, rapports)
    gardées par les rôles employés du marchand ; l'app s'exécute avec le
    compte marchand connecté (voir §3) et Clover applique ses propres
    contrôles d'employé/NIP sur l'appareil.

### 2.8 Fidélité (aperçu, hors panneau de vente actuel)

- Le prototype POS ne fait pas de fidélité (c'est la borne qui identifie le
  client par téléphone). Si la caisse doit créditer des points :
  `GET /v3/merchants/{mId}/customers` par numéro de téléphone — **Customers L**,
  déjà réglée. Le programme complet vit dans l'app sœur « TAKATAK Fidélité ».

---

## 3. Authentification : comment l'app se branche au compte de Matt

Deux voies, selon l'écran :

1. **Appareil Clover (Station/Mini/Flex du marchand) — voie principale.**
   Application **Android native** (ou hybride avec WebView pour réutiliser
   cette interface HTML) publiée sur l'App Market. Une fois installée depuis
   le compte du marchand, l'app obtient son accès par le compte Clover de
   l'appareil (le SDK fournit le marchand et les jetons) — **aucun mot de
   passe à gérer**, aucun OAuth à coder pour ce cas.
2. **Écran non-Clover (tablette Samsung, poste Windows du comptoir).**
   Application **web** : le marchand installe l'app depuis l'App Market,
   Clover redirige vers l'URL de l'app avec un code ; l'app échange le code
   contre un jeton **OAuth 2.0** (flux standard Clover : `oauth/authorize` →
   jeton d'accès par marchand, à renouveler). Toutes les lectures/écritures
   passent alors par l'API REST v3 (§2) et les paiements par Remote Pay (§2.6).

Dans les deux cas : **un seul marchand à la fois, celui qui a installé
l'app** — pour On2GO.CA, l'installation se fait sur `YJ4W50YPJQSQ1`.

---

## 4. Simulé dans le prototype vs réel dans l'app

| Fonction | Prototype (aujourd'hui) | App réelle (cible) |
|---|---|---|
| Menu, prix, photos | Fichier local `data/menu.json` (copie du menu maître) | Inventaire Clover en direct du marchand |
| Groupes de modificateurs | Reconstruits par règles depuis noms/descriptions | Groupes et modificateurs réels (IDs) de l'inventaire |
| Taxes | TPS/TVQ codées, arrondi au cent | `taxRates` des items, calcul Clover |
| Nº de commande | Compteur de session dès 92 | Nº de commande Clover |
| Historique / RAPPEL | Ventes de la session seulement | Commandes Clover du marchand |
| Comptant | Calcul monnaie + répartition, sans tiroir | Tender Cash Clover + ouverture du tiroir |
| Carte | Minuterie simulée | Terminal Clover, semi-intégré (SDK ou Remote Pay) |
| Livraison / Mobile | Message « aucune en attente » | Commandes en ligne du compte, webhooks possibles |
| Imprimé de reçu | Reçu texte à l'écran | Imprimante de l'appareil Clover |
| Connexion | Aucune | Compte appareil (Android) ou OAuth 2.0 (web) |

---

## 5. Le chemin restant vers une app installable

1. **Interface** — ce prototype (POS paysage) + la borne portrait existante
   (`~/workspace/kiosque-tactile/`) : parcours et logique vérifiés par tests.
2. **Emballage technique** — au choix, à trancher avec le matériel visé :
   (a) coquille Android (WebView) reprenant ces écrans + pont SDK Clover pour
   paiements et inventaire appareil ; (b) réécriture native Kotlin des mêmes
   écrans. La voie (a) réutilise ~100 % de l'interface actuelle.
3. **Portail développeur** — l'app sandbox `5YD2CHATX3Q18` existe, permissions
   déjà réglées ; il reste : basculer/compléter la fiche en **Production**,
   téléverser l'APK (ou configurer l'URL web + redirection OAuth), prix et
   fiche (textes prêts dans le PACKAGE), couverture premium (le visuel
   « tactile » 1080×216 existe déjà dans `~/workspace/clover-apps/assets-premium/`).
4. **Tests réels** — installation sur le marchand test sandbox
   `AF39HKD1Y6A21` et sur un appareil/terminal de développement ; passer une
   vente complète comptant + carte ; vérifier l'impression cuisine.
5. **Soumission App Market** — le package est préparé (fiche FR/EN, légaux
   FR+EN, script vidéo) ; soumettre et répondre aux retours de révision
   Clover. Aucune soumission n'est faite par ce prototype.
6. **Mise en service** — installer depuis l'App Market sur le marchand
   **On2GO.CA `YJ4W50YPJQSQ1`**, jumeler le terminal de paiement, former le
   personnel sur un quart, puis basculer la caisse.

**Blocages connus (état au 2026-10-25, à revalider au moment de pousser) :**
les deux apps originales Food Hub et Phone AI sont en révision en Production
— sans effet sur cette app-ci ; l'accès au portail développeur se fait dans le
profil navigateur par défaut (jamais en parallèle avec le tableau de bord
marchand — règle des deux navigateurs de Matt).
