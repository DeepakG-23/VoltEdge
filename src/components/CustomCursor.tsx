import React, { useEffect, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsDesktop(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    if (!mediaQuery.matches) return;

    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const clickable = target.closest(
          'a, button, input, select, textarea, [role="button"], label'
        );
        setIsHovering(Boolean(clickable));
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!isDesktop || !isVisible) return null;

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[9999] hidden lg:block"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: 'transform 55ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className={`-translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200 ${
          isHovering
            ? 'w-9 h-9 border-[#FF6B35]/80 bg-[#6C63FF]/15 scale-110'
            : 'w-4 h-4 border-[#6C63FF]/75 bg-[#6C63FF]/25 scale-100'
        }`}
      />
    </div>
  );
};
