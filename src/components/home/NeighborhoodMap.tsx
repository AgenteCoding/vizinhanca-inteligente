import { ICON_PATHS, type IconName } from "../ui/Icon";

/**
 * Planta ilustrada da vizinhança, vista de cima. A "IA" marca os seis pontos de desperdício
 * (os mesmos ícones das seis situações). É uma ilustração: o acesso às situações é feito pelos
 * cartões da página, que têm alvos de toque maiores e texto.
 */
interface Marker {
  x: number;
  y: number;
  icon: IconName;
}

const MARKERS: Marker[] = [
  { x: 444, y: 154, icon: "streetlight" },
  { x: 86, y: 106, icon: "bulb" },
  { x: 200, y: 76, icon: "fridge" },
  { x: 230, y: 152, icon: "ac" },
  { x: 94, y: 330, icon: "clock" },
  { x: 228, y: 352, icon: "solar" },
];

function MapMarker({ x, y, icon, delay }: Marker & { delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="map-marker" style={{ animationDelay: `${delay}ms` }}>
        <path
          d="M-28 -16V-28H-16M16 -28H28V-16M28 16V28H16M-16 28H-28V16"
          fill="none"
          stroke="var(--color-ai)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle r="19" fill="var(--color-lime)" stroke="var(--color-ink)" strokeWidth="2.5" />
        <g
          transform="translate(-11 -11) scale(0.9167)"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICON_PATHS[icon]}
        </g>
      </g>
    </g>
  );
}

export function NeighborhoodMap({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 420"
      role="img"
      aria-labelledby="mapa-titulo mapa-descricao"
      className={`h-auto w-full ${className}`}
    >
      <title id="mapa-titulo">Mapa ilustrado da Vizinhança Inteligente</title>
      <desc id="mapa-descricao">
        Planta de um bairro com ruas, casas e uma praça. A inteligência artificial marca seis pontos
        de desperdício de energia: postes acesos de dia, luz acesa em um cômodo vazio, geladeira
        ineficiente, ar-condicionado com a janela aberta, muitos aparelhos ligados no horário de
        pico e um telhado com muito sol e sem placas solares.
      </desc>
      <defs>
        <clipPath id="mapa-recorte">
          <rect width="560" height="420" rx="28" />
        </clipPath>
        <pattern id="mapa-grade" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="var(--color-line)" strokeWidth="0.8" />
        </pattern>
      </defs>

      <g clipPath="url(#mapa-recorte)">
        <rect width="560" height="420" fill="var(--color-map)" />
        <rect width="560" height="420" fill="url(#mapa-grade)" opacity="0.7" />

        {/* Ruas */}
        <rect x="0" y="198" width="560" height="44" fill="var(--color-surface)" />
        <rect x="300" y="0" width="40" height="420" fill="var(--color-surface)" />
        <path
          d="M0 220H300M340 220H560M320 0V198M320 242V420"
          stroke="var(--color-line)"
          strokeWidth="2"
          strokeDasharray="10 8"
        />

        {/* Praça com árvores */}
        <path d="M352 30c40 30 80 10 120 40s50 60 80 70" fill="none" stroke="var(--color-surface)" strokeWidth="10" strokeLinecap="round" />
        <g fill="var(--color-leaf)" stroke="var(--color-ink)" strokeWidth="1.5">
          <circle cx="380" cy="70" r="22" />
          <circle cx="430" cy="34" r="16" />
          <circle cx="486" cy="96" r="24" />
          <circle cx="410" cy="128" r="17" />
          <circle cx="526" cy="150" r="15" />
        </g>

        {/* Sol: é dia */}
        <g stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round">
          <circle cx="526" cy="44" r="15" fill="var(--color-lime)" />
          <path d="M526 18v-6M526 76v-6M500 44h-6M558 44h-6M507.6 25.6l-4.2-4.2M548.6 66.6l-4.2-4.2M507.6 62.4l-4.2 4.2" />
        </g>

        {/* Postes acesos ao longo da avenida */}
        {[372, 444, 516].map((x) => (
          <g key={x}>
            <circle cx={x} cy="190" r="16" fill="var(--color-lime)" opacity="0.55" />
            <path d={`M${x} 198v-8`} stroke="var(--color-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={x} cy="190" r="5.5" fill="var(--color-lime)" stroke="var(--color-ink)" strokeWidth="2" />
          </g>
        ))}

        {/* Casa 1 em planta: sala, cozinha e quarto */}
        <g stroke="var(--color-ink)" strokeLinecap="round" strokeLinejoin="round">
          <rect x="32" y="30" width="236" height="146" rx="4" fill="var(--color-surface)" strokeWidth="3" />
          <path d="M140 30V90M140 112V176M140 104H178M200 104H268" fill="none" strokeWidth="3" />
          {/* Sala: luz acesa e ninguém */}
          <circle cx="86" cy="62" r="18" fill="var(--color-lime)" opacity="0.5" stroke="none" />
          <circle cx="86" cy="62" r="6" fill="var(--color-lime)" strokeWidth="2" />
          <rect x="50" y="144" width="60" height="20" rx="6" fill="var(--color-paper)" strokeWidth="1.5" />
          {/* Cozinha: bancada e geladeira */}
          <rect x="150" y="38" width="62" height="14" rx="2" fill="var(--color-paper)" strokeWidth="1.5" />
          <rect x="232" y="38" width="26" height="32" rx="3" fill="var(--color-surface)" strokeWidth="2" />
          <path d="M232 50h26" fill="none" strokeWidth="1.5" />
          {/* Quarto: cama, ar-condicionado e janela aberta */}
          <rect x="150" y="122" width="40" height="44" rx="4" fill="var(--color-paper)" strokeWidth="1.5" />
          <path d="M150 134h40" fill="none" strokeWidth="1.5" />
          <rect x="212" y="108" width="44" height="10" rx="2" fill="var(--color-surface)" strokeWidth="2" />
          <rect x="265" y="132" width="6" height="30" fill="var(--color-map)" stroke="none" />
          <path d="M268 132l20 16" fill="none" strokeWidth="2.5" />
        </g>

        {/* Casa 2 em planta: vários aparelhos ligados ao mesmo tempo */}
        <g stroke="var(--color-ink)" strokeLinecap="round" strokeLinejoin="round">
          <rect x="32" y="266" width="124" height="126" rx="4" fill="var(--color-surface)" strokeWidth="3" />
          <circle cx="56" cy="290" r="9" fill="var(--color-lime)" strokeWidth="1.5" />
          <rect x="116" y="280" width="28" height="20" rx="3" fill="var(--color-lime)" strokeWidth="1.5" />
          <rect x="44" y="358" width="24" height="24" rx="4" fill="var(--color-lime)" strokeWidth="1.5" />
          <rect x="120" y="360" width="24" height="20" rx="3" fill="var(--color-lime)" strokeWidth="1.5" />
        </g>

        {/* Casa 3: telhado com sol e espaço livre para placas solares */}
        <g stroke="var(--color-ink)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <rect x="176" y="266" width="104" height="126" rx="3" fill="var(--color-paper)" />
          <path d="M206 329h44M176 266l30 63-30 63M280 266l-30 63 30 63" fill="none" />
          <rect x="186" y="274" width="84" height="40" rx="3" fill="none" stroke="var(--color-ai)" strokeDasharray="5 4" />
        </g>

        {/* Outras casas do bairro */}
        <g stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" fill="var(--color-paper)">
          <rect x="360" y="264" width="82" height="62" rx="3" />
          <path d="M360 295h82" fill="none" />
          <rect x="460" y="264" width="82" height="62" rx="3" />
          <path d="M501 264v62" fill="none" />
          <rect x="360" y="342" width="182" height="54" rx="3" />
          <path d="M360 369h182" fill="none" />
        </g>

        {MARKERS.map((marker, index) => (
          <MapMarker key={marker.icon} {...marker} delay={500 + index * 140} />
        ))}

        {/* Varredura da IA (uma vez, ao abrir a página) */}
        <rect className="map-scan" x="0" y="-3" width="560" height="3" fill="var(--color-ai)" />
      </g>

      <rect x="1.5" y="1.5" width="557" height="417" rx="27" fill="none" stroke="var(--color-ink)" strokeWidth="3" />
    </svg>
  );
}
