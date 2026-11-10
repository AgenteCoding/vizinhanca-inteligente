import { BrandMark } from "./BrandMark";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-petrol-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 font-bold text-petrol">
          <BrandMark className="size-6" />
          Vizinhança Inteligente
        </p>
        <p>
          Simulação educacional para a feira de ciências. Sem cadastro, sem rastreamento e sem
          coleta de dados.
        </p>
      </div>
    </footer>
  );
}
