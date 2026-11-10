# Plano de desenvolvimento — até 10/11/2026

Prioridades: **P0** = obrigatório para a feira; **P1** = importante; **P2** = se sobrar tempo.

**Linha de corte:** o fluxo principal completo e o minigame Escolha Inteligente são P0. Detetive e
Casa Eficiente entram na etapa 4; se atrasarem, ficam na versão simples (lista de botões em vez
de ilustração interativa).

## Etapa 1 — Fundação (06–07/11) ✅ concluída

| Entrega | Prior. |
|---|---|
| Projeto Next.js + TypeScript + Tailwind + ESLint com export estático | P0 |
| Vitest configurado e scripts `typecheck`, `lint`, `test`, `build`, `validate` | P0 |
| Contratos de dados (`src/types/knowledge.ts`) | P0 |
| CLAUDE.md, README e documentação em `docs/` | P0 |
| Git iniciado com primeiro commit | P0 |

## Etapa 2 — Núcleo inteligente (07–09/11) ✅ concluída (GitHub e Vercel pendentes)

| Entrega | Prior. |
|---|---|
| Zod + `src/data/schema.ts` e `index.ts` | P0 |
| `problems.json` com as seis categorias (conteúdo provisório marcado como `pending`) e `sources.json` | P0 |
| `lib/normalize.ts` e `lib/classifier.ts` com testes (≥ 10 frases por categoria, ambíguas, inválidas) | P0 |
| `lib/flow-engine.ts` (máquina de estados) com testes | P0 |
| Fluxo navegável sem estilo, ligado ao motor por `useReducer` | P0 |
| Repositório no GitHub e primeiro deploy na Vercel | P1 |

## Etapa 3 — Interface e conteúdo (08–09/11, em andamento)

| Entrega | Prior. |
|---|---|
| Direção visual (cores, tipografia, componentes `ui/`) ✅ | P0 |
| Telas do fluxo com acessibilidade (foco, `aria-live`, toque, contraste) ✅ | P0 |
| Seis situações na página inicial (mapa ilustrado + cartões com ícone) ✅ | P0 |
| Minigame Escolha Inteligente | P0 |
| Conteúdo científico preenchido com fontes oficiais | P0 |
| Revisão de código da etapa | P1 |

## Etapa 4 — Minigames e entrega (09/11)

| Entrega | Prior. |
|---|---|
| Detetive do Desperdício (versão simples primeiro) | P1 |
| Construa uma Casa Eficiente (versão simples primeiro) | P1 |
| Ilustrações interativas dos minigames | P2 |
| Teste no equipamento real da feira e com colegas | P0 |
| Auditoria de interface/acessibilidade e de segurança | P0 |
| Revisão do conteúdo pelo professor orientador | P0 |
| **Congelar a versão** (à noite) | P0 |

## Etapa 5 — Feira (10/11)

| Entrega | Prior. |
|---|---|
| Apenas correções críticas | P0 |
| Conferir a cópia local (`out/`) com o Wi-Fi desligado | P0 |
| Ensaiar a apresentação | P0 |

## Regras do plano

- Não adiantar etapas nem adicionar funcionalidades fora deste plano sem aprovação.
- Cada etapa termina com `npm run validate` passando e um commit.
- Publicar na Vercel a cada etapa a partir da etapa 2, para não descobrir problemas na véspera.
