import React from 'react';

interface ZaureLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ZaureLogo = ({
  showWordmark = true,
  size = 'md',
  className = '',
  ...props
}: ZaureLogoProps) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
  };

  const titleClasses = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const subtitleClasses = {
    sm: 'text-[7px] tracking-[0.26em]',
    md: 'text-[8px] sm:text-[9px] tracking-[0.28em]',
    lg: 'text-[10px] sm:text-xs tracking-[0.3em]',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none group ${className}`}
      {...props}
    >
      {/* Pure Vector SVG Emblem — Exact Interlocking Z & C Design */}
      <svg
        viewBox="0 0 284 304"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDimensions[size]} shrink-0 transition-transform duration-200 group-hover:scale-105`}
        aria-hidden="true"
      >
        {/* Top-Left & Main Z Ribbon (Terracotta Red-Orange) */}
        <path
          d="M 180 81 L 110 81 A 49 49 0 1 1 64 15 L 232 15 L 21 252 A 20.5 20.5 0 0 0 51.6 279.3 L 93 233"
          stroke="#EA5A28"
          strokeWidth="18.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interlocking Top-Right Loop & Bottom-Right C Ribbon (Warm Golden-Orange) */}
        <path
          d="M 119 204 L 262.6 42.3 A 20.5 20.5 0 0 0 232 15 L 122 139 C 78 188 92 289 172 289 L 222 289 A 46 46 0 1 0 178 230 L 143 226"
          stroke="#E88B28"
          strokeWidth="18.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`${titleClasses[size]} font-extrabold tracking-tight text-foreground leading-none`}
          >
            Zaure
          </span>
          <span
            className={`${subtitleClasses[size]} font-bold uppercase text-[#B94E28] dark:text-[#D46238] leading-none mt-1`}
          >
            CONNECT
          </span>
        </div>
      )}
    </div>
  );
};

export const DandaliLogo = ZaureLogo;
export default ZaureLogo;
