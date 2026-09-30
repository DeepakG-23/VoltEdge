import React, { useEffect, useRef, useState } from 'react';
import {
  CATEGORIES_DATA,
  DEFAULT_HOME_PAGE_CONFIG,
  HERO_ECOSYSTEM_IMAGE,
  HomePageConfig,
  Product,
  ProductReview,
  formatINR,
} from '../data/seedData';
import { ProductCard } from './ProductCard';
import { ResilientImage } from './ResilientImage';

/* ==========================================================================
   HOME VIEW (#/home)
   ========================================================================== */
interface HomeViewProps {
  products: Product[];
  homeConfig?: HomePageConfig;
  wishlistIds: number[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  onNavigateProduct: (productId: number) => void;
  onNavigateCategory: (category: string) => void;
  onQuickView: (product: Product) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  homeConfig = DEFAULT_HOME_PAGE_CONFIG,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onNavigateProduct,
  onNavigateCategory,
  onQuickView,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Admin-selected existing products for Main Home Screen Hero Division
  const heroProducts = products.filter((p) =>
    homeConfig.heroFeaturedProductIds.includes(p.id)
  );
  const effectiveHeroProducts =
    heroProducts.length > 0 ? heroProducts : products.slice(0, 4);

  const [activeHeroIdx, setActiveHeroIdx] = useState(0);

  useEffect(() => {
    if (activeHeroIdx >= effectiveHeroProducts.length) {
      setActiveHeroIdx(0);
    }
  }, [effectiveHeroProducts.length, activeHeroIdx]);

  const currentHeroProduct =
    effectiveHeroProducts[activeHeroIdx] || effectiveHeroProducts[0] || products[0];

  // Admin-selected existing products under Sale
  const saleProducts = products.filter((p) =>
    homeConfig.saleProductIds.includes(p.id)
  );

  // Admin-selected existing products in Trending Now carousel
  const trendingCarouselProducts = products.filter((p) =>
    homeConfig.trendingProductIds.includes(p.id)
  );
  const effectiveTrendingProducts =
    trendingCarouselProducts.length > 0 ? trendingCarouselProducts : products;

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = 340;
    carouselRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="animate-page-enter">
      {/* HERO SECTION (full viewport height) */}
      <section className="relative min-h-[calc(100vh-4.25rem)] flex flex-col justify-between overflow-hidden pb-12 lg:pb-16 border-b border-white/[0.06]">
        {/* Animated CSS Gradient Mesh & Floating Geometric Shapes (div:nth-of-type(1)) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="StoreHeroGlow1 absolute -top-28 -left-24 w-[460px] h-[460px] rounded-full bg-[#6C63FF]/15 blur-[130px] animate-float-slow" />
          <div className="StoreHeroGlow2 absolute top-1/3 -right-28 w-[420px] h-[420px] rounded-full bg-[#FF6B35]/12 blur-[130px] animate-float-reverse" />
          <div className="absolute top-24 right-[15%] w-28 h-28 rounded-2xl border border-white/[0.05] rotate-12 animate-float-slow hidden lg:block" />
          <div className="absolute bottom-28 left-[8%] w-20 h-20 rounded-full border border-[#6C63FF]/15 animate-float-reverse hidden lg:block" />
        </div>

        {/* SLIDING SALES BAR (Controlled from Admin Settings -> Sales Menu) */}
        {homeConfig.salesBarEnabled && saleProducts.length > 0 && (
          <aside className="relative z-20 w-full bg-gradient-to-r from-[#17152B] via-[#1E141C] to-[#17152B] border-b border-white/10 py-2.5 overflow-hidden">
            <div className="animate-sales-marquee items-center gap-8">
              {[0, 1].map((dupIdx) => {
                const activeSalePct =
                  homeConfig.salesPercentage || homeConfig.salePercentage || 30;
                const activeSaleTitle =
                  homeConfig.salesHeadline ||
                  homeConfig.saleCampaignTitle ||
                  'VOLTEDGE FLASH POWER SALE';
                return (
                  <div key={dupIdx} className="flex items-center gap-8 px-4">
                    <div className="flex items-center gap-2.5 text-xs font-display font-bold text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-electric-gradient text-[11px] font-mono-num text-white shadow-sm">
                        FLAT {activeSalePct}% OFF
                      </span>
                      <span className="tracking-wide text-white">
                        {activeSaleTitle}
                      </span>
                    </div>

                    {saleProducts.map((sp) => {
                      const discountedPrice = Math.max(
                        1,
                        Math.round(sp.price * (1 - activeSalePct / 100))
                      );
                      return (
                        <button
                          key={`${dupIdx}-${sp.id}`}
                          type="button"
                          onClick={() => onNavigateProduct(sp.id)}
                          className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#0A0A0B]/75 hover:bg-[#0A0A0B] border border-white/15 transition-colors whitespace-nowrap group"
                        >
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                            <ResilientImage
                              src={sp.image}
                              fallbackCategory={sp.category}
                              alt={sp.shortName}
                              className="w-full h-full"
                              imgClassName="object-cover"
                            />
                          </div>
                          <span className="text-xs font-medium text-white group-hover:text-[#FF6B35] transition-colors">
                            {sp.shortName}
                          </span>
                          <span className="text-xs font-mono-num font-bold text-emerald-400">
                            {formatINR(discountedPrice)}
                          </span>
                          <span className="text-[10px] font-mono-num text-[#6B6B7B] line-through">
                            {formatINR(sp.price)}
                          </span>
                          <span className="text-[10px] font-mono-num text-[#FF6B35] font-semibold">
                            −{activeSalePct}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* SELECTED DIVISION (section:nth-of-type(1) > div:nth-of-type(2)):
            Admin-Controlled Main Home Screen Showcase */}
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12 relative z-10 my-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wider uppercase text-[#A0A0B0]">
                <span className="w-2 h-2 rounded-full bg-electric-gradient" />
                <span>
                  Series 04 · {effectiveHeroProducts.length} Featured Main Screen Gear
                </span>
              </div>

              <h1
                className="font-display text-4xl sm:text-5xl lg:text-[64px] font-bold text-white leading-[1.06] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {homeConfig.heroHeadline || 'Power Up Your Phone'}
              </h1>

              <p className="text-base sm:text-[20px] text-[#6B6B7B] sm:text-[#A0A0B0] max-w-xl leading-relaxed font-normal">
                {homeConfig.heroSubtext ||
                  'Premium mobile accessories engineered for performance. Precision GaN III charging, cryo-aligned N52 MagSafe architecture, and flagship acoustics.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateCategory('All')}
                  className="px-8 py-4 rounded-[8px] bg-electric-gradient text-white font-display text-sm sm:text-base font-semibold shadow-electric-glow hover:scale-105 transition-transform duration-300 flex items-center gap-2.5 whitespace-nowrap"
                >
                  <span>Shop Now</span>
                  <i className="fa-solid fa-arrow-right text-xs" />
                </button>

                {currentHeroProduct && (
                  <button
                    type="button"
                    onClick={() => onNavigateProduct(currentHeroProduct.id)}
                    className="px-6 py-4 rounded-[8px] bg-[#1A1A1F] hover:bg-[#22222A] text-white border border-white/10 text-sm font-medium transition-all duration-300 whitespace-nowrap"
                  >
                    Explore {currentHeroProduct.shortName} ·{' '}
                    {formatINR(currentHeroProduct.price)}
                  </button>
                )}
              </div>

              {/* Admin-Selected Main Home Screen Products Switcher */}
              {effectiveHeroProducts.length > 0 && (
                <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#A0A0B0]">
                    <span>Featured on Home Screen (Select to Preview):</span>
                    <span className="font-mono-num text-[11px] text-[#6B6B7B]">
                      {activeHeroIdx + 1} / {effectiveHeroProducts.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {effectiveHeroProducts.map((prod, idx) => {
                      const isSelected = idx === activeHeroIdx;
                      const isOnSale = homeConfig.saleProductIds.includes(prod.id);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setActiveHeroIdx(idx)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-[#1A1A1F] border-[#6C63FF] ring-1 ring-[#6C63FF] shadow-md'
                              : 'bg-[#111113]/80 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0A0A0B] border border-white/10 shrink-0">
                            <ResilientImage
                              src={prod.image}
                              alt={prod.shortName}
                              className="w-full h-full"
                              imgClassName="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-display text-[11px] font-bold text-white truncate">
                              {prod.shortName}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono-num text-[11px]">
                              <span className="text-[#FF6B35] font-semibold">
                                {formatINR(prod.price)}
                              </span>
                              {isOnSale && homeConfig.salesBarEnabled && (
                                <span className="text-[9px] text-emerald-400">
                                  −{homeConfig.salePercentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Hardware Ecosystem Showcase (Driven by Active Selected Product) */}
            <div className="lg:col-span-6">
              {currentHeroProduct ? (
                <div className="relative rounded-[16px] overflow-hidden border border-white/10 bg-[#111113] shadow-card group">
                  <div className="aspect-[16/11] w-full bg-[#14141B] relative">
                    <ResilientImage
                      src={currentHeroProduct.image || HERO_ECOSYSTEM_IMAGE}
                      fallbackSrc={HERO_ECOSYSTEM_IMAGE}
                      alt={currentHeroProduct.name}
                      className="w-full h-full"
                      imgClassName="group-hover:scale-103 transition-transform duration-700 object-cover"
                    />
                    {homeConfig.salesBarEnabled &&
                      homeConfig.saleProductIds.includes(currentHeroProduct.id) && (
                        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-electric-gradient text-white font-mono-num text-xs font-bold shadow-electric-glow">
                          FLASH SALE · {homeConfig.salePercentage}% OFF
                        </div>
                      )}
                  </div>

                  {/* Measured Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/95 via-[#0A0A0B]/30 to-transparent flex items-end p-6">
                    <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#A0A0B0]">
                          <span>{currentHeroProduct.category}</span>
                          <span>·</span>
                          <span className="text-[#F59E0B] font-mono-num">
                            ★ {currentHeroProduct.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="font-display text-lg sm:text-xl font-bold text-white">
                          {currentHeroProduct.name}
                        </p>
                        <p className="text-xs text-[#A0A0B0] line-clamp-1 max-w-md">
                          {currentHeroProduct.tagline}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAddToCart(currentHeroProduct, 1)}
                          className="px-4 py-2.5 rounded-[8px] bg-[#1A1A1F]/90 hover:bg-[#252530] border border-white/15 text-xs font-semibold text-white transition-all whitespace-nowrap"
                        >
                          + Add to Bag
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateProduct(currentHeroProduct.id)}
                          className="px-4 py-2.5 rounded-[8px] bg-electric-gradient text-xs font-semibold text-white shadow-electric-glow transition-all whitespace-nowrap"
                        >
                          View · {formatINR(currentHeroProduct.price)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* 4 TRUST BADGES ROW BELOW HERO */}
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: 'fa-truck-fast',
                title: 'Free Shipping',
                desc: 'Express dispatch on orders above ₹499',
              },
              {
                icon: 'fa-shield-halved',
                title: '1-Yr Warranty',
                desc: 'Doorstep replacement across India',
              },
              {
                icon: 'fa-indian-rupee-sign',
                title: 'COD Available',
                desc: 'Pay via UPI or Cash on Delivery',
              },
              {
                icon: 'fa-rotate-left',
                title: '7-Day Returns',
                desc: 'No-questions-asked instant exchange',
              },
            ].map((badge) => (
              <div
                key={badge.title}
                className="bg-[#111113] border border-white/[0.07] rounded-[16px] p-4 sm:p-5 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#1A1A1F] border border-white/10 flex items-center justify-center shrink-0 text-[#6C63FF]">
                  <i className={`fa-solid ${badge.icon} text-sm`} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-sm font-semibold text-white truncate">
                    {badge.title}
                  </h2>
                  <p className="text-xs text-[#A0A0B0] truncate">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY SECTION (80px section padding, 6 category cards 2x3 mobile, 3x2 desktop) */}
      <section className="py-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-[32px] font-bold text-white leading-tight">
              Shop by Category
            </h2>
            <p className="text-sm text-[#A0A0B0] mt-1">
              Precision-engineered gear tailored for every daily carry setup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateCategory('All')}
            className="text-xs font-semibold text-[#A0A0B0] hover:text-white flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <span>Browse Full Catalog</span>
            <i className="fa-solid fa-arrow-right text-[11px]" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {CATEGORIES_DATA.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onNavigateCategory(cat.name)}
              className="group category-perspective text-left h-[250px] sm:h-[264px] w-full rounded-2xl focus:outline-none transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="category-flip-inner rounded-2xl shadow-card">
                {/* FRONT FACE (0deg): Category Photos (Cases, Cables, Chargers, etc.) + Info */}
                <div className="category-face bg-[#1A1A1F] border border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between">
                  {/* Subtle Ambient Radial Glow */}
                  <div
                    className="absolute -right-8 -top-8 w-44 h-44 rounded-full pointer-events-none opacity-25"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(108,99,255,0.45) 0%, rgba(255,107,53,0.2) 55%, transparent 75%)',
                    }}
                  />

                  {/* Top Row: Category Icon Badge + Product Photos Collage */}
                  <div className="relative z-10 flex items-start justify-between gap-3 w-full">
                    <div className="space-y-2">
                      <div className="w-11 h-11 rounded-xl bg-[#111113] border border-white/10 flex items-center justify-center text-white rotate-180-on-hover">
                        <i className={`fa-solid ${cat.icon} text-base text-electric-gradient`} />
                      </div>
                      <span className="block text-[11px] text-[#A0A0B0] font-mono-num">
                        {cat.count} · From {formatINR(cat.startingPrice)}
                      </span>
                    </div>

                    {/* Dual Product Photo Showcase (Primary + Secondary Category Hardware) */}
                    <div className="relative flex items-center">
                      {/* Secondary Category Item Photo */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#111113] border border-white/15 shadow-lg -mr-4 mt-4 rotate-[-6deg] transition-transform duration-500 group-hover:rotate-180">
                        <ResilientImage
                          src={cat.secondaryImage}
                          alt={`${cat.name} secondary item`}
                          className="w-full h-full"
                          imgClassName="object-cover"
                        />
                      </div>

                      {/* Primary Category Item Photo */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#111113] border-2 border-[#6C63FF]/40 shadow-2xl relative z-10 rotate-180-on-hover">
                        <ResilientImage
                          src={cat.image}
                          alt={cat.name}
                          className="w-full h-full"
                          imgClassName="object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Category Title, Subtitle & Hover Flip Hint */}
                  <div className="relative z-10 flex items-end justify-between gap-3 pt-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#A0A0B0] truncate mt-0.5">
                        {cat.subtitle}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#6B6B7B] font-mono-num flex items-center gap-1 shrink-0">
                      <i className="fa-solid fa-rotate text-[10px] text-[#6C63FF]" />
                      <span>180°</span>
                    </span>
                  </div>
                </div>

                {/* BACK FACE (Rotated 180deg on Hover): Full Category Photo Showcase & Gear Manifest */}
                <div className="category-face category-face-back bg-[#14141A] border border-[#6C63FF]/60 p-5 sm:p-6 flex flex-col justify-between shadow-electric-glow">
                  {/* Backdrop Category Photo with Dark Gradient Overlay */}
                  <div className="absolute inset-0 opacity-25 pointer-events-none">
                    <ResilientImage
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full"
                      imgClassName="object-cover scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#111113]/85 to-[#111113]/60" />
                  </div>

                  {/* Top: Dual Side-by-Side Category Product Photos */}
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0A0A0B] border border-[#6C63FF]/50 shrink-0 shadow-md">
                        <ResilientImage
                          src={cat.image}
                          alt={cat.featuredItems[0]}
                          className="w-full h-full"
                          imgClassName="object-cover"
                        />
                      </div>
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0A0A0B] border border-[#FF6B35]/50 shrink-0 shadow-md">
                        <ResilientImage
                          src={cat.secondaryImage}
                          alt={cat.featuredItems[1]}
                          className="w-full h-full"
                          imgClassName="object-cover"
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#A0A0B0] block">Starting At</span>
                      <span className="font-mono-num text-base font-bold text-electric-gradient">
                        {formatINR(cat.startingPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Category Gear Manifest */}
                  <div className="relative z-10 my-auto py-2">
                    <h3 className="font-display text-base font-bold text-white mb-1.5">
                      {cat.name} Lineup
                    </h3>
                    <div className="space-y-1">
                      {cat.featuredItems.map((itemLabel) => (
                        <div
                          key={itemLabel}
                          className="flex items-center gap-2 text-xs text-white/90"
                        >
                          <i className="fa-solid fa-check text-[10px] text-[#FF6B35]" />
                          <span className="truncate">{itemLabel}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom: Action Bar */}
                  <div className="relative z-10 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-semibold">
                    <span className="text-white">Explore {cat.count}</span>
                    <span className="px-3 py-1.5 rounded-[8px] bg-electric-gradient text-white flex items-center gap-1.5 shadow-sm">
                      <span>Shop Now</span>
                      <i className="fa-solid fa-arrow-right text-[10px]" />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS ("Trending Now" Carousel + Admin-Managed Trending Product Photo & Description Spotlights) */}
      <section className="py-20 bg-[#111113] border-y border-white/[0.06]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div>
            <div className="flex items-center justify-between gap-4 mb-10">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-[32px] font-bold text-white leading-tight">
                    Trending Now
                  </h2>
                  <i
                    className="fa-solid fa-fire-flame-curved text-[#FF6B35] text-2xl"
                    aria-hidden="true"
                  />
                </div>
                <p className="text-sm text-[#A0A0B0] mt-1">
                  Our highest-rated performance accessories dispatched across India this week.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  aria-label="Scroll left"
                  className="w-10 h-10 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-[#A0A0B0] hover:text-white hover:border-[#6C63FF] flex items-center justify-center transition-all"
                >
                  <i className="fa-solid fa-chevron-left text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  aria-label="Scroll right"
                  className="w-10 h-10 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-[#A0A0B0] hover:text-white hover:border-[#6C63FF] flex items-center justify-center transition-all"
                >
                  <i className="fa-solid fa-chevron-right text-xs" />
                </button>
              </div>
            </div>

            {/* Horizontal Snap-Scroll Row */}
            <div
              ref={carouselRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
            >
              {effectiveTrendingProducts.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[275px] sm:min-w-[300px] max-w-[300px] snap-start shrink-0"
                >
                  <ProductCard
                    product={product}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onNavigateProduct={onNavigateProduct}
                    onQuickView={onQuickView}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECOND TRENDING SECTION: Trending Product Photo + Product + Description Spotlights */}
          {homeConfig.trendingSpotlights && homeConfig.trendingSpotlights.length > 0 && (
            <div className="pt-8 border-t border-white/[0.07] space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-[#FF6B35] uppercase tracking-wider">
                    Curated Trending Spotlight
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
                    In-Depth Trending Hardware Showcase
                  </h3>
                </div>
                <p className="text-xs text-[#A0A0B0]">
                  Featured gear photography, full engineering narrative, and instant bag access.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {homeConfig.trendingSpotlights.map((spot) => {
                  const linkedProduct =
                    products.find((p) => p.id === spot.productId) || products[0];
                  if (!linkedProduct) return null;

                  const isOnSale =
                    homeConfig.salesBarEnabled &&
                    homeConfig.saleProductIds.includes(linkedProduct.id);
                  const displayPhoto = spot.customImage || linkedProduct.image;

                  return (
                    <div
                      key={spot.id}
                      className="bg-[#1A1A1F] rounded-[16px] border border-white/[0.08] overflow-hidden shadow-card grid grid-cols-1 sm:grid-cols-12 group"
                    >
                      {/* Trending Product Photo */}
                      <div
                        onClick={() => onNavigateProduct(linkedProduct.id)}
                        className="sm:col-span-5 relative aspect-square sm:aspect-auto bg-[#14141A] cursor-pointer overflow-hidden"
                      >
                        <ResilientImage
                          src={displayPhoto}
                          fallbackSrc={linkedProduct.image}
                          alt={spot.customTitle || linkedProduct.name}
                          className="w-full h-full"
                          imgClassName="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {isOnSale && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-electric-gradient text-white font-mono-num text-[10px] font-bold shadow-md">
                            SALE −{homeConfig.salePercentage}%
                          </span>
                        )}
                      </div>

                      {/* Trending Product Info & Description */}
                      <div className="sm:col-span-7 p-6 flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2 text-xs text-[#A0A0B0]">
                            <span className="text-[#FF6B35] font-medium">
                              {spot.badgeLabel || 'Trending Spotlight'}
                            </span>
                            <span className="text-[#F59E0B] font-mono-num">
                              ★ {linkedProduct.rating.toFixed(1)} (
                              {linkedProduct.reviewsCount.toLocaleString('en-IN')})
                            </span>
                          </div>

                          <h4
                            onClick={() => onNavigateProduct(linkedProduct.id)}
                            className="font-display text-lg font-bold text-white hover:text-[#6C63FF] cursor-pointer transition-colors"
                          >
                            {spot.customTitle || linkedProduct.name}
                          </h4>

                          <p className="text-xs text-[#A0A0B0] leading-relaxed">
                            {spot.customDescription || linkedProduct.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] text-[#6B6B7B] block">
                              Price
                            </span>
                            <div className="flex items-baseline gap-2">
                              <span className="font-mono-num text-lg font-bold text-electric-gradient">
                                {formatINR(linkedProduct.price)}
                              </span>
                              <span className="font-mono-num text-xs text-[#6B6B7B] line-through">
                                {formatINR(linkedProduct.originalPrice)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onNavigateProduct(linkedProduct.id)}
                              className="px-3 py-2 rounded-[8px] bg-[#111113] hover:bg-[#23232E] border border-white/10 text-xs font-medium text-white transition-colors"
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              onClick={() => onAddToCart(linkedProduct, 1)}
                              className="px-4 py-2 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-all"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ENGINEERING & ATTRIBUTABLE CUSTOMER PROOF SECTION */}
      <section className="py-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 bg-[#1A1A1F] rounded-[16px] p-8 border border-white/[0.07] flex flex-col justify-between">
            <div>
              <span className="text-xs text-[#FF6B35] font-medium uppercase tracking-wider">
                The VoltEdge Standard
              </span>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-white mt-2 mb-4"
                style={{ textWrap: 'balance' }}
              >
                Built like flagship devices, not disposable plastic.
              </h2>
              <p className="text-sm text-[#A0A0B0] leading-relaxed">
                Every VoltEdge charger, power bank, and acoustic product undergoes 48-hour
                thermal stress testing at 45°C Indian ambient temperatures and carries full
                BIS certification.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-8 mt-8 border-t border-white/[0.07]">
              <div>
                <div className="font-display text-2xl font-bold text-white font-mono-num">
                  35,000+
                </div>
                <div className="text-xs text-[#A0A0B0] mt-0.5">
                  Aramid cable bend lifespan cycles
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-white font-mono-num">
                  &lt; 38°C
                </div>
                <div className="text-xs text-[#A0A0B0] mt-0.5">
                  Peak surface temp at 15W Qi2 load
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                quote:
                  'Switched my entire desk setup to the VoltEdge 65W GaN brick and 2m 100W wattage-display cable. Charges my MacBook Pro and iPhone 16 Pro together without heating up.',
                author: 'Aarav Sharma',
                role: 'Principal Product Designer, Bengaluru',
                item: 'GaN Fast Charger 65W · Verified Buyer',
              },
              {
                quote:
                  'The N52 magnetic snap on the 10000mAh power bank is rock solid even without a case. Survived a 5-day Ladakh road trip with zero battery anxiety.',
                author: 'Ananya Patel',
                role: 'Systems Architect, Ahmedabad',
                item: 'MagSafe Power Bank 10000mAh · Verified Buyer',
              },
            ].map((t) => (
              <div
                key={t.author}
                className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.07] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#F59E0B] text-xs mb-4">
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="font-display text-sm font-semibold text-white">
                    {t.author}
                  </div>
                  <div className="text-xs text-[#A0A0B0]">{t.role}</div>
                  <div className="text-[11px] text-[#6B6B7B] mt-1">{t.item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

/* ==========================================================================
   PRODUCT LISTING PAGE (#/products)
   Enhanced with Sidebar Filter Toggles for Price Ranges & Stock Availability
   ========================================================================== */
type PriceBracket = 'under-1000' | '1000-3000' | 'over-3000';

interface ProductListingViewProps {
  products: Product[];
  homeConfig?: HomePageConfig;
  wishlistIds: number[];
  onToggleWishlist: (product: Product) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onClearSearch: () => void;
  onAddToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  onNavigateProduct: (productId: number) => void;
  onQuickView: (product: Product) => void;
}

export const ProductListingView: React.FC<ProductListingViewProps> = ({
  products,
  homeConfig = DEFAULT_HOME_PAGE_CONFIG,
  wishlistIds,
  onToggleWishlist,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onClearSearch,
  onAddToCart,
  onNavigateProduct,
  onQuickView,
}) => {
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'newest' | 'rating'>(
    'popular'
  );
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Sidebar Filter Toggles State
  const [selectedPriceBrackets, setSelectedPriceBrackets] = useState<PriceBracket[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [fastDispatchOnly, setFastDispatchOnly] = useState<boolean>(false);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);

  const togglePriceBracket = (bracket: PriceBracket) => {
    setSelectedPriceBrackets((prev) =>
      prev.includes(bracket) ? prev.filter((b) => b !== bracket) : [...prev, bracket]
    );
  };

  const resetAllFilters = () => {
    onSelectCategory('All');
    onClearSearch();
    setSelectedPriceBrackets([]);
    setInStockOnly(false);
    setFastDispatchOnly(false);
    setOnSaleOnly(false);
  };

  const filterCategories = [
    'All',
    'Power Banks',
    'Chargers & Cables',
    'Screen Protectors',
    'Earbuds',
    'Phone Cases',
    'Smart Watches',
  ];

  const matchesPriceBracket = (price: number, brackets: PriceBracket[]) => {
    if (brackets.length === 0) return true;
    return brackets.some((b) => {
      if (b === 'under-1000') return price < 1000;
      if (b === '1000-3000') return price >= 1000 && price <= 3000;
      if (b === 'over-3000') return price > 3000;
      return true;
    });
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesCat =
        selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = matchesPriceBracket(p.price, selectedPriceBrackets);
      const matchesStock = !inStockOnly || p.stock > 0;
      const matchesFastDispatch = !fastDispatchOnly || p.stock >= 20;
      const matchesSale = !onSaleOnly || homeConfig.saleProductIds.includes(p.id);

      return (
        matchesCat &&
        matchesSearch &&
        matchesPrice &&
        matchesStock &&
        matchesFastDispatch &&
        matchesSale
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return b.id - a.id;
      return b.reviewsCount - a.reviewsCount;
    });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const countUnder1000 = products.filter((p) => p.price < 1000).length;
  const count1000To3000 = products.filter(
    (p) => p.price >= 1000 && p.price <= 3000
  ).length;
  const countOver3000 = products.filter((p) => p.price > 3000).length;
  const countInStock = products.filter((p) => p.stock > 0).length;
  const countOutOfStock = products.filter((p) => p.stock === 0).length;

  const hasActiveSidebarFilters =
    selectedPriceBrackets.length > 0 ||
    inStockOnly ||
    fastDispatchOnly ||
    onSaleOnly ||
    selectedCategory !== 'All' ||
    Boolean(searchQuery.trim());

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/[0.07]">
        <div>
          <div className="text-xs text-[#A0A0B0] mb-1">
            Storefront · {selectedCategory === 'All' ? 'All Hardware' : selectedCategory}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            {selectedCategory === 'All' ? 'All Performance Gear' : selectedCategory}
          </h1>
        </div>
        <div className="text-xs text-[#A0A0B0] tabular-nums">
          Showing <strong className="text-white">{displayedProducts.length}</strong> of{' '}
          <strong className="text-white">{filteredProducts.length}</strong> products
        </div>
      </div>

      {/* Filter Bar at top: Category Pills + Sort Dropdown */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        {/* Category Pills (Interactive Filter Controls) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filterCategories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-electric-gradient text-white shadow-electric-glow'
                    : 'bg-[#1A1A1F] text-[#A0A0B0] border border-white/[0.07] hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="px-3 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/15 text-xs text-white flex items-center gap-2"
            >
              <span>Search: &ldquo;{searchQuery}&rdquo;</span>
              <i className="fa-solid fa-xmark text-[#A0A0B0]" />
            </button>
          )}
          <label htmlFor="sort-select" className="text-xs text-[#A0A0B0] whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-[#6C63FF]"
          >
            <option value="popular">Most Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Main Catalog Layout: Sidebar Filters (3 cols) + Product Grid (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: Price Range & Stock Availability Filter Toggles */}
        <aside className="lg:col-span-3 lg:sticky lg:top-24 bg-[#111113] rounded-[16px] p-5 border border-white/[0.08] space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-sliders text-xs text-[#6C63FF]" />
              <h2 className="font-display text-sm font-bold text-white">
                Filter Hardware
              </h2>
            </div>
            {hasActiveSidebarFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11px] font-semibold text-[#FF6B35] hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* 1. PRICE RANGE FILTER TOGGLES */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
              Price Range
            </h3>
            <div className="space-y-2">
              {(
                [
                  {
                    id: 'under-1000' as PriceBracket,
                    label: 'Under ₹1,000',
                    count: countUnder1000,
                  },
                  {
                    id: '1000-3000' as PriceBracket,
                    label: '₹1,000 – ₹3,000',
                    count: count1000To3000,
                  },
                  {
                    id: 'over-3000' as PriceBracket,
                    label: 'Over ₹3,000',
                    count: countOver3000,
                  },
                ] as const
              ).map((range) => {
                const isChecked = selectedPriceBrackets.includes(range.id);
                return (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => togglePriceBracket(range.id)}
                    className={`w-full px-3.5 py-2.5 rounded-[10px] border text-xs flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-[#1A1A1F] border-[#6C63FF] text-white shadow-sm'
                        : 'bg-[#1A1A1F]/50 border-white/[0.06] text-[#A0A0B0] hover:text-white hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-electric-gradient border-transparent text-white'
                            : 'border-white/20 bg-[#111113]'
                        }`}
                      >
                        {isChecked && <i className="fa-solid fa-check text-[9px]" />}
                      </span>
                      <span className="font-medium">{range.label}</span>
                    </div>
                    <span className="font-mono-num text-[11px] text-[#6B6B7B]">
                      {range.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. STOCK AVAILABILITY TOGGLES */}
          <div className="pt-5 border-t border-white/[0.07] space-y-3">
            <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider">
              Stock Availability
            </h3>

            {/* Toggle: In Stock Only */}
            <button
              type="button"
              onClick={() => setInStockOnly((prev) => !prev)}
              className="w-full p-3 rounded-[10px] bg-[#1A1A1F]/70 border border-white/[0.07] flex items-center justify-between text-left hover:border-white/15 transition-all"
            >
              <div>
                <span className="text-xs font-semibold text-white block">
                  In Stock Only
                </span>
                <span className="text-[11px] text-[#A0A0B0] font-mono-num">
                  {countInStock} available · {countOutOfStock} sold out
                </span>
              </div>
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  inStockOnly ? 'bg-electric-gradient' : 'bg-white/15'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    inStockOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            {/* Toggle: Ready for Same-Day Dispatch (20+ units) */}
            <button
              type="button"
              onClick={() => setFastDispatchOnly((prev) => !prev)}
              className="w-full p-3 rounded-[10px] bg-[#1A1A1F]/70 border border-white/[0.07] flex items-center justify-between text-left hover:border-white/15 transition-all"
            >
              <div>
                <span className="text-xs font-semibold text-white block">
                  High Stock (20+ Units)
                </span>
                <span className="text-[11px] text-[#A0A0B0]">
                  Immediate bulk dispatch
                </span>
              </div>
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  fastDispatchOnly ? 'bg-electric-gradient' : 'bg-white/15'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    fastDispatchOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            {/* Toggle: On Flash Sale Only */}
            <button
              type="button"
              onClick={() => setOnSaleOnly((prev) => !prev)}
              className="w-full p-3 rounded-[10px] bg-[#1A1A1F]/70 border border-white/[0.07] flex items-center justify-between text-left hover:border-white/15 transition-all"
            >
              <div>
                <span className="text-xs font-semibold text-white block">
                  On Flash Sale (−{homeConfig.salePercentage}%)
                </span>
                <span className="text-[11px] text-emerald-400 font-mono-num">
                  {homeConfig.saleProductIds.length} promotional items
                </span>
              </div>
              <div
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  onSaleOnly ? 'bg-electric-gradient' : 'bg-white/15'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    onSaleOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </aside>

        {/* RIGHT CONTENT: Product Grid */}
        <div className="lg:col-span-9">
          {displayedProducts.length === 0 ? (
            <div className="bg-[#111113] rounded-[16px] p-12 text-center border border-white/[0.07]">
              <div className="w-12 h-12 rounded-xl bg-[#1A1A1F] border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#6B6B7B]">
                <i className="fa-solid fa-magnifying-glass" />
              </div>
              <h2 className="font-display text-lg font-semibold text-white mb-1">
                No matching accessories found
              </h2>
              <p className="text-xs text-[#A0A0B0] mb-5">
                Try resetting your price range, stock toggle, or category filter.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-5 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {displayedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlistIds.includes(product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onNavigateProduct={onNavigateProduct}
                    onQuickView={onQuickView}
                    showQuickViewOverlay={true}
                  />
                ))}
              </div>

              {/* Load More / Pagination control at bottom */}
              <div className="mt-12 text-center">
                {visibleCount < filteredProducts.length ? (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 4)}
                    className="px-7 py-3 rounded-[8px] bg-[#1A1A1F] hover:bg-[#23232B] border border-white/15 text-xs font-semibold text-white transition-all"
                  >
                    Load More Products ({filteredProducts.length - visibleCount} remaining)
                  </button>
                ) : filteredProducts.length > 4 ? (
                  <div className="inline-flex flex-col items-center gap-2">
                    <span className="text-xs text-[#6B6B7B]">
                      Showing all {filteredProducts.length} products in this collection
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) =>
                          prev === 4 ? filteredProducts.length : 4
                        )
                      }
                      className="text-xs text-[#A0A0B0] hover:text-white underline underline-offset-4"
                    >
                      {visibleCount === 4 ? 'Show All Products' : 'Collapse to Top 4'}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   PRODUCT DETAIL PAGE (#/product/:id)
   ========================================================================== */
interface ProductDetailViewProps {
  product: Product;
  allProducts: Product[];
  wishlistIds: number[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, color: string, size: string) => void;
  onBuyNow: (product: Product, quantity: number, color: string, size: string) => void;
  onNavigateProduct: (productId: number) => void;
  onNavigateBack: () => void;
  onAddReview: (productId: number, review: Omit<ProductReview, 'id' | 'date' | 'verified'>) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  allProducts,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onNavigateProduct,
  onNavigateBack,
  onAddReview,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0]?.name || 'Obsidian Black'
  );
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Standard');
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revAuthor, setRevAuthor] = useState('');
  const [revLocation, setRevLocation] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');

  React.useEffect(() => {
    setActiveImageIdx(0);
    setSelectedColor(product.colors[0]?.name || 'Obsidian Black');
    setSelectedSize(product.sizes[0] || 'Standard');
    setQuantity(1);
  }, [product]);

  const galleryItems =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [{ label: 'Studio View', url: product.image }];

  const currentGalleryImage = galleryItems[activeImageIdx]?.url || product.image;

  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedColor, selectedSize);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1200);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revAuthor.trim() || !revComment.trim()) return;
    onAddReview(product.id, {
      author: revAuthor.trim(),
      location: revLocation.trim() || 'India',
      rating: revRating,
      variant: `${selectedColor} · ${selectedSize}`,
      title: revTitle.trim() || 'Verified Purchase Review',
      comment: revComment.trim(),
    });
    setRevAuthor('');
    setRevLocation('');
    setRevTitle('');
    setRevComment('');
    setShowReviewForm(false);
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-page-enter">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#A0A0B0] mb-8">
        <button
          type="button"
          onClick={onNavigateBack}
          className="hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          <span>Back to Catalog</span>
        </button>
        <span>·</span>
        <span>{product.category}</span>
        <span>·</span>
        <span className="text-white truncate">{product.shortName}</span>
      </div>

      {/* Main Two-Column Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-20">
        {/* LEFT: Large Product Image with Thumbnail Strip below */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
          <div className="aspect-square w-full rounded-[16px] overflow-hidden bg-[#16161C] border border-white/[0.08] shadow-card relative">
            <ResilientImage
              key={currentGalleryImage}
              src={currentGalleryImage}
              fallbackSrc={product.placeholderUrl}
              alt={`${product.name} - ${galleryItems[activeImageIdx]?.label || 'View'}`}
              className="w-full h-full animate-page-enter"
            />
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-[8px] bg-black/65 backdrop-blur-md border border-white/10 text-[11px] text-[#A0A0B0]">
              {galleryItems[activeImageIdx]?.label}
            </div>
          </div>

          {/* Thumbnail Strip Below */}
          <div className="grid grid-cols-4 gap-3">
            {galleryItems.map((item, idx) => (
              <button
                key={item.label + idx}
                type="button"
                onClick={() => setActiveImageIdx(idx)}
                className={`group rounded-[12px] overflow-hidden border transition-all duration-200 p-1 bg-[#141419] text-left ${
                  activeImageIdx === idx
                    ? 'border-[#6C63FF] ring-1 ring-[#6C63FF]'
                    : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="aspect-square rounded-[8px] overflow-hidden mb-1">
                  <ResilientImage
                    src={item.url}
                    fallbackSrc={product.placeholderUrl}
                    alt={item.label}
                    className="w-full h-full"
                  />
                </div>
                <span className="block text-[10px] text-center text-[#A0A0B0] truncate px-1">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Product Details & Purchase Controls */}
        <div className="lg:col-span-6 space-y-6 bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.07]">
          {/* Category + Rating Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A0A0B0]">
            <span>
              {product.category} ·{' '}
              <strong className={product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {product.stock > 10
                  ? 'In Stock & Ready to Ship'
                  : product.stock > 0
                  ? `Only ${product.stock} Left in Stock`
                  : 'Out of Stock'}
              </strong>
            </span>
            <div className="flex items-center gap-1.5 tabular-nums">
              <div className="flex items-center text-[#F59E0B]">
                <i className="fa-solid fa-star text-xs" />
              </div>
              <span className="font-semibold text-white">{product.rating.toFixed(1)}</span>
              <span>({product.reviewsCount.toLocaleString('en-IN')} verified reviews)</span>
            </div>
          </div>

          {/* Product Name (28px) + Wishlist Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-[28px] font-bold text-white leading-tight">
                {product.name}
              </h1>
              <p className="text-sm text-[#A0A0B0] mt-2 leading-relaxed">
                {product.tagline}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleWishlist(product)}
              aria-label={
                wishlistIds.includes(product.id)
                  ? 'Remove from Wishlist'
                  : 'Save to Wishlist'
              }
              title={
                wishlistIds.includes(product.id)
                  ? 'Remove from Wishlist'
                  : 'Save to Wishlist'
              }
              className={`w-11 h-11 rounded-full shrink-0 border flex items-center justify-center transition-all duration-300 ${
                wishlistIds.includes(product.id)
                  ? 'bg-[#1A1A1F] border-[#FF6B35]/60 text-[#FF6B35] shadow-electric-glow'
                  : 'bg-[#1A1A1F] border-white/15 text-[#A0A0B0] hover:text-white hover:border-white/30'
              }`}
            >
              <i
                className={`${
                  wishlistIds.includes(product.id)
                    ? 'fa-solid text-[#FF6B35]'
                    : 'fa-regular'
                } fa-heart text-sm`}
              />
            </button>
          </div>

          {/* Price (24px, accent) */}
          <div className="flex items-baseline gap-3 pt-2 pb-4 border-b border-white/[0.07] tabular-nums">
            <span className="text-[24px] sm:text-[28px] font-bold text-electric-gradient font-mono-num">
              {formatINR(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-base text-[#6B6B7B] line-through font-mono-num">
                  {formatINR(product.originalPrice)}
                </span>
                <span className="text-xs font-semibold text-[#FF6B35]">
                  Save {discountPercent}% ({formatINR(product.originalPrice - product.price)})
                </span>
              </>
            )}
            <span className="ml-auto text-[11px] text-[#6B6B7B]">Inclusive of all taxes</span>
          </div>

          <p className="text-sm text-[#A0A0B0] leading-relaxed">{product.description}</p>

          {/* Variant Selector: Color Swatches (circles, selected has ring) */}
          <div className="space-y-2.5">
            <label className="block text-xs text-[#A0A0B0]">
              Color Finish: <strong className="text-white">{selectedColor}</strong>
            </label>
            <div className="flex items-center gap-3">
              {product.colors.map((c) => {
                const isSelected = selectedColor === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#6C63FF] ring-offset-2 ring-offset-[#111113] scale-105'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={c.name}
                  >
                    {isSelected && (
                      <i className="fa-solid fa-check text-[10px] text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variant Selector: Size / Configuration (pills) */}
          <div className="space-y-2.5">
            <label className="block text-xs text-[#A0A0B0]">
              {product.sizeLabel}: <strong className="text-white">{selectedSize}</strong>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {product.sizes.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      active
                        ? 'bg-electric-gradient text-white shadow-electric-glow'
                        : 'bg-[#1A1A1F] text-[#A0A0B0] border border-white/10 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Stepper [-] 1 [+] & Primary Action Buttons */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#A0A0B0]">Quantity:</span>
              <div className="inline-flex items-center rounded-[8px] bg-[#1A1A1F] border border-white/15 h-11">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-full text-sm text-[#A0A0B0] hover:text-white transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-4 text-sm font-mono-num font-semibold text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="w-10 h-full text-sm text-[#A0A0B0] hover:text-white transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-[#6B6B7B] font-mono-num">
                Total: {formatINR(product.price * quantity)}
              </span>
            </div>

            {/* Two Buttons: "Add to Cart" (outline) and "Buy Now" (gradient fill) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleAdd}
                className="py-3.5 px-6 rounded-[8px] border border-white/20 hover:border-[#6C63FF] bg-[#1A1A1F]/60 hover:bg-[#1A1A1F] text-white font-display text-sm font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap btn-interactive"
              >
                {addedFeedback ? (
                  <>
                    <i className="fa-solid fa-check text-emerald-400" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bag-shopping text-xs" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => onBuyNow(product, quantity, selectedColor, selectedSize)}
                className="py-3.5 px-6 rounded-[8px] bg-electric-gradient text-white font-display text-sm font-semibold shadow-electric-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-2 whitespace-nowrap btn-interactive"
              >
                <i className="fa-solid fa-bolt text-xs" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>

          {/* Delivery & Assurance Strip */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/[0.07] text-center text-[11px] text-[#A0A0B0]">
            <div className="p-2.5 rounded-[8px] bg-[#1A1A1F]/50">
              <i className="fa-solid fa-truck-fast text-[#6C63FF] mb-1 block" />
              Free Express Delivery
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#1A1A1F]/50">
              <i className="fa-solid fa-shield-halved text-[#FF6B35] mb-1 block" />
              1-Year BIS Warranty
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#1A1A1F]/50">
              <i className="fa-solid fa-indian-rupee-sign text-emerald-400 mb-1 block" />
              UPI &amp; COD Ready
            </div>
          </div>
        </div>
      </div>

      {/* TECHNICAL SPECIFICATIONS TABLE (clean, alternating row backgrounds) */}
      <section className="mb-20">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-white">
            Technical Specifications
          </h2>
          <p className="text-xs text-[#A0A0B0] mt-1">
            Laboratory-verified hardware tolerances and compliance ratings.
          </p>
        </div>

        <div className="rounded-[16px] overflow-hidden border border-white/[0.08] shadow-card">
          <table className="w-full text-left border-collapse">
            <tbody>
              {product.specs.map((spec, idx) => (
                <tr
                  key={spec.label}
                  className={idx % 2 === 0 ? 'bg-[#111113]' : 'bg-[#1A1A1F]'}
                >
                  <th className="py-4 px-6 text-xs sm:text-sm font-medium text-[#A0A0B0] w-1/3 border-b border-white/[0.05]">
                    {spec.label}
                  </th>
                  <td className="py-4 px-6 text-xs sm:text-sm font-medium text-white font-mono-num border-b border-white/[0.05]">
                    {spec.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CUSTOMER REVIEWS SECTION WITH STAR BREAKDOWN BAR CHART */}
      <section className="mb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Verified Customer Reviews
            </h2>
            <p className="text-xs text-[#A0A0B0] mt-1">
              Real feedback from VoltEdge owners across India.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewForm((prev) => !prev)}
            className="px-4 py-2.5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#24242C] border border-white/15 text-xs font-semibold text-white transition-colors self-start sm:self-auto"
          >
            {showReviewForm ? 'Cancel Review' : '+ Write a Review'}
          </button>
        </div>

        {showReviewForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-[#1A1A1F] rounded-[16px] p-6 border border-[#6C63FF]/40 mb-8 space-y-4 animate-page-enter"
          >
            <h3 className="font-display text-base font-bold text-white">
              Submit Your Product Review
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={revAuthor}
                  onChange={(e) => setRevAuthor(e.target.value)}
                  placeholder="e.g. Devika Menon"
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">City, State</label>
                <input
                  type="text"
                  value={revLocation}
                  onChange={(e) => setRevLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, KA"
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">Rating</label>
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                >
                  <option value={5}>5 Stars — Exceptional</option>
                  <option value={4}>4 Stars — Very Good</option>
                  <option value={3}>3 Stars — Average</option>
                  <option value={2}>2 Stars — Subpar</option>
                  <option value={1}>1 Star — Poor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#A0A0B0] mb-1">Review Headline</label>
              <input
                type="text"
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#A0A0B0] mb-1">Detailed Review *</label>
              <textarea
                rows={3}
                required
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder="How is the build quality, charging speed, or fit?"
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow"
            >
              Publish Verified Review
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Star Breakdown Bar Chart */}
          <div className="lg:col-span-4 bg-[#111113] rounded-[16px] p-6 border border-white/[0.07]">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-display text-4xl font-bold text-white font-mono-num">
                {product.rating.toFixed(1)}
              </span>
              <div>
                <div className="flex items-center gap-1 text-[#F59E0B] text-xs">
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                  <i className="fa-solid fa-star" />
                </div>
                <span className="text-xs text-[#A0A0B0] tabular-nums">
                  Based on {product.reviewsCount.toLocaleString('en-IN')} ratings
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-white/[0.07]">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const pct = product.starBreakdown[star] || 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-xs tabular-nums">
                    <span className="w-10 text-[#A0A0B0] flex items-center gap-1 shrink-0">
                      {star} <i className="fa-solid fa-star text-[10px] text-[#F59E0B]" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-[#1A1A1F] overflow-hidden">
                      <div
                        className="h-full bg-electric-gradient rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-[#A0A0B0] font-mono-num">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Review Cards */}
          <div className="lg:col-span-8 space-y-4">
            {product.reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#1A1A1F] rounded-[16px] p-6 border border-white/[0.07]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-display font-semibold text-white">
                      {rev.author}
                    </span>
                    <span className="text-[#6B6B7B]">·</span>
                    <span className="text-[#A0A0B0]">{rev.location}</span>
                    {rev.verified && (
                      <>
                        <span className="text-[#6B6B7B]">·</span>
                        <span className="text-emerald-400">Verified Buyer</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-[#6B6B7B] font-mono-num">{rev.date}</span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-0.5 text-[#F59E0B] text-xs">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <i key={i} className="fa-solid fa-star text-[11px]" />
                    ))}
                  </div>
                  <span className="text-xs text-[#6B6B7B]">· {rev.variant}</span>
                </div>

                <h4 className="font-display text-sm font-bold text-white mb-1.5">
                  {rev.title}
                </h4>
                <p className="text-xs sm:text-sm text-[#A0A0B0] leading-relaxed">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section>
        <h2 className="font-display text-2xl font-bold text-white mb-6">
          Complete Your Setup
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {relatedProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              isWishlisted={wishlistIds.includes(item.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={(p, q, c, s) => onAddToCart(p, q || 1, c || 'Standard', s || 'Standard')}
              onNavigateProduct={onNavigateProduct}
              showQuickViewOverlay={false}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

/* ==========================================================================
   WISHLIST VIEW (#/wishlist)
   ========================================================================== */
interface WishlistViewProps {
  products: Product[];
  wishlistIds: number[];
  onToggleWishlist: (product: Product) => void;
  onMoveToCart: (product: Product) => void;
  onMoveAllToCart: () => void;
  onClearWishlist: () => void;
  onNavigateProduct: (productId: number) => void;
  onNavigateShop: () => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onMoveToCart,
  onMoveAllToCart,
  onClearWishlist,
  onNavigateProduct,
  onNavigateShop,
}) => {
  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-white/[0.07]">
        <div>
          <div className="text-xs text-[#A0A0B0] mb-1">
            Personal Collection · Saved Hardware
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
            <span>Your Wishlist</span>
            <span className="text-sm font-mono-num font-normal text-[#A0A0B0]">
              ({wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>

        {wishlistedProducts.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onClearWishlist}
              className="px-4 py-2.5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#23232C] border border-white/10 text-xs font-medium text-[#A0A0B0] hover:text-white transition-colors whitespace-nowrap"
            >
              Clear Wishlist
            </button>
            <button
              type="button"
              onClick={onMoveAllToCart}
              className="px-5 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-all flex items-center gap-2 whitespace-nowrap btn-interactive"
            >
              <i className="fa-solid fa-bag-shopping text-xs" />
              <span>Move All to Cart ({wishlistedProducts.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {wishlistedProducts.length === 0 ? (
        <div className="bg-[#111113] rounded-[16px] p-12 sm:p-16 text-center border border-white/[0.07] max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1F] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#FF6B35]">
            <i className="fa-regular fa-heart text-2xl" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Your Wishlist is Empty
          </h2>
          <p className="text-xs sm:text-sm text-[#A0A0B0] max-w-md mx-auto mb-6 leading-relaxed">
            Tap the heart icon on any VoltEdge accessory card to bookmark products and move
            them to your bag whenever you are ready.
          </p>
          <button
            type="button"
            onClick={onNavigateShop}
            className="px-6 py-3 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-105 transition-transform duration-300 whitespace-nowrap"
          >
            Explore Accessories
          </button>
        </div>
      ) : (
        /* Saved Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((product) => {
            const discountPercent =
              product.originalPrice > product.price
                ? Math.round(
                    ((product.originalPrice - product.price) / product.originalPrice) *
                      100
                  )
                : 0;

            return (
              <div
                key={product.id}
                onClick={() => onNavigateProduct(product.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigateProduct(product.id);
                  }
                }}
                className="group bg-[#1A1A1F] rounded-[16px] p-5 border border-white/[0.07] shadow-card card-electric-border flex flex-col justify-between cursor-pointer text-left transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-[12px] overflow-hidden bg-[#121216] mb-4">
                    <ResilientImage
                      src={product.image}
                      fallbackSrc={product.placeholderUrl}
                      alt={product.name}
                      className="w-full h-full"
                      imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Remove from Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product);
                      }}
                      aria-label={`Remove ${product.name} from wishlist`}
                      title="Remove from Wishlist"
                      className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md bg-[#0A0A0B]/85 border border-[#FF6B35]/60 text-[#FF6B35] shadow-electric-glow hover:scale-110 transition-all duration-300"
                    >
                      <i className="fa-solid fa-heart text-xs" />
                    </button>
                  </div>

                  {/* Clean Metadata Row */}
                  <div className="flex items-center justify-between gap-2 text-xs text-[#A0A0B0] mb-1.5">
                    <span className="truncate">{product.category}</span>
                    <div className="flex items-center gap-1 shrink-0 tabular-nums">
                      <i className="fa-solid fa-star text-[#F59E0B] text-[11px]" />
                      <span className="text-white font-medium">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-[16px] font-semibold text-white leading-snug line-clamp-2 mb-2 min-h-[2.75rem]">
                    {product.name}
                  </h3>
                </div>

                <div className="pt-2 border-t border-white/[0.06] mt-1">
                  <div className="flex items-baseline justify-between gap-2 mb-3.5 tabular-nums">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[18px] font-bold text-electric-gradient font-mono-num">
                        {formatINR(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-[#6B6B7B] line-through font-mono-num">
                          {formatINR(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    {discountPercent > 0 && (
                      <span className="text-[11px] font-medium text-[#FF6B35] whitespace-nowrap">
                        Save {discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Move to Cart Primary Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveToCart(product);
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-[8px] text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap btn-interactive ${
                        product.stock <= 0
                          ? 'bg-white/5 text-[#6B6B7B] border border-white/10 cursor-not-allowed'
                          : 'bg-electric-gradient text-white shadow-electric-glow hover:scale-[1.02]'
                      }`}
                    >
                      <i className="fa-solid fa-cart-arrow-down text-xs" />
                      <span>{product.stock <= 0 ? 'Out of Stock' : 'Move to Cart'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product);
                      }}
                      title="Remove from Wishlist"
                      aria-label={`Remove ${product.name}`}
                      className="w-10 h-10 rounded-[8px] bg-[#111113] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-[#A0A0B0] hover:text-rose-400 flex items-center justify-center transition-colors shrink-0"
                    >
                      <i className="fa-regular fa-trash-can text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
