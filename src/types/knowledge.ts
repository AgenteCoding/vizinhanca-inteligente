/**
 * Contratos de dados da base de conhecimento.
 *
 * Este arquivo define apenas a FORMA dos dados. O conteúdo fica em `src/data/` e é validado
 * pelos esquemas Zod de `src/data/schema.ts`, que são verificados contra estes tipos.
 *
 * Regra científica do projeto: toda afirmação factual deve apontar para uma fonte
 * (`sourceIds`) ou estar marcada como `pending`. Nunca inventar números de economia.
 * Conteúdo `pending` não pode ser apresentado ao visitante como fato comprovado.
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

/**
 * Situação de verificação.
 * - Em uma fonte: `verified` = a página foi aberta e o conteúdo registrado em
 *   `supportedClaims` foi conferido; `pending` = não foi possível conferir.
 * - Em uma explicação: `verified` = o texto se apoia em fontes `verified`;
 *   `pending` = ainda sem fonte confirmada (texto qualitativo, sem números).
 */
export type ReviewStatus = "pending" | "verified";

/** Fonte oficial consultada (Inmetro, Procel, ANEEL, EPE, INPE...). */
export interface Source {
  id: string;
  /** Órgão ou instituição responsável. */
  organization: string;
  /** Título do material, como aparece na fonte. */
  title: string;
  /** Endereço direto do material (https). */
  url: string;
  /** Tema abordado pela fonte. */
  topic: string;
  /** Afirmações que a fonte sustenta, parafraseadas a partir da leitura do material. */
  supportedClaims: string[];
  status: ReviewStatus;
  /** Data de acesso no formato AAAA-MM-DD. */
  accessedAt: string;
}

/** Trecho explicativo com rastreabilidade científica. */
export interface Explanation {
  text: string;
  sourceIds: string[];
  status: ReviewStatus;
}

/** Ponto com título e explicação rastreável (usado em causas e consequências). */
export interface ExplainedPoint {
  id: string;
  title: string;
  explanation: Explanation;
}

/** Por que o desperdício acontece. */
export type Cause = ExplainedPoint;

/** O que o desperdício provoca. */
export type Consequence = ExplainedPoint;

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

/**
 * Termo reconhecido pelo classificador de texto livre.
 * `term` é escrito já normalizado (minúsculas, sem acentos); sinônimos são termos próprios.
 * `weight` indica quanto o termo aponta para a categoria (ex.: 3 = muito específico, 1 = genérico).
 */
export interface WeightedKeyword {
  term: string;
  weight: number;
}

/** Uma categoria completa da base de conhecimento. */
export interface ProblemCategory {
  id: ProblemCategoryId;
  title: string;
  /** Descrição curta da situação de desperdício. */
  summary: string;
  /** Termos e sinônimos, com pesos, usados pelo classificador de texto livre. */
  keywords: WeightedKeyword[];
  causes: Cause[];
  consequences: Consequence[];
  alternatives: Alternative[];
  /** `id` da alternativa recomendada (deve existir em `alternatives`). */
  recommendedAlternativeId: string;
  /** Explicação científica do fenômeno por trás do desperdício. */
  scientificExplanation: Explanation;
  challenge: Challenge;
  finalExplanation: Explanation;
}

/** Base de conhecimento completa: fontes e as seis categorias. */
export interface KnowledgeBase {
  sources: Source[];
  problems: ProblemCategory[];
}

/** Etapas do fluxo de atendimento do assistente (motor de decisão). */
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
