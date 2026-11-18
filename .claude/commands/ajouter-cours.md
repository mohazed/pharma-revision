---
description: Ajoute un cours à partir d'un lien Google Drive ou d'un fichier local, en suivant content/SCHEMA.md.
argument-hint: <lien Drive | chemin local> [module]
---

# /ajouter-cours — Ajouter un cours

Source fournie : `$ARGUMENTS`

## 1. Récupérer le fichier
- **Lien ou ID Google Drive** : charge les outils Drive avec ToolSearch
  `select:mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__search_files,mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__read_file_content,mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__download_file_content,mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__get_file_metadata`
  puis récupère les métadonnées (`get_file_metadata` : nom, `modifiedTime`) et le texte (`read_file_content`, ou `download_file_content` + extraction ; OCR si scanné).
- **Fichier local** : lis-le directement (PDF : par pages ; PPTX/DOCX : extraction du texte). Mets `source.driveId` à `"local"` si aucun ID Drive n'est connu.

## 2. Déterminer l'emplacement
- Module : d'après l'argument, le dossier Drive parent ou le contenu (slugs dans `content/modules.json`). En cas de doute, demande.
- Dossier : `content/<module>/<NN-slug>/` (`NN` = ordre du cours, deux chiffres) ou `content/<module>/td/<NN-slug>/` pour un TD.
- Vérifie qu'aucun cours existant n'a le même `source.driveId` (sinon, c'est une mise à jour : conserve les IDs valides).

## 3. Générer le contenu
Suis **content/SCHEMA.md** à la lettre : `cours.json`, `qcm.json` (30–100+ selon la longueur), `flashcards.json`, `fiche.json`, `cas.json` si pertinent, `calculs.json` s'il y a des formules, `structures.json` seulement avec des SMILES certains, `tableaux.json`, `mnemos.json`, et les termes dans `content/glossaire/<module>.json`.
Règles : français uniquement, faits du cours uniquement, tout le cours couvert, une seule réponse défendable, source (page + extrait < 25 mots) pour chaque QCM, style EMD.
Rattache les questions d'annales `"cours": null` que ce cours couvre.

## 4. Valider
```bash
node scripts/validate-content.mjs
npm run build
```
Corrige jusqu'à ce que tout passe. Puis propose à l'utilisateur de commit et pousser (ou fais-le s'il l'a demandé) :
```bash
git add content/ && git commit -m "contenu : ajout du cours <titre>" && git push
```
