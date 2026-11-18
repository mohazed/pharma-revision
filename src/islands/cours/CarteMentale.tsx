import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CarteMentale as TCarte, NoeudCarte } from "../../lib/types";
import Mouvement from "../Mouvement";

function Noeud({ n, niveau, ouvertParDefaut }: { n: NoeudCarte; niveau: number; ouvertParDefaut: boolean }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const enfants = n.enfants ?? [];
  const styles = niveau === 0 ? "text-on-primary font-heading text-base font-extrabold" : niveau === 1 ? "bg-soft text-primary-ink font-bold" : "bg-surface border border-line";
  return (
    <li className="my-1">
      {enfants.length ? (
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          className={"inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-left text-sm " + styles}
          style={niveau === 0 ? { background: "var(--pr-btn-bg)" } : undefined}
        >
          <span aria-hidden="true" className={"inline-block transition-transform " + (ouvert ? "rotate-90" : "")}>
            ›
          </span>
          {n.label}
          <span className="sr-only">({enfants.length} sous-éléments)</span>
        </button>
      ) : (
        <span className={"inline-block rounded-pill px-3.5 py-1.5 text-sm " + styles}>{n.label}</span>
      )}
      <AnimatePresence initial={false}>
        {ouvert && enfants.length > 0 && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            {enfants.map((e, i) => (
              <Noeud key={i} n={e} niveau={niveau + 1} ouvertParDefaut={niveau < 0} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function CarteMentale({ carte }: { carte: TCarte }) {
  return (
    <Mouvement>
      <section className="carte p-5" aria-label={carte.titre}>
        <h3 className="mb-3 text-lg">{carte.titre}</h3>
        <p className="mb-2 text-xs text-ink-muted">Touchez une branche pour la déplier.</p>
        <ul className="carte-mentale !ml-0 !border-0 !pl-0">
          <Noeud n={carte.racine} niveau={0} ouvertParDefaut />
        </ul>
      </section>
    </Mouvement>
  );
}
