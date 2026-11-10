import Link from "next/link";
import { GAMES } from "../minigames/games-list";
import { buttonClasses } from "../ui/Button";
import { Icon } from "../ui/Icon";

/** Os três minigames, com link para cada um (painel de vidro na parte escura da página). */
export function GamesPreview() {
  return (
    <section id="minigames" aria-labelledby="minigames-titulo" className="glass-dark scroll-mt-24 rounded-3xl p-5 sm:p-6">
      <h2 id="minigames-titulo" className="text-lg font-semibold text-ice">
        Minigames
      </h2>
      <p className="mt-1 text-[0.95rem] text-ice-dim">Para treinar o que você aprendeu na conversa.</p>
      <ul className="mt-3 grid gap-1">
        {GAMES.map((game) => (
          <li key={game.title}>
            <Link
              href={game.href}
              className="group -mx-2 flex min-h-12 items-start gap-3 rounded-2xl px-2 py-2 text-ice transition-colors hover:bg-ice/10"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ice/10 text-lime transition-colors group-hover:bg-lime group-hover:text-petrol">
                <Icon name={game.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.95rem] font-semibold leading-snug">{game.title}</span>
                <span className="mt-0.5 block text-sm text-ice-dim">{game.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/jogos" className={buttonClasses("accent", "mt-4 w-full")}>
        <Icon name="gamepad" className="size-5" />
        Ver todos os minigames
      </Link>
    </section>
  );
}
