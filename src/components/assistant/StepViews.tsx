import Link from "next/link";
import type { ReactNode } from "react";
import { KEYWORD_WEIGHT_MAX, KEYWORD_WEIGHT_MIN } from "@/data/schema";
import type { DiagnosticoActions } from "@/hooks/use-diagnostico";
import type { ClassificationResult, StepContent } from "@/types/engine";
import type { Explanation, ProblemCategoryId } from "@/types/knowledge";
import { Button, buttonClasses } from "../ui/Button";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon, type IconName } from "../ui/Icon";
import { Notice } from "../ui/Notice";
import { ExplanationText, SourceLegend } from "./ExplanationText";
import { CLARIFICATION_MESSAGES, EVALUATION_MESSAGES, PENDING_NOTICE } from "./messages";
import { ReportForm, SituationOptions } from "./ReportStep";

type Of<S extends StepContent["step"]> = Extract<StepContent, { step: S }>;

/** Cartão de seção com ícone e título. */
function Card({
  icon,
  title,
  children,
  className = "",
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      <h3 className="flex items-center gap-2 text-xl font-bold">
        <Icon name={icon} className="text-ai" />
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Lista de trechos explicativos com um ícone por item. */
function ExplanationList({
  items,
  icon,
  iconClass,
  keyPrefix,
}: {
  items: Explanation[];
  icon: IconName;
  iconClass: string;
  keyPrefix: string;
}) {
  return (
    <ul className="grid gap-3">
      {items.map((item, index) => (
        <li key={`${keyPrefix}-${index}`} className="flex gap-2.5">
          <Icon name={icon} className={`mt-1 size-5 ${iconClass}`} />
          <ExplanationText explanation={item} />
        </li>
      ))}
    </ul>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

// ---------------------------------------------------------------------------------------------
// 1. Relato
// ---------------------------------------------------------------------------------------------

export function ReportView({ content, actions }: { content: Of<"relato">; actions: DiagnosticoActions }) {
  return (
    <div className="grid gap-8">
      <ReportForm onSubmit={actions.submitReport} />
      <SituationOptions
        label="Ou escolha uma das seis situações"
        options={content.options}
        onSelect={actions.selectCategory}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// 2. Diagnóstico
// ---------------------------------------------------------------------------------------------

/** Mostra como o classificador chegou ao resultado: termos, correções e pontuação. */
function ReasoningCard({
  classification,
  titles,
  heading,
}: {
  classification: ClassificationResult;
  titles: Map<ProblemCategoryId, string>;
  heading: string;
}) {
  const topScore = classification.scores[0]?.score ?? 1;
  return (
    <section aria-labelledby="raciocinio-ia" className="rounded-3xl border border-ai/40 bg-ai-soft p-5 sm:p-6">
      <h3 id="raciocinio-ia" className="flex items-center gap-2 text-lg font-bold text-ai">
        <Icon name="scan" />
        {heading}
      </h3>
      <p className="mt-2">
        A IA procurou no seu relato palavras-chave de cada situação. Ela compara as palavras sem
        acentos e no singular, e cada palavra-chave vale de {KEYWORD_WEIGHT_MIN} a{" "}
        {KEYWORD_WEIGHT_MAX} pontos.
      </p>
      <ul aria-label="Palavras-chave reconhecidas" className="mt-3 flex flex-wrap gap-2">
        {classification.matchedTerms.map((match) => (
          <li key={match.term} className="rounded-full border border-ai/40 bg-surface px-3 py-1 font-mono text-sm text-ai">
            {match.term}
          </li>
        ))}
      </ul>
      {classification.corrections.length > 0 ? (
        <p className="mt-3 text-sm">
          Correção de digitação:{" "}
          {classification.corrections.map((c) => `${c.from} → ${c.to}`).join(", ")}.
        </p>
      ) : null}
      <ul className="mt-4 grid gap-3">
        {classification.scores.map((score) => (
          <li key={score.categoryId}>
            <div className="flex justify-between gap-3 text-sm font-bold">
              <span>{titles.get(score.categoryId) ?? score.categoryId}</span>
              <span className="whitespace-nowrap">{score.score} pontos</span>
            </div>
            <div aria-hidden="true" className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-ai"
                style={{ width: `${Math.max(6, (score.score / topScore) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DiagnosisView({
  content,
  actions,
}: {
  content: Of<"diagnostico">;
  actions: DiagnosticoActions;
}) {
  const { diagnosis, problem, options } = content;
  const titles = new Map(options.map((option) => [option.id, option.title]));

  if (diagnosis.status === "needs-clarification") {
    const { classification } = diagnosis;
    const status = classification.status === "identified" ? "low-confidence" : classification.status;
    return (
      <div className="grid gap-6" data-diagnosis="needs-clarification">
        <Notice tone="info" role="alert">
          <p className="font-bold">{CLARIFICATION_MESSAGES[status]}</p>
        </Notice>
        {classification.matchedTerms.length > 0 ? (
          <ReasoningCard classification={classification} titles={titles} heading="O que a IA encontrou no seu relato" />
        ) : null}
        <SituationOptions label="Escolha a situação" options={options} onSelect={actions.selectCategory} />
        <div className="grid gap-3">
          <h3 className="text-lg font-bold">Ou escreva de outro jeito</h3>
          <ReportForm onSubmit={actions.submitReport} showExamples={false} />
        </div>
      </div>
    );
  }

  if (!problem) return null;
  const showReasoning =
    diagnosis.method === "text" &&
    diagnosis.classification !== null &&
    diagnosis.classification.matchedTerms.length > 0;

  return (
    <div className="grid gap-5" data-diagnosis="confirmed" data-category={problem.id}>
      <article className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-lime">
            <Icon name={CATEGORY_ICONS[problem.id]} className="size-8" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-ink-soft">
              {diagnosis.method === "text" ? "Situação identificada" : "Situação escolhida"}
            </p>
            <h3 className="text-2xl font-extrabold leading-tight sm:text-3xl">{problem.title}</h3>
            <p className="mt-2 text-ink-soft">{problem.summary}</p>
          </div>
        </div>
      </article>

      {showReasoning && diagnosis.classification ? (
        <ReasoningCard
          classification={diagnosis.classification}
          titles={titles}
          heading="Como a IA chegou a esse diagnóstico"
        />
      ) : (
        <p className="text-ink-soft">Você escolheu esta situação na lista.</p>
      )}

      <div>
        <Button onClick={actions.advance}>Ver as causas</Button>
      </div>

      <details className="group rounded-2xl border border-line bg-surface">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
          Não é isso? Escolher outra situação
          <Icon name="chevron" className="size-5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <SituationOptions label="Escolha a situação certa" options={options} onSelect={actions.selectCategory} />
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// 3. Causas
// ---------------------------------------------------------------------------------------------

export function CausesView({ content, actions }: { content: Of<"causas">; actions: DiagnosticoActions }) {
  return (
    <div className="grid gap-6">
      <p className="text-lg">
        Situação: <strong>{content.title}</strong>
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card icon="search" title="Causas">
          <ul className="grid gap-4">
            {content.causes.map((cause, index) => (
              <li
                key={cause.id}
                className={index === 0 ? "rounded-2xl border-2 border-ink bg-paper p-4" : "border-t border-line pt-4"}
              >
                {index === 0 ? <p className="text-sm font-bold text-ink-soft">Causa principal</p> : null}
                <h4 className="text-lg font-bold">{cause.title}</h4>
                <ExplanationText explanation={cause.explanation} className="mt-1" />
              </li>
            ))}
          </ul>
        </Card>
        <Card icon="ripple" title="Consequências">
          <ul className="grid gap-4">
            {content.consequences.map((consequence, index) => (
              <li key={consequence.id} className={index === 0 ? "" : "border-t border-line pt-4"}>
                <h4 className="text-lg font-bold">{consequence.title}</h4>
                <ExplanationText explanation={consequence.explanation} className="mt-1" />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <SourceLegend />
      <div>
        <Button onClick={actions.advance}>Ver as alternativas</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// 4. Alternativas
// ---------------------------------------------------------------------------------------------

export function AlternativesView({
  content,
  actions,
}: {
  content: Of<"alternativas">;
  actions: DiagnosticoActions;
}) {
  return (
    <div className="grid gap-6">
      <p className="text-lg">
        Situação: <strong>{content.title}</strong>
      </p>
      <ul className="grid gap-5">
        {content.alternatives.map((alternative) => (
          <li key={alternative.id}>
            <article
              data-alternative-id={alternative.id}
              data-recommended={alternative.isRecommended ? "true" : "false"}
              className={`overflow-hidden rounded-3xl bg-surface ${
                alternative.isRecommended ? "border-2 border-ink" : "border border-line"
              }`}
            >
              {alternative.isRecommended ? (
                <p className="flex items-center gap-2 border-b-2 border-ink bg-lime px-5 py-2.5 font-bold">
                  <Icon name="star" className="size-5" />
                  Solução recomendada
                </p>
              ) : null}
              <div className="p-5 sm:p-6">
                <h3 className="text-xl font-extrabold">{alternative.title}</h3>
                <p className="mt-1 text-ink-soft">{alternative.description}</p>
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-bold">Vantagens</h4>
                    <ExplanationList
                      items={alternative.benefits}
                      icon="check-circle"
                      iconClass="text-ink"
                      keyPrefix={`${alternative.id}-vantagem`}
                    />
                  </div>
                  <div>
                    <h4 className="mb-3 font-bold">Limitações</h4>
                    <ExplanationList
                      items={alternative.limitations}
                      icon="minus-circle"
                      iconClass="text-ink-soft"
                      keyPrefix={`${alternative.id}-limitacao`}
                    />
                  </div>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <SourceLegend />
      <div>
        <Button onClick={actions.advance}>Ir para o desafio</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// 6. Avaliação
// ---------------------------------------------------------------------------------------------

export function EvaluationView({
  content,
  actions,
}: {
  content: Of<"avaliacao">;
  actions: DiagnosticoActions;
}) {
  const { evaluation } = content;
  const correct = evaluation.isCorrect;
  return (
    <div className="grid gap-5">
      <div
        role="status"
        data-result={correct ? "correct" : "incorrect"}
        className={`rounded-3xl border-2 p-5 sm:p-6 ${correct ? "border-ink bg-lime" : "border-wrong bg-wrong-soft"}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-ink bg-surface">
            <Icon name={correct ? "check-circle" : "x-circle"} className={`size-9 ${correct ? "text-ink" : "text-wrong"}`} />
          </span>
          <div>
            <p className="text-xl font-extrabold leading-tight sm:text-2xl">
              {correct ? EVALUATION_MESSAGES.correctTitle : EVALUATION_MESSAGES.incorrectTitle}
            </p>
            <p className="mt-1 text-lg">
              {correct ? EVALUATION_MESSAGES.correctText : EVALUATION_MESSAGES.incorrectText}
            </p>
          </div>
        </div>
      </div>

      <article className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <p className="flex items-center gap-2 font-bold text-ink-soft">
          <Icon name="user" className="size-5" />
          Sua escolha
        </p>
        <p className="mt-1 text-xl font-bold leading-snug">{evaluation.selectedOptionText}</p>
        <p className="mt-2">{evaluation.selectedFeedback}</p>
      </article>

      {correct ? null : (
        <article className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6">
          <p className="flex items-center gap-2 font-bold text-ink-soft">
            <Icon name="star" className="size-5" />A opção mais adequada
          </p>
          <p className="mt-1 text-xl font-bold leading-snug">{evaluation.correctOptionText}</p>
          <p className="mt-2">{evaluation.correctFeedback}</p>
        </article>
      )}

      <div>
        <Button onClick={actions.advance}>Ver a explicação final</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// 7. Explicação final
// ---------------------------------------------------------------------------------------------

export function FinalView({ content, actions }: { content: Of<"explicacao-final">; actions: DiagnosticoActions }) {
  const { report } = content;
  const { evaluation, problem, recommendedSolution } = report;
  return (
    <div className="grid gap-6">
      <section aria-labelledby="resumo-final" className="rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <h3 id="resumo-final" className="sr-only">
          Resumo
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-lime text-ink">
            <Icon name={CATEGORY_ICONS[problem.id]} className="size-8" />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-lime">Problema identificado</p>
            <p className="text-2xl font-extrabold leading-tight sm:text-3xl">{problem.title}</p>
            <p className="mt-2 text-paper/85">{problem.summary}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-paper/25 p-4">
            <dt className="font-bold text-lime">Sua escolha no desafio</dt>
            <dd className="mt-1">{evaluation.selectedOptionText}</dd>
          </div>
          <div className="rounded-2xl border border-paper/25 p-4">
            <dt className="font-bold text-lime">Resultado da avaliação</dt>
            <dd className="mt-1 flex items-start gap-2 font-bold">
              <Icon name={evaluation.isCorrect ? "check-circle" : "x-circle"} className="mt-0.5 size-5" />
              {evaluation.isCorrect ? "Escolha adequada" : "Não era a escolha mais adequada"}
            </dd>
          </div>
          <div className="rounded-2xl border border-paper/25 p-4">
            <dt className="font-bold text-lime">Solução recomendada</dt>
            <dd className="mt-1">{recommendedSolution.title}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card icon="search" title="Causas">
          <ul className="grid gap-4">
            {report.causes.map((cause, index) => (
              <li key={cause.id} className={index === 0 ? "" : "border-t border-line pt-4"}>
                <h4 className="font-bold">
                  {index === 0 ? "Causa principal: " : ""}
                  {cause.title}
                </h4>
                <ExplanationText explanation={cause.explanation} className="mt-1" />
              </li>
            ))}
          </ul>
        </Card>
        <Card icon="flask" title="Explicação científica">
          <ExplanationText explanation={report.scientificExplanation} />
        </Card>
      </div>

      <Card icon="leaf" title="Como a solução ajuda na eficiência energética">
        <p className="mb-2 font-bold">{recommendedSolution.title}</p>
        <p className="mb-3 text-ink-soft">{recommendedSolution.description}</p>
        <ExplanationText explanation={report.finalExplanation} />
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card icon="check-circle" title="Benefícios">
          <ExplanationList
            items={recommendedSolution.benefits}
            icon="check-circle"
            iconClass="text-ink"
            keyPrefix="beneficio"
          />
        </Card>
        <Card icon="minus-circle" title="Limitações">
          <ExplanationList
            items={recommendedSolution.limitations}
            icon="minus-circle"
            iconClass="text-ink-soft"
            keyPrefix="limitacao"
          />
        </Card>
      </div>

      {report.hasPendingContent ? <Notice tone="review">{PENDING_NOTICE}</Notice> : null}

      <Card icon="book" title="Fontes utilizadas">
        <ul className="grid gap-4">
          {report.sources.verified.map((source) => (
            <li key={source.id} data-source-id={source.id} className="border-l-4 border-ai pl-4">
              <p className="font-bold">{source.organization}</p>
              <p>
                <cite className="not-italic">{source.title}</cite>
              </p>
              <p className="text-sm text-ink-soft">
                <a href={source.url} className="break-all text-ai underline underline-offset-2">
                  {source.url}
                </a>
              </p>
              <p className="text-sm text-ink-soft">Acesso em {formatDate(source.accessedAt)}.</p>
            </li>
          ))}
        </ul>
        {report.sources.pending.length > 0 ? (
          <div className="mt-5">
            <h4 className="font-bold">Fontes ainda não conferidas</h4>
            <ul className="mt-2 grid gap-3">
              {report.sources.pending.map((source) => (
                <li key={source.id} data-source-id={source.id} className="border-l-4 border-review pl-4">
                  <p className="font-bold">{source.organization}</p>
                  <p>
                    <cite className="not-italic">{source.title}</cite> (pendente de verificação)
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <SourceLegend />

      <div className="flex flex-wrap gap-3">
        <Button onClick={actions.restart}>
          <Icon name="restart" />
          Começar de novo
        </Button>
        <Link href="/" className={buttonClasses("secondary")}>
          <Icon name="home" />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
