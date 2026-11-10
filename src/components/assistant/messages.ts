/**
 * Textos da interface do assistente (rótulos e avisos). Não há conteúdo científico aqui:
 * causas, soluções, explicações e fontes vêm sempre de `src/data/` por meio do motor.
 */
import type { ClassificationStatus, FlowRejectionReason } from "@/types/engine";
import type { FlowStep } from "@/types/knowledge";

/** Título de cada etapa (o número aparece no indicador de progresso). */
export const STEP_TITLES: Record<FlowStep, string> = {
  relato: "Conte o que está acontecendo",
  diagnostico: "Diagnóstico",
  causas: "Por que isso acontece",
  alternativas: "Alternativas de solução",
  desafio: "Desafio",
  avaliacao: "Avaliação da sua escolha",
  "explicacao-final": "Explicação final",
};

/** Nome curto de cada etapa no indicador de progresso. */
export const STEP_LABELS: Record<FlowStep, string> = {
  relato: "Relato",
  diagnostico: "Diagnóstico",
  causas: "Causas",
  alternativas: "Alternativas",
  desafio: "Desafio",
  avaliacao: "Avaliação",
  "explicacao-final": "Resultado",
};

/** O que acontece em cada etapa, em uma frase. */
export const STEP_HINTS: Record<FlowStep, string> = {
  relato: "Descreva o desperdício com suas palavras ou escolha uma das seis situações.",
  diagnostico: "Veja qual situação a IA identificou e como ela chegou a essa conclusão.",
  causas: "Entenda por que esse desperdício acontece e o que ele provoca.",
  alternativas: "Compare as soluções possíveis: cada uma tem vantagens e limitações.",
  desafio: "Escolha a decisão que você tomaria nesta situação e confirme.",
  avaliacao: "Veja se a sua escolha foi a mais adequada e entenda o porquê.",
  "explicacao-final": "Um resumo do que você aprendeu nesta situação, com as fontes.",
};

/** Exemplos de relato para quem não sabe o que escrever. */
export const REPORT_EXAMPLES: string[] = [
  "Os postes da minha rua ficam acesos durante o dia.",
  "Deixo o ar ligado com a janela aberta.",
  "Minha geladeira é muito antiga e consome bastante energia.",
];

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

export const EVALUATION_MESSAGES = {
  correctTitle: "Você acertou!",
  correctText: "Veja por que essa é a decisão mais adequada.",
  incorrectTitle: "Essa não é a opção mais adequada",
  incorrectText:
    "Errar faz parte de aprender. Compare a sua escolha com a opção mais adequada e veja o motivo.",
};

/** Selo de cada trecho explicativo. */
export const VERIFIED_LABEL = "Fonte conferida";
export const PENDING_LABEL = "Em revisão";
export const SOURCE_LEGEND =
  "Fonte conferida: o trecho foi comparado com uma fonte oficial. Em revisão: ainda sem fonte confirmada; será conferido pelo professor orientador.";
export const PENDING_NOTICE =
  "Conteúdo em revisão: parte das explicações ainda não tem fonte confirmada e será conferida pelo professor orientador.";
