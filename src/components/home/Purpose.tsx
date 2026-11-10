import Link from "next/link";
import { buttonClasses } from "../ui/Button";

/** Objetivo educacional e transparência sobre como a "IA" funciona. */
export function Purpose({ sourceCount }: { sourceCount: number }) {
  return (
    <section aria-labelledby="objetivo-titulo" className="bg-ink text-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 id="objetivo-titulo" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Aprender a decidir, não só ver a resposta
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-paper/85">
            Cada situação mostra por que o desperdício acontece, quais soluções existem, as
            vantagens e as limitações de cada uma. No fim, você escolhe e recebe uma explicação.
          </p>
          <Link href="/diagnostico" className={buttonClasses("primary", "mt-8")}>
            Começar o diagnóstico
          </Link>
        </div>
        <div className="grid gap-6">
          <div className="rounded-3xl border border-paper/25 p-6">
            <h3 className="text-xl font-bold text-lime">Uma IA que mostra o raciocínio</h3>
            <p className="mt-2 text-paper/85">
              Este projeto usa um sistema especialista: ele segue regras e palavras-chave, sempre
              do mesmo jeito, e mostra em cada diagnóstico quais palavras reconheceu.
            </p>
          </div>
          <div className="rounded-3xl border border-paper/25 p-6">
            <h3 className="text-xl font-bold text-lime">Informação com fonte</h3>
            <p className="mt-2 text-paper/85">
              As explicações citam {sourceCount} fontes oficiais, como ANEEL, Inmetro, Procel, EPE
              e INPE. O que ainda não foi conferido aparece marcado como em revisão.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
