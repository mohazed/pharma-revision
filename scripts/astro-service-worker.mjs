// Intégration Astro : génère dist/sw.js après le build, avec la liste des fichiers.
// - « coeur » : pré-caché à l'installation (pages principales, CSS/JS, icônes, index des données)
// - « tout »  : téléchargé seulement si l'utilisateur clique « Télécharger tout pour le hors-ligne »
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const toUrl = (root, file) => {
  let u = "/" + relative(root, file).split(sep).join("/");
  if (u.endsWith("/index.html")) u = u.slice(0, -"index.html".length);
  return u;
};

export default function serviceWorker() {
  return {
    name: "pharmarevision-service-worker",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const root = fileURLToPath(dir);
        const files = walk(root).filter((f) => !f.endsWith("sw.js") && !f.endsWith(".DS_Store"));
        const hash = createHash("sha256");
        for (const f of files) hash.update(relative(root, f)).update(readFileSync(f));
        const version = hash.digest("hex").slice(0, 12);
        const all = files.map((f) => toUrl(root, f)).filter((u) => !u.endsWith(".map"));
        const core = all.filter(
          (u) =>
            u.startsWith("/_astro/") ||
            u.startsWith("/icons/") ||
            u === "/manifest.webmanifest" ||
            u === "/data/index.json" ||
            u === "/favicon.svg" ||
            (u.endsWith("/") && !u.startsWith("/cours/") && !u.startsWith("/modules/")),
        );
        const tpl = readFileSync(new URL("./sw-template.js", import.meta.url), "utf8");
        const sw = tpl
          .replace("__VERSION__", JSON.stringify(version))
          .replace("__CORE__", JSON.stringify(core))
          .replace("__ALL__", JSON.stringify(all));
        writeFileSync(join(root, "sw.js"), sw);
        console.log(`[sw] sw.js généré (version ${version}, ${core.length} fichiers coeur, ${all.length} au total)`);
      },
    },
  };
}
