import { useState, type CSSProperties, type SVGProps } from "react";
import { cn } from "@/lib/utils";

/* Forme e colori dal logo ufficiale (logo-animato-mycozyhome.html): Cielo, Notte, Albicocca. */
const BODY = "M26 60 L60 30 L94 60 L94 94 Q94 102 86 102 L34 102 Q26 102 26 94 Z";
const ROOF = "M14 58 L60 18 L106 58";
const HEART = "M60 90 C44 79 42 64 51 63 C55 62.5 58.5 65 60 68 C61.5 65 65 62.5 69 63 C78 64 76 79 60 90 Z";

/** Simbolo MyCozyHome: casa azzurra, tetto blu notte, cuore albicocca. */
export function BrandMark({ roofColor = "#1F3A4D", ...props }: SVGProps<SVGSVGElement> & { roofColor?: string }) {
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d={BODY} fill="#8BB8D0" />
      <path d={ROOF} fill="none" stroke={roofColor} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d={HEART} fill="#EE9A5F" />
    </svg>
  );
}

/** Simbolo + scritta "mycozyhome" per le intestazioni. onDark: su fondo blu (scritta bianca, tetto bianco). */
export function Wordmark({ onDark = false, className }: { onDark?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", className)} aria-label="MyCozyHome">
      <BrandMark className="h-7 w-7" roofColor={onDark ? "#FFFFFF" : "#1F3A4D"} />
      <span className="text-lg leading-none tracking-tight" aria-hidden="true">
        <span className={cn("font-semibold", onDark ? "opacity-80" : "text-[#4F86A6] dark:text-[#8BB8D0]")}>my</span>
        <span className="font-extrabold">cozyhome</span>
      </span>
    </span>
  );
}

const v = (vars: Record<string, string>) => vars as CSSProperties;

/** Logo animato della pagina iniziale: tetto, casa, cuore, poi M Y C → mycozyhome. Un tocco lo fa ripartire. */
export function AnimatedLogo({ showTagline = true }: { showTagline?: boolean }) {
  const [run, setRun] = useState(0);
  return (
    <div
      key={run}
      className="mch-logo"
      role="img"
      aria-label="MyCozyHome – La tua casa, in ottime mani."
      title="Tocca per rivedere l'animazione"
      onClick={() => setRun((r) => r + 1)}
    >
      <div className="mch-row">
        <svg className="mch-mark" viewBox="0 0 120 120" aria-hidden="true">
          <path className="mch-body" d={BODY} fill="#8BB8D0" />
          <path className="mch-roof" d={ROOF} fill="none" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path className="mch-heart" d={HEART} fill="#EE9A5F" />
        </svg>
        <div className="mch-word" aria-hidden="true">
          <span className="mch-g my"><span className="mch-up" style={v({ "--d": "1s" })}>M</span><span className="mch-lo">m</span></span>
          <span className="mch-g my"><span className="mch-up" style={v({ "--d": "1.15s" })}>Y</span><span className="mch-lo">y</span></span>
          <span className="mch-g"><span className="mch-up" style={v({ "--d": "1.3s" })}>C</span><span className="mch-lo">c</span></span>
          <span className="mch-x" style={v({ "--w": "1.8em", "--t": ".8s", "--d": "2.9s" })}>ozy</span>
          <span className="mch-x" style={v({ "--w": "2.9em", "--t": ".9s", "--d": "3.35s" })}>home</span>
        </div>
      </div>
      {showTagline && <p className="mch-tag" aria-hidden="true">La tua casa, in ottime mani.</p>}
    </div>
  );
}
