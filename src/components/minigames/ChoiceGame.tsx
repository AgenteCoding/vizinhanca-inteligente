"use client";

import { useState, type FormEvent, type Ref } from "react";
import { knowledgeBase } from "@/data";
import { useFocusOnChange } from "@/hooks/use-focus-on-change";
import { useChoiceGame, type ChoiceActions } from "@/hooks/use-games";
import { CHOICE_POINTS, explainChoice, summarizeChoice, type ChoiceState } from "@/lib/games/escolha-inteligente";
import { ExplanationText, SourceLegend } from "../assistant/ExplanationText";
import { Button } from "../ui/Button";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon } from "../ui/Icon";
import { GameIntro, GameResult, GameToolbar, ResultSection, VerdictBadge } from "./GameShell";

const LETTERS = ["A", "B", "C", "D", "E"];

export const CHOICE_INSTRUCTIONS = [
  "Leia a situação de desperdício de energia.",
  "Marque a alternativa que você considera mais adequada e confirme.",
  "Veja a avaliação: por que a escolha funciona (ou não) e qual é a solução recomendada.",
  "São seis situações, uma de cada tipo de desperdício. Cada acerto vale 10 pontos do jogo.",
];

function headlineFor(correct: number, total: number): string {
  if (correct === total) return "Você escolheu a melhor alternativa em todas as situações!";
  if (correct >= total / 2) return "Bom trabalho! Reveja abaixo as situações em que outra alternativa era mais adequada.";
  return "Cada erro é uma chance de aprender. Reveja abaixo a solução recomendada para cada situação.";
}

/** Tela do jogo, sem estado próprio além do que recebe (pode ser testada isoladamente). */
export function ChoiceGameView({
  state,
  actions,
  selectedId,
  onSelect,
  headingRef,
}: {
  state: ChoiceState;
  actions: ChoiceActions;
  selectedId: string | null;
  onSelect: (optionId: string | null) => void;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  if (state.phase === "intro") {
    return (
      <GameIntro
        icon="star"
        title="Escolha Inteligente"
        description="Para cada situação de desperdício, escolha a melhor solução entre três alternativas."
        instructions={CHOICE_INSTRUCTIONS}
        onStart={actions.start}
        headingRef={headingRef}
      />
    );
  }

  if (state.phase === "result") {
    const summary = summarizeChoice(knowledgeBase, state.rounds, state.answers);
    return (
      <GameResult
        title="Escolha Inteligente"
        score={summary.score}
        maxScore={summary.maxScore}
        headline={`${summary.correctCount} de ${summary.total} escolhas adequadas. ${headlineFor(summary.correctCount, summary.total)}`}
        onRestart={actions.restart}
        headingRef={headingRef}
      >
        <ResultSection icon="book" title="O que você aprendeu">
          <ul className="grid gap-3">
            {summary.learned.map((item) => (
              <li key={item.categoryId} className="flex items-start gap-3">
                <Icon name={CATEGORY_ICONS[item.categoryId]} className="mt-0.5 size-6 shrink-0" />
                <div className="grid gap-1">
                  <p className="font-bold">{item.title}</p>
                  <p>Solução recomendada: {item.recommended}</p>
                  <p>
                    <VerdictBadge tone={item.correct ? "right" : "wrong"}>
                      {item.correct ? "Escolha adequada" : "Escolha a rever"}
                    </VerdictBadge>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </ResultSection>
      </GameResult>
    );
  }

  const round = state.rounds[state.index];
  const answer = state.answers[state.index];
  const feedback = answer ? explainChoice(knowledgeBase, round, answer.optionId) : null;
  const score = state.answers.filter((a) => a.correct).length * CHOICE_POINTS;
  const isLast = state.index === state.rounds.length - 1;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedId) actions.answer(selectedId);
  };

  return (
    <div className="grid gap-5">
      <GameToolbar
        current={state.answers.length}
        total={state.rounds.length}
        progressLabel={`Situação ${state.index + 1} de ${state.rounds.length}`}
        score={score}
        onRestart={actions.restart}
      />
      <section aria-labelledby="rodada-pergunta" className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <p className="flex items-center gap-2 font-bold text-petrol-soft">
          <Icon name={CATEGORY_ICONS[round.categoryId]} className="size-5" />
          {knowledgeBase.problems.find((p) => p.id === round.categoryId)?.title}
        </p>
        <h1
          id="rodada-pergunta"
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 text-2xl font-extrabold leading-snug tracking-tight"
        >
          {round.challenge.question}
        </h1>

        {!feedback ? (
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
            <div role="radiogroup" aria-labelledby="rodada-pergunta" className="grid gap-2">
              {round.challenge.options.map((option, index) => {
                const checked = option.id === selectedId;
                return (
                  <label
                    key={option.id}
                    className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border-2 p-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-petrol ${
                      checked ? "border-petrol bg-lime/40" : "border-line bg-ice hover:border-petrol"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resposta-escolha"
                      value={option.id}
                      checked={checked}
                      onChange={() => onSelect(option.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`grid size-8 shrink-0 place-items-center rounded-full border-2 border-petrol text-sm font-extrabold ${
                        checked ? "bg-petrol text-lime" : "bg-surface text-petrol"
                      }`}
                    >
                      {checked ? <Icon name="check" className="size-4" /> : LETTERS[index]}
                    </span>
                    <span className="pt-0.5 leading-snug">{option.text}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={selectedId === null}>
                Confirmar resposta
              </Button>
              {selectedId === null ? (
                <span className="text-sm text-petrol-soft">Marque uma das opções para confirmar.</span>
              ) : null}
            </div>
          </form>
        ) : (
          <ul className="mt-4 grid gap-2" aria-label="Alternativas">
            {round.challenge.options.map((option, index) => {
              const chosen = option.id === feedback.chosen.id;
              return (
                <li
                  key={option.id}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-3 ${
                    option.isCorrect ? "border-petrol bg-lime/30" : chosen ? "border-wrong/50 bg-wrong-soft" : "border-line bg-ice"
                  }`}
                >
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-petrol bg-surface text-sm font-extrabold">
                    {LETTERS[index]}
                  </span>
                  <span className="grid gap-1 pt-0.5">
                    <span className="leading-snug">{option.text}</span>
                    <span className="flex flex-wrap gap-2 text-sm">
                      {chosen ? <span className="font-bold">Sua escolha</span> : null}
                      {option.isCorrect ? <span className="font-bold">Mais adequada</span> : null}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div aria-live="polite">
        {feedback ? (
          <section aria-label="Avaliação da escolha" className="grid gap-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <p>
              <VerdictBadge tone={feedback.correct ? "right" : "wrong"}>
                {feedback.correct ? "Escolha adequada" : "Essa não é a mais adequada"}
              </VerdictBadge>
            </p>
            <div>
              <h2 className="font-bold">Por quê</h2>
              <p className="mt-1">{feedback.chosen.feedback}</p>
              {!feedback.correct ? (
                <p className="mt-2">
                  <span className="font-bold">Mais adequada: </span>
                  {feedback.best.text} {feedback.best.feedback}
                </p>
              ) : null}
            </div>
            <div>
              <h2 className="font-bold">O problema</h2>
              <p className="mt-1">{feedback.problem.summary}</p>
            </div>
            <div>
              <h2 className="font-bold">Solução recomendada: {feedback.recommended.title}</h2>
              <p className="mt-1">{feedback.recommended.description}</p>
            </div>
            <div>
              <h2 className="font-bold">Como contribui para a eficiência</h2>
              <ExplanationText explanation={feedback.finalExplanation} className="mt-1" />
            </div>
            <SourceLegend />
            <div>
              <Button variant="primary" onClick={actions.next}>
                {isLast ? "Ver resultado" : "Próxima situação"}
                <Icon name="chevron" className="size-5 -rotate-90" />
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** Liga a tela ao hook do jogo e guarda só a opção marcada (estado de tela). */
export function ChoiceGame() {
  const { state, actions } = useChoiceGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const key = state.phase === "playing" ? `jogando-${state.index}` : state.phase;
  const headingRef = useFocusOnChange<HTMLHeadingElement>(key);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    // Nova rodada (ou nova partida): desmarca a opção anterior.
    setLastKey(key);
    setSelectedId(null);
  }
  return (
    <ChoiceGameView
      state={state}
      actions={actions}
      selectedId={selectedId}
      onSelect={setSelectedId}
      headingRef={headingRef}
    />
  );
}
