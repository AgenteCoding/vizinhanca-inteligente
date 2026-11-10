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
    primary: "border-petrol bg-petrol text-ice shadow-[0_10px_22px_-14px_rgb(16_45_53/0.8)] hover:bg-petrol-700",
    accent: "border-petrol bg-lime text-petrol shadow-[0_10px_24px_-12px_rgb(120_150_30/0.9)] hover:bg-lime-strong",
    secondary: "border-petrol/25 bg-surface/80 text-petrol hover:border-petrol hover:bg-surface",
  }[variant];
  return `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] px-5 py-2.5 text-center font-semibold leading-tight transition duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-line disabled:bg-ice-strong disabled:text-petrol-soft disabled:shadow-none disabled:active:scale-100 ${look} ${extra}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
