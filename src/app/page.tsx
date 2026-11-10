import { ChatExperience } from "@/components/assistant/ChatExperience";
import { GamesPreview } from "@/components/home/GamesPreview";
import { HowItWorks } from "@/components/home/HowItWorks";
import { SituationGrid } from "@/components/home/SituationGrid";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { knowledgeBase } from "@/data";

// Página inicial chat-first: a conversa com o assistente vem primeiro; o resto é secundário.
// As seções abaixo são estáticas (dados lidos e validados no build, sem JS extra).
export default function Home() {
  const situations = knowledgeBase.problems.map(({ id, title, summary }) => ({ id, title, summary }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section id="conversa" aria-label="Conversa com o assistente" className="scroll-mt-20">
          <ChatExperience />
        </section>
        <HowItWorks />
        <SituationGrid situations={situations} />
        <GamesPreview />
      </main>
      <SiteFooter />
    </>
  );
}
