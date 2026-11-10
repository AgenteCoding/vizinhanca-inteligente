/**
 * Escolha Inteligente: uma rodada por categoria, cada uma com três alternativas.
 * As rodadas vêm dos desafios da base e das rodadas extras de `src/data/games`, sorteadas por
 * semente. A avaliação reaproveita a solução recomendada e a explicação final de cada categoria.
 */
import type { ChoiceRound } from "@/types/games";
import type {
  Alternative,
  ChallengeOption,
  Explanation,
  KnowledgeBase,
  ProblemCategoryId,
} from "@/types/knowledge";
import { PROBLEM_CATEGORY_IDS } from "@/types/knowledge";
import { shuffle, type Random } from "./random";

/** Pontos do jogo por acerto (não representam economia real). */
export const CHOICE_POINTS = 10;

export interface ChoiceAnswer {
  optionId: string;
  correct: boolean;
}

export type ChoiceState =
  | { phase: "intro" }
  | { phase: "playing"; rounds: ChoiceRound[]; index: number; answers: ChoiceAnswer[] }
  | { phase: "result"; rounds: ChoiceRound[]; answers: ChoiceAnswer[] };

export type ChoiceAction =
  | { type: "start"; rounds: ChoiceRound[] }
  | { type: "answer"; optionId: string }
  | { type: "next" }
  | { type: "restart" };

export const CHOICE_INITIAL: ChoiceState = { phase: "intro" };

/** Uma rodada por categoria (desafio da base ou rodada extra), em ordem sorteada. */
export function buildChoiceRounds(
  knowledgeBase: KnowledgeBase,
  extraRounds: readonly ChoiceRound[],
  random: Random,
): ChoiceRound[] {
  const rounds = PROBLEM_CATEGORY_IDS.flatMap((categoryId) => {
    const problem = knowledgeBase.problems.find((p) => p.id === categoryId);
    const candidates: ChoiceRound[] = [
      ...(problem ? [{ categoryId, challenge: problem.challenge }] : []),
      ...extraRounds.filter((round) => round.categoryId === categoryId),
    ];
    if (candidates.length === 0) return [];
    return [candidates[Math.floor(random() * candidates.length)]];
  });
  return shuffle(rounds, random);
}

export function choiceReducer(state: ChoiceState, action: ChoiceAction): ChoiceState {
  switch (action.type) {
    case "restart":
      return CHOICE_INITIAL;
    case "start":
      return action.rounds.length > 0
        ? { phase: "playing", rounds: action.rounds, index: 0, answers: [] }
        : state;
    case "answer": {
      if (state.phase !== "playing" || state.answers.length > state.index) return state;
      const option = state.rounds[state.index].challenge.options.find((o) => o.id === action.optionId);
      if (!option) return state;
      return { ...state, answers: [...state.answers, { optionId: option.id, correct: option.isCorrect }] };
    }
    case "next": {
      if (state.phase !== "playing" || state.answers.length <= state.index) return state;
      const index = state.index + 1;
      return index >= state.rounds.length
        ? { phase: "result", rounds: state.rounds, answers: state.answers }
        : { ...state, index };
    }
  }
}

/** O que a avaliação de uma rodada mostra: problema, escolha, opção mais adequada e solução. */
export interface ChoiceFeedback {
  correct: boolean;
  chosen: ChallengeOption;
  best: ChallengeOption;
  problem: { id: ProblemCategoryId; title: string; summary: string };
  recommended: Alternative;
  finalExplanation: Explanation;
}

export function explainChoice(
  knowledgeBase: KnowledgeBase,
  round: ChoiceRound,
  optionId: string,
): ChoiceFeedback | null {
  const problem = knowledgeBase.problems.find((p) => p.id === round.categoryId);
  const chosen = round.challenge.options.find((o) => o.id === optionId);
  const best = round.challenge.options.find((o) => o.isCorrect);
  const recommended = problem?.alternatives.find((a) => a.id === problem.recommendedAlternativeId);
  if (!problem || !chosen || !best || !recommended) return null;
  return {
    correct: chosen.isCorrect,
    chosen,
    best,
    problem: { id: problem.id, title: problem.title, summary: problem.summary },
    recommended,
    finalExplanation: problem.finalExplanation,
  };
}

export interface ChoiceSummary {
  score: number;
  maxScore: number;
  correctCount: number;
  total: number;
  /** Resumo do que foi aprendido em cada rodada. */
  learned: { categoryId: ProblemCategoryId; title: string; recommended: string; correct: boolean }[];
}

export function summarizeChoice(
  knowledgeBase: KnowledgeBase,
  rounds: readonly ChoiceRound[],
  answers: readonly ChoiceAnswer[],
): ChoiceSummary {
  const correctCount = answers.filter((answer) => answer.correct).length;
  return {
    score: correctCount * CHOICE_POINTS,
    maxScore: rounds.length * CHOICE_POINTS,
    correctCount,
    total: rounds.length,
    learned: rounds.map((round, index) => {
      const problem = knowledgeBase.problems.find((p) => p.id === round.categoryId);
      const recommended = problem?.alternatives.find((a) => a.id === problem.recommendedAlternativeId);
      return {
        categoryId: round.categoryId,
        title: problem?.title ?? round.categoryId,
        recommended: recommended?.title ?? "",
        correct: answers[index]?.correct ?? false,
      };
    }),
  };
}
