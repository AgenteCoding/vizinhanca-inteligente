/**
 * Motor do fluxo de atendimento: máquina de estados pura das sete etapas
 * (relato → diagnóstico → causas → alternativas → desafio → avaliação → explicação final).
 *
 * TypeScript puro, sem React. `createFlowEngine(base)` devolve funções que recebem o estado e
 * uma ação e devolvem o próximo estado. Ação não permitida na etapa atual é recusada e o estado
 * volta igual (a mesma referência), o que torna o motor seguro para `useReducer`.
 */
import type {
  ConfirmedDiagnosis,
  FlowAction,
  FlowActionType,
  FlowRejectionReason,
  FlowState,
  FlowTransition,
  StepContent,
} from "@/types/engine";
import type { KnowledgeBase, ProblemCategory, ProblemCategoryId } from "@/types/knowledge";
import { createClassifier } from "./classifier";
import { buildFinalReport, evaluateAnswer } from "./evaluation";

/** Estado inicial: etapa de relato, sem nenhum dado do visitante anterior. */
export const INITIAL_FLOW_STATE: FlowState = { step: "relato" };

/** Ações aceitas em cada etapa. `RESTART` vale em todas. */
export function allowedActions(state: FlowState): FlowActionType[] {
  switch (state.step) {
    case "relato":
      return ["SUBMIT_REPORT", "SELECT_CATEGORY", "RESTART"];
    case "diagnostico":
      return state.diagnosis.status === "confirmed"
        ? ["ADVANCE", "SUBMIT_REPORT", "SELECT_CATEGORY", "RESTART"]
        : ["SUBMIT_REPORT", "SELECT_CATEGORY", "RESTART"];
    case "causas":
    case "alternativas":
    case "avaliacao":
      return ["ADVANCE", "RESTART"];
    case "desafio":
      return ["ANSWER_CHALLENGE", "RESTART"];
    case "explicacao-final":
      return ["RESTART"];
  }
}

export interface FlowEngine {
  initialState: FlowState;
  /** Aplica a ação e informa se ela foi aceita (e por que não, se recusada). */
  transition: (state: FlowState, action: FlowAction) => FlowTransition;
  /** Mesmo que `transition`, devolvendo só o estado: pronto para `useReducer`. */
  reducer: (state: FlowState, action: FlowAction) => FlowState;
  allowedActions: (state: FlowState) => FlowActionType[];
  /** Conteúdo da etapa atual, montado a partir da base. */
  content: (state: FlowState) => StepContent;
}

export function createFlowEngine(knowledgeBase: KnowledgeBase): FlowEngine {
  const classify = createClassifier(knowledgeBase.problems);
  const problemsById = new Map(knowledgeBase.problems.map((problem) => [problem.id, problem]));

  function problemOf(diagnosis: ConfirmedDiagnosis): ProblemCategory {
    const problem = problemsById.get(diagnosis.categoryId);
    // O diagnóstico só é confirmado com uma categoria existente; isto não deve acontecer.
    if (!problem) throw new Error(`Categoria inexistente: ${diagnosis.categoryId}`);
    return problem;
  }

  const reject = (state: FlowState, reason: FlowRejectionReason): FlowTransition => ({
    ok: false,
    state,
    reason,
  });
  const accept = (state: FlowState): FlowTransition => ({ ok: true, state });

  function submitReport(state: FlowState, text: string): FlowTransition {
    const classification = classify(text);
    if (classification.status === "empty") return reject(state, "empty-report");
    if (classification.status === "identified") {
      return accept({
        step: "diagnostico",
        diagnosis: {
          status: "confirmed",
          categoryId: classification.categoryId,
          method: "text",
          classification,
        },
      });
    }
    const candidates = "candidates" in classification ? classification.candidates : [];
    return accept({
      step: "diagnostico",
      diagnosis: { status: "needs-clarification", classification, candidates },
    });
  }

  function selectCategory(state: FlowState, categoryId: ProblemCategoryId): FlowTransition {
    if (!problemsById.has(categoryId)) return reject(state, "unknown-category");
    const classification =
      state.step === "diagnostico" ? state.diagnosis.classification : null;
    return accept({
      step: "diagnostico",
      diagnosis: { status: "confirmed", categoryId, method: "guided", classification },
    });
  }

  function transition(state: FlowState, action: FlowAction): FlowTransition {
    if (!allowedActions(state).includes(action.type)) {
      const reason =
        state.step === "diagnostico" && action.type === "ADVANCE"
          ? "diagnosis-not-confirmed"
          : "action-not-allowed";
      return reject(state, reason);
    }

    switch (action.type) {
      case "RESTART":
        return accept(INITIAL_FLOW_STATE);
      case "SUBMIT_REPORT":
        return submitReport(state, action.text);
      case "SELECT_CATEGORY":
        return selectCategory(state, action.categoryId);
      case "ANSWER_CHALLENGE": {
        if (state.step !== "desafio") return reject(state, "action-not-allowed");
        const evaluation = evaluateAnswer(problemOf(state.diagnosis).challenge, action.optionId);
        if (!evaluation) return reject(state, "unknown-option");
        return accept({ step: "avaliacao", diagnosis: state.diagnosis, evaluation });
      }
      case "ADVANCE":
        switch (state.step) {
          case "diagnostico":
            if (state.diagnosis.status !== "confirmed") {
              return reject(state, "diagnosis-not-confirmed");
            }
            return accept({ step: "causas", diagnosis: state.diagnosis });
          case "causas":
            return accept({ step: "alternativas", diagnosis: state.diagnosis });
          case "alternativas":
            return accept({ step: "desafio", diagnosis: state.diagnosis });
          case "avaliacao": {
            const report = buildFinalReport(
              problemOf(state.diagnosis),
              state.evaluation,
              knowledgeBase.sources,
            );
            if (!report) return reject(state, "action-not-allowed");
            return accept({
              step: "explicacao-final",
              diagnosis: state.diagnosis,
              evaluation: state.evaluation,
              report,
            });
          }
          default:
            return reject(state, "action-not-allowed");
        }
    }
  }

  function content(state: FlowState): StepContent {
    const summaryOf = (problem: ProblemCategory) => ({
      id: problem.id,
      title: problem.title,
      summary: problem.summary,
    });

    switch (state.step) {
      case "relato":
        return { step: "relato", options: knowledgeBase.problems.map(summaryOf) };
      case "diagnostico": {
        const { diagnosis } = state;
        const candidates: readonly ProblemCategoryId[] =
          diagnosis.status === "needs-clarification" ? diagnosis.candidates : [];
        const options = [
          ...candidates.flatMap((id) => {
            const problem = problemsById.get(id);
            return problem ? [{ id, title: problem.title, isCandidate: true }] : [];
          }),
          ...knowledgeBase.problems
            .filter((problem) => !candidates.includes(problem.id))
            .map((problem) => ({ id: problem.id, title: problem.title, isCandidate: false })),
        ];
        return {
          step: "diagnostico",
          diagnosis,
          problem: diagnosis.status === "confirmed" ? summaryOf(problemOf(diagnosis)) : null,
          options,
        };
      }
      case "causas": {
        const problem = problemOf(state.diagnosis);
        return {
          step: "causas",
          title: problem.title,
          causes: problem.causes,
          consequences: problem.consequences,
        };
      }
      case "alternativas": {
        const problem = problemOf(state.diagnosis);
        return {
          step: "alternativas",
          title: problem.title,
          alternatives: problem.alternatives.map((alternative) => ({
            ...alternative,
            isRecommended: alternative.id === problem.recommendedAlternativeId,
          })),
        };
      }
      case "desafio": {
        const { challenge } = problemOf(state.diagnosis);
        return {
          step: "desafio",
          question: challenge.question,
          options: challenge.options.map(({ id, text }) => ({ id, text })),
        };
      }
      case "avaliacao":
        return { step: "avaliacao", evaluation: state.evaluation };
      case "explicacao-final":
        return { step: "explicacao-final", report: state.report };
    }
  }

  return {
    initialState: INITIAL_FLOW_STATE,
    transition,
    reducer: (state, action) => transition(state, action).state,
    allowedActions,
    content,
  };
}
