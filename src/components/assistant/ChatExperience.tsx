"use client";

import { useEffect, useRef } from "react";
import { useAssistant } from "@/hooks/use-assistant";
import { PROBLEM_CATEGORY_IDS } from "@/types/knowledge";
import { ChatView } from "./ChatView";
import { VISITOR_LABELS } from "./messages";

/**
 * Liga a conversa ao assistente e cuida do foco:
 * - cada nova resposta recebe o foco (leitores de tela) e aparece na tela;
 * - "Novo diagnóstico" volta o foco ao campo de conversa;
 * - `#conversa` (botão "Começar") leva ao campo de conversa;
 * - `#<situação>` (cartões da página) começa a conversa já com a situação escolhida.
 */
export function ChatExperience() {
  const { conversation, allowedActions, situations, actions } = useAssistant();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastHeadingRef = useRef<HTMLHeadingElement>(null);
  const turnCount = conversation.turns.length;
  const previousCount = useRef(turnCount);
  // Referências para o efeito do endereço (#...), que só precisa ser registrado uma vez.
  const actionsRef = useRef(actions);
  const situationsRef = useRef(situations);
  useEffect(() => {
    actionsRef.current = actions;
    situationsRef.current = situations;
  });

  useEffect(() => {
    const before = previousCount.current;
    previousCount.current = turnCount;
    if (turnCount > before) {
      const heading = lastHeadingRef.current;
      heading?.focus({ preventScroll: true });
      // Mostra a fala do visitante logo acima da nova resposta, quando houver.
      const item = heading?.closest("li");
      const previous = item?.previousElementSibling;
      const target = previous instanceof HTMLElement && previous.dataset.role === "visitor" ? previous : item;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    } else if (turnCount === 0 && before > 0) {
      textareaRef.current?.focus();
    }
  }, [turnCount]);

  useEffect(() => {
    const handleHash = () => {
      const requested = window.location.hash.slice(1);
      if (!requested) return;
      if (requested === "conversa") {
        window.history.replaceState(null, "", window.location.pathname);
        document.getElementById("conversa")?.scrollIntoView({ block: "start" });
        textareaRef.current?.focus({ preventScroll: true });
        return;
      }
      const categoryId = PROBLEM_CATEGORY_IDS.find((id) => id === requested);
      if (!categoryId) return;
      window.history.replaceState(null, "", window.location.pathname);
      const title =
        situationsRef.current.find((situation) => situation.id === categoryId)?.title ?? categoryId;
      document.getElementById("conversa")?.scrollIntoView({ block: "start" });
      void actionsRef.current.startSituation(categoryId, VISITOR_LABELS.select(title));
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return (
    <ChatView
      conversation={conversation}
      allowedActions={allowedActions}
      situations={situations}
      actions={actions}
      textareaRef={textareaRef}
      lastHeadingRef={lastHeadingRef}
    />
  );
}
