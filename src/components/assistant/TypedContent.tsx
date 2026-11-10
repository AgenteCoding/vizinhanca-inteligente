"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Typewriter, { type Options, type TypewriterClass } from "typewriter-effect";
import { typingDelayMs, typingDurationMs } from "@/lib/typing/typing-speed";
import { buttonClasses } from "../ui/Button";
import { prepareTypedReveal, type TypedReveal } from "./typed-reveal";

/** Folga do "cão de guarda": se a animação travar (aba em segundo plano), a resposta aparece. */
const WATCHDOG_MARGIN_MS = 2500;

export const SKIP_TYPING_LABEL = "Mostrar resposta completa";

/**
 * Digitação progressiva de uma resposta pronta, venha de onde vier (motor determinístico hoje,
 * um modelo de linguagem no futuro): o componente recebe o conteúdo já renderizado como
 * `children` e só controla como ele é revelado.
 *
 * - O conteúdo é sempre renderizado inteiro pelo React (é o que vai para o HTML e para os
 *   testes). A biblioteca `typewriter-effect` funciona como motor: recebe só o texto puro
 *   (`parseHTML: false`) e, a cada caractere, chama `onCreateTextNode`; devolvemos `null` (ela
 *   não escreve nada na página) e revelamos esse caractere no texto que o React já renderizou.
 * - Anima uma única vez, quando a resposta nasce (`animate` na montagem). Re-renderizações não
 *   reiniciam nada.
 * - Com `prefers-reduced-motion`, a resposta aparece inteira na hora.
 * - Enquanto digita, o conteúdo fica `inert` (leitores de tela e teclado não veem texto pela
 *   metade nem botões incompletos) e há um botão para mostrar tudo de uma vez.
 * - Ao terminar, ao pular, ao perder a vez para uma nova mensagem ou ao desmontar, tudo volta
 *   ao estado original e os temporizadores são limpos.
 */
export function TypedContent({
  animate,
  children,
  className = "",
}: {
  /** Esta é a resposta mais recente e ainda é a vez dela. Só o valor da montagem inicia a animação. */
  animate: boolean;
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<TypedReveal | null>(null);
  const engineRef = useRef<TypewriterClass | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Depois que a resposta perde a vez, nunca mais é animada (mesmo que volte a ser a última).
  const retiredRef = useRef(false);
  // O motor só é montado para respostas que nascem como a mais recente.
  const [engineMounted, setEngineMounted] = useState(animate);
  const [typing, setTyping] = useState(false);

  /** Devolve a página ao estado original e solta os recursos. Não mexe em estado do React. */
  const release = useCallback(() => {
    if (watchdogRef.current !== null) clearTimeout(watchdogRef.current);
    watchdogRef.current = null;
    revealRef.current?.finish();
    revealRef.current = null;
    engineRef.current?.stop();
    engineRef.current = null;
  }, []);

  const finish = useCallback(() => {
    release();
    setTyping(false);
    setEngineMounted(false);
  }, [release]);

  // Opções fixas: se mudassem, a biblioteca recriaria a instância e recomeçaria a digitação.
  const [options] = useState<Partial<Options>>(() => ({
    cursor: "",
    delay: 14,
    parseHTML: false,
    skipAddStyles: true,
    useGraphemeSplitter: true,
    onlyDelayVisibleChanges: true,
    maxCatchUpDelta: 250,
    // A biblioteca avisa cada caractere; quem escreve na página é o `typed-reveal`.
    onCreateTextNode: (character: string) => {
      revealRef.current?.advance(character.length);
      return null;
    },
  }));

  /** Chamado pela biblioteca quando a instância nasce (na montagem, antes da primeira pintura). */
  const handleInit = useCallback(
    (engine: TypewriterClass) => {
      release();
      const root = rootRef.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let reveal: TypedReveal | null = null;
      try {
        reveal = root && !reduced && !retiredRef.current ? prepareTypedReveal(root) : null;
      } catch {
        reveal = null;
      }
      if (!reveal) {
        // Movimento reduzido, resposta sem texto ou falha ao preparar: mostra tudo já.
        setEngineMounted(false);
        return;
      }
      revealRef.current = reveal;
      engineRef.current = engine;
      watchdogRef.current = setTimeout(finish, typingDurationMs(reveal.characters) + WATCHDOG_MARGIN_MS);
      setTyping(true);
      try {
        engine.changeDelay(typingDelayMs(reveal.characters)).typeString(reveal.text).callFunction(finish).start();
      } catch {
        finish();
      }
    },
    [finish, release],
  );

  // Outra mensagem entrou (a resposta deixou de ser a da vez): termina na hora, sem interferir.
  useEffect(() => {
    if (animate) return;
    retiredRef.current = true;
    release();
  }, [animate, release]);

  // Conversa reiniciada ou componente desmontado: nada fica rodando.
  useEffect(() => release, [release]);

  const showTyping = typing && animate;

  const skip = () => {
    const engine = engineRef.current;
    if (engine) engine.skipToEnd();
    finish();
    // O botão some; o foco volta para o título da resposta.
    rootRef.current?.closest("article")?.querySelector<HTMLElement>('[tabindex="-1"]')?.focus();
  };

  return (
    <>
      <div ref={rootRef} inert={showTyping} aria-busy={showTyping || undefined} className={className}>
        {children}
      </div>
      {showTyping ? (
        <p className="mt-3">
          <button type="button" onClick={skip} className={buttonClasses("secondary", "min-h-12 px-4 text-sm")}>
            {SKIP_TYPING_LABEL}
          </button>
        </p>
      ) : null}
      {engineMounted && animate ? (
        <Typewriter component="span" className="hidden" aria-hidden="true" options={options} onInit={handleInit} />
      ) : null}
    </>
  );
}
