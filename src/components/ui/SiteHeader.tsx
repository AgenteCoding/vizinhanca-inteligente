import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { buttonClasses } from "./Button";
import { MobileMenu } from "./MobileMenu";

/** Links da navegação (os mesmos no computador e no menu do celular). */
export const NAV_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#situacoes", label: "Situações" },
  { href: "/#minigames", label: "Minigames" },
];

/** Barra superior discreta: marca, três links e o botão "Começar". Sem login nem cadastro. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-ice/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className="flex min-h-12 items-center gap-2.5 rounded-xl pr-2 font-extrabold tracking-tight text-petrol"
        >
          <BrandMark className="size-9 shrink-0" />
          <span className="leading-tight">Vizinhança Inteligente</span>
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-12 items-center rounded-full px-4 font-bold text-petrol-soft transition-colors hover:bg-ice-strong hover:text-petrol"
            >
              {link.label}
            </Link>
          ))}
          <a href="#conversa" className={buttonClasses("primary", "ml-2 min-h-11 px-5")}>
            Começar
          </a>
        </nav>
        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
