/**
 * Estado da conversa com o assistente (TypeScript puro, sem React).
 *
 * Registra as falas e o andamento dos pedidos. Não decide nada sobre o diagnóstico: quem decide
 * é o serviço do assistente (hoje, o motor determinístico). Recomeçar apaga tudo.
 */
import type { ConversationEvent, ConversationState } from "@/types/assistant";
import type { FlowState } from "@/types/engine";

export function createConversation(initial: FlowState): ConversationState {
  return {
    flow: initial,
    turns: [],
    status: "idle",
    pending: null,
    rejection: null,
    failed: null,
    nextId: 1,
  };
}

export function conversationReducer(state: ConversationState, event: ConversationEvent): ConversationState {
  switch (event.type) {
    case "reset":
      return createConversation(event.initial);

    case "request":
      // Um pedido por vez: enquanto o assistente responde, novos pedidos são ignorados.
      if (state.status === "pending") return state;
      return { ...state, status: "pending", pending: event.request, rejection: null, failed: null };

    case "response": {
      if (state.status !== "pending" || !state.pending) return state;
      const { transition, content } = event;
      if (!transition.ok) {
        return { ...state, status: "idle", pending: null, rejection: transition.reason };
      }
      const text = state.pending.text.trim();
      const visitorTurn = text ? [{ id: state.nextId, role: "visitor" as const, text }] : [];
      const assistantId = state.nextId + visitorTurn.length;
      return {
        ...state,
        flow: transition.state,
        turns: [...state.turns, ...visitorTurn, { id: assistantId, role: "assistant", content }],
        status: "idle",
        pending: null,
        rejection: null,
        nextId: assistantId + 1,
      };
    }

    case "failure":
      if (state.status !== "pending") return state;
      return { ...state, status: "error", failed: state.pending, pending: null };
  }
}

/** A conversa já começou (há falas)? Antes disso, a tela mostra as boas-vindas. */
export function hasStarted(state: ConversationState): boolean {
  return state.turns.length > 0;
}
