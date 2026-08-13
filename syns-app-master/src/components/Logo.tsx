// Логотип Sync - минималистичный SVG
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Буква S */}
      <path
        d="M30 35 C30 25 40 20 50 20 C65 20 75 28 75 40 C75 55 60 60 50 65 C35 72 25 80 25 90"
        stroke="var(--accent-blue)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Акцентная точка (символ цели) */}
      <circle
        cx="75"
        cy="40"
        r="6"
        fill="var(--accent-blue)"
      />
      
      {/* Линия прогресса снизу */}
      <path
        d="M20 95 L80 95"
        stroke="var(--accent-blue)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
};

export default Logo;
