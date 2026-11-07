/**
 * Normalização de texto em português para o classificador.
 *
 * Funções puras: recebem uma string e devolvem outra (strings são imutáveis, então o texto
 * original guardado no estado da aplicação nunca é alterado). A mesma normalização é aplicada
 * ao relato do visitante e às palavras-chave da base, para que os dois lados sempre batam.
 */

/** Tamanho máximo do relato processado (RS06: entradas de texto com limite de tamanho). */
export const MAX_INPUT_LENGTH = 500;

const DIACRITICS = /\p{M}/gu;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

/**
 * Minúsculas, sem acentos, sem pontuação e com espaços simples.
 * Hífen e pontuação viram espaço: "Ar-condicionado!" → "ar condicionado".
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, " ")
    .trim();
}

/**
 * Reduz o plural de uma palavra já normalizada a uma forma singular aproximada.
 * São poucas regras, de propósito: só precisam fazer "lâmpadas" e "lâmpada" virarem o mesmo
 * termo. Palavras com até 3 letras ficam como estão ("gas", "sol", "mes").
 */
export function toSingular(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("oes") || word.endsWith("aes")) return `${word.slice(0, -3)}ao`; // botoes → botao
  if (word.endsWith("ais") && word.length > 4) return `${word.slice(0, -3)}al`; // sinais → sinal
  if (word.endsWith("eis") && word.length > 5) return `${word.slice(0, -3)}el`; // paineis → painel
  if (word.endsWith("ns")) return `${word.slice(0, -2)}m`; // nuvens → nuvem
  if (word.endsWith("zes")) return word.slice(0, -2); // luzes → luz
  if (/[aeiou]res$/.test(word)) return word.slice(0, -2); // solares → solar
  if (/[aeo]s$/.test(word)) return word.slice(0, -1); // postes → poste, acesos → aceso
  return word;
}

/** Normaliza e separa em palavras no singular. Texto vazio → lista vazia. */
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized === "" ? [] : normalized.split(" ").map(toSingular);
}

/** Forma canônica de um termo (usada para as palavras-chave da base). */
export function normalizeTerm(term: string): string {
  return tokenize(term).join(" ");
}

/**
 * Verdadeiro se `a` e `b` diferem por no máximo uma edição: trocar, inserir ou apagar uma
 * letra, ou inverter duas letras vizinhas ("geladera" ~ "geladeira", "jaenla" ~ "janela").
 */
export function isWithinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;

  if (a.length === b.length) {
    const restA = a.slice(i + 1);
    const restB = b.slice(i + 1);
    if (restA === restB) return true; // uma letra trocada
    // duas letras vizinhas invertidas
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
  }
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  return longer.slice(i + 1) === shorter.slice(i); // uma letra a mais ou a menos
}
