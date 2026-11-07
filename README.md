# Vizinhança Inteligente

Aplicação web educacional que simula uma inteligência artificial de **eficiência energética** em
uma vizinhança inteligente. Projeto desenvolvido para uma feira de ciências (apresentação em
**10/11/2026**).

## O que é

O visitante apresenta uma situação de desperdício de energia. O sistema:

1. identifica o problema;
2. explica as causas;
3. apresenta alternativas de solução;
4. propõe um desafio de múltipla escolha;
5. avalia a resposta com um feedback explicado;
6. apresenta uma explicação final.

## Qual problema pretende resolver

Muitos desperdícios de energia acontecem por hábito ou falta de informação: luzes acesas sem
ninguém, ar-condicionado com a janela aberta, aparelhos ineficientes, consumo concentrado no
horário de pico. O projeto mostra como a tecnologia (sensores, automação, energia solar) e
decisões conscientes podem reduzir esses desperdícios.

## Objetivo científico e educacional

Não basta mostrar uma solução: o objetivo é que o visitante **entenda o problema e aprenda a
decidir**. Por isso cada etapa explica o porquê, os desafios dão feedback sobre cada alternativa
e o próprio sistema mostra como chegou ao diagnóstico, deixando claro que a "IA" é um
sistema especialista baseado em regras. As informações científicas vêm de fontes oficiais
(Inmetro, Procel, ANEEL, EPE, INPE) e o projeto **não usa números inventados**.

## Principais funcionalidades (planejadas)

**Seis categorias de desperdício reconhecidas**

| # | Situação | Tema da solução |
|---|---|---|
| 1 | Iluminação pública ligada durante o dia | Sensores de luminosidade e automação |
| 2 | Luzes acesas em ambientes vazios | Sensores de presença e automação |
| 3 | Muitos equipamentos ligados no horário de pico | Distribuição do consumo e deslocamento de atividades |
| 4 | Eletrodomésticos antigos ou ineficientes | Eficiência energética, etiqueta do Inmetro, hábitos |
| 5 | Ar-condicionado com portas e janelas abertas | Uso adequado, vedação e manutenção |
| 6 | Casas com boa incidência solar sem geração fotovoltaica | Energia solar: benefícios e limitações |

**Três minigames**

- **Escolha Inteligente:** escolher a melhor solução entre três alternativas.
- **Detetive do Desperdício:** encontrar desperdícios em uma casa fictícia.
- **Construa uma Casa Eficiente:** escolher tecnologias para tornar uma casa mais eficiente.

## Tecnologias

| Tecnologia | Por quê |
|---|---|
| Next.js 16 (App Router, export estático) | Gera um site estático que roda sem servidor e sem internet |
| React 19 + TypeScript (strict) | Interface em componentes, com dados e regras tipados |
| Tailwind CSS 4 | Estilização rápida e consistente |
| JSON + Zod | Base de conhecimento editável e validada |
| Vitest | Testes automatizados da lógica de decisão |
| ESLint | Padrões de código e regras de segurança |
| Git + Vercel | Controle de versões e publicação |

Sem banco de dados, contas, rastreamento ou IA generativa: o projeto não precisa deles.

## Como executar

Pré-requisito: [Node.js](https://nodejs.org) 24 ou superior.

```bash
npm install        # instala as dependências (versões fixadas)
npm run dev        # abre em http://localhost:3000
```

Outros comandos:

```bash
npm test           # testes automatizados
npm run validate   # tipos + lint + testes + build
npm run build      # gera o site estático na pasta out/
```

A pasta `out/` pode ser servida por qualquer servidor de arquivos estáticos, inclusive num
notebook sem internet durante a feira.

## Situação atual

**Etapa 1 — Fundação (concluída):** projeto configurado, documentação, contratos de dados e
estrutura de testes. A página inicial é provisória.

**Etapa 2 — Núcleo inteligente (em andamento):** base de conhecimento das seis categorias com
fontes oficiais conferidas e validação automática (bloco A) e classificador de texto com
tratamento de ambiguidade (bloco B). Próximo bloco: motor de decisão do fluxo.

Depois: interface, minigames e entrega. Veja [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md).

## Documentação

- [Visão do projeto](docs/PROJECT_BRIEF.md)
- [Requisitos](docs/REQUIREMENTS.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Plano de desenvolvimento](docs/DEVELOPMENT_PLAN.md)
- [Plano de testes](docs/TEST_PLAN.md)
- [Guia para desenvolvimento com Claude](CLAUDE.md)

## Licença

Distribuído sob a licença [MIT](LICENSE).
