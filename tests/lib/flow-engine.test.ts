import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import { listExplanations } from "@/data/schema";
import { createFlowEngine, INITIAL_FLOW_STATE } from "@/lib/flow-engine";
import type { FlowAction, FlowState, StepContent } from "@/types/engine";
import {
  FLOW_STEPS,
  PROBLEM_CATEGORY_IDS,
  type KnowledgeBase,
  type ProblemCategoryId,
} from "@/types/knowledge";

const engine = createFlowEngine(knowledgeBase);
const problemOf = (id: ProblemCategoryId) => {
  const problem = knowledgeBase.problems.find((p) => p.id === id);
  if (!problem) throw new Error(id);
  return problem;
};

/** Aplica as ações em sequência, exigindo que todas sejam aceitas. */
function run(actions: FlowAction[], from: FlowState = engine.initialState): FlowState {
  return actions.reduce((state, action) => {
    const result = engine.transition(state, action);
    if (!result.ok) throw new Error(`${action.type} recusada em ${state.step}: ${result.reason}`);
    return result.state;
  }, from);
}

function contentOf<S extends StepContent["step"]>(state: FlowState, step: S) {
  const content = engine.content(state);
  if (content.step !== step) throw new Error(`esperava ${step}, veio ${content.step}`);
  return content as Extract<StepContent, { step: S }>;
}

const correctOptionId = (id: ProblemCategoryId) => {
  const option = problemOf(id).challenge.options.find((o) => o.isCorrect);
  if (!option) throw new Error(id);
  return option.id;
};
const wrongOptionId = (id: ProblemCategoryId) => {
  const option = problemOf(id).challenge.options.find((o) => !o.isCorrect);
  if (!option) throw new Error(id);
  return option.id;
};

/** Do relato guiado até a etapa de desafio. */
const untilChallenge = (categoryId: ProblemCategoryId): FlowAction[] => [
  { type: "SELECT_CATEGORY", categoryId },
  { type: "ADVANCE" },
  { type: "ADVANCE" },
  { type: "ADVANCE" },
];

describe("fluxo completo", () => {
  it.each(PROBLEM_CATEGORY_IDS)("percorre as sete etapas, na ordem, para %s", (categoryId) => {
    const actions: FlowAction[] = [
      ...untilChallenge(categoryId),
      { type: "ANSWER_CHALLENGE", optionId: correctOptionId(categoryId) },
      { type: "ADVANCE" },
    ];
    const steps = [engine.initialState.step];
    actions.reduce((state, action) => {
      const next = run([action], state);
      if (next.step !== steps.at(-1)) steps.push(next.step);
      return next;
    }, engine.initialState);
    expect(steps).toEqual([...FLOW_STEPS]);
  });

  it("começa a partir do texto do visitante (caso A)", () => {
    const state = run([
      { type: "SUBMIT_REPORT", text: "Os postes ficam acesos durante o dia." },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ANSWER_CHALLENGE", optionId: correctOptionId("iluminacao-publica-dia") },
      { type: "ADVANCE" },
    ]);
    expect(state.step).toBe("explicacao-final");
  });

  it("é determinístico: a mesma sequência produz o mesmo estado", () => {
    const actions: FlowAction[] = [
      { type: "SUBMIT_REPORT", text: "Deixo o ar ligado com a janela aberta." },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ANSWER_CHALLENGE", optionId: wrongOptionId("ar-condicionado-aberto") },
      { type: "ADVANCE" },
    ];
    expect(run(actions)).toEqual(run(actions));
  });
});

describe("relato e diagnóstico", () => {
  it("diagnóstico bem-sucedido pelo texto guarda a categoria e a justificativa", () => {
    const state = run([{ type: "SUBMIT_REPORT", text: "Deixo o ar ligado com a janela aberta." }]);
    expect(state.step).toBe("diagnostico");
    if (state.step !== "diagnostico") return;
    expect(state.diagnosis.status).toBe("confirmed");
    if (state.diagnosis.status !== "confirmed") return;
    expect(state.diagnosis.categoryId).toBe("ar-condicionado-aberto");
    expect(state.diagnosis.method).toBe("text");
    expect(state.diagnosis.classification?.matchedTerms.length).toBeGreaterThan(0);
    expect(contentOf(state, "diagnostico").problem?.id).toBe("ar-condicionado-aberto");
  });

  it("escolha guiada de uma das seis situações confirma o diagnóstico", () => {
    const state = run([{ type: "SELECT_CATEGORY", categoryId: "solar-sem-geracao" }]);
    expect(state).toMatchObject({
      step: "diagnostico",
      diagnosis: { status: "confirmed", categoryId: "solar-sem-geracao", method: "guided" },
    });
  });

  it("a etapa de relato oferece as seis situações para a escolha guiada", () => {
    const content = contentOf(engine.initialState, "relato");
    expect(content.options.map((o) => o.id)).toEqual([...PROBLEM_CATEGORY_IDS]);
  });

  it("baixa confiança pede esclarecimento e não deixa avançar", () => {
    const state = run([{ type: "SUBMIT_REPORT", text: "a luz da sala" }]);
    expect(state).toMatchObject({
      step: "diagnostico",
      diagnosis: { status: "needs-clarification", classification: { status: "low-confidence" } },
    });
    expect(engine.transition(state, { type: "ADVANCE" })).toMatchObject({
      ok: false,
      reason: "diagnosis-not-confirmed",
    });
    expect(engine.allowedActions(state)).not.toContain("ADVANCE");
  });

  it("ambiguidade apresenta as candidatas primeiro e aceita a confirmação de uma delas", () => {
    const state = run([
      {
        type: "SUBMIT_REPORT",
        text: "O poste da rua fica aceso de dia e a luz do quarto fica acesa sem ninguém.",
      },
    ]);
    expect(state).toMatchObject({ diagnosis: { status: "needs-clarification" } });
    const options = contentOf(state, "diagnostico").options;
    expect(options.slice(0, 2).map((o) => [o.id, o.isCandidate])).toEqual([
      ["iluminacao-publica-dia", true],
      ["luzes-ambientes-vazios", true],
    ]);
    expect(options).toHaveLength(6); // as seis seguem disponíveis

    const confirmed = run([{ type: "SELECT_CATEGORY", categoryId: "luzes-ambientes-vazios" }], state);
    expect(confirmed).toMatchObject({
      step: "diagnostico",
      diagnosis: { status: "confirmed", categoryId: "luzes-ambientes-vazios", method: "guided" },
    });
    if (confirmed.step === "diagnostico") {
      // a justificativa do classificador é preservada após a confirmação
      expect(confirmed.diagnosis.classification?.status).toBe("ambiguous");
    }
  });

  it.each([
    ["sem relação", "Gosto de jogar futebol com meus amigos.", "unrelated"],
    ["texto curto", "poste", "too-short"],
    ["negação", "Os postes não ficam acesos durante o dia.", "negated"],
  ])("%s pede esclarecimento sem inventar categoria", (_, text, status) => {
    const state = run([{ type: "SUBMIT_REPORT", text }]);
    expect(state).toMatchObject({
      step: "diagnostico",
      diagnosis: { status: "needs-clarification", classification: { status } },
    });
  });

  it("o visitante pode reescrever o relato durante o esclarecimento", () => {
    const pending = run([{ type: "SUBMIT_REPORT", text: "a luz da sala" }]);
    const state = run(
      [{ type: "SUBMIT_REPORT", text: "A luz fica ligada mesmo quando ninguém está no quarto." }],
      pending,
    );
    expect(state).toMatchObject({
      diagnosis: { status: "confirmed", categoryId: "luzes-ambientes-vazios" },
    });
  });

  it("recusa relato vazio e permanece na etapa de relato", () => {
    const result = engine.transition(engine.initialState, { type: "SUBMIT_REPORT", text: "   " });
    expect(result).toMatchObject({ ok: false, reason: "empty-report" });
    expect(result.state).toBe(engine.initialState);
  });

  it("recusa categoria inexistente", () => {
    const result = engine.transition(engine.initialState, {
      type: "SELECT_CATEGORY",
      categoryId: "categoria-inventada" as ProblemCategoryId,
    });
    expect(result).toMatchObject({ ok: false, reason: "unknown-category" });
  });
});

describe("causas e alternativas", () => {
  const atCauses = run([
    { type: "SELECT_CATEGORY", categoryId: "consumo-horario-pico" },
    { type: "ADVANCE" },
  ]);

  it("apresenta causas e consequências do problema identificado", () => {
    const content = contentOf(atCauses, "causas");
    const problem = problemOf("consumo-horario-pico");
    expect(content.causes).toEqual(problem.causes);
    expect(content.consequences).toEqual(problem.consequences);
  });

  it("apresenta as alternativas com benefícios, limitações e a recomendada sinalizada", () => {
    const content = contentOf(run([{ type: "ADVANCE" }], atCauses), "alternativas");
    const problem = problemOf("consumo-horario-pico");
    expect(content.alternatives.map((a) => a.id)).toEqual(problem.alternatives.map((a) => a.id));
    for (const alternative of content.alternatives) {
      expect(alternative.benefits.length).toBeGreaterThan(0);
      expect(alternative.limitations.length).toBeGreaterThan(0);
    }
    const recommended = content.alternatives.filter((a) => a.isRecommended);
    expect(recommended.map((a) => a.id)).toEqual([problem.recommendedAlternativeId]);
  });
});

describe("desafio e avaliação", () => {
  const atChallenge = run(untilChallenge("eletrodomesticos-ineficientes"));

  it("apresenta a pergunta e as opções sem revelar a correta", () => {
    const content = contentOf(atChallenge, "desafio");
    expect(content.options).toHaveLength(3);
    for (const option of content.options) expect(Object.keys(option).sort()).toEqual(["id", "text"]);
  });

  it("não deixa avançar sem responder", () => {
    expect(engine.transition(atChallenge, { type: "ADVANCE" })).toMatchObject({
      ok: false,
      reason: "action-not-allowed",
    });
  });

  it("resposta correta: indica acerto e explica o motivo", () => {
    const state = run(
      [{ type: "ANSWER_CHALLENGE", optionId: correctOptionId("eletrodomesticos-ineficientes") }],
      atChallenge,
    );
    const { evaluation } = contentOf(state, "avaliacao");
    expect(evaluation.isCorrect).toBe(true);
    expect(evaluation.selectedOptionId).toBe(evaluation.correctOptionId);
    expect(evaluation.selectedFeedback.length).toBeGreaterThan(0);
  });

  it("resposta incorreta: indica erro, explica o motivo e mostra a opção mais adequada", () => {
    const wrong = wrongOptionId("eletrodomesticos-ineficientes");
    const state = run([{ type: "ANSWER_CHALLENGE", optionId: wrong }], atChallenge);
    const { evaluation } = contentOf(state, "avaliacao");
    const challenge = problemOf("eletrodomesticos-ineficientes").challenge;
    expect(evaluation.isCorrect).toBe(false);
    expect(evaluation.selectedFeedback).toBe(challenge.options.find((o) => o.id === wrong)?.feedback);
    expect(evaluation.correctOptionId).toBe(correctOptionId("eletrodomesticos-ineficientes"));
    expect(evaluation.correctFeedback.length).toBeGreaterThan(0);
  });

  it("recusa opção inexistente", () => {
    expect(
      engine.transition(atChallenge, { type: "ANSWER_CHALLENGE", optionId: "opcao-inventada" }),
    ).toMatchObject({ ok: false, reason: "unknown-option" });
  });

  it("não permite responder de novo depois da avaliação", () => {
    const state = run(
      [{ type: "ANSWER_CHALLENGE", optionId: wrongOptionId("eletrodomesticos-ineficientes") }],
      atChallenge,
    );
    expect(
      engine.transition(state, {
        type: "ANSWER_CHALLENGE",
        optionId: correctOptionId("eletrodomesticos-ineficientes"),
      }),
    ).toMatchObject({ ok: false, reason: "action-not-allowed" });
  });
});

describe("explicação final", () => {
  it.each(PROBLEM_CATEGORY_IDS)("%s: reúne todos os itens exigidos", (categoryId) => {
    const wrong = wrongOptionId(categoryId);
    const state = run([
      ...untilChallenge(categoryId),
      { type: "ANSWER_CHALLENGE", optionId: wrong },
      { type: "ADVANCE" },
    ]);
    const { report } = contentOf(state, "explicacao-final");
    const problem = problemOf(categoryId);

    expect(report.problem.id).toBe(categoryId); // problema identificado
    expect(report.mainCause).toEqual(problem.causes[0]); // causa principal
    expect(report.evaluation.selectedOptionId).toBe(wrong); // solução escolhida
    expect(report.evaluation.isCorrect).toBe(false); // se a escolha foi adequada
    expect(report.scientificExplanation).toEqual(problem.scientificExplanation);
    expect(report.finalExplanation).toEqual(problem.finalExplanation); // como contribui
    expect(report.recommendedSolution.id).toBe(problem.recommendedAlternativeId);
    expect(report.recommendedSolution.benefits.length).toBeGreaterThan(0); // benefícios
    expect(report.recommendedSolution.limitations.length).toBeGreaterThan(0); // limitações
  });

  it.each(PROBLEM_CATEGORY_IDS)(
    "%s: preserva os sourceIds e o status de cada explicação, e lista as fontes citadas",
    (categoryId) => {
      const state = run([
        ...untilChallenge(categoryId),
        { type: "ANSWER_CHALLENGE", optionId: correctOptionId(categoryId) },
        { type: "ADVANCE" },
      ]);
      const { report } = contentOf(state, "explicacao-final");
      const presented = [
        report.mainCause.explanation,
        ...report.consequences.map((c) => c.explanation),
        ...report.recommendedSolution.benefits,
        ...report.recommendedSolution.limitations,
        report.scientificExplanation,
        report.finalExplanation,
      ];
      const original = listExplanations(problemOf(categoryId)).map((e) => e.explanation);
      for (const explanation of presented) expect(original).toContainEqual(explanation);

      const cited = new Set(presented.flatMap((e) => e.sourceIds));
      const listed = [...report.sources.verified, ...report.sources.pending].map((s) => s.id);
      expect(new Set(listed)).toEqual(cited);
      expect(report.hasPendingContent).toBe(presented.some((e) => e.status === "pending"));
    },
  );

  it("não apresenta fonte pendente como verificada", () => {
    const kb: KnowledgeBase = structuredClone(knowledgeBase);
    const problem = kb.problems.find((p) => p.id === "iluminacao-publica-dia");
    const citedId = problem?.scientificExplanation.sourceIds[0];
    const source = kb.sources.find((s) => s.id === citedId);
    if (!source) throw new Error("fonte de teste ausente");
    source.status = "pending";

    const custom = createFlowEngine(kb);
    const state = [
      ...untilChallenge("iluminacao-publica-dia"),
      { type: "ANSWER_CHALLENGE", optionId: correctOptionId("iluminacao-publica-dia") },
      { type: "ADVANCE" },
    ].reduce<FlowState>((s, a) => custom.reducer(s, a as FlowAction), custom.initialState);
    if (state.step !== "explicacao-final") throw new Error(state.step);
    expect(state.report.sources.pending.map((s) => s.id)).toContain(citedId);
    expect(state.report.sources.verified.map((s) => s.id)).not.toContain(citedId);
  });

  it("na explicação final só é possível recomeçar", () => {
    const state = run([
      ...untilChallenge("solar-sem-geracao"),
      { type: "ANSWER_CHALLENGE", optionId: correctOptionId("solar-sem-geracao") },
      { type: "ADVANCE" },
    ]);
    expect(engine.allowedActions(state)).toEqual(["RESTART"]);
  });
});

describe("transições inválidas", () => {
  const stateAt: Record<string, FlowState> = {
    relato: engine.initialState,
    causas: run(untilChallenge("ar-condicionado-aberto").slice(0, 2)),
    alternativas: run(untilChallenge("ar-condicionado-aberto").slice(0, 3)),
    desafio: run(untilChallenge("ar-condicionado-aberto")),
  };

  it.each([
    ["relato", { type: "ADVANCE" }],
    ["relato", { type: "ANSWER_CHALLENGE", optionId: "x" }],
    ["causas", { type: "ANSWER_CHALLENGE", optionId: "x" }],
    ["causas", { type: "SUBMIT_REPORT", text: "outro relato" }],
    ["alternativas", { type: "SELECT_CATEGORY", categoryId: "solar-sem-geracao" }],
    ["desafio", { type: "ADVANCE" }],
  ] as [string, FlowAction][])("em %s, recusa %j sem alterar o estado", (step, action) => {
    const state = stateAt[step];
    const result = engine.transition(state, action);
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state); // mesma referência
    expect(engine.reducer(state, action)).toBe(state);
  });

  it("não permite pular do relato direto para o desafio", () => {
    expect(engine.transition(engine.initialState, { type: "ADVANCE" }).ok).toBe(false);
    expect(
      engine.transition(engine.initialState, { type: "ANSWER_CHALLENGE", optionId: "x" }).ok,
    ).toBe(false);
  });
});

describe("reinício", () => {
  it.each(["relato", "diagnostico", "causas", "alternativas", "desafio", "avaliacao", "explicacao-final"])(
    "RESTART em %s volta ao estado inicial, sem dados do visitante anterior",
    (step) => {
      const all: FlowAction[] = [
        { type: "SUBMIT_REPORT", text: "Minha geladeira é muito antiga e consome bastante energia." },
        { type: "ADVANCE" },
        { type: "ADVANCE" },
        { type: "ADVANCE" },
        { type: "ANSWER_CHALLENGE", optionId: wrongOptionId("eletrodomesticos-ineficientes") },
        { type: "ADVANCE" },
      ];
      const index = FLOW_STEPS.indexOf(step as (typeof FLOW_STEPS)[number]);
      const state = run(all.slice(0, index));
      expect(state.step).toBe(step);
      const restarted = run([{ type: "RESTART" }], state);
      expect(restarted).toEqual(INITIAL_FLOW_STATE);
      expect(Object.keys(restarted)).toEqual(["step"]);
    },
  );
});
