/**
 * Testes de integração do fluxo navegável:
 * base (JSON + Zod) → normalizador → classificador → motor → reducer do hook → componentes.
 *
 * O estado é conduzido pelo mesmo reducer que o `useReducer` usa, e cada etapa é renderizada com
 * os componentes reais (react-dom/server). Os botões são acionados pelas próprias funções
 * `onClick` dos elementos, para conferir que cada um envia a ação certa ao motor.
 */
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiagnosticoView } from "@/components/assistant/DiagnosticoView";
import { CLARIFICATION_MESSAGES, REJECTION_MESSAGES, STEP_TITLES } from "@/components/assistant/messages";
import { ChallengeView, DiagnosisView, ReportView } from "@/components/assistant/StepViews";
import { knowledgeBase } from "@/data";
import {
  diagnosticoReducer,
  initialDiagnosticoState,
  viewOf,
  type DiagnosticoActions,
  type DiagnosticoState,
} from "@/hooks/use-diagnostico";
import type { FlowAction, StepContent } from "@/types/engine";
import { FLOW_STEPS, PROBLEM_CATEGORY_IDS, type ProblemCategoryId } from "@/types/knowledge";

const noop: DiagnosticoActions = {
  submitReport: () => {},
  selectCategory: () => {},
  advance: () => {},
  answer: () => {},
  restart: () => {},
};

const problemOf = (id: ProblemCategoryId) => {
  const problem = knowledgeBase.problems.find((p) => p.id === id);
  if (!problem) throw new Error(id);
  return problem;
};
const optionOf = (id: ProblemCategoryId, correct: boolean) => {
  const option = problemOf(id).challenge.options.find((o) => o.isCorrect === correct);
  if (!option) throw new Error(id);
  return option;
};

/** Escapa o texto como o React faz no HTML, para comparar com a marcação renderizada. */
const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

function dispatchAll(actions: FlowAction[], from: DiagnosticoState = initialDiagnosticoState) {
  return actions.reduce(diagnosticoReducer, from);
}

function render(state: DiagnosticoState): string {
  return renderToStaticMarkup(<DiagnosticoView view={viewOf(state)} actions={noop} />);
}

function stepOf(state: DiagnosticoState): StepContent["step"] {
  return viewOf(state).content.step;
}

/** Elementos (não expandidos) de uma árvore JSX que têm `onClick`. */
function clickables(node: ReactNode): ReactElement<{ onClick: () => void; children?: ReactNode }>[] {
  if (Array.isArray(node)) return node.flatMap(clickables);
  if (!isValidElement<{ onClick?: () => void; children?: ReactNode }>(node)) return [];
  const own = typeof node.props.onClick === "function" ? [node as ReactElement<{ onClick: () => void }>] : [];
  return [...own, ...clickables(node.props.children)];
}

const textOf = (node: ReactNode): string =>
  Array.isArray(node)
    ? node.map(textOf).join("")
    : isValidElement<{ children?: ReactNode }>(node)
      ? textOf(node.props.children)
      : typeof node === "string" || typeof node === "number"
        ? String(node)
        : "";

describe("fluxo completo navegável, para cada categoria", () => {
  it.each(PROBLEM_CATEGORY_IDS)("%s: do relato guiado à explicação final", (categoryId) => {
    const problem = problemOf(categoryId);
    const visited: string[] = [];
    let state = initialDiagnosticoState;
    const step = (action?: FlowAction) => {
      if (action) state = diagnosticoReducer(state, action);
      expect(state.rejection).toBeNull();
      const html = render(state);
      visited.push(stepOf(state));
      expect(html).toContain(escape(STEP_TITLES[stepOf(state)]));
      expect(html).toContain("Recomeçar"); // sempre visível
      return html;
    };

    // 1. relato: as seis situações aparecem
    let html = step();
    for (const p of knowledgeBase.problems) expect(html).toContain(escape(p.title));

    // 2. diagnóstico
    html = step({ type: "SELECT_CATEGORY", categoryId });
    expect(html).toContain(escape(problem.title));

    // 3. causas e consequências
    html = step({ type: "ADVANCE" });
    for (const cause of problem.causes) expect(html).toContain(escape(cause.explanation.text));
    for (const c of problem.consequences) expect(html).toContain(escape(c.explanation.text));

    // 4. alternativas, com vantagens, limitações e a recomendada marcada
    html = step({ type: "ADVANCE" });
    for (const alternative of problem.alternatives) {
      expect(html).toContain(escape(alternative.title));
      for (const b of alternative.benefits) expect(html).toContain(escape(b.text));
      for (const l of alternative.limitations) expect(html).toContain(escape(l.text));
    }
    const recommended = problem.alternatives.find((a) => a.id === problem.recommendedAlternativeId);
    expect(html).toContain(`★ Recomendada: ${escape(recommended?.title ?? "")}`);

    // 5. desafio: pergunta e opções, sem revelar a correta
    html = step({ type: "ADVANCE" });
    expect(html).toContain(escape(problem.challenge.question));
    for (const option of problem.challenge.options) {
      expect(html).toContain(escape(option.text));
      expect(html).not.toContain(escape(option.feedback));
    }

    // 6. avaliação
    const correct = optionOf(categoryId, true);
    html = step({ type: "ANSWER_CHALLENGE", optionId: correct.id });
    expect(html).toContain("✔ Boa escolha!");
    expect(html).toContain(escape(correct.feedback));

    // 7. explicação final, com fontes
    html = step({ type: "ADVANCE" });
    expect(html).toContain(escape(problem.scientificExplanation.text));
    expect(html).toContain(escape(problem.finalExplanation.text));
    expect(html).toContain(escape(problem.causes[0].title));

    expect(visited).toEqual([...FLOW_STEPS]);
  });

  it.each(PROBLEM_CATEGORY_IDS)("%s: também funciona a partir de um relato digitado", (categoryId) => {
    const typed: Record<ProblemCategoryId, string> = {
      "iluminacao-publica-dia": "Os postes ficam acesos durante o dia.",
      "luzes-ambientes-vazios": "A luz fica ligada mesmo quando ninguém está no quarto.",
      "consumo-horario-pico":
        "Todo mundo liga o chuveiro, forno e ar-condicionado ao mesmo tempo no horário de maior consumo.",
      "eletrodomesticos-ineficientes": "Minha geladeira é muito antiga e consome bastante energia.",
      "ar-condicionado-aberto": "Deixo o ar ligado com a janela aberta.",
      "solar-sem-geracao": "Minha casa recebe bastante sol, mas não possui painéis solares.",
    };
    const state = dispatchAll([{ type: "SUBMIT_REPORT", text: typed[categoryId] }]);
    const html = render(state);
    expect(html).toContain(`Situação identificada: <strong>${escape(problemOf(categoryId).title)}</strong>`);
    expect(html).toContain("Como cheguei a esse diagnóstico");
  });
});

describe("entradas inválidas e ambíguas", () => {
  it("relato vazio é recusado e a interface avisa", () => {
    const state = dispatchAll([{ type: "SUBMIT_REPORT", text: "   " }]);
    expect(stepOf(state)).toBe("relato");
    expect(render(state)).toContain(escape(REJECTION_MESSAGES["empty-report"]));
  });

  it.each([
    ["Gosto de jogar futebol com meus amigos.", "unrelated"],
    ["poste", "too-short"],
    ["a luz da sala", "low-confidence"],
    ["Os postes não ficam acesos durante o dia.", "negated"],
    ["O poste da rua fica aceso de dia e a luz do quarto fica acesa sem ninguém.", "ambiguous"],
  ] as const)("%s → pede esclarecimento e oferece a escolha guiada", (text, status) => {
    const state = dispatchAll([{ type: "SUBMIT_REPORT", text }]);
    const html = render(state);
    expect(stepOf(state)).toBe("diagnostico");
    expect(html).toContain(escape(CLARIFICATION_MESSAGES[status]));
    for (const p of knowledgeBase.problems) expect(html).toContain(escape(p.title));
    expect(html).not.toContain("Ver as causas");
  });

  it("na ambiguidade, as candidatas aparecem como sugestão e a escolha confirma o diagnóstico", () => {
    const pending = dispatchAll([
      { type: "SUBMIT_REPORT", text: "O poste da rua fica aceso de dia e a luz do quarto fica acesa sem ninguém." },
    ]);
    expect(render(pending)).toContain(`Sugestão: ${escape(problemOf("iluminacao-publica-dia").title)}`);
    const confirmed = dispatchAll([{ type: "SELECT_CATEGORY", categoryId: "luzes-ambientes-vazios" }], pending);
    expect(render(confirmed)).toContain(escape(problemOf("luzes-ambientes-vazios").title));
    expect(render(confirmed)).toContain("Ver as causas");
  });

  it("tentar avançar sem diagnóstico confirmado mostra o aviso e não muda de etapa", () => {
    const pending = dispatchAll([{ type: "SUBMIT_REPORT", text: "a luz da sala" }]);
    const state = dispatchAll([{ type: "ADVANCE" }], pending);
    expect(stepOf(state)).toBe("diagnostico");
    expect(render(state)).toContain(escape(REJECTION_MESSAGES["diagnosis-not-confirmed"]));
  });

  it("texto com HTML é exibido como texto, sem virar marcação", () => {
    const state = dispatchAll([{ type: "SUBMIT_REPORT", text: "<script>alert(1)</script> poste aceso de dia" }]);
    expect(render(state)).not.toContain("<script>");
  });
});

describe("respostas do desafio", () => {
  const atChallenge = (id: ProblemCategoryId) =>
    dispatchAll([{ type: "SELECT_CATEGORY", categoryId: id }, { type: "ADVANCE" }, { type: "ADVANCE" }, { type: "ADVANCE" }]);

  it.each(PROBLEM_CATEGORY_IDS)("%s: resposta incorreta mostra o motivo e a opção mais adequada", (id) => {
    const wrong = optionOf(id, false);
    const correct = optionOf(id, true);
    const html = render(dispatchAll([{ type: "ANSWER_CHALLENGE", optionId: wrong.id }], atChallenge(id)));
    expect(html).toContain("✘ Essa não é a melhor escolha.");
    expect(html).toContain(escape(wrong.feedback));
    expect(html).toContain(escape(correct.text));
    expect(html).toContain(escape(correct.feedback));
  });

  it("cada botão do desafio envia a resposta da sua opção", () => {
    const content = viewOf(atChallenge("solar-sem-geracao")).content;
    if (content.step !== "desafio") throw new Error(content.step);
    const answer = vi.fn();
    const buttons = clickables(ChallengeView({ content, actions: { ...noop, answer } }));
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => button.props.onClick());
    expect(answer.mock.calls.map(([id]) => id)).toEqual(content.options.map((o) => o.id));
  });
});

describe("navegação e ligação dos botões", () => {
  it("as opções guiadas e o formulário chamam as ações do motor", () => {
    const content = viewOf(initialDiagnosticoState).content;
    if (content.step !== "relato") throw new Error(content.step);
    const actions = { ...noop, selectCategory: vi.fn(), submitReport: vi.fn() };
    const tree = ReportView({ content, actions });
    const children = (tree.props as { children: ReactElement<Record<string, unknown>>[] }).children;
    expect(children.some((child) => child.props.onSelect === actions.selectCategory)).toBe(true);
    expect(children.some((child) => child.props.onSubmit === actions.submitReport)).toBe(true);
  });

  it("o diagnóstico confirmado oferece seguir para as causas", () => {
    const content = viewOf(dispatchAll([{ type: "SELECT_CATEGORY", categoryId: "ar-condicionado-aberto" }])).content;
    if (content.step !== "diagnostico") throw new Error(content.step);
    const advance = vi.fn();
    const [button] = clickables(DiagnosisView({ content, actions: { ...noop, advance } }));
    expect(textOf(button)).toBe("Ver as causas");
    button.props.onClick();
    expect(advance).toHaveBeenCalledOnce();
  });

  it("o botão Recomeçar está ligado à ação de reiniciar em todas as etapas", () => {
    const restart = vi.fn();
    const tree = DiagnosticoView({ view: viewOf(initialDiagnosticoState), actions: { ...noop, restart } });
    const restartButton = clickables(tree).find((element) => textOf(element) === "Recomeçar");
    restartButton?.props.onClick();
    expect(restart).toHaveBeenCalledOnce();
  });
});

describe("reinicialização", () => {
  it("recomeçar no meio do fluxo volta ao relato, sem dados do visitante anterior", () => {
    const middle = dispatchAll([
      { type: "SUBMIT_REPORT", text: "Deixo o ar ligado com a janela aberta." },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
    ]);
    expect(stepOf(middle)).toBe("alternativas");
    const restarted = dispatchAll([{ type: "RESTART" }], middle);
    expect(restarted).toEqual(initialDiagnosticoState);
    expect(render(restarted)).not.toContain("janela aberta");
  });

  it("recomeçar depois da explicação final permite um novo atendimento completo", () => {
    const id: ProblemCategoryId = "consumo-horario-pico";
    const done = dispatchAll([
      { type: "SELECT_CATEGORY", categoryId: id },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ANSWER_CHALLENGE", optionId: optionOf(id, false).id },
      { type: "ADVANCE" },
      { type: "RESTART" },
      { type: "SELECT_CATEGORY", categoryId: "solar-sem-geracao" },
    ]);
    expect(render(done)).toContain(escape(problemOf("solar-sem-geracao").title));
  });
});

describe("referências científicas na explicação final", () => {
  it.each(PROBLEM_CATEGORY_IDS)("%s: lista as fontes citadas e marca o conteúdo em revisão", (id) => {
    const state = dispatchAll([
      { type: "SELECT_CATEGORY", categoryId: id },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ANSWER_CHALLENGE", optionId: optionOf(id, true).id },
      { type: "ADVANCE" },
    ]);
    const content = viewOf(state).content;
    if (content.step !== "explicacao-final") throw new Error(content.step);
    const html = render(state);
    for (const source of content.report.sources.verified) {
      expect(html).toContain(`data-source-id="${source.id}"`);
      expect(html).toContain(escape(source.title));
    }
    // cada trecho exibido leva o seu status e os ids das fontes que o sustentam
    expect(html).toContain(`data-status="${content.report.scientificExplanation.status}"`);
    expect(html).toContain(`data-sources="${content.report.scientificExplanation.sourceIds.join(" ")}"`);
    if (content.report.hasPendingContent) expect(html).toContain("Conteúdo em revisão");
  });
});
