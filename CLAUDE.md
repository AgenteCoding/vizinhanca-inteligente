# CLAUDE.md — Referência de desenvolvimento da Vizinhança Inteligente

Leia este arquivo inteiro antes de qualquer tarefa no projeto. Ele prevalece sobre hábitos
gerais. Em conflito com uma instrução explícita do responsável pelo projeto, siga o responsável
e registre a mudança aqui.

@AGENTS.md

> O `AGENTS.md` é gerado pelo Next.js 16 e avisa que esta versão tem APIs diferentes das
> conhecidas. Antes de usar uma API do Next, consulte `node_modules/next/dist/docs/`.

## 1. Contexto e objetivo

Aplicação web educacional para uma feira de ciências (entrega: **10/11/2026**). Simula uma
inteligência artificial de eficiência energética: o visitante relata um desperdício de energia, o
sistema identifica o problema, explica as causas, apresenta alternativas, propõe um desafio de
múltipla escolha, avalia a resposta e dá uma explicação final. O objetivo é **ensinar a decidir**,
não só mostrar a resposta.

Seis categorias: iluminação pública ligada de dia; luzes acesas em ambientes vazios; muitos
equipamentos em horário de pico; eletrodomésticos antigos ou ineficientes; ar-condicionado com
portas e janelas abertas; casas com boa incidência solar sem geração fotovoltaica.

Três minigames: Escolha Inteligente, Detetive do Desperdício e Construa uma Casa Eficiente.

Detalhes: `docs/PROJECT_BRIEF.md` e `docs/REQUIREMENTS.md`.

## 2. Arquitetura aprovada (resumo)

- **Site estático** (`output: "export"`): sem servidor, sem banco, sem contas. Roda offline.
- A "IA" é um **sistema especialista determinístico**: classificação por palavras-chave com
  pesos + máquina de estados. IA generativa é opcional e fica fora do escopo até a feira.
- Quatro camadas, com dependência em **uma só direção** (interface → lógica → dados → tipos):

| Camada | Pasta | Regra |
|---|---|---|
| Rotas | `src/app/` | Só monta páginas a partir de componentes. Sem regra de negócio. |
| Interface | `src/components/` | Exibe estado e dispara ações. Sem regra de negócio. |
| Ligação React | `src/hooks/` | Hooks finos (`useReducer`, sessão de jogo) que chamam `src/lib/`. Sem regra própria. |
| Lógica | `src/lib/` | TypeScript puro, **sem React**. Classificador, motor, regras dos jogos. |
| Conhecimento | `src/data/` | JSON + esquema Zod. Conteúdo editável sem mexer em código. |
| Contratos | `src/types/` | Tipos compartilhados por todas as camadas. |

Detalhes: `docs/ARCHITECTURE.md`.

## 3. Tecnologias (versões fixadas)

Next.js 16.4.5 (App Router), React 19.3, TypeScript 5.9 (strict), Tailwind CSS 4.3,
ESLint 9, Vitest 5.1, Zod 4.6 (valida `src/data/`). Node 24.

- `.npmrc` usa `save-exact=true`. **Não atualize dependências antes da feira.**
- `eslint-plugin-jsx-a11y` está declarado diretamente (já vinha com o `eslint-config-next`)
  para ativar o conjunto recomendado de regras de acessibilidade.
- `npm audit` acusa 8 alertas moderados vindos de `minimatch` dentro do ESLint (só
  desenvolvimento, não chega ao site). **Risco aceito em 07/11/2026**: o `audit fix --force`
  rebaixaria o `eslint-config-next` para a v15 e quebraria o lint. Não rode `audit fix --force`.
- Proibido adicionar: bibliotecas de animação, banco de dados, autenticação, analytics,
  gerenciadores de estado, SDKs de IA generativa. Qualquer nova dependência exige justificativa
  escrita na resposta ao responsável e aprovação.

## 4. Organização dos arquivos

```
src/app/            rotas (layout.tsx, page.tsx e, nas próximas etapas, diagnostico/ e jogos/)
src/components/     ui/ (genéricos), assistant/, challenges/, minigames/, results/, home/
src/hooks/          use-diagnostico.ts, use-game-session.ts (ligam o React ao motor de src/lib/)
src/lib/            normalize.ts, classifier.ts, flow-engine.ts, games/*.ts
src/data/           problems.json, sources.json, games/*.json, schema.ts, index.ts
src/types/          knowledge.ts (contratos da base), engine.ts (classificador e motor)
tests/              espelha src/: tests/lib/classifier.test.ts etc.
docs/               documentação do projeto
public/images/      ilustrações (criada quando houver a primeira imagem)
```

**Não crie pastas vazias.** Uma pasta nasce junto com o primeiro arquivo que precisa dela.

## 5. Padrões de código

- TypeScript `strict`. **`any` é proibido** (ESLint em `error`); use tipos explícitos ou `unknown`.
- Funções de `src/lib/` são **puras**: mesma entrada → mesma saída, sem efeitos colaterais,
  sem acesso a `window`, `Date.now()` ou `Math.random()` sem injeção explícita.
- Componentes pequenos, com uma responsabilidade. Server Components por padrão; `"use client"`
  só quando houver interatividade.
- Estado do fluxo com `useReducer` chamando o motor de `src/lib/`, encapsulado em um hook de
  `src/hooks/`. O hook só conecta; quem decide é `src/lib/`. Nada de lógica de decisão em
  `onClick` nem dentro de hooks.
- Sem duplicação: conteúdo vem sempre de `src/data/`, nunca escrito direto no JSX.
- Importações com o alias `@/` (ex.: `@/lib/classifier`).
- Textos da interface em português do Brasil, linguagem acessível para estudantes.

## 6. Convenções de nomenclatura

- Arquivos de componentes: `PascalCase.tsx` (ex.: `ChallengeCard.tsx`).
- Demais arquivos e pastas: `kebab-case` (ex.: `flow-engine.ts`, `casa-eficiente/`).
- Rotas em português (`/diagnostico`, `/jogos/detetive`), pois aparecem para o visitante.
- Identificadores no código em inglês (`classifyProblem`, `ProblemCategory`); IDs de dados em
  português `kebab-case` (`luzes-ambientes-vazios`).
- Testes: `tests/<mesmo caminho de src>/<arquivo>.test.ts`; testes de integração que atravessam
  camadas ficam em `tests/integration/` (`.test.tsx` quando renderizam componentes).

## 7. Regras científicas (obrigatórias)

- **Nunca invente** dados científicos, percentuais de economia, valores em kWh ou em reais.
- Toda afirmação factual em `src/data/` deve ter `sourceIds` apontando para `sources.json`
  (órgãos oficiais: Inmetro/PBE, Procel, ANEEL, EPE, INPE) **ou** `status: "pending"`.
- Uma fonte só é `verified` depois de aberta e lida; `supportedClaims` registra, em paráfrase,
  o que ela sustenta. Uma explicação só é `verified` se o texto se apoiar nessas afirmações e
  todas as fontes citadas forem `verified`. Na dúvida, `pending`. O esquema Zod
  (`src/data/schema.ts`) impõe essas regras e os testes falham se forem violadas.
- Conteúdo `pending` nunca é apresentado ao visitante como fato comprovado.
- Nunca invente URLs, títulos ou publicações: só cadastre fontes que foram abertas e conferidas.
- Sem fonte confirmada → texto **qualitativo** ("reduz o consumo"), nunca número estimado.
- Horário de ponta varia por distribuidora: não fixe um horário único como regra nacional.
- Pontuação de minigame é "pontos do jogo", nunca apresentada como economia real.
- O conteúdo final deve ser revisado pelo professor orientador.

## 8. Segurança e privacidade

- Público inclui menores: **nenhum rastreamento, cookie de terceiros ou analytics**.
- O texto digitado pelo visitante não sai do navegador e não é armazenado (nem em
  `localStorage`).
- Exiba texto do visitante como texto puro. `dangerouslySetInnerHTML` é proibido (ESLint).
- Entradas de texto com limite de tamanho.
- Nenhum segredo no repositório. **Não crie `.env` com chaves fictícias.** `.env*` está no
  `.gitignore`. Variáveis `NEXT_PUBLIC_*` são públicas: nunca coloque chaves nelas.
- Nenhum dado pessoal de alunos ou visitantes em código, dados ou commits.

## 9. Acessibilidade e responsividade

Mobile-first (testar em 360px, tablet e notebook); fonte base de 18px; alvos de toque ≥ 48px;
contraste WCAG AA; acerto/erro com ícone **e** texto, nunca só cor; feedback anunciado com
`aria-live`; foco visível; navegação completa por teclado; `lang="pt-BR"`; respeitar
`prefers-reduced-motion`; botão "Recomeçar" sempre visível nas telas do fluxo.

## 10. Testes (obrigatórios)

- Todo código novo em `src/lib/` e `src/data/` vem com testes em `tests/`.
- Antes de declarar uma tarefa concluída, rode `npm run validate`
  (typecheck → lint → testes → build) e informe o resultado real, inclusive falhas.
- Plano completo: `docs/TEST_PLAN.md`.

## 11. Comandos

```bash
npm run dev        # servidor de desenvolvimento (http://localhost:3000)
npm run typecheck  # gera tipos das rotas e checa TypeScript
npm run lint       # ESLint
npm test           # Vitest
npm run build      # export estático em out/
npm run validate   # tudo acima, em sequência
```

## 12. Git e commits

- Branch principal: `main`. Fins de linha normalizados em LF pelo `.gitattributes`.
- Um commit por unidade lógica de trabalho, sempre com `npm run validate` passando.
- Mensagem em português, no imperativo, com prefixo de tipo:
  `feat:` (funcionalidade), `fix:` (correção), `docs:` (documentação), `test:` (testes),
  `refactor:` (reorganização sem mudar comportamento), `chore:` (configuração e dependências),
  `content:` (base de conhecimento). Ex.: `feat: adiciona classificador de palavras-chave`.
- Nunca commitar `.env*`, `out/`, `.next/` ou dados pessoais.
- Não fazer push, criar repositório remoto ou publicar sem autorização do responsável.

## 13. Regras de trabalho

- **Não crie funcionalidades sem justificativa** ligada ao objetivo educacional e aos requisitos.
- **Não altere a arquitetura** (camadas, pastas, tecnologias, export estático) sem antes
  apresentar o motivo, o impacto e a alternativa ao responsável e receber aprovação. Mudanças
  aprovadas devem ser registradas neste arquivo e em `docs/ARCHITECTURE.md`.
- **Explique toda alteração relevante**: o que mudou, por quê e como foi testado.
- Apresente o plano e aguarde autorização antes de criar ou alterar arquivos em mudanças grandes.
- Não sobrescreva nem apague arquivos existentes sem autorização.
- Respeite a etapa atual de `docs/DEVELOPMENT_PLAN.md`; não adiante etapas.
- Não priorize animações ou efeitos visuais sobre o funcionamento.
