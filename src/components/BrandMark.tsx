import type { SVGProps } from "react";

/** Marchio MyCozyHome: casa nel colore del testo, cuore nel colore indicato. */
export function BrandMark({
  heartColor = "hsl(var(--blush))",
  ...props
}: SVGProps<SVGSVGElement> & { heartColor?: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path
        d="M50 16 86 47H77v33a6 6 0 0 1-6 6H29a6 6 0 0 1-6-6V47h-9Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        d="M50 76C39 68.5 35 62.5 35 57.5 35 52.8 38.4 49 42.6 49c2.8 0 5 1.6 7.4 4 2.4-2.4 4.6-4 7.4-4 4.2 0 7.6 3.8 7.6 8.5 0 5-4 11-15 18.5Z"
        fill={heartColor}
      />
    </svg>
  );
}
