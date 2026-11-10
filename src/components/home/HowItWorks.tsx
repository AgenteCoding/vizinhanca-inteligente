import { Icon, type IconName } from "../ui/Icon";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "chat",
    title: "Conte o que você viu",
    text: "Escreva com suas palavras ou escolha uma das seis situações.",
  },
  {
    icon: "scan",
    title: "A IA identifica a situação",
    text: "Ela reconhece palavras-chave e mostra como chegou ao diagnóstico.",
  },
  {
    icon: "search",
    title: "Entenda causas e soluções",
    text: "Veja por que o desperdício acontece e compare as alternativas.",
  },
  {
    icon: "star",
    title: "Tome a decisão",
    text: "Responda ao desafio e receba uma explicação com fontes oficiais.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="como-funciona-titulo" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Como funciona
        </h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full border-2 border-ink bg-lime text-lg font-extrabold">
                  {index + 1}
                </span>
                <Icon name={step.icon} className="size-7 text-ai" />
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
