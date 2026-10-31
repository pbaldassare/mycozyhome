import type { ReactNode, SVGProps } from "react";

/**
 * Illustrazioni dell'app disegnate in SVG.
 * Usano solo i token del tema (primary, sage, straw, blush e le loro varianti
 * light/dark), quindi seguono anche la modalità scura.
 */

type IllustrationProps = SVGProps<SVGSVGElement> & {
  /** Testo alternativo. Senza, l'illustrazione è decorativa. */
  title?: string;
};

const t = (token: string, alpha?: number) =>
  alpha === undefined ? `hsl(var(--${token}))` : `hsl(var(--${token}) / ${alpha})`;

function Frame({
  title,
  viewBox = "0 0 200 200",
  children,
  ...props
}: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

function Sparkle({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  return (
    <path
      d={`M${x} ${y - size}Q${x} ${y} ${x + size} ${y}Q${x} ${y} ${x} ${y + size}Q${x} ${y} ${x - size} ${y}Q${x} ${y} ${x} ${y - size}Z`}
      fill={fill}
    />
  );
}

function Heart({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  const s = size / 28;
  return (
    <path
      transform={`translate(${x - 14 * s} ${y - 12 * s}) scale(${s})`}
      d="M14 26C4 19 0 13.5 0 8.5 0 3.8 3.4 0 7.6 0 10.4 0 12.6 1.6 14 4 15.4 1.6 17.6 0 20.4 0 24.6 0 28 3.8 28 8.5 28 13.5 24 19 14 26Z"
      fill={fill}
    />
  );
}

function Ground({ cx = 100, cy = 172, rx = 70 }: { cx?: number; cy?: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={6} fill={t("illustration-ink", 0.07)} />;
}

export function CleaningIllustration(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect width="200" height="200" fill={t("primary-light")} />
      <circle cx="104" cy="108" r="72" fill={t("primary", 0.22)} />
      <Ground cx={108} />
      {/* Nebulizzatore */}
      <circle cx="44" cy="62" r="4" fill={t("primary-dark", 0.35)} />
      <circle cx="34" cy="72" r="3" fill={t("primary-dark", 0.25)} />
      <circle cx="46" cy="80" r="2.5" fill={t("primary-dark", 0.3)} />
      <rect x="56" y="61" width="24" height="11" rx="3" fill={t("primary-dark")} />
      <rect x="76" y="54" width="46" height="26" rx="9" fill={t("primary-dark")} />
      <path d="M92 80q-4 14-16 18" stroke={t("primary-dark")} strokeWidth="6" strokeLinecap="round" fill="none" />
      <rect x="86" y="76" width="26" height="18" rx="4" fill={t("primary-dark")} />
      <rect x="72" y="90" width="54" height="78" rx="15" fill={t("primary")} />
      <rect x="82" y="110" width="34" height="30" rx="7" fill={t("illustration-paper")} />
      <path d="M99 116c5 7 7 10 7 13a7 7 0 0 1-14 0c0-3 2-6 7-13Z" fill={t("primary-dark")} />
      <rect x="78" y="96" width="8" height="58" rx="4" fill={t("illustration-paper", 0.35)} />
      {/* Spugna */}
      <rect x="130" y="142" width="48" height="27" rx="8" fill={t("straw")} />
      <path d="M130 150a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v2h-48Z" fill={t("sage")} />
      <circle cx="142" cy="160" r="2.5" fill={t("straw-dark", 0.6)} />
      <circle cx="154" cy="163" r="2" fill={t("straw-dark", 0.6)} />
      <circle cx="166" cy="158" r="2.5" fill={t("straw-dark", 0.6)} />
      {/* Bolle e brillantini */}
      <circle cx="152" cy="112" r="11" fill={t("illustration-paper", 0.75)} stroke={t("primary")} strokeWidth="2.5" />
      <circle cx="170" cy="88" r="6" fill={t("illustration-paper", 0.75)} stroke={t("primary")} strokeWidth="2" />
      <circle cx="140" cy="88" r="4" fill={t("illustration-paper", 0.75)} stroke={t("primary")} strokeWidth="2" />
      <Sparkle x={50} y={128} size={10} fill={t("primary-dark")} />
      <Sparkle x={168} y={52} size={8} fill={t("blush-dark")} />
      <Sparkle x={36} y={100} size={5} fill={t("straw-dark")} />
    </Frame>
  );
}

export function IroningIllustration(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect width="200" height="200" fill={t("straw-light")} />
      <circle cx="100" cy="112" r="72" fill={t("straw", 0.35)} />
      <Ground />
      {/* Pila di camicie piegate */}
      <rect x="46" y="146" width="108" height="22" rx="8" fill={t("blush")} />
      <rect x="58" y="156" width="84" height="3" rx="1.5" fill={t("blush-dark", 0.35)} />
      <rect x="50" y="124" width="100" height="22" rx="8" fill={t("primary")} />
      <rect x="62" y="134" width="76" height="3" rx="1.5" fill={t("primary-dark", 0.35)} />
      <rect x="54" y="102" width="92" height="22" rx="8" fill={t("sage")} />
      <path d="M90 102l10 10 10-10" stroke={t("sage-dark")} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {/* Ferro da stiro */}
      <path
        d="M94 74h10M138 74V62a8 8 0 0 0-8-8h-22a8 8 0 0 0-8 8v12"
        stroke={t("straw-dark")}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M66 98c2-14 16-26 40-26h36a6 6 0 0 1 6 6v20Z" fill={t("illustration-paper")} />
      <rect x="62" y="94" width="90" height="9" rx="4.5" fill={t("primary-dark")} />
      <circle cx="128" cy="84" r="5" fill={t("blush-dark")} />
      {/* Vapore */}
      <path d="M62 66q-6-7 0-14t0-14" stroke={t("straw-dark", 0.55)} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M48 74q-6-7 0-14t0-14" stroke={t("straw-dark", 0.4)} strokeWidth="4" strokeLinecap="round" fill="none" />
      <Sparkle x={162} y={46} size={8} fill={t("straw-dark")} />
      <Sparkle x={174} y={128} size={5} fill={t("blush-dark")} />
    </Frame>
  );
}

export function PetSittingIllustration(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect width="200" height="200" fill={t("sage-light")} />
      <circle cx="100" cy="112" r="72" fill={t("sage", 0.3)} />
      <Ground cy={176} />
      {/* Corpo e collare */}
      <path d="M62 178c2-22 18-36 38-36s36 14 38 36Z" fill={t("straw")} />
      <path d="M70 146q30 14 60 0" stroke={t("blush-dark")} strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="158" r="6" fill={t("primary-dark")} />
      {/* Orecchie */}
      <path d="M62 78c-18 10-22 36-12 56 10 2 20-8 22-26Z" fill={t("straw-dark")} />
      <path d="M138 78c18 10 22 36 12 56-10 2-20-8-22-26Z" fill={t("straw-dark")} />
      {/* Testa */}
      <ellipse cx="100" cy="106" rx="42" ry="40" fill={t("straw")} />
      <ellipse cx="118" cy="96" rx="12" ry="11" fill={t("straw-dark", 0.45)} />
      <ellipse cx="100" cy="124" rx="24" ry="17" fill={t("illustration-paper")} />
      <circle cx="84" cy="98" r="4.5" fill={t("illustration-ink")} />
      <circle cx="118" cy="98" r="4.5" fill={t("illustration-ink")} />
      <circle cx="85.5" cy="96.5" r="1.4" fill={t("illustration-paper")} />
      <circle cx="119.5" cy="96.5" r="1.4" fill={t("illustration-paper")} />
      <ellipse cx="100" cy="114" rx="8" ry="6" fill={t("illustration-ink")} />
      <path d="M100 120q0 8-8 9M100 120q0 8 8 9" stroke={t("illustration-ink")} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M95 129q5 13 10 0Z" fill={t("blush-dark")} />
      {/* Cuore e impronte */}
      <Heart x={160} y={52} size={26} fill={t("blush-dark")} />
      <g fill={t("sage-dark", 0.55)}>
        <ellipse cx="38" cy="58" rx="6" ry="5" />
        <circle cx="31" cy="49" r="2.6" />
        <circle cx="38" cy="46" r="2.6" />
        <circle cx="45" cy="49" r="2.6" />
      </g>
    </Frame>
  );
}

export function PromoCleaningIllustration(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect width="200" height="200" fill={t("blush-light")} />
      <circle cx="100" cy="112" r="72" fill={t("blush", 0.35)} />
      <Ground />
      {/* Secchio con schiuma */}
      <path d="M62 64q38-54 76 0" stroke={t("muted-foreground")} strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="78" cy="92" r="13" fill={t("illustration-paper")} />
      <circle cx="98" cy="84" r="16" fill={t("illustration-paper")} />
      <circle cx="120" cy="90" r="13" fill={t("illustration-paper")} />
      <circle cx="134" cy="96" r="8" fill={t("illustration-paper")} />
      <path d="M62 102h76l-7 62a8 8 0 0 1-8 7H77a8 8 0 0 1-8-7Z" fill={t("primary")} />
      <rect x="56" y="96" width="88" height="13" rx="6.5" fill={t("primary-dark")} />
      <rect x="70" y="118" width="7" height="40" rx="3.5" fill={t("illustration-paper", 0.35)} />
      {/* Cartellino sconto */}
      <g transform="rotate(-14 152 56)">
        <path d="M128 40a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8h-32a8 8 0 0 1-8-8Z" fill={t("straw")} />
        <circle cx="137" cy="42" r="3" fill={t("blush-light")} />
        <circle cx="146" cy="50" r="5" stroke={t("illustration-ink")} strokeWidth="3" fill="none" />
        <circle cx="162" cy="66" r="5" stroke={t("illustration-ink")} strokeWidth="3" fill="none" />
        <path d="M164 46l-20 24" stroke={t("illustration-ink")} strokeWidth="3" strokeLinecap="round" />
      </g>
      <Sparkle x={42} y={110} size={9} fill={t("blush-dark")} />
      <Sparkle x={164} y={128} size={6} fill={t("primary-dark")} />
    </Frame>
  );
}


export function WelcomeIllustration(props: IllustrationProps) {
  return (
    <Frame viewBox="0 0 400 300" {...props}>
      <rect width="400" height="300" fill={t("primary-light")} />
      <rect y="236" width="400" height="64" fill={t("primary", 0.28)} />
      {/* Finestra */}
      <rect x="40" y="38" width="112" height="134" rx="12" fill={t("illustration-paper")} />
      <rect x="49" y="47" width="94" height="116" rx="7" fill={t("primary", 0.45)} />
      <circle cx="118" cy="76" r="14" fill={t("straw")} />
      <path d="M96 47v116M49 105h94" stroke={t("illustration-paper")} strokeWidth="6" />
      <rect x="32" y="168" width="128" height="9" rx="4.5" fill={t("illustration-paper")} />
      {/* Quadro con il marchio */}
      <rect x="248" y="48" width="64" height="50" rx="6" fill={t("illustration-paper")} />
      <path d="M280 60l16 13h-4v15h-24V73h-4Z" fill={t("primary-dark")} stroke={t("primary-dark")} strokeWidth="3" strokeLinejoin="round" />
      <Heart x={280} y={80} size={9} fill={t("blush")} />
      {/* Lampada */}
      <circle cx="350" cy="104" r="40" fill={t("straw", 0.25)} />
      <path d="M350 112v116" stroke={t("muted-foreground")} strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="350" cy="230" rx="16" ry="4" fill={t("muted-foreground")} />
      <path d="M330 112h40l-9-32h-22Z" fill={t("straw")} />
      {/* Tappeto */}
      <ellipse cx="244" cy="254" rx="128" ry="17" fill={t("sage", 0.55)} />
      {/* Divano */}
      <rect x="170" y="134" width="156" height="60" rx="20" fill={t("primary")} />
      <rect x="172" y="216" width="8" height="18" rx="3" fill={t("muted-foreground")} />
      <rect x="316" y="216" width="8" height="18" rx="3" fill={t("muted-foreground")} />
      <rect x="160" y="176" width="176" height="44" rx="16" fill={t("primary-dark")} />
      <rect x="150" y="160" width="30" height="62" rx="13" fill={t("primary-dark")} />
      <rect x="316" y="160" width="30" height="62" rx="13" fill={t("primary-dark")} />
      <rect x="188" y="146" width="42" height="36" rx="11" fill={t("blush")} transform="rotate(-8 209 164)" />
      <rect x="270" y="146" width="40" height="34" rx="11" fill={t("straw")} transform="rotate(8 290 163)" />
      {/* Gatto che dorme */}
      <path d="M232 184c0-12 12-20 26-20s24 8 24 20Z" fill={t("illustration-paper")} />
      <path d="M236 172l3-11 8 7Z" fill={t("illustration-paper")} />
      <path d="M248 166l6-9 5 10Z" fill={t("illustration-paper")} />
      <path d="M240 175q4 3 8 0" stroke={t("illustration-ink", 0.6)} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M282 182q14 2 10-12" stroke={t("illustration-paper")} strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Pianta */}
      <path d="M96 210q-34-24-30-62 22 18 30 62Z" fill={t("sage")} />
      <path d="M100 210q-8-44 18-72 10 36-18 72Z" fill={t("sage-dark")} />
      <path d="M104 212q22-30 50-30-10 30-50 30Z" fill={t("sage")} />
      <path d="M78 206h44l-5 36a6 6 0 0 1-6 5H89a6 6 0 0 1-6-5Z" fill={t("blush-dark")} />
      {/* Brillantini */}
      <Sparkle x={186} y={62} size={10} fill={t("primary-dark")} />
      <Sparkle x={212} y={98} size={6} fill={t("straw-dark")} />
      <Sparkle x={40} y={214} size={7} fill={t("blush-dark")} />
    </Frame>
  );
}
