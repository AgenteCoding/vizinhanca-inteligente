# Requisitos — SmartHood AI

> O projeto se chamava **Vizinhança Inteligente** até 10/11/2026. O nome oficial agora é
> **SmartHood AI**. Nomes técnicos (pasta, pacote npm, repositório) continuam os antigos.


Prioridade: **M** = obrigatório para a feira (MVP); **D** = desejável, entra se houver tempo.

## 1. Requisitos funcionais

### Reconhecimento de problemas

| ID | Requisito | Prior. |
|---|---|---|
| RF01 | O sistema deve reconhecer as seis categorias listadas abaixo. | M |
| RF02 | O visitante deve poder escolher a situação por meio de seis cenas (entrada guiada). | M |
| RF03 | O visitante deve poder descrever a situação em texto livre. | M |
| RF04 | O texto livre deve ser normalizado (maiúsculas/minúsculas, acentos, pontuação) e reconhecer sinônimos. | M |
| RF05 | Quando duas categorias tiverem pontuação próxima, o sistema deve pedir confirmação ("Você quis dizer A ou B?"). | M |
| RF06 | Quando nenhuma categoria atingir o mínimo de confiança, o sistema deve informar que não entendeu e oferecer as cenas. Nunca deve "chutar". | M |
| RF07 | O sistema deve mostrar quais termos levaram ao diagnóstico. | M |

**As seis categorias**

| ID | Categoria | Tema da solução |
|---|---|---|
| C1 `iluminacao-publica-dia` | Iluminação pública ligada durante o dia | Sensores de luminosidade e automação |
| C2 `luzes-ambientes-vazios` | Luzes acesas em ambientes vazios | Sensores de presença e automação |
| C3 `consumo-horario-pico` | Muitos equipamentos ligados simultaneamente no horário de pico | Distribuição do consumo e deslocamento de atividades flexíveis |
| C4 `eletrodomesticos-ineficientes` | Eletrodomésticos antigos ou ineficientes | Eficiência energética, etiqueta do Inmetro e hábitos conscientes |
| C5 `ar-condicionado-aberto` | Ar-condicionado com portas e janelas abertas | Uso adequado, vedação e manutenção |
| C6 `solar-sem-geracao` | Residência com boa incidência solar sem geração fotovoltaica | Energia solar, benefícios e limitações |

### Fluxo do assistente

| ID | Requisito | Prior. |
|---|---|---|
| RF08 | O atendimento deve seguir as etapas: relato → diagnóstico → causas → alternativas → desafio → avaliação → explicação final. | M |
| RF09 | Cada categoria deve apresentar ao menos uma causa e ao menos duas alternativas, com benefícios e limitações. | M |
| RF10 | Cada categoria deve ter um desafio de múltipla escolha com uma opção correta. | M |
| RF11 | Cada opção do desafio deve ter um feedback próprio explicando por que está certa ou errada. | M |
| RF12 | A explicação final deve resumir o aprendizado da categoria. | M |
| RF13 | Deve haver um botão "Recomeçar" sempre visível, que volta ao estado inicial sem resíduos do visitante anterior. | M |

### Minigames

| ID | Requisito | Prior. |
|---|---|---|
| RF14 | **Escolha Inteligente:** apresentar uma situação e três alternativas; o visitante escolhe a melhor e recebe feedback. Reaproveita os desafios da base de conhecimento. | M |
| RF15 | **Detetive do Desperdício:** apresentar uma casa fictícia com pontos de desperdício para o visitante identificar, com feedback a cada descoberta e resumo ao final. | D (versão simples: M) |
| RF16 | **Construa uma Casa Eficiente:** o visitante escolhe tecnologias e o resultado mostra quais das seis categorias de problema foram resolvidas. | D (versão simples: M) |
| RF17 | Todo minigame deve ter rota própria, permitir reiniciar e apresentar um resultado final. | M |
| RF18 | Pontuações de jogo, se existirem, devem ser apresentadas como "pontos do jogo", nunca como economia real de energia ou dinheiro. | M |

### Conteúdo científico

| ID | Requisito | Prior. |
|---|---|---|
| RF19 | Toda afirmação factual deve apontar para uma fonte oficial cadastrada ou estar marcada como pendente. | M |
| RF20 | O sistema não deve apresentar percentuais, valores de kWh ou de reais sem fonte confirmada. | M |
| RF21 | As fontes consultadas devem poder ser exibidas ao visitante. | D |

## 2. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF01 | Site estático (`output: "export"`), sem servidor e sem banco de dados. |
| RNF02 | Funcionar sem internet depois de carregado ou a partir de uma cópia local. |
| RNF03 | Lógica de decisão determinística: a mesma entrada sempre gera a mesma saída. |
| RNF04 | Separação em camadas: interface, lógica (TS puro), dados (JSON) e tipos. |
| RNF05 | Conteúdo editável em JSON sem alterar código, validado automaticamente. |
| RNF06 | Resposta do classificador e das transições do fluxo percebida como instantânea (< 100 ms). |
| RNF07 | Funcionar nas versões atuais de Chrome, Edge, Firefox e Safari. |
| RNF08 | Dependências com versões fixadas; nenhuma atualização antes da feira. |
| RNF09 | `npm run validate` (tipos, lint, testes e build) deve passar antes de cada entrega. |
| RNF10 | Interface em português do Brasil, com linguagem adequada a estudantes. |

## 3. Requisitos de acessibilidade

| ID | Requisito |
|---|---|
| RA01 | Contraste mínimo WCAG 2.2 AA (4,5:1 para texto normal, 3:1 para texto grande e ícones). |
| RA02 | Fonte base de 18px; layout sem quebra com zoom de até 200%. |
| RA03 | Alvos de toque de pelo menos 48 × 48 px. |
| RA04 | Navegação completa por teclado, com foco visível e ordem lógica. |
| RA05 | Acerto e erro indicados por ícone e texto, nunca apenas por cor. |
| RA06 | Feedback e mudanças de etapa anunciados a leitores de tela (`aria-live`). |
| RA07 | Imagens informativas com texto alternativo; decorativas com `alt=""`. |
| RA08 | Elementos clicáveis implementados como `button` ou `a` de verdade (inclusive na casa do Detetive). |
| RA09 | `lang="pt-BR"` no documento. |
| RA10 | Respeitar `prefers-reduced-motion`. |
| RA11 | Layout responsivo testado em 360 px (celular), 768 px (tablet) e 1366 px (notebook). |

## 4. Requisitos de segurança e privacidade

| ID | Requisito |
|---|---|
| RS01 | Nenhum segredo, chave ou token no repositório ou no código do cliente. |
| RS02 | Não criar arquivos `.env` com chaves fictícias; `.env*` ignorado pelo Git. |
| RS03 | Nenhum rastreamento, analytics ou cookie de terceiros (público inclui menores). |
| RS04 | O texto digitado não deve sair do navegador nem ser armazenado. |
| RS05 | Texto do visitante exibido como texto puro; `dangerouslySetInnerHTML` proibido. |
| RS06 | Campo de texto com limite de tamanho. |
| RS07 | Nenhum dado pessoal de alunos ou visitantes no código, nos dados ou no histórico do Git. |
| RS08 | Se a IA generativa for adotada no futuro: chave apenas em variável de ambiente do servidor (nunca `NEXT_PUBLIC_`), limite de uso e papel complementar ao motor determinístico. |

## 5. Critérios de aceitação

O projeto estará pronto para a feira quando:

1. As seis categorias forem reconhecidas pela entrada guiada em 100% dos casos.
2. O conjunto de frases de teste (≥ 10 por categoria) for classificado corretamente, e frases
   ambíguas ou desconhecidas levarem à confirmação ou à mensagem de "não entendi", sem chute.
3. O fluxo de sete etapas funcionar do início ao fim para as seis categorias.
4. Todos os desafios tiverem feedback por opção e todas as afirmações tiverem fonte ou marcação
   de pendente, sem números inventados.
5. Escolha Inteligente estiver completa, e Detetive e Casa Eficiente estiverem ao menos na versão
   simples.
6. `npm run validate` passar sem erros.
7. A aplicação funcionar em 360 px, tablet e notebook, e for utilizável só com teclado.
8. O site publicado na Vercel e a cópia local funcionarem, inclusive com o Wi-Fi desligado.
9. O conteúdo científico tiver sido revisado pelo professor orientador.
