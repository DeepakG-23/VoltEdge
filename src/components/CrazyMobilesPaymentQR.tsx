import React, { useState } from 'react';
import {
  STORE_MERCHANT_NAME,
  STORE_UPI_ID,
  formatINR,
} from '../data/seedData';

interface CrazyMobilesPaymentQRProps {
  amount?: number;
  orderId?: string;
  className?: string;
  showAmountBadge?: boolean;
  onCopySuccess?: () => void;
}

export const CrazyMobilesPaymentQR: React.FC<CrazyMobilesPaymentQRProps> = ({
  amount,
  orderId,
  className = '',
  showAmountBadge = true,
  onCopySuccess,
}) => {
  const [copied, setCopied] = useState(false);

  // Construct official NPCI UPI Intent URI
  const upiIntentUri = `upi://pay?pa=${STORE_UPI_ID}&pn=${encodeURIComponent(
    STORE_MERCHANT_NAME
  )}${amount ? `&am=${amount}` : ''}&cu=INR&tn=${encodeURIComponent(
    orderId ? `Order ${orderId} - Crazy Mobiles` : 'Crazy Mobile Shop Payment'
  )}`;

  // High-resolution API QR Code with exact matching deep blue (#0044B5) color
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=0044b5&bgcolor=ffffff&margin=8&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(STORE_UPI_ID);
    setCopied(true);
    if (onCopySuccess) onCopySuccess();
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      className={`bg-white text-slate-900 rounded-[20px] p-5 sm:p-6 shadow-2xl border-2 border-blue-500/20 max-w-sm mx-auto text-center relative overflow-hidden ${className}`}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-left">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-900">
            Instant UPI Payment
          </span>
        </div>
        {showAmountBadge && amount && (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono-num font-bold text-xs">
            {formatINR(amount)}
          </span>
        )}
      </div>

      {/* QR Code Container styled exactly like user image */}
      <div className="relative mx-auto my-2 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-inner flex items-center justify-center">
        <img
          src={qrCodeUrl}
          alt={`UPI Payment QR Code for ${STORE_MERCHANT_NAME}`}
          className="w-56 h-56 sm:w-60 sm:h-60 object-contain rounded-xl"
          loading="eager"
        />
      </div>

      {/* Merchant Title & UPI ID matching uploaded image */}
      <div className="mt-3 space-y-1.5">
        <h4 className="font-display font-bold text-[13px] sm:text-sm text-[#003399] tracking-tight leading-snug uppercase">
          {STORE_MERCHANT_NAME}
        </h4>
        <div className="flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5">
          <span className="text-[11px] font-medium text-slate-500">UPI ID:</span>
          <code className="text-xs sm:text-[13px] font-mono-num font-bold text-slate-900 break-all select-all">
            {STORE_UPI_ID}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy UPI ID"
            className="ml-1 text-blue-600 hover:text-blue-800 p-1 text-xs shrink-0 transition-transform active:scale-95"
            aria-label="Copy UPI ID"
          >
            {copied ? (
              <span className="text-emerald-600 font-bold text-[11px]">Copied!</span>
            ) : (
              <i className="fa-regular fa-copy" />
            )}
          </button>
        </div>
      </div>

      {/* Supported Apps Row */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
        <span>Google Pay</span>
        <span>•</span>
        <span>PhonePe</span>
        <span>•</span>
        <span>Paytm</span>
        <span>•</span>
        <span>BHIM</span>
        <span>•</span>
        <span>CRED</span>
      </div>
    </div>
  );
};
