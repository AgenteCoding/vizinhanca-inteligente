# Visão do projeto — SmartHood AI

> O projeto se chamava **Vizinhança Inteligente** até 10/11/2026. O nome oficial agora é
> **SmartHood AI**. Nomes técnicos (pasta, pacote npm, repositório) continuam os antigos.


## Visão geral

O SmartHood AI é uma aplicação web que simula uma inteligência artificial voltada à
eficiência energética. Em uma vizinhança fictícia, o visitante relata ou escolhe uma situação de
desperdício de energia, e o assistente conduz um atendimento em etapas: diagnóstico, causas,
alternativas, desafio, avaliação e explicação final. Três minigames reforçam o aprendizado.

## Público-alvo

- **Principal:** visitantes da feira de ciências, em especial estudantes do ensino fundamental e
  médio, e também pais e professores.
- **Secundário:** avaliadores da feira, que precisam entender rapidamente a proposta e a
  tecnologia por trás dela.

Consequências para o projeto: linguagem simples, interações curtas (fila da feira), uso em tela
de toque ou notebook, sem cadastro e sem coleta de dados.

## Objetivos

1. Ensinar a reconhecer seis situações comuns de desperdício de energia.
2. Explicar as causas e as alternativas de solução com base em fontes oficiais.
3. Desenvolver a tomada de decisão consciente por meio de desafios com feedback explicado.
4. Mostrar, de forma honesta, como funciona um sistema especialista baseado em regras.

## Proposta de valor educacional

- **Aprender fazendo:** o visitante decide e recebe feedback sobre cada escolha, certa ou errada.
- **Transparência:** o assistente mostra por que chegou a um diagnóstico (termos reconhecidos),
  apresentando a ideia de IA sem "mágica".
- **Confiabilidade:** conteúdo rastreável a fontes oficiais; nada de números inventados.
- **Benefícios e limitações:** cada solução mostra também seus limites (ex.: energia solar depende
  de incidência solar e de investimento), estimulando o pensamento crítico.

## Funcionamento esperado

1. **Relato:** o visitante escolhe uma das seis cenas ilustradas ou descreve a situação em texto.
2. **Diagnóstico:** o sistema identifica a categoria. Se o texto for ambíguo, pergunta
   "Você quis dizer A ou B?"; se não entender, pede para escolher uma cena.
3. **Causas:** explica por que o desperdício acontece.
4. **Alternativas:** apresenta soluções, com benefícios e limitações.
5. **Desafio:** pergunta de múltipla escolha sobre a melhor decisão.
6. **Avaliação:** indica acerto ou erro e explica o motivo da opção escolhida.
7. **Explicação final:** resume o aprendizado e oferece recomeçar ou jogar um minigame.

Minigames: Escolha Inteligente, Detetive do Desperdício e Construa uma Casa Eficiente.

## Escopo

**Dentro do escopo**

- As seis categorias e o fluxo de sete etapas.
- Os três minigames (com linha de corte definida no plano de desenvolvimento).
- Base de conhecimento em JSON com fontes.
- Interface acessível e responsiva, funcionando offline.
- Publicação na Vercel e cópia local para a feira.

**Fora do escopo (nesta versão)**

- Contas, login, histórico ou ranking de visitantes.
- Banco de dados ou backend.
- IA generativa (pode ser avaliada depois da feira).
- Cálculos de economia em kWh ou em reais.
- Idiomas além do português.

## Limitações conhecidas

- O reconhecimento de texto livre usa palavras-chave e sinônimos, não entende linguagem
  natural complexa (ex.: negações como "a luz **não** fica acesa"). A entrada guiada por cenas e
  a confirmação em caso de ambiguidade compensam essa limitação.
- As informações são gerais e educativas: não substituem uma avaliação técnica de uma residência
  real.
- Valores tarifários e horários de ponta variam por distribuidora e mudam com o tempo; o
  conteúdo trata desses temas de forma conceitual.
