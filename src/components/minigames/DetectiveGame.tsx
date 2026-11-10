"use client";

import { useEffect, type Ref } from "react";
import { gamesData } from "@/data/games";
import { useFocusOnChange } from "@/hooks/use-focus-on-change";
import { useDetectiveGame, type DetectiveActions } from "@/hooks/use-games";
import { allItems, scoreVerdict, summarizeDetective, VERDICT_POINTS, type DetectiveState } from "@/lib/games/detetive";
import type { DetectiveData, DetectiveItem, DetectiveVerdict } from "@/types/games";
import { ExplanationText, SourceLegend } from "../assistant/ExplanationText";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { GameIntro, GameResult, GameToolbar, ResultSection, VerdictBadge } from "./GameShell";

export const VERDICT_LABELS: Record<DetectiveVerdict, string> = {
  desperdicio: "É desperdício",
  normal: "Está normal",
  depende: "Depende do contexto",
};

const VERDICT_ORDER: DetectiveVerdict[] = ["desperdicio", "normal", "depende"];

export const DETECTIVE_INSTRUCTIONS = [
  "Percorra os cômodos da casa e leia cada situação.",
  "Para cada uma, diga se é desperdício, se está normal ou se depende do contexto.",
  "Depois de cada análise, veja a explicação. Ninguém perde pontos por errar: a ideia é aprender.",
  "Análise certa vale 2 pontos do jogo; quando a resposta certa ou a sua for \"depende\", vale 1.",
];

function toneOf(points: number): "right" | "partial" | "wrong" {
  if (points === VERDICT_POINTS.exact) return "right";
  return points === VERDICT_POINTS.partial ? "partial" : "wrong";
}

const TONE_TEXT = { right: "Análise certa", partial: "Quase", wrong: "Não exatamente" } as const;

function ItemCard({
  item,
  answer,
  onClassify,
}: {
  item: DetectiveItem;
  answer: DetectiveVerdict | undefined;
  onClassify: (itemId: string, verdict: DetectiveVerdict) => void;
}) {
  const labelId = `situacao-${item.id}`;
  if (answer === undefined) {
    return (
      <li className="rounded-2xl border-2 border-line bg-ice p-3">
        <p id={labelId} className="font-bold leading-snug">
          {item.label}
        </p>
        <div role="group" aria-labelledby={labelId} className="mt-3 grid gap-2 sm:grid-cols-3">
          {VERDICT_ORDER.map((verdict) => (
            <Button
              key={verdict}
              variant="secondary"
              className="min-h-12 px-3 text-base"
              onClick={() => onClassify(item.id, verdict)}
            >
              {VERDICT_LABELS[verdict]}
            </Button>
          ))}
        </div>
      </li>
    );
  }
  const tone = toneOf(scoreVerdict(item.verdict, answer));
  return (
    <li
      id={`analise-${item.id}`}
      tabIndex={-1}
      className="grid gap-2 rounded-2xl border-2 border-line bg-surface p-3"
      data-item-id={item.id}
    >
      <p className="font-bold leading-snug">{item.label}</p>
      <p className="flex flex-wrap items-center gap-2">
        <VerdictBadge tone={tone}>{TONE_TEXT[tone]}</VerdictBadge>
        <span className="text-sm">
          Você disse: <strong>{VERDICT_LABELS[answer]}</strong>
          {answer !== item.verdict ? (
            <>
              {" "}
              · Resposta: <strong>{VERDICT_LABELS[item.verdict]}</strong>
            </>
          ) : null}
        </span>
      </p>
      <ExplanationText explanation={item.explanation} />
    </li>
  );
}

/** Tela do jogo, sem estado próprio (pode ser testada isoladamente). */
export function DetectiveGameView({
  data,
  state,
  actions,
  headingRef,
}: {
  data: DetectiveData;
  state: DetectiveState;
  actions: DetectiveActions;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  if (state.phase === "intro") {
    return (
      <GameIntro
        icon="search"
        title="Detetive do Desperdício"
        description={`${data.house}. Investigue a casa: nem tudo o que está ligado é desperdício.`}
        instructions={DETECTIVE_INSTRUCTIONS}
        onStart={actions.start}
        headingRef={headingRef}
      />
    );
  }

  if (state.phase === "result") {
    const summary = summarizeDetective(data, state.answers);
    return (
      <GameResult
        title="Detetive do Desperdício"
        score={summary.score}
        maxScore={summary.maxScore}
        headline={`Você encontrou ${summary.wastesFound} de ${summary.wastesTotal} desperdícios e acertou ${summary.correct} de ${summary.total} análises.`}
        onRestart={actions.restart}
        headingRef={headingRef}
      >
        <ResultSection icon="search" title="Desperdícios que passaram despercebidos">
          {summary.missed.length === 0 ? (
            <p>Nenhum! Você encontrou todos os desperdícios da casa.</p>
          ) : (
            <ul className="grid gap-3">
              {summary.missed.map((item) => (
                <li key={item.id} className="border-l-4 border-petrol pl-3">
                  <p className="font-bold">{item.label}</p>
                  <ExplanationText explanation={item.explanation} className="mt-1" />
                </li>
              ))}
            </ul>
          )}
        </ResultSection>
        <ResultSection icon="leaf" title="Recomendações práticas para a casa">
          <ul className="grid list-disc gap-2 pl-5">
            {summary.recommendations.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </ResultSection>
        <SourceLegend />
      </GameResult>
    );
  }

  const items = allItems(data);
  const answered = Object.keys(state.answers).length;
  const score = items.reduce(
    (sum, item) => sum + (state.answers[item.id] ? scoreVerdict(item.verdict, state.answers[item.id]) : 0),
    0,
  );
  const last = items.find((item) => item.id === state.lastItemId);
  const lastAnswer = last ? state.answers[last.id] : undefined;
  const done = answered === items.length;

  return (
    <div className="grid gap-5">
      <GameToolbar
        current={answered}
        total={items.length}
        progressLabel={`${answered} de ${items.length} situações analisadas`}
        score={score}
        onRestart={actions.restart}
      />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold tracking-tight">
          {data.house}
        </h1>
        <p className="mt-1 text-petrol-soft">Analise cada situação. A explicação aparece logo depois.</p>
      </div>
      {/* Anúncio para leitores de tela: o resultado da última análise. */}
      <p className="sr-only" aria-live="polite">
        {last && lastAnswer
          ? `${TONE_TEXT[toneOf(scoreVerdict(last.verdict, lastAnswer))]}. ${last.label}: ${VERDICT_LABELS[last.verdict]}. ${last.explanation.text}`
          : ""}
      </p>
      <div className="grid gap-4">
        {data.rooms.map((room) => (
          <section
            key={room.id}
            aria-labelledby={`comodo-${room.id}`}
            className="rounded-3xl border-2 border-petrol/20 bg-surface p-4"
          >
            <h2 id={`comodo-${room.id}`} className="flex items-center gap-2 text-lg font-bold">
              <span className="grid size-9 place-items-center rounded-xl bg-petrol text-lime">
                <Icon name={room.id === "area-externa" ? "leaf" : "home"} className="size-5" />
              </span>
              {room.name}
            </h2>
            <ul className="mt-3 grid gap-3">
              {room.items.map((item) => (
                <ItemCard key={item.id} item={item} answer={state.answers[item.id]} onClassify={actions.classify} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <SourceLegend />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="accent" disabled={!done} onClick={actions.finish}>
          Ver resultado da investigação
          <Icon name="chevron" className="size-5 -rotate-90" />
        </Button>
        {!done ? (
          <span className="text-sm text-petrol-soft">Analise todas as situações para ver o resultado.</span>
        ) : null}
      </div>
    </div>
  );
}

export function DetectiveGame() {
  const { state, actions } = useDetectiveGame();
  const headingRef = useFocusOnChange<HTMLHeadingElement>(state.phase);
  const lastItemId = state.phase === "playing" ? state.lastItemId : null;
  useEffect(() => {
    // O botão clicado some ao virar explicação: o foco vai para a própria explicação.
    if (lastItemId) document.getElementById(`analise-${lastItemId}`)?.focus();
  }, [lastItemId]);
  return <DetectiveGameView data={gamesData.detective} state={state} actions={actions} headingRef={headingRef} />;
}
