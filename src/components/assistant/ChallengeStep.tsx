"use client";

import { useState, type FormEvent } from "react";
import type { StepContent } from "@/types/engine";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

type ChallengeContent = Extract<StepContent, { step: "desafio" }>;

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Opções do desafio (sem estado): o visitante marca uma opção e confirma.
 * Confirmar evita respostas por toque acidental na tela da feira.
 */
export function ChallengeView({
  content,
  selectedId,
  onSelect,
  onConfirm,
  questionId,
}: {
  content: ChallengeContent;
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  onConfirm: () => void;
  /** Id do elemento que contém a pergunta (rótulo do grupo de opções). */
  questionId: string;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm();
  };
  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div role="radiogroup" aria-labelledby={questionId} className="grid gap-2">
        {content.options.map((option, index) => {
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
                name="resposta-desafio"
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
  );
}

/** Guarda só a opção marcada (estado de tela); quem avalia a resposta é o assistente. */
export function ChallengeStep({
  content,
  questionId,
  onAnswer,
}: {
  content: ChallengeContent;
  questionId: string;
  onAnswer: (optionId: string, optionText: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <ChallengeView
      content={content}
      questionId={questionId}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onConfirm={() => {
        const option = content.options.find((candidate) => candidate.id === selectedId);
        if (option) onAnswer(option.id, option.text);
      }}
    />
  );
}
