import type { ProblemCategoryId } from "@/types/knowledge";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon } from "../ui/Icon";

interface Situation {
  id: ProblemCategoryId;
  title: string;
  summary: string;
}

/**
 * As seis situações da base, em lista compacta. Cada link (#id) volta para a conversa já com a
 * situação escolhida (quem trata o endereço é o `ChatExperience`; não há outra classificação).
 */
export function SituationGrid({ situations }: { situations: Situation[] }) {
  return (
    <section id="situacoes" aria-labelledby="situacoes-titulo" className="glass-dark scroll-mt-24 rounded-3xl p-5 sm:p-6">
      <h2 id="situacoes-titulo" className="text-lg font-semibold text-ice">
        Situações que o assistente reconhece
      </h2>
      <ul className="mt-3 grid gap-1">
        {situations.map((situation) => (
          <li key={situation.id}>
            <a
              href={`#${situation.id}`}
              title={situation.summary}
              className="group -mx-2 flex min-h-12 items-center gap-3 rounded-2xl px-2 py-1.5 text-ice transition-colors hover:bg-ice/10"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ice/10 text-lime transition-colors group-hover:bg-lime group-hover:text-petrol">
                <Icon name={CATEGORY_ICONS[situation.id]} className="size-5" />
              </span>
              <span className="min-w-0 flex-1 text-[0.95rem] font-semibold leading-snug">{situation.title}</span>
              <Icon name="chevron" className="size-4 shrink-0 -rotate-90 text-ice-dim transition-transform group-hover:translate-x-0.5" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
