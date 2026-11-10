import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";

/** Barra superior: a marca leva sempre ao início; à direita, ações da página. */
export function SiteHeader({
  children,
  compactOnMobile = false,
}: {
  children?: ReactNode;
  /** No celular, mostra só o símbolo da marca para dar espaço às ações. */
  compactOnMobile?: boolean;
}) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-h-12 items-center gap-3 rounded-xl pr-2 text-lg font-extrabold tracking-tight text-ink"
        >
          <BrandMark className="size-10 shrink-0" />
          <span className={compactOnMobile ? "sr-only leading-tight sm:not-sr-only" : "leading-tight"}>
            Vizinhança Inteligente
          </span>
        </Link>
        {children ? <div className="flex items-center gap-2">{children}</div> : null}
      </div>
    </header>
  );
}
