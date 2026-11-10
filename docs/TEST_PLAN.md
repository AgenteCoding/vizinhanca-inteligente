# Plano de testes — SmartHood AI

> O projeto se chamava **Vizinhança Inteligente** até 10/11/2026. O nome oficial agora é
> **SmartHood AI**. Nomes técnicos (pasta, pacote npm, repositório) continuam os antigos.


## Estratégia

| Nível | Ferramenta | O que cobre |
|---|---|---|
| Unitário | Vitest | `src/lib/` (classificador, motor, jogos) e validação de `src/data/` |
| Estático | TypeScript strict + ESLint | Tipos, contratos, `any` proibido, HTML bruto proibido |
| Build | `next build` | Export estático completo sem erros |
| Manual | Roteiro abaixo | Interface, responsividade, acessibilidade, equipamento da feira |

Comando único antes de cada entrega: `npm run validate`.
Os testes ficam em `tests/`, espelhando `src/` (ex.: `tests/lib/classifier.test.ts`).

## 1. Reconhecimento dos seis problemas

- Para cada categoria, **pelo menos 10 frases** representativas, escritas como um visitante
  escreveria, devem resultar na categoria correta.
- A entrada guiada (escolha de cena) deve levar à categoria correspondente em 100% dos casos.
- O resultado deve listar os termos reconhecidos.

Lista completa em `tests/lib/classifier-phrases.ts` (frases escritas antes de ajustar as
palavras-chave). Exemplos:
- C1: "os postes ficam acesos de dia", "a luz da rua não apaga de manhã"
- C2: "deixam a luz da sala acesa sem ninguém"
- C3: "todo mundo liga chuveiro e forno no fim da tarde, na mesma hora"
- C4: "minha geladeira é muito velha"
- C5: "ligam o ar com a janela aberta"
- C6: "minha casa pega muito sol e não tem placa solar"

## 2. Sinônimos e variações de escrita

- Maiúsculas e minúsculas: "LUZ ACESA" = "luz acesa".
- Acentos: "iluminacao" = "iluminação"; "lampada" = "lâmpada".
- Pontuação e espaços extras ignorados.
- Sinônimos: lâmpada/luz/iluminação; ar/ar-condicionado/climatizador; poste/luz da rua;
  placa solar/painel solar/fotovoltaico; geladeira/refrigerador.
- Plural e singular ("lâmpadas" / "lâmpada").

## 3. Entradas ambíguas

- Frases com termos de duas categorias (ex.: "a luz e o ar ficam ligados com a janela aberta")
  devem gerar o pedido de confirmação "Você quis dizer A ou B?".
- Teste do limite: pontuações próximas → confirmação; diferença clara → categoria direta.
- Ao confirmar uma opção, o fluxo segue para a categoria escolhida.

## 4. Entradas inválidas

- Texto vazio ou só espaços → não envia (botão desabilitado ou mensagem).
- Texto sem relação com energia ("gosto de futebol") → "não entendi" + oferta das cenas.
- Texto acima do limite de tamanho → bloqueado ou truncado com aviso.
- Caracteres especiais e HTML (`<script>`) → exibidos como texto puro, sem executar nada.
- Negações ("os postes não ficam acesos") → resultado `negated`, sem categoria confiante. Frases
  de ausência sem termo correspondente ("não temos energia solar") também caem em `negated`:
  limitação documentada em `NEGATION_LIMITATION_PHRASES`.

## 5. Escolha das soluções (motor de decisão)

- Transições válidas em todas as etapas: relato → diagnóstico → causas → alternativas →
  desafio → avaliação → explicação final.
- Eventos fora de ordem são ignorados sem quebrar o estado.
- Resposta correta e incorreta produzem a avaliação e o feedback da opção escolhida.
- "Recomeçar" de qualquer etapa volta ao estado inicial, sem dados do visitante anterior.
- Determinismo: mesma sequência de eventos → mesmo estado final.
- Ação recusada devolve o mesmo objeto de estado (seguro para `useReducer`).
- A explicação final preserva `status` e `sourceIds` de cada explicação e separa fontes
  verificadas de pendentes (`tests/lib/flow-engine.test.ts`).

## 5.1 Integração da conversa

`tests/integration/assistente.test.tsx` conduz a conversa pelo mesmo `conversationReducer` e
serviço que o hook usa e renderiza os componentes reais (`react-dom/server`), sem dependências
novas. Cobre: boas-vindas (pergunta, campo, aviso de conta, sugestões), conversa completa para as
seis categorias (sugestão e relato digitado), só a última resposta com botões, relato vazio, baixa
confiança, ambiguidade, negação, texto sem relação, HTML no relato, campo travado nas etapas
guiadas, "analisando", erro do provedor com "Tentar de novo", respostas corretas e incorretas,
ligação dos botões às ações, recomeço e fontes na explicação final. Também confere que os
componentes não importam o motor e que nenhum código chama APIs externas ou lê chaves.
`tests/lib/conversation.test.ts` e `tests/lib/assistant/` testam o estado da conversa e o serviço.
Cliques reais, teclado e movimento reduzido foram conferidos no Chrome (sem janela) sobre o site gerado.

Etapa 3: o desafio usa "marcar e confirmar" (botão desativado até marcar uma opção); os testes
conferem o indicador de progresso (`aria-current="step"`), a solução recomendada marcada, o
resultado da avaliação (`data-result`) e todas as causas na explicação final. Os dados têm testes
que impedem a opção correta de ficar sempre na mesma posição, de se destacar pelo tamanho ou de ter
feedback começando com elogio.

## 6. Explicações apresentadas

Testes automatizados sobre `src/data/`:
- As seis categorias existem e passam no esquema.
- Cada categoria tem ≥ 1 causa, ≥ 2 alternativas, 1 desafio e explicação final.
- Cada desafio tem exatamente uma opção correta e feedback em todas as opções.
- Todo `sourceId` existe em `sources.json`.
- Trechos sem fonte estão marcados como `pending`.
- Nenhum texto contém números de economia (verificação por expressão regular de `%`, `kWh`,
  `R$`) sem fonte associada.
- Explicação `verified` só cita fontes `verified`; fonte `verified` registra o que sustenta.
- Toda fonte cadastrada é citada e pertence a um domínio institucional.
- Nenhum horário fixo de ponta aparece nos textos.
- Cada regra do esquema tem um teste com JSON propositalmente inválido
  (`tests/data/schema.test.ts`).

Revisão manual: linguagem acessível e revisão do professor orientador.

## 7. Minigames

Automatizados: `tests/data/games.test.ts` (dados e esquema), `tests/lib/games/games-logic.test.ts`
(regras puras) e `tests/integration/minigames.test.tsx` (telas reais e navegação).

- **Escolha Inteligente:** uma rodada por categoria, sorteio determinístico pela semente; três
  alternativas e uma correta; resposta única por rodada; avaliação com problema, opção mais
  adequada e solução recomendada da base; resultado com pontos e resumo; reiniciar zera o estado.
- **Detetive do Desperdício:** quatro cômodos e os três vereditos; cada situação analisada uma
  vez, com explicação logo depois; só termina com tudo analisado; resultado com desperdícios
  encontrados, não encontrados e recomendações.
- **Construa uma Casa Eficiente:** limite de soluções; avaliação do conjunto (resolve/ajuda,
  equilíbrio, combinações sem contradição entre positivo e melhoria); nenhum %, kWh ou R$.
- Todos: rota própria (export estático); "Recomeçar", "Jogar novamente" e "Voltar aos minigames".
- Manual (Chrome): celular, tablet e computador sem rolagem horizontal; partida completa de cada
  jogo; teclado (Tab, setas, Espaço, Enter) com foco movido para o título a cada etapa.

## 7.1 Identidade e indicador "Pensando"

Automatizados: `tests/lib/assistant/thinking-time.test.ts` (relógio falso: resposta instantânea
espera 5 s; resposta de 8 s não espera mais nada; erro sai na hora; espera cancelada libera na
hora) e `tests/integration/identidade.test.tsx` (nome novo em toda a interface, espaço único da
logo, indicador na conversa, cena decorativa sem elementos clicáveis nem endereços externos).

Manual (Chrome): mensagem digitada mostra o balão na hora e a resposta em cerca de 5 s;
"Novo diagnóstico" durante a espera volta ao início e nenhuma resposta chega depois; Enter
repetido durante a espera não duplica a resposta; com movimento reduzido as animações param.

## 7.2 Respostas sem cards e digitação progressiva

Automatizados: `tests/lib/typing/typing.test.ts` (velocidade e sequência: nenhum caractere
perdido ou repetido em qualquer ritmo, pular, resposta sem texto) e
`tests/integration/digitacao.test.tsx` (todo o texto da base aparece inteiro em cada resposta
das seis categorias; resposta da vez e resposta antiga têm o mesmo texto; `TypedContent` não
esconde nada no HTML; texto com sinais de HTML continua texto; sem `innerHTML`; moldura e
blocos de texto sem classes de caixa).

Manual (Chrome, build estático): o HTML final das seis respostas é **idêntico** com e sem
animação; o texto cresce progressivamente; "Pensando" some antes da digitação; cursor some no
fim; "Mostrar resposta completa" termina na hora e devolve o foco ao título; "Novo diagnóstico"
durante a digitação não deixa resíduos; mensagem nova durante a digitação encerra a anterior;
respostas antigas não voltam a animar; movimento reduzido mostra tudo de imediato.

A aplicação na página (`typed-reveal.ts`) depende de um navegador de verdade e não tem teste
automatizado: o projeto não tem ambiente de DOM nos testes.

## 7.3 Fundo fluido

Manual (Chrome): camadas `fixed`, `z-index -1`, `pointer-events: none`; `transform` muda ao
longo do tempo; com movimento reduzido `animation: none`; no celular só uma camada; vidro da
conversa legível; sem rolagem horizontal.

## 7.4 Liquid Glass do chat

Manual (Chrome): `backdrop-filter` calculado no painel (14 px no desktop, 10 px no celular);
foco do campo com borda Petrol e brilho Lime; botão de envio clicável sem nada por cima; campo
visível sem rolar; fallback `@supports not` presente no CSS gerado.

## 8. Responsividade (manual)

- Larguras: 360 px, 768 px, 1366 px e a tela real da feira.
- Sem rolagem horizontal; textos não cortados; botões alcançáveis.
- Orientação retrato e paisagem no tablet.
- Zoom do navegador em 200% sem perda de conteúdo.

## 9. Acessibilidade (manual + auditoria)

- Navegar todo o fluxo e os jogos **só com teclado** (Tab, Shift+Tab, Enter, Espaço).
- Foco sempre visível.
- Leitor de tela (NVDA no Windows ou Narrador) anuncia etapa atual e feedback.
- Contraste conferido nas cores definitivas (AA).
- Acerto/erro compreensível sem cor (ícone + texto).
- Alvos de toque ≥ 48 px na tela de toque.
- `prefers-reduced-motion` respeitado.
- Auditoria com Lighthouse (acessibilidade ≥ 90) e revisão de diretrizes de interface.

## 10. Testes de entrega

- `npm run validate` sem erros.
- Site publicado na Vercel funcionando.
- Cópia local de `out/` funcionando com o Wi-Fi desligado.
- Teste com 2 ou 3 colegas que não conhecem o projeto, observando onde travam.
