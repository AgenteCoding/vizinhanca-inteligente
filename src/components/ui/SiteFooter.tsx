import { Logo } from "./Logo";

/** Rodapé em Petrol Blue: fecha a página com a marca e o aviso de privacidade. */
export function SiteFooter() {
  return (
    <footer className="on-dark bg-petrol text-ice">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 border-t border-ice/10 px-4 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo size="sm" tone="dark" />
        <p className="max-w-xl text-ice-dim">
          Simulação educacional para a feira de ciências. Sem cadastro, sem rastreamento e sem
          coleta de dados.
        </p>
      </div>
    </footer>
  );
}
