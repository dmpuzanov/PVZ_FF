import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'monochrome' | 'dark' | 'sticker';
  className?: string;
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  className = '',
  showSubtitle = true,
}) => {
  // Brand color constants
  const goldStroke = '#C5A059'; // Metallic warm brass / gold from logo
  const burgundyFill = '#74113F'; // Deep Burgundy / wine from logo

  if (variant === 'sticker') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Compact Geometric Hexagon Mark */}
        <svg viewBox="0 0 100 100" className="w-5 h-5 shrink-0" aria-label="priv.ent. puzanova mark">
          {/* Hexagon Outline */}
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill="none"
            stroke="#000000"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          {/* Circular Dot inside upper-right area */}
          <circle cx="70" cy="34" r="11" fill="#000000" />
        </svg>
        <div className="flex flex-col text-left leading-none">
          <span className="font-sans font-black text-[9px] uppercase tracking-tight text-black">
            priv.ent. puzanova
          </span>
          <span className="text-[7px] font-bold text-black uppercase">ИП Пузанова Т.Ю.</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-7 h-7 shrink-0" aria-label="priv.ent. puzanova emblem">
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill="none"
            stroke={goldStroke}
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <circle cx="70" cy="34" r="11" fill={burgundyFill} />
        </svg>
        <div className="flex flex-col text-left">
          <span className="font-sans font-black tracking-tight text-xs text-white uppercase leading-tight">
            priv.ent. puzanova
          </span>
          {showSubtitle && (
            <span className="text-[9px] font-bold text-[#E5C378] uppercase tracking-wider">
              ИП Пузанова Т.Ю.
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Precision Geometric Hexagon Emitting Brand Geometry */}
      <div className="relative shrink-0 flex items-center justify-center p-1">
        <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-sm" aria-label="priv.ent. puzanova emblem">
          {/* Subtle Outer Glow / Shadow */}
          <defs>
            <linearGradient id="goldHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DFC386" />
              <stop offset="50%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#A88135" />
            </linearGradient>
            <linearGradient id="burgundyDotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8C174E" />
              <stop offset="100%" stopColor="#630D35" />
            </linearGradient>
          </defs>

          {/* Hexagon Outline */}
          <polygon
            points="50,5 92,27 92,73 50,95 8,73 8,27"
            fill="none"
            stroke="url(#goldHexGradient)"
            strokeWidth="7.5"
            strokeLinejoin="round"
          />

          {/* Circular Dot inside upper-right internal space */}
          <circle cx="69" cy="35" r="11.5" fill="url(#burgundyDotGradient)" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col text-left">
        <div className="font-sans font-black tracking-tight leading-[1.05]">
          <div className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-1.5">
            <span className="text-white">priv.ent.</span>
            <span className="text-[#F3E5C8] font-extrabold">puzanova</span>
          </div>
        </div>
        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#E5C378] uppercase tracking-wider">
              ИП Пузанова Т.Ю.
            </span>
            <span className="text-[9px] text-neutral-400 font-bold">•</span>
            <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">
              Владелец ПВЗ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BRAND_CONFIG = {
  legalName: 'ИП Пузанова Т.Ю.',
  fullName: 'Индивидуальный предприниматель Пузанова Татьяна Юрьевна',
  brandName: 'priv.ent. puzanova',
  inn: '502915830914',
  ogrnip: '319508100088921',
  pvzAddress: 'г. Москва, ул. Складская, д. 14, стр. 2 (ПВЗ Фулфилмент WB/Ozon)',
  phone: '+7 (926) 880-14-55',
  email: 'puzanova.pvz@mail.ru',
  workingHours: 'Пн-Вс: 08:00 – 21:00 (без выходных)',
  theme: {
    burgundy: '#74113F',
    burgundyDark: '#580B2F',
    burgundyLight: '#8F1950',
    gold: '#C5A059',
    goldLight: '#E8D4A8',
    goldDark: '#9E7A31',
  },
};
