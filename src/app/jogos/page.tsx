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
        <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <span className="orb float-a right-4 top-6 size-28 opacity-70" />
            <span className="orb orb-lime float-b right-36 top-32 hidden size-12 opacity-80 sm:block" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-petrol-soft">SmartHood AI</p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight">Minigames</h1>
          <p className="mt-2 max-w-2xl text-petrol-soft">
            Treine o que você aprendeu na conversa. Cada jogo leva poucos minutos e explica cada resposta.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {GAMES.map((game) => (
              <li key={game.href}>
                <Link
                  href={game.href}
                  className="glass lift group relative flex h-full flex-col gap-3 overflow-hidden rounded-[2rem] p-6 hover:border-petrol"
                >
                  <span aria-hidden="true" className="orb orb-lime -right-8 -top-8 size-24 opacity-60 transition-opacity group-hover:opacity-100" />
                  <span className="relative grid size-12 place-items-center rounded-2xl bg-petrol text-lime shadow-[0_14px_28px_-14px_rgb(16_45_53/0.9)]">
                    <Icon name={game.icon} className="size-6" />
                  </span>
                  <span className="relative text-lg font-semibold">{game.title}</span>
                  <span className="text-petrol-soft">{game.text}</span>
                  <span className="mt-auto inline-flex items-center gap-1 self-start rounded-full bg-petrol px-4 py-2 text-sm font-semibold text-ice transition-colors group-hover:bg-lime group-hover:text-petrol">
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
