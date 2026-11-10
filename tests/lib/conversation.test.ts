import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import { createDeterministicAssistant } from "@/lib/assistant/deterministic-assistant";
import { conversationReducer, createConversation, hasStarted } from "@/lib/conversation";
import type { ConversationState, PendingRequest } from "@/types/assistant";
import type { FlowAction } from "@/types/engine";

const service = createDeterministicAssistant(knowledgeBase);

/** Faz um pedido completo: request → resposta do serviço → response. */
async function ask(state: ConversationState, action: FlowAction, text: string) {
  const requested = conversationReducer(state, { type: "request", request: { action, text } });
  const transition = await service.respond(requested.flow, action);
  return conversationReducer(requested, {
    type: "response",
    transition,
    content: service.content(transition.state),
  });
}

describe("conversa com o assistente", () => {
  it("começa vazia, sem falas e sem pedido em andamento", () => {
    const state = createConversation(service.initialState());
    expect(state.turns).toEqual([]);
    expect(state.status).toBe("idle");
    expect(hasStarted(state)).toBe(false);
  });

  it("mostra o pedido como 'processando' até a resposta chegar", () => {
    const request: PendingRequest = { action: { type: "SUBMIT_REPORT", text: "luz" }, text: "luz" };
    const state = conversationReducer(createConversation(service.initialState()), {
      type: "request",
      request,
    });
    expect(state.status).toBe("pending");
    expect(state.pending).toEqual(request);
  });

  it("um relato aceito vira a fala do visitante seguida da resposta do assistente", async () => {
    const state = await ask(
      createConversation(service.initialState()),
      { type: "SUBMIT_REPORT", text: "Deixo o ar ligado com a janela aberta." },
      "Deixo o ar ligado com a janela aberta.",
    );
    expect(hasStarted(state)).toBe(true);
    expect(state.turns.map((turn) => turn.role)).toEqual(["visitor", "assistant"]);
    expect(state.turns[0]).toMatchObject({ role: "visitor", text: "Deixo o ar ligado com a janela aberta." });
    expect(state.turns[1]).toMatchObject({ role: "assistant", content: { step: "diagnostico" } });
    expect(state.flow.step).toBe("diagnostico");
    expect(state.status).toBe("idle");
  });

  it("uma ação recusada não cria falas e informa o motivo", async () => {
    const state = await ask(createConversation(service.initialState()), { type: "SUBMIT_REPORT", text: "  " }, "  ");
    expect(state.turns).toEqual([]);
    expect(state.rejection).toBe("empty-report");
    expect(state.flow.step).toBe("relato");
  });

  it("ignora um segundo pedido enquanto o primeiro está em andamento", () => {
    const first = conversationReducer(createConversation(service.initialState()), {
      type: "request",
      request: { action: { type: "ADVANCE" }, text: "a" },
    });
    const second = conversationReducer(first, {
      type: "request",
      request: { action: { type: "RESTART" }, text: "b" },
    });
    expect(second).toBe(first);
  });

  it("erro do provedor deixa a conversa recuperável, com o pedido guardado para tentar de novo", () => {
    const request: PendingRequest = { action: { type: "SUBMIT_REPORT", text: "poste aceso de dia" }, text: "poste aceso de dia" };
    const pending = conversationReducer(createConversation(service.initialState()), { type: "request", request });
    const failed = conversationReducer(pending, { type: "failure" });
    expect(failed.status).toBe("error");
    expect(failed.failed).toEqual(request);
    expect(failed.turns).toEqual([]);
    const again = conversationReducer(failed, { type: "request", request });
    expect(again.status).toBe("pending");
    expect(again.failed).toBeNull();
  });

  it("os identificadores das falas são únicos e crescentes", async () => {
    let state = createConversation(service.initialState());
    state = await ask(state, { type: "SELECT_CATEGORY", categoryId: "solar-sem-geracao" }, "Quero estudar o sol");
    state = await ask(state, { type: "ADVANCE" }, "Quais são as causas?");
    state = await ask(state, { type: "ADVANCE" }, "");
    const ids = state.turns.map((turn) => turn.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort((a, b) => a - b)).toEqual(ids);
    // fala vazia não gera balão do visitante
    expect(state.turns.filter((turn) => turn.role === "visitor")).toHaveLength(2);
  });

  it("recomeçar apaga as falas e volta ao relato", async () => {
    const started = await ask(
      createConversation(service.initialState()),
      { type: "SUBMIT_REPORT", text: "Minha geladeira é muito antiga e consome bastante energia." },
      "Minha geladeira é muito antiga e consome bastante energia.",
    );
    const reset = conversationReducer(started, { type: "reset", initial: service.initialState() });
    expect(reset).toEqual(createConversation(service.initialState()));
  });

  it("respostas que chegam sem pedido em andamento são ignoradas", async () => {
    const idle = createConversation(service.initialState());
    const transition = await service.respond(idle.flow, { type: "SELECT_CATEGORY", categoryId: "solar-sem-geracao" });
    expect(conversationReducer(idle, { type: "response", transition, content: service.content(transition.state) })).toBe(idle);
  });
});
