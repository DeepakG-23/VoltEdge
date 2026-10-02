import React, { useState } from 'react';
import { Order, Product, STORE_NAME, STORE_PHONE, formatINR } from '../data/seedData';
import { buildWhatsAppOrderMessage } from './CheckoutViews';
import { ResilientImage } from './ResilientImage';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, color: string, size: string) => void;
  onViewFullDetails: (productId: number) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onViewFullDetails,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState(1);

  React.useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0]?.name || 'Obsidian');
      setSelectedSize(product.sizes[0] || 'Standard');
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
      />
      <div className="relative z-10 w-full max-w-3xl bg-[#111113] border border-white/15 rounded-[16px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-page-enter">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Quick View"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-[8px] bg-black/60 border border-white/15 text-[#A0A0B0] hover:text-white flex items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        {/* Image Preview */}
        <div className="bg-[#16161C] p-6 flex items-center justify-center">
          <div className="w-full aspect-square rounded-[12px] overflow-hidden">
            <ResilientImage
              src={product.image}
              fallbackSrc={product.placeholderUrl}
              alt={product.name}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Details */}
        <div className="p-6 md:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A0A0B0] mb-2">
              <span>{product.category}</span>
              <span>·</span>
              <span className="text-[#F59E0B] flex items-center gap-1 tabular-nums">
                <i className="fa-solid fa-star text-[10px]" />
                {product.rating.toFixed(1)} ({product.reviewsCount.toLocaleString('en-IN')} reviews)
              </span>
            </div>

            <h3 className="font-display text-xl font-bold text-white mb-2">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-3 mb-4 tabular-nums">
              <span className="text-2xl font-bold text-electric-gradient font-mono-num">
                {formatINR(product.price)}
              </span>
              <span className="text-sm text-[#6B6B7B] line-through font-mono-num">
                {formatINR(product.originalPrice)}
              </span>
            </div>

            <p className="text-xs text-[#A0A0B0] leading-relaxed mb-5">
              {product.description}
            </p>

            {/* Color Swatches */}
            <div className="mb-4">
              <span className="block text-xs text-[#A0A0B0] mb-2">
                Finish: <strong className="text-white">{selectedColor}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      selectedColor === c.name
                        ? 'ring-2 ring-[#6C63FF] ring-offset-2 ring-offset-[#111113] scale-110'
                        : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Size / Variant Selector */}
            <div className="mb-5">
              <span className="block text-xs text-[#A0A0B0] mb-2">
                {product.sizeLabel}:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      selectedSize === s
                        ? 'bg-electric-gradient text-white shadow-sm'
                        : 'bg-[#1A1A1F] text-[#A0A0B0] border border-white/10 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center rounded-[8px] bg-[#1A1A1F] border border-white/10 h-10">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-9 h-full text-[#A0A0B0] hover:text-white"
                >
                  −
                </button>
                <span className="px-3 text-xs font-mono-num text-white">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="w-9 h-full text-[#A0A0B0] hover:text-white"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(product, qty, selectedColor, selectedSize);
                  onClose();
                }}
                className="flex-1 h-10 px-4 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-all whitespace-nowrap"
              >
                Add to Bag · {formatINR(product.price * qty)}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onViewFullDetails(product.id);
              }}
              className="w-full py-2 text-xs text-[#A0A0B0] hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Full Technical Specs &amp; Reviews</span>
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  initialOrderId?: string;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialOrderId = '',
}) => {
  const [queryId, setQueryId] = useState(initialOrderId || (orders[0]?.id ?? ''));

  React.useEffect(() => {
    if (initialOrderId) {
      setQueryId(initialOrderId);
    } else if (orders[0]?.id && !queryId) {
      setQueryId(orders[0].id);
    }
  }, [initialOrderId, orders, queryId]);

  if (!isOpen) return null;

  const matchedOrder =
    orders.find((o) => o.id.toLowerCase() === queryId.trim().toLowerCase()) ||
    orders[0];

  const timelineSteps: {
    statusKey: Order['status'];
    label: string;
    subtitle: string;
    icon: string;
  }[] = [
    {
      statusKey: 'Pending',
      label: 'Ordered',
      subtitle: 'Order confirmed & verified',
      icon: 'fa-file-invoice',
    },
    {
      statusKey: 'Packed',
      label: 'Packed',
      subtitle: 'QA tested & sealed at warehouse',
      icon: 'fa-box-archive',
    },
    {
      statusKey: 'Shipped',
      label: 'Shipped',
      subtitle: 'In transit via express air',
      icon: 'fa-truck-fast',
    },
    {
      statusKey: 'Delivered',
      label: 'Delivered',
      subtitle: 'Handed over at destination',
      icon: 'fa-house-circle-check',
    },
  ];

  const statusOrder: Order['status'][] = ['Pending', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIdx = matchedOrder
    ? Math.max(0, statusOrder.indexOf(matchedOrder.status))
    : 0;
  const progressPercent = (currentStepIdx / (timelineSteps.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />
      <div className="relative z-10 w-full max-w-xl bg-[#111113] border border-white/15 rounded-[16px] p-6 md:p-7 shadow-2xl animate-page-enter">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Live Shipment Tracker
            </h3>
            <p className="text-xs text-[#A0A0B0]">
              Real-time visual fulfillment timeline for your {STORE_NAME} order
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] bg-white/5 hover:bg-white/10 text-[#A0A0B0] hover:text-white flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={queryId}
            onChange={(e) => setQueryId(e.target.value)}
            placeholder="e.g. VE-20260929-001"
            className="flex-1 px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
          />
          <select
            value={matchedOrder?.id || ''}
            onChange={(e) => setQueryId(e.target.value)}
            className="px-3 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-[#A0A0B0] focus:outline-none focus:border-[#6C63FF]"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} ({o.status === 'Pending' ? 'Ordered' : o.status})
              </option>
            ))}
          </select>
        </div>

        {matchedOrder ? (
          <div className="bg-[#1A1A1F] rounded-[12px] p-5 border border-white/[0.07] space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
              <div>
                <span className="text-[11px] text-[#6B6B7B] block">Order ID</span>
                <span className="font-mono-num text-sm font-semibold text-white">
                  {matchedOrder.id}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#6B6B7B] block">Total Amount</span>
                <span className="font-mono-num text-sm font-bold text-electric-gradient">
                  {formatINR(matchedOrder.total)}
                </span>
              </div>
            </div>

            {/* Visual Timeline Progress Bar: Ordered -> Packed -> Shipped -> Delivered */}
            <div className="pt-2 pb-1">
              <div className="relative">
                {/* Background Track Line */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-white/10 rounded-full" />
                {/* Active Gradient Fill Line */}
                <div
                  className="absolute top-5 left-6 h-1 bg-electric-gradient rounded-full transition-all duration-500"
                  style={{
                    width: `calc((100% - 3rem) * ${progressPercent / 100})`,
                  }}
                />

                <div className="relative z-10 grid grid-cols-4 gap-2">
                  {timelineSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div
                        key={step.label}
                        className="flex flex-col items-center text-center"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isCompleted
                              ? 'bg-electric-gradient border-transparent text-white shadow-electric-glow'
                              : 'bg-[#111113] border-white/15 text-[#6B6B7B]'
                          } ${
                            isCurrent
                              ? 'ring-4 ring-[#6C63FF]/30 scale-110'
                              : ''
                          }`}
                        >
                          <i className={`fa-solid ${step.icon} text-xs`} />
                        </div>
                        <span
                          className={`font-display text-xs font-bold mt-2.5 ${
                            isCompleted ? 'text-white' : 'text-[#6B6B7B]'
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[10px] text-[#A0A0B0] leading-tight mt-0.5 hidden sm:block">
                          {step.subtitle}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="text-xs text-[#A0A0B0] space-y-1.5 pt-3 border-t border-white/[0.07]">
              <p>
                <strong className="text-white">Recipient:</strong>{' '}
                {matchedOrder.customerName} (+91 {matchedOrder.phone})
              </p>
              <p>
                <strong className="text-white">Destination:</strong>{' '}
                {matchedOrder.address.area}, {matchedOrder.address.city},{' '}
                {matchedOrder.address.state} — {matchedOrder.address.pincode}
              </p>
              <p>
                <strong className="text-white">Payment:</strong>{' '}
                {matchedOrder.paymentMethod}{' '}
                {matchedOrder.paymentDetails ? `(${matchedOrder.paymentDetails})` : ''}
              </p>
            </div>

            <div className="pt-2 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#A0A0B0] flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved text-emerald-400" />
                <span>Direct Store Handler Support</span>
              </span>
              <a
                href={`https://wa.me/91${STORE_PHONE}?text=${encodeURIComponent(
                  buildWhatsAppOrderMessage(matchedOrder)
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2 rounded-[8px] bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] font-display text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <i className="fa-brands fa-whatsapp text-sm" />
                <span>Send Order Details on WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#A0A0B0] text-center py-6">
            No matching order found.
          </p>
        )}
      </div>
    </div>
  );
};
