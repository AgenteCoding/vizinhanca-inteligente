import type { DiagnosticoActions } from "@/hooks/use-diagnostico";
import type { StepContent } from "@/types/engine";
import { Button } from "../ui/Button";
import { ExplanationText } from "./ExplanationText";
import { CLARIFICATION_MESSAGES } from "./messages";
import { GuidedOptions, ReportForm } from "./ReportStep";

type Of<S extends StepContent["step"]> = Extract<StepContent, { step: S }>;

export function ReportView({ content, actions }: { content: Of<"relato">; actions: DiagnosticoActions }) {
  return (
    <div className="flex flex-col gap-6">
      <ReportForm onSubmit={actions.submitReport} />
      <GuidedOptions
        label="Ou escolha uma das seis situações"
        options={content.options}
        onSelect={actions.selectCategory}
      />
    </div>
  );
}

export function DiagnosisView({
  content,
  actions,
}: {
  content: Of<"diagnostico">;
  actions: DiagnosticoActions;
}) {
  const { diagnosis, problem } = content;
  const classification = diagnosis.classification;

  if (diagnosis.status === "needs-clarification") {
    const status =
      diagnosis.classification.status === "identified" ? "low-confidence" : diagnosis.classification.status;
    return (
      <div className="flex flex-col gap-6">
        <p role="alert">{CLARIFICATION_MESSAGES[status]}</p>
        <ReportForm onSubmit={actions.submitReport} />
        <GuidedOptions
          label="Escolha a situação"
          options={content.options}
          onSelect={actions.selectCategory}
        />
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className="flex flex-col gap-4">
      <p>
        Situação identificada: <strong>{problem.title}</strong>
      </p>
      <p>{problem.summary}</p>
      {classification && classification.matchedTerms.length > 0 ? (
        <div>
          <h3 className="font-semibold">Como cheguei a esse diagnóstico</h3>
          <p>
            Reconheci no seu relato os termos:{" "}
            {classification.matchedTerms.map((match) => `"${match.term}"`).join(", ")}.
          </p>
          {classification.corrections.length > 0 ? (
            <p className="text-sm">
              Corrigi a escrita de:{" "}
              {classification.corrections.map((c) => `${c.from} → ${c.to}`).join(", ")}.
            </p>
          ) : null}
          <ul className="text-sm">
            {classification.scores.map((score) => (
              <li key={score.categoryId}>
                {content.options.find((option) => option.id === score.categoryId)?.title ??
                  score.categoryId}
                : {score.score} pontos do classificador
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Você escolheu esta situação na lista.</p>
      )}
      <Button onClick={actions.advance}>Ver as causas</Button>
    </div>
  );
}

export function CausesView({ content, actions }: { content: Of<"causas">; actions: DiagnosticoActions }) {
  return (
    <div className="flex flex-col gap-4">
      <p>
        Situação: <strong>{content.title}</strong>
      </p>
      <h3 className="font-semibold">Causas</h3>
      <ul className="flex list-disc flex-col gap-2 pl-6">
        {content.causes.map((cause) => (
          <li key={cause.id}>
            <strong>{cause.title}.</strong> <ExplanationText explanation={cause.explanation} />
          </li>
        ))}
      </ul>
      <h3 className="font-semibold">Consequências</h3>
      <ul className="flex list-disc flex-col gap-2 pl-6">
        {content.consequences.map((consequence) => (
          <li key={consequence.id}>
            <strong>{consequence.title}.</strong>{" "}
            <ExplanationText explanation={consequence.explanation} />
          </li>
        ))}
      </ul>
      <Button onClick={actions.advance}>Ver as alternativas</Button>
    </div>
  );
}

export function AlternativesView({
  content,
  actions,
}: {
  content: Of<"alternativas">;
  actions: DiagnosticoActions;
}) {
  return (
    <div className="flex flex-col gap-4">
      {content.alternatives.map((alternative) => (
        <section key={alternative.id} className="rounded-lg border-2 border-current/30 p-4">
          <h3 className="font-semibold">
            {alternative.isRecommended ? "★ Recomendada: " : ""}
            {alternative.title}
          </h3>
          <p>{alternative.description}</p>
          <h4 className="mt-2 font-semibold">Vantagens</h4>
          <ul className="list-disc pl-6">
            {alternative.benefits.map((benefit) => (
              <li key={benefit.text}>
                <ExplanationText explanation={benefit} />
              </li>
            ))}
          </ul>
          <h4 className="mt-2 font-semibold">Limitações</h4>
          <ul className="list-disc pl-6">
            {alternative.limitations.map((limitation) => (
              <li key={limitation.text}>
                <ExplanationText explanation={limitation} />
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Button onClick={actions.advance}>Ir para o desafio</Button>
    </div>
  );
}

export function ChallengeView({
  content,
  actions,
}: {
  content: Of<"desafio">;
  actions: DiagnosticoActions;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">{content.question}</legend>
      {content.options.map((option) => (
        <Button key={option.id} variant="secondary" onClick={() => actions.answer(option.id)}>
          {option.text}
        </Button>
      ))}
    </fieldset>
  );
}

export function EvaluationView({
  content,
  actions,
}: {
  content: Of<"avaliacao">;
  actions: DiagnosticoActions;
}) {
  const { evaluation } = content;
  return (
    <div className="flex flex-col gap-4">
      <p role="status" className="text-xl font-bold">
        {evaluation.isCorrect ? "✔ Boa escolha!" : "✘ Essa não é a melhor escolha."}
      </p>
      <p>
        Você escolheu: <strong>{evaluation.selectedOptionText}</strong>
      </p>
      <p>{evaluation.selectedFeedback}</p>
      {evaluation.isCorrect ? null : (
        <div className="rounded-lg border-2 border-current/30 p-4">
          <p>
            A opção mais adequada é: <strong>{evaluation.correctOptionText}</strong>
          </p>
          <p>{evaluation.correctFeedback}</p>
        </div>
      )}
      <Button onClick={actions.advance}>Ver a explicação final</Button>
    </div>
  );
}

export function FinalView({ content }: { content: Of<"explicacao-final"> }) {
  const { report } = content;
  const { evaluation } = report;
  return (
    <div className="flex flex-col gap-4">
      <p>
        <strong>Problema identificado:</strong> {report.problem.title}
      </p>
      <p>
        <strong>Causa principal:</strong> {report.mainCause.title}.{" "}
      </p>
      <ExplanationText explanation={report.mainCause.explanation} />
      <p>
        <strong>Solução escolhida no desafio:</strong> {evaluation.selectedOptionText}{" "}
        {evaluation.isCorrect ? "(✔ escolha adequada)" : "(✘ não era a mais adequada)"}
      </p>
      <h3 className="font-semibold">Explicação científica</h3>
      <ExplanationText explanation={report.scientificExplanation} />
      <h3 className="font-semibold">Como a solução contribui para a eficiência energética</h3>
      <ExplanationText explanation={report.finalExplanation} />
      <h3 className="font-semibold">Solução recomendada: {report.recommendedSolution.title}</h3>
      <h4 className="font-semibold">Benefícios</h4>
      <ul className="list-disc pl-6">
        {report.recommendedSolution.benefits.map((benefit) => (
          <li key={benefit.text}>
            <ExplanationText explanation={benefit} />
          </li>
        ))}
      </ul>
      <h4 className="font-semibold">Limitações</h4>
      <ul className="list-disc pl-6">
        {report.recommendedSolution.limitations.map((limitation) => (
          <li key={limitation.text}>
            <ExplanationText explanation={limitation} />
          </li>
        ))}
      </ul>
      {report.hasPendingContent ? (
        <p className="text-sm italic">
          Parte deste conteúdo ainda está em revisão e será conferida pelo professor orientador.
        </p>
      ) : null}
      <h3 className="font-semibold">Fontes consultadas</h3>
      <ul className="list-disc pl-6">
        {report.sources.verified.map((source) => (
          <li key={source.id} data-source-id={source.id}>
            {source.organization}: <cite>{source.title}</cite> ({source.url}), acesso em{" "}
            {source.accessedAt}.
          </li>
        ))}
      </ul>
      {report.sources.pending.length > 0 ? (
        <>
          <h3 className="font-semibold">Fontes ainda não conferidas</h3>
          <ul className="list-disc pl-6">
            {report.sources.pending.map((source) => (
              <li key={source.id} data-source-id={source.id}>
                {source.organization}: <cite>{source.title}</cite> (pendente de verificação)
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
