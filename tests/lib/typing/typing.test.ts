import { describe, expect, it } from "vitest";
import { createRevealSequence, type RevealItem } from "@/lib/typing/reveal-sequence";
import {
  COMFORTABLE_MS,
  MAX_TYPING_MS,
  MS_PER_CHAR,
  typingDelayMs,
  typingDurationMs,
} from "@/lib/typing/typing-speed";

describe("velocidade da digitação", () => {
  it("respostas curtas seguem o ritmo natural", () => {
    expect(typingDurationMs(50)).toBe(50 * MS_PER_CHAR);
    expect(typingDelayMs(50)).toBe(MS_PER_CHAR);
  });

  it("respostas longas aceleram e nunca passam do limite", () => {
    expect(typingDurationMs(700)).toBeGreaterThan(COMFORTABLE_MS);
    expect(typingDurationMs(700)).toBeLessThan(700 * MS_PER_CHAR);
    expect(typingDurationMs(2200)).toBe(MAX_TYPING_MS);
    expect(typingDurationMs(100000)).toBe(MAX_TYPING_MS);
    expect(typingDelayMs(2200) * 2200).toBeCloseTo(MAX_TYPING_MS);
  });

  it("a duração nunca diminui quando o texto cresce", () => {
    let previous = 0;
    for (let chars = 1; chars <= 3000; chars += 7) {
      const duration = typingDurationMs(chars);
      expect(duration).toBeGreaterThanOrEqual(previous);
      previous = duration;
    }
  });

  it("sem texto, não há espera", () => {
    for (const value of [0, -5, Number.NaN]) {
      expect(typingDurationMs(value)).toBe(0);
      expect(typingDelayMs(value)).toBe(0);
    }
  });
});

describe("sequência de revelação", () => {
  // Um parágrafo ("Olá" dentro de <p>), um ícone, um texto e um botão no fim.
  const items: RevealItem[] = [null, 3, null, null, 5, null];

  /** Aplica as atualizações em um espelho simples do que estaria na tela. */
  const mirror = () => {
    const shown = new Set<number>();
    const visible = new Map<number, number>();
    let caret: number | null = null;
    return {
      shown,
      visible,
      get caret() {
        return caret;
      },
      apply(update: ReturnType<ReturnType<typeof createRevealSequence>["advance"]>) {
        for (const index of update.shown) shown.add(index);
        for (const text of update.texts) visible.set(text.index, text.visible);
        caret = update.caret;
      },
    };
  };

  it("começa mostrando só o que vem antes do primeiro texto", () => {
    const sequence = createRevealSequence(items);
    const screen = mirror();
    screen.apply(sequence.begin());
    expect(sequence.total).toBe(8);
    expect([...screen.shown]).toEqual([0]);
    expect(screen.visible.size).toBe(0);
    expect(sequence.done).toBe(false);
  });

  it("revela caractere por caractere, na ordem, e move o cursor", () => {
    const sequence = createRevealSequence(items);
    const screen = mirror();
    screen.apply(sequence.begin());
    screen.apply(sequence.advance(1));
    expect(screen.visible.get(1)).toBe(1);
    expect(screen.caret).toBe(1);
    screen.apply(sequence.advance(1));
    expect(screen.visible.get(1)).toBe(2);
    // Ao completar um texto, os elementos seguintes aparecem; o cursor fica no texto concluído.
    screen.apply(sequence.advance(1));
    expect(screen.visible.get(1)).toBe(3);
    expect([...screen.shown]).toEqual([0, 2, 3]);
    expect(screen.caret).toBe(1);
    screen.apply(sequence.advance(2));
    expect(screen.visible.get(4)).toBe(2);
    expect(screen.caret).toBe(4);
    expect(sequence.position).toBe(5);
  });

  it("um avanço grande atravessa vários textos sem perder nenhum caractere", () => {
    const sequence = createRevealSequence(items);
    const screen = mirror();
    screen.apply(sequence.begin());
    screen.apply(sequence.advance(6));
    expect(screen.visible.get(1)).toBe(3);
    expect(screen.visible.get(4)).toBe(3);
    expect(sequence.position).toBe(6);
  });

  it("ao terminar, tudo está visível, o botão final aparece e o cursor some", () => {
    const sequence = createRevealSequence(items);
    const screen = mirror();
    screen.apply(sequence.begin());
    for (let i = 0; i < 8; i++) screen.apply(sequence.advance(1));
    expect(sequence.done).toBe(true);
    expect([...screen.shown].sort()).toEqual([0, 2, 3, 5]);
    expect(screen.visible.get(1)).toBe(3);
    expect(screen.visible.get(4)).toBe(5);
    expect(screen.caret).toBeNull();
    // Avançar além do fim não muda nada.
    const extra = sequence.advance(10);
    expect(extra).toEqual({ shown: [], texts: [], caret: null });
  });

  it("pular a digitação revela o restante de uma vez", () => {
    const sequence = createRevealSequence(items);
    const screen = mirror();
    screen.apply(sequence.begin());
    screen.apply(sequence.advance(2));
    screen.apply(sequence.finish());
    expect(sequence.done).toBe(true);
    expect(sequence.position).toBe(8);
    expect([...screen.shown].sort()).toEqual([0, 2, 3, 5]);
    expect(screen.visible.get(1)).toBe(3);
    expect(screen.visible.get(4)).toBe(5);
    expect(screen.caret).toBeNull();
  });

  it("qualquer ritmo de avanço chega ao mesmo resultado (nenhum caractere perdido ou repetido)", () => {
    const long: RevealItem[] = [null, 12, null, 0, 7, null, null, 31, 1, null];
    for (const step of [1, 2, 3, 5, 11, 100]) {
      const sequence = createRevealSequence(long);
      const screen = mirror();
      screen.apply(sequence.begin());
      let guard = 0;
      while (!sequence.done && guard++ < 1000) screen.apply(sequence.advance(step));
      expect(sequence.position, `passo ${step}`).toBe(51);
      long.forEach((item, index) => {
        if (item === null) expect(screen.shown.has(index), `elemento ${index}`).toBe(true);
        else if (item > 0) expect(screen.visible.get(index), `texto ${index}`).toBe(item);
      });
    }
  });

  it("resposta sem texto: mostra tudo de imediato", () => {
    const sequence = createRevealSequence([null, null]);
    expect(sequence.total).toBe(0);
    expect(sequence.begin().shown).toEqual([0, 1]);
    expect(sequence.done).toBe(true);
  });
});
