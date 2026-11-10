/**
 * Tempo do indicador "Pensando".
 *
 * Regra: tempo de espera visual = máximo entre o tempo mínimo e o tempo real de processamento.
 * O mínimo e o processamento correm em paralelo, então uma resposta que já demorou mais que o
 * mínimo aparece assim que fica pronta (sem espera extra). Vale para qualquer provedor: o motor
 * determinístico responde em menos de 1 ms; um modelo de linguagem pode levar vários segundos.
 *
 * Funções puras: a espera (`sleep`) é injetada por quem chama, que também cuida de cancelá-la.
 */
import type { FlowActionType } from "@/types/engine";

/** Mínimo para uma mensagem escrita pelo visitante (pergunta ou relato). */
export const MIN_THINKING_MS = 5000;

/**
 * Mínimo para os botões da conversa (escolher situação, avançar, responder ao desafio).
 * Fica curto de propósito: são seis passos por diagnóstico, e 5 s em cada um deixaria o
 * visitante da feira cerca de meio minuto parado. Para igualar tudo, use `MIN_THINKING_MS`.
 */
export const MIN_STEP_THINKING_MS = 900;

export function minimumThinkingMs(actionType: FlowActionType): number {
  if (actionType === "RESTART") return 0;
  return actionType === "SUBMIT_REPORT" ? MIN_THINKING_MS : MIN_STEP_THINKING_MS;
}

export type Sleep = (ms: number) => Promise<void>;

/**
 * Espera o trabalho e o tempo mínimo, o que terminar por último. Se o trabalho falhar, o erro
 * sai na hora (o indicador dá lugar à mensagem de erro, sem segurar o visitante).
 */
export async function withMinimumDelay<T>(work: Promise<T>, minimumMs: number, sleep: Sleep): Promise<T> {
  const [result] = await Promise.all([work, minimumMs > 0 ? sleep(minimumMs) : Promise.resolve()]);
  return result;
}
