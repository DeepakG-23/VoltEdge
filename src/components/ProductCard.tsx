import React, { useState } from 'react';
import { Product, formatINR, STORE_PHONE } from '../data/seedData';
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

  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = STORE_PHONE || '9011221665';
    const msg = encodeURIComponent(
      `Hi Crazy Mobiles, I want to order "${product.name}" (Price: ${formatINR(product.price)}). Please share payment and delivery details.`
    );
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  };

  const discountPercent =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const compatBadge =
    product.compatibleSummary ||
    (product.compatibleModels && product.compatibleModels.length > 0
      ? `Fits ${product.compatibleModels.slice(0, 2).join(', ')}`
      : product.category);

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
      className={`group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer text-left relative ${
        justAdded ? 'ring-2 ring-blue-500 scale-[1.01]' : 'hover:-translate-y-1'
      } ${className}`}
    >
      <div>
        {/* Product Image Area with clean white/gray background */}
        <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-50 border border-slate-100 mb-3 flex items-center justify-center p-2">
          <ResilientImage
            src={product.image}
            fallbackSrc={product.placeholderUrl}
            alt={product.name}
            className="w-full h-full object-contain"
            imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Top Left Badges: Discount Tag */}
          <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1">
            {discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#FFB703] text-slate-900 text-[10px] sm:text-[11px] font-bold shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
            {product.isTrending && (
              <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-bold shadow-sm uppercase tracking-wide">
                HOT
              </span>
            )}
            {onToggleCompare && (
              <button
                type="button"
                onClick={handleCompareClick}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium backdrop-blur-md border transition-all ${
                  isCompared
                    ? 'bg-blue-600 text-white border-transparent'
                    : 'bg-white/80 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {isCompared ? '✓ Compare' : '+ Compare'}
              </button>
            )}
          </div>

          {/* Top Right: Wishlist Heart Icon */}
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
              className={`absolute top-2 right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm transition-all duration-300 ${
                isWishlisted
                  ? 'text-rose-500 border-rose-200'
                  : 'text-slate-400 hover:text-rose-500 hover:scale-110'
              } ${heartPulse ? 'scale-125' : ''}`}
            >
              <i
                className={`${
                  isWishlisted ? 'fa-solid text-rose-500' : 'fa-regular'
                } fa-heart text-xs sm:text-sm`}
              />
            </button>
          )}

          {/* Quick View Overlay on Desktop Hover */}
          {showQuickViewOverlay && (
            <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900/20 backdrop-blur-[1px]">
              <button
                type="button"
                onClick={handleQuickViewClick}
                className="px-3.5 py-1.5 rounded-lg bg-white text-slate-800 text-xs font-semibold shadow-md hover:bg-blue-600 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
              >
                Quick View
              </button>
            </div>
          )}
        </div>

        {/* Rating & Category Snippet */}
        <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 mb-1.5">
          <span className="truncate max-w-[120px] font-medium text-slate-600 text-[10px] sm:text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
            {compatBadge}
          </span>
          <div className="flex items-center gap-1 shrink-0 font-medium">
            <i className="fa-solid fa-star text-[#F59E0B] text-[10px]" />
            <span className="text-slate-800 font-bold">{product.rating.toFixed(1)}</span>
            <span className="text-slate-400 text-[10px]">({product.reviewsCount})</span>
          </div>
        </div>

        {/* Product Title (2-line clamped) */}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors min-h-[2.4rem]">
          {product.name}
        </h3>

        {/* Delivery / Guarantee Snippet */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-600 font-medium mb-2.5">
          <i className="fa-solid fa-truck-fast text-[11px]" />
          <span>Express Delivery Across India</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 mt-auto">
        {/* Price Row (Current Bold INR Price + Struck MRP) */}
        <div className="flex items-baseline justify-between gap-2 mb-2.5">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-blue-600 font-mono-num">
              {formatINR(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through font-mono-num">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
            In Stock
          </span>
        </div>

        {/* Action Button Grid: Primary "ADD TO CART" + Direct "WhatsApp" Button */}
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={handleAddClick}
            className={`col-span-4 py-2.5 px-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 shadow-sm ${
              product.stock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {product.stock <= 0 ? (
              <span>Out of Stock</span>
            ) : justAdded ? (
              <>
                <i className="fa-solid fa-check text-xs" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-bag-shopping text-xs" />
                <span>ADD TO CART</span>
              </>
            )}
          </button>

          {/* Quick WhatsApp Inquiry / Buy Button */}
          <button
            type="button"
            onClick={handleWhatsAppOrder}
            title="Order directly on WhatsApp"
            className="col-span-1 py-2.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 flex items-center justify-center transition-all duration-200 active:scale-90"
          >
            <i className="fa-brands fa-whatsapp text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};
