# Guia da feira — SmartHood AI

Feira de Ciências: **14/11/2026**. Versão estável alvo: **11/11/2026**.
Este guia cobre como rodar o projeto no notebook, o que depende de internet, o roteiro de
demonstração e como voltar à última versão estável.

## 1. Versão de referência

- **Última versão do site verificada: commit `99e3cf6`** ("remove as etapas e a barra de progresso
  da conversa..."). O commit seguinte só acrescenta o servidor local (`scripts/servir.mjs`),
  o `iniciar-feira.bat` e este guia; o código do site (`src/`) não muda, então o `out/` gerado é o
  mesmo.
- Verificado em 10/11/2026: `npm run validate` com saída 0 (TypeScript, ESLint, 418 testes e build
  de 9 páginas) e execução no Chrome: seis cenários de ponta a ponta, três minigames, reinícios,
  mensagens consecutivas e longas, e o tempo mínimo de 5 s do "Pensando".
- Atenção: a referência local `origin/main` está no commit `59cb3f2`; o `99e3cf6` (sem as etapas)
  só existe neste computador enquanto não houver push (que depende de autorização).

## 2. Executar no notebook (Windows 10)

### Preparação (com internet, antes da feira)

1. Instalar o **Node.js 24** (https://nodejs.org) e conferir no terminal: `node -v` deve mostrar
   `v24.x`. **Conferir no notebook da feira, com antecedência**, que o Node abre e roda.
2. Copiar o projeto para o notebook (pasta, pen drive ou `git clone`).
3. Na pasta do projeto:

```bash
npm ci
npm run build
```

`npm ci` instala as dependências exatas do `package-lock.json`. `npm run build` gera a pasta
`out/` (o site pronto). Depois disso **não é preciso internet para usar o site**.

### Iniciar o site (dia da feira)

Opção 1, duplo clique em **`iniciar-feira.bat`** (abre o servidor e o navegador em
http://localhost:3000). Para parar, feche a janela "SmartHood AI - servidor".

Opção 2, pelo terminal:

```bash
npm run servir
```

Abra http://localhost:3000. Outra porta: `node scripts/servir.mjs 3001`.

### Cuidados

- **Não abra o `index.html` com duplo clique**: o site usa caminhos como `/_next/...` e só funciona
  por um servidor. Use sempre o passo acima.
- O servidor só escuta no próprio notebook (`127.0.0.1`); ninguém na rede consegue acessá-lo.
- Se a porta 3000 estiver ocupada, o servidor avisa; use outra porta (e abra o endereço dela).
- **Cópia mínima sem instalar nada além do Node**: basta copiar a pasta `out/` e o arquivo
  `scripts/servir.mjs` para o notebook e rodar `node scripts/servir.mjs 3000 caminho\para\out`.
  (Rodei o `servir.mjs` só no Node 24 deste computador; em outras versões do Node não foi testado.)
- Use **Chrome ou Edge atualizados**, janela em tela cheia (F11), zoom em 100 %.
- Nas configurações de energia do Windows, desative a suspensão e o desligamento da tela
  enquanto estiver na tomada.
- Mantenha uma **cópia de segurança da pasta `out/`** (pen drive): é o site pronto, funciona sem o
  Git, sem o `npm` e sem o código-fonte (basta o Node e o `servir.mjs`).

### Entre um visitante e outro

- Botão **"Novo diagnóstico"** (aparece depois da primeira mensagem) volta à tela inicial limpa.
- Nada é guardado: o texto do visitante não é salvo nem enviado. Atualizar a página (F5) também
  limpa tudo.

## 3. Dependência de internet

**Testado**: o site foi aberto no Chrome desta máquina com **todas as conexões externas
bloqueadas** (nomes que não são `localhost` não resolvem e o acesso por proxy foi desativado).
Resultado: todas as páginas carregam, o chat, os seis diagnósticos e os três minigames funcionam,
as fontes são locais e **nenhuma requisição saiu de `localhost`**. O site gerado não contém
fontes de CDN, analytics, cookies de terceiros ou imagens externas.

| Precisa de internet | Não precisa |
|---|---|
| Instalar o Node.js e rodar `npm ci` (uma vez, antes) | Usar o chat e o diagnóstico |
| Abrir os links das fontes oficiais (ANEEL, Inmetro...) que aparecem na explicação final | Minigames |
| Push para o GitHub e publicação na Vercel | Fontes, ícones, animações e fundo |

**Não foi testado**: o notebook real com o Wi-Fi desligado, o Windows 10, outros navegadores além
do Chrome e outras versões do Node. Por isso **não afirmo suporte offline completo**: faça o
ensaio no próprio notebook (seção 6). Não há PWA nem service worker; não são necessários, porque
o site roda por este servidor local.

## 4. Roteiro de demonstração (três situações)

Cada fluxo leva cerca de 25 a 30 s no ritmo normal (5 s de "Pensando" + digitação de cada
resposta). O botão **"Mostrar resposta completa"** acelera se faltar tempo. **Não prometa
economia de energia ou dinheiro**: o projeto não apresenta nenhum número desse tipo, e a
pontuação dos jogos é "pontos do jogo". Conteúdo marcado "Em revisão" ainda não foi conferido
em fonte oficial: diga isso abertamente.

Os textos abaixo foram testados e classificam a categoria esperada.

### A. Iluminação pública acesa durante o dia

- **Visitante digita:** "A luz da rua fica acesa o dia inteiro, até de manhã cedo."
- **Diagnóstico esperado:** *Iluminação pública ligada durante o dia* ("As lâmpadas dos postes
  continuam acesas de dia, quando a luz do sol já ilumina a rua").
- **Explicação científica (fonte conferida: Inmetro, relés fotocontroladores):** o relé
  fotocontrolador funciona como um sensor de luz: mede a iluminação, liga o circuito quando
  escurece e desliga quando clareia; se erra esse momento, a lâmpada fica acesa de dia e gasta
  energia sem necessidade.
- **Solução recomendada:** usar relés fotocontroladores adequados à norma (verificar e substituir
  os com defeito, instalados corretamente). Outras alternativas: inspeção e manutenção programada;
  telegestão da iluminação.
- **Limitação a citar (em revisão):** o relé precisa ser escolhido e instalado corretamente; um
  equipamento ruim, sujo ou mal posicionado pode errar o horário.
- **Desafio:** "Os postes de uma rua continuam acesos até o meio da manhã..." A resposta mais
  adequada é pedir a verificação do relé e trocá-lo por um que atenda à norma.
- **O que mostrar:** o balão do visitante, o "Pensando", a resposta sendo digitada, a sanfona
  "Como cheguei a esse diagnóstico" (palavras-chave reconhecidas), as soluções com
  vantagens e limitações, e a lista de fontes com o selo "Fonte conferida".

### B. Ar-condicionado funcionando com portas ou janelas abertas

- **Visitante digita:** "Deixo o ar condicionado ligado com a janela aberta."
- **Diagnóstico esperado:** *Ar-condicionado ligado com portas e janelas abertas*.
- **Explicação científica (EM REVISÃO, sem fonte confirmada ainda):** o ar-condicionado retira
  calor de dentro do ambiente e o leva para fora; com portas e janelas abertas, o calor de fora
  entra o tempo todo e o aparelho passa a tentar resfriar também o ar que vem de fora.
- **Solução recomendada:** manter portas e janelas fechadas durante o uso (a vantagem aparece
  com **fonte conferida**: é uma das dicas de consumo consciente da ANEEL). Também: melhorar a
  vedação e limpar os filtros.
- **Limitação a citar (em revisão):** às vezes é preciso renovar o ar; isso pode ser feito com o
  aparelho desligado ou nos intervalos de uso.
- **Desafio:** "Numa sala, o ar-condicionado está ligado e a janela está aberta porque alguém quer
  ventilar..." A resposta mais adequada é fechar a janela enquanto o ar estiver ligado e ventilar
  com o aparelho desligado.
- **O que mostrar:** o selo "Em revisão" ao lado da explicação científica, para explicar que o
  projeto separa o que já foi conferido do que ainda não foi. Boa situação para falar sobre
  transparência científica.

### C. Geladeira ou freezer de baixa eficiência energética

- **Visitante digita:** "Minha geladeira é muito antiga e gasta muita energia."
- **Diagnóstico esperado:** *Eletrodomésticos antigos ou ineficientes* (geladeiras e freezers de
  baixa eficiência).
- **Explicação científica (fontes conferidas: EPE e Selo Procel/MME):** eficiência energética é
  fazer o mesmo serviço usando menos energia; a etiqueta do Inmetro classifica os aparelhos em
  faixas, da classe A (mais eficiente) em diante, e ajuda a comparar modelos que fazem o mesmo
  serviço.
- **Solução recomendada:** comparar o consumo e a classificação na etiqueta do Inmetro do aparelho
  atual e de modelos novos, e procurar o Selo Procel, **antes** de decidir trocar. **A idade,
  sozinha, não comprova que um aparelho é ineficiente.** Outra alternativa: hábitos conscientes.
- **Limitações a citar (em revisão):** comprar um aparelho novo exige investimento e trocar um
  que ainda funciona gera descarte; aparelhos antigos podem não ter mais etiqueta ou manual.
- **Desafio:** "A geladeira da Dona Ana é bem antiga, e ela quer saber se deve trocá-la..."
  A resposta mais adequada é comparar o consumo e a classificação dela com os de modelos novos.
- **O que mostrar:** um caso em que a intuição ("é velha, então gasta muito") não basta, e a
  explicação final com as quatro fontes oficiais.

### Depois das três situações

Mostrar o menu **Minigames**: *Escolha Inteligente*, *Detetive do Desperdício* e *Construa uma
Casa Eficiente*, e voltar ao início pela logo.

## 5. Recuperar a última versão estável

O histórico do Git **não deve ser reescrito** (nada de `reset --hard` em commits já publicados,
`rebase` ou `push --force`). Os comandos abaixo só criam ramos novos ou desfazem alterações ainda
não confirmadas.

Ver a situação atual:

```bash
git status
git log --oneline -5
```

Se algo quebrar por alterações **ainda não commitadas**:

```bash
git restore caminho/do/arquivo      # volta um arquivo ao último commit
git restore .                       # volta tudo (descarta o que não foi commitado)
```

Se um commit novo causou o problema (sem apagar nada do histórico):

```bash
git revert <hash-do-commit>         # cria um commit novo que desfaz o anterior
```

Para trabalhar na versão estável sem mexer em nada do que existe:

```bash
git switch -c versao-feira 99e3cf6  # novo ramo apontando para a versão verificada
npm ci
npm run build
```

Depois, `iniciar-feira.bat`. Opcionalmente, o próprio responsável pode marcar a versão com uma
etiqueta local: `git tag feira-2026-estavel 99e3cf6` (não é publicada sem `git push`).

Plano de segurança mais forte: **copiar a pasta `out/`** da versão aprovada para um pen drive e
para uma segunda pasta (por exemplo `out-estavel`). Ela roda sem Git, sem `npm` e sem o código:
`node scripts/servir.mjs 3000 out-estavel`.

## 6. Ensaio no notebook (antes de 14/11)

1. `node -v` mostra a versão 24 e `npm ci` + `npm run build` terminam sem erro.
2. Duplo clique em `iniciar-feira.bat`: o navegador abre em http://localhost:3000.
3. **Desligue o Wi-Fi** e repita os cenários A, B e C e os três minigames.
4. Teste um relato digitado e um clique em uma das seis sugestões.
5. Feche e abra de novo; confirme que "Novo diagnóstico" volta ao início.
6. Deixe o notebook ligado na tomada por alguns minutos e confira se a tela não apaga.
7. Meça o desempenho do vidro fosco; se a máquina for lenta, reduza o `blur` da classe
   `.liquid` em `src/app/globals.css` (e gere o build de novo).
