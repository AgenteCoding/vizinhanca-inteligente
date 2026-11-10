/**
 * Dados dos minigames, validados ao carregar (erro aparece no teste e no build).
 */
import type { GamesData } from "@/types/games";
import { knowledgeBase } from "../index";
import casa from "./casa-eficiente.json";
import detetive from "./detetive.json";
import escolha from "./escolha-inteligente.json";
import {
  checkGameSources,
  choiceRoundSchema,
  detectiveDataSchema,
  houseDataSchema,
  listGameExplanations,
} from "./schema";

const choiceRounds = choiceRoundSchema.array().parse(escolha);
const detective = detectiveDataSchema.parse(detetive);
const house = houseDataSchema.parse(casa);

const sourceProblems = checkGameSources(listGameExplanations(detective, house), knowledgeBase);
if (sourceProblems.length > 0) {
  throw new Error(`Dados dos minigames com fontes inválidas:\n${sourceProblems.join("\n")}`);
}

export const gamesData: GamesData = { choiceRounds, detective, house };
