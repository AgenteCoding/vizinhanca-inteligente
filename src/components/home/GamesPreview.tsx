import { Icon, type IconName } from "../ui/Icon";

const GAMES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "star",
    title: "Escolha Inteligente",
    text: "Leia a situação e escolha a melhor solução entre três alternativas.",
  },
  {
    icon: "search",
    title: "Detetive do Desperdício",
    text: "Procure os desperdícios escondidos em uma casa fictícia.",
  },
  {
    icon: "home",
    title: "Construa uma Casa Eficiente",
    text: "Escolha tecnologias e descubra quais problemas você resolve.",
  },
];

/** Os três minigames. Ainda não foram construídos: aparecem anunciados, sem link. */
export function GamesPreview() {
  return (
    <section id="minigames" aria-labelledby="minigames-titulo" className="scroll-mt-20 border-t border-line/70">
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <h2 id="minigames-titulo" className="text-2xl font-extrabold tracking-tight">
          Minigames
        </h2>
        <p className="mt-2 max-w-2xl text-petrol-soft">Para treinar o que você aprendeu na conversa.</p>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {GAMES.map((game) => (
            <li key={game.title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ice-strong">
                <Icon name={game.icon} className="size-5" />
              </span>
              <div>
                <h3 className="font-bold">{game.title}</h3>
                <p className="mt-1 text-petrol-soft">{game.text}</p>
                <p className="mt-2 inline-flex rounded-full border border-dashed border-petrol/40 px-2.5 py-0.5 text-sm font-bold text-petrol-soft">
                  Em breve
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
