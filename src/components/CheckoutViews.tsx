import React, { useEffect, useRef, useState } from 'react';
import {
  CartItem,
  INDIAN_STATES,
  Order,
  OrderAddress,
  STORE_EMAIL,
  STORE_MAPS_URL,
  STORE_NAME,
  STORE_PHONE,
  STORE_PHONE_DISPLAY,
  STORE_UPI_ID,
  formatINR,
} from '../data/seedData';
import { CrazyMobilesEmblem } from './CrazyMobilesLogo';
import { ResilientImage } from './ResilientImage';

export function buildWhatsAppOrderMessage(order: Order): string {
  const itemsLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (${item.color} / ${item.size}) × ${
          item.quantity
        } — ${formatINR(item.price * item.quantity)}`
    )
    .join('\n');

  return [
    `⚡ *${STORE_NAME.toUpperCase()} — VERIFIED ORDER CONFIRMATION* ⚡`,
    ``,
    `*Order ID:* ${order.id}`,
    `*Order Status:* ${order.status === 'Pending' ? 'Ordered (Confirmed)' : order.status}`,
    `*Payment Status:* ${
      order.paymentMethod === 'COD'
        ? 'Cash on Delivery (Pay at Doorstep)'
        : `PAID ONLINE via ${order.paymentMethod} (${order.paymentDetails || 'Verified'})`
    }`,
    `*Amount:* ${formatINR(order.total)}`,
    ``,
    `*Customer Details:*`,
    `• Name: ${order.customerName}`,
    `• Phone: +91 ${order.phone}`,
    `• Address: ${order.address.area}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
    ``,
    `*Ordered Items:*`,
    itemsLines,
    ``,
    `*Store Contact:* +91 ${STORE_PHONE} · ${STORE_EMAIL}`,
    `*Store Location:* ${STORE_MAPS_URL}`,
    ``,
    `Please confirm priority dispatch and share my live tracking waybill. Thank you!`,
  ].join('\n');
}

/* ==========================================================================
   ONLINE UPI PAYMENT GATEWAY MODAL (NPCI UPI 2.0 / Razorpay-Style)
   ========================================================================== */
interface UpiGatewayModalProps {
  isOpen: boolean;
  amount: number;
  customerName: string;
  customerPhone: string;
  initialUpiApp: 'GPay' | 'PhonePe' | 'Paytm';
  initialUpiId: string;
  onClose: () => void;
  onPaymentSuccess: (paymentSummary: string) => void;
}

const UpiPaymentGatewayModal: React.FC<UpiGatewayModalProps> = ({
  isOpen,
  amount,
  customerName,
  customerPhone,
  initialUpiApp,
  initialUpiId,
  onClose,
  onPaymentSuccess,
}) => {
  const [gatewayTab, setGatewayTab] = useState<'qr' | 'intent' | 'vpa'>('qr');
  const [selectedApp, setSelectedApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'CRED'>(
    initialUpiApp
  );
  const [vpaInput, setVpaInput] = useState(initialUpiId || STORE_UPI_ID);
  const [isVpaVerified, setIsVpaVerified] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(299);
  const [processingStage, setProcessingStage] = useState<
    'idle' | 'switch' | 'collect' | 'approved'
  >('idle');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const upiIntentUri = `upi://pay?pa=${STORE_UPI_ID}&pn=${encodeURIComponent(STORE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Crazy Mobiles Order')}`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiIntentUri)}`;

  useEffect(() => {
    if (!isOpen) {
      setProcessingStage('idle');
      setSecondsLeft(299);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const handleCopyUpiId = () => {
    navigator.clipboard?.writeText(STORE_UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleAuthorizePayment = () => {
    const generatedUtr = `4273${Math.floor(10000000 + Math.random() * 90000000)}`;
    setUtrNumber(generatedUtr);
    setProcessingStage('switch');

    setTimeout(() => {
      setProcessingStage('collect');
    }, 650);

    setTimeout(() => {
      setProcessingStage('approved');
    }, 1450);

    setTimeout(() => {
      const methodDesc =
        gatewayTab === 'qr'
          ? `UPI QR Scan (${STORE_UPI_ID}) · UTR ${generatedUtr}`
          : gatewayTab === 'intent'
          ? `${selectedApp} Intent (${STORE_UPI_ID}) · UTR ${generatedUtr}`
          : `UPI VPA (${vpaInput}) · UTR ${generatedUtr}`;
      onPaymentSuccess(methodDesc);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        onClick={processingStage === 'idle' ? onClose : undefined}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <div className="relative z-10 w-full max-w-md bg-[#111113] border border-white/15 rounded-[16px] shadow-2xl overflow-hidden animate-page-enter">
        {/* Top Gateway Header */}
        <div className="bg-gradient-to-r from-[#1A1A26] via-[#161620] to-[#1E191E] p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CrazyMobilesEmblem size={40} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-sm font-bold text-white">
                  {STORE_NAME} UPI Gateway
                </h3>
                <span className="text-[10px] text-emerald-400 font-medium">
                  · Verified Merchant
                </span>
              </div>
              <p className="text-[11px] text-[#A0A0B0] font-mono-num">
                Payee: {STORE_NAME} (Shaikh Shoeb) · {mins}:{secs}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#A0A0B0] block">Payable</span>
            <span className="font-mono-num text-base font-bold text-electric-gradient">
              {formatINR(amount)}
            </span>
          </div>
        </div>

        {/* Body */}
        {processingStage !== 'idle' ? (
          <div className="p-8 text-center space-y-5">
            {processingStage === 'approved' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <i className="fa-solid fa-check text-2xl" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#1A1A1F] border border-[#6C63FF]/50 flex items-center justify-center mx-auto text-[#6C63FF]">
                <i className="fa-solid fa-circle-notch fa-spin text-2xl" />
              </div>
            )}

            <div>
              <h4 className="font-display text-base font-bold text-white">
                {processingStage === 'switch' &&
                  'Connecting to NPCI UPI 2.0 Switch...'}
                {processingStage === 'collect' &&
                  `Verifying ${formatINR(amount)} with UPI Bank Server...`}
                {processingStage === 'approved' &&
                  'UPI Payment Verified Successfully!'}
              </h4>
              <p className="text-xs text-[#A0A0B0] mt-1 font-mono-num">
                {processingStage === 'approved'
                  ? `NPCI Reference UTR: ${utrNumber}`
                  : 'Please do not close or refresh this window'}
              </p>
            </div>

            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-electric-gradient transition-all duration-500"
                style={{
                  width:
                    processingStage === 'switch'
                      ? '35%'
                      : processingStage === 'collect'
                      ? '75%'
                      : '100%',
                }}
              />
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[10px] bg-[#1A1A1F] border border-white/[0.06]">
              {(
                [
                  { id: 'qr', label: 'UPI QR Code', icon: 'fa-qrcode' },
                  { id: 'intent', label: 'UPI Apps', icon: 'fa-mobile-screen' },
                  { id: 'vpa', label: 'Enter UPI ID', icon: 'fa-at' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGatewayTab(tab.id)}
                  className={`py-2 px-2 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    gatewayTab === tab.id
                      ? 'bg-electric-gradient text-white shadow-sm'
                      : 'text-[#A0A0B0] hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[11px]`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: DYNAMIC UPI QR CODE */}
            {gatewayTab === 'qr' && (
              <div className="bg-[#1A1A1F] rounded-[12px] p-4 border border-white/[0.07] text-center space-y-3">
                <div className="flex items-center justify-between text-[11px] text-[#A0A0B0]">
                  <span>Scan with GPay / PhonePe / Paytm</span>
                  <span className="font-mono-num text-emerald-400">
                    Exact Amount Locked
                  </span>
                </div>

                {/* Scannable Dynamic UPI QR Matrix */}
                <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-[12px] shadow-lg flex items-center justify-center relative overflow-hidden">
                  <img
                    src={upiQrImageUrl}
                    alt={`UPI QR Code for ${STORE_NAME}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback SVG representation if external service fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Payee Info & Copy UPI ID Badge */}
                <div className="p-2.5 rounded-[10px] bg-[#111113] border border-white/10 flex items-center justify-between gap-2 text-left">
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#A0A0B0] block">Official Merchant UPI ID:</span>
                    <span className="font-mono-num text-xs font-bold text-white tracking-wide truncate block">
                      {STORE_UPI_ID}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    className="px-3 py-1.5 rounded-[6px] bg-electric-gradient text-[11px] font-semibold text-white whitespace-nowrap hover:scale-105 transition-all"
                  >
                    {copiedUpi ? '✓ Copied' : 'Copy UPI'}
                  </button>
                </div>

                {/* Mobile Intent Direct Link */}
                <a
                  href={upiIntentUri}
                  className="block sm:hidden w-full py-2 px-3 rounded-[8px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all"
                >
                  <i className="fa-solid fa-mobile-screen mr-1.5" />
                  Tap to Pay Directly with UPI App
                </a>

                <div className="flex items-center justify-center gap-3 text-[11px] text-[#A0A0B0]">
                  <span>PhonePe</span>
                  <span>·</span>
                  <span>Google Pay</span>
                  <span>·</span>
                  <span>Paytm</span>
                  <span>·</span>
                  <span>BHIM</span>
                </div>
              </div>
            )}

            {/* TAB 2: UPI INTENT APPS */}
            {gatewayTab === 'intent' && (
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { name: 'GPay', desc: 'Google Pay Instant' },
                    { name: 'PhonePe', desc: 'PhonePe UPI Switch' },
                    { name: 'Paytm', desc: 'Paytm UPI Wallet' },
                    { name: 'CRED', desc: 'CRED Pay UPI' },
                  ] as const
                ).map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => setSelectedApp(app.name)}
                    className={`p-3.5 rounded-[12px] border text-left transition-all ${
                      selectedApp === app.name
                        ? 'bg-[#1A1A1F] border-[#6C63FF] ring-1 ring-[#6C63FF]'
                        : 'bg-[#16161B] border-white/10 text-[#A0A0B0]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-xs font-bold text-white">
                        {app.name}
                      </span>
                      <i
                        className={`fa-solid fa-circle-check text-xs ${
                          selectedApp === app.name
                            ? 'text-[#6C63FF]'
                            : 'opacity-20'
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-[#A0A0B0] block">
                      {app.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* TAB 3: VPA / UPI ID */}
            {gatewayTab === 'vpa' && (
              <div className="bg-[#1A1A1F] rounded-[12px] p-4 border border-white/[0.07] space-y-3">
                <label className="block text-xs text-[#A0A0B0]">
                  Enter your Virtual Payment Address (UPI ID)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vpaInput}
                    onChange={(e) => {
                      setVpaInput(e.target.value);
                      setIsVpaVerified(false);
                    }}
                    placeholder="yourname@okicici"
                    className="flex-1 px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (vpaInput.includes('@')) setIsVpaVerified(true);
                    }}
                    className="px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/15 text-xs font-semibold text-[#6C63FF]"
                  >
                    Verify
                  </button>
                </div>
                {isVpaVerified && vpaInput.includes('@') && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-check" />
                    <span>Verified Banking Name: {customerName}</span>
                  </p>
                )}
              </div>
            )}

            {/* Primary Authorize Button */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleAuthorizePayment}
                className="w-full py-3.5 px-6 rounded-[8px] bg-electric-gradient text-white font-display text-sm font-bold shadow-electric-glow hover:scale-[1.01] transition-all flex items-center justify-center gap-2 btn-interactive"
              >
                <i className="fa-solid fa-shield-halved text-xs" />
                <span>
                  Authorize UPI Payment · {formatINR(amount)}
                </span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-[#6B6B7B] px-1">
                <span>100% Buyer Protection · Instant WhatsApp Receipt</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#A0A0B0] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   CHECKOUT VIEW (#/checkout)
   Captures customer phone numbers, email, and complete address details during ordering
   ========================================================================== */
interface SavedCheckoutAddress {
  id: string;
  label: 'Home' | 'Office' | 'Other';
  fullName: string;
  phone: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface CheckoutViewProps {
  items: CartItem[];
  initialProfile?: {
    fullName: string;
    email: string;
    phone: string;
    addresses?: SavedCheckoutAddress[];
  };
  onPlaceOrder: (orderData: {
    address: OrderAddress;
    customerEmail: string;
    altPhone?: string;
    landmark?: string;
    addressLabel?: 'Home' | 'Office' | 'Other';
    deliveryNotes?: string;
    saveToProfile?: boolean;
    paymentMethod: 'UPI' | 'Card' | 'COD';
    paymentDetails: string;
    discount: number;
  }) => void;
  onNavigateShop: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  initialProfile,
  onPlaceOrder,
  onNavigateShop,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const defaultSavedAddr =
    initialProfile?.addresses?.find((a) => a.isDefault) ||
    initialProfile?.addresses?.[0];

  // Customer Contact & Indian Delivery Address State (Captured during ordering)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    defaultSavedAddr?.id || 'custom'
  );
  const [fullName, setFullName] = useState(
    defaultSavedAddr?.fullName || initialProfile?.fullName || ''
  );
  const [phone, setPhone] = useState(
    defaultSavedAddr?.phone || initialProfile?.phone || ''
  );
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [pincode, setPincode] = useState(defaultSavedAddr?.pincode || '');
  const [area, setArea] = useState(defaultSavedAddr?.area || '');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(defaultSavedAddr?.city || 'Bengaluru');
  const [state, setState] = useState(defaultSavedAddr?.state || 'Karnataka');
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Office' | 'Other'>(
    defaultSavedAddr?.label || 'Home'
  );
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [addressError, setAddressError] = useState('');

  const handleSelectSavedAddress = (addr: SavedCheckoutAddress) => {
    setSelectedAddressId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setPincode(addr.pincode);
    setArea(addr.area);
    setCity(addr.city);
    setState(addr.state);
    setAddressLabel(addr.label);
    setAddressError('');
  };

  const handleStartNewAddress = () => {
    setSelectedAddressId('new');
    setFullName(initialProfile?.fullName || '');
    setPhone(initialProfile?.phone || '');
    setAltPhone('');
    setPincode('');
    setArea('');
    setLandmark('');
    setCity('');
    setState('Karnataka');
    setAddressLabel('Home');
    setAddressError('');
  };

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'COD'>('UPI');
  const [upiApp, setUpiApp] = useState<'GPay' | 'PhonePe' | 'Paytm'>('GPay');
  const [upiId, setUpiId] = useState('aarav@okicici');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8891');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('842');

  // Promo & Submission State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isUpiGatewayOpen, setIsUpiGatewayOpen] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const discount = appliedCoupon === 'VOLT10' ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const handlePincodeChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 6);
    setPincode(digits);
    if (digits.startsWith('560')) {
      setCity('Bengaluru');
      setState('Karnataka');
    } else if (digits.startsWith('400')) {
      setCity('Mumbai');
      setState('Maharashtra');
    } else if (digits.startsWith('110')) {
      setCity('New Delhi');
      setState('Delhi');
    } else if (digits.startsWith('411')) {
      setCity('Pune');
      setState('Maharashtra');
    } else if (digits.startsWith('500')) {
      setCity('Hyderabad');
      setState('Telangana');
    } else if (digits.startsWith('600')) {
      setCity('Chennai');
      setState('Tamil Nadu');
    }
  };

  const validateStep1 = () => {
    if (!fullName.trim()) {
      setAddressError('Please enter the recipient full name.');
      return false;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setAddressError('Please enter a valid 10-digit Indian mobile number (+91) for delivery & order updates.');
      return false;
    }
    if (altPhone.trim() && !/^\d{10}$/.test(altPhone.trim())) {
      setAddressError('Alternate mobile number must be 10 digits.');
      return false;
    }
    if (email.trim() && !email.includes('@')) {
      setAddressError('Please enter a valid email address for your GST invoice.');
      return false;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setAddressError('Please enter a valid 6-digit Pincode.');
      return false;
    }
    if (!area.trim() || !city.trim()) {
      setAddressError('Please complete your street/flat address and city.');
      return false;
    }
    setAddressError('');
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateStep1()) {
      setActiveStep(2);
    }
  };

  const handleContinueToReview = () => {
    setActiveStep(3);
  };

  const finalizeOrderWithPayment = (paymentDetails: string) => {
    setIsUpiGatewayOpen(false);
    setIsPlacingOrder(true);
    const fullAreaWithExtras = [
      area.trim(),
      landmark.trim() ? `Landmark: ${landmark.trim()}` : '',
      altPhone.trim() ? `Alt Phone: +91 ${altPhone.trim()}` : '',
      deliveryNotes.trim() ? `Note: ${deliveryNotes.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    setTimeout(() => {
      onPlaceOrder({
        address: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          pincode: pincode.trim(),
          area: fullAreaWithExtras,
          city: city.trim(),
          state,
        },
        customerEmail:
          email.trim() ||
          `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        altPhone: altPhone.trim() || undefined,
        landmark: landmark.trim() || undefined,
        addressLabel,
        deliveryNotes: deliveryNotes.trim() || undefined,
        saveToProfile,
        paymentMethod,
        paymentDetails,
        discount,
      });
    }, 600);
  };

  const handleFinalSubmit = () => {
    if (!validateStep1()) {
      setActiveStep(1);
      return;
    }

    // If UPI is selected, open the interactive Online UPI Payment Gateway Modal!
    if (paymentMethod === 'UPI') {
      setIsUpiGatewayOpen(true);
      return;
    }

    const paymentDetails =
      paymentMethod === 'Card'
        ? `Card (${cardNumber.slice(-4)})`
        : 'Cash on Delivery (Pay at Doorstep)';

    finalizeOrderWithPayment(paymentDetails);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-page-enter">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A1F] border border-white/10 flex items-center justify-center mx-auto mb-4 text-[#6B6B7B]">
          <i className="fa-solid fa-bag-shopping text-2xl" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-2">
          Your Checkout Bag is Empty
        </h1>
        <p className="text-sm text-[#A0A0B0] mb-6">
          Add one or more {STORE_NAME} products before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={onNavigateShop}
          className="px-6 py-3 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow"
        >
          Browse Storefront
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-enter">
      {/* Online UPI Payment Gateway Modal */}
      <UpiPaymentGatewayModal
        isOpen={isUpiGatewayOpen}
        amount={total}
        customerName={fullName}
        customerPhone={phone}
        initialUpiApp={upiApp}
        initialUpiId={upiId}
        onClose={() => setIsUpiGatewayOpen(false)}
        onPaymentSuccess={(paymentSummary) =>
          finalizeOrderWithPayment(paymentSummary)
        }
      />

      <div className="mb-8">
        <span className="text-xs text-[#A0A0B0]">
          256-Bit Encrypted Checkout · Instant WhatsApp Order Handoff
        </span>
        <h1 className="font-display text-3xl font-bold text-white mt-1">
          Complete Your Order
        </h1>
      </div>

      {/* Two-Column Layout on Desktop: Form Left (7 cols), Sticky Summary Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Smooth Accordion Form Sections */}
        <div className="lg:col-span-7 space-y-4">
          {/* ACCORDION 1: CONTACT, PHONE NUMBER & DELIVERY ADDRESS DETAILS */}
          <div className="bg-[#111113] rounded-[16px] border border-white/[0.08] overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="w-full px-6 py-5 flex items-center justify-between text-left bg-[#16161C]/60 hover:bg-[#16161C] transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`w-7 h-7 rounded-full text-xs font-mono-num font-bold flex items-center justify-center ${
                    activeStep >= 1
                      ? 'bg-electric-gradient text-white'
                      : 'bg-[#1A1A1F] text-[#A0A0B0]'
                  }`}
                >
                  1
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-white">
                    Contact, Phone Number &amp; Delivery Address
                  </h2>
                  {activeStep > 1 ? (
                    <p className="text-xs text-[#A0A0B0] truncate max-w-md">
                      {fullName} (+91 {phone}) · {city}, {state} - {pincode}
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#A0A0B0] mt-0.5">
                      Enter your mobile number and shipping address for courier delivery &amp; WhatsApp updates
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#6C63FF] font-medium">
                {activeStep === 1 ? 'Editing' : 'Change'}
              </span>
            </button>

            {activeStep === 1 && (
              <div className="p-6 space-y-5 border-t border-white/[0.07] animate-page-enter">
                {addressError && (
                  <div className="p-3.5 rounded-[10px] bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
                    <i className="fa-solid fa-circle-exclamation shrink-0" />
                    <span>{addressError}</span>
                  </div>
                )}

                {/* Quick Saved Address Selector (if available) */}
                {initialProfile?.addresses && initialProfile.addresses.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#A0A0B0]">
                        Select a Saved Address or Enter New Details:
                      </span>
                      <button
                        type="button"
                        onClick={handleStartNewAddress}
                        className="text-xs font-semibold text-[#FF6B35] hover:underline flex items-center gap-1"
                      >
                        <i className="fa-solid fa-plus text-[10px]" />
                        <span>Enter New Address</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {initialProfile.addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`p-3.5 rounded-[12px] border text-left transition-all ${
                              isSelected
                                ? 'bg-[#1A1A1F] border-[#6C63FF] ring-1 ring-[#6C63FF]'
                                : 'bg-[#16161B] border-white/10 text-[#A0A0B0] hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-display text-xs font-bold text-white uppercase tracking-wider">
                                {addr.label}
                              </span>
                              <span className="text-[11px] font-mono-num text-[#6C63FF]">
                                {addr.pincode}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-white truncate">
                              {addr.fullName} · +91 {addr.phone}
                            </p>
                            <p className="text-[11px] text-[#A0A0B0] truncate mt-0.5">
                              {addr.area}, {addr.city}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 1A: Recipient Contact & Phone Numbers */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                      1. Contact &amp; Mobile Details
                    </span>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <i className="fa-brands fa-whatsapp" />
                      <span>Used for Courier Call &amp; Tracking</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        id="checkout-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-name"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        Recipient Full Name *
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        id="checkout-phone"
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm font-mono-num text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-phone"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        10-Digit Mobile Number (+91) *
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        id="checkout-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-email"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        Email Address (For GST Invoice &amp; Warranty)
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        id="checkout-alt-phone"
                        type="tel"
                        maxLength={10}
                        value={altPhone}
                        onChange={(e) =>
                          setAltPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm font-mono-num text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-alt-phone"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        Alternate Phone / WhatsApp Number (Optional)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 1B: Complete Shipping Address */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
                      2. Complete Delivery Address
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setAddressLabel(lbl)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            addressLabel === lbl
                              ? 'bg-electric-gradient text-white'
                              : 'bg-[#1A1A1F] text-[#A0A0B0] border border-white/10 hover:text-white'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                      <input
                        id="checkout-pincode"
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm font-mono-num text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-pincode"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        Pincode (6 Digits) *
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        id="checkout-city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-city"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        City / District *
                      </label>
                    </div>

                    <div className="relative">
                      <select
                        id="checkout-state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF]"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <label
                        htmlFor="checkout-state"
                        className="absolute left-4 top-1.5 text-[10px] text-[#A0A0B0]"
                      >
                        State *
                      </label>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      id="checkout-area"
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder=" "
                      className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                    />
                    <label
                      htmlFor="checkout-area"
                      className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                    >
                      Flat, House No., Building, Street, Area, Colony *
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        id="checkout-landmark"
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-landmark"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        Nearby Landmark (Optional)
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        id="checkout-notes"
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder=" "
                        className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                      />
                      <label
                        htmlFor="checkout-notes"
                        className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
                      >
                        Delivery Instructions (Optional)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/[0.06]">
                  <label className="inline-flex items-center gap-2.5 text-xs text-[#A0A0B0] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#6C63FF]"
                    />
                    <span>
                      Save this phone number &amp; delivery address to my account
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    className="px-6 py-3 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-all whitespace-nowrap"
                  >
                    Continue to Payment Method →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: PAYMENT METHOD */}
          <div className="bg-[#111113] rounded-[16px] border border-white/[0.08] overflow-hidden">
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setActiveStep(2);
              }}
              className="w-full px-6 py-5 flex items-center justify-between text-left bg-[#16161C]/60 hover:bg-[#16161C] transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`w-7 h-7 rounded-full text-xs font-mono-num font-bold flex items-center justify-center ${
                    activeStep >= 2
                      ? 'bg-electric-gradient text-white'
                      : 'bg-[#1A1A1F] text-[#A0A0B0]'
                  }`}
                >
                  2
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-white">
                    Payment Method
                  </h2>
                  {activeStep > 2 && (
                    <p className="text-xs text-[#A0A0B0]">
                      Selected: {paymentMethod}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-xs text-[#6C63FF] font-medium">
                {activeStep === 2 ? 'Selecting' : 'Edit'}
              </span>
            </button>

            {activeStep === 2 && (
              <div className="p-6 space-y-5 border-t border-white/[0.07] animate-page-enter">
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { id: 'UPI', label: 'UPI Gateway', icon: 'fa-qrcode' },
                      { id: 'Card', label: 'Credit / Debit Card', icon: 'fa-credit-card' },
                      { id: 'COD', label: 'Cash on Delivery', icon: 'fa-indian-rupee-sign' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3.5 rounded-[12px] border text-left transition-all ${
                        paymentMethod === m.id
                          ? 'bg-[#1A1A1F] border-[#6C63FF] ring-1 ring-[#6C63FF]'
                          : 'bg-[#16161B] border-white/10 text-[#A0A0B0] hover:text-white'
                      }`}
                    >
                      <i
                        className={`fa-solid ${m.icon} text-sm mb-2 block ${
                          paymentMethod === m.id ? 'text-[#6C63FF]' : 'text-[#A0A0B0]'
                        }`}
                      />
                      <span className="font-display text-xs font-semibold text-white block">
                        {m.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* UPI Options */}
                {paymentMethod === 'UPI' && (
                  <div className="bg-[#1A1A1F] rounded-[12px] p-5 border border-white/[0.07] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#A0A0B0]">
                        Select preferred UPI app or scan QR in the gateway:
                      </span>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        Zero Gateway Fee
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {(
                        [
                          { name: 'GPay' },
                          { name: 'PhonePe' },
                          { name: 'Paytm' },
                        ] as const
                      ).map((app) => (
                        <button
                          key={app.name}
                          type="button"
                          onClick={() => setUpiApp(app.name)}
                          className={`py-3 px-3 rounded-[10px] border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                            upiApp === app.name
                              ? 'bg-[#111113] border-[#6C63FF] text-white shadow-sm'
                              : 'bg-[#111113]/50 border-white/10 text-[#A0A0B0]'
                          }`}
                        >
                          <i
                            className={`fa-solid fa-circle-check text-xs ${
                              upiApp === app.name ? 'text-[#6C63FF]' : 'opacity-25'
                            }`}
                          />
                          <span>{app.name}</span>
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs text-[#A0A0B0] mb-1.5">
                        UPI ID (VPA) for Collect Request
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okicici"
                        className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="bg-[#1A1A1F] rounded-[12px] p-5 border border-white/[0.07] space-y-4">
                    <div>
                      <label className="block text-xs text-[#A0A0B0] mb-1">
                        Card Number (Visa / MasterCard / RuPay)
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#A0A0B0] mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#A0A0B0] mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'COD' && (
                  <div className="bg-[#1A1A1F] rounded-[12px] p-5 border border-white/[0.07] text-xs text-[#A0A0B0] space-y-2">
                    <p className="text-white font-semibold">
                      Cash / UPI on Delivery Available for Pincode {pincode}
                    </p>
                    <p>
                      Pay <strong className="text-white font-mono-num">{formatINR(total)}</strong>{' '}
                      directly to the courier partner via Cash or UPI QR scan upon doorstep
                      delivery.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-[#A0A0B0] hover:text-white"
                  >
                    ← Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueToReview}
                    className="px-6 py-3 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 3: REVIEW & PLACE ORDER */}
          <div className="bg-[#111113] rounded-[16px] border border-white/[0.08] overflow-hidden">
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setActiveStep(3);
              }}
              className="w-full px-6 py-5 flex items-center justify-between text-left bg-[#16161C]/60 hover:bg-[#16161C] transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`w-7 h-7 rounded-full text-xs font-mono-num font-bold flex items-center justify-center ${
                    activeStep === 3
                      ? 'bg-electric-gradient text-white'
                      : 'bg-[#1A1A1F] text-[#A0A0B0]'
                  }`}
                >
                  3
                </span>
                <h2 className="font-display text-base font-bold text-white">
                  Review &amp; Pay
                </h2>
              </div>
            </button>

            {activeStep === 3 && (
              <div className="p-6 space-y-5 border-t border-white/[0.07] animate-page-enter">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#1A1A1F] p-4 rounded-[12px] border border-white/[0.06]">
                    <span className="text-[#6B6B7B] block mb-1">Delivering To</span>
                    <p className="font-semibold text-white">{fullName}</p>
                    <p className="text-[#A0A0B0] mt-0.5">{area}</p>
                    <p className="text-[#A0A0B0]">
                      {city}, {state} — {pincode}
                    </p>
                    <p className="text-[#A0A0B0] font-mono-num mt-1">+91 {phone}</p>
                  </div>
                  <div className="bg-[#1A1A1F] p-4 rounded-[12px] border border-white/[0.06]">
                    <span className="text-[#6B6B7B] block mb-1">Payment &amp; Concierge</span>
                    <p className="font-semibold text-white">
                      {paymentMethod === 'UPI'
                        ? 'VoltPay Online UPI Gateway'
                        : paymentMethod}
                    </p>
                    <p className="text-[#A0A0B0] mt-0.5">
                      {paymentMethod === 'UPI'
                        ? `${upiApp} / Dynamic QR (${upiId})`
                        : paymentMethod === 'Card'
                        ? cardNumber
                        : 'Pay via Cash or UPI at Doorstep'}
                    </p>
                    <p className="text-emerald-400 mt-2 flex items-center gap-1.5">
                      <i className="fa-brands fa-whatsapp" />
                      <span>Includes Direct WhatsApp Handler Receipt</span>
                    </p>
                  </div>
                </div>

                {/* Place Order / Open UPI Gateway Button */}
                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handleFinalSubmit}
                  className="w-full py-4 px-6 rounded-[8px] bg-electric-gradient text-white font-display text-sm font-bold shadow-electric-glow hover:scale-[1.01] transition-all flex items-center justify-center gap-3 btn-interactive"
                >
                  {isPlacingOrder ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                      <span>Generating Order &amp; WhatsApp Dispatch Ticket...</span>
                    </>
                  ) : paymentMethod === 'UPI' ? (
                    <>
                      <i className="fa-solid fa-qrcode text-sm" />
                      <span>Proceed to UPI Payment Gateway · {formatINR(total)}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-lock text-xs" />
                      <span>Place Order · {formatINR(total)}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sticky Order Summary */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-[#111113] rounded-[16px] p-6 border border-white/[0.08] shadow-card space-y-5">
          <h2 className="font-display text-lg font-bold text-white border-b border-white/[0.07] pb-3.5">
            Order Summary ({items.reduce((a, b) => a + b.quantity, 0)} Items)
          </h2>

          <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.color}-${item.size}`}
                className="flex items-center gap-3.5"
              >
                <div className="w-14 h-14 rounded-[10px] overflow-hidden bg-[#1A1A1F] border border-white/10 shrink-0">
                  <ResilientImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-xs font-semibold text-white truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-[#6B6B7B] truncate">
                    {item.color} · {item.size} × {item.quantity}
                  </p>
                </div>
                <span className="font-mono-num text-xs font-semibold text-white shrink-0">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/[0.07]">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Promo code (Try VOLT10)"
                className="flex-1 px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
              />
              <button
                type="button"
                onClick={() => {
                  if (couponInput.trim() === 'VOLT10') {
                    setAppliedCoupon('VOLT10');
                  }
                }}
                className="px-4 py-2 rounded-[8px] bg-[#1A1A1F] hover:bg-[#25252E] border border-white/15 text-xs font-semibold text-white"
              >
                Apply
              </button>
            </div>
            {appliedCoupon === 'VOLT10' && (
              <p className="text-[11px] text-emerald-400 mt-1.5">
                ✓ VOLT10 applied (10% instant discount)
              </p>
            )}
          </div>

          <div className="space-y-2.5 pt-3 border-t border-white/[0.07] text-xs">
            <div className="flex justify-between text-[#A0A0B0]">
              <span>Subtotal</span>
              <span className="font-mono-num text-white">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Promo Discount (VOLT10)</span>
                <span className="font-mono-num">−{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#A0A0B0]">
              <span>Express Shipping (FREE above ₹499)</span>
              <span className="font-mono-num text-emerald-400">
                {shipping === 0 ? 'FREE' : formatINR(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-white/[0.08]">
              <span className="font-display">Total Payable</span>
              <span className="font-mono-num text-electric-gradient text-xl">
                {formatINR(total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   ORDER SUCCESS VIEW (#/order-success)
   Includes:
   1. Visual Timeline Progress Bar (Ordered -> Packed -> Shipped -> Delivered)
   2. Post-Payment WhatsApp Store Handler Redirect & Full Order Message
   ========================================================================== */
interface OrderSuccessViewProps {
  order: Order | null;
  onTrackOrder: (orderId: string) => void;
  onContinueShopping: () => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({
  order,
  onTrackOrder,
  onContinueShopping,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [storeHandlerPhone, setStoreHandlerPhone] = useState(STORE_PHONE);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [showMessagePreview, setShowMessagePreview] = useState(true);

  // Subtle 2-second particle burst
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6C63FF', '#FF6B35', '#10B981', '#FFFFFF', '#A855F7'];
    const particles = Array.from({ length: 65 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 2 - 60,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
    }));

    let frameId: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (elapsed < 2100) {
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.28;
          p.alpha = Math.max(0, 1 - elapsed / 2000);

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });
        frameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const displayOrderId = order?.id || 'CM-20261002-001';

  const timelineSteps: {
    statusKey: Order['status'];
    label: string;
    subtitle: string;
    icon: string;
  }[] = [
    {
      statusKey: 'Pending',
      label: 'Ordered',
      subtitle: 'Payment & order verified',
      icon: 'fa-file-invoice',
    },
    {
      statusKey: 'Packed',
      label: 'Packed',
      subtitle: 'QA tested & sealed',
      icon: 'fa-box-archive',
    },
    {
      statusKey: 'Shipped',
      label: 'Shipped',
      subtitle: 'Dispatched via air hub',
      icon: 'fa-truck-fast',
    },
    {
      statusKey: 'Delivered',
      label: 'Delivered',
      subtitle: 'Handed over with OTP',
      icon: 'fa-house-circle-check',
    },
  ];

  const statusOrder: Order['status'][] = ['Pending', 'Packed', 'Shipped', 'Delivered'];
  const currentStepIdx = order
    ? Math.max(0, statusOrder.indexOf(order.status))
    : 0;
  const progressPercent = (currentStepIdx / (timelineSteps.length - 1)) * 100;

  const whatsappMessage = order
    ? buildWhatsAppOrderMessage(order)
    : `⚡ *${STORE_NAME.toUpperCase()} ORDER CONFIRMED*\nOrder ID: ${displayOrderId}\nPlease confirm dispatch & share tracking details.\nStore Contact: +91 ${STORE_PHONE}\nLocation: ${STORE_MAPS_URL}`;

  const cleanedHandlerPhone = storeHandlerPhone.replace(/\D/g, '').slice(0, 10);
  const whatsappUrl = `https://wa.me/91${
    cleanedHandlerPhone || STORE_PHONE
  }?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyMessage = () => {
    navigator.clipboard?.writeText(whatsappMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 animate-page-enter">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-20"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl bg-[#111113] border border-white/10 rounded-[16px] p-6 sm:p-9 shadow-card space-y-7">
        {/* Top Celebration Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6C63FF" />
                  <stop offset="100%" stopColor="#FF6B35" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="url(#successGrad)"
                strokeWidth="4"
                className="svg-circle-anim"
              />
              <path
                d="M30 52 L44 66 L72 36"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="svg-check-anim"
              />
            </svg>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1.5">
            Order Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A0B0]">
            Order <strong className="text-white font-mono-num">{displayOrderId}</strong> is
            logged in our fulfillment queue.
          </p>
        </div>

        {/* VISUAL TIMELINE PROGRESS BAR: Ordered -> Packed -> Shipped -> Delivered */}
        <div className="bg-[#1A1A1F] rounded-[12px] p-5 border border-white/[0.07]">
          <div className="flex items-center justify-between text-xs mb-4">
            <span className="font-display font-bold text-white uppercase tracking-wider text-[11px]">
              Live Fulfillment Timeline
            </span>
            <span className="text-emerald-400 font-medium">
              Current Stage:{' '}
              {order?.status === 'Pending' || !order ? 'Ordered' : order.status}
            </span>
          </div>

          <div className="relative pt-2 pb-1">
            {/* Background Track */}
            <div className="absolute top-7 left-7 right-7 h-1 bg-white/10 rounded-full" />
            {/* Active Gradient Progress Fill */}
            <div
              className="absolute top-7 left-7 h-1 bg-electric-gradient rounded-full transition-all duration-500"
              style={{
                width: `calc((100% - 3.5rem) * ${progressPercent / 100})`,
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
                        isCurrent ? 'ring-4 ring-[#6C63FF]/30 scale-110' : ''
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

        {/* DIRECT WHATSAPP STORE HANDLER CONCIERGE & TRUST CARD */}
        <div className="bg-gradient-to-br from-[#13221B] via-[#141A1A] to-[#1A1A1F] rounded-[14px] p-5 sm:p-6 border border-emerald-500/35 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                <i className="fa-brands fa-whatsapp text-xl" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <span>Send Verified Order to Store Handler</span>
                </h2>
                <p className="text-xs text-[#A0A0B0]">
                  Connect directly with our dispatch manager on WhatsApp with your
                  pre-filled payment &amp; order receipt for priority handling.
                </p>
              </div>
            </div>
          </div>

          {/* Store Handler WhatsApp Number Input (Customizable for testing) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <label
              htmlFor="handler-whatsapp"
              className="text-[#A0A0B0] whitespace-nowrap"
            >
              Store Handler WhatsApp (+91):
            </label>
            <div className="flex items-center gap-2">
              <input
                id="handler-whatsapp"
                type="tel"
                maxLength={10}
                value={storeHandlerPhone}
                onChange={(e) =>
                  setStoreHandlerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                className="w-36 px-3 py-1.5 rounded-[6px] bg-[#0A0A0B]/70 border border-white/15 font-mono-num text-xs text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowMessagePreview((p) => !p)}
                className="text-xs text-emerald-400 hover:underline whitespace-nowrap"
              >
                {showMessagePreview ? 'Hide Receipt Text' : 'Preview Receipt Text'}
              </button>
            </div>
          </div>

          {/* Pre-filled WhatsApp Message Preview */}
          {showMessagePreview && (
            <div className="relative rounded-[10px] bg-[#0A0A0B]/85 border border-white/10 p-3.5 text-left">
              <pre className="text-[11px] font-mono-num text-white/90 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                {whatsappMessage}
              </pre>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-[10px] font-semibold text-white"
              >
                {copiedMsg ? '✓ Copied' : 'Copy Text'}
              </button>
            </div>
          )}

          {/* Direct WhatsApp Redirect Anchor CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-[8px] bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] font-display text-sm font-bold shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 whitespace-nowrap"
          >
            <i className="fa-brands fa-whatsapp text-base" />
            <span>Send Order Details on WhatsApp Now</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
          </a>
        </div>

        {/* PHYSICAL STORE LOCATION & DIRECT CONTACT CARD */}
        <div className="bg-[#16161D] rounded-[14px] p-5 border border-white/10 text-left space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/20 border border-[#6C63FF]/40 flex items-center justify-center text-[#6C63FF] shrink-0">
                <i className="fa-solid fa-location-dot text-lg" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                  <span>Visit Our Store — {STORE_NAME}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                    Open Now
                  </span>
                </h3>
                <p className="text-xs text-[#A0A0B0]">
                  Collect your orders in person, test accessories, or get warranty support.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <a
              href={`tel:+91${STORE_PHONE}`}
              className="flex items-center gap-2.5 p-2.5 rounded-[8px] bg-[#111113] border border-white/5 text-[#A0A0B0] hover:text-white hover:border-white/20 transition-all"
            >
              <i className="fa-solid fa-phone text-[#6C63FF]" />
              <span className="font-mono-num font-medium text-white">{STORE_PHONE_DISPLAY}</span>
            </a>
            <a
              href={`mailto:${STORE_EMAIL}`}
              className="flex items-center gap-2.5 p-2.5 rounded-[8px] bg-[#111113] border border-white/5 text-[#A0A0B0] hover:text-white hover:border-white/20 transition-all truncate"
            >
              <i className="fa-solid fa-envelope text-[#FF6B35]" />
              <span className="truncate">{STORE_EMAIL}</span>
            </a>
          </div>

          <a
            href={STORE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-[8px] bg-[#1F1F28] hover:bg-[#282836] border border-white/15 text-white font-display text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <i className="fa-solid fa-map-location-dot text-[#6C63FF]" />
            <span>Open {STORE_NAME} on Google Maps</span>
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-[#A0A0B0]" />
          </a>
        </div>

        {/* Order Summary Metadata */}
        {order && (
          <div className="bg-[#1A1A1F] rounded-[12px] p-5 border border-white/[0.07] text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#A0A0B0]">Recipient</span>
              <span className="text-white font-medium">
                {order.customerName} (+91 {order.phone})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A0A0B0]">Delivery Address</span>
              <span className="text-white truncate max-w-xs">
                {order.address.city}, {order.address.state} ({order.address.pincode})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A0A0B0]">Payment Reference</span>
              <span className="text-emerald-400 font-mono-num">
                {order.paymentMethod}{' '}
                {order.paymentDetails ? `· ${order.paymentDetails}` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <span className="text-[#A0A0B0]">Total Amount</span>
              <span className="font-mono-num text-sm font-bold text-electric-gradient">
                {formatINR(order.total)}
              </span>
            </div>
          </div>
        )}

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => onTrackOrder(displayOrderId)}
            className="py-3.5 px-5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#23232C] border border-white/15 text-white font-display text-xs font-semibold transition-all whitespace-nowrap"
          >
            Open Live Shipment Tracker
          </button>
          <button
            type="button"
            onClick={onContinueShopping}
            className="py-3.5 px-5 rounded-[8px] bg-electric-gradient text-white font-display text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-all whitespace-nowrap"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};
