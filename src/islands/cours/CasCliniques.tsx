import { useState } from "react";
import type { CasClinique } from "../../lib/types";
import { noterQuestion } from "../../lib/scoring";
import { nombre } from "../../lib/format";
import { mdEnLigne } from "../../lib/markdown";
import { enregistrerReponse, modifier } from "../../lib/store";
import QuestionQcm from "../qcm/QuestionQcm";

function Cas({ cas, titreCours, coursId }: { cas: CasClinique; titreCours: string; coursId: string }) {
  const [rep, setRep] = useState<Record<string, number[]>>({});
  const [corr, setCorr] = useState<Record<string, boolean>>({});
  const total = cas.questions.reduce((t, q) => t + (corr[q.id] ? noterQuestion(q, rep[q.id] ?? []) : 0), 0);
  const faites = Object.keys(corr).length;
  return (
    <details className="carte group overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-heading text-lg font-bold">{cas.titre}</span>
          <span className="text-sm text-ink-muted">{cas.questions.length} question(s){faites ? ` · ${nombre(total, 2)} / ${faites}` : ""}</span>
        </span>
        <span className="text-ink-muted transition-transform group-open:rotate-90" aria-hidden="true">›</span>
      </summary>
      <div className="flex flex-col gap-6 border-t border-line p-5">
        <div className="rounded-md bg-surface-2 p-4">
          <p className="libelle mb-1">Présentation du cas</p>
          <p className="texte-riche" dangerouslySetInnerHTML={{ __html: mdEnLigne(cas.enonce) }} />
        </div>
        {cas.questions.map((q, i) => {
          const c = rep[q.id] ?? [];
          return (
            <div key={q.id} className="flex flex-col gap-3">
              <QuestionQcm
                q={q}
                cochees={c}
                numero={i + 1}
                total={cas.questions.length}
                onBasculer={(o) => setRep((r) => ({ ...r, [q.id]: q.type === "unique" ? [o] : c.includes(o) ? c.filter((x) => x !== o) : [...c, o] }))}
                corrige={!!corr[q.id]}
                note={noterQuestion(q, c)}
                titreCours={titreCours}
                anime
              />
              {!corr[q.id] && (
                <button
                  className="btn btn-primaire self-start"
                  disabled={!c.length}
                  onClick={() => {
                    setCorr((x) => ({ ...x, [q.id]: true }));
                    modifier((p) => enregistrerReponse(p, q.id, coursId, noterQuestion(q, c)));
                  }}
                >
                  Valider
                </button>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

export default function CasCliniques({ cas, titreCours, coursId }: { cas: CasClinique[]; titreCours: string; coursId: string }) {
  return (
    <div className="flex flex-col gap-3">
      {cas.map((c) => (
        <Cas key={c.id} cas={c} titreCours={titreCours} coursId={coursId} />
      ))}
    </div>
  );
}
