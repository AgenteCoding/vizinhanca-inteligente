/** Marca do projeto: uma casa com o ponto verde-limão da energia bem usada. */
export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="9" fill="var(--color-ink)" />
      <path
        d="M7.5 15.5L16 8.5l8.5 7"
        fill="none"
        stroke="var(--color-lime)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 14.5V23.5h11v-9"
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19" r="2.4" fill="var(--color-lime)" />
    </svg>
  );
}
