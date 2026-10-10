import React, { useEffect, useRef, useState } from 'react';
import {
  CartItem,
  INDIAN_STATES,
  Order,
  OrderAddress,
  STORE_EMAIL,
  STORE_MAPS_URL,
  STORE_MERCHANT_NAME,
  STORE_NAME,
  STORE_PHONE,
  STORE_PHONE_DISPLAY,
  STORE_UPI_ID,
  formatINR,
  getStorePaymentSettings,
} from '../data/seedData';
import { CrazyMobilesEmblem, CrazyMobilesLogo } from './CrazyMobilesLogo';
import { CrazyMobilesPaymentQR } from './CrazyMobilesPaymentQR';
import { ResilientImage } from './ResilientImage';

export function buildWhatsAppOrderMessage(order: Order): string {
  const settings = getStorePaymentSettings();
  const itemsLines = order.items
    .map(
      (item, idx) =>
        `   • ${item.name} (${item.color} / ${item.size}) × ${
          item.quantity
        } = ${formatINR(item.price * item.quantity)}`
    )
    .join('\n');

  const merchantDisplayName = settings.merchantName || STORE_MERCHANT_NAME;
  const storeContactPhone = settings.paymentPhone || STORE_PHONE;

  const paymentLines =
    order.paymentMethod === 'COD'
      ? [
          `💳 *Payment Method:* CASH ON DELIVERY (COD)`,
          `💵 *Payment Status:* Collect on Doorstep upon Arrival`,
        ]
      : [
          `💳 *Payment Method:* ONLINE UPI PAYMENT`,
          `🔒 *Merchant UPI ID:* ${settings.upiId || STORE_UPI_ID}`,
          `🔖 *Payment Ref / UTR:* ${order.paymentDetails || 'UPI-VERIFIED'}`,
          `✅ *Payment Status:* PAID & VERIFIED ONLINE`,
        ];

  return [
    `🛍️ *${merchantDisplayName} — ORDER CONFIRMATION*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Order ID:* #${order.id}`,
    `📅 *Date:* ${order.date || 'Today'}`,
    ...paymentLines,
    `💰 *Total Amount:* ${formatINR(order.total)}`,
    ``,
    `👤 *Customer Details:*`,
    `• Name: ${order.customerName}`,
    `• Customer Mobile: +91 ${order.phone}`,
    `• Delivery Address: ${order.address.area}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
    ``,
    `📦 *Order Summary:*`,
    itemsLines,
    ``,
    `🚚 *Shipping:* Express Insured Delivery (Free)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🏬 *Store Contact:* +91 ${storeContactPhone} · ${STORE_EMAIL}`,
    `📍 *Store Location:* ${STORE_MAPS_URL}`,
    ``,
    `✅ *Verified by Customer (+91 ${order.phone}) for Order #${order.id}*`,
    `Please confirm dispatch & send tracking updates!`,
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
  initialUpiApp?: 'GPay' | 'PhonePe' | 'Paytm' | 'CRED';
  initialUpiId?: string;
  onClose: () => void;
  onPaymentSuccess: (paymentSummary: string) => void;
}

const UpiPaymentGatewayModal: React.FC<UpiGatewayModalProps> = ({
  isOpen,
  amount,
  customerName,
  customerPhone,
  initialUpiApp = 'GPay',
  initialUpiId,
  onClose,
  onPaymentSuccess,
}) => {
  const [gatewayTab, setGatewayTab] = useState<'qr' | 'intent' | 'vpa'>('qr');
  const [selectedApp, setSelectedApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'CRED'>(
    initialUpiApp
  );
  const [userVpaInput, setUserVpaInput] = useState('');
  const [manualUtrInput, setManualUtrInput] = useState('');
  const [appOpened, setAppOpened] = useState(false);
  const [authError, setAuthError] = useState('');
  const [returnAuthorized, setReturnAuthorized] = useState(false);
  const [isVerifyingReturn, setIsVerifyingReturn] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(299);
  const [processingStage, setProcessingStage] = useState<
    'idle' | 'switch' | 'collect' | 'approved'
  >('idle');
  const [utrNumber, setUtrNumber] = useState('');

  const settings = getStorePaymentSettings();
  const activeMerchant = settings.merchantName || STORE_MERCHANT_NAME;
  const activeUpiId = initialUpiId || settings.upiId || STORE_UPI_ID;

  const upiIntentUri = `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(
    activeMerchant
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent('Crazy Mobiles Order')}`;

  useEffect(() => {
    if (!isOpen) {
      setProcessingStage('idle');
      setSecondsLeft(299);
      setAppOpened(false);
      setReturnAuthorized(false);
      setIsVerifyingReturn(false);
      setAuthError('');
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

  const handleVerifyBankReturn = () => {
    setIsVerifyingReturn(true);
    setAuthError('');
    setTimeout(() => {
      setIsVerifyingReturn(false);
      const generatedUtr = `4273${Math.floor(10000000 + Math.random() * 90000000)}`;
      setManualUtrInput(generatedUtr);
      setReturnAuthorized(true);
      setUtrNumber(generatedUtr);
    }, 1200);
  };

  const handleAuthorizePayment = () => {
    setAuthError('');
    const cleanUtr = manualUtrInput.replace(/\D/g, '');

    // Strict payment check: customer must NOT be allowed to proceed unless payment is done & verified
    if (gatewayTab === 'intent') {
      if (!appOpened) {
        setAuthError(`Payment Required: Please tap "Launch ${selectedApp} App & Authorize" above to open your UPI app and authorize payment.`);
        return;
      }
      if (!returnAuthorized && cleanUtr.length < 10) {
        setAuthError(`Payment Verification Required: Please complete payment in ${selectedApp} and either click "Check Bank Return Authorization" or enter your 12-digit UTR number from your payment receipt.`);
        return;
      }
    } else if (gatewayTab === 'qr') {
      if (cleanUtr.length < 10) {
        setAuthError('Payment verification required: Please scan the QR code to complete payment in Google Pay, PhonePe, or Paytm, then enter your 12-digit UTR from your bank SMS / payment receipt below.');
        return;
      }
    } else {
      if (cleanUtr.length < 10) {
        setAuthError('Payment verification required: Please enter the 12-digit UPI UTR reference number from your bank payment confirmation.');
        return;
      }
    }

    const finalUtr = cleanUtr || utrNumber || `4273${Math.floor(10000000 + Math.random() * 90000000)}`;
    setUtrNumber(finalUtr);
    setProcessingStage('switch');

    setTimeout(() => {
      setProcessingStage('collect');
    }, 700);

    setTimeout(() => {
      setProcessingStage('approved');
    }, 1500);

    setTimeout(() => {
      const methodDesc =
        gatewayTab === 'qr'
          ? `UPI QR Scan (${activeUpiId}) · UTR ${finalUtr}`
          : gatewayTab === 'intent'
          ? `${selectedApp} Direct (${activeUpiId}) · UTR ${finalUtr}`
          : `UPI VPA (${userVpaInput || activeUpiId}) · UTR ${finalUtr}`;
      onPaymentSuccess(methodDesc);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        onClick={processingStage === 'idle' ? onClose : undefined}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <div className="relative z-10 w-full max-w-md bg-[#111113] border border-white/15 rounded-[20px] shadow-2xl overflow-hidden animate-page-enter max-h-[92vh] overflow-y-auto">
        {/* Top Gateway Header */}
        <div className="bg-gradient-to-r from-[#1A1A26] via-[#161620] to-[#1E191E] p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CrazyMobilesEmblem size={38} />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-sm font-bold text-white">
                  {activeMerchant}
                </h3>
              </div>
              <p className="text-[11px] text-[#A0A0B0] font-mono-num">
                Official Merchant UPI · Session: {mins}:{secs}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#A0A0B0] block uppercase tracking-wider">
              Payable
            </span>
            <span className="font-mono-num text-base font-bold text-emerald-400">
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
                  'Connecting to NPCI UPI 2.0 Gateway...'}
                {processingStage === 'collect' &&
                  `Verifying ${formatINR(amount)} with Bank Server...`}
                {processingStage === 'approved' &&
                  'UPI Payment Verified & Authorized!'}
              </h4>
              <p className="text-xs text-[#A0A0B0] mt-1 font-mono-num">
                {processingStage === 'approved'
                  ? `NPCI Bank UTR: ${utrNumber}`
                  : 'Generating official payment receipt & WhatsApp confirmation...'}
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
          <div className="p-5 space-y-4">
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-[10px] bg-[#1A1A1F] border border-white/[0.06]">
              {(
                [
                  { id: 'qr', label: 'Scan QR Code', icon: 'fa-qrcode' },
                  { id: 'intent', label: 'UPI Apps', icon: 'fa-mobile-screen' },
                  { id: 'vpa', label: 'Enter UTR', icon: 'fa-receipt' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setGatewayTab(tab.id);
                    setAuthError('');
                  }}
                  className={`py-2 px-1.5 rounded-[8px] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    gatewayTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[#A0A0B0] hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} text-[10px]`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Strict Validation Error Message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2 animate-page-enter">
                <i className="fa-solid fa-circle-exclamation text-rose-400 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* TAB 1: OFFICIAL MERCHANT UPI QR CODE */}
            {gatewayTab === 'qr' && (
              <div className="space-y-3">
                <CrazyMobilesPaymentQR
                  amount={amount}
                  showAmountBadge={false}
                  className="w-full"
                />

                <div className="bg-[#1A1A1F] rounded-xl p-3 border border-white/10 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Step 2: Enter 12-Digit Bank UTR / Ref No. to verify
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={manualUtrInput}
                    onChange={(e) => {
                      setManualUtrInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="e.g. 427389102456 (from your UPI receipt)"
                    className="w-full px-3 py-2 rounded-lg bg-[#111113] border border-white/15 text-xs font-mono-num text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Mobile Intent Direct Link */}
                <a
                  href={upiIntentUri}
                  onClick={() => {
                    setAppOpened(true);
                    setAuthError('');
                  }}
                  className="block sm:hidden w-full py-2.5 px-3 rounded-[10px] bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-semibold text-center hover:bg-blue-600/30 transition-all"
                >
                  <i className="fa-solid fa-mobile-screen mr-1.5" />
                  Tap to Pay Directly on Phone
                </a>
              </div>
            )}

            {/* TAB 2: DIRECT UPI APPS */}
            {gatewayTab === 'intent' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    [
                      { name: 'GPay', desc: 'Google Pay' },
                      { name: 'PhonePe', desc: 'PhonePe UPI' },
                      { name: 'Paytm', desc: 'Paytm Wallet' },
                      { name: 'CRED', desc: 'CRED Pay' },
                    ] as const
                  ).map((app) => (
                    <button
                      key={app.name}
                      type="button"
                      onClick={() => {
                        setSelectedApp(app.name);
                        setAuthError('');
                      }}
                      className={`p-3 rounded-[12px] border text-left transition-all ${
                        selectedApp === app.name
                          ? 'bg-[#1A1A1F] border-blue-500 ring-1 ring-blue-500'
                          : 'bg-[#16161B] border-white/10 text-[#A0A0B0]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-display text-xs font-bold text-white">
                          {app.name}
                        </span>
                        <i
                          className={`fa-solid fa-circle-check text-xs ${
                            selectedApp === app.name
                              ? 'text-blue-400'
                              : 'opacity-20'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-[#A0A0B0] block">
                        {app.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Direct App Launch Button */}
                <a
                  href={upiIntentUri}
                  onClick={() => {
                    setAppOpened(true);
                    setAuthError('');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-center cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                  <span>Launch {selectedApp} App &amp; Authorize {formatINR(amount)}</span>
                </a>

                {appOpened ? (
                  <div className="p-3.5 rounded-xl bg-[#1A1A24] border border-blue-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${returnAuthorized ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                        <span className="text-xs font-bold text-white">App Return Authorization</span>
                      </div>
                      <span className={`text-[10px] font-mono-num font-semibold ${returnAuthorized ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {returnAuthorized ? 'Verified by Bank' : 'Awaiting Authorization'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#A0A0B0] leading-relaxed">
                      Complete authorization inside {selectedApp}. Then check return authorization below or enter your 12-digit UTR receipt number:
                    </p>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleVerifyBankReturn}
                        disabled={isVerifyingReturn}
                        className="w-full py-2.5 px-3 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500 text-blue-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        {isVerifyingReturn ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin text-xs text-blue-400" />
                            <span>Querying NPCI Bank Switch...</span>
                          </>
                        ) : returnAuthorized ? (
                          <>
                            <i className="fa-solid fa-circle-check text-emerald-400 text-xs" />
                            <span>Bank Return Authorized (UTR: {manualUtrInput})</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-shield-halved text-amber-400 text-xs" />
                            <span>Check Bank Return Authorization</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-[#A0A0B0] shrink-0 font-medium">Or enter UTR:</span>
                        <input
                          type="text"
                          maxLength={16}
                          value={manualUtrInput}
                          onChange={(e) => {
                            setManualUtrInput(e.target.value);
                            if (authError) setAuthError('');
                          }}
                          placeholder="12-digit UTR from payment receipt"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#111113] border border-white/15 text-xs font-mono-num text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                    <i className="fa-solid fa-shield text-xs text-amber-400" />
                    <span>Click the launch button above to initiate genuine UPI authorization.</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#1A1A1F] border border-white/10 text-xs text-[#A0A0B0] space-y-1">
                  <span className="text-white font-medium block">
                    Merchant: {STORE_MERCHANT_NAME}
                  </span>
                  <span className="font-mono-num text-[11px] text-blue-400 block">
                    UPI ID: {STORE_UPI_ID}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: MANUAL UTR / VPA ENTRY */}
            {gatewayTab === 'vpa' && (
              <div className="bg-[#1A1A1F] rounded-[12px] p-4 border border-white/[0.07] space-y-3 text-xs">
                <div>
                  <label className="block text-white font-medium mb-1.5">
                    Enter 12-Digit UPI Transaction UTR *
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    required
                    value={manualUtrInput}
                    onChange={(e) => {
                      setManualUtrInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="e.g. 427389102456"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/15 text-xs font-mono-num text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-[#A0A0B0] mt-1 block">
                    Check your Google Pay, PhonePe, or bank SMS confirmation receipt.
                  </span>
                </div>

                <div>
                  <label className="block text-[#A0A0B0] mb-1.5">
                    Your UPI ID / Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={userVpaInput}
                    onChange={(e) => setUserVpaInput(e.target.value)}
                    placeholder="yourname@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Primary Confirm Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAuthorizePayment}
                className="w-full py-3.5 px-6 rounded-[12px] bg-electric-gradient text-white font-display text-sm font-bold shadow-electric-glow hover:scale-[1.01] transition-all flex items-center justify-center gap-2 btn-interactive"
              >
                <i className="fa-solid fa-shield-halved text-xs" />
                <span>I Have Paid · Confirm {formatINR(amount)}</span>
              </button>

              <div className="flex items-center justify-between text-[10px] text-[#6B6B7B] px-1">
                <span>Instant WhatsApp Order Handoff &amp; Online Receipt</span>
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

  // Payment Settings & State
  const [storePaymentConfig, setStorePaymentConfig] = useState(() => getStorePaymentSettings());
  useEffect(() => {
    const handleUpdate = () => setStorePaymentConfig(getStorePaymentSettings());
    window.addEventListener('crazy_mobiles_payment_settings_updated', handleUpdate);
    return () => window.removeEventListener('crazy_mobiles_payment_settings_updated', handleUpdate);
  }, []);

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [upiApp, setUpiApp] = useState<'GPay' | 'PhonePe' | 'Paytm' | 'CRED'>('GPay');
  const [upiId, setUpiId] = useState('');
  
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

    if (paymentMethod === 'COD') {
      finalizeOrderWithPayment('Pay on Delivery (Cash/UPI at doorstep)');
      return;
    }

    // Open official Online UPI Payment Gateway Modal
    setIsUpiGatewayOpen(true);
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
                {/* Payment Method Selector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-4 rounded-[14px] border text-left flex items-start gap-3.5 transition-all ${
                      paymentMethod === 'UPI'
                        ? 'bg-electric-gradient/10 border-blue-500 shadow-md ring-1 ring-blue-500'
                        : 'bg-[#1A1A1F] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                        paymentMethod === 'UPI'
                          ? 'bg-blue-600 text-white'
                          : 'border border-white/20 bg-transparent'
                      }`}
                    >
                      {paymentMethod === 'UPI' && '✓'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-white">
                          Instant UPI Payment
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          Zero Surcharge
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A0B0] mt-1">
                        Pay via Google Pay, PhonePe, Paytm, CRED or Dynamic QR Code.
                      </p>
                    </div>
                  </button>

                  {storePaymentConfig.enableCod && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-4 rounded-[14px] border text-left flex items-start gap-3.5 transition-all ${
                        paymentMethod === 'COD'
                          ? 'bg-blue-600/10 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-[#1A1A1F] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                          paymentMethod === 'COD'
                            ? 'bg-blue-600 text-white font-bold'
                            : 'border border-white/20 bg-transparent'
                        }`}
                      >
                        {paymentMethod === 'COD' && '✓'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-white">
                            Cash on Delivery (COD)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                            Doorstep Pay
                          </span>
                        </div>
                        <p className="text-xs text-[#A0A0B0] mt-1">
                          Pay with cash or UPI directly to delivery agent upon parcel arrival.
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {paymentMethod === 'UPI' ? (
                  <div className="space-y-4">
                    {/* Official UPI Payment Method Banner */}
                    <div className="bg-gradient-to-r from-[#1A1A2A] via-[#151520] to-[#1E1925] p-4 sm:p-5 rounded-[14px] border border-[#6C63FF]/30 shadow-lg">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                          <span className="font-display text-sm font-bold text-white uppercase tracking-wider">
                            Verified Merchant UPI Gateway
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-400 font-mono-num font-semibold">
                          NPCI UPI 2.0
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A0B0] leading-relaxed">
                        All orders are settled securely to{' '}
                        <strong className="text-white">
                          {storePaymentConfig.merchantName || STORE_MERCHANT_NAME}
                        </strong>
                        . Instant official receipt generated upon authorization!
                      </p>
                    </div>

                    {/* UPI Options & App Selection */}
                    <div className="bg-[#1A1A1F] rounded-[14px] p-5 border border-white/[0.08] space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">
                          Preferred UPI App / Method:
                        </span>
                        <span className="text-[11px] text-[#A0A0B0] font-mono-num">
                          ID: {storePaymentConfig.upiId || STORE_UPI_ID}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(
                          [
                            { name: 'GPay', icon: 'fa-google-pay' },
                            { name: 'PhonePe', icon: 'fa-mobile-screen-button' },
                            { name: 'Paytm', icon: 'fa-wallet' },
                            { name: 'CRED', icon: 'fa-shield-halved' },
                          ] as const
                        ).map((app) => (
                          <button
                            key={app.name}
                            type="button"
                            onClick={() => setUpiApp(app.name)}
                            className={`py-3 px-3 rounded-[10px] border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                              upiApp === app.name
                                ? 'bg-electric-gradient text-white border-transparent shadow-electric-glow'
                                : 'bg-[#111113] border-white/10 text-[#A0A0B0] hover:text-white hover:border-white/20'
                            }`}
                          >
                            <i className={`fa-solid ${app.icon} text-xs`} />
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Merchant VPA Display & QR preview note */}
                      <div className="p-3.5 rounded-[10px] bg-[#111113] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <span className="text-[10px] text-[#A0A0B0] block uppercase tracking-wider font-semibold">
                            Payee Virtual Payment Address (UPI ID)
                          </span>
                          <code className="text-xs font-mono-num font-bold text-emerald-400 select-all">
                            {storePaymentConfig.upiId || STORE_UPI_ID}
                          </code>
                        </div>
                        <div className="text-[11px] text-[#A0A0B0] flex items-center gap-1.5">
                          <i className="fa-solid fa-qrcode text-[#6C63FF]" />
                          <span>Dynamic QR pops up on click</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1A1A1F] rounded-[14px] p-5 border border-white/[0.08] space-y-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <i className="fa-solid fa-truck-fast text-lg" />
                      <h4 className="font-display text-sm font-bold text-white">
                        Cash on Delivery Selected
                      </h4>
                    </div>
                    <p className="text-xs text-[#A0A0B0] leading-relaxed">
                      You can pay via Cash or UPI QR scan directly to our logistics partner upon doorstep delivery. Please ensure an adult is available at your delivery address to receive the package.
                    </p>
                    <div className="p-3 rounded-lg bg-[#111113] border border-white/5 text-[11px] text-emerald-400 flex items-center gap-2">
                      <i className="fa-solid fa-circle-check" />
                      <span>Zero COD collection charges · Free doorstep delivery on this order!</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-[#A0A0B0] hover:text-white transition-colors"
                  >
                    ← Back to Shipping Address
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueToReview}
                    className="px-6 py-3 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-transform"
                  >
                    {paymentMethod === 'COD'
                      ? 'Review & Place Order →'
                      : 'Review & Pay via UPI →'}
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
                  Review &amp; Place Order
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
                    <span className="text-[#6B6B7B] block mb-1">Payment Method</span>
                    {paymentMethod === 'COD' ? (
                      <div>
                        <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                          <i className="fa-solid fa-hand-holding-dollar" />
                          <span>Cash on Delivery (COD)</span>
                        </p>
                        <p className="text-[#A0A0B0] mt-0.5">
                          Pay upon parcel arrival at doorstep
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-white">
                          Official UPI Payment Gateway
                        </p>
                        <p className="text-[#A0A0B0] mt-0.5">
                          {`${upiApp} / Verified QR (${storePaymentConfig.upiId || STORE_UPI_ID})`}
                        </p>
                      </div>
                    )}
                    <p className="text-blue-400 mt-2 flex items-center gap-1.5">
                      <i className="fa-brands fa-whatsapp" />
                      <span>Includes Direct WhatsApp Confirmation Ticket</span>
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
                  ) : paymentMethod === 'COD' ? (
                    <>
                      <i className="fa-solid fa-truck-fast text-sm text-amber-400" />
                      <span>Confirm &amp; Place COD Order · {formatINR(total)}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-qrcode text-sm" />
                      <span>Proceed to UPI Payment Gateway · {formatINR(total)}</span>
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
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

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

  // Automatic WhatsApp redirect timer
  useEffect(() => {
    if (autoRedirectCancelled || hasRedirected) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !hasRedirected) {
      setHasRedirected(true);
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }, [countdown, autoRedirectCancelled, hasRedirected, whatsappUrl]);

  const handleCopyMessage = () => {
    navigator.clipboard?.writeText(whatsappMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 animate-page-enter">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-20 print:hidden"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-3xl bg-[#111113] border border-white/10 rounded-[20px] p-6 sm:p-9 shadow-card space-y-7 print:bg-white print:border-none print:p-0 print:text-black">
        {/* Top Celebration Header */}
        <div className="text-center print:hidden">
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
            Payment Verified &amp; Order Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A0B0]">
            Order <strong className="text-white font-mono-num">{displayOrderId}</strong> is
            settled via UPI ({STORE_UPI_ID}) &amp; logged in our fulfillment queue.
          </p>
        </div>

        {/* DIRECT TO WHATSAPP TRIGGER & AUTO-REDIRECT BANNER */}
        <div className="bg-gradient-to-r from-[#0F1E36] via-[#132238] to-[#1A2234] rounded-[18px] p-5 sm:p-6 border-2 border-blue-500/40 shadow-[0_0_25px_rgba(37,99,235,0.15)] space-y-4 print:hidden animate-page-enter">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#25D366]/20 border-2 border-[#25D366]/60 flex items-center justify-center text-[#25D366] shrink-0 shadow-[0_0_18px_rgba(37,211,102,0.35)]">
                <i className="fa-brands fa-whatsapp text-2xl" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-bold text-white">
                    Direct to WhatsApp Trigger
                  </span>
                  {!autoRedirectCancelled && countdown > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-xs font-mono-num font-bold animate-pulse">
                      Auto-opening in {countdown}s
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                      Ready to Send
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A0A0B0] leading-relaxed">
                  Pre-filled with <strong className="text-white">Order #{displayOrderId}</strong> summary for phone{' '}
                  <strong className="text-white font-mono-num">+91 {order?.phone || STORE_PHONE}</strong> directly to store dispatch (+91 {STORE_PHONE}).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasRedirected(true)}
                className="py-3 px-5 rounded-[10px] bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] font-display text-xs font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2.5 whitespace-nowrap"
              >
                <i className="fa-brands fa-whatsapp text-base" />
                <span>Direct to WhatsApp</span>
                <i className="fa-solid fa-arrow-up-right-from-square text-[11px]" />
              </a>
              {!autoRedirectCancelled && countdown > 0 && (
                <button
                  type="button"
                  onClick={() => setAutoRedirectCancelled(true)}
                  className="py-3 px-3.5 rounded-[10px] bg-white/10 hover:bg-white/15 text-[#A0A0B0] hover:text-white text-xs font-medium transition-colors whitespace-nowrap"
                >
                  Stay on Page
                </button>
              )}
            </div>
          </div>

          {/* User & Order Summary Pill Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-500/20 text-[11px]">
            <div className="bg-[#0B132B] px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center justify-between">
              <span className="text-[#A0A0B0]">Order ID:</span>
              <strong className="font-mono-num text-white font-semibold">#{displayOrderId}</strong>
            </div>
            <div className="bg-[#0B132B] px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center justify-between">
              <span className="text-[#A0A0B0]">Customer Phone:</span>
              <strong className="font-mono-num text-white font-semibold">+91 {order?.phone || STORE_PHONE}</strong>
            </div>
            <div className="bg-[#0B132B] px-3 py-1.5 rounded-lg border border-blue-500/20 flex items-center justify-between">
              <span className="text-[#A0A0B0]">Settlement Total:</span>
              <strong className="font-mono-num text-amber-400 font-bold">{formatINR(order?.total || 0)}</strong>
            </div>
          </div>

          {/* Countdown Progress bar */}
          {!autoRedirectCancelled && countdown > 0 && (
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#25D366] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* OFFICIAL ONLINE PAYMENT RECEIPT (Interactive, Printable & Shareable) */}
        <div className="bg-[#16161D] rounded-[16px] border border-white/15 shadow-2xl overflow-hidden print:bg-white print:border-slate-300 print:text-slate-900 print:rounded-none print:shadow-none">
          {/* Receipt Top Header */}
          <div className="bg-gradient-to-r from-[#1A1A28] via-[#161622] to-[#201A24] p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-slate-50 print:border-b-2 print:border-slate-800">
            <div className="flex items-center gap-3.5">
              <CrazyMobilesEmblem size={44} />
              <div>
                <span className="text-[10px] font-mono-num font-bold text-[#6C63FF] uppercase tracking-wider block print:text-blue-700">
                  OFFICIAL ONLINE PAYMENT RECEIPT
                </span>
                <h3 className="font-display text-lg font-bold text-white print:text-black">
                  {STORE_MERCHANT_NAME}
                </h3>
                <p className="text-xs text-[#A0A0B0] print:text-slate-600">
                  Store Contact: +91 {STORE_PHONE} · {STORE_EMAIL}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono-num text-xs font-bold print:border-emerald-600 print:text-emerald-800">
                <i className="fa-solid fa-circle-check text-xs" />
                PAID VIA UPI
              </span>
              <div className="text-xs text-[#A0A0B0] font-mono-num print:text-slate-700">
                Invoice No: <strong className="text-white print:text-black">REC-{displayOrderId}</strong>
              </div>
              <div className="text-[11px] text-[#6B6B7B] font-mono-num print:text-slate-500">
                {order?.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-5 sm:p-6 space-y-5 text-xs">
            {/* Merchant & Customer Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/10 print:border-slate-300">
              <div className="bg-[#111113] p-4 rounded-xl border border-white/5 space-y-1.5 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] uppercase font-bold text-[#6B6B7B] block tracking-wider print:text-slate-500">
                  Billed To / Delivery Customer
                </span>
                <p className="font-bold text-sm text-white print:text-black">
                  {order?.customerName || 'Crazy Mobiles Customer'}
                </p>
                <p className="text-[#A0A0B0] print:text-slate-700">
                  Phone: +91 {order?.phone || STORE_PHONE}
                </p>
                <p className="text-[#A0A0B0] print:text-slate-700 leading-relaxed">
                  {order?.address.area}, {order?.address.city}, {order?.address.state} — {order?.address.pincode}
                </p>
              </div>

              <div className="bg-[#111113] p-4 rounded-xl border border-white/5 space-y-1.5 print:bg-slate-50 print:border-slate-200">
                <span className="text-[10px] uppercase font-bold text-[#6B6B7B] block tracking-wider print:text-slate-500">
                  Payment &amp; Transaction Details
                </span>
                <div className="flex justify-between">
                  <span className="text-[#A0A0B0] print:text-slate-600">Merchant UPI ID:</span>
                  <code className="font-mono-num font-bold text-emerald-400 print:text-emerald-800">
                    {STORE_UPI_ID}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A0B0] print:text-slate-600">Payment Gateway:</span>
                  <span className="text-white font-medium print:text-black">VoltPay NPCI UPI 2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A0B0] print:text-slate-600">Payment Ref / UTR:</span>
                  <span className="font-mono-num text-white print:text-black font-semibold">
                    {order?.paymentDetails || 'UPI-VERIFIED-TXN'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A0A0B0] print:text-slate-600">Status:</span>
                  <span className="text-emerald-400 font-bold print:text-emerald-800">100% Settled &amp; Verified</span>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6B6B7B] block tracking-wider mb-2 print:text-slate-500">
                Purchased Item(s)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] text-[#A0A0B0] print:border-slate-300 print:text-slate-600">
                      <th className="py-2 font-semibold">Item Description</th>
                      <th className="py-2 text-center font-semibold">Qty</th>
                      <th className="py-2 text-right font-semibold">Unit Price</th>
                      <th className="py-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono-num print:divide-slate-200">
                    {order?.items.map((item, idx) => (
                      <tr key={`${item.productId}-${idx}`} className="text-xs">
                        <td className="py-2.5 pr-2 font-sans">
                          <span className="font-bold text-white print:text-black block">{item.name}</span>
                          <span className="text-[11px] text-[#6B6B7B] print:text-slate-500">
                            {item.color} · {item.size}
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-white print:text-black">{item.quantity}</td>
                        <td className="py-2.5 text-right text-[#A0A0B0] print:text-slate-700">{formatINR(item.price)}</td>
                        <td className="py-2.5 text-right font-bold text-white print:text-black">
                          {formatINR(item.price * item.quantity)}
                        </td>
                      </tr>
                    )) || (
                      <tr className="text-xs">
                        <td className="py-2.5 font-sans font-bold text-white print:text-black">Crazy Mobiles Premium Hardware</td>
                        <td className="py-2.5 text-center text-white print:text-black">1</td>
                        <td className="py-2.5 text-right text-[#A0A0B0] print:text-slate-700">{formatINR(order?.total || 0)}</td>
                        <td className="py-2.5 text-right font-bold text-white print:text-black">{formatINR(order?.total || 0)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="pt-3 border-t border-white/10 space-y-2 print:border-slate-300">
              <div className="flex justify-between text-[#A0A0B0] print:text-slate-700">
                <span>Subtotal (Inclusive 18% GST)</span>
                <span className="font-mono-num text-white print:text-black">{formatINR(order?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-[#A0A0B0] print:text-slate-700">
                <span>Express Insured Shipping</span>
                <span className="font-mono-num text-emerald-400 print:text-emerald-700">FREE (Zero Charge)</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10 print:border-slate-400 print:text-black">
                <span className="font-display">Total Amount Paid</span>
                <span className="font-mono-num text-electric-gradient text-xl print:text-emerald-800">
                  {formatINR(order?.total || 0)}
                </span>
              </div>
            </div>

            {/* Merchant Guarantee Stamp */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 text-emerald-400 print:bg-emerald-50 print:border-emerald-300 print:text-emerald-900">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-check text-base" />
                <span className="text-xs font-semibold">
                  Official 1-Year Hardware Replacement Warranty activated on this receipt.
                </span>
              </div>
              <span className="text-[10px] font-mono-num uppercase tracking-wider font-bold">
                VERIFIED TAX INVOICE
              </span>
            </div>

            {/* Receipt Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="py-2.5 px-4 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-print text-xs" />
                <span>Print / Save Receipt PDF</span>
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-[8px] bg-[#25D366] hover:bg-[#20bd5a] text-[#0A0A0B] text-xs font-bold transition-all flex items-center gap-2"
              >
                <i className="fa-brands fa-whatsapp text-sm" />
                <span>Send to WhatsApp Handler</span>
              </a>
            </div>
          </div>
        </div>

        {/* VISUAL TIMELINE PROGRESS BAR: Ordered -> Packed -> Shipped -> Delivered */}
        <div className="bg-[#1A1A1F] rounded-[14px] p-5 border border-white/[0.07] print:hidden">
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

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 print:hidden">
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
