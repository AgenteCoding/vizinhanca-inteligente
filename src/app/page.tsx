import { ChatExperience } from "@/components/assistant/ChatExperience";
import { EnergyScene } from "@/components/home/EnergyScene";
import { GamesPreview } from "@/components/home/GamesPreview";
import { HowItWorks, HowItWorksNote } from "@/components/home/HowItWorks";
import { SituationGrid } from "@/components/home/SituationGrid";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { knowledgeBase } from "@/data";

// Página inicial chat-first: a conversa com o assistente vem primeiro. A parte de baixo é uma
// faixa em Petrol Blue com a cena animada e três painéis compactos (como funciona, situações e
// minigames). Tudo abaixo da conversa é estático (lido e validado no build, sem JS extra).
export default function Home() {
  const situations = knowledgeBase.problems.map(({ id, title, summary }) => ({ id, title, summary }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section id="conversa" aria-label="Conversa com o assistente" className="relative scroll-mt-24">
          {/* Esferas de vidro ao fundo da conversa: decorativas, não recebem cliques. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <span className="orb float-a -left-10 top-24 size-40 opacity-70 lg:left-[6%]" />
            <span className="orb orb-lime float-b -right-6 top-40 size-24 opacity-80 lg:right-[9%]" />
            <span className="orb orb-petrol float-c left-[11%] top-[30rem] hidden size-14 opacity-60 xl:block" />
          </div>
          <ChatExperience />
        </section>

        <section aria-labelledby="vizinhanca-titulo" className="on-dark relative mt-6 overflow-hidden rounded-t-[2.5rem] bg-petrol text-ice">
          {/* Luz suave por trás da cena. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(46rem_22rem_at_50%_38%,rgb(47_100_114/0.65),transparent_70%)]"
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lime">Energia, tecnologia e bons hábitos</p>
              <h2 id="vizinhanca-titulo" className="mt-3 text-2xl font-semibold sm:text-3xl">
                Uma vizinhança inteligente começa com boas decisões
              </h2>
              <p className="mt-3 text-ice-dim">
                Cada casa conectada à mesma ideia: entender onde a energia se perde e escolher a melhor forma de usá-la.
              </p>
            </div>
            <EnergyScene />
            <div className="mt-2 grid gap-4 lg:grid-cols-3">
              <HowItWorks />
              <SituationGrid situations={situations} />
              <GamesPreview />
            </div>
            <div className="mt-8">
              <HowItWorksNote />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
