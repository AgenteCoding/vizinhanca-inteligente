/**
 * Velocidade da digitação progressiva das respostas.
 *
 * Respostas curtas são digitadas em ritmo natural (um caractere a cada `MS_PER_CHAR`).
 * Respostas longas aceleram, para a leitura não cansar: depois de `COMFORTABLE_MS`, cada
 * caractere extra custa só `EXTRA_MS_PER_CHAR`, e nenhuma resposta passa de `MAX_TYPING_MS`.
 * Funções puras: quem digita de fato é o componente da conversa.
 */

/** Ritmo natural: cerca de 70 caracteres por segundo. */
export const MS_PER_CHAR = 14;
/** Até aqui a digitação segue o ritmo natural. */
export const COMFORTABLE_MS = 1800;
/** Custo de cada caractere além do trecho confortável. */
export const EXTRA_MS_PER_CHAR = 2.5;
/** Nenhuma resposta leva mais do que isto para aparecer inteira. */
export const MAX_TYPING_MS = 4200;

/** Tempo total para digitar uma resposta com `characters` caracteres visíveis. */
export function typingDurationMs(characters: number): number {
  if (!Number.isFinite(characters) || characters <= 0) return 0;
  const natural = characters * MS_PER_CHAR;
  if (natural <= COMFORTABLE_MS) return natural;
  const comfortableChars = COMFORTABLE_MS / MS_PER_CHAR;
  return Math.min(MAX_TYPING_MS, COMFORTABLE_MS + (characters - comfortableChars) * EXTRA_MS_PER_CHAR);
}

/** Intervalo entre caracteres (ms) para a resposta inteira caber em `typingDurationMs`. */
export function typingDelayMs(characters: number): number {
  if (!Number.isFinite(characters) || characters <= 0) return 0;
  return typingDurationMs(characters) / characters;
}
