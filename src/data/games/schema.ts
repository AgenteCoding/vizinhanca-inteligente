/**
 * Esquemas Zod dos dados dos minigames, conferidos contra os tipos de `src/types/games.ts`.
 * Reaproveitam os esquemas da base (explicação com fonte e status, desafio de três opções).
 */
import { z } from "zod";
import type {
  ChoiceRound,
  DetectiveData,
  DetectiveItem,
  DetectiveRoom,
  HouseData,
  HouseProblem,
  HouseSolution,
  SolutionEffect,
} from "@/types/games";
import { PROBLEM_CATEGORY_IDS, type Explanation, type KnowledgeBase } from "@/types/knowledge";
import { challengeSchema, explanationSchema } from "../schema";

const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use kebab-case sem acentos.");
const textSchema = z.string().regex(/\S/, "O texto não pode ficar vazio.");
const categoryIdSchema = z.enum(PROBLEM_CATEGORY_IDS);

export const choiceRoundSchema = z.strictObject({
  categoryId: categoryIdSchema,
  challenge: challengeSchema,
}) satisfies z.ZodType<ChoiceRound>;

export const detectiveItemSchema = z.strictObject({
  id: idSchema,
  label: textSchema,
  verdict: z.enum(["desperdicio", "normal", "depende"]),
  categoryId: categoryIdSchema.nullable(),
  explanation: explanationSchema,
  tip: textSchema,
}) satisfies z.ZodType<DetectiveItem>;

export const detectiveRoomSchema = z.strictObject({
  id: idSchema,
  name: textSchema,
  items: z.array(detectiveItemSchema).min(2),
}) satisfies z.ZodType<DetectiveRoom>;

export const detectiveDataSchema = z.strictObject({
  house: textSchema,
  rooms: z.array(detectiveRoomSchema).min(2),
}) satisfies z.ZodType<DetectiveData>;

export const solutionEffectSchema = z.strictObject({
  categoryId: categoryIdSchema,
  level: z.enum(["resolve", "ajuda"]),
}) satisfies z.ZodType<SolutionEffect>;

export const houseProblemSchema = z.strictObject({
  categoryId: categoryIdSchema,
  description: textSchema,
}) satisfies z.ZodType<HouseProblem>;

export const houseSolutionSchema = z.strictObject({
  id: idSchema,
  name: textSchema,
  kind: z.enum(["tecnologia", "habito"]),
  description: textSchema,
  effects: z.array(solutionEffectSchema).min(1),
  benefit: explanationSchema,
  limitation: explanationSchema,
  worksBestWith: z.array(idSchema),
  pairingNote: z.string(),
}) satisfies z.ZodType<HouseSolution>;

export const houseDataSchema = z
  .strictObject({
    house: textSchema,
    maxSelections: z.int().min(1),
    problems: z.array(houseProblemSchema).min(1),
    solutions: z.array(houseSolutionSchema).min(2),
  })
  .superRefine((house, ctx) => {
    const ids = new Set(house.solutions.map((solution) => solution.id));
    house.solutions.forEach((solution, index) => {
      for (const partner of solution.worksBestWith) {
        if (!ids.has(partner)) {
          ctx.addIssue({ code: "custom", message: `Solução inexistente: "${partner}".`, path: ["solutions", index, "worksBestWith"] });
        }
      }
      if (solution.worksBestWith.length > 0 && !solution.pairingNote.trim()) {
        ctx.addIssue({ code: "custom", message: "Explique a combinação em pairingNote.", path: ["solutions", index, "pairingNote"] });
      }
    });
    if (ids.size !== house.solutions.length) {
      ctx.addIssue({ code: "custom", message: "ID de solução duplicado.", path: ["solutions"] });
    }
  }) satisfies z.ZodType<HouseData>;

/** Todas as explicações dos jogos (para conferir as fontes contra a base). */
export function listGameExplanations(detective: DetectiveData, house: HouseData): Explanation[] {
  return [
    ...detective.rooms.flatMap((room) => room.items.map((item) => item.explanation)),
    ...house.solutions.flatMap((solution) => [solution.benefit, solution.limitation]),
  ];
}

/** Confere as fontes citadas nos jogos: devem existir, e "verified" só com fontes verificadas. */
export function checkGameSources(explanations: Explanation[], knowledgeBase: KnowledgeBase): string[] {
  const sources = new Map(knowledgeBase.sources.map((source) => [source.id, source]));
  const problems: string[] = [];
  for (const explanation of explanations) {
    for (const id of explanation.sourceIds) {
      const source = sources.get(id);
      if (!source) problems.push(`Fonte inexistente: "${id}".`);
      else if (explanation.status === "verified" && source.status !== "verified") {
        problems.push(`Explicação verificada apoiada na fonte pendente "${id}".`);
      }
    }
  }
  return problems;
}
