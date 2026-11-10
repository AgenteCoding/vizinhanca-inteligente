/**
 * Assistente determinístico: o motor de regras atual por trás do contrato `AssistantService`.
 *
 * Funciona sem internet e sem servidor. É a implementação usada hoje e continuará sendo a
 * reserva (fallback) se um provedor de IA for adicionado no futuro.
 */
import type { AssistantService } from "@/types/assistant";
import type { KnowledgeBase } from "@/types/knowledge";
import { createFlowEngine } from "../flow-engine";

export function createDeterministicAssistant(knowledgeBase: KnowledgeBase): AssistantService {
  const engine = createFlowEngine(knowledgeBase);
  return {
    provider: "deterministic",
    initialState: () => engine.initialState,
    // O motor é síncrono e puro; a promessa só cumpre o contrato assíncrono do serviço.
    respond: async (state, action) => engine.transition(state, action),
    content: engine.content,
    allowedActions: engine.allowedActions,
  };
}
