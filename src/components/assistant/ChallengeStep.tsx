"use client";

import { useState, type FormEvent } from "react";
import type { DiagnosticoActions } from "@/hooks/use-diagnostico";
import type { StepContent } from "@/types/engine";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

type ChallengeContent = Extract<StepContent, { step: "desafio" }>;

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Visão do desafio (sem estado): o visitante marca uma opção e confirma.
 * Confirmar evita respostas por toque acidental na tela da feira.
 */
export function ChallengeView({
  content,
  selectedId,
  onSelect,
  onConfirm,
}: {
  content: ChallengeContent;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  onConfirm: () => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm();
  };
  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <p id="pergunta-desafio" className="rounded-3xl bg-ink p-5 text-lg font-bold leading-snug text-paper sm:p-6 sm:text-2xl">
        {content.question}
      </p>
      <div role="radiogroup" aria-labelledby="pergunta-desafio" className="grid gap-3">
        {content.options.map((option, index) => {
          const checked = option.id === selectedId;
          return (
            <label
              key={option.id}
              className={`flex min-h-16 cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ai ${
                checked ? "border-ink bg-lime/35" : "border-line bg-surface hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="resposta-desafio"
                value={option.id}
                checked={checked}
                onChange={() => onSelect(option.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink font-extrabold ${
                  checked ? "bg-ink text-lime" : "bg-surface text-ink"
                }`}
              >
                {checked ? <Icon name="check" className="size-5" /> : LETTERS[index]}
              </span>
              <span className="pt-1 text-lg leading-snug">{option.text}</span>
            </label>
          );
        })}
      </div>
      <div>
        <Button type="submit" disabled={selectedId === null}>
          Confirmar resposta
        </Button>
        {selectedId === null ? (
          <p className="mt-2 text-sm text-ink-soft">Marque uma das opções para confirmar.</p>
        ) : null}
      </div>
    </form>
  );
}

/** Guarda só a opção marcada (estado de tela); a avaliação é feita pelo motor. */
export function ChallengeStep({
  content,
  actions,
}: {
  content: ChallengeContent;
  actions: DiagnosticoActions;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <ChallengeView
      content={content}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onConfirm={() => {
        if (selectedId !== null) actions.answer(selectedId);
      }}
    />
  );
}
