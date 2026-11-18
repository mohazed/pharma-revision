# PharmaRévision

Site **gratuit** de révision pour la **3e année de pharmacie** (Faculté de Pharmacie d'Alger) : QCM corrigés tirés des cours, flashcards à répétition espacée, fiches, cas cliniques, exercices de calcul, structures chimiques, tableaux, mnémotechniques, glossaire, examens blancs et annales.

- Sans compte, sans cookies : la progression reste dans le navigateur (export / import possibles).
- Installable sur téléphone (PWA) et utilisable hors ligne.
- Mesure d'audience anonyme et sans cookies (Vercel Web Analytics).

Réalisé par Aymen Zouad.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:4321 (inclut le cours d'exemple content/_exemple)
npm test           # tests unitaires (barème, répétition espacée, calculs)
npm run build      # valide content/ puis construit le site statique dans dist/
npm run preview    # sert dist/ en local
```

Pour inclure le cours d'exemple dans un build : `PHARMA_EXEMPLE=1 npm run build`.

## Ajouter ou mettre à jour du contenu

Le contenu est uniquement des fichiers JSON dans `content/` (format décrit dans `content/SCHEMA.md`). Ajouter un cours = ajouter un dossier, sans toucher au code. Avec Claude Code :

- `/sync-courses` : compare le Google Drive avec `content/`, génère les cours nouveaux ou modifiés, valide, construit et publie ;
- `/ajouter-cours <lien Drive ou fichier>` : ajoute un cours précis ;
- `/plus-de-qcm <module/NN-cours> [N]` : ajoute N questions à un cours sans doublon.

Toujours lancer `node scripts/validate-content.mjs` (automatique dans `npm run build`).

## Personnaliser le design

Toute l'identité visuelle est dans `src/styles/theme.css` (couleurs, polices, arrondis, ombres, animations, motif de fond) et `src/styles/composants.css`. Le thème clair/sombre et l'intensité des animations passent par les attributs `data-theme` et `data-motion` de `<html>`.

## Déploiement

Site statique prêt pour Vercel (`vercel.json`) : connecter le dépôt GitHub, chaque `git push` déclenche un déploiement.

## Signaler une erreur

Bouton « ⚑ Signaler » sous chaque question, ou [ticket GitHub](https://github.com/mohazed/pharma-revision/issues/new).
