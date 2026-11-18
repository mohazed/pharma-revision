// Formatage à la française.
const cache = new Map<string, Intl.NumberFormat>();

export function nombre(n: number, maxDecimales = 2, minDecimales = 0): string {
  const cle = `${minDecimales}-${maxDecimales}`;
  if (!cache.has(cle))
    cache.set(cle, new Intl.NumberFormat("fr-FR", { maximumFractionDigits: maxDecimales, minimumFractionDigits: minDecimales }));
  return cache.get(cle)!.format(n);
}

/** Lit un nombre saisi à la française (virgule ou point, espaces ignorés). */
export function lireNombre(saisie: string): number | null {
  const s = saisie.trim().replace(/[\s  ]/g, "").replace(",", ".");
  if (!s || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function pluriel(n: number, singulier: string, pluriel?: string): string {
  return `${nombre(n, 0)} ${n > 1 ? pluriel ?? singulier + "s" : singulier}`;
}

export function dateCourte(ts: number | string): string {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function dateLongue(ts: number | string): string {
  return new Date(ts).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function duree(secondes: number): string {
  const s = Math.max(0, Math.round(secondes));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(r).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export const lettre = (i: number) => "ABCDE"[i] ?? String(i + 1);

/** Jour local au format AAAA-MM-JJ. */
export function jourLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}
