import type { StopId } from "@/story";

const INK = "#5b3a4a";
const PINK = "#ff8fb1";
const DEEP = "#e8507f";
const GOLD = "#f2c14e";

function Heart({ x, y, s = 10, c = PINK }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s / 10})`}
      d="M0 3 C0 -1 -5 -1 -5 3 C-5 6 0 8 0 10 C0 8 5 6 5 3 C5 -1 0 -1 0 3Z"
      fill={c}
    />
  );
}

function Face({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={-7} cy={0} r={2.4} fill={INK} />
      <circle cx={7} cy={0} r={2.4} fill={INK} />
      <ellipse cx={-12} cy={5} rx={3.5} ry={2} fill={PINK} opacity={0.6} />
      <ellipse cx={12} cy={5} rx={3.5} ry={2} fill={PINK} opacity={0.6} />
      <path d="M-3 4 Q0 7 3 4" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}

const art: Record<StopId, React.ReactNode> = {
  gates: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <rect x={60} y={60} width={80} height={70} fill="#fde6ee" />
      <rect x={45} y={45} width={24} height={85} fill="#fde6ee" />
      <rect x={131} y={45} width={24} height={85} fill="#fde6ee" />
      <path d="M41 47 L57 18 L73 47Z M127 47 L143 18 L159 47Z" fill={DEEP} />
      <path d="M86 130 V105 a14 14 0 0 1 28 0 V130Z" fill="#c9628a" />
      <Face x={100} y={80} s={1.1} />
    </g>
  ),
  roses: (
    <g stroke={INK} strokeWidth={2.5} strokeLinecap="round">
      <path d="M100 135 C98 110 102 95 100 72" fill="none" stroke="#3f8f45" strokeWidth={4} />
      <path d="M100 112 C85 104 80 110 76 98 C90 96 96 100 100 108Z" fill="#7cc36a" />
      <path d="M100 100 C114 92 120 98 126 86 C112 84 104 88 100 96Z" fill="#7cc36a" />
      <circle cx={100} cy={55} r={24} fill={DEEP} />
      <path d="M90 50 C95 40 110 42 110 54 C110 62 98 64 96 56" fill="none" stroke="#a8204a" />
      <Face x={100} y={60} s={0.7} />
    </g>
  ),
  tea: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <ellipse cx={100} cy={128} rx={52} ry={9} fill="#fde6ee" />
      <path d="M62 75 H138 C138 110 124 124 100 124 C76 124 62 110 62 75Z" fill="#ffffff" />
      <path d="M138 86 C156 86 156 108 134 110" fill="none" />
      <Face x={100} y={96} />
      <path d="M86 62 C80 52 92 46 86 36 M112 62 C106 52 118 46 112 36" fill="none" stroke="#c9a0b0" strokeLinecap="round" />
    </g>
  ),
  dragon: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <path d="M58 70 L30 48 L40 82Z M142 70 L170 48 L160 82Z" fill="#c9b2ef" />
      <ellipse cx={100} cy={95} rx={48} ry={40} fill="#9fdcc0" />
      <ellipse cx={100} cy={108} rx={26} ry={20} fill="#eef6cf" />
      <path d="M78 58 L82 44 L90 57 M110 57 L118 44 L122 58" fill="#fff2c4" />
      <Face x={100} y={85} s={1.2} />
    </g>
  ),
  well: (
    <g stroke={INK} strokeWidth={2.5}>
      <circle cx={100} cy={80} r={40} fill={GOLD} />
      <circle cx={100} cy={80} r={31} fill="none" stroke="#c9952a" />
      <Heart x={100} y={68} s={26} c={DEEP} />
      <path d="M40 40 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4Z M160 110 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z" fill="#fff2b8" />
    </g>
  ),
  swan: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round">
      <path d="M40 125 Q60 118 80 125 T120 125 T160 125" fill="none" stroke="#7cc6d6" />
      <path d="M58 110 C58 88 120 84 142 104 C140 118 70 122 58 110Z" fill="#ffffff" />
      <path d="M120 100 C110 70 140 60 132 40" fill="none" strokeWidth={9} stroke="#ffffff" />
      <path d="M120 100 C110 70 140 60 132 40" fill="none" />
      <path d="M132 40 l14 4 l-12 6Z" fill="#ffae42" />
      <circle cx={130} cy={40} r={2} fill={INK} />
      <Heart x={84} y={60} s={16} />
    </g>
  ),
  easel: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <rect x={58} y={28} width={84} height={100} rx={6} fill={GOLD} />
      <rect x={68} y={38} width={64} height={80} fill="#fff6ef" />
      <circle cx={100} cy={72} r={18} fill="#f8d9c6" />
      <path d="M82 72 C82 48 118 48 118 72 C112 60 88 60 82 72Z" fill="#3b2420" />
      <path d="M86 56 L90 44 L96 52 L100 40 L104 52 L110 44 L114 56Z" fill={GOLD} />
      <path d="M78 118 C80 100 120 100 122 118Z" fill={PINK} />
    </g>
  ),
  gazebo: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <Heart x={84} y={46} s={48} c={PINK} />
      <Heart x={118} y={56} s={44} c={DEEP} />
      <path d="M50 40 v26 a6 5 0 1 1 -3 -4 v-18 l14 -4 v18 a6 5 0 1 1 -3 -4 v-12Z" fill={INK} strokeWidth={1} />
      <path d="M150 104 v20 a5 4 0 1 1 -3 -3.5 v-16.5Z" fill={INK} strokeWidth={1} />
    </g>
  ),
  castle: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <rect x={52} y={62} width={96} height={70} fill="#fde6ee" />
      <rect x={86} y={34} width={28} height={98} fill="#fde6ee" />
      <path d="M82 36 L100 8 L118 36Z M48 64 L62 40 L76 64Z M124 64 L138 40 L152 64Z" fill={DEEP} />
      {[64, 128, 94, 106].map((x, i) => (
        <rect key={i} x={x - 4} y={i < 2 ? 80 : 54} width={8} height={12} rx={4} fill="#ffd27a" />
      ))}
      <path d="M90 132 V112 a10 10 0 0 1 20 0 V132Z" fill="#c9628a" />
      <path d="M30 30 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z M168 22 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3Z" fill="#fff2b8" />
    </g>
  ),
  throne: (
    <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round">
      <path d="M48 110 L40 52 L72 80 L100 36 L128 80 L160 52 L152 110Z" fill={GOLD} />
      <rect x={48} y={108} width={104} height={18} rx={4} fill="#e9b23a" />
      <circle cx={100} cy={117} r={5} fill={DEEP} />
      <circle cx={74} cy={117} r={4} fill="#9ad0ff" />
      <circle cx={126} cy={117} r={4} fill="#9ad0ff" />
      <Face x={100} y={88} />
    </g>
  ),
};

export function Illustration({ id }: { id: StopId }) {
  return (
    <svg viewBox="0 0 200 160" role="img" aria-hidden="true" className="illus">
      <Heart x={30} y={110} s={12} />
      <Heart x={172} y={70} s={10} />
      <Heart x={162} y={20} s={8} c="#ffc2d6" />
      {art[id]}
    </svg>
  );
}
