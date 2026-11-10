# Arquitetura — SmartHood AI

> O projeto se chamava **Vizinhança Inteligente** até 10/11/2026. O nome oficial agora é
> **SmartHood AI**. Nomes técnicos (pasta, pacote npm, repositório) continuam os antigos.


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
| `src/hooks/` | Hooks finos que conectam o React à lógica: `use-assistant.ts` (conversa) e `use-games.ts` (`useReducer` de cada minigame). | Tomar decisões: só repassam eventos para `src/lib/` e devolvem o estado. |
| `src/lib/` | `normalize.ts` (texto), `classifier.ts` (categoria + confiança), `flow-engine.ts` (máquina de estados do fluxo), `games/*.ts` (regras dos minigames). | Importar React, acessar `window`, ter efeitos colaterais. |
| `src/data/` | Conteúdo das categorias, fontes e dados dos jogos; `schema.ts` valida; `index.ts` exporta dados tipados. | Conter lógica de decisão. |
| `src/types/` | Interfaces e tipos compartilhados (`knowledge.ts`). | Depender de qualquer outra camada. |
| `tests/` | Testes automatizados espelhando `src/`. | — |

**Estado atual (etapa 3, chat-first):** existem `src/app/` (rotas `/` e `/diagnostico`, fontes
locais e `icon.svg`), `src/components/` (`ui/`, `home/` e `assistant/`), `src/hooks/`
(`use-assistant.ts`), `src/data/`, `src/lib/` (incluindo `conversation.ts` e `assistant/`) e
`src/types/` (incluindo `assistant.ts`). As demais pastas serão criadas na etapa em que receberem o
primeiro arquivo, para evitar diretórios vazios.

**Conversa (etapa 3):** a página inicial é um chat. `ChatExperience` (cliente) usa o hook
`useAssistant` e entrega o estado a `ChatView` (só exibe): boas-vindas com o campo de conversa e as
seis sugestões; depois, as falas do visitante e as respostas do assistente, uma etapa por resposta
(`AssistantMessage`). Só a última resposta tem botões. O campo de conversa fica no rodapé da
conversa e só aceita texto quando a etapa permite um relato. "Novo diagnóstico" volta ao início
sem recarregar a página. `/diagnostico` mostra a mesma conversa (links antigos continuam válidos).

```
Componentes -> useAssistant (hooks/) -> AssistantService (types/assistant.ts)
                    |                          | hoje
                    v                          v
            conversationReducer        createDeterministicAssistant (lib/assistant/)
            (lib/conversation.ts)              |
                                               v
                                     createFlowEngine -> classificador, avaliação, dados
```

## 2.1 Assistente como serviço e futura IA generativa

- **Contrato:** `AssistantService` tem `initialState`, `respond(estado, ação)` (assíncrono),
  `content` e `allowedActions`. Os componentes não sabem quem responde.
- **Hoje:** `createDeterministicAssistant` embrulha o motor; funciona sem internet. O hook segura
  o "analisando" por um tempo mínimo (`MIN_PENDING_MS`, de 250 a 700 ms) só para o visitante
  perceber a resposta chegando; o motor em si responde em menos de 1 ms.
- **Erros:** se o serviço falhar, a conversa mostra uma mensagem com "Tentar de novo" e
  "Novo diagnóstico" (estado `error` em `conversationReducer`).
- **Futuro (não implementado, sem dependências nem chamadas fictícias):** um provedor com Claude
  Sonnet seria outro `AssistantService`, escolhido no contexto `AssistantServiceContext`.
  1. A chamada à API fica numa rota do servidor (Route Handler do Next ou função da Vercel); a
     chave fica em `ANTHROPIC_API_KEY`, variável de ambiente do servidor, nunca `NEXT_PUBLIC_`.
  2. Isso exige deixar o export 100% estático (`output: "export"`) ou publicar a rota à parte;
     é uma decisão do responsável, com o impacto registrado aqui e no `CLAUDE.md`.
  3. O motor determinístico continua decidindo etapas, respostas certas e fontes; o modelo só
     poderia redigir textos de forma mais natural ou ajudar a classificar, sempre conferido contra
     a base e sem inventar números.
  4. Em erro, demora ou ausência de internet, o provedor devolve a resposta do motor determinístico
     (reserva).
  5. Testes usariam um serviço falso no contexto, sem custo nem rede.

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
  games/casa-eficiente.json, games/escolha-inteligente.json
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
  `pending`; fonte `verified` sem afirmações; `%`, `kWh` ou `R$` em texto `pending`; menos de
  duas alternativas; desafio sem exatamente uma opção correta entre três; alternativa recomendada
  inexistente; palavra-chave não normalizada ou repetida.
- `src/data/index.ts` valida tudo uma vez ao carregar o módulo (erro aparece no teste/build).
- Fontes de referência: Inmetro (PBE), Procel, ANEEL (horário de ponta, Tarifa Branca,
  geração distribuída — Lei 14.300/2022), EPE, INPE (Atlas Brasileiro de Energia Solar).

## 5.1 Apresentação: identidade SmartHood AI e indicador "Pensando"

O redesign de 10/11/2026 mudou só a camada de interface; rotas, hooks, lógica e dados seguem
as mesmas fronteiras.

- **Marca:** `ui/Logo.tsx` (`BRAND_NAME`, `Logo`, `LogoMark`) é o único lugar que conhece o nome
  e o símbolo. Cabeçalho, rodapé, metadados e a conversa usam esse componente.
- **Estilo:** `globals.css` concentra os tons derivados das três cores, o vidro (`.glass`,
  `.glass-dark`, com alternativa sólida via `@supports`), as esferas (`.orb`) e as animações,
  todas dentro de `prefers-reduced-motion: no-preference`.
- **Cena da página inicial:** `home/EnergyScene.tsx` gera no build um SVG isométrico (casas de
  vidro, núcleo luminoso, linhas de energia). Sem JavaScript no navegador e sem dependência.
- **Indicador "Pensando":** separação em três partes, para valer com qualquer provedor:
  1. `lib/assistant/thinking-time.ts` (pura): `withMinimumDelay(trabalho, mínimo, sleep)` espera
     os dois em paralelo, então a espera visual é o máximo entre o mínimo e o tempo real;
     falha do provedor sai na hora.
  2. `hooks/use-assistant.ts`: fornece o `sleep` cancelável, bloqueia envio duplicado
     (`busyRef`), descarta respostas de uma conversa já reiniciada (`generationRef`) e limpa os
     timers ao reiniciar e ao desmontar.
  3. `ui/ThinkingIndicator.tsx`: só desenha os três pontos e o texto.



Rotas: `/jogos` (apresenta os três) e `/jogos/escolha-inteligente`, `/jogos/detetive`,
`/jogos/casa-eficiente`. Tipos em `src/types/games.ts`; dados em `src/data/games/` (JSON
validado por Zod em `schema.ts`, com as mesmas regras de fonte da base: explicação `verified`
aponta para fontes existentes e verificadas). Cada jogo tem um reducer puro em `src/lib/games/`,
um hook fino em `src/hooks/use-games.ts` e uma tela em `src/components/minigames/` que recebe
estado e ações (testável sem navegador). Telas comuns (introdução, barra com progresso, pontos e
"Recomeçar", resultado com "Jogar novamente" e "Voltar aos minigames") ficam em `GameShell.tsx`.

| Minigame | Dados | Lógica | Reuso |
|---|---|---|---|
| Escolha Inteligente | desafios de `problems.json` + `games/escolha-inteligente.json` (uma rodada extra por categoria) | `lib/games/escolha-inteligente.ts`: sorteia uma rodada por categoria (semente injetada, `random.ts`), avalia e resume | Feedback de cada opção, solução recomendada e explicação final vêm da categoria da base. |
| Detetive do Desperdício | `games/detetive.json`: casa com quatro cômodos; cada situação tem veredito (desperdício, normal, depende), explicação com fonte/status e dica | `lib/games/detetive.ts`: classificar uma vez cada situação, pontuar com tolerância, resumir | Situações ligadas a um `ProblemCategoryId`; fontes da base. |
| Construa uma Casa Eficiente | `games/casa-eficiente.json`: seis problemas (um por categoria) e soluções de tecnologia ou hábito, com efeito (resolve/ajuda), benefício, limitação e combinações | `lib/games/casa-eficiente.ts`: avalia o conjunto (problemas resolvidos, equilíbrio tecnologia × hábito, combinações, recomendações) | Resultado em problemas resolvidos e pontos do jogo, nunca em kWh, % ou R$. |

Pontuação ("pontos do jogo", sempre com o aviso de que não é economia real): Escolha 10 por
acerto; Detetive 2 pelo veredito certo e 1 quando a resposta certa ou a escolhida é "depende";
Casa 2 por problema resolvido, 1 por problema só ajudado e 2 pelo equilíbrio. Nada é salvo
(sem ranking, sem `localStorage`). A semente do sorteio é o único valor gerado no hook.

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
| Fontes locais (`next/font/local`, Atkinson Hyperlegible) | Build e site sem internet; tipografia pensada para leitura fácil. |
| Tema claro fixo e tokens em `globals.css` | Mesma aparência em qualquer aparelho e boa leitura sob a luz da feira. |
| Ícones SVG próprios (`ui/Icon.tsx`) | Sem dependência nova; sempre com texto ao lado. |
| `FinalReport.causes` (etapa 3) | A explicação final passou a mostrar todas as causas; a lista de fontes inclui as fontes delas. |
| Desafio com "marcar e confirmar" | Evita respostas por toque acidental na tela da feira; a avaliação continua no motor. |
| Página inicial abre `/diagnostico#<situação>` | O cartão da situação leva direto ao diagnóstico; o motor valida a categoria. |
| Página inicial chat-first (etapa 3) | O visitante começa a conversar na hora, sem cadastro; as etapas aparecem uma por resposta. |
| `AssistantService` + `useAssistant` | Interface desacoplada do motor; permite trocar o provedor no futuro com o motor como reserva. |
| Paleta Petrol / Ice / Lime | Identidade definida pelo responsável; contraste conferido. |
| Licença MIT | Código aberto e reutilizável, adequado a projeto educacional público. |
