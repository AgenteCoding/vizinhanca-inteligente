import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import { listExplanations } from "@/data/schema";
import { PROBLEM_CATEGORY_IDS } from "@/types/knowledge";

/** Domínios institucionais aceitos como fonte (CLAUDE.md, seção 7). */
const OFFICIAL_HOSTS = [
  "gov.br",
  "aneel.gov.br",
  "epe.gov.br",
  "inmetro.gov.br",
  "inpe.br",
  "planalto.gov.br",
];

const { problems, sources } = knowledgeBase;
const sourcesById = new Map(sources.map((source) => [source.id, source]));

describe("integridade da base real", () => {
  it("cadastra as seis categorias, na ordem dos contratos", () => {
    expect(problems.map((problem) => problem.id)).toEqual([...PROBLEM_CATEGORY_IDS]);
  });

  describe.each(problems.map((problem) => [problem.id, problem] as const))("%s", (_, problem) => {
    it("tem a estrutura mínima exigida (RF09 a RF12)", () => {
      expect(problem.title.length).toBeGreaterThan(0);
      expect(problem.summary.length).toBeGreaterThan(0);
      expect(problem.keywords.length).toBeGreaterThanOrEqual(5);
      expect(problem.causes.length).toBeGreaterThanOrEqual(1);
      expect(problem.consequences.length).toBeGreaterThanOrEqual(1);
      expect(problem.alternatives.length).toBeGreaterThanOrEqual(2);
      expect(problem.challenge.options).toHaveLength(3);
      expect(problem.challenge.options.filter((option) => option.isCorrect)).toHaveLength(1);
    });

    it("recomenda uma alternativa cadastrada", () => {
      const ids = problem.alternatives.map((alternative) => alternative.id);
      expect(ids).toContain(problem.recommendedAlternativeId);
    });

    it("cita apenas fontes cadastradas, e afirmações verificadas só usam fontes verificadas", () => {
      for (const { explanation } of listExplanations(problem)) {
        for (const sourceId of explanation.sourceIds) {
          const source = sourcesById.get(sourceId);
          expect(source, `fonte ${sourceId}`).toBeDefined();
          if (explanation.status === "verified") expect(source?.status).toBe("verified");
        }
      }
    });

    it("não apresenta números de economia em texto pendente", () => {
      for (const { explanation } of listExplanations(problem)) {
        if (explanation.status === "pending") {
          expect(explanation.text).not.toMatch(/%|kwh|r\$/i);
        }
      }
    });

    it("não usa horário fixo de ponta como regra nacional", () => {
      const texts = listExplanations(problem).map(({ explanation }) => explanation.text);
      for (const text of [...texts, problem.challenge.question]) {
        expect(text).not.toMatch(/\b\d{1,2}\s?h(\d{2})?\b/i);
      }
    });
  });

  describe("fontes", () => {
    it.each(sources.map((source) => [source.id, source] as const))(
      "%s é institucional e registra o que sustenta",
      (_, source) => {
        const host = new URL(source.url).hostname;
        expect(
          OFFICIAL_HOSTS.some((official) => host === official || host.endsWith(`.${official}`)),
          `domínio ${host}`,
        ).toBe(true);
        expect(source.topic.length).toBeGreaterThan(0);
        if (source.status === "verified") {
          expect(source.supportedClaims.length).toBeGreaterThan(0);
        }
      },
    );

    it("toda fonte cadastrada é usada por alguma explicação", () => {
      const cited = new Set(
        problems.flatMap((problem) =>
          listExplanations(problem).flatMap(({ explanation }) => explanation.sourceIds),
        ),
      );
      for (const source of sources) expect(cited.has(source.id), source.id).toBe(true);
    });
  });
});
