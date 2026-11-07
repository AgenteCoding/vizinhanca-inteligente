/**
 * Ponto de entrada da base de conhecimento.
 *
 * Carrega os JSON, valida com os esquemas Zod e exporta os dados já tipados. A validação roda
 * uma única vez, quando o módulo é carregado: se o conteúdo estiver errado, os testes e o
 * `next build` falham antes de qualquer visitante ver a página.
 */
import type { KnowledgeBase } from "@/types/knowledge";
import problems from "./problems.json";
import { knowledgeBaseSchema } from "./schema";
import sources from "./sources.json";

export const knowledgeBase: KnowledgeBase = knowledgeBaseSchema.parse({ sources, problems });
