/**
 * Esquemas Zod da base de conhecimento.
 *
 * Os tipos continuam definidos em `src/types/knowledge.ts` (fonte única da verdade). Cada
 * esquema aqui é declarado com `satisfies z.ZodType<Tipo>` e há testes de igualdade de tipos
 * em `tests/data/schema.test.ts`: se esquema e contrato divergirem, o `typecheck` falha.
 *
 * Além da forma dos dados, os esquemas garantem as regras científicas do projeto
 * (CLAUDE.md, seção 7): fontes rastreáveis, status de verificação coerente e nenhum número
 * de economia em texto sem fonte confirmada.
 */
import { z } from "zod";
import {
  PROBLEM_CATEGORY_IDS,
  type Alternative,
  type Challenge,
  type ChallengeOption,
  type ExplainedPoint,
  type Explanation,
  type KnowledgeBase,
  type ProblemCategory,
  type ReviewStatus,
  type Source,
  type WeightedKeyword,
} from "@/types/knowledge";

/** IDs em português, kebab-case, sem acentos (ex.: `luzes-ambientes-vazios`). */
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Palavras-chave já normalizadas: minúsculas, sem acentos, palavras separadas por um espaço. */
const KEYWORD_PATTERN = /^[a-z0-9]+(?: [a-z0-9]+)*$/;

/** Indícios de dado numérico de economia, proibidos em texto sem fonte confirmada. */
const ECONOMY_FIGURE_PATTERN = /%|kwh|r\$/i;

/** Pesos aceitos para palavras-chave: 1 = genérico, 2 = relacionado, 3 = muito específico. */
export const KEYWORD_WEIGHT_MIN = 1;
export const KEYWORD_WEIGHT_MAX = 3;

/** Número de opções de cada desafio (RF14: escolher entre três alternativas). */
export const CHALLENGE_OPTION_COUNT = 3;

const idSchema = z.string().regex(ID_PATTERN, "Use kebab-case sem acentos (ex.: minha-id).");
const textSchema = z.string().regex(/\S/, "O texto não pode ficar vazio.");

/** Acrescenta um erro para cada `id` repetido da lista. */
function reportDuplicateIds(
  items: readonly { id: string }[],
  ctx: z.core.$RefinementCtx<unknown>,
  path: (string | number)[],
): void {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) {
      ctx.addIssue({
        code: "custom",
        message: `ID duplicado: "${item.id}".`,
        path: [...path, index, "id"],
      });
    }
    seen.add(item.id);
  });
}

export const reviewStatusSchema = z.enum(["pending", "verified"]) satisfies z.ZodType<ReviewStatus>;

export const sourceSchema = z
  .strictObject({
    id: idSchema,
    organization: textSchema,
    title: textSchema,
    url: z.url({ protocol: /^https$/, message: "Informe uma URL https válida." }),
    topic: textSchema,
    supportedClaims: z.array(textSchema),
    status: reviewStatusSchema,
    accessedAt: z.iso.date("Use o formato AAAA-MM-DD."),
  })
  .superRefine((source, ctx) => {
    if (source.status === "verified" && source.supportedClaims.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Fonte verificada precisa registrar ao menos uma afirmação que sustenta.",
        path: ["supportedClaims"],
      });
    }
  }) satisfies z.ZodType<Source>;

export const explanationSchema = z
  .strictObject({
    text: textSchema,
    sourceIds: z.array(idSchema),
    status: reviewStatusSchema,
  })
  .superRefine((explanation, ctx) => {
    if (explanation.status === "verified" && explanation.sourceIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Explicação verificada precisa citar ao menos uma fonte.",
        path: ["sourceIds"],
      });
    }
    if (explanation.status === "pending" && ECONOMY_FIGURE_PATTERN.test(explanation.text)) {
      ctx.addIssue({
        code: "custom",
        message: "Texto pendente não pode conter percentuais, kWh ou valores em reais.",
        path: ["text"],
      });
    }
    if (new Set(explanation.sourceIds).size !== explanation.sourceIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "A mesma fonte foi citada mais de uma vez.",
        path: ["sourceIds"],
      });
    }
  }) satisfies z.ZodType<Explanation>;

export const explainedPointSchema = z.strictObject({
  id: idSchema,
  title: textSchema,
  explanation: explanationSchema,
}) satisfies z.ZodType<ExplainedPoint>;

export const alternativeSchema = z.strictObject({
  id: idSchema,
  title: textSchema,
  description: textSchema,
  benefits: z.array(explanationSchema).min(1, "Toda alternativa precisa de ao menos um benefício."),
  limitations: z
    .array(explanationSchema)
    .min(1, "Toda alternativa precisa de ao menos uma limitação."),
}) satisfies z.ZodType<Alternative>;

export const challengeOptionSchema = z.strictObject({
  id: idSchema,
  text: textSchema,
  isCorrect: z.boolean(),
  feedback: textSchema,
}) satisfies z.ZodType<ChallengeOption>;

export const challengeSchema = z
  .strictObject({
    id: idSchema,
    question: textSchema,
    options: z
      .array(challengeOptionSchema)
      .length(CHALLENGE_OPTION_COUNT, `O desafio deve ter ${CHALLENGE_OPTION_COUNT} opções.`),
  })
  .superRefine((challenge, ctx) => {
    const correctCount = challenge.options.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: `O desafio deve ter exatamente uma opção correta (encontradas: ${correctCount}).`,
        path: ["options"],
      });
    }
    reportDuplicateIds(challenge.options, ctx, ["options"]);
  }) satisfies z.ZodType<Challenge>;

export const weightedKeywordSchema = z.strictObject({
  term: z
    .string()
    .regex(KEYWORD_PATTERN, "Escreva o termo normalizado: minúsculas, sem acentos nem pontuação."),
  weight: z.int().min(KEYWORD_WEIGHT_MIN).max(KEYWORD_WEIGHT_MAX),
}) satisfies z.ZodType<WeightedKeyword>;

export const problemCategorySchema = z
  .strictObject({
    id: z.enum(PROBLEM_CATEGORY_IDS),
    title: textSchema,
    summary: textSchema,
    keywords: z.array(weightedKeywordSchema).min(1, "Cadastre ao menos uma palavra-chave."),
    causes: z.array(explainedPointSchema).min(1, "Cadastre ao menos uma causa."),
    consequences: z.array(explainedPointSchema).min(1, "Cadastre ao menos uma consequência."),
    alternatives: z.array(alternativeSchema).min(2, "Cadastre ao menos duas alternativas."),
    recommendedAlternativeId: idSchema,
    scientificExplanation: explanationSchema,
    challenge: challengeSchema,
    finalExplanation: explanationSchema,
  })
  .superRefine((problem, ctx) => {
    reportDuplicateIds(problem.causes, ctx, ["causes"]);
    reportDuplicateIds(problem.consequences, ctx, ["consequences"]);
    reportDuplicateIds(problem.alternatives, ctx, ["alternatives"]);

    const terms = new Set<string>();
    problem.keywords.forEach((keyword, index) => {
      if (terms.has(keyword.term)) {
        ctx.addIssue({
          code: "custom",
          message: `Palavra-chave duplicada: "${keyword.term}".`,
          path: ["keywords", index, "term"],
        });
      }
      terms.add(keyword.term);
    });

    if (!problem.alternatives.some((alt) => alt.id === problem.recommendedAlternativeId)) {
      ctx.addIssue({
        code: "custom",
        message: `A alternativa recomendada "${problem.recommendedAlternativeId}" não existe.`,
        path: ["recommendedAlternativeId"],
      });
    }
  }) satisfies z.ZodType<ProblemCategory>;

/** Todas as explicações de uma categoria, com o caminho de cada uma (para mensagens de erro). */
export function listExplanations(
  problem: ProblemCategory,
): { path: (string | number)[]; explanation: Explanation }[] {
  return [
    ...problem.causes.map((cause, i) => ({
      path: ["causes", i, "explanation"],
      explanation: cause.explanation,
    })),
    ...problem.consequences.map((consequence, i) => ({
      path: ["consequences", i, "explanation"],
      explanation: consequence.explanation,
    })),
    ...problem.alternatives.flatMap((alternative, i) => [
      ...alternative.benefits.map((explanation, j) => ({
        path: ["alternatives", i, "benefits", j],
        explanation,
      })),
      ...alternative.limitations.map((explanation, j) => ({
        path: ["alternatives", i, "limitations", j],
        explanation,
      })),
    ]),
    { path: ["scientificExplanation"], explanation: problem.scientificExplanation },
    { path: ["finalExplanation"], explanation: problem.finalExplanation },
  ];
}

export const knowledgeBaseSchema = z
  .strictObject({
    sources: z.array(sourceSchema),
    problems: z.array(problemCategorySchema),
  })
  .superRefine((kb, ctx) => {
    reportDuplicateIds(kb.sources, ctx, ["sources"]);
    reportDuplicateIds(kb.problems, ctx, ["problems"]);

    const registered = new Set(kb.problems.map((problem) => problem.id));
    for (const id of PROBLEM_CATEGORY_IDS) {
      if (!registered.has(id)) {
        ctx.addIssue({
          code: "custom",
          message: `Categoria obrigatória ausente: "${id}".`,
          path: ["problems"],
        });
      }
    }

    const sourcesById = new Map(kb.sources.map((source) => [source.id, source]));
    const citedSourceIds = new Set<string>();

    kb.problems.forEach((problem, problemIndex) => {
      for (const { path, explanation } of listExplanations(problem)) {
        explanation.sourceIds.forEach((sourceId, sourceIndex) => {
          citedSourceIds.add(sourceId);
          const source = sourcesById.get(sourceId);
          const issuePath = ["problems", problemIndex, ...path, "sourceIds", sourceIndex];
          if (!source) {
            ctx.addIssue({
              code: "custom",
              message: `Fonte inexistente: "${sourceId}".`,
              path: issuePath,
            });
          } else if (explanation.status === "verified" && source.status !== "verified") {
            ctx.addIssue({
              code: "custom",
              message: `Explicação verificada não pode se apoiar na fonte pendente "${sourceId}".`,
              path: issuePath,
            });
          }
        });
      }
    });

    kb.sources.forEach((source, index) => {
      if (!citedSourceIds.has(source.id)) {
        ctx.addIssue({
          code: "custom",
          message: `A fonte "${source.id}" não é citada por nenhuma explicação.`,
          path: ["sources", index, "id"],
        });
      }
    });
  }) satisfies z.ZodType<KnowledgeBase>;
