import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fontes salvas no próprio projeto (src/app/fonts, licença SIL OFL 1.1): o build e o site
// funcionam sem internet. Atkinson Hyperlegible foi criada pelo Braille Institute para
// leitura fácil, inclusive por pessoas com baixa visão.
const atkinson = localFont({
  src: "./fonts/atkinson-hyperlegible-next-latin.woff2",
  weight: "200 800",
  variable: "--font-atkinson",
  display: "swap",
});

const atkinsonMono = localFont({
  src: "./fonts/atkinson-hyperlegible-mono-latin.woff2",
  weight: "400 700",
  variable: "--font-atkinson-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vizinhança Inteligente",
    template: "%s | Vizinhança Inteligente",
  },
  description:
    "Simulação educacional de uma inteligência artificial que ajuda a identificar e resolver desperdícios de energia em uma vizinhança.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f3d2e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${atkinson.variable} ${atkinsonMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
