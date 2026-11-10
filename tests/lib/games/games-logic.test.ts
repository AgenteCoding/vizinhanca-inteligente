import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import { gamesData } from "@/data/games";
import {
  allItems,
  createDetectiveReducer,
  DETECTIVE_INITIAL,
  scoreVerdict,
  summarizeDetective,
  VERDICT_POINTS,
  type DetectiveState,
} from "@/lib/games/detetive";
import {
  buildChoiceRounds,
  CHOICE_INITIAL,
  CHOICE_POINTS,
  choiceReducer,
  explainChoice,
  summarizeChoice,
  type ChoiceState,
} from "@/lib/games/escolha-inteligente";
import {
  createHouseReducer,
  evaluateHouse,
  HOUSE_INITIAL,
  HOUSE_POINTS,
  type HouseState,
} from "@/lib/games/casa-eficiente";
import { createRandom, shuffle } from "@/lib/games/random";
import { PROBLEM_CATEGORY_IDS } from "@/types/knowledge";
import type { DetectiveVerdict } from "@/types/games";

describe("random", () => {
  it("é determinístico pela semente", () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    for (const n of seqA) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it("shuffle não altera a lista original e mantém os itens", () => {
    const list = [1, 2, 3, 4, 5, 6];
    const result = shuffle(list, createRandom(7));
    expect(list).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...result].sort()).toEqual(list);
  });
});

describe("Escolha Inteligente", () => {
  const rounds = buildChoiceRounds(knowledgeBase, gamesData.choiceRounds, createRandom(1));

  it("monta uma rodada por categoria", () => {
    expect(rounds).toHaveLength(PROBLEM_CATEGORY_IDS.length);
    expect(new Set(rounds.map((r) => r.categoryId))).toEqual(new Set(PROBLEM_CATEGORY_IDS));
  });

  it("varia as rodadas conforme a semente e repete com a mesma semente", () => {
    const again = buildChoiceRounds(knowledgeBase, gamesData.choiceRounds, createRandom(1));
    expect(again.map((r) => r.challenge.id)).toEqual(rounds.map((r) => r.challenge.id));
    const ids = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        buildChoiceRounds(knowledgeBase, gamesData.choiceRounds, createRandom(seed))
          .map((r) => r.challenge.id)
          .join(","),
      ),
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  const play = (correctAll: boolean): ChoiceState => {
    let state = choiceReducer(CHOICE_INITIAL, { type: "start", rounds });
    for (const round of rounds) {
      const option = round.challenge.options.find((o) => o.isCorrect === correctAll);
      if (!option) throw new Error(round.challenge.id);
      state = choiceReducer(state, { type: "answer", optionId: option.id });
      state = choiceReducer(state, { type: "next" });
    }
    return state;
  };

  it("percorre as rodadas até o resultado e pontua os acertos", () => {
    const state = play(true);
    expect(state.phase).toBe("result");
    if (state.phase !== "result") return;
    const summary = summarizeChoice(knowledgeBase, state.rounds, state.answers);
    expect(summary.score).toBe(rounds.length * CHOICE_POINTS);
    expect(summary.maxScore).toBe(summary.score);
    expect(summary.learned.every((l) => l.correct && l.recommended.length > 0)).toBe(true);
  });

  it("erros não pontuam, mas o jogo continua até o fim", () => {
    const state = play(false);
    expect(state.phase).toBe("result");
    if (state.phase !== "result") return;
    expect(summarizeChoice(knowledgeBase, state.rounds, state.answers).score).toBe(0);
  });

  it("ignora segunda resposta, avanço sem resposta e opção inexistente", () => {
    const started = choiceReducer(CHOICE_INITIAL, { type: "start", rounds });
    expect(choiceReducer(started, { type: "next" })).toBe(started);
    expect(choiceReducer(started, { type: "answer", optionId: "nao-existe" })).toBe(started);
    const first = rounds[0].challenge.options[0].id;
    const answered = choiceReducer(started, { type: "answer", optionId: first });
    expect(choiceReducer(answered, { type: "answer", optionId: first })).toBe(answered);
    expect(choiceReducer(answered, { type: "restart" })).toEqual(CHOICE_INITIAL);
  });

  it("não começa sem rodadas", () => {
    expect(choiceReducer(CHOICE_INITIAL, { type: "start", rounds: [] })).toBe(CHOICE_INITIAL);
  });

  it("a avaliação traz problema, melhor opção e solução recomendada da base", () => {
    for (const round of rounds) {
      const wrong = round.challenge.options.find((o) => !o.isCorrect);
      if (!wrong) throw new Error(round.challenge.id);
      const feedback = explainChoice(knowledgeBase, round, wrong.id);
      expect(feedback).not.toBeNull();
      expect(feedback?.correct).toBe(false);
      expect(feedback?.best.isCorrect).toBe(true);
      const problem = knowledgeBase.problems.find((p) => p.id === round.categoryId);
      expect(feedback?.recommended.id).toBe(problem?.recommendedAlternativeId);
    }
    expect(explainChoice(knowledgeBase, rounds[0], "nao-existe")).toBeNull();
  });
});

describe("Detetive do Desperdício", () => {
  const data = gamesData.detective;
  const reducer = createDetectiveReducer(data);
  const items = allItems(data);

  it("pontua com tolerância: exato 2, 'depende' 1, oposto 0", () => {
    expect(scoreVerdict("desperdicio", "desperdicio")).toBe(VERDICT_POINTS.exact);
    expect(scoreVerdict("desperdicio", "depende")).toBe(VERDICT_POINTS.partial);
    expect(scoreVerdict("depende", "normal")).toBe(VERDICT_POINTS.partial);
    expect(scoreVerdict("normal", "desperdicio")).toBe(0);
  });

  const playAll = (pick: (actual: DetectiveVerdict) => DetectiveVerdict): DetectiveState => {
    let state = reducer(DETECTIVE_INITIAL, { type: "start" });
    for (const item of items) state = reducer(state, { type: "classify", itemId: item.id, verdict: pick(item.verdict) });
    return reducer(state, { type: "finish" });
  };

  it("só termina depois de analisar todas as situações", () => {
    let state = reducer(DETECTIVE_INITIAL, { type: "start" });
    state = reducer(state, { type: "classify", itemId: items[0].id, verdict: "normal" });
    expect(reducer(state, { type: "finish" })).toBe(state);
    expect(state.phase === "playing" && state.lastItemId).toBe(items[0].id);
  });

  it("cada situação é analisada uma vez e ids desconhecidos são ignorados", () => {
    let state = reducer(DETECTIVE_INITIAL, { type: "start" });
    state = reducer(state, { type: "classify", itemId: items[0].id, verdict: "normal" });
    expect(reducer(state, { type: "classify", itemId: items[0].id, verdict: "depende" })).toBe(state);
    expect(reducer(state, { type: "classify", itemId: "nao-existe", verdict: "depende" })).toBe(state);
  });

  it("resultado perfeito encontra todos os desperdícios", () => {
    const state = playAll((v) => v);
    expect(state.phase).toBe("result");
    if (state.phase !== "result") return;
    const summary = summarizeDetective(data, state.answers);
    expect(summary.score).toBe(summary.maxScore);
    expect(summary.wastesFound).toBe(summary.wastesTotal);
    expect(summary.missed).toEqual([]);
    expect(summary.correct).toBe(items.length);
    expect(summary.recommendations.length).toBeGreaterThan(0);
  });

  it("marcar tudo como normal lista os desperdícios não encontrados", () => {
    const state = playAll(() => "normal");
    if (state.phase !== "result") throw new Error("sem resultado");
    const summary = summarizeDetective(data, state.answers);
    expect(summary.wastesFound).toBe(0);
    expect(summary.missed.length).toBe(summary.wastesTotal);
    expect(summary.score).toBeGreaterThan(0); // "normal" e "depende" ainda pontuam
  });

  it("recomeçar volta à introdução", () => {
    expect(reducer(playAll((v) => v), { type: "restart" })).toEqual(DETECTIVE_INITIAL);
  });
});

describe("Construa uma Casa Eficiente", () => {
  const house = gamesData.house;
  const reducer = createHouseReducer(house);

  it("liga e desliga soluções e respeita o limite", () => {
    let state: HouseState = reducer(HOUSE_INITIAL, { type: "start" });
    for (const solution of house.solutions) state = reducer(state, { type: "toggle", solutionId: solution.id });
    expect(state.phase === "building" && state.selected.length).toBe(house.maxSelections);
    const first = house.solutions[0].id;
    state = reducer(state, { type: "toggle", solutionId: first });
    expect(state.phase === "building" && state.selected.includes(first)).toBe(false);
    expect(reducer(state, { type: "toggle", solutionId: "nao-existe" })).toBe(state);
  });

  it("não avalia uma casa sem nenhuma solução", () => {
    const state = reducer(HOUSE_INITIAL, { type: "start" });
    expect(reducer(state, { type: "finish" })).toBe(state);
  });

  it("só tecnologia: avisa que faltou hábito e não ganha o bônus de equilíbrio", () => {
    const tech = house.solutions.filter((s) => s.kind === "tecnologia").map((s) => s.id);
    const report = evaluateHouse(house, tech);
    expect(report.balanced).toBe(false);
    expect(report.improvements.some((t) => t.includes("hábito"))).toBe(true);
  });

  it("combinação equilibrada que resolve tudo alcança a pontuação máxima", () => {
    const ids = [
      "sensores-presenca",
      "iluminacao-automatizada",
      "organizar-horarios",
      "eletrodomesticos-eficientes",
      "uso-consciente-ar",
      "paineis-solares",
    ];
    const report = evaluateHouse(house, ids);
    expect(report.balanced).toBe(true);
    expect(report.outcomes.every((o) => o.level === "resolve")).toBe(true);
    expect(report.score).toBe(report.maxScore);
    expect(report.maxScore).toBe(house.problems.length * HOUSE_POINTS.resolve + HOUSE_POINTS.balance);
    expect(report.positives.length).toBeGreaterThan(1); // combinações + equilíbrio
  });

  it("problemas sem solução aparecem no que pode melhorar", () => {
    const report = evaluateHouse(house, ["lampadas-led"]);
    const missing = report.outcomes.filter((o) => o.level === null).length;
    expect(missing).toBe(house.problems.length - 1);
    expect(report.improvements.filter((t) => t.startsWith("Sem solução")).length).toBe(missing);
    expect(report.outcomes.find((o) => o.problem.categoryId === "luzes-ambientes-vazios")?.level).toBe("ajuda");
    // Recomendações adicionais: só soluções não escolhidas que resolvem o que ficou pendente.
    expect(report.recommendations).toHaveLength(house.problems.length);
    expect(report.recommendations.every((r) => !r.solutions.includes("Lâmpadas LED"))).toBe(true);
  });

  it("uma nota de combinação nunca aparece ao mesmo tempo como positiva e como melhoria", () => {
    const report = evaluateHouse(house, ["lampadas-led", "paineis-solares", "uso-consciente-ar", "organizar-horarios"]);
    expect(report.positives.filter((p) => report.improvements.includes(p))).toEqual([]);
    const solar = house.solutions.find((s) => s.id === "paineis-solares");
    expect(report.positives).toContain(solar?.pairingNote);
  });

  it("nenhum texto da avaliação traz percentual ou valor em dinheiro", () => {
    const report = evaluateHouse(house, house.solutions.map((s) => s.id));
    for (const text of [...report.positives, ...report.improvements]) expect(text).not.toMatch(/%|R\$|kWh/);
  });
});
