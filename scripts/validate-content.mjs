#!/usr/bin/env node
// Validates content/ against content/SCHEMA.md. Usage: node scripts/validate-content.mjs [subdir]
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../content/", import.meta.url));
const target = process.argv[2] ? join(ROOT, process.argv[2]) : ROOT;
const errors = [];
const ids = new Set();
let counts = { cours: 0, qcm: 0, flashcards: 0, cas: 0, calculs: 0, structures: 0 };

const err = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);
const load = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch (e) { err(f, "JSON invalide: " + e.message); return null; } };
const uniq = (f, id) => { if (!id) return err(f, "id manquant"); if (ids.has(id)) err(f, "id dupliqué " + id); ids.add(id); };

function checkQcm(f, q, needSource = true) {
  uniq(f, q.id);
  if (!["unique", "multiple"].includes(q.type)) err(f, `${q.id}: type invalide`);
  if (!q.enonce) err(f, `${q.id}: enonce manquant`);
  if (!Array.isArray(q.options) || q.options.length !== 5) err(f, `${q.id}: il faut exactement 5 options`);
  if (!Array.isArray(q.correctes) || q.correctes.length === 0) err(f, `${q.id}: correctes vide`);
  else {
    if (q.correctes.some((i) => !Number.isInteger(i) || i < 0 || i > 4)) err(f, `${q.id}: indice correct hors limites`);
    if (new Set(q.correctes).size !== q.correctes.length) err(f, `${q.id}: indices dupliqués`);
    if (q.type === "unique" && q.correctes.length !== 1) err(f, `${q.id}: type unique avec plusieurs réponses`);
  }
  if (!q.explication) err(f, `${q.id}: explication manquante`);
  if (needSource && !q.source?.extrait) err(f, `${q.id}: source.extrait manquant`);
  if (q.difficulte && ![1, 2, 3].includes(q.difficulte)) err(f, `${q.id}: difficulte invalide`);
}

function checkCours(dir) {
  const cf = join(dir, "cours.json");
  const c = load(cf); if (!c) return;
  counts.cours++;
  for (const k of ["id", "module", "ordre", "titre", "type"]) if (c[k] === undefined) err(cf, `champ ${k} manquant`);
  const qf = join(dir, "qcm.json");
  if (!existsSync(qf)) err(qf, "qcm.json manquant");
  else { const qs = load(qf) || []; qs.forEach((q) => checkQcm(qf, q)); counts.qcm += qs.length; }
  const opt = (name, fn) => { const f = join(dir, name); if (existsSync(f)) { const d = load(f); if (d) fn(f, d); } };
  opt("flashcards.json", (f, d) => { d.forEach((x) => { uniq(f, x.id); if (!x.recto || !x.verso) err(f, `${x.id}: recto/verso`); }); counts.flashcards += d.length; });
  opt("fiche.json", (f, d) => { if (!Array.isArray(d.sections)) err(f, "sections manquantes"); });
  opt("cas.json", (f, d) => { d.forEach((c2) => { uniq(f, c2.id); (c2.questions || []).forEach((q) => checkQcm(f, q, false)); }); counts.cas += d.length; });
  opt("calculs.json", (f, d) => { d.forEach((x) => { uniq(f, x.id); try { const v = Object.fromEntries(Object.entries(x.variables || {}).map(([k, s]) => [k, s.min])); const r = Function(...Object.keys(v), `return (${x.formule});`)(...Object.values(v)); if (!Number.isFinite(r)) err(f, `${x.id}: formule non numérique`); } catch (e) { err(f, `${x.id}: formule invalide ${e.message}`); } }); counts.calculs += d.length; });
  opt("structures.json", (f, d) => { d.forEach((x) => { uniq(f, x.id); if (!x.smiles) err(f, `${x.id}: smiles manquant`); }); counts.structures += d.length; });
  opt("tableaux.json", (f, d) => d.forEach((x) => uniq(f, x.id)));
  opt("mnemos.json", (f, d) => d.forEach((x) => uniq(f, x.id)));
}

function walk(dir) {
  if (existsSync(join(dir, "cours.json"))) return checkCours(dir);
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (!statSync(p).isDirectory()) continue;
    if (e === "annales") { for (const a of readdirSync(p).filter((x) => x.endsWith(".json"))) { const f = join(p, a); const d = load(f); (d?.questions || []).forEach((q) => { if (!q.options || q.options.length !== 5) err(f, `${q.id}: 5 options`); }); } continue; }
    if (e === "glossaire") continue;
    walk(p);
  }
}

walk(target);
console.log(`Cours: ${counts.cours} | QCM: ${counts.qcm} | Flashcards: ${counts.flashcards} | Cas: ${counts.cas} | Calculs: ${counts.calculs} | Structures: ${counts.structures}`);
if (errors.length) { console.error(`\n${errors.length} erreur(s):\n` + errors.slice(0, 200).join("\n")); process.exit(1); }
console.log("✓ Contenu valide");
