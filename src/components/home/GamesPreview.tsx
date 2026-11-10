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

/** Os minigames ainda não foram construídos: aparecem anunciados, sem link. */
export function GamesPreview() {
  return (
    <section id="jogos" aria-labelledby="jogos-titulo" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 pb-14 sm:px-6">
      <h2 id="jogos-titulo" className="flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        <Icon name="gamepad" className="size-9 text-ai" />
        Minigames
      </h2>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">
        Para treinar o que você aprendeu no diagnóstico.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {GAMES.map((game) => (
          <li key={game.title} className="flex flex-col gap-3 rounded-3xl border-2 border-dashed border-line bg-surface/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <Icon name={game.icon} className="size-8 text-ink" />
              <span className="rounded-full bg-ai-soft px-3 py-1 text-sm font-bold text-ai">
                Em breve
              </span>
            </div>
            <h3 className="text-xl font-bold">{game.title}</h3>
            <p className="text-ink-soft">{game.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
