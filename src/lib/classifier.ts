/**
 * Classificador de relatos por palavras-chave com pesos.
 *
 * TypeScript puro, sem React e sem estado global: `createClassifier` recebe as categorias da
 * base de conhecimento e devolve uma função `(texto) => resultado`. As seis categorias e as
 * palavras-chave vêm sempre dos dados; aqui só existem as regras genéricas de pontuação.
 *
 * Limitação assumida: negações não são interpretadas. Quando uma palavra de negação aparece
 * logo antes de um termo reconhecido, o resultado é `negated` (sem categoria confiante).
 */
import type {
  CategoryScore,
  ClassificationEvidence,
  ClassificationResult,
  MatchedTerm,
  SpellingCorrection,
} from "@/types/engine";
import type { ProblemCategory, ProblemCategoryId } from "@/types/knowledge";
import { MAX_INPUT_LENGTH, isWithinOneEdit, tokenize } from "./normalize";

/** Pontuação mínima da categoria vencedora para um diagnóstico direto. */
export const MIN_SCORE = 3;

/** Se a segunda colocada tiver ao menos esta fração da pontuação da primeira, é ambíguo. */
export const AMBIGUITY_RATIO = 0.6;

/** Menos palavras que isto: texto curto demais para interpretar. */
export const MIN_WORDS = 2;

/** Só palavras com pelo menos este tamanho passam pela correção de digitação. */
export const MIN_CORRECTION_LENGTH = 6;

/** Palavras de negação que o classificador reconhece (mas não interpreta). */
export const NEGATION_WORDS: ReadonlySet<string> = new Set(["nao", "nunca", "jamais", "nem"]);

/** Quantas palavras depois de uma negação ela pode afetar. */
export const NEGATION_WINDOW = 3;

interface IndexedTerm {
  term: string;
  tokens: string[];
  categories: { categoryId: ProblemCategoryId; weight: number }[];
}

interface ClassifierIndex {
  /** Termos agrupados pela primeira palavra, do mais longo para o mais curto. */
  byFirstToken: Map<string, IndexedTerm[]>;
  /** Palavras conhecidas que podem servir de correção de digitação. */
  vocabulary: string[];
  knownTokens: Set<string>;
  /** Ordem das categorias na base, usada para desempate estável. */
  categoryOrder: ProblemCategoryId[];
}

function buildIndex(problems: readonly ProblemCategory[]): ClassifierIndex {
  const terms = new Map<string, IndexedTerm>();
  for (const problem of problems) {
    for (const keyword of problem.keywords) {
      const tokens = tokenize(keyword.term);
      const term = tokens.join(" ");
      if (tokens.length === 0) continue;
      const entry = terms.get(term) ?? { term, tokens, categories: [] };
      entry.categories.push({ categoryId: problem.id, weight: keyword.weight });
      terms.set(term, entry);
    }
  }

  const byFirstToken = new Map<string, IndexedTerm[]>();
  const knownTokens = new Set<string>();
  for (const entry of terms.values()) {
    const list = byFirstToken.get(entry.tokens[0]) ?? [];
    list.push(entry);
    byFirstToken.set(entry.tokens[0], list);
    entry.tokens.forEach((token) => knownTokens.add(token));
  }
  for (const list of byFirstToken.values()) list.sort((a, b) => b.tokens.length - a.tokens.length);

  return {
    byFirstToken,
    knownTokens,
    vocabulary: [...knownTokens].filter((token) => token.length >= MIN_CORRECTION_LENGTH),
    categoryOrder: problems.map((problem) => problem.id),
  };
}

/** Troca palavras desconhecidas pela única palavra conhecida a uma edição de distância. */
function correctSpelling(
  tokens: string[],
  index: ClassifierIndex,
): { tokens: string[]; corrections: SpellingCorrection[] } {
  const corrections: SpellingCorrection[] = [];
  const corrected = tokens.map((token) => {
    if (token.length < MIN_CORRECTION_LENGTH || index.knownTokens.has(token)) return token;
    const candidates = index.vocabulary.filter((known) => isWithinOneEdit(token, known));
    if (candidates.length !== 1) return token;
    corrections.push({ from: token, to: candidates[0] });
    return candidates[0];
  });
  return { tokens: corrected, corrections };
}

/** Procura os termos da base no texto, sempre o mais longo primeiro, sem sobreposição. */
function matchTerms(
  tokens: string[],
  index: ClassifierIndex,
): { matches: { entry: IndexedTerm; start: number }[]; consumed: boolean[] } {
  const matches: { entry: IndexedTerm; start: number }[] = [];
  const consumed = tokens.map(() => false);
  let i = 0;
  while (i < tokens.length) {
    const entry = index.byFirstToken
      .get(tokens[i])
      ?.find((candidate) => candidate.tokens.every((token, k) => tokens[i + k] === token));
    if (entry) {
      matches.push({ entry, start: i });
      for (let k = 0; k < entry.tokens.length; k++) consumed[i + k] = true;
      i += entry.tokens.length;
    } else {
      i++;
    }
  }
  return { matches, consumed };
}

/** Negações soltas (que não fazem parte de um termo da base) seguidas de um termo reconhecido. */
function findNegations(
  tokens: string[],
  matches: { entry: IndexedTerm; start: number }[],
  consumed: boolean[],
): string[] {
  const termStarts = new Set(matches.map((match) => match.start));
  const negations: string[] = [];
  tokens.forEach((token, i) => {
    if (!NEGATION_WORDS.has(token) || consumed[i]) return;
    for (let k = 1; k <= NEGATION_WINDOW; k++) {
      if (termStarts.has(i + k)) {
        negations.push(token);
        return;
      }
    }
  });
  return negations;
}

function scoreCategories(
  matches: { entry: IndexedTerm }[],
  categoryOrder: ProblemCategoryId[],
): CategoryScore[] {
  const scores = new Map<ProblemCategoryId, CategoryScore>();
  const counted = new Set<string>();
  for (const { entry } of matches) {
    if (counted.has(entry.term)) continue; // cada termo conta uma vez
    counted.add(entry.term);
    for (const { categoryId, weight } of entry.categories) {
      const current = scores.get(categoryId) ?? { categoryId, score: 0, terms: [] };
      current.score += weight;
      current.terms.push(entry.term);
      scores.set(categoryId, current);
    }
  }
  return [...scores.values()].sort(
    (a, b) =>
      b.score - a.score ||
      categoryOrder.indexOf(a.categoryId) - categoryOrder.indexOf(b.categoryId),
  );
}

function decide(evidence: ClassificationEvidence, wordCount: number): ClassificationResult {
  const [first, second] = evidence.scores;
  if (evidence.normalizedText === "") return { ...evidence, status: "empty" };
  if (wordCount < MIN_WORDS) return { ...evidence, status: "too-short" };
  if (!first) return { ...evidence, status: "unrelated" };

  const candidates = evidence.scores
    .filter((score) => score.score >= first.score * AMBIGUITY_RATIO)
    .map((score) => score.categoryId);

  if (first.score < MIN_SCORE) {
    return {
      ...evidence,
      status: "low-confidence",
      candidates: evidence.scores.map((s) => s.categoryId),
    };
  }
  if (evidence.negations.length > 0) return { ...evidence, status: "negated", candidates };
  if (second && second.score >= first.score * AMBIGUITY_RATIO) {
    return { ...evidence, status: "ambiguous", candidates };
  }
  return { ...evidence, status: "identified", categoryId: first.categoryId };
}

/**
 * Cria um classificador a partir das categorias da base de conhecimento.
 * O índice é montado uma vez; a função devolvida é pura e determinística.
 */
export function createClassifier(
  problems: readonly ProblemCategory[],
): (text: string) => ClassificationResult {
  const index = buildIndex(problems);

  return (text: string) => {
    const truncated = text.length > MAX_INPUT_LENGTH;
    const rawTokens = tokenize(truncated ? text.slice(0, MAX_INPUT_LENGTH) : text);
    const { tokens, corrections } = correctSpelling(rawTokens, index);
    const { matches, consumed } = matchTerms(tokens, index);

    const matchedTerms: MatchedTerm[] = [];
    for (const { entry } of matches) {
      if (matchedTerms.some((matched) => matched.term === entry.term)) continue;
      matchedTerms.push({ term: entry.term, categories: [...entry.categories] });
    }

    const evidence: ClassificationEvidence = {
      normalizedText: rawTokens.join(" "),
      truncated,
      scores: scoreCategories(matches, index.categoryOrder),
      matchedTerms,
      corrections,
      negations: findNegations(tokens, matches, consumed),
    };
    return decide(evidence, rawTokens.length);
  };
}
