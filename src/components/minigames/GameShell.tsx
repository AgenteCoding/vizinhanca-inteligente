import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { Button, buttonClasses } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";

/** Lembrete que acompanha toda pontuação (CLAUDE.md, seção 7). */
export const SCORE_NOTE = "Pontos do jogo servem só para acompanhar o seu desempenho. Não representam economia real de energia ou dinheiro.";

/** Moldura comum a todos os minigames: título da página e link de volta. */
export function GameFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/jogos"
        className="mb-5 inline-flex min-h-12 items-center gap-2 rounded-full pr-3 font-bold text-petrol-soft hover:text-petrol"
      >
        <Icon name="chevron" className="size-5 rotate-90" />
        Voltar aos minigames
      </Link>
      {children}
    </div>
  );
}

/** Tela de apresentação: o que é o jogo, como jogar e o botão para começar. */
export function GameIntro({
  icon,
  title,
  description,
  instructions,
  onStart,
  headingRef,
}: {
  icon: IconName;
  title: string;
  description: string;
  instructions: string[];
  onStart: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <section aria-labelledby="jogo-titulo" className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
      <span className="grid size-14 place-items-center rounded-2xl bg-petrol text-lime">
        <Icon name={icon} className="size-7" />
      </span>
      <h1 id="jogo-titulo" ref={headingRef} tabIndex={-1} className="mt-4 text-3xl font-extrabold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-lg text-petrol-soft">{description}</p>
      <h2 className="mt-6 font-bold">Como jogar</h2>
      <ol className="mt-2 grid gap-2">
        {instructions.map((text, index) => (
          <li key={text} className="flex gap-3">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-ice-strong text-sm font-extrabold"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm text-petrol-soft">{SCORE_NOTE}</p>
      <Button variant="accent" className="mt-6" onClick={onStart}>
        <Icon name="gamepad" className="size-5" />
        Começar o jogo
      </Button>
    </section>
  );
}

/** Indicador de progresso com texto e barra (a barra é só um reforço visual). */
export function GameProgress({ current, total, label }: { current: number; total: number; label: string }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-bold text-petrol-soft">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        className="h-2.5 overflow-hidden rounded-full bg-ice-strong"
      >
        <div className="h-full rounded-full bg-petrol transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Barra do jogo em andamento: progresso, pontos e o botão "Recomeçar" sempre visível. */
export function GameToolbar({
  current,
  total,
  progressLabel,
  score,
  onRestart,
}: {
  current: number;
  total: number;
  progressLabel: string;
  score: number;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-surface p-4">
      <div className="min-w-48 flex-1">
        <GameProgress current={current} total={total} label={progressLabel} />
      </div>
      <p className="font-bold" aria-live="polite">
        {score} pontos do jogo
      </p>
      <Button variant="secondary" className="min-h-12 px-4" onClick={onRestart}>
        <Icon name="restart" className="size-5" />
        Recomeçar
      </Button>
    </div>
  );
}

/** Tela final: pontuação, conteúdo do resumo e as duas saídas (jogar de novo ou voltar). */
export function GameResult({
  title,
  score,
  maxScore,
  headline,
  onRestart,
  headingRef,
  children,
}: {
  title: string;
  score: number;
  maxScore: number;
  headline: string;
  onRestart: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby="resultado-titulo" className="grid gap-5">
      <div className="on-dark rounded-3xl bg-petrol p-5 text-ice sm:p-8">
        <p className="font-bold text-lime">Resultado</p>
        <h1 id="resultado-titulo" ref={headingRef} tabIndex={-1} className="mt-1 text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-4xl font-extrabold">
          {score} <span className="text-xl font-bold">de {maxScore} pontos do jogo</span>
        </p>
        <p className="mt-2 text-lg">{headline}</p>
        <p className="mt-3 text-sm text-ice/80">{SCORE_NOTE}</p>
      </div>
      {children}
      <div className="flex flex-wrap gap-3">
        <Button variant="accent" onClick={onRestart}>
          <Icon name="restart" className="size-5" />
          Jogar novamente
        </Button>
        <Link href="/jogos" className={buttonClasses("secondary")}>
          <Icon name="gamepad" className="size-5" />
          Voltar aos minigames
        </Link>
      </div>
    </section>
  );
}

/** Bloco de conteúdo do resultado. */
export function ResultSection({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <Icon name={icon} className="size-5" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Selo de acerto/erro com ícone e texto (nunca só cor). */
export function VerdictBadge({ tone, children }: { tone: "right" | "partial" | "wrong"; children: ReactNode }) {
  const look = {
    right: { box: "border-petrol bg-lime/50 text-petrol", icon: "check-circle" as const },
    partial: { box: "border-dashed border-petrol/50 bg-ice-strong text-petrol", icon: "minus-circle" as const },
    wrong: { box: "border-wrong/40 bg-wrong-soft text-wrong", icon: "x-circle" as const },
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold ${look.box}`}>
      <Icon name={look.icon} className="size-5" />
      {children}
    </span>
  );
}
