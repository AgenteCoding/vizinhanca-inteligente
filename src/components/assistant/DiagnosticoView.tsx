import type { RefObject } from "react";
import type { DiagnosticoActions, DiagnosticoView as View } from "@/hooks/use-diagnostico";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Notice } from "../ui/Notice";
import { SiteHeader } from "../ui/SiteHeader";
import { ChallengeStep } from "./ChallengeStep";
import { REJECTION_MESSAGES, STEP_HINTS, STEP_TITLES } from "./messages";
import { StepCircuit } from "./StepCircuit";
import {
  AlternativesView,
  CausesView,
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
    <>
      <SiteHeader compactOnMobile>
        <Button variant="secondary" onClick={actions.restart}>
          <Icon name="restart" className="size-5" />
          Recomeçar
        </Button>
      </SiteHeader>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <h1 className="sr-only">Assistente de diagnóstico da Vizinhança Inteligente</h1>
        <StepCircuit current={content.step} />

        <section key={content.step} aria-labelledby="titulo-etapa" className="step-enter mt-8">
          <h2
            id="titulo-etapa"
            ref={headingRef}
            tabIndex={-1}
            data-step={content.step}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            {STEP_TITLES[content.step]}
          </h2>
          <p className="mt-2 text-lg text-ink-soft">{STEP_HINTS[content.step]}</p>

          <div aria-live="polite" className="mt-4">
            {rejection ? (
              <Notice tone="review" role="alert">
                <p className="font-bold">{REJECTION_MESSAGES[rejection]}</p>
              </Notice>
            ) : null}
          </div>

          <div className="mt-4">
            {content.step === "relato" ? <ReportView content={content} actions={actions} /> : null}
            {content.step === "diagnostico" ? <DiagnosisView content={content} actions={actions} /> : null}
            {content.step === "causas" ? <CausesView content={content} actions={actions} /> : null}
            {content.step === "alternativas" ? (
              <AlternativesView content={content} actions={actions} />
            ) : null}
            {content.step === "desafio" ? <ChallengeStep content={content} actions={actions} /> : null}
            {content.step === "avaliacao" ? <EvaluationView content={content} actions={actions} /> : null}
            {content.step === "explicacao-final" ? (
              <FinalView content={content} actions={actions} />
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
