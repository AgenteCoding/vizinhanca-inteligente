"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClasses } from "./Button";
import { Icon } from "./Icon";

/** Menu do celular: abre e fecha com o botão, com Esc ou ao escolher um link. */
export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-celular"
        onClick={() => setOpen((value) => !value)}
        className="grid size-12 place-items-center rounded-full text-petrol transition-colors hover:bg-petrol/8"
      >
        <Icon name={open ? "x" : "menu"} />
        <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
      </button>
      {open ? (
        <nav
          id="menu-celular"
          aria-label="Principal"
          // Fundo quase sólido: o menu abre por cima do conteúdo e precisa de leitura garantida.
          className="message-enter absolute inset-x-0 top-full mt-2 rounded-3xl border border-white/80 bg-surface/95 p-3 shadow-[0_24px_48px_-24px_rgb(16_45_53/0.45)] backdrop-blur-xl"
        >
          <ul className="grid gap-1">
            <li className="pb-2">
              <Link href="/#conversa" onClick={() => setOpen(false)} className={buttonClasses("accent", "w-full")}>
                Começar
              </Link>
            </li>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-2xl px-3 font-semibold text-petrol hover:bg-petrol/8"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
