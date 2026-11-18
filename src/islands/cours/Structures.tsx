import { useEffect, useRef, useState } from "react";
import type { Qcm, Structure } from "../../lib/types";
import { noterQuestion } from "../../lib/scoring";
import QuestionQcm from "../qcm/QuestionQcm";

function Molecule({ smiles, nom }: { smiles: string; nom: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [erreur, setErreur] = useState(false);
  useEffect(() => {
    let annule = false;
    const dessiner = async () => {
      try {
        const mod = await import("smiles-drawer");
        const SD = (mod as unknown as { default: any }).default ?? mod;
        if (annule || !ref.current) return;
        const sombre = document.documentElement.dataset.theme === "dark";
        const drawer = new SD.SvgDrawer({ width: 320, height: 240, bondThickness: 1.2, compactDrawing: false });
        ref.current.innerHTML = "";
        SD.parse(
          smiles,
          (arbre: unknown) => {
            if (!annule && ref.current) drawer.draw(arbre, ref.current, sombre ? "dark" : "light");
          },
          () => setErreur(true),
        );
      } catch {
        setErreur(true);
      }
    };
    dessiner();
    const obs = new MutationObserver(dessiner);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      annule = true;
      obs.disconnect();
    };
  }, [smiles]);
  if (erreur) return <p className="text-sm text-ink-muted">Structure impossible à afficher.</p>;
  return <svg ref={ref} role="img" aria-label={`Structure chimique : ${nom}`} className="mx-auto h-[240px] w-full max-w-[320px]" />;
}

function CarteStructure({ s, titreCours }: { s: Structure; titreCours: string }) {
  const [cochees, setCochees] = useState<number[]>([]);
  const [corrige, setCorrige] = useState(false);
  const [nomVisible, setNomVisible] = useState(false);
  const aQuestion = !!(s.options?.length === 5 && s.correctes?.length);
  const q: Qcm | null = aQuestion
    ? { id: s.id, type: s.correctes!.length > 1 ? "multiple" : "unique", enonce: s.question ?? "Identifiez cette molécule :", options: s.options!, correctes: s.correctes!, explication: s.explication ?? "" }
    : null;
  return (
    <article className="carte flex flex-col gap-3 p-5">
      <div className="rounded-md bg-white p-2 [[data-theme=dark]_&]:bg-surface-2">
        <Molecule smiles={s.smiles} nom={corrige || nomVisible || !aQuestion ? s.nom : "molécule à identifier"} />
      </div>
      {q ? (
        <>
          <QuestionQcm
            q={q}
            cochees={cochees}
            onBasculer={(i) => setCochees((c) => (q.type === "unique" ? [i] : c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))}
            corrige={corrige}
            note={noterQuestion(q, cochees)}
            titreCours={titreCours}
            anime
          />
          {!corrige ? (
            <button className="btn btn-primaire self-start" disabled={!cochees.length} onClick={() => setCorrige(true)}>
              Valider
            </button>
          ) : (
            <p className="text-sm">
              <strong>{s.nom}</strong>
              {s.classe ? ` · ${s.classe}` : ""}
            </p>
          )}
        </>
      ) : (
        <div>
          {nomVisible ? (
            <p>
              <strong>{s.nom}</strong>
              {s.classe ? ` · ${s.classe}` : ""}
            </p>
          ) : (
            <button className="btn btn-secondaire btn-petit" onClick={() => setNomVisible(true)}>
              Afficher le nom
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default function Structures({ structures, titreCours }: { structures: Structure[]; titreCours: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {structures.map((s) => (
        <CarteStructure key={s.id} s={s} titreCours={titreCours} />
      ))}
    </div>
  );
}
