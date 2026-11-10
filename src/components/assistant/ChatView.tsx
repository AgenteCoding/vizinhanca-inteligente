import type { RefObject } from "react";
import type { AssistantActions } from "@/hooks/use-assistant";
import type { ConversationState } from "@/types/assistant";
import type { FlowActionType } from "@/types/engine";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Notice } from "../ui/Notice";
import { ThinkingIndicator } from "../ui/ThinkingIndicator";
import { AssistantMessage } from "./AssistantMessage";
import { Composer } from "./Composer";
import {
  COMPOSER_LOCKED_PLACEHOLDER,
  COMPOSER_PLACEHOLDER,
  CONVERSATION_TITLE,
  DEFAULT_PENDING_MESSAGE,
  NO_ACCOUNT_NOTE,
  PENDING_MESSAGES,
  PROVIDER_ERROR,
  REJECTION_MESSAGES,
  SUGGESTIONS_LABEL,
  VISITOR_LABELS,
  WELCOME_TEXT,
  WELCOME_TITLE,
} from "./messages";
import { SituationSuggestions, type SituationOption } from "./SituationSuggestions";

export interface ChatViewProps {
  conversation: ConversationState;
  allowedActions: FlowActionType[];
  situations: SituationOption[];
  actions: AssistantActions;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  lastHeadingRef?: RefObject<HTMLHeadingElement | null>;
}

function VisitorBubble({ text, pending = false }: { text: string; pending?: boolean }) {
  return (
    <div className="flex justify-end">
      <p
        className={`message-enter max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg bg-petrol px-4 py-2.5 text-ice shadow-[0_14px_28px_-18px_rgb(16_45_53/0.9)] ${pending ? "opacity-90" : ""}`}
      >
        <span className="sr-only">Você disse: </span>
        {text}
      </p>
    </div>
  );
}

/**
 * Tela da conversa (sem estado próprio): boas-vindas antes da primeira mensagem e, depois,
 * as falas com o campo de conversa no rodapé. Só exibe o que o assistente devolve.
 */
export function ChatView({
  conversation,
  allowedActions,
  situations,
  actions,
  textareaRef,
  lastHeadingRef,
}: ChatViewProps) {
  const { turns, status, pending, rejection } = conversation;
  const started = turns.length > 0 || status !== "idle";
  const canType = allowedActions.includes("SUBMIT_REPORT");
  const lastAssistantIndex = turns.findLastIndex((turn) => turn.role === "assistant");
  const composerError = rejection ? REJECTION_MESSAGES[rejection] : null;

  return (
    <div className={`mx-auto flex w-full max-w-3xl flex-col px-4 sm:px-6 ${started ? "min-h-[calc(100svh-4.5rem)]" : ""}`}>
      {started ? (
        <h1 className="pt-6 text-sm font-semibold uppercase tracking-[0.14em] text-petrol-soft">{CONVERSATION_TITLE}</h1>
      ) : (
        <div className="pt-10 text-center sm:pt-[8svh]">
          <h1 className="mx-auto max-w-2xl text-[1.7rem] font-semibold tracking-tight sm:text-[2.35rem]">{WELCOME_TITLE}</h1>
          <p className="mx-auto mt-3 max-w-xl text-petrol-soft">{WELCOME_TEXT}</p>
        </div>
      )}

      {started ? (
        <ol aria-label="Mensagens da conversa" className="grid flex-1 content-start gap-7 py-6">
          {turns.map((turn, index) => (
            <li key={turn.id} data-role={turn.role} className="scroll-mt-24">
              {turn.role === "visitor" ? (
                <VisitorBubble text={turn.text} />
              ) : (
                <AssistantMessage
                  id={`resposta-${turn.id}`}
                  content={turn.content}
                  active={index === lastAssistantIndex && status === "idle"}
                  actions={actions}
                  situations={situations}
                  headingRef={index === lastAssistantIndex ? lastHeadingRef : undefined}
                />
              )}
            </li>
          ))}
          {pending ? (
            <li>
              <div className="grid gap-4">
                {pending.text.trim() ? <VisitorBubble text={pending.text} pending /> : null}
                <div className="sm:pl-11">
                  <ThinkingIndicator detail={PENDING_MESSAGES[pending.action.type] ?? DEFAULT_PENDING_MESSAGE} />
                </div>
              </div>
            </li>
          ) : null}
          {status === "error" ? (
            <li>
              <Notice tone="wrong" role="alert">
                <p className="font-semibold">{PROVIDER_ERROR}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={actions.retry}>Tentar de novo</Button>
                  <Button variant="secondary" onClick={actions.restart}>
                    Novo diagnóstico
                  </Button>
                </div>
              </Notice>
            </li>
          ) : null}
        </ol>
      ) : null}

      <div className={started ? "sticky bottom-0 z-10 -mx-4 bg-gradient-to-t from-ice via-ice/85 to-transparent px-4 pb-3 pt-6 sm:-mx-6 sm:px-6" : "mt-8"}>
        <Composer
          onSubmit={actions.submitReport}
          placeholder={canType ? COMPOSER_PLACEHOLDER : COMPOSER_LOCKED_PLACEHOLDER}
          locked={!canType}
          pending={status === "pending"}
          error={composerError}
          textareaRef={textareaRef}
        />
        {started ? (
          <div className="mt-1 flex justify-end">
            <Button variant="secondary" onClick={actions.restart} className="min-h-12 px-4 text-sm">
              <Icon name="restart" className="size-4" />
              Novo diagnóstico
            </Button>
          </div>
        ) : (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-petrol-soft">
            <Icon name="lock" className="size-4" />
            {NO_ACCOUNT_NOTE}
          </p>
        )}
      </div>

      {started ? null : (
        <div className="mx-auto mt-9 w-full max-w-3xl pb-14">
          <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.14em] text-petrol-soft">{SUGGESTIONS_LABEL}</h2>
          <SituationSuggestions
            label={SUGGESTIONS_LABEL}
            options={situations}
            onSelect={(id, title) => void actions.selectSituation(id, VISITOR_LABELS.select(title))}
          />
        </div>
      )}
    </div>
  );
}
