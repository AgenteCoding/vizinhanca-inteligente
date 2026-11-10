import type { Metadata } from "next";
import { GameFrame } from "@/components/minigames/GameShell";
import { DetectiveGame } from "@/components/minigames/DetectiveGame";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata: Metadata = {
  title: "Detetive do Desperdício",
  description: "Minigame: investigue uma casa e descubra o que é desperdício de energia.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <GameFrame>
          <DetectiveGame />
        </GameFrame>
      </main>
      <SiteFooter />
    </>
  );
}
