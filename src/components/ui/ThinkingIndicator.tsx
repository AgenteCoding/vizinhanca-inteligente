/** Texto visível do indicador. */
export const THINKING_LABEL = "Pensando";

/**
 * "(...) Pensando": três pontos animados e o texto ao lado, enquanto o assistente prepara a
 * resposta. É só apresentação: não sabe qual provedor está respondendo (motor determinístico
 * hoje, um modelo de linguagem no futuro) nem controla o tempo. Quem decide quanto tempo ele
 * fica na tela é o hook da conversa. Com movimento reduzido, os pontos ficam parados.
 */
export function ThinkingIndicator({
  detail,
  tone = "light",
  className = "",
}: {
  /** Complemento só para leitores de tela (ex.: "Analisando o seu relato..."). */
  detail?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dot = tone === "dark" ? "bg-lime" : "bg-petrol";
  return (
    <div
      role="status"
      data-thinking=""
      className={`message-enter inline-flex items-center gap-2.5 rounded-full px-4 py-2 ${
        tone === "dark" ? "glass-dark text-ice" : "glass text-petrol"
      } ${className}`}
    >
      <span aria-hidden="true" className="flex items-center gap-1">
        <span className={`thinking-dot size-2 rounded-full ${dot}`} />
        <span className={`thinking-dot size-2 rounded-full ${dot}`} />
        <span className={`thinking-dot size-2 rounded-full ${dot}`} />
      </span>
      <span className="text-sm font-semibold">{THINKING_LABEL}</span>
      {detail ? <span className="sr-only">{detail}</span> : null}
    </div>
  );
}
