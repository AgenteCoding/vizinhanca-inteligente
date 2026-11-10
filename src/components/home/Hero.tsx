import Link from "next/link";
import { buttonClasses } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { NeighborhoodMap } from "./NeighborhoodMap";

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:pb-20 lg:pt-16">
      <div>
        <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          Vizinhança Inteligente
        </h1>
        <p className="mt-5 max-w-xl text-xl leading-relaxed text-ink-soft sm:text-2xl">
          Uma inteligência artificial que encontra desperdícios de energia na vizinhança e ajuda
          você a decidir a melhor solução.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/diagnostico" className={buttonClasses("primary", "w-full px-6 text-lg sm:w-auto")}>
            <Icon name="scan" />
            Começar o diagnóstico
          </Link>
          <a href="#situacoes" className={buttonClasses("secondary", "w-full px-6 text-lg sm:w-auto")}>
            Ver as seis situações
          </a>
        </div>
        <p className="mt-6 flex items-center gap-2 text-ink-soft">
          <Icon name="lock" className="size-5" />
          Sem cadastro. Nada do que você escreve é guardado.
        </p>
      </div>
      <NeighborhoodMap />
    </section>
  );
}
