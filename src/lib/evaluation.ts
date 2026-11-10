/**
 * Avaliação da resposta do desafio e montagem da explicação final.
 *
 * Funções puras sobre os dados da base. Nenhum texto é inventado aqui: tudo vem de
 * `src/data/`, e cada `Explanation` mantém o seu `status` e os seus `sourceIds`.
 */
import type { ChallengeEvaluation, FinalReport, ReportSources } from "@/types/engine";
import type { Challenge, Explanation, ProblemCategory, Source } from "@/types/knowledge";

/**
 * Compara a opção escolhida com a opção correta do desafio.
 * Devolve `null` se a opção não existir (a ação deve ser recusada pelo motor).
 */
export function evaluateAnswer(
  challenge: Challenge,
  selectedOptionId: string,
): ChallengeEvaluation | null {
  const selected = challenge.options.find((option) => option.id === selectedOptionId);
  const correct = challenge.options.find((option) => option.isCorrect);
  if (!selected || !correct) return null;
  return {
    challengeId: challenge.id,
    selectedOptionId: selected.id,
    selectedOptionText: selected.text,
    isCorrect: selected.isCorrect,
    selectedFeedback: selected.feedback,
    correctOptionId: correct.id,
    correctOptionText: correct.text,
    correctFeedback: correct.feedback,
  };
}

/** Resolve os `sourceIds` citados, separando fontes verificadas de pendentes, sem repetição. */
export function collectSources(
  explanations: readonly Explanation[],
  sources: readonly Source[],
): ReportSources {
  const byId = new Map(sources.map((source) => [source.id, source]));
  const ids = [...new Set(explanations.flatMap((explanation) => explanation.sourceIds))];
  const cited = ids.flatMap((id) => {
    const source = byId.get(id);
    return source ? [source] : [];
  });
  return {
    verified: cited.filter((source) => source.status === "verified"),
    pending: cited.filter((source) => source.status !== "verified"),
  };
}

/**
 * Monta a explicação final (etapa 7). Devolve `null` se a base não tiver os dados
 * obrigatórios (causa principal ou alternativa recomendada), o que o esquema já impede.
 */
export function buildFinalReport(
  problem: ProblemCategory,
  evaluation: ChallengeEvaluation,
  sources: readonly Source[],
): FinalReport | null {
  const [mainCause] = problem.causes;
  const recommendedSolution = problem.alternatives.find(
    (alternative) => alternative.id === problem.recommendedAlternativeId,
  );
  if (!mainCause || !recommendedSolution) return null;

  const presented: Explanation[] = [
    ...problem.causes.map((cause) => cause.explanation),
    ...problem.consequences.map((consequence) => consequence.explanation),
    ...recommendedSolution.benefits,
    ...recommendedSolution.limitations,
    problem.scientificExplanation,
    problem.finalExplanation,
  ];

  return {
    problem: { id: problem.id, title: problem.title, summary: problem.summary },
    mainCause,
    causes: problem.causes,
    consequences: problem.consequences,
    evaluation,
    recommendedSolution,
    scientificExplanation: problem.scientificExplanation,
    finalExplanation: problem.finalExplanation,
    sources: collectSources(presented, sources),
    hasPendingContent: presented.some((explanation) => explanation.status === "pending"),
  };
}
