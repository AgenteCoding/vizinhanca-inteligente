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
        className="grid size-12 place-items-center rounded-full text-petrol hover:bg-ice-strong"
      >
        <Icon name={open ? "x" : "menu"} />
        <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
      </button>
      {open ? (
        <nav
          id="menu-celular"
          aria-label="Principal"
          className="absolute inset-x-0 top-full border-b border-line bg-ice px-4 pb-4 pt-2 shadow-sm"
        >
          <ul className="grid gap-1">
            <li className="pb-2">
              <a href="#conversa" onClick={() => setOpen(false)} className={buttonClasses("primary", "w-full")}>
                Começar
              </a>
            </li>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-xl px-3 font-bold text-petrol hover:bg-ice-strong"
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
