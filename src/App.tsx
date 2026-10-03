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
    <div className="min-h-screen flex flex-col bg-[#0A0A0B] text-white selection:bg-[#6C63FF] selection:text-white">
      {/* Custom Desktop Cursor */}
      <CustomCursor />

      {/* Toast Notifications (Top-Right, auto-dismiss 3s, dark with accent left border) */}
      <div className="fixed top-20 right-4 z-[80] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-[#1A1A1F]/95 backdrop-blur-md border border-white/10 border-l-4 border-l-[#6C63FF] rounded-[10px] px-4 py-3 shadow-2xl flex items-center gap-3 animate-page-enter"
          >
            <i className="fa-solid fa-bolt text-[#FF6B35] text-xs shrink-0" />
            <span className="text-xs font-medium text-white">{t.text}</span>
          </div>
        ))}
      </div>

      {/* STICKY GLASSMORPHISM HEADER (3-Zone Top Bar Contract) */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 backdrop-blur-[20px] bg-[#0A0A0B]/80 ${
          isScrolled
            ? 'py-3 border-b border-white/[0.09] shadow-lg'
            : 'py-4 border-b border-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* ZONE 1: Official Crazy Mobiles Emblem & Futuristic Wordmark */}
          <a
            href="#/home"
            onClick={(e) => {
              e.preventDefault();
              navigate('#/home');
            }}
            className="flex items-center shrink-0 group transition-all duration-200 hover:scale-[1.02] focus:outline-none"
            aria-label={`${STORE_NAME} Home`}
          >
            <CrazyMobilesLogo variant="horizontal" size="sm" />
          </a>

          {/* ZONE 2: Storefront Division (Home, Catalog, Your Device, Store) + Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center justify-center gap-6">
            <nav className="flex items-center gap-5 text-xs font-semibold text-[#A0A0B0] shrink-0">
              <a
                href="#/home"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('#/home');
                }}
                className={`hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  hashRoute === '#/home' || hashRoute === '' ? 'text-white font-bold' : ''
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
                className={`hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  hashRoute.startsWith('#/products') ? 'text-white font-bold' : ''
                }`}
              >
                <i className="fa-solid fa-layer-group text-[11px]" />
                <span>Catalog</span>
              </a>

              <button
                type="button"
                onClick={() => setIsYourDeviceModalOpen(true)}
                className="hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1F] border border-white/15 text-white hover:border-[#6C63FF]"
              >
                <i className="fa-solid fa-mobile-screen-button text-[#FF6B35] text-[11px]" />
                <span>Your Device</span>
                {userSelectedDevice && (
                  <span className="text-[10px] text-emerald-400 font-mono-num font-bold">
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
                className="hover:text-white transition-colors whitespace-nowrap flex items-center gap-1.5 text-emerald-400 font-semibold"
              >
                <i className="fa-solid fa-store text-[11px]" />
                <span>Store</span>
              </a>
            </nav>

            {/* Search Bar with rounded-full border & subtle glow on focus */}
            <div className="relative flex-1 max-w-xs">
              <div
                className={`flex items-center rounded-full bg-[#111113] border px-3.5 py-1.5 transition-all duration-300 ${
                  searchFocused
                    ? 'border-[#6C63FF] shadow-electric-subtle'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <i className="fa-solid fa-magnifying-glass text-[#6B6B7B] text-xs mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate('#/products');
                      setSearchFocused(false);
                    }
                  }}
                  placeholder="Search GaN, MagSafe, ANC..."
                  aria-label="Search accessories"
                  className="w-full bg-transparent text-xs text-white placeholder-[#6B6B7B] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#6B6B7B] hover:text-white text-xs ml-1"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                )}
              </div>

              {/* Instant Search Dropdown */}
              {searchFocused && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#111113] border border-white/15 rounded-[12px] shadow-2xl overflow-hidden z-50">
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => {
                        navigate(`#/product/${item.id}`);
                        setSearchFocused(false);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#1A1A1F] text-left border-b border-white/[0.05] last:border-none"
                    >
                      <span className="text-xs text-white truncate">
                        {item.shortName}
                      </span>
                      <span className="text-xs font-mono-num text-[#FF6B35] shrink-0">
                        {formatINR(item.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ZONE 3: Wishlist Icon, Cart Icon (with animated badge) & Account / Admin Icon */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={STORE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Crazy Mobiles store on Google Maps"
              className="h-10 px-3 rounded-[8px] bg-[#1A1A1F] hover:bg-[#23232C] border border-white/10 text-xs font-medium text-emerald-400 flex items-center gap-1.5 transition-colors whitespace-nowrap hidden lg:flex"
            >
              <i className="fa-solid fa-location-dot text-xs text-emerald-400" />
              <span>Visit Store</span>
            </a>

            <button
              type="button"
              onClick={() => navigate('#/wishlist')}
              aria-label="Open Wishlist"
              title="Wishlist (#/wishlist)"
              className={`relative h-10 px-3.5 rounded-[8px] border flex items-center gap-2 transition-colors ${
                hashRoute.startsWith('#/wishlist')
                  ? 'bg-[#1A1A1F] border-[#FF6B35]/60 text-white'
                  : 'bg-[#1A1A1F] hover:bg-[#23232C] border-white/10 text-white'
              }`}
            >
              <i
                className={`${
                  wishlistIds.length > 0
                    ? 'fa-solid text-[#FF6B35]'
                    : 'fa-regular text-[#A0A0B0]'
                } fa-heart text-xs`}
              />
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono-num font-bold bg-white/10 text-white leading-none ${
                  wishlistBounce ? 'animate-cart-bounce' : ''
                }`}
              >
                {wishlistIds.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Open shopping cart"
              className="relative h-10 px-3.5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#23232C] border border-white/10 flex items-center gap-2 text-white transition-colors"
            >
              <i className="fa-solid fa-bag-shopping text-xs" />
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-mono-num font-bold bg-electric-gradient text-white leading-none ${
                  cartBounce ? 'animate-cart-bounce' : ''
                }`}
              >
                {totalCartItems}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('#/account')}
              aria-label="Customer Account Settings"
              title="Account Settings (#/account)"
              className={`h-10 px-3.5 rounded-[8px] border text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                hashRoute.startsWith('#/account') || hashRoute.startsWith('#/login')
                  ? 'bg-electric-gradient text-white border-transparent shadow-electric-glow'
                  : 'bg-[#1A1A1F] hover:bg-[#23232C] border-white/10 text-white'
              }`}
            >
              <i className="fa-regular fa-user text-xs" />
              <span className="hidden sm:inline">Account</span>
            </button>

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => navigate('#/admin')}
                aria-label="Store Owner Admin Console"
                title="Store Owner Admin Console (#/admin)"
                className={`h-10 px-3 rounded-[8px] border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  isAdminRoute
                    ? 'bg-electric-gradient text-white border-transparent'
                    : 'bg-[#1A1A1F] hover:bg-[#23232C] border-[#6C63FF]/50 text-white'
                }`}
              >
                <i className="fa-solid fa-sliders text-xs text-[#FF6B35]" />
                <span className="hidden xl:inline">Owner Admin</span>
              </button>
            )}

            {currentUser ? (
              <button
                type="button"
                onClick={handleGoogleSignOut}
                title={`Signed in as ${currentUser.email} (Click to Sign Out)`}
                className="h-10 px-2.5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#23232C] border border-[#6C63FF]/50 text-xs font-medium text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <span className="w-5 h-5 rounded-full bg-electric-gradient text-[10px] font-bold flex items-center justify-center text-white shrink-0">
                  {(currentUser.displayName || currentUser.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('#/login')}
                className="h-10 px-3.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-[1.02] transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <i className="fa-solid fa-right-to-bracket text-xs" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1">{renderMainView()}</main>

      {/* CLEAN FOOTER (Storefront Views Only) */}
      {!isAdminRoute && (
        <footer className="bg-[#111113] border-t border-white/[0.07] mt-20">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/[0.07]">
              {/* Col 1: Brand & Contact */}
              <div className="md:col-span-4 space-y-3.5">
                <div className="pt-1">
                  <CrazyMobilesLogo variant="horizontal" size="md" />
                </div>
                <p className="text-xs text-[#9BA9B4] max-w-sm leading-relaxed">
                  Your trusted hub for premium smartphones, genuine accessories, GaN fast chargers, MagSafe gear, and audio powerhouses. Owned &amp; managed by Shaikh Shoeb.
                </p>
                <div className="pt-1 space-y-2 text-xs text-[#9BA9B4]">
                  <a
                    href={`tel:+91${STORE_PHONE}`}
                    className="flex items-center gap-2 hover:text-[#84F229] transition-colors"
                  >
                    <i className="fa-solid fa-phone text-[#84F229] text-[11px]" />
                    <span className="font-mono-num">{STORE_PHONE_DISPLAY}</span>
                  </a>
                  <a
                    href={`mailto:${STORE_EMAIL}`}
                    className="flex items-center gap-2 hover:text-[#84F229] transition-colors"
                  >
                    <i className="fa-solid fa-envelope text-[#84F229] text-[11px]" />
                    <span>{STORE_EMAIL}</span>
                  </a>
                  <a
                    href={STORE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#84F229] hover:underline transition-colors pt-0.5"
                  >
                    <i className="fa-solid fa-map-location-dot text-[11px]" />
                    <span>Find Us on Google Maps</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                  </a>
                </div>
              </div>

              {/* Col 2: Collections */}
              <div className="md:col-span-2 space-y-2.5 text-xs">
                <h3 className="font-display font-semibold text-white">Collections</h3>
                <ul className="space-y-2 text-[#A0A0B0]">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('Power Banks');
                        navigate('#/products');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Power Banks
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
                      Fast Chargers
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
                      ANC Earbuds
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('Phone Cases');
                        navigate('#/products');
                      }}
                      className="hover:text-white transition-colors"
                    >
                      Phone Cases &amp; Mounts
                    </button>
                  </li>
                </ul>
              </div>

              {/* Col 3: Visit Store Location */}
              <div className="md:col-span-3 space-y-2.5 text-xs">
                <h3 className="font-display font-semibold text-white">Store Location</h3>
                <p className="text-xs text-[#A0A0B0] leading-relaxed">
                  Visit {STORE_NAME} in person for instant pick-up, device testing, and wholesale inquiries.
                </p>
                <div className="pt-1">
                  <a
                    href={STORE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#1A1A1F] hover:bg-[#23232C] border border-white/10 text-white font-medium hover:border-emerald-500/40 transition-all"
                  >
                    <i className="fa-solid fa-location-crosshairs text-emerald-400" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>
                <div className="pt-2 text-[11px] text-[#6B6B7B]">
                  <span>UPI ID: </span>
                  <span className="font-mono-num text-white font-medium">{STORE_UPI_ID}</span>
                </div>
              </div>

              {/* Col 4: Customer Care & Portal */}
              <div className="md:col-span-3 space-y-2.5 text-xs">
                <h3 className="font-display font-semibold text-white">
                  Customer Care &amp; Portal
                </h3>
                <ul className="space-y-2 text-[#A0A0B0]">
                  <li>
                    <button
                      type="button"
                      onClick={() => setIsTrackModalOpen(true)}
                      className="hover:text-white transition-colors"
                    >
                      Track Your Order
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('#/checkout')}
                      className="hover:text-white transition-colors"
                    >
                      Express Checkout
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => navigate('#/login')}
                      className="hover:text-white transition-colors"
                    >
                      Unified Member &amp; Owner Login
                    </button>
                  </li>
                  <li>
                    <a
                      href={`https://wa.me/91${STORE_PHONE}?text=${encodeURIComponent(
                        `Hi ${STORE_NAME}, I need assistance with an order.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25D366] hover:underline flex items-center gap-1.5 pt-1"
                    >
                      <i className="fa-brands fa-whatsapp" />
                      <span>WhatsApp Support (+91 {STORE_PHONE})</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B7B]">
              <span>© 2026 {STORE_NAME}. All rights reserved.</span>
              <span>Proprietor: Shaikh Shoeb · UPI Verified Merchant · Free Delivery</span>
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
