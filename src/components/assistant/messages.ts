/**
 * Textos da interface do assistente (rótulos e avisos). Não há conteúdo científico aqui:
 * causas, soluções, explicações e fontes vêm sempre de `src/data/` por meio do serviço.
 */
import type { ClassificationStatus, FlowActionType, FlowRejectionReason } from "@/types/engine";
import type { FlowStep } from "@/types/knowledge";

export const WELCOME_TITLE = "Como podemos tornar sua vizinhança mais inteligente?";
export const WELCOME_TEXT =
  "Conte um desperdício de energia que você viu. O SmartHood AI identifica a situação, explica as causas e ajuda você a escolher a melhor solução.";
export const CONVERSATION_TITLE = "Conversa com o SmartHood AI";

export const COMPOSER_LABEL = "Descreva uma situação de desperdício de energia";
export const COMPOSER_PLACEHOLDER = "Ex.: a luz da rua fica acesa o dia inteiro...";
export const COMPOSER_LOCKED_PLACEHOLDER = "Use as opções acima.";
export const COMPOSER_HINT = "Enter envia. Shift + Enter quebra a linha.";
export const NO_ACCOUNT_NOTE = "Não precisa criar conta. Nada do que você escreve é guardado.";
export const SUGGESTIONS_LABEL = "Ou escolha uma situação para começar";

/** O que aparece no balão do visitante quando ele escolhe uma opção da conversa. */
export const VISITOR_LABELS = {
  select: (title: string) => `Quero estudar: ${title}.`,
  reselect: (title: string) => `Na verdade, a situação é: ${title}.`,
  toCauses: "Por que isso acontece?",
  toAlternatives: "Quais são as soluções?",
  toChallenge: "Quero tentar o desafio.",
  answer: (option: string) => `Minha escolha: ${option}`,
  toFinal: "Quero ver a explicação final.",
};

/** Nome curto de cada etapa (indicação "Etapa X de 7"). */
export const STEP_LABELS: Record<FlowStep, string> = {
  relato: "Relato",
  diagnostico: "Diagnóstico",
  causas: "Causas",
  alternativas: "Soluções",
  desafio: "Desafio",
  avaliacao: "Avaliação",
  "explicacao-final": "Explicação final",
};

/** Frase de abertura de cada resposta do assistente. */
export const ASSISTANT_INTROS = {
  identified: "Pelo que você contou, a situação é esta:",
  chosen: "Certo! Vamos estudar esta situação:",
  causes: "Veja por que isso acontece e o que esse desperdício provoca.",
  alternatives:
    "Estas são as soluções possíveis. Toque em cada uma para ver as vantagens e as limitações.",
  challenge: "Agora é a sua vez de decidir.",
  final: "Resumo do que você aprendeu nesta situação.",
};

export const PENDING_MESSAGES: Partial<Record<FlowActionType, string>> = {
  SUBMIT_REPORT: "Analisando o seu relato...",
  ANSWER_CHALLENGE: "Avaliando a sua escolha...",
};
export const DEFAULT_PENDING_MESSAGE = "Preparando a resposta...";

export const PROVIDER_ERROR =
  "Não consegui responder agora. Tente de novo ou comece um novo diagnóstico.";

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
