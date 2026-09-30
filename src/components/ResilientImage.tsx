import React, { useState } from 'react';
import { getCategoryFallbackSvg, resolveAssetUrl } from '../data/seedData';

interface ResilientImageProps {
  src: string;
  fallbackSrc?: string;
  fallbackCategory?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  fallbackSrc,
  fallbackCategory,
  alt,
  className = '',
  imgClassName = '',
}) => {
  const resolvedPrimary = resolveAssetUrl(src);
  const resolvedFallback =
    resolveAssetUrl(fallbackSrc) || getCategoryFallbackSvg(fallbackCategory);

  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(
    resolvedPrimary || resolvedFallback
  );
  const [failedAll, setFailedAll] = useState(false);

  React.useEffect(() => {
    const nextPrimary = resolveAssetUrl(src);
    const nextFallback =
      resolveAssetUrl(fallbackSrc) || getCategoryFallbackSvg(fallbackCategory);
    setCurrentSrc(nextPrimary || nextFallback);
    setFailedAll(false);
  }, [src, fallbackSrc, fallbackCategory]);

  const handleError = () => {
    if (resolvedFallback && currentSrc !== resolvedFallback) {
      setCurrentSrc(resolvedFallback);
    } else {
      const studioSvg = getCategoryFallbackSvg(fallbackCategory);
      if (studioSvg && currentSrc !== studioSvg) {
        setCurrentSrc(studioSvg);
      } else {
        setFailedAll(true);
        setLoaded(true);
      }
    }
  };

  return (
    <div className={`relative overflow-hidden bg-[#15151B] ${className}`}>
      {!loaded && !failedAll && (
        <div className="absolute inset-0 skeleton-shimmer z-10" aria-hidden="true" />
      )}
      {failedAll ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#1A1A24] via-[#13131A] to-[#0E0E13]">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <i className="fa-solid fa-bolt text-[#6C63FF] text-lg" />
          </div>
          <span className="font-display text-xs font-semibold text-white/85 line-clamp-2">
            {alt}
          </span>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
};
