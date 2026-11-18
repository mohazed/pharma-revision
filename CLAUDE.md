# PharmaRévision — guide pour Claude

Site statique gratuit de révision pour la 3e année de pharmacie (Faculté de Pharmacie d'Alger). Spécification : `PLAN.md`. Format du contenu : `content/SCHEMA.md`.

## Règles absolues
- **100 % français** : chaque texte visible, `aria-label`, titre de page, meta description, message d'erreur, état vide. `<html lang="fr">`. Nombres au format français (`0,5`) via `src/lib/format.ts`.
- **Contenu = faits du cours uniquement.** Aucune connaissance extérieure. Chaque QCM cite sa source (page + extrait).
- **Respecter content/SCHEMA.md** et lancer `node scripts/validate-content.mjs` (inclus dans `npm run build`) après toute modification de content/.
- **IDs stables** : ne jamais renuméroter des questions/cartes existantes (la progression des visiteurs est indexée par ID).
- **Vie privée** : aucun compte, aucun cookie, progression uniquement dans le navigateur (localStorage, schéma versionné dans `src/lib/store.ts`). **Ne jamais ajouter d'autre traceur que Vercel Web Analytics** (anonyme, sans cookies ; événements personnalisés sans donnée personnelle, voir `src/lib/evenements.ts`).
- **Pied de page sur toutes les pages** : « Réalisé par Aymen Zouad » (dans `src/layouts/Base.astro`).
- Accessibilité : navigation clavier, focus visible, `prefers-reduced-motion` respecté, contraste AA.

## Architecture
- **Astro (sortie statique) + îlots React + TypeScript + Tailwind v4 + Framer Motion.** `npm run build` → `dist/` (Vercel).
- `src/lib/content.ts` : charge `content/**/*.json` au build (`import.meta.glob`). Fusionne les questions d'annales (`content/annales/*.json`, champ `cours`) dans le cours correspondant ; `cours: null` → « Hors cours actuel ». Les dossiers commençant par `_` (ex. `content/_exemple/`) sont ignorés en production (inclus en dev ou avec `PHARMA_EXEMPLE=1`).
- `src/pages/data/*.json.ts` : endpoints statiques (`/data/index.json`, `/data/cours/<chemin>.json`, `/data/annales.json`, `/data/flashcards.json`, `/data/glossaire.json`, `/data/recherche.json`) chargés par les îlots côté navigateur.
- Pages : `index` (accueil), `modules/[module]`, `cours/[...path]` (onglets QCM · Flashcards · Fiche · Cas cliniques · Calculs · Structures · Tableaux · Mnémos, affichés seulement s'il y a du contenu), `entrainement` (configurer une session), `qcm` (lecteur), `resultats`, `flashcards`, `examens-blancs`, `annales`, `erreurs`, `glossaire`, `recherche`, `parametres`, `a-propos`, `hors-ligne`, `404`.
- Logique : `scoring.ts` (barème, testé), `srs.ts` (répétition espacée SM-2, testé), `calcul.ts` (variables aléatoires, tolérance ±1 %, testé), `session.ts` (création des sessions), `store.ts` (progression locale).
- PWA : `public/manifest.webmanifest`, icônes `public/icons/` (`npm run icons`), service worker généré au build par `scripts/astro-service-worker.mjs` à partir de `scripts/sw-template.js`.

## Design
Direction « Officine moderne », palette Émeraude, clair par défaut. **Tous** les jetons (couleurs, polices, arrondis, ombres, durées, motif) sont dans `src/styles/theme.css` ; les composants signature (propositions de QCM, Erlenmeyer, flashcards 3D, boutons SRS, confettis) dans `src/styles/composants.css`. Attributs `data-theme` (light/dark) et `data-motion` (full/reduced) sur `<html>`. Ne pas coder de couleur en dur dans les composants. Maquette de référence : `design/directions.html` (Direction 1).

## Commandes
- `npm run dev` · `npm run build` (valide le contenu puis construit) · `npm run preview` · `npm test` (vitest)
- Slash commands : `/sync-courses` (synchroniser le Drive), `/ajouter-cours <lien|fichier>`, `/plus-de-qcm <module/NN-cours> [N]`.
