import type { ProblemCategoryId } from "@/types/knowledge";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon } from "../ui/Icon";

interface Situation {
  id: ProblemCategoryId;
  title: string;
  summary: string;
}

/**
 * As seis situações da base. Cada link (#id) volta para a conversa já com a situação escolhida.
 */
export function SituationGrid({ situations }: { situations: Situation[] }) {
  return (
    <section id="situacoes" aria-labelledby="situacoes-titulo" className="scroll-mt-20 border-t border-line/70">
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <h2 id="situacoes-titulo" className="text-2xl font-extrabold tracking-tight">
          Situações que o assistente reconhece
        </h2>
        <p className="mt-2 max-w-2xl text-petrol-soft">
          Escolha uma para conversar sobre ela, ou descreva com suas palavras no campo de conversa.
        </p>
        <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
          {situations.map((situation) => (
            <li key={situation.id} className="border-b border-line/70">
              <a
                href={`#${situation.id}`}
                className="group flex min-h-12 items-start gap-3 rounded-xl py-4 hover:bg-ice-strong/60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ice-strong text-petrol group-hover:bg-lime">
                  <Icon name={CATEGORY_ICONS[situation.id]} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold leading-snug">{situation.title}</span>
                  <span className="mt-1 block text-sm text-petrol-soft">{situation.summary}</span>
                  <span className="mt-1 block text-sm font-bold underline-offset-4 group-hover:underline">
                    Conversar sobre esta situação
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
