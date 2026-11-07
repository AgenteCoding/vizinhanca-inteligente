import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import problemsJson from "@/data/problems.json";
import {
  alternativeSchema,
  challengeSchema,
  explainedPointSchema,
  explanationSchema,
  knowledgeBaseSchema,
  problemCategorySchema,
  sourceSchema,
  weightedKeywordSchema,
} from "@/data/schema";
import sourcesJson from "@/data/sources.json";
import type {
  Alternative,
  Challenge,
  ExplainedPoint,
  Explanation,
  KnowledgeBase,
  ProblemCategory,
  Source,
  WeightedKeyword,
} from "@/types/knowledge";

/** Cópia independente e já tipada da base real, usada como ponto de partida válido. */
function validBase(): KnowledgeBase {
  return structuredClone({ sources: sourcesJson, problems: problemsJson }) as KnowledgeBase;
}

/** Valida e devolve as mensagens de erro (lista vazia = válido). */
function issuesOf(data: unknown): string[] {
  const result = knowledgeBaseSchema.safeParse(data);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function expectRejected(data: unknown, messageFragment: string): void {
  const issues = issuesOf(data);
  expect(issues.length, "a base deveria ser rejeitada").toBeGreaterThan(0);
  expect(issues.some((message) => message.includes(messageFragment)), issues.join("\n")).toBe(true);
}

describe("esquemas Zod x contratos de src/types", () => {
  it("cada esquema produz exatamente o tipo do contrato (sem duplicar tipos)", () => {
    expectTypeOf<z.output<typeof sourceSchema>>().toEqualTypeOf<Source>();
    expectTypeOf<z.output<typeof explanationSchema>>().toEqualTypeOf<Explanation>();
    expectTypeOf<z.output<typeof explainedPointSchema>>().toEqualTypeOf<ExplainedPoint>();
    expectTypeOf<z.output<typeof alternativeSchema>>().toEqualTypeOf<Alternative>();
    expectTypeOf<z.output<typeof challengeSchema>>().toEqualTypeOf<Challenge>();
    expectTypeOf<z.output<typeof weightedKeywordSchema>>().toEqualTypeOf<WeightedKeyword>();
    expectTypeOf<z.output<typeof problemCategorySchema>>().toEqualTypeOf<ProblemCategory>();
    expectTypeOf<z.output<typeof knowledgeBaseSchema>>().toEqualTypeOf<KnowledgeBase>();
  });
});

describe("validação da base de conhecimento", () => {
  it("aceita a base real", () => {
    expect(issuesOf(validBase())).toEqual([]);
  });

  describe("campos obrigatórios", () => {
    it("rejeita problema sem título", () => {
      const kb = validBase() as unknown as { problems: Record<string, unknown>[] };
      delete kb.problems[0].title;
      expect(issuesOf(kb).length).toBeGreaterThan(0);
    });

    it("rejeita problema sem consequências", () => {
      const kb = validBase();
      kb.problems[1].consequences = [];
      expectRejected(kb, "ao menos uma consequência");
    });

    it("rejeita problema sem causas", () => {
      const kb = validBase();
      kb.problems[1].causes = [];
      expectRejected(kb, "ao menos uma causa");
    });

    it("rejeita fonte sem tema", () => {
      const kb = validBase() as unknown as { sources: Record<string, unknown>[] };
      delete kb.sources[0].topic;
      expect(issuesOf(kb).length).toBeGreaterThan(0);
    });

    it("rejeita texto em branco", () => {
      const kb = validBase();
      kb.problems[0].summary = "   ";
      expectRejected(kb, "não pode ficar vazio");
    });

    it("rejeita campos desconhecidos (erro de digitação no JSON)", () => {
      const kb = validBase() as unknown as { problems: Record<string, unknown>[] };
      kb.problems[0].titel = "Erro de digitação";
      expect(issuesOf(kb).length).toBeGreaterThan(0);
    });
  });

  describe("identificadores", () => {
    it("rejeita problemas duplicados", () => {
      const kb = validBase();
      kb.problems[1] = structuredClone(kb.problems[0]);
      expectRejected(kb, "ID duplicado");
    });

    it("rejeita quando falta uma das seis categorias", () => {
      const kb = validBase();
      kb.problems.pop();
      expectRejected(kb, "Categoria obrigatória ausente");
    });

    it("rejeita categoria que não está entre as seis aprovadas", () => {
      const kb = validBase() as unknown as { problems: { id: string }[] };
      kb.problems[0].id = "categoria-inventada";
      expect(issuesOf(kb).length).toBeGreaterThan(0);
    });

    it("rejeita fontes duplicadas", () => {
      const kb = validBase();
      kb.sources.push(structuredClone(kb.sources[0]));
      expectRejected(kb, "ID duplicado");
    });

    it("rejeita alternativas com o mesmo id no mesmo problema", () => {
      const kb = validBase();
      const [first] = kb.problems[0].alternatives;
      kb.problems[0].alternatives[1].id = first.id;
      expectRejected(kb, "ID duplicado");
    });

    it("rejeita id fora do padrão kebab-case", () => {
      const kb = validBase();
      kb.problems[0].causes[0].id = "Causa Com Espaço";
      expectRejected(kb, "kebab-case");
    });
  });

  describe("fontes e referências", () => {
    it("rejeita explicação que cita fonte inexistente", () => {
      const kb = validBase();
      kb.problems[0].causes[1].explanation.sourceIds = ["fonte-que-nao-existe"];
      expectRejected(kb, "Fonte inexistente");
    });

    it("rejeita explicação verificada sem fonte", () => {
      const kb = validBase();
      kb.problems[0].causes[0].explanation.sourceIds = [];
      expectRejected(kb, "precisa citar ao menos uma fonte");
    });

    it("rejeita explicação verificada apoiada em fonte pendente", () => {
      const kb = validBase();
      const cited = kb.problems[0].causes[0].explanation.sourceIds[0];
      const source = kb.sources.find((s) => s.id === cited);
      if (!source) throw new Error("fonte de teste ausente");
      source.status = "pending";
      expectRejected(kb, "fonte pendente");
    });

    it("rejeita fonte verificada sem afirmações registradas", () => {
      const kb = validBase();
      kb.sources[0].supportedClaims = [];
      expectRejected(kb, "ao menos uma afirmação");
    });

    it("rejeita fonte que nenhuma explicação cita", () => {
      const kb = validBase();
      kb.sources.push({ ...structuredClone(kb.sources[0]), id: "fonte-sem-uso" });
      expectRejected(kb, "não é citada");
    });

    it("rejeita URL inválida ou sem https", () => {
      const kb = validBase();
      kb.sources[0].url = "http://www.gov.br/aneel";
      expectRejected(kb, "URL https");
      kb.sources[0].url = "não é uma url";
      expectRejected(kb, "URL https");
    });

    it("rejeita data de acesso fora do formato AAAA-MM-DD", () => {
      const kb = validBase();
      kb.sources[0].accessedAt = "06/11/2026";
      expectRejected(kb, "AAAA-MM-DD");
    });

    it("rejeita a mesma fonte citada duas vezes na mesma explicação", () => {
      const kb = validBase();
      const explanation = kb.problems[0].causes[0].explanation;
      explanation.sourceIds = [explanation.sourceIds[0], explanation.sourceIds[0]];
      expectRejected(kb, "mais de uma vez");
    });
  });

  describe("status de verificação", () => {
    it("rejeita explicação sem status", () => {
      const kb = validBase() as unknown as {
        problems: { causes: { explanation: Record<string, unknown> }[] }[];
      };
      delete kb.problems[0].causes[0].explanation.status;
      expect(issuesOf(kb).length).toBeGreaterThan(0);
    });

    it("rejeita status desconhecido", () => {
      const kb = validBase() as unknown as {
        problems: { causes: { explanation: Record<string, unknown> }[] }[];
      };
      kb.problems[0].causes[0].explanation.status = "aprovado";
      expect(issuesOf(kb).length).toBeGreaterThan(0);
    });

    it.each(["Economiza 30% de energia.", "Reduz 10 kWh por mês.", "Economia de R$ 50."])(
      "rejeita número de economia em texto pendente: %s",
      (text) => {
        const kb = validBase();
        kb.problems[0].causes[1].explanation.text = text;
        expectRejected(kb, "percentuais, kWh ou valores em reais");
      },
    );
  });

  describe("alternativas e desafio", () => {
    it("rejeita problema com menos de duas alternativas", () => {
      const kb = validBase();
      kb.problems[0].alternatives = kb.problems[0].alternatives.slice(0, 1);
      expectRejected(kb, "ao menos duas alternativas");
    });

    it("rejeita problema sem alternativas", () => {
      const kb = validBase();
      kb.problems[0].alternatives = [];
      expectRejected(kb, "ao menos duas alternativas");
    });

    it("rejeita alternativa sem limitações", () => {
      const kb = validBase();
      kb.problems[0].alternatives[0].limitations = [];
      expectRejected(kb, "ao menos uma limitação");
    });

    it("rejeita alternativa recomendada inexistente", () => {
      const kb = validBase();
      kb.problems[0].recommendedAlternativeId = "alternativa-inexistente";
      expectRejected(kb, "não existe");
    });

    it("rejeita desafio com duas opções corretas", () => {
      const kb = validBase();
      kb.problems[0].challenge.options.forEach((option) => (option.isCorrect = true));
      expectRejected(kb, "exatamente uma opção correta");
    });

    it("rejeita desafio sem as três opções", () => {
      const kb = validBase();
      kb.problems[0].challenge.options.pop();
      expectRejected(kb, "3 opções");
    });
  });

  describe("palavras-chave", () => {
    it("rejeita palavra-chave com acento ou maiúscula (não normalizada)", () => {
      const kb = validBase();
      kb.problems[0].keywords[0].term = "Iluminação";
      expectRejected(kb, "normalizado");
    });

    it("rejeita peso fora da faixa de 1 a 3", () => {
      const kb = validBase();
      kb.problems[0].keywords[0].weight = 10;
      expect(issuesOf(kb).length).toBeGreaterThan(0);
    });

    it("rejeita palavra-chave repetida na mesma categoria", () => {
      const kb = validBase();
      kb.problems[0].keywords.push({ ...kb.problems[0].keywords[0] });
      expectRejected(kb, "Palavra-chave duplicada");
    });
  });
});
