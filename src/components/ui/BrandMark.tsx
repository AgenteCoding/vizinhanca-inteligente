/**
 * Símbolo oficial do SmartHood AI: um cérebro em rede (metade Ice, metade Signal Lime) com uma
 * casa no centro, sobre um bloco Petrol Blue. Redesenhado em SVG a partir da prancha da marca,
 * nas cores do projeto, para ficar nítido em qualquer tamanho. A mesma geometria está em
 * `src/app/icon.svg` (ícone da aba).
 */
export function BrandMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 640" aria-hidden="true" focusable="false" className={className}>
      <rect width="640" height="640" rx="150" fill="var(--color-petrol)" />
      <g transform="translate(17 61) scale(1.25)">
    <g fill="none" strokeWidth="12" strokeLinecap="round">
          <path d="M182 33L90 75M90 75L33 152M33 152L55 232M55 232L133 250M133 250L177 298M177 298L250 290M182 33L213 98M90 75L213 98M90 75L127 155M33 152L127 155M55 232L127 155M182 33L127 155M213 98L127 155M127 155L183 212M127 155L133 250M183 212L250 290M133 250L183 212M182 33L228 31M250 290L253 193M250 290L295 335" stroke="var(--color-ice)" />
          <path d="M275 30L390 67M390 67L443 150M443 150L453 225M453 225L395 295M395 295L320 318M320 318L340 380M275 30L320 95M320 95L390 67M320 95L377 152M390 67L377 152M377 152L443 150M377 152L330 230M443 150L330 230M453 225L330 230M330 230L395 295M330 230L320 318M228 31L275 30M250 290L330 230M295 335L340 380" stroke="var(--color-lime)" />
        </g>
        <g>
          <circle cx="182" cy="33" r="13" fill="var(--color-ice)" />
          <circle cx="90" cy="75" r="13" fill="var(--color-ice)" />
          <circle cx="33" cy="152" r="13" fill="var(--color-ice)" />
          <circle cx="55" cy="232" r="13" fill="var(--color-ice)" />
          <circle cx="133" cy="250" r="13" fill="var(--color-ice)" />
          <circle cx="177" cy="298" r="13" fill="var(--color-ice)" />
          <circle cx="250" cy="290" r="13" fill="var(--color-ice)" />
          <circle cx="213" cy="98" r="13" fill="var(--color-ice)" />
          <circle cx="127" cy="155" r="19" fill="var(--color-ice)" />
          <circle cx="183" cy="212" r="13" fill="var(--color-ice)" />
          <circle cx="275" cy="30" r="13" fill="var(--color-lime)" />
          <circle cx="390" cy="67" r="13" fill="var(--color-lime)" />
          <circle cx="443" cy="150" r="13" fill="var(--color-lime)" />
          <circle cx="453" cy="225" r="13" fill="var(--color-lime)" />
          <circle cx="395" cy="295" r="13" fill="var(--color-lime)" />
          <circle cx="320" cy="318" r="13" fill="var(--color-lime)" />
          <circle cx="340" cy="380" r="13" fill="var(--color-lime)" />
          <circle cx="320" cy="95" r="13" fill="var(--color-lime)" />
          <circle cx="377" cy="152" r="13" fill="var(--color-lime)" />
          <circle cx="330" cy="230" r="19" fill="var(--color-lime)" />
        </g>
        <path d="M195 142L255 96L270 108V96H290V123L320 146L308 160L255 119L207 157ZM212 160L255 127L298 160V208H268V175H246V208H212Z" fill="var(--color-ice)" fillRule="evenodd" />
      </g>
    </svg>
  );
}
