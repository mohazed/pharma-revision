import { describe, expect, it } from "vitest";
import { noterQuestion, surVingt, arrondi } from "./scoring";

describe("noterQuestion — réponse unique", () => {
  const q = { type: "unique" as const, correctes: [2] };
  it("bonne réponse = 1", () => expect(noterQuestion(q, [2])).toBe(1));
  it("mauvaise réponse = 0", () => expect(noterQuestion(q, [1])).toBe(0));
  it("aucune réponse = 0", () => expect(noterQuestion(q, [])).toBe(0));
  it("plusieurs cases cochées = 0", () => expect(noterQuestion(q, [2, 3])).toBe(0));
});

describe("noterQuestion — réponses multiples", () => {
  const q = { type: "multiple" as const, correctes: [0, 2, 3] };
  it("exemple du plan : A, C, E pour A, C, D = 0,33", () => expect(arrondi(noterQuestion(q, [0, 2, 4]))).toBe(0.33));
  it("toutes les bonnes = 1", () => expect(noterQuestion(q, [0, 2, 3])).toBe(1));
  it("une partie des bonnes, aucune fausse", () => expect(arrondi(noterQuestion(q, [0, 2]))).toBe(0.67));
  it("plancher à 0", () => expect(noterQuestion(q, [1, 4, 0])).toBe(0));
  it("tout cocher = (3 − 2) / 3", () => expect(arrondi(noterQuestion(q, [0, 1, 2, 3, 4]))).toBe(0.33));
  it("rien coché = 0", () => expect(noterQuestion(q, [])).toBe(0));
  it("doublons ignorés", () => expect(noterQuestion(q, [0, 0, 2, 2, 3])).toBe(1));
  it("une seule bonne réponse en mode multiple", () => {
    const q1 = { type: "multiple" as const, correctes: [4] };
    expect(noterQuestion(q1, [4])).toBe(1);
    expect(noterQuestion(q1, [4, 1])).toBe(0);
  });
});

describe("surVingt", () => {
  it("convertit en /20", () => expect(surVingt(15, 30)).toBe(10));
  it("0 question = 0", () => expect(surVingt(0, 0)).toBe(0));
  it("note parfaite", () => expect(surVingt(40, 40)).toBe(20));
});
