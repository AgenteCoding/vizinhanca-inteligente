import { BrandMark } from "./BrandMark";

/** Nome oficial do projeto (cabeçalho, rodapé e metadados usam esta constante). */
export const BRAND_NAME = "SmartHood AI";

const SLOT = { sm: "size-7", md: "size-9" } as const;

/**
 * Ponto único da marca: símbolo + nome.
 *
 * O símbolo atual (`BrandMark`) é PROVISÓRIO. Quando a logo oficial chegar, basta trocar o
 * conteúdo de `LogoMark` (por exemplo, por uma imagem em `public/images/`): o espaço é um
 * quadrado de tamanho fixo, então cabeçalho, rodapé e conversa não mudam de layout.
 */
export function LogoMark({ size = "md", className = "" }: { size?: keyof typeof SLOT; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center ${SLOT[size]} ${className}`} data-logo-slot="">
      <BrandMark className="size-full" />
    </span>
  );
}

/** Marca completa. `tone="dark"` é para fundos Petrol. */
export function Logo({ size = "md", tone = "light" }: { size?: keyof typeof SLOT; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <span className={`flex items-center gap-2.5 font-semibold tracking-tight ${dark ? "text-ice" : "text-petrol"}`}>
      <LogoMark size={size} className={dark ? "rounded-[28%] ring-1 ring-ice/30" : ""} />
      <span className="flex items-center gap-1.5 leading-none">
        SmartHood
        <span
          className={`rounded-md px-1.5 py-0.5 text-[0.7em] font-bold tracking-wide ${
            dark ? "bg-lime text-petrol" : "bg-petrol text-lime"
          }`}
        >
          AI
        </span>
      </span>
    </span>
  );
}
