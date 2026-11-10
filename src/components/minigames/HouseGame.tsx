"use client";

import type { Ref } from "react";
import { gamesData } from "@/data/games";
import { useFocusOnChange } from "@/hooks/use-focus-on-change";
import { useHouseGame, type HouseActions } from "@/hooks/use-games";
import { evaluateHouse, type HouseState, type ProblemOutcome } from "@/lib/games/casa-eficiente";
import type { HouseData, HouseSolution } from "@/types/games";
import { ExplanationText, SourceLegend } from "../assistant/ExplanationText";
import { Button } from "../ui/Button";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon } from "../ui/Icon";
import { GameIntro, GameResult, GameToolbar, ResultSection, VerdictBadge } from "./GameShell";

export const KIND_LABELS: Record<HouseSolution["kind"], string> = {
  tecnologia: "Tecnologia",
  habito: "Hábito",
};

export function houseInstructions(max: number): string[] {
  return [
    "Conheça os problemas de energia da casa.",
    `Escolha até ${max} soluções, misturando tecnologias e hábitos. Toque de novo para desmarcar.`,
    "Peça a avaliação: o jogo analisa a combinação, não cada peça sozinha.",
    "Resolver um problema vale 2 pontos do jogo, ajudar vale 1, e equilibrar tecnologia e hábitos vale mais 2.",
  ];
}

const OUTCOME = {
  resolve: { tone: "right", text: "Resolvido" },
  ajuda: { tone: "partial", text: "Parcialmente" },
  none: { tone: "wrong", text: "Sem solução" },
} as const;

function OutcomeRow({ outcome }: { outcome: ProblemOutcome }) {
  const look = OUTCOME[outcome.level ?? "none"];
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-ice p-3">
      <Icon name={CATEGORY_ICONS[outcome.problem.categoryId]} className="mt-0.5 size-6 shrink-0" />
      <div className="grid gap-1">
        <p>{outcome.problem.description}</p>
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <VerdictBadge tone={look.tone}>{look.text}</VerdictBadge>
          {outcome.by.length > 0 ? <span>com {outcome.by.join(", ")}</span> : null}
        </p>
      </div>
    </li>
  );
}

/** Tela do jogo, sem estado próprio (pode ser testada isoladamente). */
export function HouseGameView({
  house,
  state,
  actions,
  headingRef,
}: {
  house: HouseData;
  state: HouseState;
  actions: HouseActions;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  if (state.phase === "intro") {
    return (
      <GameIntro
        icon="home"
        title="Construa uma Casa Eficiente"
        description={`Ajude a ${house.house.replace(/^Casa da /, "")} a combinar tecnologias e hábitos para usar melhor a energia.`}
        instructions={houseInstructions(house.maxSelections)}
        onStart={actions.start}
        headingRef={headingRef}
      />
    );
  }

  if (state.phase === "result") {
    const report = evaluateHouse(house, state.selected);
    const resolved = report.outcomes.filter((o) => o.level === "resolve").length;
    return (
      <GameResult
        title="Construa uma Casa Eficiente"
        score={report.score}
        maxScore={report.maxScore}
        headline={`${resolved} de ${report.outcomes.length} problemas resolvidos. ${
          report.balanced ? "A combinação equilibra tecnologia e hábitos." : "Falta equilíbrio entre tecnologia e hábitos."
        }`}
        onRestart={actions.restart}
        headingRef={headingRef}
      >
        <ResultSection icon="home" title={`Como ficou a ${house.house}`}>
          <ul className="grid gap-2">
            {report.outcomes.map((outcome) => (
              <OutcomeRow key={outcome.problem.categoryId} outcome={outcome} />
            ))}
          </ul>
        </ResultSection>
        <ResultSection icon="check-circle" title="Soluções escolhidas">
          <ul className="grid gap-4">
            {report.selected.map((solution) => (
              <li key={solution.id} className="grid gap-1 border-l-4 border-petrol pl-3">
                <p className="font-bold">
                  {solution.name} <span className="text-sm font-normal text-petrol-soft">({KIND_LABELS[solution.kind]})</span>
                </p>
                <p className="mt-1 text-sm font-bold uppercase tracking-wide text-petrol-soft">Benefício</p>
                <ExplanationText explanation={solution.benefit} />
                <p className="mt-1 text-sm font-bold uppercase tracking-wide text-petrol-soft">Limitação</p>
                <ExplanationText explanation={solution.limitation} />
              </li>
            ))}
          </ul>
        </ResultSection>
        {report.positives.length > 0 ? (
          <ResultSection icon="star" title="Pontos positivos">
            <ul className="grid list-disc gap-2 pl-5">
              {report.positives.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </ResultSection>
        ) : null}
        {report.improvements.length > 0 ? (
          <ResultSection icon="info" title="O que poderia melhorar">
            <ul className="grid list-disc gap-2 pl-5">
              {report.improvements.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </ResultSection>
        ) : null}
        {report.recommendations.length > 0 ? (
          <ResultSection icon="leaf" title="Recomendações adicionais">
            <ul className="grid gap-2">
              {report.recommendations.map((item) => (
                <li key={item.problem.categoryId}>
                  <span className="font-bold">{item.problem.description}</span> Considere: {item.solutions.join(" ou ")}.
                </li>
              ))}
            </ul>
          </ResultSection>
        ) : null}
        <SourceLegend />
      </GameResult>
    );
  }

  const full = state.selected.length >= house.maxSelections;
  const preview = evaluateHouse(house, state.selected);

  return (
    <div className="grid gap-5">
      <GameToolbar
        current={state.selected.length}
        total={house.maxSelections}
        progressLabel={`${state.selected.length} de ${house.maxSelections} soluções escolhidas`}
        score={preview.score}
        onRestart={actions.restart}
      />
      <section aria-labelledby="casa-titulo" className="rounded-3xl border-2 border-petrol/20 bg-surface p-4 sm:p-5">
        <h1 id="casa-titulo" ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight">
          {house.house}
        </h1>
        <h2 className="mt-3 font-bold">Problemas da casa</h2>
        <ul className="mt-2 grid gap-2">
          {preview.outcomes.map((outcome) => (
            <OutcomeRow key={outcome.problem.categoryId} outcome={outcome} />
          ))}
        </ul>
      </section>
      <section aria-labelledby="solucoes-titulo" className="grid gap-3">
        <h2 id="solucoes-titulo" className="text-xl font-bold">
          Soluções disponíveis
        </h2>
        <p className="text-petrol-soft" aria-live="polite">
          {full
            ? `Limite de ${house.maxSelections} soluções atingido. Desmarque uma para trocar.`
            : `Você ainda pode escolher ${house.maxSelections - state.selected.length}.`}
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {house.solutions.map((solution) => {
            const pressed = state.selected.includes(solution.id);
            return (
              <li key={solution.id}>
                <button
                  type="button"
                  aria-pressed={pressed}
                  disabled={full && !pressed}
                  onClick={() => actions.toggle(solution.id)}
                  className={`flex h-full min-h-14 w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    pressed ? "border-petrol bg-lime/40" : "border-line bg-ice hover:border-petrol"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-2 border-petrol ${
                      pressed ? "bg-petrol text-lime" : "bg-surface"
                    }`}
                  >
                    {pressed ? <Icon name="check" className="size-4" /> : null}
                  </span>
                  <span className="grid gap-1">
                    <span className="font-bold leading-snug">{solution.name}</span>
                    <span className="text-sm font-bold text-petrol-soft">{KIND_LABELS[solution.kind]}</span>
                    <span className="leading-snug">{solution.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="accent" disabled={state.selected.length === 0} onClick={actions.finish}>
          Avaliar minha casa
          <Icon name="chevron" className="size-5 -rotate-90" />
        </Button>
        {state.selected.length === 0 ? (
          <span className="text-sm text-petrol-soft">Escolha pelo menos uma solução.</span>
        ) : null}
      </div>
    </div>
  );
}

export function HouseGame() {
  const { state, actions } = useHouseGame();
  const headingRef = useFocusOnChange<HTMLHeadingElement>(state.phase);
  return <HouseGameView house={gamesData.house} state={state} actions={actions} headingRef={headingRef} />;
}
