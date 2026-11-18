#!/usr/bin/env node
// Applies the EMD convention: if option e is a true catch-all
// (« Toutes les propositions sont correctes/justes », « Toutes … fausses », « Aucune réponse n'est juste »),
// the answer key is [4] only. Usage: node scripts/normalize-catchall.mjs [--write] [subdir]
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../content/", import.meta.url).pathname;
const write = process.argv.includes("--write");
const sub = process.argv.slice(2).find((a) => !a.startsWith("--"));
const ALL_TRUE = /^\s*(toutes|tous)\s+(les\s+)?(propositions|réponses|affirmations|items)\b.*\b(correct|just|vrai|exact)/i;
const NONE_TRUE = /^\s*((toutes|tous)\s+(les\s+)?(propositions|réponses|affirmations)\b.*\b(faux|fausse|inexact)|aucune?\s+(des\s+)?(réponses?|propositions?|affirmations?)\b)/i;
let changed = 0, flagged = [];

function fix(q, file) {
  const e = q.options?.[4];
  if (!e || !Array.isArray(q.correctes)) return false;
  const c = [...q.correctes].sort();
  const key = c.join(",");
  if (ALL_TRUE.test(e)) {
    if (key === "0,1,2,3,4" || key === "0,1,2,3") { q.correctes = [4]; return true; }
    if (c.includes(4) && key !== "4") flagged.push(`${relative(ROOT, file)} ${q.id}: e « toutes justes » mais clé ${key}`);
  } else if (NONE_TRUE.test(e)) {
    if (c.includes(4) && key !== "4") flagged.push(`${relative(ROOT, file)} ${q.id}: e « aucune/toutes fausses » mais clé ${key}`);
  }
  return false;
}

function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!["qcm.json", "cas.json"].includes(n) && !p.includes("/annales/")) continue;
    if (!n.endsWith(".json")) continue;
    const data = JSON.parse(readFileSync(p, "utf8"));
    let local = 0;
    const qs = n === "cas.json" ? data.flatMap((c) => c.questions || []) : Array.isArray(data) ? data : data.questions || [];
    for (const q of qs) if (fix(q, p)) local++;
    if (local) { changed += local; if (write) writeFileSync(p, JSON.stringify(data, null, 2) + "\n"); }
  }
}

walk(sub ? join(ROOT, sub) : ROOT);
console.log(`${write ? "Modifiées" : "À modifier"}: ${changed}`);
if (flagged.length) console.log(`À vérifier (${flagged.length}):\n` + flagged.join("\n"));
