"use client";

import { useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { MAX_INPUT_LENGTH } from "@/lib/normalize";
import { Icon } from "../ui/Icon";
import { COMPOSER_HINT, COMPOSER_LABEL } from "./messages";

/**
 * Campo de conversa: texto livre com botão de envio. Enter envia; Shift + Enter quebra a linha.
 * O texto só é apagado quando o assistente aceita o relato. Nada é salvo.
 */
export function Composer({
  onSubmit,
  placeholder,
  locked = false,
  pending = false,
  error,
  textareaRef,
}: {
  /** Envia o relato; resolve `true` quando o assistente aceitou. */
  onSubmit: (text: string) => Promise<boolean>;
  placeholder: string;
  /** A etapa atual não aceita texto (o visitante continua pelas opções da conversa). */
  locked?: boolean;
  /** O assistente está respondendo. */
  pending?: boolean;
  /** Mensagem de erro recuperável, mostrada abaixo do campo. */
  error?: string | null;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  const [text, setText] = useState("");
  const blocked = locked || pending;
  const canSend = !blocked && text.trim().length > 0;

  const send = async () => {
    if (!canSend) return;
    const accepted = await onSubmit(text);
    if (accepted) setText("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-busy={pending}>
      <div
        className={`glass flex items-end gap-2 rounded-[1.75rem] p-2 pl-5 transition-shadow focus-within:ring-2 focus-within:ring-petrol ${
          error ? "ring-2 ring-wrong" : ""
        } ${blocked ? "opacity-85" : ""}`}
      >
        <label htmlFor="relato" className="sr-only">
          {COMPOSER_LABEL}
        </label>
        <textarea
          id="relato"
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={blocked}
          maxLength={MAX_INPUT_LENGTH}
          rows={locked ? 1 : 2}
          placeholder={placeholder}
          aria-describedby="relato-ajuda relato-erro"
          aria-invalid={error ? true : undefined}
          className={`max-h-48 flex-1 resize-none bg-transparent py-3 text-[1.05rem] leading-snug text-petrol placeholder:text-petrol-soft focus-visible:outline-none read-only:cursor-not-allowed ${locked ? "min-h-12 text-base" : "min-h-14"}`}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="mb-1 grid size-12 shrink-0 place-items-center rounded-full border-[1.5px] border-petrol bg-lime text-petrol shadow-[0_10px_22px_-12px_rgb(120_150_30/0.9)] transition duration-150 hover:bg-lime-strong active:scale-95 disabled:border-line disabled:bg-ice-strong disabled:text-petrol-soft disabled:shadow-none"
        >
          <Icon name="send" />
          <span className="sr-only">Enviar</span>
        </button>
      </div>
      <p id="relato-ajuda" className={`mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 px-4 text-sm text-petrol-soft ${locked ? "sr-only" : ""}`}>
        <span className="hidden sm:inline">{COMPOSER_HINT}</span>
        <span>
          {text.length}/{MAX_INPUT_LENGTH} caracteres
        </span>
      </p>
      <div id="relato-erro" aria-live="polite" className="px-4">
        {error ? (
          <p className="mt-1 flex items-start gap-2 text-sm font-semibold text-wrong">
            <Icon name="x-circle" className="mt-0.5 size-4" />
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
