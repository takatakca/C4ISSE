# Module caisse-photo de C4ISSE — (ex-« TAKATAK Picture Register », `J0H36VTJBSBBP`)

**Correction de Matt, 2026-10-28 18:30 : « Picture Register, c'est C4ISSE ».** Ce document décrit le module caisse-photo **de C4ISSE** (`VDV7XAH5TPB78`). L'entrée portail « TAKATAK Picture Register » (`J0H36VTJBSBBP`) n'est pas un produit distinct : pas de fiche, pas de paliers, pas de dépôt séparés. Le brouillon portail reste en place, **non soumis comme app distincte**, aucune suppression.

## Ce que fait le module

Caisse visuelle du comptoir : le registre avec **photos des articles en grand** — pensée pour la vitesse et la formation du personnel (on touche la photo, pas un code). Les photos vivent sur notre CDN maison (Clover n'expose pas d'images d'articles aux tiers), clé = ID d'article Clover.

## Fonctions, par palier de C4ISSE (mapping existant — aucun prix nouveau)

Les paliers sont ceux de C4ISSE : **Base 50 $ · Premium 100 $ · VIP 150 $/mois**.

- **Premium 100 $/mois** — photos d'articles depuis notre CDN : grille photo des items par catégorie ; ajout au panier en un toucher ; photos des modificateurs et variantes ; recherche et scan SKU/code-barres ; rabais rapides ; verrouillage par employé.
- **VIP 150 $/mois** — full kit du module : synchronisation photo automatique quand un item est créé/modifié (webhooks Inventaire — la photo suit l'item partout : borne T4CTILE, ON2GO, sites) ; mode formation (photos + noms FR/EN affichés) ; même panier que l'écran de vente C4ISSE classique, deux interfaces.

## Permissions

Inventory R · Orders R/W · Payments W (flux) · Employees R — **déjà couvertes par les permissions de C4ISSE** (Orders R/W · Inventory R · Payments W (flux) · Customers R/W · Employees R · Merchant R). Aucune demande de permission séparée.

## Source du module

Le scaffold produit le 2026-10-28 pour l'entrée portail `J0H36VTJBSBBP` est conservé comme source du module dans `~/workspace/clover-apps-code/picture-register/` (9 fichiers : README, DEPLOY, scaffold webhook/OAuth `app/api/clover/`, `lib/clover/config.ts`, `config/app.config.json` — voir son fichier `FUSIONNE-DANS-C4ISSE.md`). À porter dans ce dépôt lors du build de C4ISSE ; les variables d'environnement du module sont celles de C4ISSE (noms seulement, aucun secret).

## Portail — ce qu'il ne faut PAS faire

- Ne pas soumettre `J0H36VTJBSBBP` pour révision comme app distincte.
- Ne pas créer de plans de facturation, de fiche marketplace ni de webhooks séparés pour lui.
- Ne pas le supprimer : le brouillon reste en place.
