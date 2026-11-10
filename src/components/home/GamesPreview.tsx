import Link from "next/link";
import { GAMES } from "../minigames/games-list";
import { Icon } from "../ui/Icon";

/** Os três minigames, com link para cada um. */
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
                <Link href={game.href} className="mt-2 inline-flex min-h-12 items-center gap-1 font-bold underline-offset-4 hover:underline">
                  Jogar
                  <Icon name="chevron" className="size-5 -rotate-90" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
