import type { FC, SVGProps } from "react";

export const GrokIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="24" height="24" rx="6" fill="currentColor" />
    <path d="M7 8h10v8H7z" fill="white" opacity={0.9} />
    <path d="M9 11h6M9 14h4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
);
