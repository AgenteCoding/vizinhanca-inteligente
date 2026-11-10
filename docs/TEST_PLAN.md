# Plano de testes — Vizinhança Inteligente

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

## 5.1 Integração do fluxo navegável

`tests/integration/diagnostico.test.tsx` conduz o estado pelo mesmo reducer do hook e renderiza
cada etapa com os componentes reais (`react-dom/server`), sem dependências novas. Cobre: fluxo
completo para as seis categorias (guiado e digitado), relato vazio, baixa confiança, ambiguidade,
negação, texto sem relação, HTML no relato, respostas corretas e incorretas, ligação dos botões
às ações, reinício e fontes na explicação final. Cliques reais e foco foram conferidos
manualmente no navegador (`npm run dev` → `/diagnostico`).

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

- **Escolha Inteligente:** cada rodada apresenta três alternativas e uma correta; feedback por
  opção; resultado final com acertos; reiniciar zera o estado.
- **Detetive do Desperdício:** cada ponto encontrado é marcado uma única vez; o jogo termina
  quando todos forem encontrados; cada ponto exibe a explicação da categoria ligada.
- **Construa uma Casa Eficiente:** cada combinação de tecnologias resulta nas categorias
  resolvidas corretas; nenhum resultado em kWh ou reais.
- Todos: rota própria abre direto; botão de reiniciar funciona.

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
