import type { Explanation, ReviewStatus } from "@/types/knowledge";
import { Icon } from "../ui/Icon";
import { PENDING_LABEL, SOURCE_LEGEND, VERIFIED_LABEL } from "./messages";

/** Selo curto que diz se o trecho já foi conferido em fonte oficial (ícone e texto). */
export function SourceBadge({ status }: { status: ReviewStatus }) {
  const verified = status === "verified";
  return (
    <span
      className={`ml-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 align-[0.1em] text-sm font-bold leading-tight ${
        verified ? "bg-ai-soft text-ai" : "bg-review-soft text-review"
      }`}
    >
      <Icon name={verified ? "check" : "review"} className="size-3.5" />
      {verified ? VERIFIED_LABEL : PENDING_LABEL}
    </span>
  );
}

/** Exibe um trecho explicativo e deixa claro se ele está verificado ou em revisão. */
export function ExplanationText({
  explanation,
  className = "",
}: {
  explanation: Explanation;
  className?: string;
}) {
  return (
    <p
      data-status={explanation.status}
      data-sources={explanation.sourceIds.join(" ")}
      className={className}
    >
      {explanation.text} <SourceBadge status={explanation.status} />
    </p>
  );
}

/** Legenda única dos selos, no fim das telas com explicações. */
export function SourceLegend() {
  return <p className="text-sm text-ink-soft">{SOURCE_LEGEND}</p>;
}
