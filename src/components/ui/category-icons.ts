import type { ProblemCategoryId } from "@/types/knowledge";
import type { IconName } from "./Icon";

/** Ícone de cada situação: o mesmo no mapa, nos cartões e no fluxo do diagnóstico. */
export const CATEGORY_ICONS: Record<ProblemCategoryId, IconName> = {
  "iluminacao-publica-dia": "streetlight",
  "luzes-ambientes-vazios": "bulb",
  "consumo-horario-pico": "clock",
  "eletrodomesticos-ineficientes": "fridge",
  "ar-condicionado-aberto": "ac",
  "solar-sem-geracao": "solar",
};
