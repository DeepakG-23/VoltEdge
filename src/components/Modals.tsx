import React, { useState } from 'react';
import { Order, PHONE_BRANDS_CATALOG, PhoneBrandModels, Product, STORE_NAME, STORE_PHONE, formatINR } from '../data/seedData';
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
          </div>
        ) : (
          <div className="p-4 text-center text-[#A0A0B0] text-sm bg-[#1A1A1F] rounded-[12px]">
            No order selected or found.
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   CAN'T FIND YOUR PHONE MODEL REQUEST MODAL
   ========================================================================== */
interface CanNotFindModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CanNotFindModelModal: React.FC<CanNotFindModelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [phoneBrand, setPhoneBrand] = useState('Apple');
  const [phoneModel, setPhoneModel] = useState('');
  const [accessoryType, setAccessoryType] = useState('Mobile Cover');
  const [customerPhone, setCustomerPhone] = useState('');

  if (!isOpen) return null;

  const requestMsg = `👋 Hi Crazy Mobile! I couldn't find an accessory for my phone on your website.\n\n📱 *Brand:* ${phoneBrand}\n📲 *Model:* ${phoneModel || 'Not Specified'}\n🛍️ *Requesting:* ${accessoryType}\n📞 *My Phone:* +91 ${customerPhone}\n\nPlease inform me if you have this in stock or can arrange it for me!`;
  const whatsappUrl = `https://wa.me/91${STORE_PHONE}?text=${encodeURIComponent(
    requestMsg
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <div className="relative z-10 w-full max-w-lg bg-[#111113] border border-white/15 rounded-[20px] p-6 sm:p-7 shadow-2xl space-y-5 animate-page-enter">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-lg bg-black/60 border border-white/15 text-[#A0A0B0] hover:text-white flex items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-electric-gradient text-white flex items-center justify-center text-xl shrink-0 shadow-electric-glow">
            <i className="fa-solid fa-mobile-screen-button" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Can't Find Your Phone Model?
            </h3>
            <p className="text-xs text-[#A0A0B0]">
              We stock covers &amp; tempered glass for 500+ Indian phone models! Tell us your model and we will arrange it immediately.
            </p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#A0A0B0] mb-1 font-medium">Select Brand</label>
            <select
              value={phoneBrand}
              onChange={(e) => setPhoneBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-white font-medium focus:outline-none focus:border-[#6C63FF]"
            >
              {['Apple', 'Samsung', 'OnePlus', 'Xiaomi / Redmi', 'Vivo / iQOO', 'Realme', 'Nothing', 'OPPO', 'Motorola', 'Infinix / Tecno', 'Other'].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#A0A0B0] mb-1 font-medium">Exact Model Name</label>
            <input
              type="text"
              value={phoneModel}
              onChange={(e) => setPhoneModel(e.target.value)}
              placeholder="e.g. Moto Edge 50 Neo, Vivo T3 Ultra, iPhone 12 Mini..."
              className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-white focus:outline-none focus:border-[#6C63FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A0A0B0] mb-1 font-medium">Accessory Needed</label>
              <select
                value={accessoryType}
                onChange={(e) => setAccessoryType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-white font-medium focus:outline-none focus:border-[#6C63FF]"
              >
                <option value="Mobile Cover">Mobile Cover / Case</option>
                <option value="Tempered Glass">9H Tempered Glass</option>
                <option value="Camera Lens Protector">Camera Ring Guard</option>
                <option value="Fast Charger / Adapter">Fast Charger Adapter</option>
                <option value="Charging Cable">Braided Cable</option>
                <option value="Audio / Earbuds">Earbuds / Neckband</option>
              </select>
            </div>

            <div>
              <label className="block text-[#A0A0B0] mb-1 font-medium">Your WhatsApp (+91)</label>
              <input
                type="tel"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>
          </div>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full py-3.5 px-5 rounded-[10px] bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] font-display text-xs font-bold shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          <i className="fa-brands fa-whatsapp text-base" />
          <span>Send Model Request on WhatsApp</span>
        </a>
      </div>
    </div>
  );
};

/* ==========================================================================
   STORE POLICIES MODAL (Shipping, Return, Warranty, Privacy)
   ========================================================================== */
interface PolicyModalProps {
  policyType: 'shipping' | 'return' | 'warranty' | 'privacy' | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ policyType, onClose }) => {
  if (!policyType) return null;

  const titleMap = {
    shipping: '🚚 Shipping & Delivery Policy',
    return: '🔄 7-Day Replacement Policy',
    warranty: '🛡️ 1-Year Official Warranty',
    privacy: '🔒 Trust & Privacy Policy',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-xl bg-[#111113] border border-white/15 rounded-[20px] p-6 sm:p-7 shadow-2xl space-y-4 animate-page-enter max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="font-display text-lg font-bold text-white">{titleMap[policyType]}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/60 border border-white/15 text-[#A0A0B0] hover:text-white flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {policyType === 'shipping' && (
          <div className="space-y-3 text-xs text-[#A0A0B0] leading-relaxed">
            <p className="text-white font-semibold">⚡ Fast Insured Shipping Across All Indian Pincodes</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong className="text-white">Free Delivery:</strong> Applied automatically on all orders above ₹499.</li>
              <li><strong className="text-white">Express Dispatch:</strong> Orders placed before 3:00 PM are dispatched same-day via Blue Dart / Delhivery Air.</li>
              <li><strong className="text-white">Estimated Delivery Time:</strong> Metro cities: 1–3 business days. Rest of India: 3–5 business days.</li>
              <li><strong className="text-white">Live Tracking:</strong> Real-time SMS &amp; WhatsApp tracking links shared upon order dispatch.</li>
            </ul>
          </div>
        )}

        {policyType === 'return' && (
          <div className="space-y-3 text-xs text-[#A0A0B0] leading-relaxed">
            <p className="text-white font-semibold">🔄 Hassle-Free 7-Day Replacement Guarantee</p>
            <p>At Crazy Mobile, customer satisfaction is guaranteed. If you receive a damaged product, incorrect model fit, or manufacturing defect:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Contact our WhatsApp support team at <strong className="text-white">+91 {STORE_PHONE}</strong> within 7 days of delivery.</li>
              <li>Share a brief photo/video of the issue.</li>
              <li>We will arrange a free doorstep pickup &amp; dispatch a brand new replacement immediately!</li>
            </ul>
          </div>
        )}

        {policyType === 'warranty' && (
          <div className="space-y-3 text-xs text-[#A0A0B0] leading-relaxed">
            <p className="text-white font-semibold">🛡️ 1-Year Official Hardware Replacement Warranty</p>
            <p>All electronic accessories including GaN chargers, cables, wireless earbuds, and MagSafe power banks come with an official 1-year replacement warranty.</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Covered: Internal IC failures, charging port issues, battery capacity degradation beyond 20%.</li>
              <li>Claiming Warranty: Share your Order Receipt with our store team for instant replacement authorization.</li>
            </ul>
          </div>
        )}

        {policyType === 'privacy' && (
          <div className="space-y-3 text-xs text-[#A0A0B0] leading-relaxed">
            <p className="text-white font-semibold">🔒 256-Bit SSL Encrypted &amp; Zero Data Sharing</p>
            <p>Crazy Mobile operates under strict retail privacy standards. Your phone number, address, and payment details are encrypted and never shared with third parties.</p>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-[8px] bg-[#1A1A1F] hover:bg-[#25252E] text-white text-xs font-semibold border border-white/10"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

/* ==========================================================================
   FLOATING WHATSAPP EXPERT WIDGET
   ========================================================================== */
export const FloatingWhatsAppWidget: React.FC<{ onRequestModel: () => void }> = ({
  onRequestModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const expertMsg = `👋 Hi Crazy Mobile! I need help selecting the best accessories for my phone.`;
  const whatsappUrl = `https://wa.me/91${STORE_PHONE}?text=${encodeURIComponent(expertMsg)}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden flex flex-col items-end gap-2">
      {isOpen && (
        <div className="w-72 bg-[#111113] border border-emerald-500/40 rounded-[16px] p-4 shadow-2xl text-left space-y-3 animate-page-enter">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-white">Crazy Mobile Support</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#A0A0B0] hover:text-white text-xs p-1"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
              SS
            </div>
            <div>
              <p className="text-xs font-bold text-white">Shaikh Shoeb</p>
              <p className="text-[10px] text-[#A0A0B0]">Store Proprietor · Active Now</p>
            </div>
          </div>

          <p className="text-[11px] text-[#A0A0B0] leading-snug">
            &ldquo;Can&apos;t decide on a case or tempered glass? Chat with us directly on WhatsApp for live product photos &amp; model advice!&rdquo;
          </p>

          <div className="space-y-1.5 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-[8px] bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <i className="fa-brands fa-whatsapp text-sm" />
              <span>Chat on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRequestModel();
              }}
              className="w-full py-2 px-3 rounded-[8px] bg-[#1A1A1F] hover:bg-[#25252E] border border-white/10 text-white text-[11px] font-medium"
            >
              Can't Find Your Phone Model?
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-4 py-3 rounded-full bg-[#25D366] text-[#0A0A0B] font-display text-xs font-bold shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5"
      >
        <i className="fa-brands fa-whatsapp text-lg" />
        <span className="hidden sm:inline">Ask Crazy Mobile Expert</span>
      </button>
    </div>
  );
};

/* ==========================================================================
   YOUR DEVICE MODAL (Consumer Device Finder & Accessory Recommender)
   ========================================================================== */
interface YourDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentDevice?: string;
  onSetDevice: (deviceModel: string) => void;
  onNavigateCatalogForDevice: (deviceModel: string) => void;
  onNavigateProduct: (productId: number) => void;
}

export const YourDeviceModal: React.FC<YourDeviceModalProps> = ({
  isOpen,
  onClose,
  products,
  currentDevice = '',
  onSetDevice,
  onNavigateCatalogForDevice,
  onNavigateProduct,
}) => {
  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [selectedModel, setSelectedModel] = useState('iPhone 16 Pro');
  const [savedDeviceMsg, setSavedDeviceMsg] = useState('');

  if (!isOpen) return null;

  const currentBrandObj =
    PHONE_BRANDS_CATALOG.find((b: PhoneBrandModels) => b.brand === selectedBrand) ||
    PHONE_BRANDS_CATALOG[0];

  const handleApplyDevice = () => {
    onSetDevice(`${selectedBrand} ${selectedModel}`);
    setSavedDeviceMsg(`Set active device to ${selectedBrand} ${selectedModel}!`);
    setTimeout(() => setSavedDeviceMsg(''), 2500);
  };

  const handleBrowseCatalog = () => {
    onSetDevice(`${selectedBrand} ${selectedModel}`);
    onNavigateCatalogForDevice(`${selectedBrand} ${selectedModel}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111113] border border-white/15 rounded-[24px] p-6 sm:p-8 shadow-2xl space-y-6 animate-page-enter">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-lg bg-black/60 border border-white/15 text-[#A0A0B0] hover:text-white flex items-center justify-center transition-colors"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        {/* Header Badge */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-electric-gradient text-white flex items-center justify-center text-2xl shrink-0 shadow-electric-glow">
            <i className="fa-solid fa-mobile-screen-button" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono-num font-bold uppercase mb-1">
              <span>Personalized Accessory Recommendations</span>
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              Identify Your Device
            </h3>
            <p className="text-xs text-[#A0A0B0] mt-0.5">
              Select your smartphone brand and model to automatically discover perfect-fit cases, tempered glass, fast chargers, and audio gear.
            </p>
          </div>
        </div>

        {/* Brand Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white">
            1. Select Your Smartphone Brand
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {PHONE_BRANDS_CATALOG.map((b: PhoneBrandModels) => {
              const isSelected = b.brand === selectedBrand;
              return (
                <button
                  key={b.brand}
                  type="button"
                  onClick={() => {
                    setSelectedBrand(b.brand);
                    if (b.models.length > 0) {
                      setSelectedModel(b.models[0]);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-electric-gradient text-white border-transparent shadow-electric-glow font-bold'
                      : 'bg-[#1A1A1F] text-[#A0A0B0] hover:text-white border-white/10 hover:border-white/25'
                  }`}
                >
                  <i className={`fa-solid ${b.icon} text-base`} />
                  <span className="text-[11px] truncate w-full">{b.brand}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white">
            2. Select Your Specific Model ({currentBrandObj.models.length} Models)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
            {currentBrandObj.models.map((m: string) => {
              const isSelected = m === selectedModel;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedModel(m)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#1A1A1F] border-[#6C63FF] text-white font-bold ring-1 ring-[#6C63FF]'
                      : 'bg-[#141419] text-[#A0A0B0] hover:text-white border-white/10'
                  }`}
                >
                  <span className="truncate">{m}</span>
                  {isSelected && (
                    <i className="fa-solid fa-circle-check text-[#6C63FF] text-xs shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Summary Bar */}
        <div className="p-4 rounded-2xl bg-[#1A1A1F] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#A0A0B0] block uppercase tracking-wider font-mono-num">
              Active Consumer Device
            </span>
            <span className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              <i className="fa-solid fa-circle-check text-emerald-400 text-xs" />
              <span>{selectedBrand} {selectedModel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleApplyDevice}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#24242F] hover:bg-[#2C2C3A] text-white text-xs font-semibold border border-white/10 whitespace-nowrap"
            >
              Save My Device
            </button>
            <button
              type="button"
              onClick={handleBrowseCatalog}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-electric-gradient text-white text-xs font-bold shadow-electric-glow whitespace-nowrap flex items-center justify-center gap-2"
            >
              <span>View Compatible Gear</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </div>
        </div>

        {savedDeviceMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium animate-page-enter">
            <i className="fa-solid fa-check-circle mr-1.5" />
            {savedDeviceMsg}
          </div>
        )}

        {/* Top Recommended Accessories for this device */}
        <div className="pt-2 border-t border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white">
              Recommended Accessories for {selectedBrand} {selectedModel}
            </h4>
            <span className="text-[10px] text-[#A0A0B0] font-mono-num">100% Fit Guaranteed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.slice(0, 4).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onNavigateProduct(p.id);
                  onClose();
                }}
                className="p-3 rounded-xl bg-[#141419] hover:bg-[#1A1A1F] border border-white/10 text-left transition-all group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-[#0A0A0B] mb-2 relative">
                  <ResilientImage
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full"
                    imgClassName="object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-bold text-emerald-400 font-mono-num">
                    Compatible
                  </span>
                </div>
                <div className="font-display text-xs font-bold text-white truncate">
                  {p.shortName}
                </div>
                <div className="text-[10px] text-[#FF6B35] font-mono-num font-bold mt-0.5">
                  {formatINR(p.price)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
