import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary";

/**
 * Classes dos botões, também usadas em links com cara de botão (`next/link`).
 * Primário: verde-limão com borda e texto verde-escuro. Secundário: contorno verde-escuro.
 * Altura mínima de 48px (alvo de toque confortável).
 */
export function buttonClasses(variant: ButtonVariant = "primary", extra = ""): string {
  const look =
    variant === "primary"
      ? "border-ink bg-lime text-ink hover:bg-lime-strong"
      : "border-ink bg-surface text-ink hover:bg-paper";
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 px-5 py-2.5 text-center font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-ink-soft ${look} ${extra}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
