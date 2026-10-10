import React, { useEffect, useRef, useState } from 'react';
import {
  CATEGORIES_DATA,
  DEFAULT_HOME_PAGE_CONFIG,
  HERO_ECOSYSTEM_IMAGE,
  HomePageConfig,
  Product,
  ProductReview,
  STORE_EMAIL,
  STORE_MAPS_URL,
  STORE_NAME,
  STORE_PHONE,
  STORE_PHONE_DISPLAY,
  formatINR,
} from '../data/seedData';
import { CrazyMobilesEmblem } from './CrazyMobilesLogo';
import { ProductCard } from './ProductCard';
import { ResilientImage } from './ResilientImage';

import smartwatchCategoryImg from '../assets/images/smartwatch_category_1791166649738.jpg';
import earbudsCategoryImg from '../assets/images/earbuds_category_1791166663895.jpg';
import neckbandCategoryImg from '../assets/images/neckband_category_1791166679099.jpg';
import chargerCategoryImg from '../assets/images/charger_category_1791166692974.jpg';
import powerbankCategoryImg from '../assets/images/powerbank_category_1791166705557.jpg';
import mobileGlassCategoryImg from '../assets/images/mobile_glass_category_1791166717202.jpg';
import phoneCaseCategoryImg from '../assets/images/phone_case_category_1791166728856.jpg';
import ancEarbudsImg from '../assets/images/voltedge_anc_earbuds_1790736214610.jpg';
import wiredEarphonesCategoryImg from '../assets/images/wired_earphones_1791466614153.jpg';
import carMountCategoryImg from '../assets/images/car_mount_holder_1791466599493.jpg';

/* ==========================================================================
   CIRCULAR CATEGORIES QUICK STRIP DATA (Crazy Mobiles Official Categories)
   ========================================================================== */
interface CircularCategory {
  id: string;
  name: string;
  categoryKey: string;
  emoji: string;
  icon: string;
  image: string;
  badge?: string;
}

const CIRCULAR_CATEGORIES: CircularCategory[] = [
  { id: 'cat-1', name: 'Smart Watches', categoryKey: 'Smart Watches', emoji: '⌚', icon: 'fa-stopwatch', image: smartwatchCategoryImg, badge: 'Popular' },
  { id: 'cat-2', name: 'AirPods & Earbuds', categoryKey: 'Earbuds', emoji: '🎧', icon: 'fa-headphones', image: earbudsCategoryImg, badge: 'Hot' },
  { id: 'cat-3', name: 'Neckbands', categoryKey: 'Neckbands', emoji: '🎵', icon: 'fa-music', image: neckbandCategoryImg },
  { id: 'cat-4', name: 'Fast Chargers', categoryKey: 'Chargers & Cables', emoji: '🔌', icon: 'fa-bolt', image: chargerCategoryImg, badge: '65W GaN' },
  { id: 'cat-5', name: 'Power Banks', categoryKey: 'Power Banks', emoji: '🔋', icon: 'fa-battery-full', image: powerbankCategoryImg },
  { id: 'cat-6', name: 'Mobile Glass', categoryKey: 'Tempered Glass', emoji: '🛡️', icon: 'fa-shield-halved', image: mobileGlassCategoryImg, badge: '9H Full HD' },
  { id: 'cat-7', name: 'Phone Covers', categoryKey: 'Mobile Covers', emoji: '📱', icon: 'fa-mobile-screen', image: phoneCaseCategoryImg },
  { id: 'cat-8', name: 'Wired Audio', categoryKey: 'Earphones', emoji: '🎙️', icon: 'fa-volume-high', image: wiredEarphonesCategoryImg, badge: 'Hi-Fi 3.5mm' },
  { id: 'cat-9', name: 'Car Mounts', categoryKey: 'Wireless Accessories', emoji: '📡', icon: 'fa-car', image: carMountCategoryImg, badge: 'MagSafe' },
];

/* ==========================================================================
   PROMOTIONAL HERO SLIDES (Crazy Mobiles Promotional Carousel)
   ========================================================================== */
interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  discount: string;
  image: string;
  categoryLink: string;
  bgGradient: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    badge: '💥 BIG ELECTRONICS SALE',
    title: 'Flagship Mobile Gear & Audio',
    subtitle: 'Flat 60% OFF on Smartwatches, 65W GaN Chargers & ANC Earbuds with 1-Year Warranty.',
    discount: 'UP TO 70% OFF',
    image: HERO_ECOSYSTEM_IMAGE,
    categoryLink: 'All',
    bgGradient: 'from-blue-900 via-indigo-950 to-slate-900',
  },
  {
    id: 'slide-2',
    badge: '⌚ TRENDING SMARTWATCHES',
    title: 'AMOLED Calling Smartwatches',
    subtitle: 'Ultra HD Curved Displays, Bluetooth Calling, 100+ Sports Modes & 7-Day Battery.',
    discount: 'STARTING AT ₹1,499',
    image: HERO_ECOSYSTEM_IMAGE,
    categoryLink: 'Smart Watches',
    bgGradient: 'from-slate-900 via-blue-950 to-indigo-900',
  },
  {
    id: 'slide-3',
    badge: '⚡ TURBO POWER SERIES',
    title: '65W GaN Chargers & MagSafe',
    subtitle: 'Ultra-compact multi-port chargers with fast charging protocol for iPhone, Samsung & Mac.',
    discount: 'FLAT 40% OFF',
    image: HERO_ECOSYSTEM_IMAGE,
    categoryLink: 'Chargers & Cables',
    bgGradient: 'from-indigo-950 via-slate-900 to-blue-900',
  },
];

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
  // Hero slide state
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Auto-advance slides every 5.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Filter products by category for curated storefront sections
  const smartwatchProducts = products.filter(
    (p) =>
      p.category === 'Smart Watches' ||
      p.name.toLowerCase().includes('watch') ||
      p.tagline.toLowerCase().includes('watch')
  );

  const audioProducts = products.filter(
    (p) =>
      p.category === 'Earbuds' ||
      p.category === 'Earphones' ||
      p.category === 'Headphones' ||
      p.category === 'Neckbands' ||
      p.name.toLowerCase().includes('earbud') ||
      p.name.toLowerCase().includes('neckband')
  );

  const chargerProducts = products.filter(
    (p) =>
      p.category === 'Chargers & Cables' ||
      p.category === 'Chargers' ||
      p.category === 'Cables' ||
      p.category === 'Power Banks' ||
      p.name.toLowerCase().includes('charger') ||
      p.name.toLowerCase().includes('power bank')
  );

  const protectionProducts = products.filter(
    (p) =>
      p.category === 'Mobile Covers' ||
      p.category === 'Phone Cases' ||
      p.category === 'Tempered Glass' ||
      p.category === 'Screen Protectors'
  );

  // Trending / Flash Deals
  const flashSaleProducts = products.slice(0, 8);

  const handleWhatsAppInquiry = (productName?: string) => {
    const phone = STORE_PHONE || '9011221665';
    const text = encodeURIComponent(
      productName
        ? `Hello Crazy Mobiles! I want to inquire about "${productName}". Please send me details.`
        : `Hello Crazy Mobiles! I want to check latest smartwatches and mobile accessories.`
    );
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-900 animate-page-enter">
      {/* 1. CIRCULAR CATEGORY QUICK STRIP (Real studio photography with premium hover presentation) */}
      <section className="bg-white border-b border-slate-200/80 py-4.5 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5 sm:gap-6 overflow-x-auto no-scrollbar py-1.5 scroll-smooth">
            {CIRCULAR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onNavigateCategory(cat.categoryKey)}
                className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer"
              >
                {/* Circular Thumbnail Avatar with real professional studio photography */}
                <div className="relative w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full bg-slate-50 border-2 border-slate-200 group-hover:border-blue-600 shadow-sm flex items-center justify-center p-1.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md overflow-hidden ring-2 ring-transparent group-hover:ring-blue-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain rounded-full group-hover:scale-110 transition-transform duration-300 bg-white"
                    loading="lazy"
                  />
                  {cat.badge && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-[#FFB703] text-slate-950 text-[8px] sm:text-[9px] font-black tracking-tight shadow-sm whitespace-nowrap">
                      {cat.badge}
                    </span>
                  )}
                </div>
                {/* Category Label Underneath */}
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center tracking-tight group-hover:text-blue-600 transition-colors whitespace-nowrap max-w-[85px] sm:max-w-[100px] truncate">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. PROMOTIONAL HERO BANNER CAROUSEL (Hero Slider) */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200">
          {/* Active Hero Slide */}
          <div
            className={`w-full min-h-[340px] sm:min-h-[420px] lg:min-h-[460px] bg-gradient-to-r ${HERO_SLIDES[currentSlideIdx].bgGradient} flex items-center transition-all duration-700 relative text-white p-6 sm:p-10 lg:p-14`}
          >
            {/* Ambient Background Lights */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full relative z-10">
              {/* Left Promotional Copy */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#FFB703] text-xs font-bold uppercase tracking-wider">
                  <span>{HERO_SLIDES[currentSlideIdx].badge}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                  {HERO_SLIDES[currentSlideIdx].title}
                </h1>

                <p className="text-sm sm:text-base text-slate-200 max-w-lg leading-relaxed font-normal">
                  {HERO_SLIDES[currentSlideIdx].subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateCategory(HERO_SLIDES[currentSlideIdx].categoryLink)}
                    className="px-6 sm:px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppInquiry(HERO_SLIDES[currentSlideIdx].title)}
                    className="px-5 sm:px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-900 font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
                  >
                    <i className="fa-brands fa-whatsapp text-base" />
                    <span>Order on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Right Hero Image Card */}
              <div className="lg:col-span-5 hidden sm:flex items-center justify-center">
                <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/15 p-4 shadow-2xl backdrop-blur-sm">
                  <ResilientImage
                    src={HERO_SLIDES[currentSlideIdx].image}
                    fallbackSrc={HERO_ECOSYSTEM_IMAGE}
                    alt={HERO_SLIDES[currentSlideIdx].title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-[#FFB703] text-slate-900 font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-md">
                    {HERO_SLIDES[currentSlideIdx].discount}
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentSlideIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlideIdx ? 'w-8 bg-[#FFB703]' : 'w-2 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Previous & Next Slide Controls */}
            <button
              type="button"
              onClick={() =>
                setCurrentSlideIdx((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all"
              aria-label="Previous slide"
            >
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all"
              aria-label="Next slide"
            >
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. TRUST STRIP ("Why Shop With Crazy Mobiles") */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: 'fa-shield-halved',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              title: '100% Genuine Products',
              desc: 'Tested & verified original mobile gear',
            },
            {
              icon: 'fa-truck-fast',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
              title: 'Free Express Shipping',
              desc: 'Doorstep dispatch across India above ₹499',
            },
            {
              icon: 'fa-rotate-left',
              color: 'text-amber-600',
              bg: 'bg-amber-50',
              title: '7 Days Replacement',
              desc: '1-Year official warranty coverage',
            },
            {
              icon: 'fa-headset',
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
              title: '24/7 WhatsApp Support',
              desc: 'Direct help via +91 9011221665',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center text-base sm:text-lg shrink-0`}
              >
                <i className={`fa-solid ${item.icon}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FLASH SALE & TRENDING PRODUCTS (2-column on mobile, 4 on desktop) */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-sm bg-blue-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              🔥 Trending Products &amp; Flash Deals
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateCategory('All')}
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors shrink-0"
          >
            <span>View All</span>
            <i className="fa-solid fa-chevron-right text-[10px]" />
          </button>
        </div>

        {/* 2 COLUMNS ON MOBILE, 3 ON TABLET, 4 ON DESKTOP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {flashSaleProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isWishlisted={wishlistIds.includes(p.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onNavigateProduct={onNavigateProduct}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </section>

      {/* 5. BEST SELLING SMARTWATCHES SECTION */}
      {smartwatchProducts.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-sm bg-[#FFB703]" />
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                ⌚ Best Selling Smartwatches
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCategory('Smart Watches')}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors shrink-0"
            >
              <span>View All</span>
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {smartwatchProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onNavigateProduct={onNavigateProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. WIRELESS AUDIO & NECKBANDS SECTION */}
      {audioProducts.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-sm bg-indigo-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                🎧 Wireless Earbuds &amp; Neckbands
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCategory('Earbuds')}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors shrink-0"
            >
              <span>View All</span>
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {audioProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onNavigateProduct={onNavigateProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. FAST CHARGERS & POWER BANKS SECTION */}
      {chargerProducts.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-sm bg-emerald-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                ⚡ Fast Chargers &amp; Power Banks
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCategory('Chargers & Cables')}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors shrink-0"
            >
              <span>View All</span>
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {chargerProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onNavigateProduct={onNavigateProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* 8. MOBILE COVERS & TEMPERED GLASS SECTION */}
      {protectionProducts.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-sm bg-purple-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                📱 Mobile Covers &amp; 9H Glass
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCategory('Mobile Covers')}
              className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors shrink-0"
            >
              <span>View All</span>
              <i className="fa-solid fa-chevron-right text-[10px]" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {protectionProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onNavigateProduct={onNavigateProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}

      {/* 9. REAL CUSTOMER REVIEWS & TESTIMONIALS */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Trusted by 50,000+ Happy Customers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Customer Experiences
            </h2>
            <div className="flex items-center justify-center gap-1 text-[#F59E0B] text-sm mt-2">
              <i className="fa-solid fa-star" />
              <i className="fa-solid fa-star" />
              <i className="fa-solid fa-star" />
              <i className="fa-solid fa-star" />
              <i className="fa-solid fa-star" />
              <span className="text-xs font-bold text-slate-700 ml-1.5">
                4.9 / 5 Overall Store Rating
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Ordered the AMOLED smartwatch and the 65W charger. Delivered in 2 days to Pune with pristine packaging. Battery lasts 6 full days on a single charge!',
                author: 'Imran Shaikh',
                location: 'Aurangabad, MH',
                verified: true,
                item: 'Ultra AMOLED Smartwatch · Verified Order',
              },
              {
                quote:
                  'The magnetic wireless earbuds bass is phenomenal. Super fast WhatsApp support answered my connection queries in 2 minutes. Best customer care!',
                author: 'Priya Deshmukh',
                location: 'Mumbai, MH',
                verified: true,
                item: 'ANC Pro Wireless Earbuds · Verified Order',
              },
              {
                quote:
                  'Genuine 9H tempered glass and MagSafe cover fits my iPhone 16 Pro like a glove. Paid COD on delivery. Will definitely buy again!',
                author: 'Rahul Sharma',
                location: 'Delhi NCR',
                verified: true,
                item: 'MagSafe Armor Case + 9H Glass · Verified Order',
              },
            ].map((t) => (
              <div
                key={t.author}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-[#F59E0B] text-xs mb-3">
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                    <i className="fa-solid fa-star" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t.author}</h4>
                    <p className="text-[11px] text-slate-500">{t.location}</p>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="fa-solid fa-circle-check text-[9px]" />
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. PHYSICAL STORE LOCATION & DIRECT WHATSAPP BANNER */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FFB703] text-xs font-bold uppercase">
                <i className="fa-solid fa-location-dot" />
                <span>Visit Our Retail Showroom</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white">
                Crazy Mobiles Showroom
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
                📍 Shop No 02, Nizamuddin Road, Shahaganj, Aurangabad, Maharashtra - 431001.<br />
                Visit our physical showroom for live product demonstrations, hands-on audio testing, tempered glass machine installation, and wholesale inquiries.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
              <a
                href={`https://wa.me/91${STORE_PHONE || '9011221665'}?text=${encodeURIComponent(
                  'Hi Crazy Mobiles, I want to inquire about visiting your store or placing an order.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-900 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <i className="fa-brands fa-whatsapp text-lg" />
                <span>WhatsApp Owner (+91 {STORE_PHONE_DISPLAY || '9011221665'})</span>
              </a>

              <a
                href={STORE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <i className="fa-solid fa-map-location-dot text-sm text-[#FFB703]" />
                <span>Get Google Maps Directions</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ==========================================================================
   PRODUCT LISTING VIEW (#/products)
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
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'newest' | 'rating'>(
    'popular'
  );
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Sidebar Filter Toggles State
  const [selectedPriceBrackets, setSelectedPriceBrackets] = useState<PriceBracket[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
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
    setOnSaleOnly(false);
  };

  const filterCategories = [
    'All',
    'Smart Watches',
    'Earbuds',
    'Neckbands',
    'Chargers & Cables',
    'Power Banks',
    'Mobile Covers',
    'Tempered Glass',
    'Earphones',
    'Headphones',
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

  const matchesCategoryFilter = (productCat: string, selectedCat: string) => {
    if (selectedCat === 'All') return true;
    if (productCat === selectedCat) return true;
    const p = productCat.toLowerCase();
    const s = selectedCat.toLowerCase();

    if (s.includes('cover') || s.includes('case')) return p.includes('case') || p.includes('cover');
    if (s.includes('glass') || s.includes('screen')) return p.includes('glass') || p.includes('screen');
    if (s.includes('earphone') || s.includes('earbud')) return p.includes('earbud') || p.includes('earphone');
    if (s.includes('watch')) return p.includes('watch') || p.includes('strap');
    if (s.includes('neckband')) return p.includes('neckband') || p.includes('earbud');
    if (s.includes('charger')) return p.includes('charger') || p.includes('cable');
    if (s.includes('power bank')) return p.includes('power bank');

    return p.includes(s) || s.includes(p);
  };

  const filteredProducts = products
    .filter((p) => {
      const matchesCat = matchesCategoryFilter(p.category, selectedCategory);
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = matchesPriceBracket(p.price, selectedPriceBrackets);
      const matchesStock = !inStockOnly || p.stock > 0;
      const matchesSale = !onSaleOnly || (p.originalPrice > p.price);

      return matchesCat && matchesSearch && matchesPrice && matchesStock && matchesSale;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return b.id - a.id;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.reviewsCount - a.reviewsCount;
    });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              Store Catalog · {selectedCategory}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {selectedCategory === 'All' ? 'All Products' : selectedCategory}
            </h1>
          </div>
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{displayedProducts.length}</strong> of{' '}
            <strong className="text-slate-900">{filteredProducts.length}</strong> products
          </div>
        </div>

        {/* Categories Bar & Sort Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {filterCategories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <span className="text-xs text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Grid of Products (2 columns on mobile, 3 on tablet, 4 on desktop) */}
        {displayedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 my-8 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400 text-xl">
              <i className="fa-solid fa-magnifying-glass" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">No products found</h2>
            <p className="text-xs text-slate-500 mb-4">
              Try adjusting your category or search query to find what you are looking for.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {displayedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={wishlistIds.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={onAddToCart}
                  onNavigateProduct={onNavigateProduct}
                  onQuickView={onQuickView}
                />
              ))}
            </div>

            {visibleCount < filteredProducts.length && (
              <div className="text-center mt-10">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="px-8 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 shadow-sm transition-all"
                >
                  Load More Products ({filteredProducts.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   PRODUCT DETAIL VIEW (#/product/:id)
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
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || 'Standard');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Standard');
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedColor(product.colors[0]?.name || 'Standard');
    setSelectedSize(product.sizes[0] || 'Standard');
    setQuantity(1);
  }, [product]);

  const galleryItems =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [{ label: 'Main View', url: product.image }];

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

  const handleWhatsAppBuy = () => {
    const phone = STORE_PHONE || '9011221665';
    const text = encodeURIComponent(
      `Hello ${STORE_NAME}! I want to order "${product.name}" (Color: ${selectedColor}, Qty: ${quantity}, Price: ${formatINR(
        product.price * quantity
      )}). Please confirm COD or UPI delivery.`
    );
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-10 animate-page-enter">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <button
          type="button"
          onClick={onNavigateBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          <span>Back to Catalog</span>
        </button>

        {/* Product Details Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-slate-200 p-6 flex items-center justify-center shadow-sm">
              <ResilientImage
                src={currentGalleryImage}
                fallbackSrc={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-[#FFB703] text-slate-900 font-bold text-xs px-2.5 py-1 rounded-md shadow-sm">
                  {discountPercent}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {galleryItems.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                {galleryItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden bg-white border-2 p-1 transition-all ${
                      idx === activeImageIdx
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ResilientImage
                      src={item.url}
                      alt={item.label}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Product Buy Box (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            {/* Category & Rating */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-blue-600 uppercase tracking-wider">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-sm">
                <i className="fa-solid fa-star text-[#F59E0B]" />
                <span className="font-bold text-slate-900">{product.rating.toFixed(1)}</span>
                <span className="text-slate-400 text-xs">({product.reviewsCount} reviews)</span>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            {/* Tagline / Short Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.shortDescription || product.tagline || product.description}
            </p>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pt-2 border-t border-slate-100">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono-num">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-sm text-slate-400 line-through font-mono-num">
                  {formatINR(product.originalPrice)}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Color Options */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Select Color: <span className="text-blue-600">{selectedColor}</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                        selectedColor === c.name
                          ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-slate-800">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <i className="fa-solid fa-minus text-xs" />
                </button>
                <span className="w-10 text-center text-xs font-bold text-slate-800 font-mono-num">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                >
                  <i className="fa-solid fa-plus text-xs" />
                </button>
              </div>
            </div>

            {/* Action Buttons: Add to Cart, Buy Now, Order via WhatsApp */}
            <div className="space-y-2.5 pt-3">
              <button
                type="button"
                onClick={handleAdd}
                className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {addedFeedback ? (
                  <>
                    <i className="fa-solid fa-check" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bag-shopping" />
                    <span>ADD TO CART</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onBuyNow(product, quantity, selectedColor, selectedSize)}
                className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <span>⚡ BUY NOW (CASH ON DELIVERY / UPI)</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppBuy}
                className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-900 font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <i className="fa-brands fa-whatsapp text-lg" />
                <span>DIRECT ORDER ON WHATSAPP</span>
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-blue-600" />
                <span>100% Original Genuine Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-truck-fast text-emerald-600" />
                <span>Fast Express All-India Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-rotate-left text-amber-600" />
                <span>7 Days Easy Return &amp; Exchange</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-money-bill text-purple-600" />
                <span>Cash on Delivery Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Section */}
        {product.specs && product.specs.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
              Technical Specifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {product.specs.map((s, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="block text-[11px] text-slate-400 font-medium">{s.label}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-5">
              Related Accessories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={wishlistIds.includes(p.id)}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={(prod, q, c, s) => onAddToCart(prod, q || 1, c || 'Standard', s || 'Standard')}
                  onNavigateProduct={onNavigateProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
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
    <div className="bg-[#F8FAFC] min-h-screen py-10 animate-page-enter">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">Saved Products</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span>Your Wishlist</span>
              <span className="text-sm font-normal text-slate-500">
                ({wishlistedProducts.length} items)
              </span>
            </h1>
          </div>

          {wishlistedProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClearWishlist}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={onMoveAllToCart}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm"
              >
                Move All to Cart
              </button>
            </div>
          )}
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto my-10 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fa-regular fa-heart" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Your wishlist is empty</h2>
            <p className="text-xs text-slate-500 mb-6">
              Bookmark smartwatches, earbuds, chargers and mobile accessories to buy later.
            </p>
            <button
              type="button"
              onClick={onNavigateShop}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {wishlistedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={true}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={(prod) => onMoveToCart(prod)}
                onNavigateProduct={onNavigateProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
