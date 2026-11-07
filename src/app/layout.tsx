import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

// next/font embute a fonte no build: nenhuma requisição externa em tempo de uso,
// o que mantém o site funcionando offline.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vizinhança Inteligente",
  description:
    "Simulação educacional de uma inteligência artificial que ajuda a identificar e resolver desperdícios de energia em uma vizinhança.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
