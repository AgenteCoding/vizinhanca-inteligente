/**
 * Textos da interface do assistente (rótulos e avisos). Não há conteúdo científico aqui:
 * causas, soluções, explicações e fontes vêm sempre de `src/data/` por meio do motor.
 */
import type { ClassificationStatus, FlowRejectionReason } from "@/types/engine";
import type { FlowStep } from "@/types/knowledge";

export const STEP_TITLES: Record<FlowStep, string> = {
  relato: "1. Conte o que está acontecendo",
  diagnostico: "2. Diagnóstico",
  causas: "3. Por que isso acontece",
  alternativas: "4. Alternativas de solução",
  desafio: "5. Desafio",
  avaliacao: "6. Avaliação da sua escolha",
  "explicacao-final": "7. Explicação final",
};

/** O que dizer quando o relato não bastou para um diagnóstico. */
export const CLARIFICATION_MESSAGES: Record<Exclude<ClassificationStatus, "identified">, string> = {
  ambiguous:
    "Seu relato combina mais de uma situação. Qual delas você quis dizer? Escolha uma das opções abaixo.",
  "low-confidence":
    "Não tenho certeza do que você quis dizer. Escreva com mais detalhes ou escolha uma das situações abaixo.",
  negated:
    "Seu relato tem uma negação (como \"não\" ou \"nunca\"), e eu ainda não sei interpretar negações. Escolha a situação que você quer estudar ou escreva de outro jeito.",
  unrelated:
    "Não encontrei nada sobre desperdício de energia no seu relato. Tente descrever de outra forma ou escolha uma das situações abaixo.",
  "too-short": "O relato ficou muito curto. Escreva um pouco mais ou escolha uma das situações abaixo.",
  empty: "Escreva um relato ou escolha uma das situações abaixo.",
};

export const REJECTION_MESSAGES: Record<FlowRejectionReason, string> = {
  "empty-report": "Escreva alguma coisa antes de enviar, ou escolha uma das situações.",
  "diagnosis-not-confirmed": "Antes de continuar, escolha qual situação você quer estudar.",
  "action-not-allowed": "Essa ação não está disponível nesta etapa.",
  "unknown-category": "Essa situação não existe. Escolha uma das opções da lista.",
  "unknown-option": "Essa resposta não existe. Escolha uma das opções do desafio.",
};

export const PENDING_LABEL = "Conteúdo em revisão: ainda sem fonte confirmada.";
export const VERIFIED_LABEL = "Conferido em fonte oficial.";
