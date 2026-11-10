/**
 * Construa uma Casa Eficiente: o visitante escolhe até N soluções e o jogo avalia o conjunto:
 * quais problemas da casa foram resolvidos, se há equilíbrio entre tecnologia e hábitos, quais
 * combinações funcionam bem e o que ainda pode melhorar. Nada de percentuais de economia.
 */
import type { HouseData, HouseProblem, HouseSolution } from "@/types/games";

/** Pontos do jogo: resolver um problema vale 2, só ajudar vale 1; equilíbrio vale 2. */
export const HOUSE_POINTS = { resolve: 2, ajuda: 1, balance: 2 } as const;

export type HouseState =
  | { phase: "intro" }
  | { phase: "building"; selected: string[] }
  | { phase: "result"; selected: string[] };

export type HouseAction =
  | { type: "start" }
  | { type: "toggle"; solutionId: string }
  | { type: "finish" }
  | { type: "restart" };

export const HOUSE_INITIAL: HouseState = { phase: "intro" };

export function createHouseReducer(house: HouseData) {
  const ids = new Set(house.solutions.map((solution) => solution.id));
  return function houseReducer(state: HouseState, action: HouseAction): HouseState {
    switch (action.type) {
      case "restart":
        return HOUSE_INITIAL;
      case "start":
        return { phase: "building", selected: [] };
      case "toggle": {
        if (state.phase !== "building" || !ids.has(action.solutionId)) return state;
        if (state.selected.includes(action.solutionId)) {
          return { ...state, selected: state.selected.filter((id) => id !== action.solutionId) };
        }
        if (state.selected.length >= house.maxSelections) return state;
        return { ...state, selected: [...state.selected, action.solutionId] };
      }
      case "finish":
        return state.phase === "building" && state.selected.length > 0
          ? { phase: "result", selected: state.selected }
          : state;
    }
  };
}

export interface ProblemOutcome {
  problem: HouseProblem;
  level: "resolve" | "ajuda" | null;
  /** Nomes das soluções escolhidas que atuam neste problema. */
  by: string[];
}

export interface HouseReport {
  score: number;
  maxScore: number;
  outcomes: ProblemOutcome[];
  selected: HouseSolution[];
  balanced: boolean;
  /** Pontos positivos da combinação (pares que funcionam juntos, equilíbrio). */
  positives: string[];
  /** O que poderia ser melhorado (problemas sem solução, combinações que faltaram). */
  improvements: string[];
  /** Soluções não escolhidas que resolveriam o que ficou pendente. */
  recommendations: { problem: HouseProblem; solutions: string[] }[];
}

export function evaluateHouse(house: HouseData, selectedIds: readonly string[]): HouseReport {
  const selected = house.solutions.filter((solution) => selectedIds.includes(solution.id));
  const chosen = new Set(selected.map((solution) => solution.id));

  const outcomes: ProblemOutcome[] = house.problems.map((problem) => {
    const acting = selected.flatMap((solution) =>
      solution.effects
        .filter((effect) => effect.categoryId === problem.categoryId)
        .map((effect) => ({ solution, level: effect.level })),
    );
    const level = acting.some((a) => a.level === "resolve") ? "resolve" : acting.length > 0 ? "ajuda" : null;
    return { problem, level, by: acting.map((a) => a.solution.name) };
  });

  const hasHabit = selected.some((solution) => solution.kind === "habito");
  const hasTech = selected.some((solution) => solution.kind === "tecnologia");
  const balanced = hasHabit && hasTech;

  const positives: string[] = [];
  const improvements: string[] = [];
  for (const solution of selected) {
    if (solution.worksBestWith.length === 0) continue;
    // A nota da combinação é ponto positivo se algum parceiro foi escolhido; senão, sugestão.
    if (solution.worksBestWith.some((partner) => chosen.has(partner))) positives.push(solution.pairingNote);
    else improvements.push(solution.pairingNote);
  }
  if (balanced) {
    positives.push("A combinação equilibra tecnologia e hábitos conscientes: equipamentos ajudam, mas não substituem a atenção das pessoas.");
  } else {
    improvements.push(
      hasTech
        ? "Faltou algum hábito consciente: tecnologia ajuda, mas não substitui a atenção das pessoas."
        : "Faltou alguma tecnologia: hábitos são essenciais, e alguns problemas ficam mais fáceis com o equipamento certo.",
    );
  }
  for (const outcome of outcomes) {
    if (outcome.level === null) improvements.push(`Sem solução escolhida: ${outcome.problem.description}`);
    else if (outcome.level === "ajuda") improvements.push(`Só parcialmente resolvido: ${outcome.problem.description}`);
  }

  const recommendations = outcomes
    .filter((outcome) => outcome.level !== "resolve")
    .map((outcome) => ({
      problem: outcome.problem,
      solutions: house.solutions
        .filter(
          (solution) =>
            !chosen.has(solution.id) &&
            solution.effects.some((e) => e.categoryId === outcome.problem.categoryId && e.level === "resolve"),
        )
        .map((solution) => solution.name),
    }))
    .filter((item) => item.solutions.length > 0);

  const score =
    outcomes.reduce((sum, outcome) => sum + (outcome.level ? HOUSE_POINTS[outcome.level] : 0), 0) +
    (balanced ? HOUSE_POINTS.balance : 0);

  return {
    score,
    maxScore: house.problems.length * HOUSE_POINTS.resolve + HOUSE_POINTS.balance,
    outcomes,
    selected,
    balanced,
    positives: [...new Set(positives)],
    improvements: [...new Set(improvements)],
    recommendations,
  };
}
