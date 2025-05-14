import type { SVGProps } from 'react';

const DandaliLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 180 40"
    width="120"
    height="30"
    aria-label="Dandali Connect Logo"
    {...props}
  >
    <rect width="180" height="40" rx="8" fill="hsl(var(--primary))" />
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontFamily="var(--font-geist-sans), sans-serif"
      fontSize="20"
      fontWeight="bold"
      fill="hsl(var(--primary-foreground))"
    >
      DANDALI
    </text>
  </svg>
);
export default DandaliLogo;
