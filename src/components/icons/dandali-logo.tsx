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
  const heightMap = {
    sm: 'h-8 max-h-8',
    md: 'h-10 max-h-10',
    lg: 'h-14 max-h-14',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`} {...props}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={showWordmark ? "/images/zaure-logo.jpg" : "/images/zaure-icon.png"}
        alt="Zaure Connect Logo"
        className={`${heightMap[size]} w-auto object-contain rounded-xl shadow-xs transition-transform duration-200 hover:scale-[1.02]`}
      />
    </div>
  );
};

export const DandaliLogo = ZaureLogo;
export default ZaureLogo;
