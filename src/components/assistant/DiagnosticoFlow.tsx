"use client";

import { useEffect, useRef } from "react";
import { useDiagnostico } from "@/hooks/use-diagnostico";
import { PROBLEM_CATEGORY_IDS } from "@/types/knowledge";
import { DiagnosticoView } from "./DiagnosticoView";

/**
 * Liga o hook à visão e leva o foco ao título a cada troca de etapa (leitores de tela).
 * Os cartões da página inicial abrem `/diagnostico#<situação>`: a situação do endereço é
 * enviada ao motor como escolha guiada (o motor recusa qualquer valor desconhecido).
 */
export function DiagnosticoFlow() {
  const { view, actions } = useDiagnostico();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = view.content.step;
  const isFirstRender = useRef(true);

  useEffect(() => {
    const requested = window.location.hash.slice(1);
    const categoryId = PROBLEM_CATEGORY_IDS.find((id) => id === requested);
    if (!categoryId) return;
    window.history.replaceState(null, "", window.location.pathname);
    actions.selectCategory(categoryId);
  }, [actions]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  return <DiagnosticoView view={view} actions={actions} headingRef={headingRef} />;
}
