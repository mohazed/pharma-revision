import { useEffect, useMemo, useState } from "react";
import type { Terme } from "../lib/types";
import { mdEnLigne } from "../lib/markdown";

const normaliser = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Glossaire({ termes, cours }: { termes: Terme[]; cours: Record<string, { titre: string; path: string }> }) {
  const [q, setQ] = useState("");
  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h) setQ(h);
  }, []);
  const filtres = useMemo(() => {
    const n = normaliser(q.trim());
    return n ? termes.filter((t) => normaliser(t.terme).includes(n) || normaliser(t.definition).includes(n)) : termes;
  }, [q, termes]);
  const lettres = useMemo(() => {
    const g = new Map<string, Terme[]>();
    for (const t of filtres) {
      const l = normaliser(t.terme)[0]?.toUpperCase() ?? "#";
      g.set(l, [...(g.get(l) ?? []), t]);
    }
    return [...g.entries()];
  }, [filtres]);

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="sr-only">Rechercher un terme</span>
        <input type="search" className="champ" placeholder={`Rechercher parmi ${termes.length} termes…`} value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <p className="text-sm text-ink-muted" aria-live="polite">
        {filtres.length} terme(s)
      </p>
      {lettres.map(([l, ts]) => (
        <section key={l} aria-label={`Lettre ${l}`}>
          <h2 className="mb-2 font-heading text-xl text-primary-ink">{l}</h2>
          <dl className="grid gap-2 md:grid-cols-2">
            {ts.map((t) => {
              const c = t.cours ? cours[t.cours] : undefined;
              return (
                <div key={t.terme + (t.cours ?? "")} id={encodeURIComponent(t.terme)} className="carte p-4">
                  <dt className="font-bold">{t.terme}</dt>
                  <dd className="texte-riche mt-1 text-sm" dangerouslySetInnerHTML={{ __html: mdEnLigne(t.definition) }} />
                  {c && (
                    <dd className="mt-2 text-xs">
                      <a href={`/cours/${c.path}/`} className="text-primary-ink hover:underline">
                        📄 {c.titre}
                      </a>
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
