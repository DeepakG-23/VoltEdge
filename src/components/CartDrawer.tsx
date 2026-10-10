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
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <aside
        className={`absolute top-0 right-0 h-full w-full max-w-[400px] bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Shopping Cart</h2>
            <span className="text-xs text-slate-500 font-medium">
              ({items.reduce((acc, i) => acc + i.quantity, 0)} items)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart drawer"
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="px-5 py-3 bg-blue-50/70 border-b border-blue-100">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            {remainingForFreeShipping === 0 && subtotal > 0 ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <i className="fa-solid fa-circle-check text-xs" />
                Free Express Shipping Unlocked!
              </span>
            ) : (
              <span className="text-slate-600">
                Add <strong className="text-blue-700 font-mono-num">{formatINR(remainingForFreeShipping || 499)}</strong> for Free Shipping
              </span>
            )}
            <span className="text-slate-500 font-mono-num text-[11px]">
              {Math.round(shippingProgress)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${subtotal > 0 ? shippingProgress : 0}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <i className="fa-solid fa-bag-shopping text-2xl" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Your cart is empty
              </h3>
              <p className="text-xs text-slate-500 max-w-[220px] mb-5 leading-relaxed">
                Add smartwatches, earbuds, chargers, or mobile accessories to get started.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateShop();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map((item) => {
              const key = `${item.productId}-${item.color}-${item.size}`;
              return (
                <div
                  key={key}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex gap-3 items-start"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-200 p-1 flex items-center justify-center">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId, item.color, item.size)}
                        aria-label={`Remove ${item.name}`}
                        className="text-slate-400 hover:text-rose-500 text-xs p-0.5 transition-colors shrink-0"
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {item.color} · {item.size}
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center rounded-lg bg-white border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.color, item.size, -1)
                          }
                          className="w-7 h-7 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-800 font-mono-num">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.color, item.size, 1)
                          }
                          className="w-7 h-7 flex items-center justify-center text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-600 font-mono-num">
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
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3.5">
            <div className="space-y-1.5 text-xs">
              {totalSavings > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-medium">
                  <span>Total Discount Savings</span>
                  <span className="font-mono-num font-bold">−{formatINR(totalSavings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-mono-num font-bold text-slate-800">
                  {subtotal >= 499 ? 'FREE' : formatINR(49)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="font-mono-num text-blue-600 text-lg">
                  {formatINR(subtotal + (subtotal >= 499 ? 0 : 49))}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
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
