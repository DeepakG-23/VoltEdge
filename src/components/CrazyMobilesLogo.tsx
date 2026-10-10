import React from 'react';

interface LogoProps {
  variant?: 'full' | 'horizontal' | 'compact' | 'icon-only' | 'stacked';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Authentic Crazy Mobiles Emblem
 * Featuring the signature tilted smartphone geometry, speed lines,
 * and the iconic 'CM' (Crazy Mobiles) monogram in electric lime and metallic blue.
 */
export const CrazyMobilesEmblem: React.FC<{
  size?: number;
  className?: string;
  theme?: 'light' | 'dark';
}> = ({ size = 44, className = '', theme = 'light' }) => {
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Crazy Mobiles Emblem"
    >
      <defs>
        {/* Warm Amber Gold Accent Gradient */}
        <linearGradient id="cmNeonLime" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Dynamic Electric Blue / Slate Gradient */}
        <linearGradient id="cmElectricBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="60%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Metallic Bevel for Mobile Frame */}
        <linearGradient id="cmPhoneBevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.2" />
        </linearGradient>

        {/* Glow & Soft Drop Shadow */}
        <filter id="cmDropGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.35" />
        </filter>
        <filter id="cmBadgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Hex-rounded badge container */}
      <rect
        x="12"
        y="12"
        width="136"
        height="136"
        rx="34"
        fill="url(#cmElectricBlue)"
        filter="url(#cmBadgeShadow)"
      />

      {/* Inner metallic border */}
      <rect
        x="16"
        y="16"
        width="128"
        height="128"
        rx="30"
        fill="none"
        stroke="url(#cmPhoneBevel)"
        strokeWidth="1.5"
      />

      {/* Tilted Smartphone silhouette */}
      <g transform="translate(80 78) rotate(-7) translate(-80 -78)">
        {/* Phone Frame */}
        <rect
          x="44"
          y="32"
          width="72"
          height="96"
          rx="14"
          fill="#0B0F19"
          stroke="#38BDF8"
          strokeWidth="2.2"
        />
        {/* Top Speaker / Dynamic Island Notch */}
        <rect x="68" y="38" width="24" height="4" rx="2" fill="#64748B" />
        {/* Inner Screen Accent */}
        <rect
          x="49"
          y="46"
          width="62"
          height="74"
          rx="9"
          fill="#111827"
          fillOpacity="0.9"
        />
      </g>

      {/* Aerodynamic Speed Lines */}
      <g filter="url(#cmDropGlow)">
        <rect x="94" y="52" width="22" height="4" rx="2" fill="url(#cmNeonLime)" />
        <rect x="98" y="60" width="18" height="3.5" rx="1.75" fill="url(#cmNeonLime)" />
        <rect x="102" y="68" width="14" height="3" rx="1.5" fill="url(#cmNeonLime)" />
      </g>

      {/* Iconic 'C' - Bold Neon Curve */}
      <path
        d="M 88 56 C 80 50 68 50 58 56 C 46 64 42 78 44 94 C 46 108 56 118 70 120 C 80 122 88 118 94 112 L 86 100 C 82 104 76 106 70 105 C 59 103 56 94 56 86 C 56 76 61 66 70 63 C 76 61 82 63 86 66 Z"
        fill="url(#cmNeonLime)"
        filter="url(#cmDropGlow)"
      />

      {/* Iconic 'M' - Sleek Metallic Chrome */}
      <path
        d="M 66 70 L 80 92 L 94 70 L 102 110 L 90 110 L 86 88 L 80 98 L 74 88 L 70 110 L 58 110 Z"
        fill="#FFFFFF"
        stroke="#94A3B8"
        strokeWidth="1"
      />

      {/* Tiny Lightning Energy Spark at top left */}
      <path
        d="M 32 30 L 26 42 L 33 42 L 29 52 L 40 39 L 33 39 Z"
        fill="url(#cmNeonLime)"
        filter="url(#cmDropGlow)"
      />
    </svg>
  );
};

/**
 * Crazy Mobiles Wordmark
 * Displays CRAZY MOBILES with precision typography and subtitle
 */
export const CrazyMobilesWordmark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  theme?: 'light' | 'dark';
}> = ({ size = 'md', className = '', showSubtitle = true, theme = 'light' }) => {
  const textSizes = {
    xs: { main: 'text-xs sm:text-sm', sub: 'text-[9px]' },
    sm: { main: 'text-sm sm:text-base', sub: 'text-[10px]' },
    md: { main: 'text-base sm:text-lg', sub: 'text-[11px]' },
    lg: { main: 'text-lg sm:text-xl', sub: 'text-xs' },
    xl: { main: 'text-xl sm:text-2xl', sub: 'text-xs' },
  }[size];

  const primaryTextColor = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const subTextColor = theme === 'dark' ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className={`flex flex-col text-left select-none ${className}`}>
      <div
        className={`font-black tracking-tight uppercase flex items-center gap-1.5 leading-none ${primaryTextColor} ${textSizes.main}`}
      >
        <span className="text-blue-600 tracking-wider">CRAZY</span>
        <span className="font-extrabold tracking-normal">MOBILES</span>
      </div>

      {showSubtitle && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm animate-pulse" />
          <span
            className={`font-semibold tracking-wider uppercase text-[10px] sm:text-[11px] ${subTextColor}`}
          >
            Smartphones &amp; Smart Gear
          </span>
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
  theme = 'light',
}) => {
  const emblemSizes = {
    xs: 28,
    sm: 34,
    md: 40,
    lg: 50,
    xl: 64,
  }[size];

  if (variant === 'icon-only') {
    return <CrazyMobilesEmblem size={emblemSizes} theme={theme} className={className} />;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`}>
        <CrazyMobilesEmblem size={emblemSizes} theme={theme} />
        <CrazyMobilesWordmark size={size} showSubtitle={false} theme={theme} />
      </div>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center gap-2 ${className}`}>
        <CrazyMobilesEmblem size={emblemSizes * 1.2} theme={theme} />
        <CrazyMobilesWordmark size={size} showSubtitle={showSubtitle} theme={theme} />
      </div>
    );
  }

  // Default: Horizontal Lockup
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <CrazyMobilesEmblem size={emblemSizes} theme={theme} />
      <CrazyMobilesWordmark size={size} showSubtitle={showSubtitle} theme={theme} />
    </div>
  );
};
