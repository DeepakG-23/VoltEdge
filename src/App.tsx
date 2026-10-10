import React, { useEffect, useState } from 'react';
import {
  AccountSettingsView,
  CustomerProfileData,
  INITIAL_SAVED_ADDRESSES,
  LoginOtpView,
  SavedAddressItem,
} from './components/AccountAndAuthViews';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView, OrderSuccessView } from './components/CheckoutViews';
import { CrazyMobilesLogo } from './components/CrazyMobilesLogo';
import { CustomCursor } from './components/CustomCursor';
import { QuickViewModal, TrackOrderModal, YourDeviceModal } from './components/Modals';
import {
  HomeView,
  ProductDetailView,
  ProductListingView,
  WishlistView,
} from './components/StoreViews';
import {
  AuditLogEntry,
  CartItem,
  DEFAULT_HOME_PAGE_CONFIG,
  HomePageConfig,
  Order,
  OrderAddress,
  OrderStatus,
  Product,
  ProductReview,
  SEED_AUDIT_LOGS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  STORE_EMAIL,
  STORE_MAPS_URL,
  STORE_NAME,
  STORE_PHONE,
  STORE_PHONE_DISPLAY,
  STORE_UPI_ID,
  formatINR,
  resolveAssetUrl,
} from './data/seedData';
import {
  OperationType,
  User,
  auth,
  collection,
  db,
  deleteDoc,
  doc,
  googleProvider,
  handleFirestoreError,
  onAuthStateChanged,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  where,
} from './firebase';

interface ToastMessage {
  id: number;
  text: string;
}

const STORAGE_KEYS = {
  PRODUCTS: 'voltedge_products_v1',
  ORDERS: 'voltedge_orders_v1',
  CART: 'voltedge_cart_v1',
  WISHLIST: 'voltedge_wishlist_v1',
  PROFILE: 'voltedge_profile_v1',
  HOME_CONFIG: 'voltedge_home_config_v1',
  AUDIT_LOGS: 'voltedge_audit_logs_v1',
};

/**
 * Protected Route Guard Component
 * Ensures unauthorized visitors attempting direct URL manipulation to access /admin
 * are immediately blocked and redirected to the home page without viewing admin data.
 */
function AdminProtectedRoute({
  isAdminAuthenticated,
  onRedirectUnauthorized,
  children,
}: {
  isAdminAuthenticated: boolean;
  onRedirectUnauthorized: () => void;
  children: React.ReactNode;
}) {
  const hasSession =
    isAdminAuthenticated &&
    sessionStorage.getItem('voltedge_admin_auth') === 'true';

  useEffect(() => {
    if (!hasSession) {
      onRedirectUnauthorized();
    }
  }, [hasSession, onRedirectUnauthorized]);

  if (!hasSession) {
    return null;
  }

  return <>{children}</>;
}

export default function App() {
  // Firebase Auth User State & Owner Admin Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('voltedge_admin_auth') === 'true';
  });

  // Persisted Products (with automatic asset URL migration for GitHub Pages / Production builds)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: Product) => ({
            ...p,
            image: resolveAssetUrl(p.image),
            placeholderUrl: resolveAssetUrl(p.placeholderUrl),
            gallery: Array.isArray(p.gallery)
              ? p.gallery.map((g) => ({
                  ...g,
                  url: resolveAssetUrl(g.url),
                }))
              : [],
          }));
        }
      }
    } catch {
      // ignore storage errors
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    return SEED_PRODUCTS;
  });

  // Persisted Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((o: Order) => ({
            ...o,
            items: Array.isArray(o.items)
              ? o.items.map((item) => ({
                  ...item,
                  image: resolveAssetUrl(item.image),
                }))
              : [],
          }));
        }
      }
    } catch {
      // ignore storage errors
    }
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(SEED_ORDERS));
    return SEED_ORDERS;
  });

  // Persisted Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: CartItem) => ({
            ...item,
            image: resolveAssetUrl(item.image),
          }));
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  // Persisted Wishlist (Product IDs)
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WISHLIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  // Persisted Customer Profile & Saved Addresses Book
  const [customerProfile, setCustomerProfile] = useState<CustomerProfileData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.fullName === 'string') return parsed;
      }
    } catch {
      // ignore
    }
    return {
      fullName: 'Shaikh Shoeb',
      email: STORE_EMAIL,
      phone: STORE_PHONE,
      smsAlerts: true,
      isPhoneVerified: true,
      addresses: INITIAL_SAVED_ADDRESSES,
    };
  });

  // Local State Audit Log for Admin Operations & Auditing
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return SEED_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  const logAdminAction = (
    action: string,
    details: string,
    entityId?: string | number,
    category?: AuditLogEntry['category']
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      action,
      details,
      actor: 'Shaikh Shoeb (Admin)',
      entityId,
      category: category || 'system',
    };
    setAuditLogs((prev) => [newEntry, ...prev.slice(0, 99)]);
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    } catch {
      // ignore
    }
    showToast('Admin audit logs cleared');
  };

  // Persisted Home Page Configuration (Hero Division, Sliding Sales Bar, Trending Section)
  const [homeConfig, setHomeConfig] = useState<HomePageConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOME_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          Array.isArray(parsed.heroFeaturedProductIds) &&
          Array.isArray(parsed.saleProductIds)
        ) {
          return {
            ...DEFAULT_HOME_PAGE_CONFIG,
            ...parsed,
            trendingSpotlights: Array.isArray(parsed.trendingSpotlights)
              ? parsed.trendingSpotlights.map(
                  (s: HomePageConfig['trendingSpotlights'][number]) => ({
                    ...s,
                    customImage: resolveAssetUrl(s.customImage),
                  })
                )
              : DEFAULT_HOME_PAGE_CONFIG.trendingSpotlights,
          };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_HOME_PAGE_CONFIG;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HOME_CONFIG, JSON.stringify(homeConfig));
    } catch {
      // ignore
    }
  }, [homeConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(customerProfile));
    } catch {
      // ignore
    }
  }, [customerProfile]);

  // Hash Route State (Protected with Session Verification for /admin)
  const [hashRoute, setHashRoute] = useState<string>(() => {
    const rawPath = window.location.pathname;
    const rawHash = window.location.hash;
    const isTargetingAdmin =
      rawPath === '/admin' || rawHash.startsWith('#/admin');
    if (isTargetingAdmin) {
      const isAuth = sessionStorage.getItem('voltedge_admin_auth') === 'true';
      if (!isAuth) {
        window.history.replaceState(null, '', '#/home');
        return '#/home';
      }
      window.location.hash = '#/admin';
      return '#/admin';
    }
    return rawHash || '#/home';
  });

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

  // UI Overlays State
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartBounce, setCartBounce] = useState<boolean>(false);
  const [wishlistBounce, setWishlistBounce] = useState<boolean>(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState<boolean>(false);
  const [trackOrderId, setTrackOrderId] = useState<string>('');
  const [isYourDeviceModalOpen, setIsYourDeviceModalOpen] = useState<boolean>(false);
  const [userSelectedDevice, setUserSelectedDevice] = useState<string>(() => {
    return localStorage.getItem('voltedge_user_device') || '';
  });
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleSetUserDevice = (deviceModel: string) => {
    setUserSelectedDevice(deviceModel);
    try {
      localStorage.setItem('voltedge_user_device', deviceModel);
    } catch {
      // ignore
    }
  };

  const handleNavigateToStoreLocation = () => {
    if (hashRoute !== '#/home' && hashRoute !== '') {
      navigate('#/home');
      setTimeout(() => {
        const el = document.getElementById('store-location');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }, 200);
    } else {
      const el = document.getElementById('store-location');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  const showToast = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // 2. Firestore Real-Time Listeners (Wishlist & Orders for Authenticated User)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    const wishlistPath = `wishlists/${currentUser.uid}`;
    const unsubWishlist = onSnapshot(
      doc(db, 'wishlists', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.productIds)) {
            setWishlistIds(data.productIds);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, wishlistPath);
      }
    );

    const isVerifiedAdmin =
      currentUser.emailVerified &&
      currentUser.email === 'deepakpanditgaikwad2004@gmail.com';

    const ordersQuery = isVerifiedAdmin
      ? query(collection(db, 'orders'))
      : query(collection(db, 'orders'), where('userId', '==', currentUser.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        if (!snap.empty) {
          const remoteOrders: Order[] = [];
          snap.forEach((docSnap) => {
            const d = docSnap.data();
            const parts = String(d.addressSummary || '').split(' | ');
            remoteOrders.push({
              id: String(d.orderCode || docSnap.id),
              customerName: String(d.customerName || `${STORE_NAME} Customer`),
              customerEmail: String(d.customerEmail || ''),
              phone: String(d.phone || STORE_PHONE),
              address: {
                fullName: String(d.customerName || `${STORE_NAME} Customer`),
                phone: String(d.phone || STORE_PHONE),
                area: parts[0] || String(d.addressSummary || ''),
                city: parts[1] || 'Bengaluru',
                state: parts[2] || 'Karnataka',
                pincode: parts[3] || '560034',
              },
              items: SEED_ORDERS[0].items,
              subtotal: Number(d.subtotal || 0),
              shipping: Number(d.shipping || 0),
              discount: Number(d.discount || 0),
              total: Number(d.total || 0),
              paymentMethod:
                d.paymentMethod === 'Card' || d.paymentMethod === 'COD'
                  ? d.paymentMethod
                  : 'UPI',
              paymentDetails: String(d.paymentDetails || ''),
              status:
                d.status === 'Packed' ||
                d.status === 'Shipped' ||
                d.status === 'Delivered'
                  ? d.status
                  : 'Pending',
              date: String(d.date || '30 Sep 2026'),
              timestamp: Date.now(),
            });
          });
          setOrders((prev) => {
            const existingMap = new Map(prev.map((o) => [o.id, o]));
            remoteOrders.forEach((ro) => {
              const localMatch = existingMap.get(ro.id);
              existingMap.set(ro.id, localMatch ? { ...localMatch, status: ro.status } : ro);
            });
            return Array.from(existingMap.values());
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => {
      unsubWishlist();
      unsubOrders();
    };
  }, [isAuthReady, currentUser]);

  // 3. Firestore Real-Time Listener for User Profile & Saved Addresses (/user_profiles/{userId})
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;
    const profilePath = `user_profiles/${currentUser.uid}`;
    const unsubProfile = onSnapshot(
      doc(db, 'user_profiles', currentUser.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const parsedAddresses: SavedAddressItem[] = Array.isArray(data.addressesList)
            ? data.addressesList.map((raw: string, idx: number) => {
                const parts = String(raw).split(' || ');
                return {
                  id: parts[0] || `addr-${idx}`,
                  label:
                    parts[1] === 'Office' || parts[1] === 'Other'
                      ? parts[1]
                      : 'Home',
                  fullName: parts[2] || String(data.fullName || `${STORE_NAME} Member`),
                  phone: parts[3] || String(data.phone || STORE_PHONE),
                  area: parts[4] || '',
                  city: parts[5] || 'Bengaluru',
                  state: parts[6] || 'Karnataka',
                  pincode: parts[7] || '560034',
                  isDefault: parts[8] === 'true',
                };
              })
            : INITIAL_SAVED_ADDRESSES;

          setCustomerProfile((prev) => ({
            ...prev,
            fullName: String(data.fullName || prev.fullName),
            email: String(data.email || currentUser.email || prev.email),
            phone: String(data.phone || prev.phone),
            smsAlerts: Boolean(data.smsAlerts ?? true),
            addresses: parsedAddresses.length > 0 ? parsedAddresses : prev.addresses,
          }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );

    return () => unsubProfile();
  }, [isAuthReady, currentUser]);

  const syncProfileToFirestore = async (nextProfile: CustomerProfileData) => {
    if (!currentUser || !currentUser.emailVerified) return;
    const profilePath = `user_profiles/${currentUser.uid}`;
    const serializedAddresses = nextProfile.addresses
      .slice(0, 10)
      .map((a) =>
        `${a.id} || ${a.label} || ${a.fullName} || ${a.phone} || ${a.area} || ${a.city} || ${a.state} || ${a.pincode} || ${a.isDefault}`.slice(
          0,
          490
        )
      );

    try {
      await setDoc(doc(db, 'user_profiles', currentUser.uid), {
        userId: currentUser.uid.slice(0, 128),
        fullName: (nextProfile.fullName || `${STORE_NAME} Member`).slice(0, 100),
        email: (nextProfile.email || currentUser.email || STORE_EMAIL).slice(
          0,
          120
        ),
        phone: (nextProfile.phone || STORE_PHONE).slice(0, 15),
        smsAlerts: Boolean(nextProfile.smsAlerts),
        addressesList: serializedAddresses,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, profilePath);
    }
  };

  const handleSaveCustomerProfile = (updated: CustomerProfileData) => {
    setCustomerProfile(updated);
    void syncProfileToFirestore(updated);
  };

  const handlePhoneVerifiedSuccess = (verifiedPhone: string, verifiedName?: string) => {
    const cleanedPhone = verifiedPhone.replace(/\D/g, '').slice(0, 10);
    const updated: CustomerProfileData = {
      ...customerProfile,
      phone: cleanedPhone || customerProfile.phone,
      fullName: verifiedName?.trim() || customerProfile.fullName,
      isPhoneVerified: true,
    };
    setCustomerProfile(updated);
    void syncProfileToFirestore(updated);
    showToast(`Mobile +91 ${cleanedPhone} verified via SMS OTP!`);
  };

  const handleAdminLoginSuccess = () => {
    sessionStorage.setItem('voltedge_admin_auth', 'true');
    setIsAdminAuthenticated(true);
    logAdminAction(
      'Admin Login',
      'Store Owner Shaikh Shoeb authenticated into Operations Console.',
      undefined,
      'auth'
    );
    showToast('Welcome Store Owner! Opening Admin Operations Console...');
    navigate('#/admin');
  };

  const handleAdminLogout = () => {
    logAdminAction(
      'Admin Logout',
      'Store Owner signed out of Admin Console.',
      undefined,
      'auth'
    );
    sessionStorage.removeItem('voltedge_admin_auth');
    setIsAdminAuthenticated(false);
    showToast('Logged out of Admin Console');
    navigate('#/home');
  };

  const handleCustomerLoginSuccess = (loginId: string, displayName?: string) => {
    const updated: CustomerProfileData = {
      ...customerProfile,
      email: loginId.includes('@') ? loginId : customerProfile.email,
      fullName: displayName || customerProfile.fullName,
    };
    setCustomerProfile(updated);
    void syncProfileToFirestore(updated);
    showToast(`Signed in as ${updated.fullName}`);
    navigate('#/account');
  };

  const handleReorderItems = (orderItems: CartItem[]) => {
    setCart((prev) => {
      const next = [...prev];
      orderItems.forEach((oi) => {
        const idx = next.findIndex(
          (c) =>
            c.productId === oi.productId &&
            c.color === oi.color &&
            c.size === oi.size
        );
        if (idx > -1) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + oi.quantity };
        } else {
          next.push({ ...oi });
        }
      });
      return next;
    });
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 450);
    setIsCartOpen(true);
    showToast('Added order items back to your shopping bag');
  };

  // Helper to sync Wishlist to Firestore when user is signed in
  const syncWishlistToFirestore = async (nextIds: number[]) => {
    if (!currentUser || !currentUser.emailVerified) return;
    const path = `wishlists/${currentUser.uid}`;
    try {
      await setDoc(doc(db, 'wishlists', currentUser.uid), {
        userId: currentUser.uid.slice(0, 128),
        productIds: nextIds.slice(0, 50),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Google Sign-In / Sign-Out Handlers
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      showToast(`Signed in as ${result.user.displayName || result.user.email}`);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      showToast('Google Sign-In was cancelled or failed');
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut(auth);
      showToast(`Signed out of your ${STORE_NAME} account`);
    } catch (error) {
      console.error('Sign-Out Error:', error);
    }
  };

  // Listen to hash changes & scroll with Route Guard protection for /admin
  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash || '#/home';
      if (h.startsWith('#/admin')) {
        const isAuth =
          sessionStorage.getItem('voltedge_admin_auth') === 'true';
        if (!isAuth) {
          showToast('Access denied: Store Owner login required.');
          window.history.replaceState(null, '', '#/home');
          setHashRoute('#/home');
          return;
        }
      }
      if (h === '#/cart') {
        setIsCartOpen(true);
        window.history.replaceState(null, '', '#/products');
        setHashRoute('#/products');
        return;
      }
      setHashRoute(h);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const navigate = (hash: string) => {
    if (hash.startsWith('#/admin')) {
      const isAuth =
        sessionStorage.getItem('voltedge_admin_auth') === 'true';
      if (!isAuth) {
        showToast('Access denied: Store Owner login required.');
        window.location.hash = '#/login';
        setHashRoute('#/login');
        return;
      }
    }
    if (hash === '#/cart') {
      setIsCartOpen(true);
      return;
    }
    window.location.hash = hash;
    setHashRoute(hash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart Handlers
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    color = product.colors[0]?.name || 'Obsidian',
    size = product.sizes[0] || 'Standard'
  ) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.productId === product.id && item.color === color && item.size === size
      );
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + quantity,
        };
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          color,
          size,
          quantity,
        },
      ];
    });

    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 450);
    showToast(`Added ${product.shortName} to your bag`);
  };

  const handleBuyNow = (
    product: Product,
    quantity: number,
    color: string,
    size: string
  ) => {
    handleAddToCart(product, quantity, color, size);
    navigate('#/checkout');
  };

  const handleUpdateCartQuantity = (
    productId: number,
    color: string,
    size: string,
    delta: number
  ) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (
            item.productId === productId &&
            item.color === color &&
            item.size === size
          ) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: number, color: string, size: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.color === color &&
            item.size === size
          )
      )
    );
    showToast('Item removed from bag');
  };

  // Wishlist Handlers
  const handleToggleWishlist = (product: Product) => {
    const isCurrentlySaved = wishlistIds.includes(product.id);
    const nextIds = isCurrentlySaved
      ? wishlistIds.filter((id) => id !== product.id)
      : [...wishlistIds, product.id];
    setWishlistIds(nextIds);
    void syncWishlistToFirestore(nextIds);
    setWishlistBounce(true);
    setTimeout(() => setWishlistBounce(false), 450);
    showToast(
      isCurrentlySaved
        ? `Removed ${product.shortName} from Wishlist`
        : `Saved ${product.shortName} to Wishlist`
    );
  };

  const handleMoveToCartFromWishlist = (product: Product) => {
    handleAddToCart(
      product,
      1,
      product.colors[0]?.name || 'Obsidian',
      product.sizes[0] || 'Standard'
    );
    const nextIds = wishlistIds.filter((id) => id !== product.id);
    setWishlistIds(nextIds);
    void syncWishlistToFirestore(nextIds);
    showToast(`Moved ${product.shortName} to your bag`);
  };

  const handleMoveAllWishlistToCart = () => {
    const savedProducts = products.filter(
      (p) => wishlistIds.includes(p.id) && p.stock > 0
    );
    if (savedProducts.length === 0) return;

    savedProducts.forEach((product) => {
      handleAddToCart(
        product,
        1,
        product.colors[0]?.name || 'Obsidian',
        product.sizes[0] || 'Standard'
      );
    });
    setWishlistIds([]);
    void syncWishlistToFirestore([]);
    showToast(`Moved ${savedProducts.length} item(s) from Wishlist to your bag`);
  };

  const handleClearWishlist = () => {
    setWishlistIds([]);
    void syncWishlistToFirestore([]);
    showToast('Cleared Wishlist');
  };

  // Checkout Order Placement (Also saves captured phone number, email & address to customer profile)
  const handlePlaceOrder = (data: {
    address: OrderAddress;
    customerEmail?: string;
    altPhone?: string;
    landmark?: string;
    addressLabel?: 'Home' | 'Office' | 'Other';
    deliveryNotes?: string;
    saveToProfile?: boolean;
    paymentMethod: 'UPI' | 'Card' | 'COD';
    paymentDetails: string;
    discount: number;
  }) => {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shipping = subtotal >= 499 ? 0 : 49;
    const total = Math.max(0, subtotal + shipping - data.discount);
    const orderNum = String(orders.length + 1).padStart(3, '0');
    const resolvedEmail =
      data.customerEmail?.trim() ||
      currentUser?.email ||
      customerProfile.email ||
      `${data.address.fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

    const newOrder: Order = {
      id: `VE-20260930-${orderNum}`,
      customerName: data.address.fullName,
      customerEmail: resolvedEmail,
      phone: data.address.phone,
      address: data.address,
      items: [...cart],
      subtotal,
      shipping,
      discount: data.discount,
      total,
      paymentMethod: data.paymentMethod,
      paymentDetails: data.paymentDetails,
      status: 'Pending',
      date: '30 Sep 2026',
      timestamp: Date.now(),
    };

    // Save captured phone number, email, and shipping address to Customer Profile
    if (data.saveToProfile !== false) {
      const matchingExistingIdx = customerProfile.addresses.findIndex(
        (a) =>
          a.pincode === data.address.pincode &&
          a.area.toLowerCase() === data.address.area.toLowerCase()
      );

      let updatedAddresses = [...customerProfile.addresses];
      if (matchingExistingIdx > -1) {
        updatedAddresses[matchingExistingIdx] = {
          ...updatedAddresses[matchingExistingIdx],
          fullName: data.address.fullName,
          phone: data.address.phone,
          city: data.address.city,
          state: data.address.state,
          label: data.addressLabel || updatedAddresses[matchingExistingIdx].label,
        };
      } else {
        const newSavedAddr: SavedAddressItem = {
          id: `addr-${Date.now()}`,
          label: data.addressLabel || 'Home',
          fullName: data.address.fullName,
          phone: data.address.phone,
          pincode: data.address.pincode,
          area: data.address.area,
          city: data.address.city,
          state: data.address.state,
          isDefault: updatedAddresses.length === 0,
        };
        updatedAddresses = [newSavedAddr, ...updatedAddresses];
      }

      const updatedProfile: CustomerProfileData = {
        ...customerProfile,
        fullName: data.address.fullName || customerProfile.fullName,
        phone: data.address.phone || customerProfile.phone,
        email: resolvedEmail,
        addresses: updatedAddresses,
      };
      setCustomerProfile(updatedProfile);
      void syncProfileToFirestore(updatedProfile);
    }

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const orderedQty = cart
          .filter((c) => c.productId === p.id)
          .reduce((s, c) => s + c.quantity, 0);
        if (orderedQty > 0) {
          return { ...p, stock: Math.max(0, p.stock - orderedQty) };
        }
        return p;
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setLastPlacedOrder(newOrder);
    setCart([]);

    // Persist to Firestore if user is authenticated with verified email
    if (currentUser && currentUser.emailVerified) {
      const orderPath = `orders/${newOrder.id}`;
      const cleanAddressSummary = `${data.address.area} | ${data.address.city} | ${data.address.state} | ${data.address.pincode}`.slice(
        0,
        400
      );
      const cleanItemsSummary = newOrder.items
        .map((i) => `${i.name} (${i.color}/${i.size}) x${i.quantity}`)
        .join(', ')
        .slice(0, 1000);

      setDoc(doc(db, 'orders', newOrder.id), {
        orderCode: newOrder.id.slice(0, 40),
        userId: currentUser.uid.slice(0, 128),
        customerName: newOrder.customerName.slice(0, 100),
        customerEmail: (currentUser.email || newOrder.customerEmail).slice(0, 120),
        phone: newOrder.phone.slice(0, 15),
        addressSummary: cleanAddressSummary,
        itemsSummary: cleanItemsSummary || `${STORE_NAME} Product`,
        subtotal: newOrder.subtotal,
        shipping: newOrder.shipping,
        discount: newOrder.discount,
        total: newOrder.total,
        paymentMethod: newOrder.paymentMethod,
        paymentDetails: (newOrder.paymentDetails || 'Verified').slice(0, 120),
        status: 'Pending',
        date: newOrder.date.slice(0, 32),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((error) => {
        handleFirestoreError(error, OperationType.CREATE, orderPath);
      });
    }

    showToast(`Order ${newOrder.id} confirmed!`);
    navigate('#/order-success');
  };

  // Add Product Review
  const handleAddReview = (
    productId: number,
    reviewData: Omit<ProductReview, 'id' | 'date' | 'verified'>
  ) => {
    const newRev: ProductReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: '30 Sep 2026',
      verified: true,
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextCount = p.reviewsCount + 1;
        return {
          ...p,
          reviewsCount: nextCount,
          reviews: [newRev, ...p.reviews],
        };
      })
    );
    showToast('Thank you! Your verified review has been published.');
  };

  // Admin Product & Order Handlers
  const handleAdminAddProduct = (newProd: Omit<Product, 'id'>) => {
    const nextId =
      products.reduce((maxId, p) => Math.max(maxId, p.id), 0) + 1;
    setProducts((prev) => [{ ...newProd, id: nextId }, ...prev]);
    logAdminAction(
      'Product Added',
      `Added product "${newProd.name}" (${formatINR(newProd.price)}, Stock: ${newProd.stock})`,
      nextId,
      'products'
    );
  };

  const handleAdminUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    logAdminAction(
      'Product Updated',
      `Updated product #${updated.id} "${updated.name}" (${formatINR(updated.price)}, Stock: ${updated.stock})`,
      updated.id,
      'products'
    );
  };

  const handleAdminDeleteProduct = (productId: number) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    logAdminAction(
      'Product Deleted',
      `Deleted product #${productId} "${target?.name || 'Item'}"`,
      productId,
      'products'
    );
  };

  const handleAdminUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    logAdminAction(
      'Order Status Changed',
      `Order #${orderId} status changed to ${status}`,
      orderId,
      'orders'
    );
  };

  const handleResetDemoData = () => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(SEED_ORDERS));
    localStorage.setItem(
      STORAGE_KEYS.HOME_CONFIG,
      JSON.stringify(DEFAULT_HOME_PAGE_CONFIG)
    );
    setProducts(SEED_PRODUCTS);
    setOrders(SEED_ORDERS);
    setHomeConfig(DEFAULT_HOME_PAGE_CONFIG);
    logAdminAction(
      'Data Reset',
      'Reset products, orders, and CMS configuration to factory seed data.',
      undefined,
      'system'
    );
    showToast('Catalog, orders, and CMS reset to initial seed data');
  };

  // Determine Active View from Hash
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isAdminRoute = hashRoute.startsWith('#/admin');

  const renderMainView = () => {
    if (hashRoute.startsWith('#/admin')) {
      return (
        <AdminProtectedRoute
          isAdminAuthenticated={isAdminAuthenticated}
          onRedirectUnauthorized={() => {
            showToast('Access denied: Admin credentials required to view console.');
            navigate('#/home');
          }}
        >
          <AdminDashboard
            products={products}
            orders={orders}
            homeConfig={homeConfig}
            auditLogs={auditLogs}
            onAddLog={(entry) =>
              logAdminAction(
                entry.action,
                entry.details,
                entry.entityId,
                entry.category
              )
            }
            onClearLogs={handleClearAuditLogs}
            onUpdateHomeConfig={(cfg) => {
              setHomeConfig(cfg);
              logAdminAction(
                'Home CMS Updated',
                `Updated home page configuration (Hero, Sales ${cfg.salesPercentage}%, Trending items)`,
                undefined,
                'cms'
              );
            }}
            onAddProduct={handleAdminAddProduct}
            onUpdateProduct={handleAdminUpdateProduct}
            onDeleteProduct={handleAdminDeleteProduct}
            onUpdateOrderStatus={handleAdminUpdateOrderStatus}
            onResetDemoData={handleResetDemoData}
            onExitAdmin={() => navigate('#/home')}
            onAdminLogout={handleAdminLogout}
            showToast={showToast}
          />
        </AdminProtectedRoute>
      );
    }

    if (hashRoute.startsWith('#/login')) {
      return (
        <LoginOtpView
          currentUser={currentUser}
          profile={customerProfile}
          isAdminAuthenticated={isAdminAuthenticated}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onCustomerLoginSuccess={handleCustomerLoginSuccess}
          onPhoneVerifiedSuccess={handlePhoneVerifiedSuccess}
          onGoogleSignIn={handleGoogleSignIn}
          onNavigateAccount={() => navigate('#/account')}
          onNavigateAdmin={() => navigate('#/admin')}
          showToast={showToast}
        />
      );
    }

    if (hashRoute.startsWith('#/account')) {
      return (
        <AccountSettingsView
          currentUser={currentUser}
          profile={customerProfile}
          orders={orders}
          onSaveProfile={handleSaveCustomerProfile}
          onTrackOrder={(id) => {
            setTrackOrderId(id);
            setIsTrackModalOpen(true);
          }}
          onReorderItems={handleReorderItems}
          onNavigateLogin={() => navigate('#/login')}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          showToast={showToast}
        />
      );
    }

    if (hashRoute.startsWith('#/wishlist')) {
      return (
        <WishlistView
          products={products}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onMoveToCart={handleMoveToCartFromWishlist}
          onMoveAllToCart={handleMoveAllWishlistToCart}
          onClearWishlist={handleClearWishlist}
          onNavigateProduct={(id) => navigate(`#/product/${id}`)}
          onNavigateShop={() => navigate('#/products')}
        />
      );
    }

    if (hashRoute.startsWith('#/product/')) {
      const idStr = hashRoute.replace('#/product/', '').trim();
      const prodId = Number(idStr);
      const foundProduct =
        products.find((p) => p.id === prodId) || products[0];
      return (
        <ProductDetailView
          product={foundProduct}
          allProducts={products}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onNavigateProduct={(id) => navigate(`#/product/${id}`)}
          onNavigateBack={() => navigate('#/products')}
          onAddReview={handleAddReview}
        />
      );
    }

    if (hashRoute.startsWith('#/products')) {
      return (
        <ProductListingView
          products={products}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          onAddToCart={handleAddToCart}
          onNavigateProduct={(id) => navigate(`#/product/${id}`)}
          onQuickView={(prod) => setQuickViewProduct(prod)}
        />
      );
    }

    if (hashRoute.startsWith('#/checkout')) {
      return (
        <CheckoutView
          items={cart}
          initialProfile={{
            fullName: currentUser?.displayName || customerProfile.fullName,
            email: currentUser?.email || customerProfile.email,
            phone: customerProfile.phone,
            addresses: customerProfile.addresses,
          }}
          onPlaceOrder={handlePlaceOrder}
          onNavigateShop={() => navigate('#/products')}
        />
      );
    }

    if (hashRoute.startsWith('#/order-success')) {
      const liveOrder =
        (lastPlacedOrder && orders.find((o) => o.id === lastPlacedOrder.id)) ||
        lastPlacedOrder ||
        orders[0] ||
        null;
      return (
        <OrderSuccessView
          order={liveOrder}
          onTrackOrder={(id) => {
            setTrackOrderId(id);
            setIsTrackModalOpen(true);
          }}
          onContinueShopping={() => navigate('#/products')}
        />
      );
    }

    // Default: Home View (#/home)
    return (
      <HomeView
        products={products}
        homeConfig={homeConfig}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onNavigateProduct={(id) => navigate(`#/product/${id}`)}
        onNavigateCategory={(cat) => {
          setSelectedCategory(cat);
          navigate('#/products');
        }}
        onQuickView={(prod) => setQuickViewProduct(prod)}
      />
    );
  };

  // Instant search dropdown matches
  const searchSuggestions =
    searchQuery.trim().length > 0
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 4)
      : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Custom Desktop Cursor */}
      <CustomCursor />

      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-[80] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 border-l-4 border-l-blue-600 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 animate-page-enter"
          >
            <i className="fa-solid fa-bolt text-blue-600 text-xs shrink-0" />
            <span className="text-xs font-semibold text-slate-800">{t.text}</span>
          </div>
        ))}
      </div>

      {/* TOP PROMOTIONAL ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 flex-wrap">
        <span className="bg-[#84F229] text-slate-950 px-2 py-0.5 rounded font-extrabold text-[10px] tracking-wide">
          MEGA SALE
        </span>
        <span>
          Free Express Delivery on orders above ₹499 Across India | Need Help? WhatsApp:
        </span>
        <a
          href="https://wa.me/919011221665"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#25D366] hover:underline font-bold inline-flex items-center gap-1"
        >
          <i className="fa-brands fa-whatsapp" />
          <span>+91 9011221665</span>
        </a>
      </div>

      {/* CLEAN WHITE STICKY HEADER */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 backdrop-blur-md bg-white/95 border-b border-slate-200/90 ${
          isScrolled ? 'py-2.5 shadow-md' : 'py-3.5'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4">
          {/* ZONE 1: Crazy Mobiles Logo - Returns to Home */}
          <a
            href="#/home"
            onClick={(e) => {
              e.preventDefault();
              navigate('#/home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center shrink-0 group transition-all duration-200 hover:scale-[1.02] focus:outline-none"
            aria-label="Crazy Mobiles Home"
          >
            <CrazyMobilesLogo variant="horizontal" size="sm" theme="light" />
          </a>

          {/* ZONE 2: Search Bar & Store Navigation */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center justify-center gap-5">
            <nav className="flex items-center gap-4 text-xs font-semibold text-slate-600 shrink-0">
              <a
                href="#/home"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('#/home');
                }}
                className={`hover:text-blue-600 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  hashRoute === '#/home' || hashRoute === '' ? 'text-blue-600 font-bold' : ''
                }`}
              >
                <i className="fa-solid fa-house text-[11px]" />
                <span>Home</span>
              </a>

              <a
                href="#/products"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory('All');
                  navigate('#/products');
                }}
                className={`hover:text-blue-600 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  hashRoute.startsWith('#/products') ? 'text-blue-600 font-bold' : ''
                }`}
              >
                <i className="fa-solid fa-layer-group text-[11px]" />
                <span>Catalog</span>
              </a>

              <button
                type="button"
                onClick={() => setIsYourDeviceModalOpen(true)}
                className="hover:text-blue-600 transition-colors whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                <i className="fa-solid fa-mobile-screen-button text-blue-600 text-[11px]" />
                <span>Your Device</span>
                {userSelectedDevice && (
                  <span className="text-[10px] text-emerald-600 font-mono-num font-bold">
                    ({userSelectedDevice.split(' ').pop()})
                  </span>
                )}
              </button>

              <a
                href="#store-location"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigateToStoreLocation();
                }}
                className="hover:text-emerald-700 transition-colors whitespace-nowrap flex items-center gap-1 text-emerald-600 font-semibold"
              >
                <i className="fa-solid fa-store text-[11px]" />
                <span>Store</span>
              </a>
            </nav>

            {/* Search Bar with live dropdown */}
            <div className="relative flex-1 max-w-xs">
              <div
                className={`flex items-center rounded-full bg-slate-100 border px-3.5 py-1.5 transition-all duration-300 ${
                  searchFocused
                    ? 'border-blue-500 bg-white ring-2 ring-blue-100 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <i className="fa-solid fa-magnifying-glass text-slate-400 text-xs mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate('#/products');
                      setSearchFocused(false);
                    }
                  }}
                  placeholder="Search smartwatches, earbuds, chargers..."
                  aria-label="Search accessories"
                  className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 text-xs ml-1"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>

              {/* Instant Search Dropdown */}
              {searchFocused && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => {
                        navigate(`#/product/${item.id}`);
                        setSearchFocused(false);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-none"
                    >
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {item.shortName}
                      </span>
                      <span className="text-xs font-mono-num font-bold text-blue-600 shrink-0">
                        {formatINR(item.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ZONE 3: WhatsApp Quick Support, Wishlist, Cart & Account */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Direct WhatsApp Support Button */}
            <a
              href="https://wa.me/919011221665"
              target="_blank"
              rel="noopener noreferrer"
              title="Chat with Crazy Mobiles on WhatsApp"
              className="h-9 px-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-[#25D366]/30 text-xs font-bold items-center gap-1.5 transition-all whitespace-nowrap hidden lg:flex"
            >
              <i className="fa-brands fa-whatsapp text-sm" />
              <span>WhatsApp</span>
            </a>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => navigate('#/wishlist')}
              aria-label="Open Wishlist"
              title="Wishlist"
              className={`relative h-9 px-3 rounded-lg border flex items-center gap-1.5 transition-colors hidden md:flex ${
                hashRoute.startsWith('#/wishlist')
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <i
                className={`${
                  wishlistIds.length > 0 ? 'fa-solid text-rose-500' : 'fa-regular text-slate-400'
                } fa-heart text-xs`}
              />
              <span className="text-xs font-semibold hidden lg:inline">Wishlist</span>
              {wishlistIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white font-mono-num">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Open shopping cart"
              className="relative h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-bag-shopping text-xs" />
              <span className="text-xs font-bold font-mono-num hidden sm:inline">
                {totalCartItems > 0 ? `${totalCartItems} item${totalCartItems > 1 ? 's' : ''}` : 'Cart'}
              </span>
              {totalCartItems > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-[#FFB703] text-slate-900 leading-none ${
                    cartBounce ? 'animate-cart-bounce' : ''
                  }`}
                >
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Account / Admin Button */}
            <button
              type="button"
              onClick={() => navigate('#/account')}
              aria-label="Customer Account Settings"
              title="Account Settings"
              className={`h-9 px-3 rounded-lg border text-xs font-medium items-center gap-1.5 transition-colors whitespace-nowrap hidden md:flex ${
                hashRoute.startsWith('#/account') || hashRoute.startsWith('#/login')
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <i className="fa-regular fa-user text-xs" />
              <span className="hidden lg:inline">Account</span>
            </button>

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => navigate('#/admin')}
                aria-label="Store Owner Admin Console"
                title="Store Owner Admin Console"
                className={`h-9 px-3 rounded-lg border text-xs font-bold items-center gap-1.5 transition-colors whitespace-nowrap hidden md:flex ${
                  isAdminRoute
                    ? 'bg-slate-900 text-white border-transparent'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-purple-700'
                }`}
              >
                <i className="fa-solid fa-sliders text-xs text-purple-600" />
                <span className="hidden xl:inline">Admin</span>
              </button>
            )}

            {/* Hamburger Button for Mobile Drawer */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="h-9 w-9 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center md:hidden transition-colors"
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm`} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE RESPONSIVE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <>
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden"
          />

          <div className="fixed inset-y-0 right-0 z-50 w-[300px] max-w-full bg-white border-l border-slate-200 shadow-2xl p-5 flex flex-col justify-between md:hidden animate-page-enter overflow-y-auto">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <a
                  href="#/home"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('#/home');
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center shrink-0 group transition-transform active:scale-95"
                  aria-label="Crazy Mobiles Home"
                >
                  <CrazyMobilesLogo variant="compact" size="sm" theme="light" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close Navigation Menu"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              {/* Mobile Search Input */}
              <div className="relative">
                <div className="flex items-center rounded-full bg-slate-100 border border-slate-200 px-3.5 py-2">
                  <i className="fa-solid fa-magnifying-glass text-slate-400 text-xs mr-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate('#/products');
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    placeholder="Search smartwatches, accessories..."
                    className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600 text-xs ml-1"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
              </div>

              {/* Core Navigation Links */}
              <nav className="flex flex-col gap-1.5 text-xs font-semibold">
                <a
                  href="#/home"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('#/home');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    hashRoute === '#/home' || hashRoute === ''
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-house w-5 text-center text-sm" />
                  <span>Home</span>
                </a>

                <a
                  href="#/products"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedCategory('All');
                    navigate('#/products');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    hashRoute.startsWith('#/products')
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-layer-group w-5 text-center text-sm" />
                  <span>All Products Catalog</span>
                </a>

                <a
                  href="#/wishlist"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('#/wishlist');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    hashRoute.startsWith('#/wishlist')
                      ? 'text-rose-600 bg-rose-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-heart w-5 text-center text-rose-500 text-sm" />
                    <span>Wishlist</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 font-mono-num">
                    {wishlistIds.length}
                  </span>
                </a>

                <a
                  href="https://wa.me/919011221665"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl flex items-center gap-3 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <i className="fa-brands fa-whatsapp w-5 text-center text-emerald-600 text-base" />
                  <span>Direct WhatsApp Support</span>
                </a>

                <a
                  href="#store-location"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    handleNavigateToStoreLocation();
                  }}
                  className="p-3 rounded-xl flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <i className="fa-solid fa-store w-5 text-center text-sm text-blue-600" />
                  <span>Store Showroom Location</span>
                </a>

                <a
                  href="#/account"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('#/account');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${
                    hashRoute.startsWith('#/account')
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <i className="fa-solid fa-user w-5 text-center text-sm" />
                  <span>Account &amp; Orders</span>
                </a>

                {isAdminAuthenticated && (
                  <a
                    href="#/admin"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('#/admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-3 rounded-xl flex items-center gap-3 text-purple-700 bg-purple-50 font-bold transition-colors"
                  >
                    <i className="fa-solid fa-sliders w-5 text-center text-purple-600 text-sm" />
                    <span>Store Owner Admin</span>
                  </a>
                )}
              </nav>
            </div>

            {/* User Profile / Login */}
            <div className="pt-4 border-t border-slate-200 mt-4 flex flex-col gap-2.5">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    handleGoogleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-right-from-bracket" />
                  <span>Sign Out ({currentUser.displayName || currentUser.email})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    navigate('#/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-right-to-bracket" />
                  <span>Login / Register</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* MAIN VIEWPORT (With bottom padding on mobile to accommodate sticky bottom bar) */}
      <main className="flex-1 pb-16 md:pb-0">{renderMainView()}</main>

      {/* STICKY BOTTOM NAVIGATION BAR FOR MOBILE */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 flex items-center justify-around shadow-lg">
        {/* Home */}
        <button
          type="button"
          onClick={() => navigate('#/home')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            hashRoute === '#/home' || hashRoute === '' ? 'text-blue-600' : 'text-slate-600'
          }`}
        >
          <i className="fa-solid fa-house text-base" />
          <span>Home</span>
        </button>

        {/* Categories / Catalog */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('All');
            navigate('#/products');
          }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            hashRoute.startsWith('#/products') ? 'text-blue-600' : 'text-slate-600'
          }`}
        >
          <i className="fa-solid fa-layer-group text-base" />
          <span>Catalog</span>
        </button>

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => navigate('#/wishlist')}
          className={`relative flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            hashRoute.startsWith('#/wishlist') ? 'text-rose-600' : 'text-slate-600'
          }`}
        >
          <i className="fa-solid fa-heart text-base text-rose-500" />
          <span>Wishlist</span>
          {wishlistIds.length > 0 && (
            <span className="absolute -top-1 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white font-mono-num leading-tight">
              {wishlistIds.length}
            </span>
          )}
        </button>

        {/* WhatsApp Direct */}
        <a
          href="https://wa.me/919011221665"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-[#25D366]"
        >
          <i className="fa-brands fa-whatsapp text-xl" />
          <span>WhatsApp</span>
        </a>

        {/* Cart */}
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-800"
        >
          <i className="fa-solid fa-bag-shopping text-base text-blue-600" />
          <span>Cart</span>
          {totalCartItems > 0 && (
            <span className="absolute -top-1 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#FFB703] text-slate-900 font-mono-num leading-tight">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {/* CLEAN FOOTER */}
      {!isAdminRoute && (
        <footer id="store-location" className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
              {/* Brand & Store Info */}
              <div className="md:col-span-5 space-y-3.5">
                <CrazyMobilesLogo variant="horizontal" size="md" theme="dark" />
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Crazy Mobiles is your premier Indian destination for genuine smartwatches, wireless earbuds, fast GaN chargers, durable cables, and phone accessories.
                </p>
                <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                  <p className="flex items-start gap-2">
                    <i className="fa-solid fa-location-dot text-[#84F229] mt-0.5" />
                    <span>Shop No 02, Nizamuddin Road, Shahaganj, Aurangabad, Maharashtra - 431001</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <i className="fa-solid fa-phone text-[#84F229]" />
                    <span>+91 9011221665</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <i className="fa-solid fa-envelope text-[#84F229]" />
                    <span>Shaikhshoeb2624@gmail.com</span>
                  </p>
                </div>
              </div>

              {/* Quick Category Links */}
              <div className="md:col-span-3 space-y-2.5 text-xs">
                <h3 className="font-bold text-white uppercase tracking-wider">Top Categories</h3>
                <ul className="space-y-1.5 text-slate-400">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('Smart Watches');
                        navigate('#/products');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Smart Watches
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('Earbuds');
                        navigate('#/products');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Wireless Earbuds
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('Neckbands');
                        navigate('#/products');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Bluetooth Neckbands
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('Chargers & Cables');
                        navigate('#/products');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Fast Chargers &amp; Cables
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('Mobile Covers');
                        navigate('#/products');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Cases &amp; Tempered Glass
                    </button>
                  </li>
                </ul>
              </div>

              {/* Customer Care & Policies */}
              <div className="md:col-span-4 space-y-2.5 text-xs">
                <h3 className="font-bold text-white uppercase tracking-wider">Customer Care</h3>
                <ul className="space-y-1.5 text-slate-400">
                  <li>
                    <button
                      type="button"
                      onClick={() => setIsTrackModalOpen(true)}
                      className="hover:text-white transition-colors"
                    >
                      Track Your Order Status
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('#/checkout')}
                      className="hover:text-white transition-colors"
                    >
                      Express Checkout (COD / UPI)
                    </button>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/919011221665"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25D366] hover:underline flex items-center gap-1.5"
                    >
                      <i className="fa-brands fa-whatsapp text-sm" />
                      <span>Direct WhatsApp Support (+91 9011221665)</span>
                    </a>
                  </li>
                  <li>
                    <span className="text-slate-400">7 Days Easy Replacement &amp; Doorstep Delivery</span>
                  </li>
                </ul>

                {/* Payment Methods Badges */}
                <div className="pt-3">
                  <span className="block text-[11px] text-slate-400 mb-1.5">100% Secure Payments</span>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-white font-bold">
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">UPI</span>
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">GPay</span>
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">PhonePe</span>
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">Paytm</span>
                    <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-[#84F229]">Cash on Delivery</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span>© 2026 Crazy Mobiles (CRAZY MOBILE SHOP AND MULTISERVICES). All rights reserved.</span>
              <span>Proprietor: Shaikh Shoeb · Aurangabad, Maharashtra</span>
            </div>
          </div>
        </footer>
      )}

      {/* SLIDE-IN CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          navigate('#/checkout');
        }}
        onNavigateShop={() => navigate('#/products')}
      />

      {/* QUICK VIEW MODAL */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onViewFullDetails={(id) => navigate(`#/product/${id}`)}
      />

      {/* TRACK ORDER MODAL */}
      <TrackOrderModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        orders={orders}
        initialOrderId={trackOrderId}
      />

      {/* YOUR DEVICE CONSUMER MODAL */}
      <YourDeviceModal
        isOpen={isYourDeviceModalOpen}
        onClose={() => setIsYourDeviceModalOpen(false)}
        products={products}
        currentDevice={userSelectedDevice}
        onSetDevice={(dev) => {
          handleSetUserDevice(dev);
          showToast(`Device updated to ${dev}`);
        }}
        onNavigateCatalogForDevice={(dev) => {
          setSearchQuery(dev);
          navigate('#/products');
        }}
        onNavigateProduct={(id) => navigate(`#/product/${id}`)}
      />
    </div>
  );
}
