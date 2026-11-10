/**
 * Aplica na página a revelação progressiva de uma resposta JÁ renderizada pelo React.
 *
 * Nada do conteúdo é recriado: o React continua dono de cada elemento e de cada texto. Este
 * módulo só (1) esconde temporariamente os elementos com um atributo `data-typed="wait"`,
 * (2) esvazia temporariamente os trechos de texto e os devolve caractere por caractere, sempre
 * a partir do valor original guardado, e (3) marca onde fica o cursor. Ao terminar (ou se algo
 * der errado), tudo volta exatamente ao que o React renderizou.
 *
 * Não usa `innerHTML` nem cria nós: só muda `nodeValue` de textos existentes e atributos
 * `data-*` que o React não controla.
 */
import { createRevealSequence, type RevealUpdate } from "@/lib/typing/reveal-sequence";

const WAIT_ATTRIBUTE = "data-typed";
const CARET_ATTRIBUTE = "data-typed-caret";

/** Partes que não entram na digitação: ficam como estão (texto só para leitor de tela etc.). */
const UNTOUCHED = ".sr-only, [hidden], [data-typed-skip]";

type Entry =
  | { kind: "element"; element: Element }
  | { kind: "text"; node: Text; full: string; written: string; released: boolean };

function isRendered(element: Element): boolean {
  return window.getComputedStyle(element).display !== "none";
}

/** Lista elementos e textos visíveis, na ordem de leitura. Precisa rodar antes de esconder algo. */
function collect(parent: Element, entries: Entry[]): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const full = child.nodeValue ?? "";
      if (full.trim().length > 0) {
        entries.push({ kind: "text", node: child as Text, full, written: full, released: false });
      }
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const element = child as Element;
    if (element.matches(UNTOUCHED) || !isRendered(element)) continue;
    entries.push({ kind: "element", element });
    // Desenhos (SVG) aparecem inteiros; não há texto para digitar dentro deles.
    if (element instanceof SVGElement) continue;
    if (element instanceof HTMLDetailsElement && !element.open) {
      // Sanfona fechada: só o título está na tela. O conteúdo fechado fica intacto.
      for (const part of Array.from(element.children)) {
        if (part.tagName === "SUMMARY" && isRendered(part)) {
          entries.push({ kind: "element", element: part });
          collect(part, entries);
        }
      }
      continue;
    }
    collect(element, entries);
  }
}

export interface TypedReveal {
  /** Texto visível da resposta, na ordem de leitura (é o que a digitação percorre). */
  readonly text: string;
  readonly characters: number;
  /** Avança a digitação em `characters` caracteres. */
  advance(characters: number): void;
  /** Mostra tudo e devolve a resposta ao estado original. Pode ser chamado mais de uma vez. */
  finish(): void;
}

/**
 * Prepara a revelação de `root`: esconde o que ainda não foi "digitado" e devolve o controle.
 * Devolve `null` quando não há texto visível (nada a animar; nada é alterado).
 */
export function prepareTypedReveal(root: HTMLElement): TypedReveal | null {
  const entries: Entry[] = [];
  collect(root, entries);
  const sequence = createRevealSequence(entries.map((entry) => (entry.kind === "text" ? entry.full.length : null)));
  if (sequence.total === 0) return null;

  let caretHost: Element | null = null;
  let finished = false;

  const setCaret = (host: Element | null) => {
    if (host === caretHost) return;
    caretHost?.removeAttribute(CARET_ATTRIBUTE);
    host?.setAttribute(CARET_ATTRIBUTE, "");
    caretHost = host;
  };

  const write = (entry: Extract<Entry, { kind: "text" }>, value: string) => {
    // Se o React mudou este texto no meio do caminho, o texto novo é dele: não mexemos mais.
    if (entry.released || entry.node.nodeValue !== entry.written) {
      entry.released = true;
      return;
    }
    entry.node.nodeValue = value;
    entry.written = value;
  };

  const apply = (update: RevealUpdate) => {
    for (const index of update.shown) {
      const entry = entries[index];
      if (entry?.kind === "element") entry.element.removeAttribute(WAIT_ATTRIBUTE);
    }
    for (const { index, visible } of update.texts) {
      const entry = entries[index];
      if (entry?.kind === "text") write(entry, entry.full.slice(0, visible));
    }
    const caretEntry = update.caret === null ? null : entries[update.caret];
    setCaret(caretEntry?.kind === "text" ? caretEntry.node.parentElement : null);
  };

  // Estado inicial: tudo escondido, textos vazios. Roda antes da primeira pintura.
  for (const entry of entries) {
    if (entry.kind === "element") entry.element.setAttribute(WAIT_ATTRIBUTE, "wait");
    else write(entry, "");
  }
  apply(sequence.begin());

  return {
    text: entries.map((entry) => (entry.kind === "text" ? entry.full : "")).join(""),
    characters: sequence.total,
    advance(characters) {
      if (!finished) apply(sequence.advance(characters));
    },
    finish() {
      if (finished) return;
      finished = true;
      apply(sequence.finish());
      // Garantia final: nenhum elemento escondido, nenhum texto pela metade, nenhum cursor.
      for (const entry of entries) {
        if (entry.kind === "element") entry.element.removeAttribute(WAIT_ATTRIBUTE);
        else write(entry, entry.full);
      }
      setCaret(null);
    },
  };
}
