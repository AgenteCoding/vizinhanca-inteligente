import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { Button, buttonClasses } from "../ui/Button";
import { Icon, type IconName } from "../ui/Icon";

/** Lembrete que acompanha toda pontuação (CLAUDE.md, seção 7). */
export const SCORE_NOTE = "Pontos do jogo servem só para acompanhar o seu desempenho. Não representam economia real de energia ou dinheiro.";

/** Moldura comum a todos os minigames: título da página e link de volta. */
export function GameFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Esferas de vidro ao fundo: a mesma atmosfera da página inicial. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-40 -right-40 -z-10 hidden overflow-hidden lg:block">
        <span className="orb float-a left-6 top-28 size-32 opacity-70" />
        <span className="orb orb-lime float-b right-10 top-64 size-20 opacity-80" />
        <span className="orb orb-petrol float-c bottom-24 left-24 size-14 opacity-60" />
      </div>
      <Link
        href="/jogos"
        className="mb-5 inline-flex min-h-12 items-center gap-2 rounded-full pr-3 font-semibold text-petrol-soft hover:text-petrol"
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
    <section aria-labelledby="jogo-titulo" className="glass message-enter rounded-[2rem] p-5 sm:p-8">
      <span className="grid size-14 place-items-center rounded-2xl bg-petrol text-lime shadow-[0_14px_28px_-14px_rgb(16_45_53/0.9)]">
        <Icon name={icon} className="size-7" />
      </span>
      <h1 id="jogo-titulo" ref={headingRef} tabIndex={-1} className="mt-4 text-[1.7rem] font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-petrol-soft">{description}</p>
      <h2 className="mt-6 font-semibold">Como jogar</h2>
      <ol className="mt-2 grid gap-2">
        {instructions.map((text, index) => (
          <li key={text} className="flex gap-3">
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full bg-petrol text-sm font-bold text-lime"
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
      <p className="text-sm font-semibold text-petrol-soft">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        className="h-2 overflow-hidden rounded-full bg-petrol/12"
      >
        <div className="h-full rounded-full bg-petrol transition-[width] duration-500" style={{ width: `${percent}%` }} />
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
    <div className="glass flex flex-wrap items-end gap-4 rounded-3xl p-4">
      <div className="min-w-48 flex-1">
        <GameProgress current={current} total={total} label={progressLabel} />
      </div>
      <p className="rounded-full bg-petrol px-3.5 py-1.5 text-sm font-semibold text-ice" aria-live="polite">
        <span className="text-lime">{score}</span> pontos do jogo
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
      <div className="on-dark message-enter relative overflow-hidden rounded-[2rem] bg-petrol p-5 text-ice sm:p-8">
        <span aria-hidden="true" className="orb orb-lime float-a -right-6 -top-8 size-28 opacity-90" />
        <span aria-hidden="true" className="orb float-b bottom-4 right-24 hidden size-12 opacity-50 sm:block" />
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-lime">Resultado</p>
        <h1 id="resultado-titulo" ref={headingRef} tabIndex={-1} className="relative mt-1 text-[1.7rem] font-semibold tracking-tight">
          {title}
        </h1>
        <p className="relative mt-3 text-5xl font-bold text-lime">
          {score} <span className="text-lg font-semibold text-ice">de {maxScore} pontos do jogo</span>
        </p>
        <p className="relative mt-2 max-w-xl">{headline}</p>
        <p className="relative mt-3 max-w-xl text-sm text-ice-dim">{SCORE_NOTE}</p>
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
    <section className="message-enter rounded-3xl border border-white/80 bg-surface/90 p-4 shadow-[0_18px_36px_-28px_rgb(16_45_53/0.6)] sm:p-5">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
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
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold ${look.box}`}>
      <Icon name={look.icon} className="size-5" />
      {children}
    </span>
  );
}
