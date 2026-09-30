import React from 'react';
import { CartItem, formatINR } from '../data/seedData';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, color: string, size: string, delta: number) => void;
  onRemoveItem: (productId: number, color: string, size: string) => void;
  onProceedToCheckout: () => void;
  onNavigateShop: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onNavigateShop,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSavings = items.reduce(
    (sum, item) => sum + Math.max(0, item.originalPrice - item.price) * item.quantity,
    0
  );
  const freeShippingThreshold = 499;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop Overlay: rgba(0,0,0,0.6) with backdrop blur */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Panel: 400px wide, slides in from right with 300ms ease */}
      <aside
        className={`absolute top-0 right-0 h-full w-full max-w-[400px] bg-[#111113] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-bold text-white">Your Bag</h2>
            <span className="text-xs text-[#A0A0B0] tabular-nums">
              · {items.reduce((acc, i) => acc + i.quantity, 0)} items
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="w-8 h-8 rounded-[8px] bg-white/5 hover:bg-white/10 text-[#A0A0B0] hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-6 py-3 bg-[#1A1A1F]/70 border-b border-white/[0.06]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            {remainingForFreeShipping === 0 && subtotal > 0 ? (
              <span className="text-emerald-400 font-medium">
                Free Express Delivery unlocked
              </span>
            ) : (
              <span className="text-[#A0A0B0]">
                Add <strong className="text-white font-mono-num">{formatINR(remainingForFreeShipping || 499)}</strong> for Free Shipping
              </span>
            )}
            <span className="text-[#6B6B7B] font-mono-num text-[11px]">
              {Math.round(shippingProgress)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-electric-gradient transition-all duration-300"
              style={{ width: `${subtotal > 0 ? shippingProgress : 0}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1F] border border-white/10 flex items-center justify-center mb-4 text-[#6B6B7B]">
                <i className="fa-solid fa-bag-shopping text-2xl" />
              </div>
              <h3 className="font-display text-base font-semibold text-white mb-1">
                Your bag is empty
              </h3>
              <p className="text-xs text-[#A0A0B0] max-w-[240px] mb-6 leading-relaxed">
                Explore engineered MagSafe power banks, GaN chargers, and precision armor.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateShop();
                }}
                className="px-5 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-105 transition-transform duration-300 whitespace-nowrap"
              >
                Explore Accessories
              </button>
            </div>
          ) : (
            items.map((item) => {
              const key = `${item.productId}-${item.color}-${item.size}`;
              return (
                <div
                  key={key}
                  className="bg-[#1A1A1F] rounded-[12px] p-3.5 border border-white/[0.07] flex gap-3.5 items-start group"
                >
                  <div className="w-16 h-16 rounded-[10px] overflow-hidden shrink-0 bg-[#111113] border border-white/[0.06]">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display text-xs font-semibold text-white leading-snug line-clamp-2">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId, item.color, item.size)}
                        aria-label={`Remove ${item.name}`}
                        className="text-[#6B6B7B] hover:text-rose-400 text-xs p-0.5 transition-colors shrink-0"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>

                    <p className="text-[11px] text-[#6B6B7B] mt-0.5 truncate">
                      {item.color} · {item.size}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Stepper [-] 1 [+] */}
                      <div className="inline-flex items-center rounded-[8px] bg-[#111113] border border-white/10">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.color, item.size, -1)
                          }
                          className="w-7 h-7 flex items-center justify-center text-xs text-[#A0A0B0] hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-2.5 text-xs font-mono-num text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.color, item.size, 1)
                          }
                          className="w-7 h-7 flex items-center justify-center text-xs text-[#A0A0B0] hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right tabular-nums">
                        <span className="text-sm font-bold text-white font-mono-num">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-[#16161B] border-t border-white/[0.08] space-y-4">
            <div className="space-y-1.5 text-xs">
              {totalSavings > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Instant Member Savings</span>
                  <span className="font-mono-num">−{formatINR(totalSavings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[#A0A0B0]">
                <span>Shipping</span>
                <span className="font-mono-num text-white">
                  {subtotal >= 499 ? 'FREE' : formatINR(49)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-bold text-white pt-2 border-t border-white/[0.07]">
                <span className="font-display">Subtotal</span>
                <span className="font-mono-num text-electric-gradient text-lg">
                  {formatINR(subtotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-6 rounded-[8px] bg-electric-gradient text-white font-display text-sm font-semibold shadow-electric-glow hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap btn-interactive"
            >
              <span>Proceed to Checkout</span>
              <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
