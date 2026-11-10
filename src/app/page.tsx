import Link from "next/link";
import { GamesPreview } from "@/components/home/GamesPreview";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Purpose } from "@/components/home/Purpose";
import { SituationGrid } from "@/components/home/SituationGrid";
import { buttonClasses } from "@/components/ui/Button";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { knowledgeBase } from "@/data";

// Página estática: os dados são lidos e validados no build (Server Component, sem JS extra).
export default function Home() {
  const situations = knowledgeBase.problems.map(({ id, title, summary }) => ({ id, title, summary }));

  return (
    <>
      <SiteHeader>
        <nav aria-label="Seções da página" className="hidden items-center gap-1 md:flex">
          <a href="#como-funciona" className="flex min-h-12 items-center rounded-lg px-3 font-bold hover:bg-paper">
            Como funciona
          </a>
          <a href="#situacoes" className="flex min-h-12 items-center rounded-lg px-3 font-bold hover:bg-paper">
            Situações
          </a>
          <a href="#jogos" className="flex min-h-12 items-center rounded-lg px-3 font-bold hover:bg-paper">
            Minigames
          </a>
        </nav>
        <div className="hidden sm:block">
          <Link href="/diagnostico" className={buttonClasses("primary")}>
            Começar
          </Link>
        </div>
      </SiteHeader>
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <SituationGrid situations={situations} />
        <GamesPreview />
        <Purpose sourceCount={knowledgeBase.sources.length} />
      </main>
      <SiteFooter />
    </>
  );
}
