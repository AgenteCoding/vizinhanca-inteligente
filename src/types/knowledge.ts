/**
 * Contratos de dados da base de conhecimento.
 *
 * Este arquivo define apenas a FORMA dos dados. O conteúdo (textos, fontes, desafios)
 * será escrito em `src/data/` na etapa 2, e validado em tempo de execução/teste com Zod.
 *
 * Regra científica do projeto: toda afirmação factual deve apontar para uma fonte
 * (`sourceIds`) ou estar marcada como `pending`. Nunca inventar números de economia.
 */

/** Identificadores estáveis das seis categorias de desperdício reconhecidas pelo sistema. */
export const PROBLEM_CATEGORY_IDS = [
  "iluminacao-publica-dia",
  "luzes-ambientes-vazios",
  "consumo-horario-pico",
  "eletrodomesticos-ineficientes",
  "ar-condicionado-aberto",
  "solar-sem-geracao",
] as const;

export type ProblemCategoryId = (typeof PROBLEM_CATEGORY_IDS)[number];

/** Situação de revisão de um conteúdo. `pending` = ainda sem fonte confirmada. */
export type ReviewStatus = "pending" | "verified";

/** Fonte oficial consultada (Inmetro, Procel, ANEEL, EPE, INPE...). */
export interface Source {
  id: string;
  /** Órgão ou instituição responsável. */
  organization: string;
  title: string;
  url: string;
  /** Data de acesso no formato AAAA-MM-DD. */
  accessedAt: string;
}

/** Trecho explicativo com rastreabilidade científica. */
export interface Explanation {
  text: string;
  sourceIds: string[];
  status: ReviewStatus;
}

export interface Cause {
  id: string;
  title: string;
  explanation: Explanation;
}

export interface Alternative {
  id: string;
  title: string;
  description: string;
  benefits: Explanation[];
  limitations: Explanation[];
}

export interface ChallengeOption {
  id: string;
  text: string;
  isCorrect: boolean;
  /** Feedback específico: explica por que a opção está certa ou errada. */
  feedback: string;
}

/** Desafio de múltipla escolha (usado no fluxo principal e no minigame Escolha Inteligente). */
export interface Challenge {
  id: string;
  question: string;
  options: ChallengeOption[];
}

/** Uma categoria completa da base de conhecimento. */
export interface ProblemCategory {
  id: ProblemCategoryId;
  title: string;
  /** Descrição curta da situação de desperdício. */
  summary: string;
  /** Termos e sinônimos usados pelo classificador de texto livre (etapa 2). */
  keywords: string[];
  causes: Cause[];
  alternatives: Alternative[];
  challenge: Challenge;
  finalExplanation: Explanation;
}

/** Etapas do fluxo de atendimento do assistente (motor de decisão, etapa 2). */
export const FLOW_STEPS = [
  "relato",
  "diagnostico",
  "causas",
  "alternativas",
  "desafio",
  "avaliacao",
  "explicacao-final",
] as const;

export type FlowStep = (typeof FLOW_STEPS)[number];
