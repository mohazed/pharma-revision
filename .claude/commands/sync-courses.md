---
description: Synchronise le dossier Google Drive des cours avec content/ (nouveaux cours ou cours modifiés), valide, construit, commit et pousse.
---

# /sync-courses — Synchroniser les cours depuis Google Drive

Objectif : détecter les cours nouveaux ou modifiés dans le Drive partagé, générer leur contenu en suivant **content/SCHEMA.md**, valider, construire, puis commit + push (Vercel déploie automatiquement).

Dossier Drive racine : `1mE-uri91SGdfW_0d_LEjIKmF-vqhXroM`. Les sous-dossiers de chaque module sont listés dans `content/modules.json` (champ `driveFolder`).

## 0. Charger les outils Google Drive
Les outils MCP Google Drive sont différés. Charge-les d'abord avec ToolSearch :

```
ToolSearch query: "select:mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__search_files,mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__read_file_content,mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__download_file_content,mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__get_file_metadata"
```

Si les outils sont indisponibles (connecteur déconnecté), arrête-toi et demande à l'utilisateur de reconnecter Google Drive (`/mcp`) ou de fournir les fichiers en local (voir `/ajouter-cours`).

## 1. Lister le Drive
- Utilise `search_files` avec une requête du type `'<driveFolder>' in parents` pour chaque module de `content/modules.json` (et récursivement pour les sous-dossiers « Cours » / « TD »). **Ignore les TP.**
- Pour chaque fichier (PDF, PPTX, DOCX…), note : `id`, `name`, `modifiedTime`.

## 2. Comparer avec le contenu existant
- Lis tous les `content/<module>/**/cours.json` et construis la table `source.driveId → source.modifiedTime`.
- **Nouveau** : `driveId` absent de content/. **Modifié** : `modifiedTime` du Drive plus récent que celui de cours.json.
- Affiche un récapitulatif (nouveaux / modifiés / inchangés) avant de générer.

## 3. Générer le contenu (pour chaque cours nouveau ou modifié)
- Lis le fichier avec `read_file_content` (ou `download_file_content` puis extraction locale ; OCR si c'est un scan).
- Choisis le dossier : `content/<module>/<NN-slug>/` (ordre = numéro dans le nom du fichier ; TD → `content/<module>/td/<NN-slug>/`).
- Produis **tous** les fichiers décrits dans content/SCHEMA.md : `cours.json` (avec `source.driveId`, `fichier`, `modifiedTime`), `qcm.json`, `flashcards.json`, `fiche.json`, `cas.json`, et selon le cours `calculs.json`, `structures.json`, `tableaux.json`, `mnemos.json`, plus les termes dans `content/glossaire/<module>.json`.
- Règles non négociables : **français uniquement**, **uniquement des faits présents dans le cours**, couvrir le cours du début à la fin, une seule clé de réponse défendable, source (page + extrait) pour chaque QCM, style EMD (5 propositions a–e, catch-alls en e).
- Pour un cours **modifié** : conserve les IDs existants des questions toujours valides (la progression des étudiants est indexée par ID), corrige ou supprime celles qui ne correspondent plus, ajoute les nouvelles avec de nouveaux numéros.
- Si des questions d'annales `content/annales/*.json` ont `"cours": null` et que le nouveau cours les couvre, mets à jour leur champ `cours`.

## 4. Valider et construire
```bash
node scripts/validate-content.mjs
npm run build
npm test
```
Corrige toutes les erreurs avant de continuer.

## 5. Publier
```bash
git add content/
git commit -m "contenu : synchronisation Drive (<liste des cours>)"
git push
```
Vercel construit et déploie automatiquement. Termine par un résumé : cours ajoutés / mis à jour, nombre de QCM, flashcards, etc.
