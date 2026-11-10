import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "accent" | "secondary";

/**
 * Classes dos botões, também usadas em links com cara de botão (`next/link`).
 * - primary: Petrol Blue com texto Ice White (ações da conversa);
 * - accent: Signal Lime (só para a ação principal da tela, com moderação);
 * - secondary: contorno Petrol Blue.
 * Altura mínima de 48px (alvo de toque confortável).
 */
export function buttonClasses(variant: ButtonVariant = "primary", extra = ""): string {
  const look = {
    primary: "border-petrol bg-petrol text-ice hover:bg-petrol-700",
    accent: "border-petrol bg-lime text-petrol hover:bg-lime-strong",
    secondary: "border-petrol/30 bg-surface text-petrol hover:border-petrol hover:bg-ice-strong",
  }[variant];
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 px-5 py-2.5 text-center font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:border-line disabled:bg-ice-strong disabled:text-petrol-soft ${look} ${extra}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
