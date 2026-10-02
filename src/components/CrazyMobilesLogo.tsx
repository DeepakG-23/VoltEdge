import React from 'react';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'compact' | 'icon-only';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const CrazyMobilesEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = '',
}) => {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Neon Lime Green Gradient */}
        <linearGradient id="cmLime" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8FF3E" />
          <stop offset="50%" stopColor="#84F229" />
          <stop offset="100%" stopColor="#5BB716" />
        </linearGradient>

        {/* Metallic Chrome Gradient */}
        <linearGradient id="cmChrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#E2E8F0" />
          <stop offset="75%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Phone Frame Metallic Border */}
        <linearGradient id="cmPhoneBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Soft Cyber Screen Fill */}
        <linearGradient id="cmScreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E272D" />
          <stop offset="100%" stopColor="#11161A" />
        </linearGradient>

        {/* Lime Neon Glow Filter */}
        <filter id="cmLimeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#84F229" floodOpacity="0.45" />
        </filter>

        {/* Metallic 3D Drop Shadow */}
        <filter id="cmShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.65" />
        </filter>
      </defs>

      {/* Tilted Smartphone Body */}
      <g transform="rotate(-11 80 80)">
        {/* Outer Phone Shell with Chrome Bevel */}
        <rect
          x="34"
          y="20"
          width="76"
          height="120"
          rx="18"
          fill="url(#cmScreen)"
          stroke="url(#cmPhoneBorder)"
          strokeWidth="4.5"
          filter="url(#cmShadow)"
        />

        {/* Top Speaker / Camera Notch */}
        <rect x="58" y="27" width="28" height="4.5" rx="2.25" fill="#334155" />

        {/* Inner Screen Accent Border */}
        <rect
          x="39"
          y="36"
          width="66"
          height="96"
          rx="12"
          fill="none"
          stroke="#334155"
          strokeWidth="1"
          strokeOpacity="0.6"
        />

        {/* Bottom Chin Accent Indicator */}
        <rect x="62" y="130" width="20" height="3" rx="1.5" fill="#475569" />
      </g>

      {/* Aerodynamic Speed Lines extending from top-right of 'C' */}
      <g filter="url(#cmLimeGlow)">
        <rect x="90" y="44" width="34" height="5.5" rx="2.75" fill="url(#cmLime)" />
        <rect x="94" y="53" width="28" height="4.5" rx="2.25" fill="url(#cmLime)" />
        <rect x="98" y="61" width="20" height="3.5" rx="1.75" fill="url(#cmLime)" />
      </g>

      {/* The Letter "C" - Bold, Sweeping Neon Lime Curve */}
      <path
        d="M 94 48 C 86 44 76 43 64 48 C 50 54 42 66 42 84 C 42 102 52 116 68 119 C 78 121 88 118 95 112 L 87 99 C 83 103 76 105 70 104 C 59 102 55 94 55 84 C 55 74 61 63 71 60 C 78 58 84 60 88 63 Z"
        fill="url(#cmLime)"
        filter="url(#cmLimeGlow)"
      />

      {/* The Letter "M" - Futuristic Beveled Metallic Chrome */}
      <g filter="url(#cmShadow)">
        <path
          d="M 74 62 L 95 91 L 116 62 L 126 112 L 110 112 L 105 84 L 95 99 L 85 84 L 80 112 L 64 112 Z"
          fill="url(#cmChrome)"
          stroke="#64748B"
          strokeWidth="1.2"
        />
        {/* Chrome Highlight Polish on M */}
        <path
          d="M 77 66 L 95 91 L 86 86 L 82 108 L 68 108 Z"
          fill="#FFFFFF"
          fillOpacity="0.4"
        />
      </g>
    </svg>
  );
};

export const CrazyMobilesWordmark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}> = ({ size = 'md', className = '', showSubtitle = true }) => {
  const textSizes = {
    xs: { main: 'text-sm', sub: 'text-[9px]', bars: 'w-3 h-0.5' },
    sm: { main: 'text-base sm:text-lg', sub: 'text-[10px]', bars: 'w-4 h-0.5' },
    md: { main: 'text-xl sm:text-2xl', sub: 'text-xs', bars: 'w-5 h-0.5' },
    lg: { main: 'text-2xl sm:text-3xl', sub: 'text-sm', bars: 'w-6 h-1' },
    xl: { main: 'text-3xl sm:text-4xl lg:text-5xl', sub: 'text-base', bars: 'w-8 h-1' },
  }[size];

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* "CRAZY" with Neon Lime Triangle in 'A' */}
      <div
        className={`font-techno font-black tracking-wider uppercase flex items-center leading-none text-white ${textSizes.main}`}
        style={{
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.4)',
        }}
      >
        <span>CR</span>
        {/* Letter 'A' with Glowing Lime Triangle Accent */}
        <span className="relative inline-flex items-center justify-center">
          <span>A</span>
          {/* Inner Lime Triangle Aperture */}
          <span
            className="absolute left-1/2 -translate-x-1/2 top-[44%] w-0 h-0"
            style={{
              borderLeft: '4.5px solid transparent',
              borderRight: '4.5px solid transparent',
              borderBottom: '7px solid #84F229',
              filter: 'drop-shadow(0 0 3px #84F229)',
            }}
          />
        </span>
        <span>ZY</span>
      </div>

      {/* "— MOBILE —" Subtitle with Lime Bars */}
      {showSubtitle && (
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`bg-[#84F229] rounded-full shadow-[0_0_6px_#84F229] ${textSizes.bars}`} />
          <span
            className={`font-techno font-bold tracking-[0.28em] text-[#CBD5E1] uppercase ${textSizes.sub}`}
          >
            MOBILE
          </span>
          <span className={`bg-[#84F229] rounded-full shadow-[0_0_6px_#84F229] ${textSizes.bars}`} />
        </div>
      )}
    </div>
  );
};

export const CrazyMobilesLogo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const emblemSizes = {
    xs: 28,
    sm: 36,
    md: 46,
    lg: 64,
    xl: 84,
  }[size];

  if (variant === 'icon-only') {
    return <CrazyMobilesEmblem size={emblemSizes} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <CrazyMobilesEmblem size={emblemSizes} />
        <div className="flex flex-col">
          <div className="font-techno font-black text-sm tracking-wider text-white flex items-center leading-tight">
            <span>CR</span>
            <span className="relative inline-flex items-center justify-center">
              <span>A</span>
              <span
                className="absolute left-1/2 -translate-x-1/2 top-[44%] w-0 h-0"
                style={{
                  borderLeft: '3px solid transparent',
                  borderRight: '3px solid transparent',
                  borderBottom: '5px solid #84F229',
                  filter: 'drop-shadow(0 0 2px #84F229)',
                }}
              />
            </span>
            <span>ZY</span>
          </div>
          <span className="text-[8px] font-techno font-semibold tracking-[0.2em] text-[#84F229] uppercase leading-none">
            MOBILE
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-3 ${className}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-[#84F229] opacity-20 blur-2xl rounded-full scale-110 pointer-events-none" />
          <CrazyMobilesEmblem size={emblemSizes * 1.25} className="relative z-10" />
        </div>
        <CrazyMobilesWordmark size={size} showSubtitle={showSubtitle} />
      </div>
    );
  }

  // Default: Horizontal Lockup
  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      <CrazyMobilesEmblem size={emblemSizes} />
      <CrazyMobilesWordmark size={size} showSubtitle={showSubtitle} />
    </div>
  );
};
