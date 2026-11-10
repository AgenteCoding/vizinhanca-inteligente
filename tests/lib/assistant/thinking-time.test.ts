import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MIN_STEP_THINKING_MS,
  MIN_THINKING_MS,
  minimumThinkingMs,
  withMinimumDelay,
  type Sleep,
} from "@/lib/assistant/thinking-time";

const sleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const after = <T,>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

describe("tempo do indicador Pensando", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mensagem escrita espera pelo menos 5 segundos; botões esperam menos; recomeçar não espera", () => {
    expect(MIN_THINKING_MS).toBe(5000);
    expect(minimumThinkingMs("SUBMIT_REPORT")).toBe(5000);
    for (const type of ["SELECT_CATEGORY", "ADVANCE", "ANSWER_CHALLENGE"] as const) {
      expect(minimumThinkingMs(type)).toBe(MIN_STEP_THINKING_MS);
    }
    expect(MIN_STEP_THINKING_MS).toBeLessThan(MIN_THINKING_MS);
    expect(minimumThinkingMs("RESTART")).toBe(0);
  });

  it("resposta instantânea: só aparece quando o mínimo termina", async () => {
    const done = vi.fn();
    void withMinimumDelay(Promise.resolve("ok"), 5000, sleep).then(done);
    await vi.advanceTimersByTimeAsync(4999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledWith("ok");
  });

  it("resposta lenta: aparece assim que fica pronta, sem 5 segundos a mais", async () => {
    const done = vi.fn();
    void withMinimumDelay(after(8000, "lenta"), 5000, sleep).then(done);
    await vi.advanceTimersByTimeAsync(7999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledWith("lenta");
  });

  it("falha do provedor: o erro sai na hora, sem segurar o visitante", async () => {
    const failed = vi.fn();
    void withMinimumDelay(Promise.reject(new Error("falhou")), 5000, sleep).catch(failed);
    await vi.advanceTimersByTimeAsync(0);
    expect(failed).toHaveBeenCalledOnce();
  });

  it("sem tempo mínimo, não agenda espera nenhuma", async () => {
    const spy = vi.fn(sleep);
    await expect(withMinimumDelay(Promise.resolve(1), 0, spy)).resolves.toBe(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it("espera cancelada (conversa reiniciada): quem chamou é liberado na hora", async () => {
    let release: () => void = () => {};
    const cancellable: Sleep = () => new Promise((resolve) => (release = resolve));
    const done = vi.fn();
    void withMinimumDelay(Promise.resolve("ok"), 5000, cancellable).then(done);
    await vi.advanceTimersByTimeAsync(100);
    expect(done).not.toHaveBeenCalled();
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toHaveBeenCalledWith("ok");
  });
});
