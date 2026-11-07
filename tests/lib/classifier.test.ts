import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import { createClassifier, MIN_SCORE } from "@/lib/classifier";
import { MAX_INPUT_LENGTH } from "@/lib/normalize";
import type { ProblemCategory } from "@/types/knowledge";
import {
  AMBIGUOUS_PHRASES,
  NEGATED_PHRASES,
  NEGATION_LIMITATION_PHRASES,
  PHRASES_BY_CATEGORY,
  UNRELATED_PHRASES,
} from "./classifier-phrases";

const classify = createClassifier(knowledgeBase.problems);

/** Descreve o resultado de forma legível na mensagem de erro dos testes. */
function describeResult(text: string): string {
  const result = classify(text);
  const scores = result.scores.map((s) => `${s.categoryId}=${s.score}`).join(", ");
  return `"${text}" → ${result.status} [${scores}] negações: ${result.negations.join(",")}`;
}

describe("classificação das seis categorias", () => {
  const cases = Object.entries(PHRASES_BY_CATEGORY).flatMap(([categoryId, phrases]) =>
    phrases.map((phrase) => [categoryId, phrase] as const),
  );

  it("tem pelo menos 10 frases por categoria e 60 no total", () => {
    for (const phrases of Object.values(PHRASES_BY_CATEGORY)) {
      expect(phrases.length).toBeGreaterThanOrEqual(10);
    }
    expect(cases.length).toBeGreaterThanOrEqual(60);
  });

  it.each(cases)("%s ← %s", (categoryId, phrase) => {
    const result = classify(phrase);
    expect(result.status, describeResult(phrase)).toBe("identified");
    if (result.status === "identified") expect(result.categoryId).toBe(categoryId);
  });
});

describe("casos do pedido (A a F)", () => {
  it.each([
    ["Os postes ficam acesos durante o dia.", "iluminacao-publica-dia"],
    ["A luz fica ligada mesmo quando ninguém está no quarto.", "luzes-ambientes-vazios"],
    [
      "Todo mundo liga o chuveiro, forno e ar-condicionado ao mesmo tempo no horário de maior consumo.",
      "consumo-horario-pico",
    ],
    ["Minha geladeira é muito antiga e consome bastante energia.", "eletrodomesticos-ineficientes"],
    ["Deixo o ar ligado com a janela aberta.", "ar-condicionado-aberto"],
    ["Minha casa recebe bastante sol, mas não possui painéis solares.", "solar-sem-geracao"],
  ])("%s → %s", (phrase, categoryId) => {
    const result = classify(phrase);
    expect(result.status, describeResult(phrase)).toBe("identified");
    if (result.status === "identified") expect(result.categoryId).toBe(categoryId);
  });
});

describe("justificativa do resultado", () => {
  it("informa pontuação e termos reconhecidos", () => {
    const result = classify("Os postes ficam acesos durante o dia.");
    const [top] = result.scores;
    expect(top.categoryId).toBe("iluminacao-publica-dia");
    expect(top.score).toBeGreaterThanOrEqual(MIN_SCORE);
    expect(top.terms).toEqual(expect.arrayContaining(["poste", "durante o dia"]));
    expect(result.matchedTerms.map((m) => m.term)).toContain("poste");
  });

  it("a pontuação é a soma dos pesos cadastrados na base", () => {
    const result = classify("Os postes ficam acesos durante o dia.");
    const problem = knowledgeBase.problems.find((p) => p.id === "iluminacao-publica-dia");
    const weightOf = (term: string) => problem?.keywords.find((k) => k.term === term)?.weight ?? 0;
    const [top] = result.scores;
    expect(top.score).toBe(top.terms.reduce((sum, term) => sum + weightOf(term), 0));
  });

  it("registra correções de digitação", () => {
    const result = classify("Minha geladera é muito velha");
    expect(result.corrections).toEqual([{ from: "geladera", to: "geladeira" }]);
  });

  it("conta cada termo uma única vez (repetir palavras não aumenta a pontuação)", () => {
    const once = classify("poste aceso de dia");
    const repeated = classify("poste poste poste poste aceso de dia");
    expect(repeated.scores[0].score).toBe(once.scores[0].score);
  });
});

describe("usa os dados da base, não uma lista fixa", () => {
  it("reconhece uma categoria a partir de palavras-chave fornecidas em outra base", () => {
    const [first, ...others] = knowledgeBase.problems;
    const custom: ProblemCategory[] = [
      { ...first, keywords: [{ term: "palavra inventada", weight: 3 }] },
      ...others,
    ];
    const result = createClassifier(custom)("uma palavra inventada aqui");
    expect(result.status).toBe("identified");
    if (result.status === "identified") expect(result.categoryId).toBe(first.id);
  });
});

describe("entradas que pedem esclarecimento", () => {
  it.each(["", "   ", "?!..."])("texto vazio: %j", (text) => {
    expect(classify(text).status).toBe("empty");
  });

  it.each(["luz", "poste", "geladeira"])("texto muito curto: %s", (text) => {
    expect(classify(text).status).toBe("too-short");
  });

  it.each(UNRELATED_PHRASES)("sem relação com energia: %s", (phrase) => {
    const result = classify(phrase);
    expect(result.status, describeResult(phrase)).toBe("unrelated");
  });

  it.each(["a luz da sala", "a janela do quarto"])("baixa confiança: %s", (phrase) => {
    const result = classify(phrase);
    expect(result.status, describeResult(phrase)).toBe("low-confidence");
  });

  it.each(AMBIGUOUS_PHRASES)("ambíguo: %s", (phrase) => {
    const result = classify(phrase);
    expect(result.status, describeResult(phrase)).toBe("ambiguous");
    if (result.status === "ambiguous") expect(result.candidates.length).toBeGreaterThanOrEqual(2);
  });

  it.each(NEGATED_PHRASES)("negação, sem classificação confiante: %s", (phrase) => {
    const result = classify(phrase);
    expect(result.status, describeResult(phrase)).toBe("negated");
    expect(result.negations.length).toBeGreaterThan(0);
  });

  it.each(NEGATION_LIMITATION_PHRASES)(
    "limitação: negação de ausência sem termo correspondente pede esclarecimento: %s",
    (phrase) => {
      expect(classify(phrase).status, describeResult(phrase)).toBe("negated");
    },
  );

  it("negação que faz parte da própria situação não bloqueia (\"não possui painéis\")", () => {
    const result = classify("Minha casa recebe bastante sol, mas não possui painéis solares.");
    expect(result.status).toBe("identified");
    expect(result.negations).toEqual([]);
  });
});

describe("robustez", () => {
  it("é determinístico", () => {
    const phrase = "A luz fica ligada mesmo quando ninguém está no quarto.";
    expect(classify(phrase)).toEqual(classify(phrase));
  });

  it("corta textos acima do limite e avisa", () => {
    const result = classify(`postes acesos de dia ${"a".repeat(MAX_INPUT_LENGTH)}`);
    expect(result.truncated).toBe(true);
    expect(result.status).toBe("identified");
  });

  it("responde rápido mesmo com o texto no tamanho máximo", () => {
    const text = "luz acesa sem ninguem no quarto ".repeat(20).slice(0, MAX_INPUT_LENGTH);
    const start = performance.now();
    for (let i = 0; i < 100; i++) classify(text);
    expect((performance.now() - start) / 100).toBeLessThan(100);
  });

  it("trata HTML como texto comum", () => {
    expect(classify("<script>alert('oi')</script>").status).toBe("unrelated");
  });
});
