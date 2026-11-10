import Link from "next/link";
import type { ProblemCategoryId } from "@/types/knowledge";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon } from "../ui/Icon";

interface Situation {
  id: ProblemCategoryId;
  title: string;
  summary: string;
}

/** As seis situações da base. Cada cartão abre o diagnóstico já com a situação escolhida. */
export function SituationGrid({ situations }: { situations: Situation[] }) {
  return (
    <section id="situacoes" aria-labelledby="situacoes-titulo" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 py-14 sm:px-6">
      <h2 id="situacoes-titulo" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Seis situações que a IA reconhece
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Escolha uma para estudar agora, ou descreva o que você viu no diagnóstico.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {situations.map((situation) => (
          <li key={situation.id}>
            <Link
              href={`/diagnostico#${situation.id}`}
              className="group flex h-full flex-col gap-3 rounded-3xl border-2 border-line bg-surface p-5 transition-colors hover:border-ink"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-paper text-ink transition-colors group-hover:bg-lime">
                <Icon name={CATEGORY_ICONS[situation.id]} className="size-7" />
              </span>
              <span className="text-xl font-bold leading-snug">{situation.title}</span>
              <span className="text-ink-soft">{situation.summary}</span>
              <span className="mt-auto pt-2 font-bold text-ai underline-offset-4 group-hover:underline">
                Estudar esta situação
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
