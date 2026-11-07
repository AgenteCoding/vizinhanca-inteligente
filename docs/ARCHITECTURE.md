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
| `src/lib/` | `normalize.ts` (texto), `classifier.ts` (categoria + confiança), `flow-engine.ts` (máquina de estados do fluxo), `games/*.ts` (regras dos minigames). | Importar React, acessar `window`, ter efeitos colaterais. |
| `src/data/` | Conteúdo das categorias, fontes e dados dos jogos; `schema.ts` valida; `index.ts` exporta dados tipados. | Conter lógica de decisão. |
| `src/types/` | Interfaces e tipos compartilhados (`knowledge.ts`). | Depender de qualquer outra camada. |
| `tests/` | Testes automatizados espelhando `src/`. | — |

**Estado atual (etapa 1):** existem `src/app/` e `src/types/`. As demais pastas serão criadas na
etapa em que receberem o primeiro arquivo, para evitar diretórios vazios.

## 3. Fluxo de informações

```
Visitante
  │ escolhe cena ou digita texto
  ▼
Componente (assistant/)  ──dispatch(evento)──►  useReducer
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

- Cada categoria segue o contrato `ProblemCategory`: título, resumo, palavras-chave, causas,
  alternativas (benefícios e limitações), desafio e explicação final.
- Cada trecho científico é um `Explanation` com `sourceIds` e `status` (`pending` ou `verified`).
- Testes garantem que: as seis categorias existem; todo `sourceId` existe em `sources.json`; todo
  desafio tem exatamente uma opção correta e feedback em todas as opções.
- Fontes de referência: Inmetro (PBE), Procel, ANEEL (horário de ponta, Tarifa Branca,
  geração distribuída — Lei 14.300/2022), EPE, INPE (Atlas Brasileiro de Energia Solar).

## 6. Como os minigames utilizam as regras existentes

| Minigame | Dados | Lógica | Reuso |
|---|---|---|---|
| Escolha Inteligente | `problems.json` (campo `challenge`) | avaliação de resposta do motor | Reaproveita 100% dos desafios do fluxo principal. |
| Detetive do Desperdício | `games/detetive.json`: pontos da casa, cada um ligado a um `ProblemCategoryId` | `lib/games/detetive.ts`: marcar achados, verificar fim | Explicações vêm da categoria ligada a cada ponto. |
| Construa uma Casa Eficiente | `games/casa.json`: tecnologias, cada uma ligada às categorias que resolve | `lib/games/casa.ts`: calcular quais categorias foram resolvidas | Resultado expresso em categorias resolvidas, nunca em kWh. |

Um hook comum de sessão de jogo (rodada, acertos, reinício) evita duplicação entre os três.

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
| Zod (etapa 2) | Erros de conteúdo aparecem no teste e no build, não para o visitante. |
| Testes em `tests/` espelhando `src/` | Separação clara entre código e verificação. |
| Versões fixadas (`save-exact`) | Evitar quebras inesperadas antes da feira. |
| `@types/node` 24 | Alinhado ao Node 24 do ambiente e exigido pelo Vitest 5. |
| Pastas criadas sob demanda | Evitar estrutura vazia e arquivos sem propósito. |
