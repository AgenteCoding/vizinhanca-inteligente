/**
 * Hook que liga a conversa (React) ao serviço do assistente.
 *
 * Os componentes usam só este hook: não conhecem o motor nem o provedor. O serviço vem de um
 * contexto, com o motor determinístico como padrão. Trocar de provedor no futuro (por exemplo,
 * uma rota no servidor que use um modelo de linguagem, com este motor como reserva) é mudar o
 * valor do contexto, sem mexer nos componentes.
 *
 * Tudo fica na memória do navegador; nada é salvo nem enviado. "Novo diagnóstico" apaga tudo.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { knowledgeBase } from "@/data";
import { createDeterministicAssistant } from "@/lib/assistant/deterministic-assistant";
import { minimumThinkingMs, withMinimumDelay } from "@/lib/assistant/thinking-time";
import { conversationReducer, createConversation } from "@/lib/conversation";
import type { AssistantService, ConversationState } from "@/types/assistant";
import type { FlowAction, FlowActionType, StepContent } from "@/types/engine";
import type { ProblemCategoryId } from "@/types/knowledge";

/** Serviço padrão do site: o motor determinístico, montado uma vez a partir da base validada. */
export const defaultAssistant: AssistantService = createDeterministicAssistant(knowledgeBase);

/** Ponto único para trocar o provedor do assistente (ou usar um serviço de teste). */
export const AssistantServiceContext = createContext<AssistantService>(defaultAssistant);

/** Uma espera em andamento do indicador "Pensando" (para poder cancelá-la). */
interface PendingTimer {
  id: ReturnType<typeof setTimeout>;
  release: () => void;
}

export interface AssistantActions {
  /** Relato digitado. Resolve `true` se o assistente aceitou (a caixa de texto pode ser limpa). */
  submitReport: (text: string) => Promise<boolean>;
  selectSituation: (categoryId: ProblemCategoryId, label: string) => Promise<boolean>;
  advance: (label: string) => Promise<boolean>;
  answer: (optionId: string, label: string) => Promise<boolean>;
  /** Começa do zero (sem recarregar a página). */
  restart: () => void;
  /** Recomeça e já escolhe uma situação (cartões e sugestões fora da conversa). */
  startSituation: (categoryId: ProblemCategoryId, label: string) => Promise<boolean>;
  /** Repete o último pedido que falhou por erro do provedor. */
  retry: () => void;
}

/** Uma das seis situações, para sugestões e cartões. */
export interface SituationSummary {
  id: ProblemCategoryId;
  title: string;
  summary: string;
}

export interface AssistantView {
  conversation: ConversationState;
  /** As seis situações da base (para as sugestões perto do campo de conversa). */
  situations: SituationSummary[];
  /** Conteúdo e ações permitidas da etapa atual, segundo o serviço. */
  content: StepContent;
  allowedActions: FlowActionType[];
  actions: AssistantActions;
}

export function useAssistant(): AssistantView {
  const service = useContext(AssistantServiceContext);
  const [conversation, dispatch] = useReducer(conversationReducer, service, (s) =>
    createConversation(s.initialState()),
  );
  // Referências para as respostas assíncronas: estado do fluxo, pedido em andamento e "geração"
  // da conversa (um recomeço invalida respostas que ainda estavam a caminho).
  const flowRef = useRef(conversation.flow);
  const busyRef = useRef(false);
  const generationRef = useRef(0);
  // Esperas do "Pensando" em andamento. Recomeçar a conversa ou sair da página cancela todas.
  const timersRef = useRef(new Set<PendingTimer>());

  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const timer: PendingTimer = {
          id: setTimeout(() => {
            timersRef.current.delete(timer);
            resolve();
          }, ms),
          release: resolve,
        };
        timersRef.current.add(timer);
      }),
    [],
  );

  const cancelTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer.id);
      timer.release();
    }
    timersRef.current.clear();
  }, []);

  useEffect(
    () => () => {
      // Componente desmontado: respostas a caminho são descartadas e nenhum timer fica vivo.
      generationRef.current += 1;
      cancelTimers();
    },
    [cancelTimers],
  );

  const send = useCallback(
    async (action: FlowAction, text: string): Promise<boolean> => {
      if (busyRef.current) return false;
      busyRef.current = true;
      const generation = generationRef.current;
      dispatch({ type: "request", request: { action, text } });
      try {
        // Espera visual = máximo entre o mínimo do "Pensando" e o tempo real do provedor.
        const transition = await withMinimumDelay(
          Promise.resolve(service.respond(flowRef.current, action)),
          minimumThinkingMs(action.type),
          sleep,
        );
        if (generation !== generationRef.current) return false;
        if (transition.ok) flowRef.current = transition.state;
        dispatch({ type: "response", transition, content: service.content(transition.state) });
        return transition.ok;
      } catch {
        if (generation === generationRef.current) dispatch({ type: "failure" });
        return false;
      } finally {
        if (generation === generationRef.current) busyRef.current = false;
      }
    },
    [service, sleep],
  );

  const restart = useCallback(() => {
    generationRef.current += 1;
    busyRef.current = false;
    cancelTimers();
    const initial = service.initialState();
    flowRef.current = initial;
    dispatch({ type: "reset", initial });
  }, [service, cancelTimers]);

  const { failed } = conversation;
  const retry = useCallback(() => {
    if (failed) void send(failed.action, failed.text);
  }, [failed, send]);

  const actions = useMemo<AssistantActions>(
    () => ({
      submitReport: (text) => send({ type: "SUBMIT_REPORT", text }, text),
      selectSituation: (categoryId, label) => send({ type: "SELECT_CATEGORY", categoryId }, label),
      advance: (label) => send({ type: "ADVANCE" }, label),
      answer: (optionId, label) => send({ type: "ANSWER_CHALLENGE", optionId }, label),
      restart,
      startSituation: (categoryId, label) => {
        restart();
        return send({ type: "SELECT_CATEGORY", categoryId }, label);
      },
      retry,
    }),
    [send, restart, retry],
  );

  const content = useMemo(() => service.content(conversation.flow), [service, conversation.flow]);
  const allowedActions = useMemo(
    () => service.allowedActions(conversation.flow),
    [service, conversation.flow],
  );

  const situations = useMemo<SituationSummary[]>(() => {
    const start = service.content(service.initialState());
    return start.step === "relato" ? start.options : [];
  }, [service]);

  return { conversation, situations, content, allowedActions, actions };
}
