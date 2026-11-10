const STEPS: { title: string; text: string }[] = [
  { title: "Conte o que viu", text: "Escreva com suas palavras ou escolha uma das seis situações." },
  { title: "Diagnóstico", text: "O assistente reconhece palavras-chave e mostra como chegou à situação." },
  { title: "Causas e soluções", text: "Você entende o porquê do desperdício e compara as alternativas." },
  { title: "Desafio e explicação", text: "Você decide, recebe uma avaliação e uma explicação com fontes." },
];

/** Como o assistente funciona, em quatro passos (seção secundária da página inicial). */
export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="scroll-mt-20 border-t border-line/70">
      <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <h2 id="como-funciona-titulo" className="text-2xl font-extrabold tracking-tight">
          Como funciona
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-petrol text-sm font-extrabold text-ice">
                {index + 1}
              </span>
              <div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="mt-1 text-petrol-soft">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-3xl text-sm text-petrol-soft">
          A inteligência deste projeto é um sistema especialista: segue regras e palavras-chave,
          sempre do mesmo jeito, e mostra o próprio raciocínio. As explicações citam fontes oficiais;
          o que ainda não foi conferido aparece marcado como em revisão.
        </p>
      </div>
    </section>
  );
}
