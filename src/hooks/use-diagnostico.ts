/**
 * Hook fino que liga o React ao motor do fluxo (`src/lib/flow-engine.ts`).
 *
 * Não decide nada: repassa as ações ao motor e guarda o estado que ele devolve, junto com o
 * motivo da última recusa (para a interface avisar, por exemplo, que o relato está vazio).
 * O estado fica só na memória do navegador; nada é salvo nem enviado.
 */
import { useCallback, useMemo, useReducer } from "react";
import { knowledgeBase } from "@/data";
import { createFlowEngine } from "@/lib/flow-engine";
import type {
  FlowAction,
  FlowActionType,
  FlowRejectionReason,
  FlowState,
  StepContent,
} from "@/types/engine";
import type { ProblemCategoryId } from "@/types/knowledge";

/** Motor único do site: montado uma vez a partir da base validada (imutável). */
export const flowEngine = createFlowEngine(knowledgeBase);

export interface DiagnosticoState {
  flow: FlowState;
  /** Motivo da última ação recusada; `null` se a última ação foi aceita. */
  rejection: FlowRejectionReason | null;
}

export const initialDiagnosticoState: DiagnosticoState = {
  flow: flowEngine.initialState,
  rejection: null,
};

/** Reducer do `useReducer`: só aplica a transição do motor e registra a recusa. */
export function diagnosticoReducer(state: DiagnosticoState, action: FlowAction): DiagnosticoState {
  const result = flowEngine.transition(state.flow, action);
  if (result.ok) return { flow: result.state, rejection: null };
  return state.rejection === result.reason ? state : { flow: state.flow, rejection: result.reason };
}

export interface DiagnosticoActions {
  submitReport: (text: string) => void;
  selectCategory: (categoryId: ProblemCategoryId) => void;
  advance: () => void;
  answer: (optionId: string) => void;
  restart: () => void;
}

export interface DiagnosticoView {
  content: StepContent;
  allowedActions: FlowActionType[];
  rejection: FlowRejectionReason | null;
}

/** Visão derivada do estado: conteúdo da etapa e ações permitidas, vindos do motor. */
export function viewOf(state: DiagnosticoState): DiagnosticoView {
  return {
    content: flowEngine.content(state.flow),
    allowedActions: flowEngine.allowedActions(state.flow),
    rejection: state.rejection,
  };
}

export function useDiagnostico(): { view: DiagnosticoView; actions: DiagnosticoActions } {
  const [state, dispatch] = useReducer(diagnosticoReducer, initialDiagnosticoState);

  const submitReport = useCallback((text: string) => dispatch({ type: "SUBMIT_REPORT", text }), []);
  const selectCategory = useCallback(
    (categoryId: ProblemCategoryId) => dispatch({ type: "SELECT_CATEGORY", categoryId }),
    [],
  );
  const advance = useCallback(() => dispatch({ type: "ADVANCE" }), []);
  const answer = useCallback(
    (optionId: string) => dispatch({ type: "ANSWER_CHALLENGE", optionId }),
    [],
  );
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);

  const view = useMemo(() => viewOf(state), [state]);
  const actions = useMemo(
    () => ({ submitReport, selectCategory, advance, answer, restart }),
    [submitReport, selectCategory, advance, answer, restart],
  );
  return { view, actions };
}
