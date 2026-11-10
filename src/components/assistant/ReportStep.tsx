"use client";

import { useState, type FormEvent } from "react";
import { MAX_INPUT_LENGTH } from "@/lib/normalize";
import type { ProblemCategoryId } from "@/types/knowledge";
import { Button } from "../ui/Button";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon } from "../ui/Icon";
import { REPORT_EXAMPLES } from "./messages";

/** Formulário de relato em texto livre. O texto vai direto ao motor; nada é salvo. */
export function ReportForm({
  onSubmit,
  showExamples = true,
}: {
  onSubmit: (text: string) => void;
  showExamples?: boolean;
}) {
  const [text, setText] = useState("");
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(text);
  };
  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
      <label htmlFor="relato" className="flex items-center gap-2 text-lg font-bold">
        <Icon name="chat" className="text-ai" />
        Seu relato
      </label>
      <textarea
        id="relato"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_INPUT_LENGTH}
        rows={3}
        aria-describedby="relato-ajuda"
        className="mt-3 w-full resize-y rounded-2xl border-2 border-line bg-paper p-4 text-lg placeholder:text-ink-soft focus:border-ai"
        placeholder="Ex.: a luz do banheiro fica acesa sem ninguém"
      />
      <p id="relato-ajuda" className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
        <span className="flex items-center gap-1.5">
          <Icon name="lock" className="size-4" />O texto fica só neste aparelho e não é guardado.
        </span>
        <span>
          {text.length}/{MAX_INPUT_LENGTH} caracteres
        </span>
      </p>
      {showExamples ? (
        <div className="mt-4">
          <p className="text-sm font-bold">Não sabe o que escrever? Use um exemplo:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {REPORT_EXAMPLES.map((example) => (
              <li key={example}>
                <button
                  type="button"
                  onClick={() => setText(example)}
                  className="min-h-12 rounded-full border border-ai/40 bg-ai-soft px-4 py-2 text-left text-ai hover:border-ai"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Button type="submit" className="mt-5 w-full sm:w-auto">
        <Icon name="scan" />
        Analisar relato
      </Button>
    </form>
  );
}

interface SituationOption {
  id: ProblemCategoryId;
  title: string;
  summary?: string;
  isCandidate?: boolean;
}

/** As seis situações para a escolha guiada; as sugestões da IA vêm marcadas com texto. */
export function SituationOptions({
  options,
  onSelect,
  label,
}: {
  options: SituationOption[];
  onSelect: (categoryId: ProblemCategoryId) => void;
  label: string;
}) {
  return (
    <fieldset>
      <legend className="text-lg font-bold">{label}</legend>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => onSelect(option.id)}
              data-candidate={option.isCandidate ? "true" : undefined}
              className={`group flex h-full w-full items-start gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition-colors hover:border-ink ${
                option.isCandidate ? "border-ai" : "border-line"
              }`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-paper text-ink transition-colors group-hover:bg-lime">
                <Icon name={CATEGORY_ICONS[option.id]} />
              </span>
              <span className="min-w-0">
                {option.isCandidate ? (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-ai-soft px-2 py-0.5 text-sm font-bold text-ai">
                    <Icon name="scan" className="size-4" />
                    Sugestão da IA
                  </span>
                ) : null}
                <span className="block font-bold leading-snug">{option.title}</span>
                {option.summary ? (
                  <span className="mt-1 block text-sm text-ink-soft">{option.summary}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
