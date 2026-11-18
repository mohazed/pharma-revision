---
description: Génère N QCM supplémentaires pour un cours, sans doublon avec les questions existantes.
argument-hint: <module/NN-cours> [N=20]
---

# /plus-de-qcm — Ajouter des QCM à un cours

Arguments : `$ARGUMENTS` (chemin du cours relatif à content/, ex. `pharmacologie/03-absorption`, puis le nombre N de questions, 20 par défaut).

1. Lis `content/<cours>/cours.json` et `content/<cours>/qcm.json`. Note le plus grand numéro d'ID (`qcm-NNN`) et dresse la liste des notions déjà couvertes (énoncés, tags, `source.page`).
2. Récupère le texte du cours : depuis Google Drive avec `source.driveId` (charge les outils via ToolSearch :
   `select:mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__read_file_content,mcp__168fe8f7-f94e-439a-a1eb-bf783a8f4285__download_file_content`), ou depuis un fichier local si l'utilisateur en fournit un.
3. Repère les sections ou pages **les moins couvertes** et génère N nouvelles questions qui :
   - ne reformulent pas une question existante (même notion + même piège = doublon) ;
   - suivent content/SCHEMA.md (5 options, `correctes`, `explication`, `source.page` + `source.extrait`, `difficulte`, `tags`, `origine: "genere"`) ;
   - respectent le style EMD (majorité de « multiple », distracteurs qui diffèrent d'un mot précis, catch-alls en e) ;
   - n'utilisent **que** des faits du cours, en français.
4. Ajoute-les à la fin de `qcm.json` avec des IDs qui continuent la numérotation (ne jamais renuméroter les anciens : la progression des étudiants en dépend).
5. Relis chaque nouvelle question contre l'extrait source ; supprime toute question ambiguë.
6. `node scripts/validate-content.mjs` puis `npm run build`. Résume : N questions ajoutées, pages couvertes. Commit/push seulement si l'utilisateur l'a demandé.
