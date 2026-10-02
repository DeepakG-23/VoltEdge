import React, { useEffect, useState } from 'react';
import {
  CartItem,
  HERO_ECOSYSTEM_IMAGE,
  INDIAN_STATES,
  Order,
  STORE_EMAIL,
  STORE_MAPS_URL,
  STORE_NAME,
  STORE_PHONE,
  STORE_PHONE_DISPLAY,
  formatINR,
} from '../data/seedData';
import { User } from '../firebase';
import { CrazyMobilesLogo } from './CrazyMobilesLogo';
import { ResilientImage } from './ResilientImage';

export interface SavedAddressItem {
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

export interface CustomerProfileData {
  fullName: string;
  email: string;
  phone: string;
  smsAlerts: boolean;
  isPhoneVerified: boolean;
  addresses: SavedAddressItem[];
}

export const INITIAL_SAVED_ADDRESSES: SavedAddressItem[] = [
  {
    id: 'addr-1',
    label: 'Home',
    fullName: 'Shaikh Shoeb',
    phone: STORE_PHONE,
    pincode: '560034',
    area: '402, Palm Grove Indiranagar, 100 Feet Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Office',
    fullName: 'Shaikh Shoeb',
    phone: STORE_PHONE,
    pincode: '560103',
    area: 'Level 6, Prestige Tech Park, Outer Ring Road, Bellandur',
    city: 'Bengaluru',
    state: 'Karnataka',
    isDefault: false,
  },
];

/* ==========================================================================
   UNIFIED STORE OWNER (ADMIN) & CONSUMER LOGIN PORTAL (#/login)
   ========================================================================== */
interface LoginOtpViewProps {
  currentUser: User | null;
  profile: CustomerProfileData;
  isAdminAuthenticated?: boolean;
  onAdminLoginSuccess?: () => void;
  onCustomerLoginSuccess?: (loginId: string, displayName?: string) => void;
  onPhoneVerifiedSuccess?: (phone: string, name?: string) => void;
  onGoogleSignIn: () => void;
  onNavigateAccount: () => void;
  onNavigateAdmin?: () => void;
  showToast: (msg: string) => void;
}

export const LoginOtpView: React.FC<LoginOtpViewProps> = ({
  currentUser,
  profile,
  isAdminAuthenticated = false,
  onAdminLoginSuccess,
  onCustomerLoginSuccess,
  onGoogleSignIn,
  onNavigateAccount,
  onNavigateAdmin,
  showToast,
}) => {
  // Unified Login ID & Password State (Used for both Consumer & Store Owner)
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Unified Login Handler (Detects Special Store Owner Credentials vs. Consumer Credentials)
  const handleUnifiedLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = loginId.trim();
    const trimmedLower = trimmedId.toLowerCase();

    if (!trimmedId) {
      setErrorMsg('Please enter your Login ID or Email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    setIsLoggingIn(true);

    setTimeout(() => {
      setIsLoggingIn(false);

      // Check Special Store Owner / Admin Credentials (Login ID: "Shoeb", Password: "admin")
      const isOwnerLogin =
        (trimmedId === 'Shoeb' || trimmedLower === 'shoeb') &&
        password === 'admin';

      if (isOwnerLogin) {
        sessionStorage.setItem('voltedge_admin_auth', 'true');
        if (onAdminLoginSuccess) {
          onAdminLoginSuccess();
        } else if (onNavigateAdmin) {
          onNavigateAdmin();
        }
        return;
      }

      // Prevent unauthorized attempts when someone enters admin/owner ID with wrong password
      if (trimmedId === 'Shoeb' || trimmedLower === 'shoeb') {
        setErrorMsg(
          'Invalid Store Owner password. Only the authorized owner can access the Admin Console.'
        );
        return;
      }

      // Consumer Login Validation
      if (password.length < 4) {
        setErrorMsg('Password must be at least 4 characters.');
        return;
      }

      const derivedName = trimmedId.includes('@')
        ? trimmedId
            .split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : trimmedId;

      if (onCustomerLoginSuccess) {
        onCustomerLoginSuccess(trimmedId, derivedName);
      } else {
        showToast(`Welcome back, ${derivedName}!`);
        onNavigateAccount();
      }
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-page-enter">
      {/* Full-Width Split-Screen Flagship Authentication Portal */}
      <div className="w-full max-w-[1160px] bg-[#111113] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* LEFT COLUMN (6 Cols): Brand Ecosystem Showcase & Identity Architecture */}
        <div className="lg:col-span-6 relative bg-[#16161D] p-8 sm:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
          {/* Studio Hardware Background with Layered Gradient */}
          <div className="absolute inset-0 pointer-events-none">
            <ResilientImage
              src={HERO_ECOSYSTEM_IMAGE}
              alt={`${STORE_NAME} Flagship Hardware Ecosystem`}
              className="w-full h-full opacity-30"
              imgClassName="object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0B]/90 via-[#111113]/85 to-[#1A1A26]/95" />
            <div
              className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(108,99,255,0.55) 0%, rgba(255,107,53,0.2) 60%, transparent 80%)',
              }}
            />
          </div>

          {/* Top Brand Identity */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2.5">
              <CrazyMobilesLogo variant="horizontal" size="md" />
            </div>

            <div className="space-y-3 pt-2">
              <h2
                className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                One Gateway for Members &amp; Store Operations.
              </h2>
              <p className="text-sm text-[#A0A0B0] leading-relaxed max-w-md">
                Sign in with your Login ID and password or continue with your
                Google account. Your phone number and delivery address are
                collected seamlessly during checkout.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-3.5 pt-3">
              {[
                {
                  icon: 'fa-truck-fast',
                  title: 'Seamless Checkout Address & Phone Capture',
                  desc: 'Enter your mobile number and delivery address directly while ordering.',
                },
                {
                  icon: 'fa-shield-halved',
                  title: '1-Year Automated Warranty Vault',
                  desc: 'Every MagSafe, GaN, and ANC serial number registered to your account.',
                },
                {
                  icon: 'fa-lock',
                  title: 'Role-Based Store Owner Protection',
                  desc: 'Authorized owner credentials automatically unlock the Admin Console.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#0A0A0B]/60 border border-white/[0.07] backdrop-blur-md"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#1A1A1F] border border-white/10 flex items-center justify-center text-[#6C63FF] shrink-0 mt-0.5">
                    <i className={`fa-solid ${item.icon} text-xs`} />
                  </div>
                  <div>
                    <h3 className="font-display text-xs font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#A0A0B0] mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-xs text-[#A0A0B0]">
            <span>256-Bit Encrypted Authentication</span>
            {isAdminAuthenticated && onNavigateAdmin && (
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <span>Open Admin Console</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (6 Cols): Unified Login Form (Login ID + Password + Continue with Google Account) */}
        <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-center bg-[#111113]">
          <div className="max-w-md mx-auto w-full space-y-7">
            {/* Top Header */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#FF6B35]">
                  {STORE_NAME} Account Authentication
                </span>
                {currentUser && (
                  <button
                    type="button"
                    onClick={onNavigateAccount}
                    className="text-xs text-[#6C63FF] hover:underline font-medium"
                  >
                    Go to Account →
                  </button>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Sign In to Your Account
              </h1>
              <p className="text-xs sm:text-sm text-[#A0A0B0]">
                Enter your Login ID and password below, or continue with your
                Google account.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2.5">
                <i className="fa-solid fa-circle-exclamation shrink-0 text-sm" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* UNIFIED LOGIN ID & PASSWORD FORM */}
            <form onSubmit={handleUnifiedLoginSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="unified-login-id"
                  className="block text-xs font-medium text-[#A0A0B0] mb-2"
                >
                  Login ID
                </label>
                <div className="relative">
                  <i className="fa-regular fa-user absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B7B] text-xs" />
                  <input
                    id="unified-login-id"
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter your Login ID or Email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#1A1A1F] border border-white/10 text-sm text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="unified-password"
                  className="block text-xs font-medium text-[#A0A0B0] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B7B] text-xs" />
                  <input
                    id="unified-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#1A1A1F] border border-white/10 text-sm text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A0A0B0] hover:text-white p-1"
                  >
                    <i
                      className={`fa-regular ${
                        showPassword ? 'fa-eye-slash' : 'fa-eye'
                      } text-xs`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#A0A0B0]">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#6C63FF]"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-4 px-6 rounded-xl bg-electric-gradient text-white font-display text-sm font-bold shadow-electric-glow hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 btn-interactive"
              >
                {isLoggingIn ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <i className="fa-solid fa-arrow-right text-xs" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative py-2 flex items-center justify-center">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#111113] px-4 text-[11px] text-[#6B6B7B] uppercase tracking-wider shrink-0">
                  Or
                </span>
                <div className="border-t border-white/10 w-full" />
              </div>

              {/* Continue with Google Account Button */}
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="w-full py-3.5 px-6 rounded-xl bg-[#1A1A1F] hover:bg-[#23232C] border border-white/15 text-white font-display text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all"
              >
                <i className="fa-brands fa-google text-base text-[#FF6B35]" />
                <span>Continue with Google Account</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   CUSTOMER ACCOUNT SETTINGS VIEW (#/account)
   ========================================================================== */
interface AccountSettingsViewProps {
  currentUser: User | null;
  profile: CustomerProfileData;
  orders: Order[];
  onSaveProfile: (updated: CustomerProfileData) => void;
  onTrackOrder: (orderId: string) => void;
  onReorderItems: (items: CartItem[]) => void;
  onNavigateLogin: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  showToast: (msg: string) => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  currentUser,
  profile,
  orders,
  onSaveProfile,
  onTrackOrder,
  onReorderItems,
  onNavigateLogin,
  onGoogleSignIn,
  onGoogleSignOut,
  showToast,
}) => {
  const [activeSection, setActiveSection] = useState<
    'profile' | 'orders' | 'addresses'
  >('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [smsAlerts, setSmsAlerts] = useState(profile.smsAlerts);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddressItem | null>(
    null
  );
  const [addrLabel, setAddrLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [addrName, setAddrName] = useState(profile.fullName);
  const [addrPhone, setAddrPhone] = useState(profile.phone);
  const [addrPincode, setAddrPincode] = useState('');
  const [addrArea, setAddrArea] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('Karnataka');
  const [addrDefault, setAddrDefault] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setSmsAlerts(profile.smsAlerts);
  }, [profile]);

  const handleProfileFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      fullName: fullName.trim() || `${STORE_NAME} Member`,
      email: email.trim() || STORE_EMAIL,
      phone: phone.replace(/\D/g, '').slice(0, 10) || STORE_PHONE,
      smsAlerts,
    });
    showToast('Profile settings saved');
  };

  const openNewAddressModal = () => {
    setEditingAddress(null);
    setAddrLabel('Home');
    setAddrName(profile.fullName);
    setAddrPhone(profile.phone);
    setAddrPincode('');
    setAddrArea('');
    setAddrCity('');
    setAddrState('Karnataka');
    setAddrDefault(profile.addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: SavedAddressItem) => {
    setEditingAddress(addr);
    setAddrLabel(addr.label);
    setAddrName(addr.fullName);
    setAddrPhone(addr.phone);
    setAddrPincode(addr.pincode);
    setAddrArea(addr.area);
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrDefault(addr.isDefault);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddr: SavedAddressItem = {
      id: editingAddress ? editingAddress.id : `addr-${Date.now()}`,
      label: addrLabel,
      fullName: addrName.trim() || profile.fullName,
      phone: addrPhone.replace(/\D/g, '').slice(0, 10) || profile.phone,
      pincode: addrPincode.replace(/\D/g, '').slice(0, 6) || '560034',
      area: addrArea.trim(),
      city: addrCity.trim(),
      state: addrState,
      isDefault: addrDefault,
    };

    let nextAddresses = editingAddress
      ? profile.addresses.map((a) => (a.id === editingAddress.id ? newAddr : a))
      : [...profile.addresses, newAddr];

    if (newAddr.isDefault) {
      nextAddresses = nextAddresses.map((a) => ({
        ...a,
        isDefault: a.id === newAddr.id,
      }));
    }

    onSaveProfile({
      ...profile,
      addresses: nextAddresses,
    });
    setIsAddressModalOpen(false);
    showToast(editingAddress ? 'Address updated' : 'New address added to address book');
  };

  const handleSetDefaultAddress = (id: string) => {
    const nextAddresses = profile.addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    onSaveProfile({ ...profile, addresses: nextAddresses });
    showToast('Default shipping address updated');
  };

  const handleDeleteAddress = (id: string) => {
    const nextAddresses = profile.addresses.filter((a) => a.id !== id);
    onSaveProfile({ ...profile, addresses: nextAddresses });
    showToast('Address removed from address book');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-page-enter">
      {/* Top Account Banner */}
      <div className="bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.08] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-electric-gradient flex items-center justify-center text-white font-display text-xl font-bold shadow-electric-glow shrink-0">
            {(profile.fullName || 'V').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white">
                {profile.fullName}
              </h1>
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                · <i className="fa-solid fa-circle-check text-[10px]" /> Active Member
              </span>
            </div>
            <p className="text-xs text-[#A0A0B0] mt-0.5 font-mono-num">
              +91 {profile.phone} · {currentUser?.email || profile.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="px-4 py-2.5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#23232C] border border-white/15 text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <i className="fa-regular fa-user text-xs text-[#FF6B35]" />
            <span>Switch Account / Login</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={onGoogleSignOut}
              className="px-4 py-2.5 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="px-4 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow flex items-center gap-2 whitespace-nowrap"
            >
              <i className="fa-brands fa-google text-xs" />
              <span>Sync with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Layout Grid: Left Navigation Tabs (3 cols) + Right Content (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Section Selector */}
        <div className="lg:col-span-3 bg-[#111113] rounded-[16px] p-3 border border-white/[0.08] flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              {
                id: 'profile',
                label: 'Profile Information',
                icon: 'fa-user-gear',
                count: null,
              },
              {
                id: 'orders',
                label: 'Order History',
                icon: 'fa-box-open',
                count: orders.length,
              },
              {
                id: 'addresses',
                label: 'Saved Addresses',
                icon: 'fa-location-dot',
                count: profile.addresses.length,
              },
            ] as const
          ).map((tab) => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-electric-gradient text-white shadow-electric-glow'
                    : 'text-[#A0A0B0] hover:text-white hover:bg-[#1A1A1F]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <i className={`fa-solid ${tab.icon} w-4 text-center`} />
                  <span>{tab.label}</span>
                </span>
                {tab.count !== null && (
                  <span className="font-mono-num text-[11px] opacity-85">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Section Viewport */}
        <div className="lg:col-span-9">
          {/* 1. PROFILE INFORMATION SECTION */}
          {activeSection === 'profile' && (
            <form
              onSubmit={handleProfileFormSubmit}
              className="bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.08] space-y-6 animate-page-enter"
            >
              <div className="border-b border-white/[0.07] pb-4">
                <h2 className="font-display text-xl font-bold text-white">
                  Basic Profile Information
                </h2>
                <p className="text-xs text-[#A0A0B0] mt-1">
                  Manage your personal details and SMS notification preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-[#A0A0B0] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A0A0B0] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A0A0B0] mb-1.5">
                    Mobile Number (+91)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    className="w-full px-4 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#A0A0B0] mb-1.5">
                    Cloud Sync Status
                  </label>
                  <div className="px-4 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-[#A0A0B0] flex items-center justify-between">
                    <span>
                      {currentUser
                        ? 'Synced with Firebase Cloud'
                        : 'Saved Locally (Sign in for Cloud Sync)'}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        currentUser ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-[12px] bg-[#1A1A1F] border border-white/[0.06] flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    SMS &amp; WhatsApp Dispatch Updates
                  </span>
                  <span className="text-[11px] text-[#A0A0B0]">
                    Receive real-time waybill tracking and delivery OTP alerts on +91{' '}
                    {phone}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#6C63FF]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-[8px] bg-electric-gradient text-white font-display text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-all btn-interactive"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* 2. ORDER HISTORY LIST SECTION */}
          {activeSection === 'orders' && (
            <div className="space-y-4 animate-page-enter">
              <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.08] flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Order History
                  </h2>
                  <p className="text-xs text-[#A0A0B0] mt-0.5">
                    Track active shipments, download invoices, or reorder past hardware.
                  </p>
                </div>
                <span className="text-xs font-mono-num text-[#A0A0B0]">
                  {orders.length} orders
                </span>
              </div>

              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.08] space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-[#6B6B7B] block">Order ID</span>
                        <span className="font-mono-num font-bold text-white">
                          {ord.id}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6B7B] block">Placed On</span>
                        <span className="font-mono-num text-[#A0A0B0]">
                          {ord.date}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6B7B] block">Total</span>
                        <span className="font-mono-num font-bold text-electric-gradient">
                          {formatINR(ord.total)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#6B6B7B] block">Status</span>
                        <span className="text-emerald-400 font-medium">
                          {ord.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onTrackOrder(ord.id)}
                        className="px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] hover:bg-[#24242E] border border-white/15 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                      >
                        Track Shipment
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderItems(ord.items)}
                        className="px-3.5 py-2 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow whitespace-nowrap"
                      >
                        Reorder
                      </button>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ord.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-[#1A1A1F] p-3 rounded-[10px] border border-white/[0.05]"
                      >
                        <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-[#111113] shrink-0">
                          <ResilientImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-[#6B6B7B] truncate">
                            {item.color} · {item.size} × {item.quantity}
                          </div>
                        </div>
                        <span className="font-mono-num text-xs font-semibold text-white shrink-0">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. SAVED ADDRESSES BOOK SECTION */}
          {activeSection === 'addresses' && (
            <div className="space-y-6 animate-page-enter">
              <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">
                    Saved Addresses Book
                  </h2>
                  <p className="text-xs text-[#A0A0B0] mt-0.5">
                    Manage your Indian delivery addresses for one-click express checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewAddressModal}
                  className="px-4 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow flex items-center gap-2 self-start sm:self-auto whitespace-nowrap"
                >
                  <i className="fa-solid fa-plus text-[10px]" />
                  <span>Add New Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {profile.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-[#111113] rounded-[16px] p-6 border transition-all flex flex-col justify-between ${
                      addr.isDefault
                        ? 'border-[#6C63FF]/60 shadow-electric-subtle'
                        : 'border-white/[0.08]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-display font-bold text-white uppercase tracking-wider">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-emerald-400">· Default Address</span>
                          )}
                        </div>
                        <span className="font-mono-num text-xs text-[#A0A0B0]">
                          {addr.pincode}
                        </span>
                      </div>

                      <h3 className="font-display text-sm font-semibold text-white">
                        {addr.fullName}
                      </h3>
                      <p className="text-xs text-[#A0A0B0] mt-1 leading-relaxed">
                        {addr.area}
                      </p>
                      <p className="text-xs text-[#A0A0B0]">
                        {addr.city}, {addr.state} —{' '}
                        <span className="font-mono-num text-white">{addr.pincode}</span>
                      </p>
                      <p className="text-xs font-mono-num text-[#6B6B7B] mt-2">
                        Phone: +91 {addr.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-white/[0.06] text-xs">
                      <button
                        type="button"
                        onClick={() => openEditAddressModal(addr)}
                        className="text-white hover:text-[#6C63FF] font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <span className="text-[#6B6B7B]">·</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-[#A0A0B0] hover:text-rose-400 transition-colors"
                      >
                        Remove
                      </button>
                      {!addr.isDefault && (
                        <>
                          <span className="text-[#6B6B7B]">·</span>
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[#6C63FF] hover:underline ml-auto"
                          >
                            Set as Default
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsAddressModalOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <form
            onSubmit={handleSaveAddress}
            className="relative z-10 w-full max-w-lg bg-[#111113] border border-white/15 rounded-[16px] p-6 shadow-2xl space-y-4 animate-page-enter"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="font-display text-base font-bold text-white">
                {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-[#A0A0B0] hover:text-white"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setAddrLabel(lbl)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    addrLabel === lbl
                      ? 'bg-electric-gradient text-white'
                      : 'bg-[#1A1A1F] text-[#A0A0B0] border border-white/10'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addrName}
                  onChange={(e) => setAddrName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">
                  10-Digit Mobile (+91) *
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={addrPhone}
                  onChange={(e) =>
                    setAddrPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  className="w-full px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">
                  6-Digit Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={addrPincode}
                  onChange={(e) =>
                    setAddrPincode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  className="w-full px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">State *</label>
                <select
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#A0A0B0] mb-1">
                Flat, Building, Street, Area *
              </label>
              <input
                type="text"
                required
                value={addrArea}
                onChange={(e) => setAddrArea(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-[#A0A0B0] cursor-pointer">
              <input
                type="checkbox"
                checked={addrDefault}
                onChange={(e) => setAddrDefault(e.target.checked)}
                className="accent-[#6C63FF]"
              />
              <span>Set as default shipping address</span>
            </label>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="px-4 py-2 rounded-[8px] bg-[#1A1A1F] text-xs text-[#A0A0B0] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
