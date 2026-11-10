/**
 * Contratos dos minigames. Os jogos reaproveitam as seis categorias da base de conhecimento
 * (`ProblemCategoryId`) e o formato de explicação com fonte e status (`Explanation`).
 * Pontuação é sempre "pontos do jogo", nunca economia real de energia ou dinheiro.
 */
import type { Challenge, Explanation, ProblemCategoryId } from "./knowledge";

// ---------------------------------------------------------------------------------------------
// Escolha Inteligente
// ---------------------------------------------------------------------------------------------

/** Rodada extra do Escolha Inteligente (as rodadas principais vêm dos desafios da base). */
export interface ChoiceRound {
  categoryId: ProblemCategoryId;
  challenge: Challenge;
}

// ---------------------------------------------------------------------------------------------
// Detetive do Desperdício
// ---------------------------------------------------------------------------------------------

/** Veredito de uma situação da casa: desperdício claro, situação normal ou depende do contexto. */
export type DetectiveVerdict = "desperdicio" | "normal" | "depende";

export interface DetectiveItem {
  id: string;
  /** O que o detetive vê (curto). */
  label: string;
  verdict: DetectiveVerdict;
  /** Categoria relacionada, quando houver (para recomendar a solução da base). */
  categoryId: ProblemCategoryId | null;
  explanation: Explanation;
  /** Recomendação prática para a casa (mostrada no resultado). */
  tip: string;
}

export interface DetectiveRoom {
  id: string;
  name: string;
  items: DetectiveItem[];
}

export interface DetectiveData {
  house: string;
  rooms: DetectiveRoom[];
}

// ---------------------------------------------------------------------------------------------
// Construa uma Casa Eficiente
// ---------------------------------------------------------------------------------------------

export interface HouseProblem {
  categoryId: ProblemCategoryId;
  /** Como o problema aparece nesta casa. */
  description: string;
}

/** Efeito de uma solução sobre uma categoria: resolve o problema ou só ajuda. */
export interface SolutionEffect {
  categoryId: ProblemCategoryId;
  level: "resolve" | "ajuda";
}

export interface HouseSolution {
  id: string;
  name: string;
  kind: "tecnologia" | "habito";
  description: string;
  effects: SolutionEffect[];
  benefit: Explanation;
  /** Condições e limitações: nenhuma solução é universal. */
  limitation: Explanation;
  /** Soluções que funcionam melhor junto com esta. */
  worksBestWith: string[];
  /** Explica a combinação (mostrado como ponto positivo ou como sugestão). */
  pairingNote: string;
}

export interface HouseData {
  house: string;
  maxSelections: number;
  problems: HouseProblem[];
  solutions: HouseSolution[];
}

export interface GamesData {
  choiceRounds: ChoiceRound[];
  detective: DetectiveData;
  house: HouseData;
}
