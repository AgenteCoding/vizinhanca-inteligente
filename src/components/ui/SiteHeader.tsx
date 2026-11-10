import Link from "next/link";
import { buttonClasses } from "./Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

/** Links da navegação (os mesmos no computador e no menu do celular). */
export const NAV_LINKS = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/#situacoes", label: "Situações" },
  { href: "/jogos", label: "Minigames" },
];

/** Barra superior flutuante em vidro: marca, três links e o botão "Começar". Sem login. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5">
      <div className="glass relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-full py-1.5 pl-3 pr-2 sm:pl-4">
        <Link href="/" className="flex min-h-12 items-center rounded-full pr-2 text-[1.05rem]">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center rounded-full px-4 text-[0.95rem] font-semibold text-petrol-soft transition-colors hover:bg-petrol/8 hover:text-petrol"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/#conversa" className={buttonClasses("accent", "ml-2 min-h-11 px-5 text-[0.95rem]")}>
            Começar
          </Link>
        </nav>
        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
