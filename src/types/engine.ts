/**
 * Contratos do núcleo de decisão (classificador e, no bloco C, motor do fluxo).
 * Ficam em `src/types/` porque o motor, os hooks e a interface também os usam.
 */
import type { ProblemCategoryId } from "./knowledge";

/** Palavra-chave da base encontrada no relato. */
export interface MatchedTerm {
  /** Termo como está na base (normalizado). */
  term: string;
  /** Categorias que usam o termo e o peso em cada uma (um termo pode valer para mais de uma). */
  categories: { categoryId: ProblemCategoryId; weight: number }[];
}

/** Pontuação de uma categoria: soma dos pesos dos termos reconhecidos, cada termo uma vez. */
export interface CategoryScore {
  categoryId: ProblemCategoryId;
  score: number;
  terms: string[];
}

/** Palavra do relato aproximada de uma palavra conhecida (pequeno erro de digitação). */
export interface SpellingCorrection {
  from: string;
  to: string;
}

/**
 * Resultado possível da classificação.
 * - `identified`: há evidência suficiente para uma categoria.
 * - `ambiguous`: duas ou mais categorias ficaram com pontuação muito próxima.
 * - `low-confidence`: há termos de energia, mas pouca evidência.
 * - `negated`: o relato nega a própria situação ("o poste não fica aceso"); o classificador
 *   não interpreta negações e por isso não arrisca uma categoria.
 * - `unrelated`: nenhum termo da base foi reconhecido.
 * - `too-short`: texto curto demais para interpretar.
 * - `empty`: texto vazio ou só com espaços e símbolos.
 *
 * Em todos os casos diferentes de `identified`, a interface deve pedir esclarecimento ou
 * oferecer a escolha guiada entre as seis situações.
 */
export type ClassificationStatus =
  | "identified"
  | "ambiguous"
  | "low-confidence"
  | "negated"
  | "unrelated"
  | "too-short"
  | "empty";

/** Dados que justificam o resultado ("por que cheguei a esse diagnóstico"). */
export interface ClassificationEvidence {
  /** Texto normalizado que foi analisado (o original não é alterado nem guardado aqui). */
  normalizedText: string;
  /** O relato passou de `MAX_INPUT_LENGTH` caracteres e foi cortado. */
  truncated: boolean;
  /** Categorias com pontuação maior que zero, da maior para a menor. */
  scores: CategoryScore[];
  matchedTerms: MatchedTerm[];
  corrections: SpellingCorrection[];
  /** Palavras de negação que afetam termos reconhecidos. */
  negations: string[];
}

export type ClassificationResult = ClassificationEvidence &
  (
    | { status: "identified"; categoryId: ProblemCategoryId }
    | { status: "ambiguous" | "low-confidence" | "negated"; candidates: ProblemCategoryId[] }
    | { status: "unrelated" | "too-short" | "empty" }
  );
