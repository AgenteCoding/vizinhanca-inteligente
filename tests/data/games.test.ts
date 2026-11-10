import { describe, expect, it } from "vitest";
import { knowledgeBase } from "@/data";
import { gamesData } from "@/data/games";
import { checkGameSources, houseDataSchema, listGameExplanations } from "@/data/games/schema";
import { PROBLEM_CATEGORY_IDS } from "@/types/knowledge";

const { choiceRounds, detective, house } = gamesData;
const allText = JSON.stringify(gamesData);

describe("dados dos minigames", () => {
  it("rodadas extras cobrem as seis categorias, cada uma com três opções e uma correta", () => {
    expect(new Set(choiceRounds.map((r) => r.categoryId))).toEqual(new Set(PROBLEM_CATEGORY_IDS));
    for (const round of choiceRounds) {
      expect(round.challenge.options).toHaveLength(3);
      expect(round.challenge.options.filter((o) => o.isCorrect)).toHaveLength(1);
    }
  });

  it("a posição da opção correta varia entre as rodadas", () => {
    const positions = new Set(choiceRounds.map((r) => r.challenge.options.findIndex((o) => o.isCorrect)));
    expect(positions.size).toBeGreaterThan(1);
  });

  it("ids de desafios não repetem os da base", () => {
    const ids = [...knowledgeBase.problems.map((p) => p.challenge.id), ...choiceRounds.map((r) => r.challenge.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("o detetive tem os quatro cômodos e os três tipos de veredito", () => {
    expect(detective.rooms.map((r) => r.id)).toEqual(["sala", "cozinha", "quarto", "area-externa"]);
    const verdicts = new Set(detective.rooms.flatMap((r) => r.items.map((i) => i.verdict)));
    expect(verdicts).toEqual(new Set(["desperdicio", "normal", "depende"]));
    const ids = detective.rooms.flatMap((r) => r.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("a casa tem um problema por categoria e soluções de tecnologia e de hábito", () => {
    expect(house.problems.map((p) => p.categoryId).sort()).toEqual([...PROBLEM_CATEGORY_IDS].sort());
    expect(new Set(house.solutions.map((s) => s.kind))).toEqual(new Set(["tecnologia", "habito"]));
    for (const id of PROBLEM_CATEGORY_IDS) {
      expect(house.solutions.some((s) => s.effects.some((e) => e.categoryId === id && e.level === "resolve"))).toBe(true);
    }
  });

  it("as soluções pedidas estão presentes", () => {
    const ids = house.solutions.map((s) => s.id);
    for (const id of [
      "lampadas-led",
      "sensores-presenca",
      "iluminacao-automatizada",
      "paineis-solares",
      "eletrodomesticos-eficientes",
      "uso-consciente-ar",
      "monitoramento-consumo",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("toda explicação verificada aponta para fontes existentes; pendentes ficam sem fonte obrigatória", () => {
    expect(checkGameSources(listGameExplanations(detective, house), knowledgeBase)).toEqual([]);
  });

  it("nenhum número de economia, percentual ou valor em dinheiro nos dados", () => {
    expect(allText).not.toMatch(/\d+\s?%|R\$|kWh/);
  });

  it("o esquema rejeita parceria com solução inexistente", () => {
    const broken = structuredClone(house);
    broken.solutions[0].worksBestWith = ["nao-existe"];
    broken.solutions[0].pairingNote = "x";
    expect(houseDataSchema.safeParse(broken).success).toBe(false);
  });

  it("o esquema rejeita ids repetidos", () => {
    const broken = structuredClone(house);
    broken.solutions[1].id = broken.solutions[0].id;
    expect(houseDataSchema.safeParse(broken).success).toBe(false);
  });
});
