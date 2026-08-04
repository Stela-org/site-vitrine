# Les gardiens du site vitrine

Onze scripts de non-régression vivent dans `scripts/`. Jusqu'au lot VITRINE-CI,
ils ne s'exécutaient **que** si quelqu'un pensait à taper `npm run check`. Aucun
`.github`, aucun hook git, et le `buildCommand` de Vercel ne lance qu'`astro
build`. Autrement dit : un push pouvait casser un lien interne, malformer un
JSON-LD, réintroduire « Avistars » ou supprimer un Payment Link Stripe, et
partir en production sans la moindre alerte.

Depuis ce lot, `.github/workflows/gardiens.yml` les exécute **à chaque push et à
chaque pull request**.

## Ce que couvre chaque gardien

| Gardien | Commande | Ce qu'il empêche | Statut en CI |
|---|---|---|---|
| copy | `npm run lint:copy` | tirets cadratins interdits dans la copie | **bloquant** |
| brand | `npm run check:brand` | toute réapparition de « Avistars » après le rebrand Stela | **bloquant** |
| links | `npm run check:links` | lien interne mort, page orpheline, canonical malformé | **bloquant** |
| schema | `npm run check:schema` | JSON-LD invalide (SEO/GEO : c'est ce que lisent les moteurs et les IA) | **bloquant** |
| stripe | `npm run check:stripe` | Payment Link LIVE supprimé ou montant faux : perte de chiffre d'affaires directe | **bloquant** |
| alt | `npm run check:alt` | `<img>` sans `alt` (accessibilité + SEO images) | **bloquant** |
| channels | `npm run check:channels` | écart entre les canaux affichés et les canaux réellement supportés | **bloquant** |
| analytics | `npm run check:analytics` | script Google chargé avant consentement, conversion non câblée, email en clair, `/merci-essai` indexée | **bloquant** |
| partner | `npm run check:partner` | format de code partenaire cassé, décoration Stripe ou péremption 90 j perdue | **bloquant** |
| cookies | `npm run check:cookies` | récidive de l'incident CSP/GA4 : bannière rejouée sur mobile, hit GA4 bloqué par la CSP de production | **bloquant** (navigateur) |
| devis | `npm run check:devis` | parcours de devis en panne silencieuse (POST-Redirect-GET, confirmation sans JS, 4 erreurs serveur) | **bloquant** (navigateur) |
| overflow | `npm run check:overflow` | scroll horizontal, 14 pages × 4 largeurs | **bloquant** (navigateur) |
| cities | `npm run check:cities` | pages villes trop courtes ou trop clonées (« doorway pages ») | *alerte* |
| npm audit | `npm audit --audit-level=high` | dépendance vulnérable | *alerte* |

## Pourquoi deux niveaux

**Bloquant = déterministe.** Ces gardiens ne dépendent que du contenu du dépôt.
Ils ne peuvent virer au rouge que si quelqu'un a cassé quelque chose. Leur
échec est donc toujours une information exploitable, et bloquer est la bonne
réponse.

**Alerte = peut rougir sans qu'une ligne du site ait bougé.**

- `npm audit --audit-level=high` dépend du flux mondial des CVE. Une
  vulnérabilité publiée ce matin dans une dépendance transitive d'`astro`
  n'a aucun rapport avec le changement poussé, et n'a souvent aucun impact sur
  un site **statique**. La brancher en bloquant, c'est accepter qu'un
  correctif d'une faute de frappe reste bloqué à cause de la chaîne de
  dépendances de quelqu'un d'autre. À traiter, mais sur son propre rythme.
- `check:cities` impose des **seuils** de contenu (≥ 1100 mots, ≥ 40 % de
  contenu unique). Un seuil frôlé est un signal éditorial, pas une régression
  de code. Aujourd'hui la marge est confortable (1114 mots minimum, 75,5 % de
  contenu unique) ; le jour où une réécriture passe dessous, c'est une décision
  de contenu à prendre, pas un déploiement à bloquer.

Les trois gardiens **navigateur** (`cookies`, `devis`, `overflow`) sont
**bloquants**, contrairement à la recommandation initiale de les traiter comme
fragiles. Raison : ils passent aujourd'hui, ils servent le HTML construit depuis
un serveur local (aucun réseau externe, donc aucune dépendance à un tiers), et
`check:devis` s'est déjà vu doter d'un garde-temps global qui le fait échouer
bruyamment plutôt que pendre. Surtout, `check:cookies` est le test écrit **après**
l'incident CSP/GA4 qui a coûté deux jours de données : le classer en simple
avertissement reviendrait à ne pas l'avoir écrit. Si l'un d'eux devient
réellement instable en CI (flakiness constatée, pas supposée), le déplacer dans
le job `alerte` est une modification d'une ligne : mais qu'on le constate
d'abord.

## Quoi faire quand un gardien échoue

1. **Lire le message.** Chacun de ces scripts nomme le fichier, la page et la
   valeur fautive. Aucun ne se contente d'un code de sortie.
2. **Reproduire en local**, à l'identique de la CI :
   ```bash
   npm ci
   npx astro build          # obligatoire : la plupart des gardiens lisent dist/
   npm run check:<gardien>
   ```
   Pour les gardiens navigateur, ajouter une fois `npx playwright install chromium`.
3. **Réparer la cause, pas le gardien.** Abaisser un seuil ou retirer une page
   d'une liste, c'est éteindre l'alarme. Si le seuil est vraiment devenu
   inadapté, le changer est une décision à part entière, à porter dans son
   propre commit et à expliquer.
4. **Job `alerte` au rouge** : ce n'est pas urgent, mais ce n'est pas rien.
   `npm audit` → planifier une montée de version. `check:cities` → repasser sur
   la page ville concernée.

## Ce que la CI ne fait volontairement pas

**Le `buildCommand` de Vercel n'a pas été touché.** Il reste :

```
astro build && (node scripts/indexnow-ping.mjs || true)
```

Puisque la CI GitHub couvre déjà chaque push et chaque pull request, rejouer les
gardiens au déploiement rallongerait **chaque** mise en production de plusieurs
minutes (dont l'installation d'un chromium) pour revérifier exactement le même
commit. Le déploiement resterait au surplus le mauvais endroit pour découvrir
un problème : on veut le savoir avant le merge, pas pendant la publication.

**Si Nicolas préfère l'inverse**, ceinture et bretelles avec un blocage au
déploiement, le changement à faire est de passer le `buildCommand` de
`vercel.json` à :

```
npm run check
```

`npm run check` contient déjà `astro build`, mais il faudrait alors y réintégrer
le ping IndexNow, et surtout ajouter une étape d'installation de chromium dans
l'environnement de build Vercel (sans quoi `check:cookies`, `check:devis` et
`check:overflow` échoueront à l'import de Playwright et bloqueront tout
déploiement). Compter plusieurs minutes de plus par déploiement, et un
déploiement bloqué le jour où une CVE `high` sort. Une version intermédiaire,
plus raisonnable : ne rejouer au déploiement que les gardiens déterministes
sans navigateur.
