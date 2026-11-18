# Format du contenu PharmaRévision

All content is **French only**: every text field shown to users. JSON files, UTF-8, 2-space indentation.

## Layout

```
content/
  modules.json                      # list of modules (written by orchestrator)
  <module-slug>/
    <NN-cours-slug>/
      cours.json                    # metadata (required)
      qcm.json                      # array of Qcm (required, as many as possible)
      flashcards.json               # array of Flashcard
      fiche.json                    # Fiche
      cas.json                      # array of CasClinique
      calculs.json                  # array of Calcul (only where relevant)
      structures.json               # array of Structure (only where relevant)
      tableaux.json                 # array of Tableau + optional carte mentale
      mnemos.json                   # array of Mnemo
    td/<NN-td-slug>/...             # same layout, for the TD (≈10% of content)
  annales/<exam-slug>.json          # transcribed past exams
  glossaire/<module-slug>.json      # array of Terme
```

Module slugs: `pharmacologie`, `pharmacognosie`, `pharmacie-galenique`, `chimie-analytique`, `chimie-therapeutique`, `semiologie`.
Cours folder: two-digit order + slug, e.g. `03-absorption`, `11-sterilisation-partie-1`.

IDs must be globally unique and stable: `<module-slug>/<cours-folder>/<type>-<n>`, e.g. `pharmacologie/03-absorption/qcm-017`.

## cours.json
```json
{
  "id": "pharmacologie/03-absorption",
  "module": "pharmacologie",
  "ordre": 3,
  "titre": "Pharmacocinétique – Absorption",
  "type": "cours",                     // "cours" | "td"
  "source": { "driveId": "1vknCzz...", "fichier": "3. Pharmacocinétique - Absorption.pdf", "modifiedTime": "2026-10-13T21:38:27.922Z" },
  "resume": "Une phrase décrivant le cours."
}
```

## Qcm
```json
{
  "id": "pharmacologie/03-absorption/qcm-001",
  "type": "multiple",                  // "unique" (exactly 1 correct) | "multiple" (1+ correct, student doesn't know how many)
  "enonce": "Concernant la diffusion passive des médicaments :",
  "options": ["…", "…", "…", "…", "…"],   // exactly 5, displayed a–e
  "correctes": [0, 2],                 // indices of correct options
  "explication": "Pourquoi chaque option est juste ou fausse, 2-5 phrases.",
  "source": { "page": 7, "extrait": "short verbatim snippet (< 25 mots) from the course supporting the answer" },
  "difficulte": 2,                     // 1 facile, 2 moyen, 3 difficile
  "tags": ["diffusion passive"],
  "origine": "genere"                  // "genere" | "annale"
  , "annale": "EMD1 Pharmacologie 2023" // only when origine = "annale"
}
```
Exam style rules (Faculté de Pharmacie d'Alger, EMD): stem then 5 options a–e; "Cochez la ou les proposition(s) correcte(s)"; regularly use catch-alls like « Toutes les propositions sont correctes », « Toutes les propositions sont fausses », « Aucune réponse n'est juste » (place them as option e); distractors differ from right answers by one precise word (ordre un/zéro, augmente/diminue, acide/base…). Mostly "multiple".

## Flashcard
`{ "id", "recto": "question/terme", "verso": "réponse concise", "tags": [] }`

## Fiche
```json
{ "id", "titre", "sections": [ { "titre": "…", "points": ["…", "…"] } ],
  "aRetenir": ["…"], "pieges": ["…"] }
```
Points may use simple Markdown (**gras**, *italique*).

## CasClinique
```json
{ "id", "titre", "enonce": "Présentation du cas (patient, contexte)",
  "questions": [ Qcm-like objects without "source.page" requirement ] }
```

## Calcul
```json
{ "id", "titre", "enonce": "Texte avec variables {dose}, {vd}…",
  "variables": { "dose": { "min": 100, "max": 1000, "pas": 50, "unite": "mg" } },
  "formule": "dose / vd",              // JS expression over the variables, gives the answer
  "unite": "mg/L", "decimales": 2,
  "etapes": ["Étape 1 : C0 = Dose / Vd", "…"],
  "rappel": "Formule ou notion de cours" }
```

## Structure (chimie)
```json
{ "id", "nom": "Diazépam", "smiles": "CN1C(=O)CN=C(c2ccccc2)c2cc(Cl)ccc21",
  "classe": "Benzodiazépine", "question": "À quelle classe appartient cette molécule ?",
  "options": ["…×5"], "correctes": [0], "explication": "…" }
```
Only include a SMILES you are certain about. Otherwise omit the structure.

## Tableau
```json
{ "id", "titre", "colonnes": ["Classe", "Mécanisme", "Exemples"], "lignes": [["…","…","…"]] }
```
Carte mentale (optional, in the same file as an object with `"type": "carte"`): `{ "id", "type": "carte", "titre", "racine": { "label", "enfants": [ { "label", "enfants": [] } ] } }`

## Mnemo
`{ "id", "titre", "moyen": "La phrase mnémotechnique", "explication": "Ce que chaque lettre représente" }`

## Terme (glossaire)
`{ "terme": "Biodisponibilité", "definition": "…", "cours": "pharmacologie/08-biodisponibilite" }`

## Annale file
```json
{ "id": "emd1-pharmacologie-2023", "titre": "EMD1 de Pharmacologie", "date": "2023-12-17", "duree": 60,
  "faculte": "Faculté de Pharmacie – Université d'Alger 1",
  "questions": [ { ...Qcm, "origine": "annale", "cours": "pharmacologie/02-voies-d-administration" | null, "verifie": true|false } ] }
```
Annale questions live ONLY in the annales file. The app merges them into the matching course's QCM pool at build time using `cours`. Do NOT copy them into qcm.json. If no course covers a question, use `"cours": null`.

Glossary files: one per agent, `glossaire/<module>.json` (or `<module>-a.json` / `-b.json` when a module is split between two agents). The app merges every file in the folder.

## Quality rules (non-negotiable)
1. Use only facts stated in the course. No outside knowledge.
2. Cover every section of the course, start to end.
3. Exactly one defensible answer key. No ambiguity.
4. French with correct accents and medical terminology.
5. Volume target per course: QCM 30–100+ (scale with course length), flashcards 20–60, 1 fiche, 2–5 cas cliniques where clinically relevant, calculs where the course has formulas, structures for chimie thérapeutique/pharmacognosie when certain, 1–3 tableaux, 2–6 mnémos, glossary terms.
6. Validate every file with `node scripts/validate-content.mjs` before finishing.
