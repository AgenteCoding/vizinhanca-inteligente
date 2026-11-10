const STEPS: { title: string; text: string }[] = [
  { title: "Conte o que viu", text: "Escreva com suas palavras ou escolha uma das seis situações." },
  { title: "Diagnóstico", text: "O assistente reconhece palavras-chave e mostra como chegou à situação." },
  { title: "Causas e soluções", text: "Você entende o porquê do desperdício e compara as alternativas." },
  { title: "Desafio e explicação", text: "Você decide, recebe uma avaliação e uma explicação com fontes." },
];

/** Como o assistente funciona, em quatro passos (painel de vidro na parte escura da página). */
export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="glass-dark scroll-mt-24 rounded-3xl p-5 sm:p-6">
      <h2 id="como-funciona-titulo" className="text-lg font-semibold text-ice">
        Como funciona
      </h2>
      <ol className="mt-4 grid gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-lime text-sm font-bold text-petrol">
              {index + 1}
            </span>
            <div>
              <h3 className="font-semibold text-ice">{step.title}</h3>
              <p className="mt-0.5 text-[0.95rem] text-ice-dim">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Nota de transparência: que tipo de "inteligência" é esta. */
export function HowItWorksNote() {
  return (
    <p className="mx-auto max-w-3xl text-center text-sm text-ice-dim">
      A inteligência deste projeto é um sistema especialista: segue regras e palavras-chave, sempre
      do mesmo jeito, e mostra o próprio raciocínio. As explicações citam fontes oficiais; o que
      ainda não foi conferido aparece marcado como em revisão.
    </p>
  );
}
