import type { Metadata } from "next";
import { GameFrame } from "@/components/minigames/GameShell";
import { ChoiceGame } from "@/components/minigames/ChoiceGame";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata: Metadata = {
  title: "Escolha Inteligente",
  description: "Minigame: escolha a melhor solução para cada situação de desperdício de energia.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <GameFrame>
          <ChoiceGame />
        </GameFrame>
      </main>
      <SiteFooter />
    </>
  );
}
