import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Tone = "info" | "review" | "wrong";

const TONES: Record<Tone, { box: string; icon: IconName; iconColor: string }> = {
  info: { box: "border-ai/40 bg-ai-soft", icon: "info", iconColor: "text-ai" },
  review: { box: "border-review/40 bg-review-soft", icon: "review", iconColor: "text-review" },
  wrong: { box: "border-wrong/50 bg-wrong-soft", icon: "x-circle", iconColor: "text-wrong" },
};

/** Aviso com ícone e texto (nunca só cor). */
export function Notice({
  tone,
  children,
  role,
}: {
  tone: Tone;
  children: ReactNode;
  role?: "alert" | "status";
}) {
  const { box, icon, iconColor } = TONES[tone];
  return (
    <div role={role} className={`flex items-start gap-3 rounded-2xl border p-4 text-ink ${box}`}>
      <Icon name={icon} className={`mt-0.5 size-6 ${iconColor}`} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
