# Anciennes URL du site Avistars (mémoire du dossier `legacy/`)

> Document de **sauvegarde**, créé au LOT VIT-MENAGE au moment de supprimer
> `legacy/`. Le dossier contenait l'ancien site statique Avistars : 67 fichiers,
> jamais construits, jamais déployés. Deux informations méritaient de survivre
> à sa suppression, elles sont ici.

## 1. L'ancien domaine

`legacy/CNAME` portait une seule ligne : **`avistars.fr`**. C'est le domaine
sur lequel l'ancien site était servi. Les redirections d'hôte de `vercel.json`
le mentionnent toujours, avec `www.avistars.fr`.

## 2. Les 29 URL déclarées par l'ancien sitemap

Relevées dans `legacy/sitemap.xml` avant suppression. C'était la seule liste
exhaustive des URL qu'Avistars a exposées, donc des URL susceptibles d'être
encore indexées ou d'exister en lien entrant.

```
/
/blog/
/blog/avis-google-restaurant-bordeaux.html
/blog/avis-google-restaurant-brest.html
/blog/avis-google-restaurant-lyon.html
/blog/avis-google-restaurant-marseille.html
/blog/avis-google-restaurant-nancy.html
/blog/avis-google-restaurant-nantes.html
/blog/avis-google-restaurant-nice.html
/blog/avis-google-restaurant-paris.html
/blog/avis-google-restaurant-rouen.html
/blog/comment-avoir-plus-avis-google-restaurant.html
/blog/e-reputation-restaurant-guide-complet.html
/blog/qr-code-avis-google-restaurant.html
/blog/repondre-avis-negatif-google-restaurant.html
/blog/supprimer-mauvais-avis-google-restaurant.html
/cgv
/mentions-legales
/politique-confidentialite
/qui-sommes-nous
/restaurants-bordeaux
/restaurants-brest
/restaurants-lyon
/restaurants-marseille
/restaurants-nancy
/restaurants-nantes
/restaurants-nice
/restaurants-paris
/restaurants-rouen
```

## 3. Où elles mènent aujourd'hui

Les redirections vivent dans `vercel.json`, **jamais dans les fichiers
supprimés** : les effacer ne change rien au comportement du site.

Les règles de CHEMIN (sans condition d'hôte, donc actives partout) couvrent les
formes en `.html` : `/blog/:slug.html`, `/blog/avis-google-restaurant-:ville.html`,
`/restaurants-:ville.html`, `/qui-sommes-nous.html`, plus deux règles nominales
pour les deux articles renommés.

⚠️ **Point relevé au passage, non corrigé par ce lot.** Quinze des vingt-neuf
URL n'ont PAS d'extension `.html` (voir la liste : `/restaurants-bordeaux`,
`/cgv`, `/mentions-legales`, `/qui-sommes-nous`…). Sur l'hôte `avistars.fr`,
aucune règle de chemin ne les attrape : elles tombent sur la règle d'hôte
`/:path*` qui renvoie **vers l'accueil**, pas vers la page équivalente. Un lien
entrant vers `avistars.fr/restaurants-lyon` n'atterrit donc pas sur
`/restaurants-lyon` mais sur la page d'accueil. Ce n'est pas une régression de
ce lot, c'est l'état actuel des redirections ; le signaler est le but de ce
document.
