# POS — CAISSE EN MAGASIN · TAKATAK — Commande tactile

Le prototype de la **caisse du personnel** de Matt : un écran de point de
vente paysage, dense et rapide, modélisé sur la photo de caisse McDonald's
qu'il a fournie — mais chargé avec **ses items réels** (les 198 items /
19 catégories du catalogue maître v3, prix succursale, dérivés du menu
Clover de son marchand On2GO.CA, 6280 Somerled).

C'est le volet **employé** du produit « TAKATAK — Commande tactile » ;
la borne **client** (portrait) vit dans `~/workspace/kiosque-tactile/`.
Le branchement réel sur Clover est documenté dans
[CLOVER-INTEGRATION.md](CLOVER-INTEGRATION.md).

## Lancer le prototype

Aucun build. Servir le dossier `~/workspace` en statique, puis ouvrir le POS :

```bash
cd ~/workspace
python3 -m http.server 8080
# → http://localhost:8080/pos-caisse/
```

(Le serveur doit partir de `~/workspace` : les photos des items sont lues
dans `../meta-deploiement/photos-fiches-ppp/`, 161 photos réelles.
`data/menu.json` est la copie locale du menu — même source que la borne.)

## L'écran, zone par zone (référence : la photo)

| Zone | Dans la photo | Ici |
|---|---|---|
| Barre du haut | Nom du resto, date d'affaires, POS nº, Recall / Get Delivery Order / Get Mobile Order / Manager | « TAKATAK. POS — CAISSE », On2GO.CA — 6280 Somerled, horloge en direct, POS nº 1, **RAPPEL / COMMANDE LIVRAISON / COMMANDE MOBILE / MANAGER** |
| Rangée de chiffres | Quantités 0–9 | Touches 0–9 + affichage « QTÉ SUIVANTE × N » + ⌫ EFFACER : la quantité tapée s'applique au prochain item |
| Bande latérale | C / S / M / L / XL (grandeurs) + EVM | **P / M / G** (grandeurs de Slush, contextuelles), **TRIO / COMBO** (applique la formule quand un item est en configuration), EFFACER CHOIX, ANNULER |
| Centre | Onglets de catégories colorés + grille de boutons items photo/nom/prix | Les **19 vraies catégories** en boutons colorés ; grille dense photo + nom court + prix |
| Bas du centre | Rangée des marques de breuvages (Coca-Cola, Sprite, Dr Pepper…) | Rangée des **marques réelles du menu** quand la catégorie Breuvages est active (Pepsi, Coca-Cola/Coke, 7UP, Root Beer, Orange Crush, Cream Soda, Ginger Ale, Diet Pepsi, Bouteille d'eau, Slush) |
| Panneau de droite | La vente en cours, sous-total/taxe/total, monnaie, « END OF SALE » | **VENTE — Commande #92**, lignes avec sous-lignes de modificateurs, **Sous-total / TPS 5 % / TVQ 9,975 % / TOTAL**, boutons SUR PLACE / EMPORTER / LIVRAISON, AFFICHE PRIX, ANNULER LIGNE, VIDER VENTE, COMPTANT / CARTE / TOTAL |
| Flux modificateurs | Les choix remplacent la grille (Change Sides, Make/Change…) | Toucher un item avec groupes remplace la grille par de **gros boutons de choix** : groupes requis d'abord, compteurs « 3/3 », barre de progrès, EFFACER CHOIX, prix unitaire en direct, AJOUTER À LA VENTE verrouillé tant qu'un groupe requis est incomplet |
| Comptant | Montant remis, « Change » calculé | Clavier + montants rapides (5/10/20/50/100/exact), **monnaie calculée, arrondie au 5 ¢, répartie en coupures** |
| Carte | Terminal Verifone sous l'écran | Modale simulée — le réel ira au terminal Clover (voir CLOVER-INTEGRATION.md) |

Les numéros de commande commencent à **92**, comme sur la photo
(« Order Id: 92 »), puis incrémentent à chaque vente complétée.

## Les règles de menu appliquées (les mêmes que la borne)

La logique de modificateurs est **copiée inchangée** de la borne
(kiosque v2/v3) — mêmes décisions de Matt :

- **TRIO +5,00 $** (petite frite + breuvage) / **COMBO +7,00 $** (petite
  poutine + breuvage) : plats principaux seulement — jamais dans un item
  Trio, une salade, un dessert, une brochette ou un accompagnement.
- **Inclus comptés** : sauces et breuvages inclus des items MCX lus dans le
  nom et **exigés au compte exact** (ex. Poulet frit 15 MCX = 3 sauces +
  4 breuvages, ni plus ni moins).
- **Bols Choix du Chef** : composants fixes affichés, 1 sauce
  (César/Italienne/Française/Aucune), breuvage extra = seul ajout payant.
- **Slush** : Couleur + Grandeur (Petit +0 / Moyen +0,58 $ / Grand +1,34 $),
  aussi via les touches P / M / G de la bande latérale.
- **Pizza** : **format requis d'abord** (8″ inclus ; surcharges 10″/12″/
  14″ selon l'échelle de la pizza — Napolitaine +4,79/+9,90/+15,59 $,
  Bacon +5,99/+12,59/+17,99 $, autres +5,99/+12,30/+17,99 $), puis
  **trois groupes d'extras séparés** : *Extra pizza — Fromage* (l'extra en
  quantité, 3,99 $), *Extra pizza — Garniture* (7 options **nommées** du
  catalogue, 2,00 $ chacune), *Extra pizza — Viande* (8 options **nommées**
  du catalogue, 3,99 $ chacune), chaque option avec son propre pas-à-pas.
  **Double 2x** : saveur de la Pizza #1 **et** de la Pizza #2, mêmes trois
  groupes d'extras séparés par pizza. *Pain Magique* : un pain, pas une
  pizza — ni format ni extras pizza.
  **Note d'honnêteté** : les prix des extras par format et les groupes de
  modificateurs réels du marchand seront lus dans les vrais groupes
  Clover au branchement des apps (voir `CLOVER-INTEGRATION.md`) ; le
  prototype facture les extras aux prix catalogue en succursale
  (3,99 / 2,00 / 3,99 $).
- Taxes : **TPS 5 % + TVQ 9,975 %**, arrondies au cent.

Hypothèses héritées de la borne (à valider contre les vrais groupes
Clover) : les listes de saveurs de sauces incluses (BBQ, Miel et ail,
Piquante, Aigre-douce, Ranch, Buffalo) et de couleurs de Slush ne sont pas
dans le menu.json — les prix, eux, viennent toujours des données.

## Vérifications (faites le 2026-10-26)

- **Syntaxe JS** : `node --check` sur le script extrait — OK.
- **Tests de logique** : `node tools/test-logique.js` →
  **52/52 réussis** (données réelles, groupes par catégorie, comptes
  inclus, prix unitaires, validation au compte exact, totaux TPS/TVQ,
  fusion/annulation de lignes, monnaie et répartition des coupures).
  Dont la **correction pizza du 2026-10-26** (signalée par Matt : l'ancien
  groupe combiné « Extras pizza » ne permettait pas de choisir quelle
  viande ni quelle garniture, et il n'y avait pas de format) : sans
  format = configuration invalide ; Napolitaine 14″ = 10,00 + 15,59
  = 25,59 $ ; 2 viandes différentes = 2 × 3,99 $ ; garnitures nommées
  à 2,00 $ chacune ; ancien groupe combiné absent partout.
- **Serveur statique** : page, `data/menu.json` et une photo réelle → HTTP 200.
- **Parcours réel dans Chrome (Puppeteer)** : 19 catégories et items
  rendus ; ouverture des modificateurs du Poulet frit 15 MCX ; groupes
  comptés remplis (3 sauces + 4 breuvages) → AJOUTER déverrouillé ; vente
  complétée au comptant (47,99 $ → TPS 2,40 $ → TVQ 4,79 $ → total
  55,18 $ ; 60,00 $ remis → monnaie 4,80 $ arrondie au 5 ¢) ; reçu
  généré, commande #92. Aucune erreur JS (seul 404 : favicon).
- **Captures 1280×800** dans `captures/` :
  `pos-1280x800.png` (écran principal), `pos-modificateurs-1280x800.png`
  (groupes comptés), `pos-vente-completee-1280x800.png` (vente terminée),
  `pos-pizza-config-1280x800.png` et `pos-pizza-config-viandes-1280x800.png`
  (configuration pizza corrigée : format 14″, garnitures et viandes
  nommées — Napolitaine 14″ + Gyros + Champignons = 31,58 $).

## Ce qui est simulé

Tout paiement (comptant = calcul seulement, carte = minuterie), l'historique
du RAPPEL (session seulement), les commandes livraison/mobile (aucune en
attente), le nº de commande. Rien ne sort de la machine : aucun appel
Clover, aucun compte touché. Le passage au réel est cartographié dans
[CLOVER-INTEGRATION.md](CLOVER-INTEGRATION.md) — l'app sandbox
« TAKATAK — Commande tactile » (`5YD2CHATX3Q18`) a déjà ses permissions
(Orders L+É, Customers L, Inventory L, Merchant L, Payments É).

## Ce que la photo avait et que le menu réel n'a pas (nommé, pas inventé)

- **Happy Meals, McCafé, « New Product Descriptions »** : aucune catégorie
  équivalente chez Matt — absent, pas simulé.
- **Grandeurs C/S/M/L/XL d'items** : son menu n'a pas de tailles d'items ;
  la bande latérale porte P/M/G (Slush) + TRIO/COMBO à la place.
- **Marques de la photo absentes de son menu** (Dr Pepper, Nestea, Diet
  Coke…) : la rangée du bas ne montre que ses marques réelles.
- **« EVM »** : son équivalent fonctionnel = les formules TRIO/COMBO.
- **Multi-terminaux (Way Station, POS 0002), cartes-cadeaux, programmes
  de la chaîne** : propres à McDonald's — hors périmètre.

## Images des options (2026-10-26)

Chaque option nommée des groupes modificateurs affiche une vignette
littérale style « épicerie » (résolution par libellé, constante `IMG_OPT`
dans la section interface de `index.html` — la logique pure n'est pas
touchée). Fichiers locaux dans `assets/extras/` (400×400, JPEG), jamais
de hotlink. Couverture : 64 libellés d'options imagés —

- **Réelles (photos libres, Wikimedia Commons)** : tomates, poivrons
  verts/rouges, olives vertes, oignons, fromage râpé, gyros, bacon,
  poulet cuit, pepperoni, shawarma, shish taouk.
- **Réelles (photos d'items du menu, inchangées)** : les 11 saveurs de
  pizza (groupes « Pizza #1/#2 — saveur ») et les 3 salades des bols.
- **Générées (autorisées par Matt pour les vignettes d'options
  seulement)** : olives noires, champignons, viande tacos, Philly steak,
  9 sauces/dressings, 6 couleurs de slush, 8 breuvages génériques (aucun
  logo), frite, poutine, croquettes, ailes, feta, riz, pita, protéine
  grillée.
- **Sans image (volontaire)** : formats de pizza (8″/10″/12″/14″),
  grandeurs (P/M/G, Petit/Moyen/Grand), « Aucune » (sauce des bols),
  « Item seulement ».

Les photos des PLATS/items restent réelles, jamais générées ni modifiées.

## Fichiers

- `index.html` — le POS complet (un seul fichier : styles, écran, logique).
- `data/menu.json` — copie du menu réel (source : catalogue maître v3).
- `tools/test-logique.js` — tests Node de la logique pure.
- `CLOVER-INTEGRATION.md` — cartographie fonction → API/SDK Clover,
  authentification, chemin vers l'App Market.
- `captures/` — captures d'écran paysage 1280×800 vérifiées.
