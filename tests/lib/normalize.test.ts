import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import {
  isWithinOneEdit,
  normalizeTerm,
  normalizeText,
  toSingular,
  tokenize,
} from "@/lib/normalize";

describe("normalizeText", () => {
  it("passa para minúsculas e remove acentos", () => {
    expect(normalizeText("ILUMINAÇÃO Pública")).toBe("iluminacao publica");
    expect(normalizeText("lâmpada")).toBe(normalizeText("lampada"));
  });

  it("troca pontuação e hífen por espaço e junta espaços repetidos", () => {
    expect(normalizeText("  Ar-condicionado,   ligado!!! ")).toBe("ar condicionado ligado");
  });

  it("preserva números, que podem ser parte do relato", () => {
    expect(normalizeText("Às 10h da manhã")).toBe("as 10h da manha");
  });

  it("trata HTML como texto comum, sem executar nada", () => {
    expect(normalizeText("<script>alert('x')</script> luz")).toBe("script alert x script luz");
  });

  it("devolve string vazia para texto só com espaços ou símbolos", () => {
    expect(normalizeText("   ")).toBe("");
    expect(normalizeText("?!...")).toBe("");
  });

  it("não altera o texto original", () => {
    const original = "Lâmpadas ACESAS!";
    normalizeText(original);
    expect(original).toBe("Lâmpadas ACESAS!");
  });
});

describe("toSingular", () => {
  it.each([
    ["lampadas", "lampada"],
    ["postes", "poste"],
    ["acesos", "aceso"],
    ["luzes", "luz"],
    ["solares", "solar"],
    ["paineis", "painel"],
    ["botoes", "botao"],
    ["sinais", "sinal"],
    ["nuvens", "nuvem"],
  ])("%s → %s", (plural, singular) => {
    expect(toSingular(plural)).toBe(singular);
  });

  it("não mexe em palavras curtas nem em palavras que já estão no singular", () => {
    for (const word of ["sol", "gas", "luz", "poste", "janela", "mais", "onibus"]) {
      expect(toSingular(word)).toBe(word);
    }
  });
});

describe("tokenize", () => {
  it("normaliza e coloca cada palavra no singular", () => {
    expect(tokenize("Os POSTES ficam acesos!")).toEqual(["os", "poste", "ficam", "aceso"]);
  });

  it("devolve lista vazia para texto vazio", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("isWithinOneEdit", () => {
  it.each([
    ["geladera", "geladeira"], // letra a menos
    ["chuveiroo", "chuveiro"], // letra a mais
    ["jaenla", "janela"], // letras vizinhas invertidas
    ["asesa", "acesa"], // letra trocada
  ])("%s ~ %s", (a, b) => {
    expect(isWithinOneEdit(a, b)).toBe(true);
  });

  it("rejeita palavras com mais de uma diferença", () => {
    expect(isWithinOneEdit("geladeira", "gelada")).toBe(false);
    expect(isWithinOneEdit("quarto", "quando")).toBe(false);
  });
});

describe("palavras-chave da base", () => {
  it("toda palavra-chave já está na forma normalizada e no singular", () => {
    for (const problem of knowledgeBase.problems) {
      for (const { term } of problem.keywords) {
        expect(normalizeTerm(term), `${problem.id}: ${term}`).toBe(term);
      }
    }
  });
});
