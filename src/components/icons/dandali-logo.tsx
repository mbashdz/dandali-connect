import type { SVGProps } from 'react';

interface DandaliLogoProps extends SVGProps<SVGSVGElement> {
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const DandaliLogo = ({
  showWordmark = true,
  size = 'md',
  className = '',
  ...props
}: DandaliLogoProps) => {
  const sizeMap = {
    sm: { h: 32, w: showWordmark ? 120 : 32 },
    md: { h: 42, w: showWordmark ? 165 : 42 },
    lg: { h: 54, w: showWordmark ? 210 : 54 },
  };

  const { w, h } = sizeMap[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showWordmark ? "0 0 220 54" : "0 0 54 54"}
      width={w}
      height={h}
      className={`transition-transform duration-200 hover:scale-[1.02] ${className}`}
      aria-label="Dandali Connect Logo"
      {...props}
    >
      <defs>
        {/* Warm Terracotta to Sunset Amber Gradient */}
        <linearGradient id="dandali-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E05A2B" />
          <stop offset="60%" stopColor="#E76F38" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* African Gold Ochre Glow */}
        <linearGradient id="dandali-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Subtle drop shadow */}
        <filter id="dandali-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#E05A2B" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Emblem: Afrocentric Communal Circle / Arewa Knot Inspiration */}
      <g filter="url(#dandali-shadow)">
        {/* Outer stylized protective shield/circle */}
        <rect
          x="3"
          y="3"
          width="48"
          height="48"
          rx="15"
          fill="url(#dandali-primary-grad)"
        />

        {/* Inner geometric traditional communal motif (Dandali gathering center) */}
        <circle cx="27" cy="27" r="14" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.35" />
        
        {/* Interlocking community nodes (people meeting in the square) */}
        <circle cx="27" cy="18" r="3.5" fill="#FFFFFF" />
        <circle cx="35" cy="29" r="3" fill="url(#dandali-gold-grad)" />
        <circle cx="19" cy="29" r="3" fill="url(#dandali-gold-grad)" />
        
        {/* Connecting bonds of community */}
        <path
          d="M27 21.5 V27 M27 27 L21 30 M27 27 L33 30"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Center community star spark */}
        <circle cx="27" cy="27" r="2" fill="#FFFFFF" />
      </g>

      {/* Wordmark */}
      {showWordmark && (
        <g transform="translate(62, 0)">
          {/* Main Brand Title */}
          <text
            x="0"
            y="29"
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            fontSize="22"
            fontWeight="900"
            letterSpacing="-0.03em"
            className="fill-foreground"
          >
            Dandali
          </text>

          {/* Subtitle / Tag */}
          <text
            x="84"
            y="29"
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            fontSize="22"
            fontWeight="300"
            letterSpacing="-0.03em"
            fill="url(#dandali-primary-grad)"
          >
            •
          </text>

          <text
            x="96"
            y="29"
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            fontSize="18"
            fontWeight="700"
            letterSpacing="0.05em"
            fill="url(#dandali-primary-grad)"
          >
            AFRICA
          </text>

          {/* Tagline */}
          <text
            x="1"
            y="43"
            fontFamily="var(--font-geist-sans), system-ui, sans-serif"
            fontSize="10"
            fontWeight="500"
            letterSpacing="0.08em"
            className="fill-muted-foreground uppercase"
          >
            Connect &middot; Kasuwa &middot; Al'umma
          </text>
        </g>
      )}
    </svg>
  );
};

export default DandaliLogo;
