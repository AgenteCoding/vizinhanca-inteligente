import type { IconName } from "../ui/Icon";

/** Os três minigames: usados na página /jogos e na seção da página inicial. */
export const GAMES: { href: "/jogos/escolha-inteligente" | "/jogos/detetive" | "/jogos/casa-eficiente"; icon: IconName; title: string; text: string }[] = [
  {
    href: "/jogos/escolha-inteligente",
    icon: "star",
    title: "Escolha Inteligente",
    text: "Leia a situação e escolha a melhor solução entre três alternativas.",
  },
  {
    href: "/jogos/detetive",
    icon: "search",
    title: "Detetive do Desperdício",
    text: "Investigue uma casa, cômodo por cômodo, e descubra o que é desperdício.",
  },
  {
    href: "/jogos/casa-eficiente",
    icon: "home",
    title: "Construa uma Casa Eficiente",
    text: "Combine tecnologias e hábitos e veja quais problemas você resolve.",
  },
];
