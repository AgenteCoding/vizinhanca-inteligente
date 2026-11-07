/**
 * Frases de teste do classificador, escritas como um visitante escreveria.
 * Foram escritas antes de ajustar as palavras-chave, para não "decorar" a base.
 * Cada categoria tem frases curtas, longas, sem acento, com sinônimos e com erros de digitação.
 */
import type { ProblemCategoryId } from "@/types/knowledge";

export const PHRASES_BY_CATEGORY: Record<ProblemCategoryId, string[]> = {
  "iluminacao-publica-dia": [
    "Os postes ficam acesos durante o dia.", // caso A do pedido
    "postes acesos de dia",
    "A luz da rua não apaga de manhã, fica acesa até o meio-dia.",
    "Na minha rua as lâmpadas dos postes continuam ligadas com o sol forte.",
    "iluminacao publica ligada durante o dia na avenida",
    "Vi a iluminação pública acesa às dez da manhã na praça do bairro.",
    "O poste da esquina fica com a lâmpada acesa o dia inteiro.",
    "As luminárias da avenida ficam ligadas mesmo de dia, acho que o relé está com defeito.",
    "Postes com luz acessa de dia", // erro de digitação: "acessa"
    "Na praça perto da escola, todas as luminárias continuam acesas depois que o sol nasce e ninguém da prefeitura vem consertar a fotocélula.",
    "LUZ DA RUA ACESA DURANTE O DIA",
  ],
  "luzes-ambientes-vazios": [
    "A luz fica ligada mesmo quando ninguém está no quarto.", // caso B do pedido
    "luz acesa sem ninguem na sala",
    "Meu irmão sempre esquece a luz do banheiro acesa.",
    "Na escola as lâmpadas da sala ficam acesas no intervalo, com a sala vazia.",
    "deixam as luzes do corredor acesas a noite toda sem ninguém passando",
    "Lâmpadas acesas em quartos vazios.",
    "Quando saímos de casa esquecemos de apagar a luz da cozinha e ela fica acesa sem ninguém.",
    "A sala de aula fica vazia mas as luzes continuam ligadas",
    "lampada asesa no banheiro sem ninguem", // erro de digitação: "asesa"
    "Seria bom ter um sensor de presença no corredor, porque a luz fica acesa sem ninguém.",
    "Ninguém apaga a luz do quarto quando sai",
  ],
  "consumo-horario-pico": [
    "Todo mundo liga o chuveiro, forno e ar-condicionado ao mesmo tempo no horário de maior consumo.", // caso C
    "chuveiro e forno ligados ao mesmo tempo no horario de pico",
    "Na minha casa, no fim da tarde, liga tudo ao mesmo tempo: chuveiro, ferro de passar e máquina de lavar.",
    "Uso o ferro de passar e a máquina de lavar no horário de ponta.",
    "A família toda toma banho e cozinha na mesma hora, no horário de pico.",
    "muitos aparelhos ligados simultaneamente a noite",
    "O chuverio, o forno e a maquina de lavar ficam ligados ao mesmo tempo", // erro: "chuverio"
    "Quero entender a tarifa branca e o horário de ponta da distribuidora.",
    "No horario de pico todo mundo liga tudo",
    "Ligamos o forno elétrico e o chuveiro juntos na mesma hora, bem no pico de consumo.",
    "HORÁRIO DE PONTA COM TUDO LIGADO",
  ],
  "eletrodomesticos-ineficientes": [
    "Minha geladeira é muito antiga e consome bastante energia.", // caso D
    "geladeira velha gastando muito",
    "Meu freezer é antigo e não tem selo Procel.",
    "Quero saber se meu refrigerador antigo é eficiente pela etiqueta do Inmetro.",
    "A borracha da geladeira está velha e gasta muita energia.",
    "eletrodomesticos antigos consomem muito",
    "Minha geladera é muito velha", // erro de digitação: "geladera"
    "Os aparelhos da minha casa são todos antigos e gastam muito.",
    "Como saber pela etiqueta se um eletrodoméstico é eficiente?",
    "A geladeira e o freezer da casa da minha avó são muito antigos e gastam bastante energia, mas não sei se compensa trocar.",
    "Geladeira antiga sem selo do Procel",
  ],
  "ar-condicionado-aberto": [
    "Deixo o ar ligado com a janela aberta.", // caso E
    "ar condicionado ligado com a porta aberta",
    "Na sala de aula o ar-condicionado fica ligado com as janelas abertas.",
    "Ligam o climatizador e deixam a porta aberta.",
    "O split fica ligado e a janela aberta o dia todo.",
    "ar-condicionado com janelas e portas abertas",
    "Meu pai liga o ar condicionado com a jaenla aberta", // erro: "jaenla"
    "O filtro do ar condicionado está sujo e a janela fica aberta.",
    "Ar condicionado ligado e porta da sala aberta",
    "No escritório, o ar-condicionado fica ligado o dia inteiro com a porta aberta e o calor da rua entra.",
    "AR CONDICIONADO NO MÁXIMO COM A JANELA ABERTA",
  ],
  "solar-sem-geracao": [
    "Minha casa recebe bastante sol, mas não possui painéis solares.", // caso F
    "casa com muito sol e sem placa solar",
    "A casa da minha tia é bem ensolarada e não tem painel solar.",
    "Queria instalar painéis fotovoltaicos na minha casa ensolarada.",
    "Nossa casa não tem placa solar, mas bate sol no telhado a tarde toda.",
    "energia solar vale a pena pra minha casa?",
    "Moro numa cidade muito ensolarada e queria gerar energia solar em casa.",
    "Quero entender a geração distribuída com placas solares no telhado.",
    "casa sem painel solar e com muito sol",
    "Minha escola tem um telhado enorme que recebe sol o dia inteiro, e eu queria saber se dá para instalar placas fotovoltaicas para gerar energia.",
    "SISTEMA FOTOVOLTAICO NO TELHADO",
  ],
};

/** Relatos com sinais de duas categorias em equilíbrio: o sistema deve pedir esclarecimento. */
export const AMBIGUOUS_PHRASES: string[] = [
  "O poste da rua fica aceso de dia e a luz do quarto fica acesa sem ninguém.",
  "A geladeira é velha e o ar condicionado fica ligado com a janela aberta.",
  "Tem poste aceso de dia e geladeira antiga gastando muito.",
];

/** Relatos sem relação com energia: não pode haver categoria. */
export const UNRELATED_PHRASES: string[] = [
  "Gosto de jogar futebol com meus amigos.",
  "Qual é a capital do Brasil?",
  "Hoje choveu muito na minha cidade.",
  "Meu cachorro late a noite inteira.",
];

/** Relatos que negam a própria situação: sem classificação confiante. */
export const NEGATED_PHRASES: string[] = [
  "Os postes não ficam acesos durante o dia.",
  "Aqui em casa ninguém deixa a luz acesa, nunca esquecemos de apagar.",
  "Eu não deixo o ar condicionado ligado com a janela aberta.",
  "Minha geladeira não é antiga e nem gasta muito.",
];

/**
 * Limitação documentada: a falta de algo também é dita com negação ("não temos energia solar").
 * Quando a frase não bate com um termo da base que já inclui a negação (ex.: "nao tem painel"),
 * o classificador não interpreta o contexto e pede esclarecimento em vez de arriscar.
 */
export const NEGATION_LIMITATION_PHRASES: string[] = [
  "O telhado pega sol o dia todo e não temos energia solar.",
  "Moro numa cidade muito ensolarada e ainda não gero energia solar.",
  "Minha escola tem um telhado enorme, mas não tem nenhum painel solar instalado.",
];
