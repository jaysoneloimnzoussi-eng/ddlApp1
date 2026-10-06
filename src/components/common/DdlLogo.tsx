import React, { useState } from 'react';

export interface DdlLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  bordered?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showLabel?: boolean;
  labelVariant?: 'compact' | 'full';
  theme?: 'light' | 'dark' | 'auto';
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: { box: 'w-7 h-7', img: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]' },
  sm: { box: 'w-10 h-10', img: 'w-10 h-10', text: 'text-sm', sub: 'text-[10px]' },
  md: { box: 'w-12 h-12', img: 'w-12 h-12', text: 'text-base', sub: 'text-[11px]' },
  lg: { box: 'w-16 h-16', img: 'w-16 h-16', text: 'text-lg', sub: 'text-xs' },
  xl: { box: 'w-24 h-24', img: 'w-24 h-24', text: 'text-xl', sub: 'text-xs' },
  '2xl': { box: 'w-36 h-36', img: 'w-36 h-36', text: 'text-2xl', sub: 'text-sm' },
};

const ROUNDED_MAP = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

// Primary logo asset path (Vite public & src asset fallbacks)
const LOGO_SRC = '/logo-ddl-pn.jpg';
const BACKUP_SRC = '/src/assets/images/logo_officiel_ddl_pn_1791274431440.jpg';

export const DdlLogo: React.FC<DdlLogoProps> = ({
  size = 'md',
  className = '',
  bordered = true,
  rounded = 'xl',
  showLabel = false,
  labelVariant = 'full',
  onClick,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(LOGO_SRC);
  const [hasError, setHasError] = useState(false);

  const { box, text, sub } = SIZE_MAP[size] || SIZE_MAP.md;
  const roundedClass = ROUNDED_MAP[rounded] || 'rounded-xl';

  const handleImgError = () => {
    if (imgSrc === LOGO_SRC) {
      setImgSrc(BACKUP_SRC);
    } else {
      setHasError(true);
    }
  };

  const imageElement = (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${box} ${roundedClass} ${
        bordered
          ? 'p-0.5 bg-gradient-to-br from-emerald-600 via-amber-400 to-red-600 shadow-md ring-1 ring-emerald-500/20'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className={`w-full h-full overflow-hidden ${roundedClass} bg-slate-950 flex items-center justify-center`}>
        {!hasError ? (
          <img
            src={imgSrc}
            alt="Logo Officiel Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)"
            referrerPolicy="no-referrer"
            onError={handleImgError}
            className={`w-full h-full object-cover object-center ${roundedClass} transition-transform duration-300 hover:scale-105`}
            loading="lazy"
          />
        ) : (
          // Elegant SVG fallback with Congolese Colors & African Drum
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 p-1 text-center">
            <svg viewBox="0 0 100 100" className="w-4/5 h-4/5" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Roof Chevron */}
              <path d="M50 15 L75 30 L50 25 L25 30 Z" fill="#F59E0B" />
              {/* Drum */}
              <path d="M35 38 Q50 34 65 38 L58 75 Q50 78 42 75 Z" fill="#DC2626" stroke="#FBBF24" strokeWidth="2" />
              <ellipse cx="50" cy="38" rx="15" ry="5" fill="#FDE047" stroke="#D97706" strokeWidth="1.5" />
              {/* Left dancer */}
              <circle cx="24" cy="40" r="3" fill="#10B981" />
              <path d="M24 43 L22 55 M24 47 L18 42 M24 47 L29 45 M22 55 L19 65 M22 55 L26 64" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
              {/* Right dancer */}
              <circle cx="76" cy="40" r="3" fill="#F59E0B" />
              <path d="M76 43 L78 55 M76 47 L82 42 M76 47 L71 45 M78 55 L81 65 M78 55 L74 64" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
              {/* Bottom bar */}
              <rect x="20" y="86" width="60" height="3" rx="1.5" fill="#FBBF24" />
              <polygon points="50,91 52,95 56,95 53,97 54,100 50,98 46,100 47,97 44,95 48,95" fill="#EF4444" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (!showLabel) {
    return imageElement;
  }

  return (
    <div className="flex items-center gap-3">
      {imageElement}
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className={`font-cinzel font-bold tracking-wider ${text}`}>
            DDL-PN
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
            v3.0 Souverain
          </span>
        </div>
        {labelVariant === 'full' ? (
          <p className={`${sub} text-slate-500 dark:text-slate-400 font-medium truncate max-w-[280px] md:max-w-md`}>
            Direction Départementale des Loisirs de Pointe-Noire (MCAPNIT / DGL)
          </p>
        ) : (
          <p className={`${sub} text-slate-500 dark:text-slate-400 font-medium`}>
            MCAPNIT • DGL • Pointe-Noire
          </p>
        )}
      </div>
    </div>
  );
};
