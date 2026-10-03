import React, { useState } from 'react';
import { Product, formatINR } from '../data/seedData';
import { ResilientImage } from './ResilientImage';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  onNavigateProduct: (productId: number) => void;
  onQuickView?: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
  showQuickViewOverlay?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onNavigateProduct,
  onQuickView,
  isWishlisted = false,
  onToggleWishlist,
  isCompared = false,
  onToggleCompare,
  showQuickViewOverlay = true,
  className = '',
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;
    setJustAdded(true);
    onAddToCart(
      product,
      1,
      product.colors[0]?.name || 'Standard',
      product.sizes[0] || 'Standard'
    );
    setTimeout(() => {
      setJustAdded(false);
    }, 1100);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleWishlist) return;
    setHeartPulse(true);
    onToggleWishlist(product);
    setTimeout(() => setHeartPulse(false), 380);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(product);
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      onNavigateProduct(product.id);
    }
  };

  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const compatBadge =
    product.compatibleSummary ||
    (product.compatibleModels && product.compatibleModels.length > 0
      ? `Fits ${product.compatibleModels.slice(0, 2).join(', ')}`
      : 'Universal Compatible');

  return (
    <div
      onClick={() => onNavigateProduct(product.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigateProduct(product.id);
        }
      }}
      className={`group bg-[#1A1A1F] rounded-[16px] p-4 sm:p-5 border border-white/[0.07] shadow-card card-electric-border flex flex-col justify-between cursor-pointer text-left transition-all duration-300 hover:-translate-y-1 relative ${
        justAdded ? 'animate-card-pulse' : ''
      } ${className}`}
    >
      <div>
        {/* Image Container with rounded-12 & subtle gradient overlay on hover */}
        <div className="relative aspect-square w-full rounded-[12px] overflow-hidden bg-[#121216] mb-3.5">
          <ResilientImage
            src={product.image}
            fallbackSrc={product.placeholderUrl}
            alt={product.name}
            className="w-full h-full"
            imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Top Left Badges: Compare & Discount */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-start gap-1">
            {discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#FF6B35] text-white text-[10px] font-mono-num font-bold shadow-md">
                {discountPercent}% OFF
              </span>
            )}
            {onToggleCompare && (
              <button
                type="button"
                onClick={handleCompareClick}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md border transition-all ${
                  isCompared
                    ? 'bg-[#6C63FF] text-white border-transparent'
                    : 'bg-black/60 text-[#A0A0B0] border-white/15 hover:text-white'
                }`}
              >
                {isCompared ? '✓ Comparing' : '+ Compare'}
              </button>
            )}
          </div>

          {/* Heart Icon Wishlist Button (Top-Right) */}
          {onToggleWishlist && (
            <button
              type="button"
              onClick={handleWishlistClick}
              aria-label={
                isWishlisted
                  ? `Remove ${product.name} from wishlist`
                  : `Save ${product.name} to wishlist`
              }
              title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
              className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
                isWishlisted
                  ? 'bg-[#0A0A0B]/85 border-[#FF6B35]/60 text-[#FF6B35] shadow-electric-glow'
                  : 'bg-[#0A0A0B]/70 border-white/15 text-white/80 hover:text-white hover:border-white/35 hover:bg-[#0A0A0B]/90'
              } ${heartPulse ? 'scale-125' : 'hover:scale-110'}`}
            >
              <i
                className={`${
                  isWishlisted ? 'fa-solid text-[#FF6B35]' : 'fa-regular'
                } fa-heart text-xs`}
              />
            </button>
          )}

          {/* Quick View button overlay on hover */}
          {showQuickViewOverlay && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={handleQuickViewClick}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#0A0A0B]/90 border border-white/20 text-xs font-medium text-white hover:border-[#6C63FF] hover:text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 whitespace-nowrap"
              >
                Quick View
              </button>
            </div>
          )}
        </div>

        {/* Compatibility Pill & Category */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#A0A0B0] mb-1.5">
          <span className="truncate max-w-[140px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/90 font-medium">
            {compatBadge}
          </span>
          <div className="flex items-center gap-1 shrink-0 tabular-nums">
            <i className="fa-solid fa-star text-[#F59E0B] text-[10px]" />
            <span className="text-white font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-[#6B6B7B]">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-display text-sm font-semibold text-white leading-snug line-clamp-2 mb-1.5 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Delivery ETA Pill */}
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mb-3">
          <i className="fa-solid fa-truck-fast text-[11px]" />
          <span>Express Delivery in 24-48 Hours</span>
        </div>
      </div>

      <div className="pt-2 border-t border-white/[0.06] mt-1">
        {/* Price row in ₹ */}
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[17px] font-bold text-electric-gradient font-mono-num">
              {formatINR(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-[#6B6B7B] line-through font-mono-num">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">
            🟢 In Stock
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={handleAddClick}
          className={`w-full py-2.5 px-4 rounded-[8px] text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap btn-interactive ${
            product.stock <= 0
              ? 'bg-white/5 text-[#6B6B7B] border border-white/10 cursor-not-allowed'
              : justAdded
              ? 'bg-electric-gradient text-white border border-transparent shadow-electric-glow'
              : 'bg-transparent text-white border border-white/15 hover:border-transparent hover:bg-electric-gradient hover:shadow-electric-glow'
          }`}
        >
          {product.stock <= 0 ? (
            <span>Out of Stock</span>
          ) : justAdded ? (
            <>
              <i className="fa-solid fa-check text-xs" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-bag-shopping text-xs opacity-85" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
