import { FLOW_STEPS, type FlowStep } from "@/types/knowledge";
import { Icon } from "../ui/Icon";
import { STEP_LABELS } from "./messages";

/** Indicador das sete etapas: concluídas, atual e próximas (com texto, não só cor). */
export function StepCircuit({ current }: { current: FlowStep }) {
  const currentIndex = FLOW_STEPS.indexOf(current);
  return (
    <nav aria-label="Progresso do diagnóstico">
      <p className="text-sm font-bold text-ink-soft lg:sr-only">
        Etapa {currentIndex + 1} de {FLOW_STEPS.length}: {STEP_LABELS[current]}
      </p>
      <ol className="mt-2 flex items-center lg:mt-0 lg:pb-7">
        {FLOW_STEPS.map((step, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          const node =
            state === "done"
              ? "border-ink bg-ink text-lime"
              : state === "current"
                ? "border-ink bg-lime text-ink ring-4 ring-lime/40"
                : "border-line bg-surface text-ink-soft";
          return (
            <li
              key={step}
              aria-current={state === "current" ? "step" : undefined}
              className="flex flex-1 items-center last:flex-none"
            >
              <span className="relative flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={`grid size-7 place-items-center rounded-full border-2 text-sm font-extrabold sm:size-8 ${node}`}
                >
                  {state === "done" ? <Icon name="check" className="size-4" /> : index + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={`absolute top-full mt-1.5 hidden whitespace-nowrap text-sm lg:block ${
                    state === "current" ? "font-extrabold text-ink" : "text-ink-soft"
                  }`}
                >
                  {STEP_LABELS[step]}
                </span>
                <span className="sr-only">
                  {STEP_LABELS[step]}
                  {state === "done" ? " (concluída)" : state === "current" ? " (etapa atual)" : ""}
                </span>
              </span>
              {index < FLOW_STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={`mx-1 h-0.5 flex-1 rounded-full ${index < currentIndex ? "bg-ink" : "bg-line"}`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
