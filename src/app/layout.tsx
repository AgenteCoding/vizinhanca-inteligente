import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BRAND_NAME } from "@/components/ui/Logo";
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

const DESCRIPTION =
  "SmartHood AI: assistente educacional, baseado em regras e fontes oficiais, que ajuda a identificar e resolver desperdícios de energia em uma vizinhança.";

export const metadata: Metadata = {
  title: {
    default: BRAND_NAME,
    template: `%s | ${BRAND_NAME}`,
  },
  applicationName: BRAND_NAME,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: BRAND_NAME,
    title: BRAND_NAME,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Teclado virtual: a página se redimensiona e o campo de conversa não fica coberto.
  interactiveWidget: "resizes-content",
  themeColor: "#102d35",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${atkinson.variable} ${atkinsonMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
