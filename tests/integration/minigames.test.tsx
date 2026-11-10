/**
 * Integração dos minigames: dados validados → regras puras → telas reais (react-dom/server).
 * As partidas são conduzidas pelos mesmos reducers que os hooks usam; os botões são acionados
 * pelas próprias funções dos elementos, para conferir que cada um chama a ação certa.
 */
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import JogosPage from "@/app/jogos/page";
import { GamesPreview } from "@/components/home/GamesPreview";
import { ChoiceGameView } from "@/components/minigames/ChoiceGame";
import { DetectiveGameView, VERDICT_LABELS } from "@/components/minigames/DetectiveGame";
import { SCORE_NOTE } from "@/components/minigames/GameShell";
import { HouseGameView } from "@/components/minigames/HouseGame";
import { NAV_LINKS } from "@/components/ui/SiteHeader";
import { knowledgeBase } from "@/data";
import { gamesData } from "@/data/games";
import type { ChoiceActions, DetectiveActions, HouseActions } from "@/hooks/use-games";
import { createHouseReducer, HOUSE_INITIAL, type HouseState } from "@/lib/games/casa-eficiente";
import { allItems, createDetectiveReducer, DETECTIVE_INITIAL, type DetectiveState } from "@/lib/games/detetive";
import { buildChoiceRounds, CHOICE_INITIAL, choiceReducer, type ChoiceState } from "@/lib/games/escolha-inteligente";
import { createRandom } from "@/lib/games/random";

type AnyProps = Record<string, unknown> & { children?: ReactNode };

/**
 * Expande componentes de função simples (sem hooks) para chegar aos elementos nativos.
 * Componentes que usam hooks (como o `Link` do Next) ficam como estão, e seus filhos são lidos.
 */
function expand(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(expand);
  if (!isValidElement<AnyProps>(node)) return node;
  if (typeof node.type === "function") {
    try {
      return expand((node.type as (props: AnyProps) => ReactNode)(node.props));
    } catch {
      return { ...node, props: { ...node.props, children: expand(node.props.children) } };
    }
  }
  return { ...node, props: { ...node.props, children: expand(node.props.children) } };
}

function elements(node: ReactNode): ReactElement<AnyProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<AnyProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}

const textOf = (node: ReactNode): string =>
  Array.isArray(node)
    ? node.map(textOf).join("")
    : isValidElement<AnyProps>(node)
      ? textOf(node.props.children)
      : typeof node === "string" || typeof node === "number"
        ? String(node)
        : "";

const buttons = (tree: ReactNode) =>
  elements(expand(tree)).filter((el) => el.type === "button" && typeof el.props.onClick === "function");
const buttonByText = (tree: ReactNode, text: string) => {
  const found = buttons(tree).find((el) => textOf(el).includes(text));
  if (!found) throw new Error(`botão não encontrado: ${text}`);
  return found;
};
const click = (el: ReactElement<AnyProps>) => (el.props.onClick as () => void)();

const html = (tree: ReactNode) => renderToStaticMarkup(<>{tree}</>);

describe("navegação dos minigames", () => {
  it("o menu principal leva à página /jogos", () => {
    expect(NAV_LINKS.find((link) => link.label === "Minigames")?.href).toBe("/jogos");
  });

  it("a página /jogos apresenta os três jogos com link", () => {
    const markup = html(<JogosPage />);
    for (const href of ["/jogos/escolha-inteligente", "/jogos/detetive", "/jogos/casa-eficiente"]) {
      expect(markup).toContain(`href="${href}"`);
    }
    expect(markup).toContain("Escolha Inteligente");
    expect(markup).toContain("Detetive do Desperdício");
    expect(markup).toContain("Construa uma Casa Eficiente");
    expect(markup).toContain("Não representam economia real");
  });

  it("a seção da página inicial tem link para cada jogo e não diz mais 'Em breve'", () => {
    const markup = html(<GamesPreview />);
    expect(markup).not.toContain("Em breve");
    expect(markup.match(/href="\/jogos\//g)).toHaveLength(3);
  });
});

describe("Escolha Inteligente (telas)", () => {
  const rounds = buildChoiceRounds(knowledgeBase, gamesData.choiceRounds, createRandom(3));
  const spies = (): ChoiceActions => ({ start: vi.fn(), answer: vi.fn(), next: vi.fn(), restart: vi.fn() });
  const view = (state: ChoiceState, actions = spies(), selectedId: string | null = null) => (
    <ChoiceGameView state={state} actions={actions} selectedId={selectedId} onSelect={() => {}} />
  );

  it("introdução: instruções, aviso de pontos e botão de começar", () => {
    const actions = spies();
    const tree = view(CHOICE_INITIAL, actions);
    const markup = html(tree);
    expect(markup).toContain("Como jogar");
    expect(markup).toContain(SCORE_NOTE);
    click(buttonByText(tree, "Começar o jogo"));
    expect(actions.start).toHaveBeenCalledOnce();
  });

  it("rodada: pergunta, três opções, confirmar desabilitado até marcar, e Recomeçar visível", () => {
    const state = choiceReducer(CHOICE_INITIAL, { type: "start", rounds });
    const actions = spies();
    const markup = html(view(state, actions));
    expect(markup).toContain(rounds[0].challenge.question);
    expect(markup.match(/type="radio"/g)).toHaveLength(3);
    expect(markup).toMatch(/<button type="submit"[^>]*disabled/);
    expect(markup).toContain("Situação 1 de 6");
    click(buttonByText(view(state, actions), "Recomeçar"));
    expect(actions.restart).toHaveBeenCalledOnce();
  });

  it("avaliação de um erro: mostra a mais adequada, o problema e a solução recomendada", () => {
    let state = choiceReducer(CHOICE_INITIAL, { type: "start", rounds });
    const wrong = rounds[0].challenge.options.find((o) => !o.isCorrect);
    const best = rounds[0].challenge.options.find((o) => o.isCorrect);
    if (!wrong || !best) throw new Error("rodada sem opções");
    state = choiceReducer(state, { type: "answer", optionId: wrong.id });
    const problem = knowledgeBase.problems.find((p) => p.id === rounds[0].categoryId);
    const recommended = problem?.alternatives.find((a) => a.id === problem.recommendedAlternativeId);
    const actions = spies();
    const tree = view(state, actions);
    const markup = html(tree);
    expect(markup).toContain("Essa não é a mais adequada");
    expect(markup).toContain(wrong.feedback);
    expect(markup).toContain("Mais adequada: ");
    expect(markup).toContain(recommended?.title ?? "???");
    expect(markup).toContain('aria-live="polite"');
    click(buttonByText(tree, "Próxima situação"));
    expect(actions.next).toHaveBeenCalledOnce();
  });

  it("partida completa: resultado com pontos, resumo e as duas saídas", () => {
    let state: ChoiceState = choiceReducer(CHOICE_INITIAL, { type: "start", rounds });
    for (const round of rounds) {
      const best = round.challenge.options.find((o) => o.isCorrect);
      state = choiceReducer(state, { type: "answer", optionId: best?.id ?? "" });
      if (round === rounds[rounds.length - 1]) expect(html(view(state))).toContain("Ver resultado");
      state = choiceReducer(state, { type: "next" });
    }
    const actions = spies();
    const tree = view(state, actions);
    const markup = html(tree);
    expect(markup).toContain("60 <span");
    expect(markup).toContain("de 60 pontos do jogo");
    expect(markup).toContain("O que você aprendeu");
    expect(markup).toContain('href="/jogos"');
    click(buttonByText(tree, "Jogar novamente"));
    expect(actions.restart).toHaveBeenCalledOnce();
  });
});

describe("Detetive do Desperdício (telas)", () => {
  const data = gamesData.detective;
  const reducer = createDetectiveReducer(data);
  const items = allItems(data);
  const spies = (): DetectiveActions => ({ start: vi.fn(), classify: vi.fn(), finish: vi.fn(), restart: vi.fn() });
  const view = (state: DetectiveState, actions = spies()) => (
    <DetectiveGameView data={data} state={state} actions={actions} />
  );

  it("casa por cômodos, com três vereditos por situação", () => {
    const state = reducer(DETECTIVE_INITIAL, { type: "start" });
    const actions = spies();
    const tree = view(state, actions);
    const markup = html(tree);
    for (const room of data.rooms) expect(markup).toContain(room.name);
    const verdictButtons = buttons(tree).filter((b) => Object.values(VERDICT_LABELS).includes(textOf(b)));
    expect(verdictButtons).toHaveLength(items.length * 3);
    click(verdictButtons[0]);
    expect(actions.classify).toHaveBeenCalledWith(items[0].id, "desperdicio");
    expect(markup).toMatch(/<button[^>]*disabled[^>]*>Ver resultado da investigação/);
  });

  it("depois de cada análise, a explicação aparece no lugar dos botões", () => {
    let state = reducer(DETECTIVE_INITIAL, { type: "start" });
    state = reducer(state, { type: "classify", itemId: items[0].id, verdict: "normal" });
    const markup = html(view(state));
    expect(markup).toContain(items[0].explanation.text);
    expect(markup).toContain("Não exatamente");
    expect(markup).toContain("1 de 13 situações analisadas");
  });

  it("resultado: desperdícios encontrados, não encontrados e recomendações", () => {
    let state = reducer(DETECTIVE_INITIAL, { type: "start" });
    for (const item of items) state = reducer(state, { type: "classify", itemId: item.id, verdict: "normal" });
    const actions = spies();
    click(buttonByText(view(state, actions), "Ver resultado da investigação"));
    expect(actions.finish).toHaveBeenCalledOnce();
    state = reducer(state, { type: "finish" });
    const markup = html(view(state));
    const wastes = items.filter((i) => i.verdict === "desperdicio");
    expect(markup).toContain(`Você encontrou 0 de ${wastes.length} desperdícios`);
    expect(markup).toContain("Desperdícios que passaram despercebidos");
    for (const item of wastes) expect(markup).toContain(item.label);
    expect(markup).toContain("Recomendações práticas para a casa");
    expect(markup).toContain("Jogar novamente");
  });
});

describe("Construa uma Casa Eficiente (telas)", () => {
  const house = gamesData.house;
  const reducer = createHouseReducer(house);
  const spies = (): HouseActions => ({ start: vi.fn(), toggle: vi.fn(), finish: vi.fn(), restart: vi.fn() });
  const view = (state: HouseState, actions = spies()) => <HouseGameView house={house} state={state} actions={actions} />;

  it("soluções como botões de alternar, com tipo (tecnologia ou hábito)", () => {
    const state = reducer(HOUSE_INITIAL, { type: "start" });
    const actions = spies();
    const tree = view(state, actions);
    const markup = html(tree);
    expect(markup.match(/aria-pressed="false"/g)).toHaveLength(house.solutions.length);
    expect(markup).toContain("Tecnologia");
    expect(markup).toContain("Hábito");
    click(buttonByText(tree, house.solutions[0].name));
    expect(actions.toggle).toHaveBeenCalledWith(house.solutions[0].id);
    expect(markup).toMatch(/<button[^>]*disabled[^>]*>Avaliar minha casa/);
  });

  it("no limite, as soluções não escolhidas ficam desabilitadas", () => {
    let state: HouseState = reducer(HOUSE_INITIAL, { type: "start" });
    for (const solution of house.solutions) state = reducer(state, { type: "toggle", solutionId: solution.id });
    const markup = html(view(state));
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(house.maxSelections);
    expect(markup).toContain("Limite de 6 soluções atingido");
  });

  it("relatório final: a casa, soluções com benefício e limitação, pontos positivos e melhorias", () => {
    let state: HouseState = reducer(HOUSE_INITIAL, { type: "start" });
    for (const id of ["lampadas-led", "paineis-solares", "uso-consciente-ar"]) {
      state = reducer(state, { type: "toggle", solutionId: id });
    }
    state = reducer(state, { type: "finish" });
    const markup = html(view(state));
    expect(markup).toContain(`Como ficou a ${house.house}`);
    expect(markup).toContain("Soluções escolhidas");
    expect(markup).toContain("Benefício");
    expect(markup).toContain("Limitação");
    expect(markup).toContain("Pontos positivos");
    expect(markup).toContain("O que poderia melhorar");
    expect(markup).toContain("Recomendações adicionais");
    expect(markup).toContain("Sem solução");
    expect(markup).not.toMatch(/\d+\s?%|R\$|kWh/);
  });
});
