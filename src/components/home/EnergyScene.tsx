/**
 * Composição de motion graphics da página inicial: uma vizinhança de vidro em perspectiva
 * isométrica, ligada por linhas de energia a um núcleo luminoso (a "inteligência" do bairro).
 *
 * Tudo é SVG e CSS gerados no build: sem biblioteca 3D, sem imagem externa e sem JavaScript no
 * navegador. É decorativo (`aria-hidden`), não recebe cliques (`pointer-events-none`) e fica
 * parado para quem pede movimento reduzido. Se o CSS das animações não carregar, a cena aparece
 * estática e completa.
 */

const UNIT = 42;
const ORIGIN_X = 600;
const ORIGIN_Y = 130;
const GRID = 9;

type Point3 = [x: number, y: number, z?: number];

/** Projeção isométrica: (x, y) no chão e z na altura → coordenadas da tela. */
function iso([x, y, z = 0]: Point3): [number, number] {
  return [ORIGIN_X + (x - y) * UNIT * 0.866, ORIGIN_Y + (x + y) * UNIT * 0.5 - z * UNIT];
}

const points = (...list: Point3[]) =>
  list
    .map((point) =>
      iso(point)
        .map((n) => n.toFixed(1))
        .join(","),
    )
    .join(" ");

interface House {
  id: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  roof: number;
  solar?: boolean;
}

const HOUSES: House[] = [
  // O centro do terreno fica livre para o núcleo; as casas ficam em volta.
  { id: "a", x: 0.5, y: 2.7, w: 2, d: 2, h: 1.5, roof: 0.9 },
  { id: "b", x: 2.8, y: 0.4, w: 2, d: 2.1, h: 2, roof: 1, solar: true },
  { id: "c", x: 0.3, y: 6.3, w: 2.2, d: 2, h: 1.4, roof: 0.9, solar: true },
  { id: "d", x: 6.4, y: 0.5, w: 2, d: 2.2, h: 1.6, roof: 0.9 },
  { id: "e", x: 2.9, y: 6.7, w: 2.2, d: 2, h: 1.8, roof: 1 },
  { id: "f", x: 6.7, y: 3, w: 2, d: 2.2, h: 2, roof: 1, solar: true },
];

const CORE = iso([4.5, 4.5, 4.2]);
const PLATFORM = iso([4.5, 4.5, 0]);

const FACE = { stroke: "rgb(232 247 245 / 0.55)", strokeWidth: 1.2, strokeLinejoin: "round" as const };

function HouseShape({ house }: { house: House }) {
  const { x, y, w, d, h, roof } = house;
  const ridgeY = y + d / 2;
  const top = h + roof;
  // Ponto sobre o telhado da frente: a (0..1) ao longo da casa, t (0..1) da calha à cumeeira.
  const onRoof = (a: number, t: number): Point3 => [x + a * w, y + d - (t * d) / 2, h + t * roof];
  return (
    <g>
      {/* telhado de trás */}
      <polygon points={points([x, y, h], [x + w, y, h], [x + w, ridgeY, top], [x, ridgeY, top])} fill="rgb(232 247 245 / 0.07)" {...FACE} />
      {/* parede esquerda (voltada para quem olha) */}
      <polygon points={points([x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h])} fill="rgb(232 247 245 / 0.1)" {...FACE} />
      {/* parede direita com a empena */}
      <polygon
        points={points([x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, ridgeY, top], [x + w, y, h])}
        fill="rgb(232 247 245 / 0.18)"
        {...FACE}
      />
      {/* telhado da frente */}
      <polygon points={points([x, y + d, h], [x + w, y + d, h], [x + w, ridgeY, top], [x, ridgeY, top])} fill="rgb(232 247 245 / 0.26)" {...FACE} />
      {/* janelas acesas */}
      <polygon
        className="scene-glow"
        points={points([x + 0.3, y + d, 0.45], [x + 0.85, y + d, 0.45], [x + 0.85, y + d, 1], [x + 0.3, y + d, 1])}
        fill="var(--color-lime)"
      />
      <polygon
        className="scene-glow-late"
        points={points([x + w - 0.85, y + d, 0.45], [x + w - 0.3, y + d, 0.45], [x + w - 0.3, y + d, 1], [x + w - 0.85, y + d, 1])}
        fill="var(--color-lime)"
      />
      <polygon
        points={points([x + w, y + 0.5, 0], [x + w, y + 1, 0], [x + w, y + 1, 0.95], [x + w, y + 0.5, 0.95])}
        fill="rgb(16 45 53 / 0.55)"
        stroke="rgb(232 247 245 / 0.4)"
        strokeWidth="1"
      />
      {house.solar ? (
        <g>
          <polygon
            points={points(onRoof(0.18, 0.2), onRoof(0.82, 0.2), onRoof(0.82, 0.82), onRoof(0.18, 0.82))}
            fill="rgb(10 32 38 / 0.8)"
            stroke="var(--color-lime)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <polyline points={points(onRoof(0.5, 0.2), onRoof(0.5, 0.82))} stroke="rgb(217 250 87 / 0.6)" strokeWidth="1" fill="none" />
          <polyline points={points(onRoof(0.18, 0.51), onRoof(0.82, 0.51))} stroke="rgb(217 250 87 / 0.6)" strokeWidth="1" fill="none" />
        </g>
      ) : null}
    </g>
  );
}

function Tree({ at, size }: { at: Point3; size: number }) {
  const [bx, by] = iso(at);
  return (
    <g>
      <line x1={bx} y1={by} x2={bx} y2={by - size * 1.5} stroke="rgb(232 247 245 / 0.5)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={bx} cy={by - size * 2} r={size} fill="url(#cena-arvore)" stroke="rgb(232 247 245 / 0.35)" strokeWidth="1" />
    </g>
  );
}

export function EnergyScene() {
  const sorted = [...HOUSES].sort((a, b) => a.x + a.y - (b.x + b.y));
  const [cx, cy] = CORE;
  const [px, py] = PLATFORM;
  const lamp = iso([7.3, 7.3, 0]);
  return (
    <div aria-hidden="true" className="pointer-events-none relative mx-auto w-full max-w-5xl select-none">
      {/* Esferas translúcidas flutuando em volta da cena (profundidade). */}
      <span className="orb orb-lime float-a left-[6%] top-[14%] size-12 sm:size-16" />
      <span className="orb float-b right-[8%] top-[8%] size-16 opacity-80 sm:size-24" />
      <span className="orb orb-petrol float-c bottom-[12%] left-[14%] hidden size-20 sm:block" />
      <span className="orb orb-lime float-b bottom-[20%] right-[16%] hidden size-8 sm:block" />

      <svg
        viewBox="0 0 1200 540"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
        className="h-64 w-full sm:h-auto sm:aspect-[1200/540]"
      >
        <defs>
          <radialGradient id="cena-nucleo" cx="34%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="32%" stopColor="#ecfda0" />
            <stop offset="68%" stopColor="#d9fa57" />
            <stop offset="100%" stopColor="#6f8f1e" />
          </radialGradient>
          <radialGradient id="cena-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d9fa57" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d9fa57" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cena-arvore" cx="34%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#e8f7f5" stopOpacity="0.85" />
            <stop offset="45%" stopColor="#2f6472" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#102d35" stopOpacity="0.9" />
          </radialGradient>
          <linearGradient id="cena-feixe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9fa57" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#d9fa57" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cena-chao" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8f7f5" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#e8f7f5" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* chão em malha */}
        <polygon points={points([0, 0], [GRID, 0], [GRID, GRID], [0, GRID])} fill="url(#cena-chao)" stroke="rgb(232 247 245 / 0.25)" strokeWidth="1" />
        {Array.from({ length: GRID - 1 }, (_, index) => index + 1).map((i) => (
          <g key={i} stroke="rgb(232 247 245 / 0.09)" strokeWidth="1">
            <polyline points={points([i, 0], [i, GRID])} fill="none" />
            <polyline points={points([0, i], [GRID, i])} fill="none" />
          </g>
        ))}

        {/* base do núcleo */}
        <ellipse cx={px} cy={py} rx="92" ry="46" fill="rgb(217 250 87 / 0.06)" stroke="rgb(217 250 87 / 0.35)" strokeWidth="1" />
        <ellipse className="scene-glow" cx={px} cy={py} rx="56" ry="28" fill="rgb(217 250 87 / 0.12)" stroke="rgb(217 250 87 / 0.7)" strokeWidth="1.4" />
        <polygon points={`${cx - 16},${cy} ${cx + 16},${cy} ${px + 50},${py} ${px - 50},${py}`} fill="url(#cena-feixe)" />

        <Tree at={[1.1, 1.1]} size={11} />
        <Tree at={[8.5, 6.2]} size={14} />
        <Tree at={[5.9, 8.5]} size={12} />

        {sorted.map((house) => (
          <HouseShape key={house.id} house={house} />
        ))}

        {/* poste com luz */}
        <line x1={lamp[0]} y1={lamp[1]} x2={lamp[0]} y2={lamp[1] - 62} stroke="rgb(232 247 245 / 0.6)" strokeWidth="2" strokeLinecap="round" />
        <circle className="scene-glow" cx={lamp[0]} cy={lamp[1] - 66} r="16" fill="url(#cena-halo)" />
        <circle cx={lamp[0]} cy={lamp[1] - 66} r="5" fill="var(--color-lime)" />

        {/* linhas de energia: do núcleo ao telhado de cada casa */}
        {HOUSES.map((house) => {
          const [rx, ry] = iso([house.x + house.w / 2, house.y + house.d / 2, house.h + house.roof]);
          const path = `M${cx.toFixed(1)},${cy.toFixed(1)} Q${((cx + rx) / 2).toFixed(1)},${(Math.min(cy, ry) - 46).toFixed(1)} ${rx.toFixed(1)},${ry.toFixed(1)}`;
          return (
            <g key={house.id} fill="none" strokeLinecap="round">
              <path d={path} stroke="rgb(232 247 245 / 0.16)" strokeWidth="1.2" />
              <path className="scene-flow" d={path} stroke="var(--color-lime)" strokeWidth="2" strokeDasharray="3 11" />
              <circle cx={rx} cy={ry} r="4.5" fill="var(--color-lime)" stroke="none" />
            </g>
          );
        })}

        {/* núcleo: esfera luminosa com dois anéis em órbita */}
        <g className="float-a">
          <circle className="scene-glow" cx={cx} cy={cy} r="86" fill="url(#cena-halo)" />
          <g transform={`translate(${cx} ${cy}) rotate(-18) scale(1 0.34)`}>
            <circle r="82" fill="none" stroke="rgb(232 247 245 / 0.45)" strokeWidth="1.4" />
            <g className="scene-spin">
              <ellipse cx="82" cy="0" rx="5.5" ry="16" fill="var(--color-lime)" />
            </g>
          </g>
          <circle cx={cx} cy={cy} r="40" fill="url(#cena-nucleo)" />
          <ellipse cx={cx - 13} cy={cy - 15} rx="13" ry="8" fill="rgb(255 255 255 / 0.7)" />
          <g transform={`translate(${cx} ${cy}) rotate(22) scale(1 0.3)`}>
            <path d="M-108,0 A108,108 0 0 0 108,0" fill="none" stroke="rgb(232 247 245 / 0.4)" strokeWidth="1.4" />
            <g className="scene-spin-rev">
              <ellipse cx="108" cy="0" rx="4.5" ry="15" fill="var(--color-ice)" />
            </g>
          </g>
        </g>

        {/* partículas */}
        {[
          [250, 120, 3],
          [330, 60, 2],
          [960, 150, 3],
          [880, 70, 2],
          [470, 40, 2.5],
          [760, 30, 2],
          [1040, 300, 2.5],
          [170, 320, 2.5],
        ].map(([x, y, r], index) => (
          <circle key={`${x}-${y}`} className={index % 2 ? "scene-glow" : "scene-glow-late"} cx={x} cy={y} r={r} fill={index % 3 ? "var(--color-ice)" : "var(--color-lime)"} />
        ))}
      </svg>
    </div>
  );
}
