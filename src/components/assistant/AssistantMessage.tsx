import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { KEYWORD_WEIGHT_MAX, KEYWORD_WEIGHT_MIN } from "@/data/schema";
import type { AssistantActions } from "@/hooks/use-assistant";
import type { ClassificationResult, StepContent } from "@/types/engine";
import { FLOW_STEPS, type Explanation, type ProblemCategoryId } from "@/types/knowledge";
import { BrandMark } from "../ui/BrandMark";
import { Button, buttonClasses } from "../ui/Button";
import { CATEGORY_ICONS } from "../ui/category-icons";
import { Icon, type IconName } from "../ui/Icon";
import { Notice } from "../ui/Notice";
import { ChallengeStep } from "./ChallengeStep";
import { ExplanationText, SourceLegend } from "./ExplanationText";
import {
  ASSISTANT_INTROS,
  CLARIFICATION_MESSAGES,
  EVALUATION_MESSAGES,
  PENDING_NOTICE,
  STEP_LABELS,
  VISITOR_LABELS,
} from "./messages";
import { SituationSuggestions, type SituationOption } from "./SituationSuggestions";

type Of<S extends StepContent["step"]> = Extract<StepContent, { step: S }>;

interface BodyProps<S extends StepContent["step"]> {
  content: Of<S>;
  /** Só a última resposta mostra botões; as anteriores ficam como histórico. */
  active: boolean;
  actions: AssistantActions;
  situations: SituationOption[];
  /** Prefixo único para ids desta resposta. */
  idPrefix: string;
}

/** Lista de trechos explicativos com um ícone por item. */
function ExplanationList({ items, icon, keyPrefix }: { items: Explanation[]; icon: IconName; keyPrefix: string }) {
  return (
    <ul className="grid gap-2">
      {items.map((item, index) => (
        <li key={`${keyPrefix}-${index}`} className="flex gap-2">
          <Icon name={icon} className="mt-1 size-4" />
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

/** Como o classificador chegou ao resultado: palavras-chave, correções e pontos. */
function Reasoning({
  classification,
  titles,
  summary,
  open = false,
}: {
  classification: ClassificationResult;
  titles: Map<ProblemCategoryId, string>;
  summary: string;
  open?: boolean;
}) {
  const topScore = classification.scores[0]?.score ?? 1;
  return (
    <details open={open} className="group rounded-2xl border border-line bg-ice">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2 font-bold [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Icon name="scan" className="size-5" />
          {summary}
        </span>
        <Icon name="chevron" className="size-5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-3 px-4 pb-4">
        <p className="text-sm">
          Procurei no seu relato palavras-chave de cada situação, comparando as palavras sem acentos
          e no singular. Cada palavra-chave vale de {KEYWORD_WEIGHT_MIN} a {KEYWORD_WEIGHT_MAX} pontos.
        </p>
        <ul aria-label="Palavras-chave reconhecidas" className="flex flex-wrap gap-2">
          {classification.matchedTerms.map((match) => (
            <li key={match.term} className="rounded-full border border-petrol/30 bg-surface px-3 py-0.5 font-mono text-sm">
              {match.term}
            </li>
          ))}
        </ul>
        {classification.corrections.length > 0 ? (
          <p className="text-sm">
            Correção de digitação:{" "}
            {classification.corrections.map((c) => `${c.from} → ${c.to}`).join(", ")}.
          </p>
        ) : null}
        <ul className="grid gap-2">
          {classification.scores.map((score) => (
            <li key={score.categoryId}>
              <div className="flex justify-between gap-3 text-sm font-bold">
                <span>{titles.get(score.categoryId) ?? score.categoryId}</span>
                <span className="whitespace-nowrap">{score.score} pontos</span>
              </div>
              <div aria-hidden="true" className="mt-1 h-2 overflow-hidden rounded-full bg-ice-strong">
                <div
                  className="h-full rounded-full bg-petrol"
                  style={{ width: `${Math.max(6, (score.score / topScore) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------------------------
// Corpos das respostas, uma por etapa
// ---------------------------------------------------------------------------------------------

export function DiagnosisBody({ content, active, actions, situations }: BodyProps<"diagnostico">) {
  const { diagnosis, problem, options } = content;
  const titles = new Map(options.map((option) => [option.id, option.title]));

  if (diagnosis.status === "needs-clarification") {
    const { classification } = diagnosis;
    const status = classification.status === "identified" ? "low-confidence" : classification.status;
    return (
      <div className="grid gap-4" data-diagnosis="needs-clarification">
        <p className="font-bold">{CLARIFICATION_MESSAGES[status]}</p>
        {classification.matchedTerms.length > 0 ? (
          <Reasoning classification={classification} titles={titles} summary="O que encontrei no seu relato" />
        ) : null}
        {active ? (
          <>
            <SituationSuggestions
              label="Escolha a situação"
              options={options}
              onSelect={(id, title) => void actions.selectSituation(id, VISITOR_LABELS.select(title))}
            />
            <p className="text-sm text-petrol-soft">Ou escreva de outro jeito na caixa de conversa.</p>
          </>
        ) : null}
      </div>
    );
  }

  if (!problem) return null;
  const fromText =
    diagnosis.method === "text" &&
    diagnosis.classification !== null &&
    diagnosis.classification.matchedTerms.length > 0;

  return (
    <div className="grid gap-4" data-diagnosis="confirmed" data-category={problem.id}>
      <p>{diagnosis.method === "text" ? ASSISTANT_INTROS.identified : ASSISTANT_INTROS.chosen}</p>
      <div className="flex items-start gap-3 rounded-2xl border-2 border-petrol bg-surface p-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime">
          <Icon name={CATEGORY_ICONS[problem.id]} />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-snug">{problem.title}</p>
          <p className="mt-1 text-petrol-soft">{problem.summary}</p>
        </div>
      </div>
      {fromText && diagnosis.classification ? (
        <Reasoning
          classification={diagnosis.classification}
          titles={titles}
          summary="Como cheguei a esse diagnóstico"
        />
      ) : null}
      {active ? (
        <div className="grid gap-3">
          <div>
            <Button onClick={() => void actions.advance(VISITOR_LABELS.toCauses)}>Ver as causas</Button>
          </div>
          <details className="group rounded-2xl border border-line">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2 font-bold [&::-webkit-details-marker]:hidden">
              Não é isso? Escolher outra situação
              <Icon name="chevron" className="size-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3">
              <SituationSuggestions
                label="Escolha a situação certa"
                options={situations}
                onSelect={(id, title) => void actions.selectSituation(id, VISITOR_LABELS.reselect(title))}
              />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}

export function CausesBody({ content, active, actions }: BodyProps<"causas">) {
  const [mainCause, ...otherCauses] = content.causes;
  return (
    <div className="grid gap-4">
      <p>{ASSISTANT_INTROS.causes}</p>
      {mainCause ? (
        <div className="rounded-2xl border-2 border-petrol bg-surface p-4">
          <p className="text-sm font-bold text-petrol-soft">Causa principal</p>
          <p className="font-extrabold">{mainCause.title}</p>
          <ExplanationText explanation={mainCause.explanation} className="mt-1" />
        </div>
      ) : null}
      {otherCauses.length > 0 ? (
        <div>
          <h4 className="font-bold">Outras causas</h4>
          <ul className="mt-2 grid gap-3">
            {otherCauses.map((cause) => (
              <li key={cause.id}>
                <p className="font-bold">{cause.title}</p>
                <ExplanationText explanation={cause.explanation} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <h4 className="font-bold">O que esse desperdício provoca</h4>
        <ul className="mt-2 grid gap-3">
          {content.consequences.map((consequence) => (
            <li key={consequence.id}>
              <p className="font-bold">{consequence.title}</p>
              <ExplanationText explanation={consequence.explanation} />
            </li>
          ))}
        </ul>
      </div>
      {active ? (
        <div>
          <Button onClick={() => void actions.advance(VISITOR_LABELS.toAlternatives)}>Ver as soluções</Button>
        </div>
      ) : null}
    </div>
  );
}

export function AlternativesBody({ content, active, actions }: BodyProps<"alternativas">) {
  return (
    <div className="grid gap-3">
      <p>{ASSISTANT_INTROS.alternatives}</p>
      <ul className="grid gap-2">
        {content.alternatives.map((alternative) => (
          <li key={alternative.id}>
            <details
              open={alternative.isRecommended}
              data-alternative-id={alternative.id}
              data-recommended={alternative.isRecommended ? "true" : "false"}
              className={`group rounded-2xl border bg-surface ${alternative.isRecommended ? "border-2 border-petrol" : "border-line"}`}
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  {alternative.isRecommended ? (
                    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 text-sm font-bold">
                      <Icon name="star" className="size-4" />
                      Solução recomendada
                    </span>
                  ) : null}
                  <span className="block font-extrabold leading-snug">{alternative.title}</span>
                </span>
                <Icon name="chevron" className="size-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid gap-4 px-4 pb-4">
                <p className="text-petrol-soft">{alternative.description}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-bold">Vantagens</h4>
                    <ExplanationList items={alternative.benefits} icon="check-circle" keyPrefix={`${alternative.id}-v`} />
                  </div>
                  <div>
                    <h4 className="mb-2 font-bold">Limitações</h4>
                    <ExplanationList items={alternative.limitations} icon="minus-circle" keyPrefix={`${alternative.id}-l`} />
                  </div>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
      <SourceLegend />
      {active ? (
        <div>
          <Button onClick={() => void actions.advance(VISITOR_LABELS.toChallenge)}>Ir para o desafio</Button>
        </div>
      ) : null}
    </div>
  );
}

export function ChallengeBody({ content, active, actions, idPrefix }: BodyProps<"desafio">) {
  const questionId = `${idPrefix}-pergunta`;
  return (
    <div className="grid gap-3">
      <p>{ASSISTANT_INTROS.challenge}</p>
      <p id={questionId} className="rounded-2xl bg-petrol p-4 text-lg font-bold leading-snug text-ice">
        {content.question}
      </p>
      {active ? (
        <ChallengeStep
          content={content}
          questionId={questionId}
          onAnswer={(optionId, text) => void actions.answer(optionId, VISITOR_LABELS.answer(text))}
        />
      ) : (
        <ul className="grid gap-1 text-petrol-soft">
          {content.options.map((option) => (
            <li key={option.id}>{option.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EvaluationBody({ content, active, actions }: BodyProps<"avaliacao">) {
  const { evaluation } = content;
  const correct = evaluation.isCorrect;
  return (
    <div className="grid gap-3">
      <div
        role="status"
        data-result={correct ? "correct" : "incorrect"}
        className={`flex items-start gap-3 rounded-2xl border-2 p-4 ${correct ? "border-petrol bg-lime" : "border-wrong bg-wrong-soft"}`}
      >
        <Icon
          name={correct ? "check-circle" : "x-circle"}
          className={`size-8 ${correct ? "text-petrol" : "text-wrong"}`}
        />
        <div>
          <p className="text-xl font-extrabold leading-tight">
            {correct ? EVALUATION_MESSAGES.correctTitle : EVALUATION_MESSAGES.incorrectTitle}
          </p>
          <p className="mt-1">{correct ? EVALUATION_MESSAGES.correctText : EVALUATION_MESSAGES.incorrectText}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-petrol-soft">
          <Icon name="user" className="size-4" />
          Sua escolha
        </p>
        <p className="mt-1 font-bold leading-snug">{evaluation.selectedOptionText}</p>
        <p className="mt-1">{evaluation.selectedFeedback}</p>
      </div>
      {correct ? null : (
        <div className="rounded-2xl border-2 border-petrol bg-surface p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-petrol-soft">
            <Icon name="star" className="size-4" />A opção mais adequada
          </p>
          <p className="mt-1 font-bold leading-snug">{evaluation.correctOptionText}</p>
          <p className="mt-1">{evaluation.correctFeedback}</p>
        </div>
      )}
      {active ? (
        <div>
          <Button onClick={() => void actions.advance(VISITOR_LABELS.toFinal)}>Ver a explicação final</Button>
        </div>
      ) : null}
    </div>
  );
}

export function FinalBody({ content, active, actions }: BodyProps<"explicacao-final">) {
  const { report } = content;
  const { evaluation, problem, recommendedSolution } = report;
  return (
    <div className="grid gap-4">
      <section aria-label="Resumo" className="on-dark rounded-2xl bg-petrol p-5 text-ice">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lime text-petrol">
            <Icon name={CATEGORY_ICONS[problem.id]} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-lime">Problema identificado</p>
            <p className="text-xl font-extrabold leading-snug">{problem.title}</p>
          </div>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ice/20 p-3">
            <dt className="text-sm font-bold text-lime">Sua escolha</dt>
            <dd className="mt-1 text-sm">{evaluation.selectedOptionText}</dd>
          </div>
          <div className="rounded-xl border border-ice/20 p-3">
            <dt className="text-sm font-bold text-lime">Resultado</dt>
            <dd className="mt-1 flex items-start gap-1.5 text-sm font-bold">
              <Icon name={evaluation.isCorrect ? "check-circle" : "x-circle"} className="mt-0.5 size-4" />
              {evaluation.isCorrect ? "Escolha adequada" : "Não era a escolha mais adequada"}
            </dd>
          </div>
          <div className="rounded-xl border border-ice/20 p-3">
            <dt className="text-sm font-bold text-lime">Solução recomendada</dt>
            <dd className="mt-1 text-sm">{recommendedSolution.title}</dd>
          </div>
        </dl>
      </section>

      <FinalSection icon="search" title="Causas">
        <ul className="grid gap-2">
          {report.causes.map((cause, index) => (
            <li key={cause.id}>
              <p className="font-bold">
                {index === 0 ? "Causa principal: " : ""}
                {cause.title}
              </p>
              <ExplanationText explanation={cause.explanation} />
            </li>
          ))}
        </ul>
      </FinalSection>
      <FinalSection icon="flask" title="Explicação científica">
        <ExplanationText explanation={report.scientificExplanation} />
      </FinalSection>
      <FinalSection icon="leaf" title="Como a solução ajuda na eficiência energética">
        <p className="font-bold">{recommendedSolution.title}</p>
        <p className="mb-2 text-petrol-soft">{recommendedSolution.description}</p>
        <ExplanationText explanation={report.finalExplanation} />
      </FinalSection>
      <div className="grid gap-4 sm:grid-cols-2">
        <FinalSection icon="check-circle" title="Benefícios">
          <ExplanationList items={recommendedSolution.benefits} icon="check-circle" keyPrefix="beneficio" />
        </FinalSection>
        <FinalSection icon="minus-circle" title="Limitações">
          <ExplanationList items={recommendedSolution.limitations} icon="minus-circle" keyPrefix="limitacao" />
        </FinalSection>
      </div>
      {report.hasPendingContent ? <Notice tone="review">{PENDING_NOTICE}</Notice> : null}
      <FinalSection icon="book" title="Fontes utilizadas">
        <ul className="grid gap-3">
          {report.sources.verified.map((source) => (
            <li key={source.id} data-source-id={source.id} className="border-l-2 border-petrol pl-3 text-sm">
              <p className="font-bold">{source.organization}</p>
              <p>
                <cite className="not-italic">{source.title}</cite>
              </p>
              <a href={source.url} className="break-all text-petrol underline underline-offset-2">
                {source.url}
              </a>
              <p className="text-petrol-soft">Acesso em {formatDate(source.accessedAt)}.</p>
            </li>
          ))}
        </ul>
        {report.sources.pending.length > 0 ? (
          <div className="mt-3">
            <h5 className="font-bold">Fontes ainda não conferidas</h5>
            <ul className="mt-1 grid gap-2">
              {report.sources.pending.map((source) => (
                <li key={source.id} data-source-id={source.id} className="border-l-2 border-dashed border-petrol pl-3 text-sm">
                  {source.organization}: <cite className="not-italic">{source.title}</cite> (pendente de verificação)
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </FinalSection>
      <SourceLegend />
      {active ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="accent" onClick={actions.restart}>
            <Icon name="restart" className="size-5" />
            Novo diagnóstico
          </Button>
          <Link href="/#minigames" className={buttonClasses("secondary")}>
            <Icon name="gamepad" className="size-5" />
            Conhecer os minigames
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function FinalSection({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h4 className="mb-2 flex items-center gap-2 font-bold">
        <Icon name={icon} className="size-5" />
        {title}
      </h4>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// Moldura da resposta
// ---------------------------------------------------------------------------------------------

/** Uma resposta do assistente na conversa, com a etapa indicada (ex.: "Etapa 3 de 7: Causas"). */
export function AssistantMessage({
  content,
  active,
  actions,
  situations,
  id,
  headingRef,
}: {
  content: StepContent;
  active: boolean;
  actions: AssistantActions;
  situations: SituationOption[];
  id: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}) {
  const stepNumber = FLOW_STEPS.indexOf(content.step) + 1;
  const final = content.step === "explicacao-final";
  return (
    <article aria-labelledby={`${id}-titulo`} className="message-enter flex scroll-mt-28 gap-3" data-step={content.step}>
      <BrandMark className="mt-1 hidden size-8 shrink-0 sm:block" />
      <div className={`min-w-0 flex-1 rounded-3xl rounded-tl-md border bg-surface p-4 sm:p-5 ${final ? "border-petrol" : "border-line"}`}>
        <h3 id={`${id}-titulo`} ref={headingRef} tabIndex={-1} className="mb-3 text-sm font-bold text-petrol-soft">
          <span className="sr-only">Resposta do assistente. </span>
          Etapa {stepNumber} de {FLOW_STEPS.length}: {STEP_LABELS[content.step]}
        </h3>
        {content.step === "diagnostico" ? (
          <DiagnosisBody content={content} active={active} actions={actions} situations={situations} idPrefix={id} />
        ) : null}
        {content.step === "causas" ? (
          <CausesBody content={content} active={active} actions={actions} situations={situations} idPrefix={id} />
        ) : null}
        {content.step === "alternativas" ? (
          <AlternativesBody content={content} active={active} actions={actions} situations={situations} idPrefix={id} />
        ) : null}
        {content.step === "desafio" ? (
          <ChallengeBody content={content} active={active} actions={actions} situations={situations} idPrefix={id} />
        ) : null}
        {content.step === "avaliacao" ? (
          <EvaluationBody content={content} active={active} actions={actions} situations={situations} idPrefix={id} />
        ) : null}
        {final ? (
          <FinalBody content={content} active={active} actions={actions} situations={situations} idPrefix={id} />
        ) : null}
      </div>
    </article>
  );
}
