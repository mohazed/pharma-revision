# Aymen Révision — Plan (v2, after your choices)

Free, public exam-prep web app for **3ème année Pharmacie (promo 2026/2027)**, built only from the course material in the shared Google Drive, hosted for free and updated by Claude on request.

## Decisions taken
- **Interface 100 % in French.** Every label, button, message and piece of content.
- **QCMs are the core.** As many as possible, high quality, generated **only from the course material**. No outside facts. Each question cites its source (course + page/slide).
- **Structure: Module → Cours → content.** For example: Pharmacologie → 3. Absorption → QCMs / Flashcards / Fiche / …
- **Every extra content type selected:** Flashcards (SRS), Fiches de révision, Cas cliniques, Examens blancs, Exercices de calcul, Structures chimiques, Tableaux & cartes mentales, Mnémotechniques + Glossaire.
- **Scoring: partial credit, each question scored independently** (detail in §5).
- **Public & free, no login, no tracking.** Progress is stored only in each visitor's own browser. No account, no analytics, no cookies, nothing sent to a server, so nobody (including us) can see anyone's results.
- **Footer on every page:** « Réalisé par Aymen Zouad ».
- **Adding courses later:** you just ask Claude (« ajoute le cours X » or « synchronise le Drive »). Claude reads it, generates all content types, validates, and publishes.

---

## 1. Source inventory (18 Nov 2026)

| Module | Courses | Also has |
|---|---|---|
| **Pharmacologie** | 10: Intro, Voies d'administration, Absorption, Distribution, Métabolisme, Élimination, Modélisation PK 1–2, Biodisponibilité, Bioéquivalence | TD |
| **Pharmacognosie** | 4: Généralités, Glucides, Drogues à lipides, Composés phénoliques | TD, TP |
| **Pharmacie galénique** | 12: Généralités, Excipients, Eaux pharma, Conditionnement, Pulvérisation, Dessiccation-Lyophilisation, Mélange des poudres, Dissolution-Filtration, Granulation, Solubilisation-Dispersion, Stérilisation 1–2 | TP |
| **Chimie analytique** | 5: Méthodes de séparation, Extraction L-L, Extractions répétées, Contre-courant, Applications | TD, TP |
| **Chimie thérapeutique** | 7: Série hétérocyclique, Anxiolytiques, Hypnotiques, Antidépresseurs 1–2, Neuroleptiques, Antiépileptiques | TP |
| **Sémiologie** | 7: Sémiologie générale, Céphalées, Hépatites, Douleur abdominale aiguë, Hémorragies digestives, Douleurs thoraciques, Troubles du transit | Programme |

That's about 45 files, all in French. Some large scanned decks may need OCR.

---

## 2. Architecture

```
Google Drive  ──(Claude reads it via the Drive connector, or files you hand over)──▶  Claude Code
                                                                                │
   /sync-courses  : find new/changed courses vs content/manifest.json           │
   /ajouter-cours : add one specific course (Drive link or local file)          │
   /plus-de-qcm   : generate more questions for a course                        │
                                                                                ▼
          generate → validate (schema + sources + no duplicates) → git push
                                                                                ▼
                         GitHub repo  ──auto build──▶  Vercel (free)  ──▶  public URL
```

- **Stack:** Astro (static) + React islands, TypeScript, Tailwind, Framer Motion. It's a PWA, so it installs on a phone and works offline.
- **Content is data:** `content/<module>/<cours>/{qcm,flashcards,fiche,cas,calculs,structures,tableaux,mnemos}.json` and `content/glossaire.json`. Adding a course = adding a folder. No code change.
- **QCM generation (quality pipeline, per course):**
  1. Extract the full text (OCR if scanned) and split it into sections.
  2. Generate questions section by section, so the **whole course** is covered, not just the start.
  3. Mix single- and multiple-answer questions, three difficulty levels, and distractors built from neighbouring concepts in the same course (realistic traps).
  4. A second Claude pass reviews each question against the source passage and rejects anything ambiguous, out-of-course or duplicated.
  5. Target: **~25–40 QCMs per short course and 60–100+ per long one** (≈ 2 000+ in total), extendable anytime with `/plus-de-qcm`.
- **Privacy:** everything runs in the browser. Progress lives in `localStorage`/IndexedDB on the visitor's device. « Exporter / Importer ma progression » (a small file) lets someone move to another device without an account.
- **Error reporting without tracking:** the « ⚑ Signaler » button opens a pre-filled message (email or GitHub issue). Nothing is collected automatically.

---

## 3. Design: « pharmacie moderne »

- **Palette:** emerald pharmacy green + deep teal, warm off-white background, full dark mode. One colour per module: Pharmacologie blue, Galénique orange, Pharmacognosie leaf green, Chimie analytique violet, Chimie thérapeutique indigo, Sémiologie rose.
- **Motifs:** faint hexagonal molecule pattern, capsule-shaped buttons/progress bars, an animated mortar-and-pestle logo.
- **Type:** Nunito (headings), Inter (body). Mobile first, large tap targets.
- **Animations** (quick, never blocking, `prefers-reduced-motion` respected):
  - Capsule progress bars that fill with liquid.
  - Correct answer: green glow + a pill « pop ». Wrong answer: gentle shake, then the right option is revealed.
  - Module cards are Erlenmeyer flasks whose fill level = mastery, and they bubble on hover.
  - Score ring at the end of a session; pill confetti for ≥ 80 %.
  - Flashcards flip in 3D. Mind-map branches unfold smoothly.

---

## 4. Screens

1. **Accueil:** greeting, optional exam countdown (each user sets their own dates), daily streak, « Reprendre », the 6 module flasks, « À réviser aujourd'hui » (due flashcards + errors), global search.
2. **Module:** list of courses with mastery bar, counts per content type, « Nouveau » badge for freshly added courses.
3. **Cours:** tabs: **QCM · Flashcards · Fiche · Cas cliniques · Calculs · Structures · Tableaux · Mnémos** (a tab only shows if that course has the content; e.g. Calculs appears for PK and chimie analytique).
4. **Configurer une session QCM:** scope (one course / several / whole module / everything), number of questions, difficulty, mode:
   - *Entraînement*: correction + explanation after each question
   - *Examen blanc*: timed, real scoring, correction at the end
   - *Mes erreurs*: only previously missed questions
   - *Révision express*: 10 random questions
5. **Lecteur QCM:** badge « Une seule réponse » / « Plusieurs réponses », A–E keyboard shortcuts, explanation with source « 📄 Les Anxiolytiques, p. 7 », per-question score shown (e.g. 0,6 / 1), « ⚑ Signaler ».
6. **Résultats:** total score /20, per-question score detail, per-course breakdown, « Refaire mes erreurs ».
7. **Flashcards:** SRS review session (« À revoir / Difficile / Bien / Facile »), cards due per module.
8. **Examens blancs:** per module, generated to mirror the exam (number of questions, duration, scoring), with a history of attempts.
9. **Carnet d'erreurs**, **Glossaire** (searchable, linked from questions), **Paramètres** (dark mode, exam dates, scoring formula, export/import/reset progress).
10. **Footer everywhere:** « Réalisé par Aymen Zouad ».

---

## 5. Partial-credit scoring (each question independent, worth 1 point)

Confirmed formula:
- **Single answer:** 1 if correct, otherwise 0.
- **Multiple answers:** score = (correct options ticked − wrong options ticked) ÷ number of correct options, floored at 0.
  - Example: correct = A, C, D. He ticks A, C, E → (2 − 1) ÷ 3 = **0,33**.
- Session total converted to /20. The formula is a setting, so it can be adjusted to the faculty's exact rule.

---

## 6. Past exams (annales) and exam style

Source: `past exams/` (8 photos, e.g. **EMD1 de Pharmacologie, Faculté de Pharmacie, Université d'Alger 1, 17/12/2023, 1h**).

Observed style, which all generated QCMs will follow:
- Instruction: « Cochez la ou les proposition(s) correcte(s) ».
- Numbered stem (« Concernant… », « À propos de… », « Parmi les propositions suivantes… », or a bare noun « La néostigmine : »), then **5 options a–e**.
- Frequent catch-all options: « Toutes les propositions sont correctes », « Toutes les propositions sont fausses », « Aucune réponse n'est juste ».
- Short options, often near-identical variants that differ by a single word (e.g. ordre un / ordre zéro, Gi/o / Gs / Gq).
- ~30 questions per 1-hour EMD. Examens blancs will use this size and timing.

How annales are used:
- Each exam question is transcribed and **assigned to the matching course** (e.g. « voie rectale » → Pharmacologie › 2. Voies d'administration), tagged « Annale EMD1 2023 ».
- **Answer keys:** the photos only show a student's handwritten ticks, not the official key. Each answer will be re-derived from the course and marked « réponse vérifiée sur le cours ». If the course doesn't settle a question, it's flagged for your review rather than guessed.
- Some annale questions (néostigmine, aldostérone, MAP kinase, placebo…) cover pharmacodynamics, which isn't in the Drive yet. They'll go into a « Hors cours actuel » bucket until that course is added.

## 6b. Content mix
- **90 % from the Cours folders, 10 % from the TD folders** (Pharmacologie, Pharmacognosie, Chimie analytique). **No TP.**

## 7. Build phases

1. **MVP:** design system, Accueil/Module/Cours pages, QCM player (all 4 modes), results, carnet d'erreurs, local progress + export/import, footer. Full QCM bank for all 45 courses. Deploy to Vercel.
2. **Pipeline:** `/sync-courses`, `/ajouter-cours`, `/plus-de-qcm`, validation script, auto-deploy.
3. **Study content:** Flashcards SRS, Fiches, Cas cliniques, Examens blancs.
4. **Specialised content:** Calculs (randomised values), Structures chimiques (SMILES rendering), Tableaux & cartes mentales, Mnémos, Glossaire.
5. **Polish:** PWA/offline, animations pass, accessibility + mobile check.

## 8. Name & what's needed to start
- **Site name: PharmaRévision** (target URL `pharmarevision.vercel.app`, if it's free).
- A free **GitHub** account and a free **Vercel** account. You sign in and connect them; I prepare everything else.
