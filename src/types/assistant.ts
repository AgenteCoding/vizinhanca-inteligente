/**
 * Contratos do assistente de conversa.
 *
 * A interface (React) fala só com um `AssistantService`. Hoje existe uma implementação: o motor
 * determinístico (`src/lib/assistant/deterministic-assistant.ts`). Um provedor futuro (por
 * exemplo, um modelo de linguagem chamado por uma rota no servidor) pode implementar o mesmo
 * contrato sem mudar os componentes, mantendo o motor determinístico como reserva.
 */
import type {
  FlowAction,
  FlowActionType,
  FlowRejectionReason,
  FlowState,
  FlowTransition,
  StepContent,
} from "./engine";

/** Quem responde ao visitante. Novos provedores entram nesta lista quando forem implementados. */
export type AssistantProviderId = "deterministic";

export interface AssistantService {
  readonly provider: AssistantProviderId;
  /** Estado inicial de uma conversa nova (sem dados de visitantes anteriores). */
  initialState(): FlowState;
  /**
   * Responde a uma ação do visitante. É assíncrono porque um provedor remoto leva tempo; a
   * interface mostra "processando" enquanto espera. Erros devem ser lançados (a interface trata).
   */
  respond(state: FlowState, action: FlowAction): Promise<FlowTransition>;
  /** Conteúdo da etapa, sempre vindo da base de conhecimento validada. */
  content(state: FlowState): StepContent;
  allowedActions(state: FlowState): FlowActionType[];
}

/** Uma fala da conversa. As respostas do assistente guardam o conteúdo da etapa naquele momento. */
export type ConversationTurn =
  | { id: number; role: "visitor"; text: string }
  | { id: number; role: "assistant"; content: StepContent };

/** Pedido em andamento: a fala do visitante aparece enquanto o assistente responde. */
export interface PendingRequest {
  action: FlowAction;
  /** O que mostrar no balão do visitante (texto digitado ou rótulo da opção escolhida). */
  text: string;
}

export interface ConversationState {
  flow: FlowState;
  turns: ConversationTurn[];
  status: "idle" | "pending" | "error";
  pending: PendingRequest | null;
  /** Motivo da última ação recusada pelo motor (ex.: relato vazio). */
  rejection: FlowRejectionReason | null;
  /** Pedido que falhou por erro do provedor, para oferecer "Tentar de novo". */
  failed: PendingRequest | null;
  nextId: number;
}

/** Acontecimentos que mudam a conversa (aplicados por `conversationReducer`). */
export type ConversationEvent =
  | { type: "request"; request: PendingRequest }
  | { type: "response"; transition: FlowTransition; content: StepContent }
  | { type: "failure" }
  | { type: "reset"; initial: FlowState };
