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
      className={`group bg-[#1A1A1F] rounded-[16px] p-5 border border-white/[0.07] shadow-card card-electric-border flex flex-col justify-between cursor-pointer text-left transition-all duration-300 hover:-translate-y-1 ${
        justAdded ? 'animate-card-pulse' : ''
      } ${className}`}
    >
      <div>
        {/* Image Container with rounded-16 & subtle gradient overlay on hover */}
        <div className="relative aspect-square w-full rounded-[12px] overflow-hidden bg-[#121216] mb-4">
          <ResilientImage
            src={product.image}
            fallbackSrc={product.placeholderUrl}
            alt={product.name}
            className="w-full h-full"
            imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
          />

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
              className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
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

          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/80 via-[#6C63FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Quick View button overlay on hover */}
          {showQuickViewOverlay && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/25 backdrop-blur-[2px]">
              <button
                type="button"
                onClick={handleQuickViewClick}
                className="px-4 py-2 rounded-[8px] bg-[#0A0A0B]/90 border border-white/20 text-xs font-medium text-white hover:border-[#6C63FF] hover:text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 whitespace-nowrap"
              >
                Quick View
              </button>
            </div>
          )}
        </div>

        {/* Unboxed Clean Metadata Row (Category · Rating · Stock state) */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#A0A0B0] mb-1.5">
          <span className="truncate">{product.category}</span>
          <div className="flex items-center gap-1 shrink-0 tabular-nums">
            <i className="fa-solid fa-star text-[#F59E0B] text-[11px]" />
            <span className="text-white font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-[#6B6B7B]">({product.reviewsCount.toLocaleString('en-IN')})</span>
          </div>
        </div>

        {/* Product Name (16px, white) */}
        <h3 className="font-display text-[16px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-white/95 mb-2 min-h-[2.75rem]">
          {product.name}
        </h3>
      </div>

      <div className="pt-2 border-t border-white/[0.06] mt-1">
        {/* Price row in ₹ (18px, bold, accent color, tabular-nums) */}
        <div className="flex items-baseline justify-between gap-2 mb-3.5">
          <div className="flex items-baseline gap-2 tabular-nums">
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
            <span className="text-[11px] font-medium text-[#FF6B35] tabular-nums whitespace-nowrap">
              Save {discountPercent}%
            </span>
          )}
        </div>

        {/* Add to Cart Button: Ghost style, fills with gradient on hover */}
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
