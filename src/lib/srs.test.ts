import { describe, expect, it } from "vitest";
import { reviser, estDue } from "./srs";

const T0 = Date.UTC(2026, 10, 18);
const JOUR = 86400000;

describe("SRS", () => {
  it("une carte nouvelle est due", () => expect(estDue(undefined, T0)).toBe(true));
  it("« À revoir » revient dans 10 minutes", () => {
    const e = reviser(undefined, 0, T0);
    expect(e.due - T0).toBe(10 * 60 * 1000);
    expect(e.oublis).toBe(1);
  });
  it("« Bien » : 1 jour puis 6 jours puis croissance", () => {
    let e = reviser(undefined, 2, T0);
    expect(e.intervalle).toBe(1);
    e = reviser(e, 2, T0 + JOUR);
    expect(e.intervalle).toBe(6);
    e = reviser(e, 2, T0 + 7 * JOUR);
    expect(e.intervalle).toBeGreaterThan(6);
  });
  it("« Facile » espace plus que « Difficile »", () => {
    const f = reviser(reviser(undefined, 3, T0), 3, T0);
    const d = reviser(reviser(undefined, 1, T0), 1, T0);
    expect(f.intervalle).toBeGreaterThan(d.intervalle);
  });
  it("le facteur de facilité ne descend pas sous 1,3", () => {
    let e = reviser(undefined, 0, T0);
    for (let i = 0; i < 20; i++) e = reviser(e, 0, T0);
    expect(e.ef).toBeGreaterThanOrEqual(1.3);
  });
});
