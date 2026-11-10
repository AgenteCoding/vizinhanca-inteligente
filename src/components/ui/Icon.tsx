import type { ReactNode, SVGProps } from "react";

/**
 * Ícones próprios do projeto (traço de 2px numa grade de 24px), sem biblioteca externa.
 * São sempre decorativos: o significado vem do texto ao lado (acessibilidade).
 */
export const ICON_PATHS = {
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.7 2.7L16.2 9.5" />
    </>
  ),
  "x-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  "minus-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  review: (
    <>
      <path d="M10.3 4.2L2.8 17.5a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5h.01" />
    </>
  ),
  restart: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 8.5-8.5c-2.4 0-4.6 1-6.2 2.6L3.5 8.5" />
      <path d="M3.5 3.5v5h5" />
    </>
  ),
  streetlight: (
    <>
      <path d="M8 21.5h5M10.5 21.5V6a2.5 2.5 0 0 1 2.5-2.5h3" />
      <path d="M14.5 3.5h5l-1.2 3h-2.6z" />
      <path d="M17 9.5v2M20.5 9l1 1.2M13.5 9l-1 1.2" />
    </>
  ),
  bulb: (
    <>
      <path d="M9.5 18.5h5M10.5 21.5h3" />
      <path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.7.5 1.1 1.3 1.1 2.2v.1h5.6v-.1c0-.9.4-1.7 1.1-2.2A6.5 6.5 0 0 0 12 2.5z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  fridge: (
    <>
      <rect x="5.5" y="2.5" width="13" height="19" rx="2" />
      <path d="M5.5 9.5h13M9 5.5v1.5M9 12.5v3" />
    </>
  ),
  ac: (
    <>
      <rect x="2.5" y="4.5" width="19" height="8" rx="2" />
      <path d="M6 9.5h12" />
      <path d="M7.5 15.5c.8 1.2-.8 2.3 0 3.5M12 15.5c.8 1.2-.8 2.3 0 3.5M16.5 15.5c.8 1.2-.8 2.3 0 3.5" />
    </>
  ),
  solar: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <path d="M6 1.5v.6M6 9.9v.6M1.5 6h.6M9.9 6h.6M2.8 2.8l.4.4M8.8 2.8l-.4.4M2.8 9.2l.4-.4" />
      <path d="M9.5 12.5h11.5l-2.5 8H7z" />
      <path d="M13.3 12.5l-2.5 8M17.2 12.5l-2.5 8M8.2 16.5h11.6" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" />
    </>
  ),
  scan: (
    <>
      <path d="M3.5 8V5A1.5 1.5 0 0 1 5 3.5h3M16 3.5h3A1.5 1.5 0 0 1 20.5 5v3M20.5 16v3a1.5 1.5 0 0 1-1.5 1.5h-3M8 20.5H5A1.5 1.5 0 0 1 3.5 19v-3" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5l5 5" />
    </>
  ),
  ripple: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 20c-.5-9 5-15.5 15-16-.5 10-6.5 15.5-15 16z" />
      <path d="M5 20c2.5-4.5 5.5-7.5 9-9.5" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10.5 3v6.5L5 18.8A1.5 1.5 0 0 0 6.3 21h11.4a1.5 1.5 0 0 0 1.3-2.2L13.5 9.5V3" />
      <path d="M7.5 15.5h9" />
    </>
  ),
  gamepad: (
    <>
      <rect x="2.5" y="7" width="19" height="11" rx="4.5" />
      <path d="M7 12.5h4M9 10.5v4M15.5 11.5h.01M17.5 13.5h.01" />
    </>
  ),
  chat: <path d="M4.5 4.5h15v11h-8l-4.5 4v-4h-2.5z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20.5a7 7 0 0 1 14 0" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 11L12 4l8.5 7" />
      <path d="M6 9.5V20h12V9.5" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bolt: <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICON_PATHS;

type IconProps = { name: IconName } & Omit<SVGProps<SVGSVGElement>, "children">;

/** Tamanho padrão de 24px, a menos que a classe informe outro (`size-*`). */
export function Icon({ name, className = "", ...props }: IconProps) {
  const size = /(^|\s)size-/.test(className) ? "" : "size-6";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${size} ${className}`}
      {...props}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
