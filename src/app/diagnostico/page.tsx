import type { Metadata } from "next";
import { ChatExperience } from "@/components/assistant/ChatExperience";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata: Metadata = {
  title: "Diagnóstico",
  description: "Converse com o assistente sobre um desperdício de energia: causas, soluções e o porquê de cada uma.",
};

// Mantida para os links antigos: a mesma conversa da página inicial, sem as seções extras.
export default function DiagnosticoPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section id="conversa" aria-label="Conversa com o assistente" className="scroll-mt-20">
          <ChatExperience />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
