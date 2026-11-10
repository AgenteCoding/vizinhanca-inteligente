import { useEffect, useRef } from "react";

/**
 * Leva o foco ao elemento (em geral, o título da tela) quando a chave muda: quem navega por
 * teclado ou leitor de tela acompanha a troca de etapa. Não age na primeira renderização.
 */
export function useFocusOnChange<T extends HTMLElement>(key: string) {
  const ref = useRef<T>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    ref.current?.focus();
  }, [key]);
  return ref;
}
