import type { Explanation } from "@/types/knowledge";
import { PENDING_LABEL, VERIFIED_LABEL } from "./messages";

/** Exibe um trecho explicativo e deixa claro se ele está verificado ou em revisão. */
export function ExplanationText({ explanation }: { explanation: Explanation }) {
  const verified = explanation.status === "verified";
  return (
    <p data-status={explanation.status} data-sources={explanation.sourceIds.join(" ")}>
      {explanation.text}{" "}
      <span className="text-sm italic opacity-80">
        ({verified ? `✔ ${VERIFIED_LABEL}` : `⚠ ${PENDING_LABEL}`})
      </span>
    </p>
  );
}
