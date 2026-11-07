import { describe, expect, it } from "vitest";
import { FLOW_STEPS, PROBLEM_CATEGORY_IDS } from "@/types/knowledge";

describe("contratos da base de conhecimento", () => {
  it("define exatamente as seis categorias de desperdício, sem repetição", () => {
    expect(PROBLEM_CATEGORY_IDS).toHaveLength(6);
    expect(new Set(PROBLEM_CATEGORY_IDS).size).toBe(6);
  });

  it("define as sete etapas do fluxo na ordem aprovada", () => {
    expect(FLOW_STEPS).toEqual([
      "relato",
      "diagnostico",
      "causas",
      "alternativas",
      "desafio",
      "avaliacao",
      "explicacao-final",
    ]);
  });
});
