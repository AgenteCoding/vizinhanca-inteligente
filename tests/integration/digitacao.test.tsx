/**
 * Digitação progressiva e respostas sem aparência de card.
 *
 * O ponto central: a animação é só uma camada de apresentação. O conteúdo é sempre renderizado
 * inteiro pelo React, então o HTML gerado (o mesmo que estes testes leem) traz todo o texto,
 * com ou sem animação. A revelação caractere por caractere roda depois, no navegador, e foi
 * conferida no Chrome (ver docs/TEST_PLAN.md).
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssistantMessage } from "@/components/assistant/AssistantMessage";
import { SKIP_TYPING_LABEL, TypedContent } from "@/components/assistant/TypedContent";
import { knowledgeBase } from "@/data";
import type { AssistantActions } from "@/hooks/use-assistant";
import { createDeterministicAssistant } from "@/lib/assistant/deterministic-assistant";
import type { FlowAction, FlowState, StepContent } from "@/types/engine";
import { PROBLEM_CATEGORY_IDS, type ProblemCategoryId } from "@/types/knowledge";

const service = createDeterministicAssistant(knowledgeBase);
const start = service.content(service.initialState());
const situations = start.step === "relato" ? start.options : [];
const actions: AssistantActions = {
  submitReport: async () => true,
  selectSituation: async () => true,
  advance: async () => true,
  answer: async () => true,
  restart: () => {},
  startSituation: async () => true,
  retry: () => {},
};

/** Conteúdo de todas as etapas de uma categoria, na ordem do diagnóstico. */
async function stepsOf(categoryId: ProblemCategoryId): Promise<StepContent[]> {
  const problem = knowledgeBase.problems.find((p) => p.id === categoryId);
  const wrong = problem?.challenge.options.find((o) => !o.isCorrect);
  if (!wrong) throw new Error(categoryId);
  const flow: FlowAction[] = [
    { type: "SELECT_CATEGORY", categoryId },
    { type: "ADVANCE" },
    { type: "ADVANCE" },
    { type: "ADVANCE" },
    { type: "ANSWER_CHALLENGE", optionId: wrong.id },
    { type: "ADVANCE" },
  ];
  let state: FlowState = service.initialState();
  const contents: StepContent[] = [];
  for (const action of flow) {
    const transition = await service.respond(state, action);
    if (!transition.ok) throw new Error(`${categoryId}: ${action.type}`);
    state = transition.state;
    contents.push(service.content(state));
  }
  return contents;
}

const render = (content: StepContent, active: boolean) =>
  renderToStaticMarkup(
    <AssistantMessage id="r" content={content} active={active} actions={actions} situations={situations} />,
  );

/** Só o texto, sem marcação. */
const textOf = (html: string) => html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("conteúdo preservado", () => {
  it.each([...PROBLEM_CATEGORY_IDS])("%s: todo o texto da base aparece inteiro em cada resposta", async (categoryId) => {
    const problem = knowledgeBase.problems.find((p) => p.id === categoryId);
    if (!problem) throw new Error(categoryId);
    const [diagnosis, causes, alternatives, challenge, evaluation, final] = (await stepsOf(categoryId)).map((c) =>
      render(c, true),
    );
    expect(diagnosis).toContain(escape(problem.title));
    expect(diagnosis).toContain(escape(problem.summary));
    for (const cause of problem.causes) {
      expect(causes).toContain(escape(cause.title));
      expect(causes).toContain(escape(cause.explanation.text));
    }
    for (const consequence of problem.consequences) expect(causes).toContain(escape(consequence.explanation.text));
    for (const alternative of problem.alternatives) {
      expect(alternatives).toContain(escape(alternative.title));
      expect(alternatives).toContain(escape(alternative.description));
      for (const item of [...alternative.benefits, ...alternative.limitations]) {
        expect(alternatives).toContain(escape(item.text));
      }
    }
    expect(challenge).toContain(escape(problem.challenge.question));
    for (const option of problem.challenge.options) expect(challenge).toContain(escape(option.text));
    const wrong = problem.challenge.options.find((o) => !o.isCorrect);
    const right = problem.challenge.options.find((o) => o.isCorrect);
    expect(evaluation).toContain(escape(wrong?.feedback ?? "?"));
    expect(evaluation).toContain(escape(right?.feedback ?? "?"));
    expect(final).toContain(escape(problem.scientificExplanation.text));
    expect(final).toContain(escape(problem.finalExplanation.text));
  });

  it("a resposta da vez e a resposta antiga têm exatamente o mesmo texto de leitura", async () => {
    // A única diferença permitida são os botões de continuar, que só a resposta da vez mostra.
    const [, causes] = await stepsOf("ar-condicionado-aberto");
    const current = textOf(render(causes, true));
    const past = textOf(render(causes, false));
    expect(current.startsWith(past)).toBe(true);
    expect(current.slice(past.length).trim()).toBe("Ver as soluções");
  });
});

describe("TypedContent", () => {
  it("renderiza os filhos inteiros, sem esconder nada no HTML", () => {
    const html = renderToStaticMarkup(
      <TypedContent animate>
        <p>
          Texto com <strong>negrito</strong> e uma lista:
        </p>
        <ul>
          <li>primeiro</li>
          <li>segundo</li>
        </ul>
      </TypedContent>,
    );
    expect(html).toContain("<p>Texto com <strong>negrito</strong> e uma lista:</p>");
    expect(html).toContain("<ul><li>primeiro</li><li>segundo</li></ul>");
    expect(html).not.toContain("data-typed");
    expect(html).not.toContain("inert");
    expect(html).not.toContain("aria-busy");
    expect(html).not.toContain(SKIP_TYPING_LABEL);
  });

  it("resposta antiga (animate=false) não monta o motor de digitação", () => {
    const fresh = renderToStaticMarkup(<TypedContent animate>oi</TypedContent>);
    const old = renderToStaticMarkup(<TypedContent animate={false}>oi</TypedContent>);
    expect(fresh).toContain('class="Typewriter hidden"');
    expect(fresh).toContain('aria-hidden="true"');
    expect(old).not.toContain("Typewriter");
  });

  it("texto com sinais de HTML continua sendo texto (nada é interpretado)", () => {
    const html = renderToStaticMarkup(<TypedContent animate>{"<img src=x onerror=alert(1)> & <b>não</b>"}</TypedContent>);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt; &amp; &lt;b&gt;não&lt;/b&gt;");
    expect(html).not.toContain("<img");
  });

  it("o código da digitação não usa HTML não confiável", () => {
    for (const file of ["TypedContent.tsx", "typed-reveal.ts"]) {
      const source = readFileSync(`src/components/assistant/${file}`, "utf8");
      expect(source, file).not.toMatch(/innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|document\.write/);
      expect(source, file).not.toContain("dangerouslySetInnerHTML={");
    }
    const component = readFileSync("src/components/assistant/TypedContent.tsx", "utf8");
    expect(component).toContain("parseHTML: false");
    expect(component).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
  });
});

describe("respostas sem aparência de card", () => {
  it("a moldura da resposta não tem fundo, borda nem sombra", async () => {
    const [diagnosis] = await stepsOf("solar-sem-geracao");
    const html = render(diagnosis, true);
    const article = html.match(/<article[^>]*class="([^"]*)"/)?.[1] ?? "";
    const column = html.match(/<article[^>]*>(?:<span[^>]*>[\s\S]*?<\/span>)?<div class="([^"]*)"/)?.[1] ?? "";
    // As duas classes precisam ter sido encontradas (o teste não pode passar por não achar nada).
    expect(article).toContain("message-enter");
    expect(column).toContain("flex-1");
    for (const classes of [article, column]) expect(classes).not.toMatch(/\b(bg-|border|shadow|rounded-)/);
  });

  it("os blocos de texto do diagnóstico, das causas e da avaliação não são caixas", async () => {
    const [diagnosis, causes, , , evaluation] = await stepsOf("ar-condicionado-aberto");
    const boxed = /class="[^"]*\bbg-surface\b[^"]*\bp-4\b/;
    expect(render(diagnosis, false)).not.toMatch(boxed);
    expect(render(causes, false)).not.toMatch(boxed);
    // A avaliação mantém só o aviso de acerto/erro (componente funcional), não caixas de texto.
    const evaluationHtml = render(evaluation, false);
    expect(evaluationHtml).not.toMatch(boxed);
    expect(evaluationHtml).toContain('data-result="incorrect"');
  });
});
