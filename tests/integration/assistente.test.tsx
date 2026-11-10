/**
 * Testes de integração da conversa com o assistente:
 * base (JSON + Zod) → classificador → motor → serviço do assistente → estado da conversa →
 * componentes reais (react-dom/server).
 *
 * A conversa é conduzida pelos mesmos `conversationReducer` e serviço que o hook usa. Os botões
 * são acionados pelas próprias funções dos elementos, para conferir que cada um chama a ação certa.
 * Substitui os testes do fluxo em etapas (`diagnostico.test.tsx`), mantendo todos os cenários.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiagnosisBody } from "@/components/assistant/AssistantMessage";
import { ChallengeView } from "@/components/assistant/ChallengeStep";
import { ChatView } from "@/components/assistant/ChatView";
import {
  ASSISTANT_INTROS,
  CLARIFICATION_MESSAGES,
  COMPOSER_LOCKED_PLACEHOLDER,
  COMPOSER_PLACEHOLDER,
  EVALUATION_MESSAGES,
  NO_ACCOUNT_NOTE,
  PROVIDER_ERROR,
  REJECTION_MESSAGES,
  VISITOR_LABELS,
  WELCOME_TITLE,
} from "@/components/assistant/messages";
import { knowledgeBase } from "@/data";
import type { AssistantActions } from "@/hooks/use-assistant";
import { createDeterministicAssistant } from "@/lib/assistant/deterministic-assistant";
import { conversationReducer, createConversation } from "@/lib/conversation";
import type { ConversationState } from "@/types/assistant";
import type { FlowAction, StepContent } from "@/types/engine";
import { FLOW_STEPS, PROBLEM_CATEGORY_IDS, type ProblemCategoryId } from "@/types/knowledge";

const service = createDeterministicAssistant(knowledgeBase);
const start = service.content(service.initialState());
const situations = start.step === "relato" ? start.options : [];

const noop: AssistantActions = {
  submitReport: async () => true,
  selectSituation: async () => true,
  advance: async () => true,
  answer: async () => true,
  restart: () => {},
  startSituation: async () => true,
  retry: () => {},
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

/** Envia uma ação como o hook faz: pedido → resposta do serviço → resposta na conversa. */
async function say(state: ConversationState, action: FlowAction, text = ""): Promise<ConversationState> {
  const requested = conversationReducer(state, { type: "request", request: { action, text } });
  const transition = await service.respond(requested.flow, action);
  return conversationReducer(requested, { type: "response", transition, content: service.content(transition.state) });
}

async function talk(steps: [FlowAction, string?][], from = createConversation(service.initialState())) {
  let state = from;
  for (const [action, text] of steps) state = await say(state, action, text);
  return state;
}

function render(state: ConversationState): string {
  return renderToStaticMarkup(
    <ChatView
      conversation={state}
      allowedActions={service.allowedActions(state.flow)}
      situations={situations}
      actions={noop}
    />,
  );
}

const lastContent = (state: ConversationState): StepContent => {
  const turn = [...state.turns].reverse().find((t) => t.role === "assistant");
  if (!turn || turn.role !== "assistant") throw new Error("sem resposta");
  return turn.content;
};

/** Elementos (não expandidos) da árvore que têm a propriedade pedida (ex.: `onClick`). */
function withProp<P extends string>(node: ReactNode, prop: P): ReactElement<Record<P, (...args: unknown[]) => unknown>>[] {
  if (Array.isArray(node)) return node.flatMap((child: ReactNode) => withProp(child, prop));
  if (!isValidElement<Record<string, unknown> & { children?: ReactNode }>(node)) return [];
  const own = typeof node.props[prop] === "function" ? [node as ReactElement<Record<P, () => unknown>>] : [];
  return [...own, ...withProp(node.props.children, prop)];
}

const textOf = (node: ReactNode): string =>
  Array.isArray(node)
    ? node.map(textOf).join("")
    : isValidElement<{ children?: ReactNode }>(node)
      ? textOf(node.props.children)
      : typeof node === "string" || typeof node === "number"
        ? String(node)
        : "";

const until = (id: ProblemCategoryId, step: "desafio" | "final", correct = true): [FlowAction, string?][] => [
  [{ type: "SELECT_CATEGORY", categoryId: id }, VISITOR_LABELS.select(problemOf(id).title)],
  [{ type: "ADVANCE" }, VISITOR_LABELS.toCauses],
  [{ type: "ADVANCE" }, VISITOR_LABELS.toAlternatives],
  [{ type: "ADVANCE" }, VISITOR_LABELS.toChallenge],
  ...(step === "final"
    ? ([
        [{ type: "ANSWER_CHALLENGE", optionId: optionOf(id, correct).id }, "Minha escolha"],
        [{ type: "ADVANCE" }, VISITOR_LABELS.toFinal],
      ] as [FlowAction, string][])
    : []),
];

describe("boas-vindas (antes da primeira mensagem)", () => {
  it("mostra a pergunta central, o campo de conversa, o aviso de que não há conta e as seis sugestões", () => {
    const html = render(createConversation(service.initialState()));
    expect(html).toContain(escape(WELCOME_TITLE));
    expect(html).toContain(`placeholder="${escape(COMPOSER_PLACEHOLDER)}"`);
    expect(html).toContain(escape(NO_ACCOUNT_NOTE));
    expect(html).toContain('maxLength="500"');
    for (const problem of knowledgeBase.problems) expect(html).toContain(escape(problem.title));
    expect(html).not.toContain("Novo diagnóstico");
  });

  it("o campo de conversa envia para o assistente e as sugestões escolhem a situação", () => {
    const actions = { ...noop, submitReport: vi.fn(async () => true), selectSituation: vi.fn(async () => true) };
    const tree = ChatView({
      conversation: createConversation(service.initialState()),
      allowedActions: service.allowedActions(service.initialState()),
      situations,
      actions,
    });
    expect(withProp(tree, "onSubmit").some((el) => el.props.onSubmit === actions.submitReport)).toBe(true);
    const suggestions = withProp(tree, "onSelect");
    expect(suggestions).toHaveLength(1);
    suggestions[0].props.onSelect(situations[2].id, situations[2].title);
    expect(actions.selectSituation).toHaveBeenCalledWith(situations[2].id, VISITOR_LABELS.select(situations[2].title));
  });
});

describe("conversa completa, para cada categoria", () => {
  it.each(PROBLEM_CATEGORY_IDS)("%s: da sugestão à explicação final", async (categoryId) => {
    const problem = problemOf(categoryId);
    const visited: string[] = ["relato"];
    let state = createConversation(service.initialState());
    const step = async (action: FlowAction, text: string) => {
      state = await say(state, action, text);
      expect(state.rejection).toBeNull();
      const html = render(state);
      const content = lastContent(state);
      visited.push(content.step);
      // a fala do visitante e a resposta aparecem; a sequência interna não é exposta
      expect(html).toContain(escape(text));
      expect(html).toContain("Resposta do assistente</h3>");
      expect(html).not.toMatch(/Etapa d/);
      expect(html).not.toMatch(/de 7/);
      expect(html).not.toContain("h-1.5 w-4");
      expect(html).not.toContain("progressbar");
      expect(html).toContain("Novo diagnóstico");
      return html;
    };

    // 2. diagnóstico
    let html = await step({ type: "SELECT_CATEGORY", categoryId }, VISITOR_LABELS.select(problem.title));
    expect(html).toContain(`data-diagnosis="confirmed" data-category="${categoryId}"`);
    expect(html).toContain(escape(problem.title));

    // 3. causas e consequências
    html = await step({ type: "ADVANCE" }, VISITOR_LABELS.toCauses);
    for (const cause of problem.causes) expect(html).toContain(escape(cause.explanation.text));
    for (const c of problem.consequences) expect(html).toContain(escape(c.explanation.text));
    expect(html).toContain("Causa principal");

    // 4. alternativas, com vantagens, limitações e só a recomendada marcada (e aberta)
    html = await step({ type: "ADVANCE" }, VISITOR_LABELS.toAlternatives);
    for (const alternative of problem.alternatives) {
      expect(html).toContain(escape(alternative.title));
      for (const b of alternative.benefits) expect(html).toContain(escape(b.text));
      for (const l of alternative.limitations) expect(html).toContain(escape(l.text));
    }
    expect(html).toContain(`open="" data-alternative-id="${problem.recommendedAlternativeId}" data-recommended="true"`);
    expect(html.match(/data-recommended="true"/g)).toHaveLength(1);

    // 5. desafio: pergunta e opções, sem revelar a correta
    html = await step({ type: "ADVANCE" }, VISITOR_LABELS.toChallenge);
    expect(html).toContain(escape(problem.challenge.question));
    for (const option of problem.challenge.options) {
      expect(html).toContain(escape(option.text));
      expect(html).not.toContain(escape(option.feedback));
    }

    // 6. avaliação dentro da conversa
    const correct = optionOf(categoryId, true);
    html = await step({ type: "ANSWER_CHALLENGE", optionId: correct.id }, VISITOR_LABELS.answer(correct.text));
    expect(html).toContain(escape(EVALUATION_MESSAGES.correctTitle));
    expect(html).toContain('data-result="correct"');
    expect(html).toContain(escape(correct.feedback));

    // 7. explicação final, diferenciada e com fontes
    html = await step({ type: "ADVANCE" }, VISITOR_LABELS.toFinal);
    expect(html).toContain(escape(problem.scientificExplanation.text));
    expect(html).toContain(escape(problem.finalExplanation.text));
    for (const cause of problem.causes) expect(html).toContain(escape(cause.title));
    expect(html).toContain(escape(correct.text));
    expect(html).toContain("Escolha adequada");
    const recommended = problem.alternatives.find((a) => a.id === problem.recommendedAlternativeId);
    expect(html).toContain(escape(recommended?.title ?? ""));
    expect(html).toContain("Fontes utilizadas");
    expect(html).toContain('class="on-dark');

    expect(visited).toEqual([...FLOW_STEPS]);
  });

  it.each(PROBLEM_CATEGORY_IDS)("%s: também funciona a partir de um relato digitado", async (categoryId) => {
    const typed: Record<ProblemCategoryId, string> = {
      "iluminacao-publica-dia": "Os postes ficam acesos durante o dia.",
      "luzes-ambientes-vazios": "A luz fica ligada mesmo quando ninguém está no quarto.",
      "consumo-horario-pico":
        "Todo mundo liga o chuveiro, forno e ar-condicionado ao mesmo tempo no horário de maior consumo.",
      "eletrodomesticos-ineficientes": "Minha geladeira é muito antiga e consome bastante energia.",
      "ar-condicionado-aberto": "Deixo o ar ligado com a janela aberta.",
      "solar-sem-geracao": "Minha casa recebe bastante sol, mas não possui painéis solares.",
    };
    const state = await talk([[{ type: "SUBMIT_REPORT", text: typed[categoryId] }, typed[categoryId]]]);
    const html = render(state);
    expect(html).toContain(escape(typed[categoryId])); // balão do visitante
    expect(html).toContain(`data-diagnosis="confirmed" data-category="${categoryId}"`);
    expect(html).toContain(escape(ASSISTANT_INTROS.identified));
    expect(html).toContain("Como cheguei a esse diagnóstico");
  });

  it("só a última resposta mostra botões; as anteriores ficam como histórico", async () => {
    const state = await talk(until("ar-condicionado-aberto", "desafio").slice(0, 3));
    const html = render(state);
    expect(html.match(/Ver as causas/g)).toBeNull();
    expect(html.match(/Ver as soluções/g)).toBeNull();
    expect(html).toContain("Ir para o desafio");
  });
});

describe("entradas inválidas e ambíguas", () => {
  it("relato vazio é recusado e o aviso aparece junto ao campo de conversa", async () => {
    const state = await talk([[{ type: "SUBMIT_REPORT", text: "   " }, "   "]]);
    expect(state.flow.step).toBe("relato");
    expect(state.turns).toEqual([]);
    expect(render(state)).toContain(escape(REJECTION_MESSAGES["empty-report"]));
  });

  it.each([
    ["Gosto de jogar futebol com meus amigos.", "unrelated"],
    ["poste", "too-short"],
    ["a luz da sala", "low-confidence"],
    ["Os postes não ficam acesos durante o dia.", "negated"],
    ["O poste da rua fica aceso de dia e a luz do quarto fica acesa sem ninguém.", "ambiguous"],
  ] as const)("%s → pede esclarecimento e oferece a escolha guiada", async (text, status) => {
    const state = await talk([[{ type: "SUBMIT_REPORT", text }, text]]);
    const html = render(state);
    expect(state.flow.step).toBe("diagnostico");
    expect(html).toContain(escape(CLARIFICATION_MESSAGES[status]));
    for (const p of knowledgeBase.problems) expect(html).toContain(escape(p.title));
    expect(html).not.toContain("Ver as causas");
    // o campo de conversa continua aberto para reescrever o relato
    expect(html).toContain(`placeholder="${escape(COMPOSER_PLACEHOLDER)}"`);
  });

  it("na ambiguidade, as candidatas aparecem como sugestão e a escolha confirma o diagnóstico", async () => {
    const text = "O poste da rua fica aceso de dia e a luz do quarto fica acesa sem ninguém.";
    const pending = await talk([[{ type: "SUBMIT_REPORT", text }, text]]);
    const html = render(pending);
    const start = html.indexOf('data-candidate="true"');
    const suggestion = html.slice(start, html.indexOf("</button>", start));
    expect(suggestion).toContain("Sugestão do assistente");
    expect(html).not.toContain("Sugestão da IA");
    expect(suggestion).toContain(escape(problemOf("iluminacao-publica-dia").title));
    const confirmed = await say(pending, { type: "SELECT_CATEGORY", categoryId: "luzes-ambientes-vazios" }, "Quero estudar: luzes");
    const after = render(confirmed);
    expect(after).toContain(`data-category="luzes-ambientes-vazios"`);
    expect(after).toContain("Ver as causas");
  });

  it("tentar avançar sem diagnóstico confirmado mostra o aviso e não muda de etapa", async () => {
    const pending = await talk([[{ type: "SUBMIT_REPORT", text: "a luz da sala" }, "a luz da sala"]]);
    const state = await say(pending, { type: "ADVANCE" }, "");
    expect(state.flow.step).toBe("diagnostico");
    expect(render(state)).toContain(escape(REJECTION_MESSAGES["diagnosis-not-confirmed"]));
  });

  it("texto com HTML é exibido como texto, sem virar marcação", async () => {
    const text = "<script>alert(1)</script> poste aceso de dia";
    const state = await talk([[{ type: "SUBMIT_REPORT", text }, text]]);
    const html = render(state);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("o campo de conversa fica travado nas etapas em que a conversa segue pelas opções", async () => {
    const state = await talk(until("solar-sem-geracao", "desafio").slice(0, 2));
    const html = render(state);
    expect(html).toContain(`placeholder="${escape(COMPOSER_LOCKED_PLACEHOLDER)}"`);
    expect(html).toMatch(/<textarea[^>]*readOnly=""/);
  });
});

describe("processando e erros", () => {
  it("enquanto o assistente responde, mostra a fala do visitante e o aviso de análise", () => {
    const state = conversationReducer(createConversation(service.initialState()), {
      type: "request",
      request: { action: { type: "SUBMIT_REPORT", text: "Deixo o ar ligado" }, text: "Deixo o ar ligado" },
    });
    const html = render(state);
    expect(html).toContain("Deixo o ar ligado");
    expect(html).toContain("Analisando o seu relato...");
    expect(html).toContain('role="status"');
    expect(html).toMatch(/<textarea[^>]*readOnly=""/);
  });

  it("erro do provedor mostra mensagem clara com 'Tentar de novo' e 'Novo diagnóstico'", () => {
    const pending = conversationReducer(createConversation(service.initialState()), {
      type: "request",
      request: { action: { type: "SUBMIT_REPORT", text: "poste" }, text: "poste" },
    });
    const failed = conversationReducer(pending, { type: "failure" });
    const html = render(failed);
    expect(html).toContain(escape(PROVIDER_ERROR));
    expect(html).toContain("Tentar de novo");
    const retry = vi.fn();
    const tree = ChatView({
      conversation: failed,
      allowedActions: service.allowedActions(failed.flow),
      situations,
      actions: { ...noop, retry },
    });
    withProp(tree, "onClick")
      .find((el) => textOf(el) === "Tentar de novo")
      ?.props.onClick();
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("respostas do desafio", () => {
  it.each(PROBLEM_CATEGORY_IDS)("%s: resposta incorreta mostra o motivo e a opção mais adequada", async (id) => {
    const wrong = optionOf(id, false);
    const correct = optionOf(id, true);
    const state = await talk([
      ...until(id, "desafio"),
      [{ type: "ANSWER_CHALLENGE", optionId: wrong.id }, VISITOR_LABELS.answer(wrong.text)],
    ]);
    const html = render(state);
    expect(html).toContain(escape(EVALUATION_MESSAGES.incorrectTitle));
    expect(html).toContain('data-result="incorrect"');
    expect(html).toContain(escape(wrong.feedback));
    expect(html).toContain(escape(correct.text));
    expect(html).toContain(escape(correct.feedback));
  });

  it("cada opção do desafio marca a sua resposta, e confirmar envia a escolha", async () => {
    const content = lastContent(await talk(until("solar-sem-geracao", "desafio")));
    if (content.step !== "desafio") throw new Error(content.step);
    const onSelect = vi.fn();
    const onConfirm = vi.fn();
    const tree = ChallengeView({ content, selectedId: null, onSelect, onConfirm, questionId: "p" });
    const radios = withProp(tree, "onChange");
    expect(radios).toHaveLength(3);
    radios.forEach((radio) => radio.props.onChange());
    expect(onSelect.mock.calls.map(([id]) => id)).toEqual(content.options.map((o) => o.id));
    const [form] = withProp(tree, "onSubmit");
    form.props.onSubmit({ preventDefault: () => {} });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("o botão de confirmar fica desativado até o visitante marcar uma opção", async () => {
    const content = lastContent(await talk(until("ar-condicionado-aberto", "desafio")));
    if (content.step !== "desafio") throw new Error(content.step);
    const props = { content, onSelect: () => {}, onConfirm: () => {}, questionId: "p" };
    const empty = renderToStaticMarkup(<ChallengeView {...props} selectedId={null} />);
    expect(empty).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    const chosen = renderToStaticMarkup(<ChallengeView {...props} selectedId={content.options[1].id} />);
    expect(chosen).not.toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    const chosenInput = chosen.match(new RegExp(`<input[^>]*value="${content.options[1].id}"[^>]*>`))?.[0];
    expect(chosenInput).toContain('checked=""');
  });
});

describe("ligação dos botões da conversa", () => {
  it("o diagnóstico confirmado oferece ver as causas e escolher outra situação", async () => {
    const content = lastContent(await talk(until("ar-condicionado-aberto", "desafio").slice(0, 1)));
    if (content.step !== "diagnostico") throw new Error(content.step);
    const actions = { ...noop, advance: vi.fn(async () => true), selectSituation: vi.fn(async () => true) };
    const tree = DiagnosisBody({ content, active: true, actions, situations, idPrefix: "r" });
    const advanceButton = withProp(tree, "onClick").find((el) => textOf(el) === "Ver as causas");
    advanceButton?.props.onClick();
    expect(actions.advance).toHaveBeenCalledWith(VISITOR_LABELS.toCauses);
    const [other] = withProp(tree, "onSelect");
    other.props.onSelect("solar-sem-geracao", "Sol");
    expect(actions.selectSituation).toHaveBeenCalledWith("solar-sem-geracao", VISITOR_LABELS.reselect("Sol"));
  });

  it("o botão 'Novo diagnóstico' do cabeçalho da conversa está ligado ao recomeço", async () => {
    const restart = vi.fn();
    const state = await talk(until("consumo-horario-pico", "desafio").slice(0, 1));
    const tree = ChatView({
      conversation: state,
      allowedActions: service.allowedActions(state.flow),
      situations,
      actions: { ...noop, restart },
    });
    withProp(tree, "onClick")
      .find((el) => textOf(el) === "Novo diagnóstico")
      ?.props.onClick();
    expect(restart).toHaveBeenCalledOnce();
  });
});

describe("recomeço", () => {
  it("recomeçar no meio da conversa volta às boas-vindas, sem dados do visitante anterior", async () => {
    const middle = await talk([
      [{ type: "SUBMIT_REPORT", text: "Meu split fica ligado com a porta da sala aberta." }, "Meu split fica ligado com a porta da sala aberta."],
      [{ type: "ADVANCE" }, VISITOR_LABELS.toCauses],
    ]);
    expect(middle.flow.step).toBe("causas");
    const restarted = conversationReducer(middle, { type: "reset", initial: service.initialState() });
    expect(restarted).toEqual(createConversation(service.initialState()));
    const html = render(restarted);
    expect(html).toContain(escape(WELCOME_TITLE));
    expect(html).not.toContain("split");
  });

  it("depois da explicação final, um novo diagnóstico começa do zero", async () => {
    const done = await talk(until("consumo-horario-pico", "final", false));
    const fresh = conversationReducer(done, { type: "reset", initial: service.initialState() });
    const again = await say(fresh, { type: "SELECT_CATEGORY", categoryId: "solar-sem-geracao" }, "Quero estudar: sol");
    expect(again.turns).toHaveLength(2);
    expect(render(again)).toContain(escape(problemOf("solar-sem-geracao").title));
  });
});

describe("referências científicas na explicação final", () => {
  it.each(PROBLEM_CATEGORY_IDS)("%s: lista as fontes citadas e marca o conteúdo em revisão", async (id) => {
    const state = await talk(until(id, "final"));
    const content = lastContent(state);
    if (content.step !== "explicacao-final") throw new Error(content.step);
    const html = render(state);
    for (const source of content.report.sources.verified) {
      expect(html).toContain(`data-source-id="${source.id}"`);
      expect(html).toContain(escape(source.title));
    }
    expect(html).toContain(`data-status="${content.report.scientificExplanation.status}"`);
    expect(html).toContain(`data-sources="${content.report.scientificExplanation.sourceIds.join(" ")}"`);
    if (content.report.hasPendingContent) expect(html).toContain("Conteúdo em revisão");
  });
});

describe("arquitetura", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? files(path) : [path];
    });

  it("os componentes não importam o motor nem o classificador (falam só com o hook do assistente)", () => {
    for (const file of files(join(process.cwd(), "src", "components"))) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/@\/lib\/(flow-engine|classifier|evaluation|assistant)/);
    }
  });

  it("nada no código chama APIs externas nem lê chaves de API", () => {
    for (const file of files(join(process.cwd(), "src"))) {
      if (!/\.(ts|tsx)$/.test(file)) continue;
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/fetch\(|ANTHROPIC_API_KEY|process\.env/);
    }
  });
});
