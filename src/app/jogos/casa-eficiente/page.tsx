import type { Metadata } from "next";
import { GameFrame } from "@/components/minigames/GameShell";
import { HouseGame } from "@/components/minigames/HouseGame";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

export const metadata: Metadata = {
  title: "Construa uma Casa Eficiente",
  description: "Minigame: combine tecnologias e hábitos para deixar uma casa mais eficiente.",
};

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <GameFrame>
          <HouseGame />
        </GameFrame>
      </main>
      <SiteFooter />
    </>
  );
}
