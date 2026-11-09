import type { RefObject } from "react";
import type { DiagnosticoActions, DiagnosticoView as View } from "@/hooks/use-diagnostico";
import { Button } from "../ui/Button";
import { REJECTION_MESSAGES, STEP_TITLES } from "./messages";
import {
  AlternativesView,
  CausesView,
  ChallengeView,
  DiagnosisView,
  EvaluationView,
  FinalView,
  ReportView,
} from "./StepViews";

/** Mostra a etapa atual. Só exibe o conteúdo vindo do motor e repassa as ações. */
export function DiagnosticoView({
  view,
  actions,
  headingRef,
}: {
  view: View;
  actions: DiagnosticoActions;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}) {
  const { content, rejection } = view;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Assistente da Vizinhança Inteligente</p>
        <Button variant="secondary" onClick={actions.restart}>
          Recomeçar
        </Button>
      </header>

      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold" data-step={content.step}>
        {STEP_TITLES[content.step]}
      </h2>

      <div aria-live="polite" className="min-h-6">
        {rejection ? <p role="alert">{REJECTION_MESSAGES[rejection]}</p> : null}
      </div>

      {content.step === "relato" ? <ReportView content={content} actions={actions} /> : null}
      {content.step === "diagnostico" ? <DiagnosisView content={content} actions={actions} /> : null}
      {content.step === "causas" ? <CausesView content={content} actions={actions} /> : null}
      {content.step === "alternativas" ? (
        <AlternativesView content={content} actions={actions} />
      ) : null}
      {content.step === "desafio" ? <ChallengeView content={content} actions={actions} /> : null}
      {content.step === "avaliacao" ? <EvaluationView content={content} actions={actions} /> : null}
      {content.step === "explicacao-final" ? (
        <div className="flex flex-col gap-6">
          <FinalView content={content} />
          <Button onClick={actions.restart}>Começar de novo</Button>
        </div>
      ) : null}
    </main>
  );
}
