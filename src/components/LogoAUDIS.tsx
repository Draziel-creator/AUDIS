import React from 'react';

interface LogoAUDISProps {
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Minimalist black/white line logo for AUDIS.
 * Design: The letter 'A' that flows down seamlessly into an infinity (∞) loop at the base.
 * Clean, modern Meta/ChatGPT aesthetic with thin precision strokes.
 */
export const LogoAUDIS: React.FC<LogoAUDISProps> = ({ 
  className = "w-8 h-8", 
  size = 32,
  color = "currentColor"
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AUDIS Logo"
    >
      <defs>
        <linearGradient id="audisGrad" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#818cf8" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>

      {/* The Letter A apex flowing into an elegant infinity symbol at the base */}
      {/* Path 1: Left apex curve down into the left loop of infinity, crossing center */}
      <path
        d="M24 6 C20 14, 15 24, 11 31 C8 36, 8 41, 14 41 C20 41, 23 35, 24 33 C25 35, 28 41, 34 41 C40 41, 40 36, 37 31 C33 24, 28 14, 24 6 Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Subtle modern crossbar of the A with a slight float / connecting node */}
      <path
        d="M16.5 24 C19 22.5, 29 22.5, 31.5 24"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Center continuous infinity intersection accent dot / spark */}
      <circle cx="24" cy="33.5" r="1.5" fill={color} />
    </svg>
  );
};

export default LogoAUDIS;
