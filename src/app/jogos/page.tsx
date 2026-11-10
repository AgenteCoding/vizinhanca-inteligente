import type { Metadata } from "next";
import Link from "next/link";
import { GAMES } from "@/components/minigames/games-list";
import { SCORE_NOTE } from "@/components/minigames/GameShell";
import { Icon } from "@/components/ui/Icon";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata: Metadata = {
  title: "Minigames",
  description: "Três minigames para treinar o que você aprendeu sobre eficiência energética.",
};

export default function JogosPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Minigames</h1>
          <p className="mt-2 max-w-2xl text-lg text-petrol-soft">
            Treine o que você aprendeu na conversa. Cada jogo leva poucos minutos e explica cada resposta.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {GAMES.map((game) => (
              <li key={game.href}>
                <Link
                  href={game.href}
                  className="flex h-full flex-col gap-3 rounded-3xl border-2 border-line bg-surface p-5 transition-colors hover:border-petrol"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-petrol text-lime">
                    <Icon name={game.icon} className="size-6" />
                  </span>
                  <span className="text-xl font-bold">{game.title}</span>
                  <span className="text-petrol-soft">{game.text}</span>
                  <span className="mt-auto inline-flex items-center gap-1 font-bold">
                    Jogar
                    <Icon name="chevron" className="size-5 -rotate-90" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-sm text-petrol-soft">{SCORE_NOTE} Nada fica salvo: ao sair, o jogo recomeça.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
