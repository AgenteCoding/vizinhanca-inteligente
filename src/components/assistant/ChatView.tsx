import type { RefObject } from "react";
import type { AssistantActions } from "@/hooks/use-assistant";
import type { ConversationState } from "@/types/assistant";
import type { FlowActionType } from "@/types/engine";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Notice } from "../ui/Notice";
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

/** "Digitando": aparece enquanto o assistente prepara a resposta. */
function TypingIndicator({ message }: { message: string }) {
  return (
    <div role="status" className="flex items-center gap-3 pl-11">
      <span aria-hidden="true" className="flex gap-1">
        <span className="typing-dot size-2 rounded-full bg-petrol" />
        <span className="typing-dot size-2 rounded-full bg-petrol" />
        <span className="typing-dot size-2 rounded-full bg-petrol" />
      </span>
      <span className="text-sm font-bold text-petrol-soft">{message}</span>
    </div>
  );
}

function VisitorBubble({ text, pending = false }: { text: string; pending?: boolean }) {
  return (
    <div className="flex justify-end">
      <p
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-tr-md bg-petrol px-4 py-2.5 text-ice ${pending ? "opacity-80" : ""}`}
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
        <h1 className="pt-6 text-xl font-extrabold tracking-tight">{CONVERSATION_TITLE}</h1>
      ) : (
        <div className="pt-10 text-center sm:pt-[9svh]">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{WELCOME_TITLE}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-petrol-soft">{WELCOME_TEXT}</p>
        </div>
      )}

      {started ? (
        <ol aria-label="Mensagens da conversa" className="grid flex-1 content-start gap-5 py-6">
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
                <TypingIndicator message={PENDING_MESSAGES[pending.action.type] ?? DEFAULT_PENDING_MESSAGE} />
              </div>
            </li>
          ) : null}
          {status === "error" ? (
            <li>
              <Notice tone="wrong" role="alert">
                <p className="font-bold">{PROVIDER_ERROR}</p>
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

      <div className={started ? "sticky bottom-0 z-10 -mx-4 bg-ice/95 px-4 pb-4 pt-2 backdrop-blur-sm sm:-mx-6 sm:px-6" : "mt-10"}>
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
        <div className="mx-auto mt-8 w-full max-w-3xl pb-16">
          <h2 className="mb-3 text-center text-sm font-bold text-petrol-soft">{SUGGESTIONS_LABEL}</h2>
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
