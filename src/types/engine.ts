/**
 * Contratos do núcleo de decisão: classificador e motor do fluxo.
 * Ficam em `src/types/` porque o motor, os hooks e a interface também os usam.
 */
import type {
  Alternative,
  Cause,
  Consequence,
  Explanation,
  ProblemCategoryId,
  Source,
} from "./knowledge";

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

// ---------------------------------------------------------------------------------------------
// Motor do fluxo
// ---------------------------------------------------------------------------------------------

/** Ações que a interface pode enviar ao motor. */
export type FlowAction =
  /** Relato em texto livre (etapas relato e diagnóstico). */
  | { type: "SUBMIT_REPORT"; text: string }
  /** Escolha guiada de uma das seis situações, ou confirmação de uma candidata. */
  | { type: "SELECT_CATEGORY"; categoryId: ProblemCategoryId }
  /** Seguir para a próxima etapa (quando a etapa atual não exige escolha). */
  | { type: "ADVANCE" }
  /** Resposta do desafio. */
  | { type: "ANSWER_CHALLENGE"; optionId: string }
  /** Recomeçar do zero, de qualquer etapa. */
  | { type: "RESTART" };

export type FlowActionType = FlowAction["type"];

/** Diagnóstico confirmado: a categoria está definida e o fluxo pode seguir. */
export interface ConfirmedDiagnosis {
  status: "confirmed";
  categoryId: ProblemCategoryId;
  /** `text` = identificado pelo classificador; `guided` = escolhido pelo visitante. */
  method: "text" | "guided";
  /** Resultado do classificador (justificativa). `null` na escolha guiada direta. */
  classification: ClassificationResult | null;
}

/** O relato não bastou: o visitante precisa esclarecer ou escolher uma das situações. */
export interface PendingDiagnosis {
  status: "needs-clarification";
  classification: ClassificationResult;
  /** Categorias sugeridas pelo classificador (pode ser vazia; as seis seguem disponíveis). */
  candidates: ProblemCategoryId[];
}

/** Resultado da comparação entre a resposta escolhida e a mais adequada. */
export interface ChallengeEvaluation {
  challengeId: string;
  selectedOptionId: string;
  selectedOptionText: string;
  isCorrect: boolean;
  /** Por que a opção escolhida está certa ou errada. */
  selectedFeedback: string;
  correctOptionId: string;
  correctOptionText: string;
  /** Por que a opção correta é a mais adequada. */
  correctFeedback: string;
}

/** Fontes citadas no conteúdo apresentado, separadas pela situação de verificação. */
export interface ReportSources {
  verified: Source[];
  /** Fontes ainda não conferidas: nunca apresentar como verificadas. */
  pending: Source[];
}

/** Explicação final (etapa 7). Cada `Explanation` mantém `status` e `sourceIds`. */
export interface FinalReport {
  problem: { id: ProblemCategoryId; title: string; summary: string };
  /** Causa principal: a primeira causa cadastrada na base. */
  mainCause: Cause;
  consequences: Consequence[];
  /** Resposta escolhida no desafio e se foi adequada. */
  evaluation: ChallengeEvaluation;
  /** Solução recomendada, com benefícios e limitações. */
  recommendedSolution: Alternative;
  scientificExplanation: Explanation;
  /** Resumo de como a solução contribui para a eficiência energética. */
  finalExplanation: Explanation;
  sources: ReportSources;
  /** Há trechos `pending`: a interface deve indicá-los como conteúdo em revisão. */
  hasPendingContent: boolean;
}

/** Estado do fluxo: uma união discriminada pela etapa, com só os dados que cada etapa precisa. */
export type FlowState =
  | { step: "relato" }
  | { step: "diagnostico"; diagnosis: ConfirmedDiagnosis | PendingDiagnosis }
  | { step: "causas" | "alternativas" | "desafio"; diagnosis: ConfirmedDiagnosis }
  | { step: "avaliacao"; diagnosis: ConfirmedDiagnosis; evaluation: ChallengeEvaluation }
  | {
      step: "explicacao-final";
      diagnosis: ConfirmedDiagnosis;
      evaluation: ChallengeEvaluation;
      report: FinalReport;
    };

/** Por que uma ação foi recusada. */
export type FlowRejectionReason =
  | "action-not-allowed"
  | "empty-report"
  | "diagnosis-not-confirmed"
  | "unknown-category"
  | "unknown-option";

export type FlowTransition =
  | { ok: true; state: FlowState }
  | { ok: false; state: FlowState; reason: FlowRejectionReason };

/** Alternativa como apresentada na etapa 4: a recomendada é sinalizada. */
export interface AlternativeView extends Alternative {
  isRecommended: boolean;
}

/** Conteúdo de cada etapa, montado a partir da base (a interface só exibe). */
export type StepContent =
  | {
      step: "relato";
      /** As seis situações para a escolha guiada. */
      options: { id: ProblemCategoryId; title: string; summary: string }[];
    }
  | {
      step: "diagnostico";
      diagnosis: ConfirmedDiagnosis | PendingDiagnosis;
      /** Categoria confirmada, ou `null` enquanto falta esclarecimento. */
      problem: { id: ProblemCategoryId; title: string; summary: string } | null;
      /** Situações oferecidas para esclarecer: candidatas primeiro, depois as demais. */
      options: { id: ProblemCategoryId; title: string; isCandidate: boolean }[];
    }
  | { step: "causas"; title: string; causes: Cause[]; consequences: Consequence[] }
  | { step: "alternativas"; title: string; alternatives: AlternativeView[] }
  | {
      step: "desafio";
      question: string;
      /** Opções sem a indicação de qual é a correta. */
      options: { id: string; text: string }[];
    }
  | { step: "avaliacao"; evaluation: ChallengeEvaluation }
  | { step: "explicacao-final"; report: FinalReport };

