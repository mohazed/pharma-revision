import { useEffect, useState } from "react";
import type { Calcul } from "../../lib/types";
import { estCorrect, evaluer, remplir, tirerValeurs, type Valeurs } from "../../lib/calcul";
import { lireNombre, nombre } from "../../lib/format";
import { lienSignalement } from "../../lib/signaler";
import { marquerActivite, modifier } from "../../lib/store";
import { eclatGelules } from "../../lib/effets";

function Exercice({ calc, titreCours }: { calc: Calcul; titreCours: string }) {
  const [valeurs, setValeurs] = useState<Valeurs | null>(null);
  const [saisie, setSaisie] = useState("");
  const [verdict, setVerdict] = useState<null | { ok: boolean; attendu: number; lu: number | null }>(null);
  const [voirEtapes, setVoirEtapes] = useState(false);

  const nouveau = () => {
    setValeurs(tirerValeurs(calc));
    setSaisie("");
    setVerdict(null);
    setVoirEtapes(false);
  };
  useEffect(nouveau, [calc]);

  if (!valeurs) return null;
  let attendu = NaN;
  try {
    attendu = evaluer(calc.formule, valeurs);
  } catch {
    /* formule invalide : signalée par le validateur */
  }
  const dec = calc.decimales ?? 2;

  const verifier = (e: React.FormEvent) => {
    e.preventDefault();
    const lu = lireNombre(saisie);
    const ok = lu !== null && estCorrect(lu, attendu, dec);
    setVerdict({ ok, attendu, lu });
    modifier((p) => marquerActivite(p));
    if (ok) eclatGelules(e.currentTarget.querySelector("button[type=submit]"), 10);
  };

  const idChamp = `rep-${calc.id}`;
  return (
    <article className="carte flex flex-col gap-3 p-5">
      <h3 className="text-lg">{calc.titre}</h3>
      <p className="texte-riche">{remplir(calc.enonce, valeurs, undefined, dec)}</p>
      <ul className="flex flex-wrap gap-1.5" aria-label="Valeurs tirées au hasard">
        {Object.entries(valeurs).map(([k, v]) => (
          <li key={k} className="puce">
            {k} = {nombre(v, 6)} {calc.variables[k]?.unite ?? ""}
          </li>
        ))}
      </ul>
      <form onSubmit={verifier} className="flex flex-wrap items-end gap-2">
        <label htmlFor={idChamp} className="w-full text-sm font-semibold">
          Votre réponse {calc.unite ? `(en ${calc.unite})` : ""}
        </label>
        <input
          id={idChamp}
          className="champ max-w-[12rem] tnum"
          inputMode="decimal"
          autoComplete="off"
          placeholder="ex. 12,5"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          aria-describedby={`${idChamp}-aide`}
        />
        <button type="submit" className="btn btn-primaire" disabled={!saisie.trim()}>
          Vérifier
        </button>
        <button type="button" className="btn btn-secondaire" onClick={nouveau}>
          Nouvelles valeurs
        </button>
        <p id={`${idChamp}-aide`} className="w-full text-xs text-ink-muted">
          Virgule ou point acceptés. Tolérance : ± 1 %.
        </p>
      </form>
      {verdict && (
        <div className="retour-question rounded-md p-3" role="status" style={{ background: verdict.ok ? "var(--pr-success-soft)" : "var(--pr-danger-soft)" }}>
          {verdict.lu === null ? (
            <p className="font-semibold text-danger-ink">Saisissez un nombre valide.</p>
          ) : verdict.ok ? (
            <p className="font-semibold text-success-ink">
              ✓ Juste ! Résultat : {nombre(verdict.attendu, dec)} {calc.unite}
            </p>
          ) : (
            <p className="font-semibold text-danger-ink">
              ✗ Pas tout à fait. Résultat attendu : {nombre(verdict.attendu, dec)} {calc.unite}
            </p>
          )}
        </div>
      )}
      {(verdict || voirEtapes) && calc.etapes?.length ? (
        <div className="rounded-md bg-surface-2 p-3">
          <h4 className="mb-1 text-sm font-bold">Correction détaillée</h4>
          <ol className="list-decimal space-y-1 pl-5 text-sm tnum">
            {calc.etapes.map((e, i) => (
              <li key={i}>{remplir(e, valeurs, attendu, dec)}</li>
            ))}
          </ol>
        </div>
      ) : (
        calc.etapes?.length ? (
          <button type="button" className="self-start text-sm font-semibold text-primary-ink hover:underline" onClick={() => setVoirEtapes(true)}>
            Voir la correction sans répondre
          </button>
        ) : null
      )}
      {calc.rappel && (
        <p className="text-sm text-ink-muted">
          <strong className="text-ink">Rappel du cours :</strong> {calc.rappel}
        </p>
      )}
      <a href={lienSignalement({ id: calc.id, enonce: calc.titre, cours: titreCours, type: "Calcul" })} target="_blank" rel="noopener noreferrer" className="self-start text-xs text-ink-muted hover:text-danger-ink hover:underline">
        ⚑ Signaler
      </a>
    </article>
  );
}

export default function Calculs({ calculs, titreCours }: { calculs: Calcul[]; titreCours: string }) {
  return (
    <div className="flex flex-col gap-4">
      {calculs.map((c) => (
        <Exercice key={c.id} calc={c} titreCours={titreCours} />
      ))}
    </div>
  );
}
