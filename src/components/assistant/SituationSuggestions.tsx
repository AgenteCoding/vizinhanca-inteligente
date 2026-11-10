import type { ProblemCategoryId } from "@/types/knowledge";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon } from "../ui/Icon";

export interface SituationOption {
  id: ProblemCategoryId;
  title: string;
  /** Sugerida pela IA (empate ou pouca evidência no relato). */
  isCandidate?: boolean;
}

/** Sugestões clicáveis das seis situações (perto do campo de conversa e dentro da conversa). */
export function SituationSuggestions({
  options,
  onSelect,
  label,
  disabled = false,
}: {
  options: SituationOption[];
  onSelect: (categoryId: ProblemCategoryId, title: string) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={label}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.id, option.title)}
              data-candidate={option.isCandidate ? "true" : undefined}
              className={`lift group flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:border-petrol disabled:cursor-not-allowed disabled:opacity-60 ${
                option.isCandidate ? "border-[1.5px] border-petrol bg-surface" : "glass"
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors ${
                  option.isCandidate ? "bg-lime text-petrol" : "bg-petrol text-lime group-hover:bg-lime group-hover:text-petrol"
                }`}
              >
                <Icon name={CATEGORY_ICONS[option.id]} className="size-5" />
              </span>
              <span className="min-w-0 leading-snug">
                {option.isCandidate ? (
                  <span className="block text-sm font-semibold text-petrol-soft">Sugestão da IA</span>
                ) : null}
                <span className="block text-[0.95rem] font-semibold">{option.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
