import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import { createDeterministicAssistant } from "@/lib/assistant/deterministic-assistant";
import { createFlowEngine } from "@/lib/flow-engine";
import type { FlowAction } from "@/types/engine";

const service = createDeterministicAssistant(knowledgeBase);
const engine = createFlowEngine(knowledgeBase);

describe("assistente determinístico (contrato AssistantService)", () => {
  it("identifica o provedor e começa no relato", () => {
    expect(service.provider).toBe("deterministic");
    expect(service.initialState()).toEqual({ step: "relato" });
  });

  it("responde exatamente como o motor de fluxo, de forma assíncrona", async () => {
    const actions: FlowAction[] = [
      { type: "SUBMIT_REPORT", text: "Os postes ficam acesos durante o dia." },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ADVANCE" },
      { type: "ANSWER_CHALLENGE", optionId: "verificar-rele" },
      { type: "ADVANCE" },
    ];
    let viaService = service.initialState();
    let viaEngine = engine.initialState;
    for (const action of actions) {
      const promise = service.respond(viaService, action);
      expect(promise).toBeInstanceOf(Promise);
      const fromService = await promise;
      const fromEngine = engine.transition(viaEngine, action);
      expect(fromService).toEqual(fromEngine);
      viaService = fromService.state;
      viaEngine = fromEngine.state;
    }
    expect(viaService.step).toBe("explicacao-final");
  });

  it("recusa ações fora de ordem, como o motor", async () => {
    const result = await service.respond(service.initialState(), { type: "ADVANCE" });
    expect(result).toMatchObject({ ok: false, reason: "action-not-allowed" });
  });

  it("expõe conteúdo e ações permitidas da etapa", () => {
    const state = service.initialState();
    expect(service.content(state).step).toBe("relato");
    expect(service.allowedActions(state)).toContain("SUBMIT_REPORT");
  });
});
