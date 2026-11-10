/**
 * Detetive do Desperdício: o visitante analisa cada situação da casa e diz se é desperdício,
 * se está normal ou se depende do contexto. Erros não zeram nada: a explicação vem sempre.
 */
import type { DetectiveData, DetectiveItem, DetectiveVerdict } from "@/types/games";

/** Pontos do jogo: veredito exato vale 2; confundir com "depende" vale 1; o resto vale 0. */
export const VERDICT_POINTS = { exact: 2, partial: 1 } as const;

export type DetectiveState =
  | { phase: "intro" }
  | { phase: "playing"; answers: Record<string, DetectiveVerdict>; lastItemId: string | null }
  | { phase: "result"; answers: Record<string, DetectiveVerdict> };

export type DetectiveAction =
  | { type: "start" }
  | { type: "classify"; itemId: string; verdict: DetectiveVerdict }
  | { type: "finish" }
  | { type: "restart" };

export const DETECTIVE_INITIAL: DetectiveState = { phase: "intro" };

export function allItems(data: DetectiveData): DetectiveItem[] {
  return data.rooms.flatMap((room) => room.items);
}

export function scoreVerdict(actual: DetectiveVerdict, guess: DetectiveVerdict): number {
  if (actual === guess) return VERDICT_POINTS.exact;
  if (actual === "depende" || guess === "depende") return VERDICT_POINTS.partial;
  return 0;
}

export function createDetectiveReducer(data: DetectiveData) {
  const items = new Set(allItems(data).map((item) => item.id));
  return function detectiveReducer(state: DetectiveState, action: DetectiveAction): DetectiveState {
    switch (action.type) {
      case "restart":
        return DETECTIVE_INITIAL;
      case "start":
        return { phase: "playing", answers: {}, lastItemId: null };
      case "classify":
        // Cada situação é analisada uma vez; a explicação aparece logo em seguida.
        if (state.phase !== "playing" || !items.has(action.itemId) || action.itemId in state.answers) return state;
        return { ...state, answers: { ...state.answers, [action.itemId]: action.verdict }, lastItemId: action.itemId };
      case "finish":
        if (state.phase !== "playing" || Object.keys(state.answers).length < items.size) return state;
        return { phase: "result", answers: state.answers };
    }
  };
}

export interface DetectiveSummary {
  score: number;
  maxScore: number;
  /** Desperdícios marcados como desperdício. */
  wastesFound: number;
  wastesTotal: number;
  /** Situações com o veredito exato. */
  correct: number;
  total: number;
  missed: DetectiveItem[];
  recommendations: string[];
}

export function summarizeDetective(
  data: DetectiveData,
  answers: Readonly<Record<string, DetectiveVerdict>>,
): DetectiveSummary {
  const items = allItems(data);
  const wastes = items.filter((item) => item.verdict === "desperdicio");
  const answered = items.filter((item) => answers[item.id] !== undefined);
  return {
    score: answered.reduce((sum, item) => sum + scoreVerdict(item.verdict, answers[item.id]), 0),
    maxScore: items.length * VERDICT_POINTS.exact,
    wastesFound: wastes.filter((item) => answers[item.id] === "desperdicio").length,
    wastesTotal: wastes.length,
    correct: answered.filter((item) => answers[item.id] === item.verdict).length,
    total: items.length,
    missed: wastes.filter((item) => answers[item.id] !== "desperdicio"),
    recommendations: [
      ...new Set(items.filter((item) => item.verdict !== "normal").map((item) => item.tip)),
    ],
  };
}
