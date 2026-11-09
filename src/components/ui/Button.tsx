import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

/** Botão genérico com alvo de toque de pelo menos 48px (provisório até a etapa de interface). */
export function Button({ variant = "primary", className = "", type = "button", ...props }: ButtonProps) {
  const look =
    variant === "primary"
      ? "bg-foreground text-background"
      : "border-2 border-current bg-transparent";
  return (
    <button
      type={type}
      className={`min-h-12 rounded-lg px-4 py-2 text-left font-semibold disabled:opacity-50 ${look} ${className}`}
      {...props}
    />
  );
}
