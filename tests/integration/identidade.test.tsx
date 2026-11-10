/**
 * Identidade SmartHood AI: nome novo em toda a interface, espaço único da logo, indicador
 * "Pensando" e composição decorativa que não atrapalha a interação.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatView } from "@/components/assistant/ChatView";
import { EnergyScene } from "@/components/home/EnergyScene";
import { BRAND_NAME, Logo } from "@/components/ui/Logo";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { THINKING_LABEL, ThinkingIndicator } from "@/components/ui/ThinkingIndicator";
import { knowledgeBase } from "@/data";
import type { AssistantActions } from "@/hooks/use-assistant";
import { createDeterministicAssistant } from "@/lib/assistant/deterministic-assistant";
import { conversationReducer, createConversation } from "@/lib/conversation";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });

describe("identidade SmartHood AI", () => {
  it("o nome oficial está nos metadados, no rodapé e na marca", () => {
    expect(BRAND_NAME).toBe("SmartHood AI");
    // O layout não roda no Vitest (fontes do Next); conferimos que os metadados usam a constante.
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toContain("default: BRAND_NAME");
    expect(layout).toContain("siteName: BRAND_NAME");
    expect(renderToStaticMarkup(<SiteFooter />)).toContain("SmartHood");
  });

  it("nenhum arquivo da interface usa o nome antigo", () => {
    for (const file of files("src").filter((f) => /\.(tsx?|css|svg)$/.test(f))) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/Vizinhança Inteligente/);
    }
  });

  it("a logo tem um espaço único e de tamanho fixo, pronto para a troca", () => {
    const markup = renderToStaticMarkup(<Logo />);
    expect(markup.match(/data-logo-slot/g)).toHaveLength(1);
    expect(markup).toMatch(/data-logo-slot=""[^>]*|class="[^"]*size-10[^"]*"[^>]*data-logo-slot/);
  });
});

describe("indicador Pensando", () => {
  it("mostra três pontos, o texto e o complemento só para leitores de tela", () => {
    const markup = renderToStaticMarkup(<ThinkingIndicator detail="Analisando o seu relato..." />);
    expect(markup).toContain('role="status"');
    expect(markup.match(/thinking-dot/g)).toHaveLength(3);
    expect(markup).toContain(`>${THINKING_LABEL}<`);
    expect(markup).toContain('<span class="sr-only">Analisando o seu relato...</span>');
  });

  it("aparece na conversa junto com a mensagem enviada, e some quando a resposta chega", async () => {
    const service = createDeterministicAssistant(knowledgeBase);
    const start = service.content(service.initialState());
    const situations = start.step === "relato" ? start.options : [];
    const actions: AssistantActions = {
      submitReport: async () => true,
      selectSituation: async () => true,
      advance: async () => true,
      answer: async () => true,
      restart: () => {},
      startSituation: async () => true,
      retry: () => {},
    };
    const action = { type: "SUBMIT_REPORT", text: "Deixo o ar ligado com a janela aberta." } as const;
    let conversation = createConversation(service.initialState());
    conversation = conversationReducer(conversation, { type: "request", request: { action, text: action.text } });
    const render = () =>
      renderToStaticMarkup(
        <ChatView
          conversation={conversation}
          allowedActions={service.allowedActions(conversation.flow)}
          situations={situations}
          actions={actions}
        />,
      );
    const pending = render();
    expect(pending).toContain("Deixo o ar ligado");
    expect(pending).toContain("data-thinking");
    expect(pending).toContain(THINKING_LABEL);

    const transition = await service.respond(conversation.flow, action);
    conversation = conversationReducer(conversation, {
      type: "response",
      transition,
      content: service.content(transition.state),
    });
    expect(render()).not.toContain("data-thinking");
  });
});

describe("composição de motion graphics", () => {
  it("é decorativa: escondida de leitores de tela e sem capturar cliques", () => {
    const markup = renderToStaticMarkup(<EnergyScene />);
    expect(markup).toMatch(/^<div aria-hidden="true" class="pointer-events-none/);
    expect(markup).toContain("<svg");
    expect(markup).not.toMatch(/<(a|button|img|script)\b/);
    expect(markup).not.toContain("http");
  });
});
