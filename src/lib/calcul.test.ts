import { describe, expect, it } from "vitest";
import { estCorrect, evaluer, remplir, tirerValeurs } from "./calcul";
import { lireNombre, nombre } from "./format";
import type { Calcul } from "./types";

const calc: Calcul = {
  id: "x/calcul-1",
  titre: "C0",
  enonce: "Dose {dose} mg, Vd {vd} L",
  variables: { dose: { min: 100, max: 1000, pas: 50, unite: "mg" }, vd: { min: 10, max: 50, pas: 0.5, unite: "L" } },
  formule: "dose / vd",
  unite: "mg/L",
  decimales: 2,
  etapes: ["C0 = {dose} / {vd} = {resultat} mg/L"],
};

describe("calculs", () => {
  it("tire des valeurs dans les bornes et sur le pas", () => {
    for (let i = 0; i < 200; i++) {
      const v = tirerValeurs(calc);
      expect(v.dose).toBeGreaterThanOrEqual(100);
      expect(v.dose).toBeLessThanOrEqual(1000);
      expect(v.dose % 50).toBe(0);
      expect((v.vd * 2) % 1).toBe(0);
    }
  });
  it("évalue la formule, avec les fonctions mathématiques", () => {
    expect(evaluer("dose / vd", { dose: 500, vd: 20 })).toBe(25);
    expect(evaluer("ln(2) / ke", { ke: Math.log(2) })).toBeCloseTo(1);
    expect(evaluer("exp(-k * t)", { k: 0, t: 3 })).toBe(1);
  });
  it("tolérance de ±1 %", () => {
    expect(estCorrect(25.2, 25)).toBe(true);
    expect(estCorrect(25.3, 25)).toBe(false);
    expect(estCorrect(0.333, 1 / 3)).toBe(true);
  });
  it("remplit les étapes avec les valeurs tirées", () => {
    expect(remplir(calc.etapes![0], { dose: 500, vd: 20.5 }, 24.39)).toBe("C0 = 500 / 20,5 = 24,39 mg/L");
  });
  it("lit un nombre à la française", () => {
    expect(lireNombre("0,5")).toBe(0.5);
    expect(lireNombre(" 1 250,75 ")).toBe(1250.75);
    expect(lireNombre("abc")).toBeNull();
    expect(nombre(0.5)).toBe("0,5");
  });
});
