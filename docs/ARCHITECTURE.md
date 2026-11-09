# Arquitetura — Vizinhança Inteligente

## 1. Arquitetura geral

A aplicação é um **site estático** gerado pelo Next.js (`output: "export"`). O `next build`
produz a pasta `out/` com HTML, CSS e JavaScript. Toda a "inteligência" roda no navegador do
visitante.

Por que assim:

- **Sem servidor, sem segredos:** não há API nem banco para proteger.
- **Funciona offline:** essencial numa feira, onde o Wi-Fi é instável.
- **Deploy simples:** Vercel ou qualquer servidor de arquivos.
- **Prazo curto:** menos peças, menos pontos de falha.

A "IA" é um **sistema especialista determinístico**: regras explícitas, testáveis e explicáveis.
Isso é mais confiável que um modelo generativo para um conteúdo científico que não pode errar, e
mais fácil de explicar aos avaliadores.

## 2. Camadas e responsabilidades

```
┌──────────────────────────────────────────────┐
│ src/app/          Rotas (páginas)            │
├──────────────────────────────────────────────┤
│ src/components/   Interface (React)          │
├──────────────────────────────────────────────┤
│ src/hooks/        Ligação React ↔ lógica     │
├──────────────────────────────────────────────┤
│ src/lib/          Lógica: classificador,     │
│                   motor de decisão, jogos    │  ← TypeScript puro, sem React
├──────────────────────────────────────────────┤
│ src/data/         Base de conhecimento (JSON)│
│                   + validação (Zod)          │
├──────────────────────────────────────────────┤
│ src/types/        Contratos de dados         │
└──────────────────────────────────────────────┘
   Dependências apontam sempre para baixo.
```

| Módulo | Responsabilidade | Não pode |
|---|---|---|
| `src/app/` | Definir rotas e montar a página com componentes. | Conter regra de negócio. |
| `src/components/` | Exibir estado, capturar ações, acessibilidade. Subpastas por área: `ui/` (botão, cartão, feedback genéricos), `home/`, `assistant/` (fluxo), `challenges/`, `results/`, `minigames/`. | Decidir diagnóstico, avaliar respostas, conter textos científicos fixos. |
| `src/hooks/` | Hooks finos que conectam o React à lógica: `use-diagnostico.ts` (`useReducer` + `flow-engine`) e `use-game-session.ts` (rodada, acertos, reinício dos jogos). | Tomar decisões: só repassam eventos para `src/lib/` e devolvem o estado. |
| `src/lib/` | `normalize.ts` (texto), `classifier.ts` (categoria + confiança), `flow-engine.ts` (máquina de estados do fluxo), `games/*.ts` (regras dos minigames). | Importar React, acessar `window`, ter efeitos colaterais. |
| `src/data/` | Conteúdo das categorias, fontes e dados dos jogos; `schema.ts` valida; `index.ts` exporta dados tipados. | Conter lógica de decisão. |
| `src/types/` | Interfaces e tipos compartilhados (`knowledge.ts`). | Depender de qualquer outra camada. |
| `tests/` | Testes automatizados espelhando `src/`. | — |

**Estado atual (etapa 2 concluída):** existem `src/app/` (rotas `/` e `/diagnostico`),
`src/components/` (`ui/Button` e `assistant/`), `src/hooks/` (`use-diagnostico.ts`),
`src/data/`, `src/lib/` e `src/types/`. As demais pastas serão criadas na etapa em que receberem
o primeiro arquivo, para evitar diretórios vazios.

**Integração (bloco D):** `useDiagnostico` usa `useReducer` com `diagnosticoReducer`, que só
chama `flowEngine.transition` e guarda o motivo da última recusa. `DiagnosticoFlow` (único
componente com `"use client"`) liga o hook a `DiagnosticoView`, que escolhe a visão da etapa em
`StepViews.tsx`. Os componentes só exibem `content` e chamam as ações; rótulos e avisos da
interface ficam em `components/assistant/messages.ts`. O foco vai para o título a cada troca de
etapa, e o botão "Recomeçar" fica sempre visível.

## 3. Fluxo de informações

```
Visitante
  │ escolhe cena ou digita texto
  ▼
Componente (assistant/)  ──dispatch(evento)──►  useDiagnostico (hooks/) → useReducer
                                                 │
                                                 ▼
                                   flow-engine.next(estado, evento)
                                                 │ usa
                         ┌───────────────────────┴──────────┐
                         ▼                                  ▼
                classifier.classify(texto)          data/ (categoria,
                  │ usa normalize + keywords           causas, desafio)
                  ▼
           { categoria | ambíguo | desconhecido, termos reconhecidos }
                                                 │
                                                 ▼
                                         novo estado
                                                 │
Componente renderiza a etapa atual ◄─────────────┘
```

- O **motor** (`src/lib/flow-engine.ts`) é criado com `createFlowEngine(base)` e oferece
  `transition(estado, ação)` (diz se a ação foi aceita e, se não, o motivo), `reducer` (pronto
  para `useReducer`), `allowedActions(estado)` e `content(estado)` (conteúdo da etapa, montado
  a partir da base). Ações: `SUBMIT_REPORT`, `SELECT_CATEGORY`, `ADVANCE`, `ANSWER_CHALLENGE`,
  `RESTART`. Ação não permitida na etapa é recusada e o estado volta como a mesma referência.

  | Etapa | Ações aceitas | Próxima etapa |
  |---|---|---|
  | relato | `SUBMIT_REPORT`, `SELECT_CATEGORY` | diagnóstico (relato vazio é recusado) |
  | diagnóstico pendente | `SUBMIT_REPORT`, `SELECT_CATEGORY` | diagnóstico confirmado |
  | diagnóstico confirmado | `ADVANCE` (ou reescrever/escolher) | causas |
  | causas → alternativas | `ADVANCE` | alternativas → desafio |
  | desafio | `ANSWER_CHALLENGE` | avaliação |
  | avaliação | `ADVANCE` | explicação final |
  | explicação final | só `RESTART` | — |

  `RESTART` vale em todas as etapas e volta a `{ step: "relato" }`, sem dados anteriores.
- A **avaliação** (`src/lib/evaluation.ts`) compara a opção escolhida com a correta e devolve os
  dois feedbacks. A **explicação final** reúne problema, causa principal (a primeira causa
  cadastrada), consequências, avaliação, solução recomendada (benefícios e limitações),
  explicação científica, explicação final e as fontes citadas, separadas em verificadas e
  pendentes. Cada `Explanation` mantém `status` e `sourceIds`; `hasPendingContent` avisa a
  interface para marcar o conteúdo em revisão.
- O estado guarda só a etapa e os dados dela (categoria, justificativa do classificador,
  avaliação). O conteúdo vem sempre da base. O desafio é entregue à interface sem a indicação
  da opção correta.
- As etapas são as definidas em `FLOW_STEPS` (`src/types/knowledge.ts`).
- O **classificador** (`src/lib/classifier.ts`) é criado a partir das categorias da base
  (`createClassifier(problems)`) e devolve um `ClassificationResult` (`src/types/engine.ts`):
  - `identified`: categoria com evidência suficiente;
  - `ambiguous`: segunda colocada com pelo menos `AMBIGUITY_RATIO` (0,6) da pontuação da primeira;
  - `low-confidence`: pontuação abaixo de `MIN_SCORE` (3);
  - `negated`: uma palavra de negação ("não", "nunca", "jamais", "nem") aparece até 3 palavras
    antes de um termo reconhecido;
  - `unrelated` (nenhum termo da base), `too-short` (menos de 2 palavras) e `empty`.

  Todo resultado traz a justificativa: pontuação por categoria, termos reconhecidos com seus pesos,
  correções de digitação e negações encontradas. Fora de `identified`, a interface pede
  esclarecimento ou oferece a escolha guiada das seis situações.
- **Como pontua:** o normalizador (`src/lib/normalize.ts`) passa o texto para minúsculas, tira
  acentos e pontuação, junta espaços e reduz plurais com poucas regras. Palavras com 6 letras ou
  mais que não existem na base são trocadas pela única palavra conhecida a uma edição de distância
  ("geladera" → "geladeira"). Os termos são procurados como palavras inteiras, o mais longo
  primeiro e sem sobreposição; cada termo conta uma vez, e a pontuação de cada categoria é a soma
  dos pesos cadastrados. `MIN_SCORE` e `AMBIGUITY_RATIO` são constantes de calibração do jogo,
  não dados científicos.
- **Negações não são interpretadas** (limitação assumida). A exceção vem dos dados: termos que já
  incluem a negação, como "nao tem painel" (a ausência do painel é a própria situação), consomem a
  palavra "não" e não bloqueiam o diagnóstico. Frases como "não temos energia solar", sem termo
  correspondente, resultam em `negated` e pedem esclarecimento.

## 4. Separação entre interface e lógica de decisão

Toda decisão (qual categoria, qual etapa vem a seguir, se a resposta está certa) acontece em
`src/lib/`. Os componentes apenas:

1. leem o estado;
2. mostram a etapa correspondente;
3. enviam eventos ao motor.

Benefícios:

- A lógica é testada em milissegundos com Vitest, sem navegador.
- Trocar o visual não arrisca quebrar o diagnóstico.
- Uma futura IA generativa ou outra interface podem reutilizar o mesmo motor.

## 5. Organização da base de conhecimento

```
src/data/
  problems.json      seis categorias (ProblemCategory)
  sources.json       fontes oficiais (Source)
  games/detetive.json
  games/casa.json
  schema.ts          esquemas Zod equivalentes aos tipos de src/types/
  index.ts           carrega, valida e exporta dados tipados
```

- Cada categoria segue o contrato `ProblemCategory`: título, resumo, palavras-chave com peso
  (`WeightedKeyword`: termo normalizado + peso de 1 a 3; sinônimos são termos próprios), causas,
  consequências, alternativas (benefícios e limitações), alternativa recomendada
  (`recommendedAlternativeId`), explicação científica, desafio de três opções e explicação final.
- Cada trecho científico é um `Explanation` com `sourceIds` e `status` (`pending` ou `verified`).
- Cada fonte (`Source`) registra instituição, título, URL https, tema, afirmações que sustenta
  (`supportedClaims`), status de verificação e data de acesso.
- **Tipos sem duplicação:** os tipos ficam em `src/types/knowledge.ts`; os esquemas Zod são
  declarados com `satisfies z.ZodType<Tipo>` e testes de igualdade de tipos fazem o `typecheck`
  falhar se esquema e contrato divergirem.
- O esquema rejeita: campos ausentes ou desconhecidos; IDs duplicados ou fora do padrão; categoria
  ausente; fonte inexistente ou não citada; explicação `verified` sem fonte ou apoiada em fonte
  `pending`; fonte `verified` sem afirmações; `%`, `kWh` ou `R# Arquitetura — Vizinhança Inteligente

## 1. Arquitetura geral

A aplicação é um **site estático** gerado pelo Next.js (`output: "export"`). O `next build`
produz a pasta `out/` com HTML, CSS e JavaScript. Toda a "inteligência" roda no navegador do
visitante.

Por que assim:

- **Sem servidor, sem segredos:** não há API nem banco para proteger.
- **Funciona offline:** essencial numa feira, onde o Wi-Fi é instável.
- **Deploy simples:** Vercel ou qualquer servidor de arquivos.
- **Prazo curto:** menos peças, menos pontos de falha.

A "IA" é um **sistema especialista determinístico**: regras explícitas, testáveis e explicáveis.
Isso é mais confiável que um modelo generativo para um conteúdo científico que não pode errar, e
mais fácil de explicar aos avaliadores.

## 2. Camadas e responsabilidades

```
┌──────────────────────────────────────────────┐
│ src/app/          Rotas (páginas)            │
├──────────────────────────────────────────────┤
│ src/components/   Interface (React)          │
├──────────────────────────────────────────────┤
│ src/hooks/        Ligação React ↔ lógica     │
├──────────────────────────────────────────────┤
│ src/lib/          Lógica: classificador,     │
│                   motor de decisão, jogos    │  ← TypeScript puro, sem React
├──────────────────────────────────────────────┤
│ src/data/         Base de conhecimento (JSON)│
│                   + validação (Zod)          │
├──────────────────────────────────────────────┤
│ src/types/        Contratos de dados         │
└──────────────────────────────────────────────┘
   Dependências apontam sempre para baixo.
```

| Módulo | Responsabilidade | Não pode |
|---|---|---|
| `src/app/` | Definir rotas e montar a página com componentes. | Conter regra de negócio. |
| `src/components/` | Exibir estado, capturar ações, acessibilidade. Subpastas por área: `ui/` (botão, cartão, feedback genéricos), `home/`, `assistant/` (fluxo), `challenges/`, `results/`, `minigames/`. | Decidir diagnóstico, avaliar respostas, conter textos científicos fixos. |
| `src/hooks/` | Hooks finos que conectam o React à lógica: `use-diagnostico.ts` (`useReducer` + `flow-engine`) e `use-game-session.ts` (rodada, acertos, reinício dos jogos). | Tomar decisões: só repassam eventos para `src/lib/` e devolvem o estado. |
| `src/lib/` | `normalize.ts` (texto), `classifier.ts` (categoria + confiança), `flow-engine.ts` (máquina de estados do fluxo), `games/*.ts` (regras dos minigames). | Importar React, acessar `window`, ter efeitos colaterais. |
| `src/data/` | Conteúdo das categorias, fontes e dados dos jogos; `schema.ts` valida; `index.ts` exporta dados tipados. | Conter lógica de decisão. |
| `src/types/` | Interfaces e tipos compartilhados (`knowledge.ts`). | Depender de qualquer outra camada. |
| `tests/` | Testes automatizados espelhando `src/`. | — |

**Estado atual (etapa 2, bloco A):** existem `src/app/`, `src/data/` e `src/types/`. As demais
pastas serão criadas na etapa em que receberem o primeiro arquivo, para evitar diretórios vazios.

## 3. Fluxo de informações

```
Visitante
  │ escolhe cena ou digita texto
  ▼
Componente (assistant/)  ──dispatch(evento)──►  useDiagnostico (hooks/) → useReducer
                                                 │
                                                 ▼
                                   flow-engine.next(estado, evento)
                                                 │ usa
                         ┌───────────────────────┴──────────┐
                         ▼                                  ▼
                classifier.classify(texto)          data/ (categoria,
                  │ usa normalize + keywords           causas, desafio)
                  ▼
           { categoria | ambíguo | desconhecido, termos reconhecidos }
                                                 │
                                                 ▼
                                         novo estado
                                                 │
Componente renderiza a etapa atual ◄─────────────┘
```

- O **motor** é uma função pura `next(estado, evento) → estado`. Os eventos são, por exemplo,
  `ENVIAR_RELATO`, `CONFIRMAR_CATEGORIA`, `AVANCAR`, `RESPONDER_DESAFIO`, `RECOMECAR`.
- As etapas são as definidas em `FLOW_STEPS` (`src/types/knowledge.ts`).
- O **classificador** devolve um resultado com três formas possíveis: categoria identificada,
  ambíguo (duas candidatas próximas) ou desconhecido (abaixo do limite de confiança). Ele também
  devolve os termos reconhecidos, para exibição.

## 4. Separação entre interface e lógica de decisão

Toda decisão (qual categoria, qual etapa vem a seguir, se a resposta está certa) acontece em
`src/lib/`. Os componentes apenas:

1. leem o estado;
2. mostram a etapa correspondente;
3. enviam eventos ao motor.

Benefícios:

- A lógica é testada em milissegundos com Vitest, sem navegador.
- Trocar o visual não arrisca quebrar o diagnóstico.
- Uma futura IA generativa ou outra interface podem reutilizar o mesmo motor.

## 5. Organização da base de conhecimento

```
src/data/
  problems.json      seis categorias (ProblemCategory)
  sources.json       fontes oficiais (Source)
  games/detetive.json
  games/casa.json
  schema.ts          esquemas Zod equivalentes aos tipos de src/types/
  index.ts           carrega, valida e exporta dados tipados
```

 em texto `pending`; menos de
  duas alternativas; desafio sem exatamente uma opção correta entre três; alternativa recomendada
  inexistente; palavra-chave não normalizada ou repetida.
- `src/data/index.ts` valida tudo uma vez ao carregar o módulo (erro aparece no teste/build).
- Fontes de referência: Inmetro (PBE), Procel, ANEEL (horário de ponta, Tarifa Branca,
  geração distribuída — Lei 14.300/2022), EPE, INPE (Atlas Brasileiro de Energia Solar).

## 6. Como os minigames utilizam as regras existentes

| Minigame | Dados | Lógica | Reuso |
|---|---|---|---|
| Escolha Inteligente | `problems.json` (campo `challenge`) | avaliação de resposta do motor | Reaproveita 100% dos desafios do fluxo principal. |
| Detetive do Desperdício | `games/detetive.json`: pontos da casa, cada um ligado a um `ProblemCategoryId` | `lib/games/detetive.ts`: marcar achados, verificar fim | Explicações vêm da categoria ligada a cada ponto. |
| Construa uma Casa Eficiente | `games/casa.json`: tecnologias, cada uma ligada às categorias que resolve | `lib/games/casa.ts`: calcular quais categorias foram resolvidas | Resultado expresso em categorias resolvidas, nunca em kWh. |

Um hook comum de sessão de jogo (`src/hooks/use-game-session.ts`: rodada, acertos, reinício)
evita duplicação entre os três.

## 7. Evolução sem reescrita

- **Nova categoria:** adicionar o ID em `PROBLEM_CATEGORY_IDS` e o conteúdo em `problems.json`;
  os testes apontam o que falta.
- **Novo minigame:** um JSON, um arquivo em `lib/games/`, um componente e uma rota, sem tocar no
  motor.
- **Melhor classificador:** `classifier.ts` mantém a mesma assinatura; a interface não muda.
- **IA generativa (pós-feira):** entraria como complemento (ex.: reformular explicações), atrás de
  uma rota de servidor com a chave em variável de ambiente. Isso exigiria sair do export estático
  e deve ser uma decisão explícita, registrada aqui e no `CLAUDE.md`.
- **Outros idiomas:** os textos já ficam fora dos componentes, em `src/data/`.

## 8. Decisões técnicas registradas

| Decisão | Motivo |
|---|---|
| Export estático | Offline, sem segredos, deploy trivial. |
| Sem banco de dados e sem contas | Não há dados a persistir; privacidade de menores. |
| Classificação por palavras-chave com pesos | Determinística, testável e explicável; cabe no prazo. |
| Máquina de estados pura + `useReducer` | Fluxo previsível e testável, sem biblioteca extra. |
| Zod 4.6.7 (etapa 2) | Erros de conteúdo aparecem no teste e no build, não para o visitante. Já existia na árvore (dependência do ESLint); agora é dependência direta. |
| Campos `consequences`, `recommendedAlternativeId` e `scientificExplanation` | Pedidos na etapa 2: o fluxo precisa de consequências, de uma solução recomendada e de uma explicação científica por problema. |
| Fonte com `topic`, `supportedClaims` e `status` | Torna rastreável o que cada fonte sustenta e permite marcar fontes não conferidas. |
| Testes em `tests/` espelhando `src/` | Separação clara entre código e verificação. |
| Versões fixadas (`save-exact`) | Evitar quebras inesperadas antes da feira. |
| `@types/node` 24 | Alinhado ao Node 24 do ambiente e exigido pelo Vitest 5. |
| Pastas criadas sob demanda | Evitar estrutura vazia e arquivos sem propósito. |
| Hooks em `src/hooks/` | Dar lugar próprio à ligação com o React sem permitir React em `src/lib/`. |
| Palavras-chave com peso no contrato | Permite pontuação por categoria e detecção de ambiguidade no classificador. |
| Regras recomendadas do `jsx-a11y` | Acessibilidade verificada automaticamente no lint. |
| Alertas do `npm audit` (minimatch no ESLint) aceitos | Só afetam ferramentas de desenvolvimento; a correção forçada quebraria o lint. |
| Classificador criado a partir dos dados (`createClassifier`) | Nenhuma categoria fixa no código; o índice é montado uma vez e a função é pura. |
| Negação sinalizada, não interpretada | Evita diagnóstico confiante quando o visitante nega a situação; interpretar negações exigiria uma proposta separada. |
| Licença MIT | Código aberto e reutilizável, adequado a projeto educacional público. |
