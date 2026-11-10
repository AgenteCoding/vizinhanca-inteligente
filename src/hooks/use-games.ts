/**
 * Hooks finos dos minigames: ligam `useReducer` às regras puras de `src/lib/games`.
 * A única coisa feita aqui é gerar a semente do sorteio (o que a lógica pura não pode fazer).
 * Nada é salvo: recarregar a página ou "Jogar novamente" começa do zero.
 */
import { useMemo, useReducer } from "react";
import { knowledgeBase } from "@/data";
import { gamesData } from "@/data/games";
import { createHouseReducer, HOUSE_INITIAL, type HouseState } from "@/lib/games/casa-eficiente";
import { createDetectiveReducer, DETECTIVE_INITIAL, type DetectiveState } from "@/lib/games/detetive";
import { buildChoiceRounds, CHOICE_INITIAL, choiceReducer, type ChoiceState } from "@/lib/games/escolha-inteligente";
import { createRandom } from "@/lib/games/random";
import type { DetectiveVerdict } from "@/types/games";

const newSeed = () => Math.floor(Math.random() * 2 ** 32);

export interface ChoiceActions {
  start: () => void;
  answer: (optionId: string) => void;
  next: () => void;
  restart: () => void;
}

export function useChoiceGame(): { state: ChoiceState; actions: ChoiceActions } {
  const [state, dispatch] = useReducer(choiceReducer, CHOICE_INITIAL);
  const actions = useMemo<ChoiceActions>(
    () => ({
      start: () =>
        dispatch({
          type: "start",
          rounds: buildChoiceRounds(knowledgeBase, gamesData.choiceRounds, createRandom(newSeed())),
        }),
      answer: (optionId) => dispatch({ type: "answer", optionId }),
      next: () => dispatch({ type: "next" }),
      restart: () => dispatch({ type: "restart" }),
    }),
    [],
  );
  return { state, actions };
}

export interface DetectiveActions {
  start: () => void;
  classify: (itemId: string, verdict: DetectiveVerdict) => void;
  finish: () => void;
  restart: () => void;
}

const detectiveReducer = createDetectiveReducer(gamesData.detective);

export function useDetectiveGame(): { state: DetectiveState; actions: DetectiveActions } {
  const [state, dispatch] = useReducer(detectiveReducer, DETECTIVE_INITIAL);
  const actions = useMemo<DetectiveActions>(
    () => ({
      start: () => dispatch({ type: "start" }),
      classify: (itemId, verdict) => dispatch({ type: "classify", itemId, verdict }),
      finish: () => dispatch({ type: "finish" }),
      restart: () => dispatch({ type: "restart" }),
    }),
    [],
  );
  return { state, actions };
}

export interface HouseActions {
  start: () => void;
  toggle: (solutionId: string) => void;
  finish: () => void;
  restart: () => void;
}

const houseReducer = createHouseReducer(gamesData.house);

export function useHouseGame(): { state: HouseState; actions: HouseActions } {
  const [state, dispatch] = useReducer(houseReducer, HOUSE_INITIAL);
  const actions = useMemo<HouseActions>(
    () => ({
      start: () => dispatch({ type: "start" }),
      toggle: (solutionId) => dispatch({ type: "toggle", solutionId }),
      finish: () => dispatch({ type: "finish" }),
      restart: () => dispatch({ type: "restart" }),
    }),
    [],
  );
  return { state, actions };
}
