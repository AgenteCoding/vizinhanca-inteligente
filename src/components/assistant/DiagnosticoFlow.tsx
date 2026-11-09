"use client";

import { useEffect, useRef } from "react";
import { useDiagnostico } from "@/hooks/use-diagnostico";
import { DiagnosticoView } from "./DiagnosticoView";

/** Liga o hook à visão e leva o foco ao título a cada troca de etapa (leitores de tela). */
export function DiagnosticoFlow() {
  const { view, actions } = useDiagnostico();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const step = view.content.step;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  return <DiagnosticoView view={view} actions={actions} headingRef={headingRef} />;
}
