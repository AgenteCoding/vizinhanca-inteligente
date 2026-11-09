"use client";

import { useState, type FormEvent } from "react";
import { MAX_INPUT_LENGTH } from "@/lib/normalize";
import type { ProblemCategoryId } from "@/types/knowledge";
import { Button } from "../ui/Button";

interface Option {
  id: ProblemCategoryId;
  title: string;
}

/** Formulário de relato em texto livre. O texto vai direto ao motor; nada é salvo. */
export function ReportForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(text);
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="relato" className="font-semibold">
        Descreva o desperdício que você viu
      </label>
      <textarea
        id="relato"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_INPUT_LENGTH}
        rows={3}
        className="rounded-lg border-2 border-current/40 bg-transparent p-3"
        placeholder="Ex.: os postes da minha rua ficam acesos durante o dia"
      />
      <span className="text-sm opacity-80">
        {text.length}/{MAX_INPUT_LENGTH} caracteres. O texto não sai do seu navegador.
      </span>
      <Button type="submit">Enviar relato</Button>
    </form>
  );
}

/** Lista das seis situações para a escolha guiada. */
export function GuidedOptions({
  options,
  onSelect,
  label,
}: {
  options: (Option & { summary?: string; isCandidate?: boolean })[];
  onSelect: (categoryId: ProblemCategoryId) => void;
  label: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">{label}</legend>
      {options.map((option) => (
        <Button
          key={option.id}
          variant={option.isCandidate ? "primary" : "secondary"}
          onClick={() => onSelect(option.id)}
        >
          {option.isCandidate ? "Sugestão: " : ""}
          {option.title}
          {option.summary ? (
            <span className="block text-sm font-normal">{option.summary}</span>
          ) : null}
        </Button>
      ))}
    </fieldset>
  );
}
