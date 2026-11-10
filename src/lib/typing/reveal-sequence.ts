/**
 * Sequência de revelação de uma resposta já renderizada.
 *
 * A resposta é uma lista ordenada de itens, na ordem em que aparecem na tela: elementos
 * (ícones, caixas, botões, parágrafos vazios...) e trechos de texto. A digitação avança um
 * número de caracteres por vez; esta lógica diz o que mudou: quais elementos passam a
 * aparecer, quanto de cada trecho de texto já está visível e onde fica o cursor.
 *
 * É pura (não conhece o DOM nem a biblioteca de digitação): recebe só os tamanhos dos textos.
 * Quem aplica o resultado na página é `components/assistant/typed-reveal.ts`.
 */

/** Um item da resposta: `null` para elemento, ou o número de caracteres de um trecho de texto. */
export type RevealItem = number | null;

export interface RevealUpdate {
  /** Índices dos elementos que passam a aparecer agora. */
  shown: number[];
  /** Trechos de texto que mudaram: índice do item e quantos caracteres estão visíveis. */
  texts: { index: number; visible: number }[];
  /** Índice do trecho de texto onde o cursor está, ou `null` quando a digitação acabou. */
  caret: number | null;
}

export interface RevealSequence {
  /** Total de caracteres de texto da resposta. */
  readonly total: number;
  /** Caracteres já revelados. */
  readonly position: number;
  readonly done: boolean;
  /** Revela os elementos que vêm antes do primeiro texto (chamado uma vez, no início). */
  begin(): RevealUpdate;
  /** Avança `characters` caracteres. Além do fim, apenas termina. */
  advance(characters: number): RevealUpdate;
  /** Revela tudo o que falta, de uma vez. */
  finish(): RevealUpdate;
}

export function createRevealSequence(items: readonly RevealItem[]): RevealSequence {
  const total = items.reduce<number>((sum, item) => sum + (item ?? 0), 0);
  let index = 0; // item atual
  let offset = 0; // caracteres já revelados do item atual (se for texto)
  let position = 0;
  let caret: number | null = null;

  /** Mostra os elementos (e pula textos vazios) até o próximo trecho de texto com conteúdo. */
  const showUntilNextText = (shown: number[]) => {
    while (index < items.length) {
      const item = items[index];
      if (item === null) shown.push(index);
      else if (item > 0) break;
      index += 1;
    }
  };

  const advance = (characters: number): RevealUpdate => {
    const shown: number[] = [];
    const texts = new Map<number, number>();
    let left = Math.max(0, Math.floor(characters));
    showUntilNextText(shown);
    while (left > 0 && index < items.length) {
      const length = items[index] ?? 0;
      const take = Math.min(left, length - offset);
      offset += take;
      left -= take;
      position += take;
      texts.set(index, offset);
      caret = index;
      if (offset >= length) {
        index += 1;
        offset = 0;
        showUntilNextText(shown);
      }
    }
    if (index >= items.length) caret = null;
    return { shown, texts: [...texts].map(([i, visible]) => ({ index: i, visible })), caret };
  };

  return {
    total,
    get position() {
      return position;
    },
    get done() {
      return index >= items.length;
    },
    begin: () => advance(0),
    advance,
    finish: () => advance(total - position + 1),
  };
}
