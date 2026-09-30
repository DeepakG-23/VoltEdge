import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_HOME_PAGE_CONFIG,
  HomePageConfig,
  Order,
  OrderStatus,
  Product,
  TEMPERED_GLASS_SVG,
  TrendingSpotlightItem,
  formatINR,
} from '../data/seedData';
import { ResilientImage } from './ResilientImage';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Chart?: any;
  }
}

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  homeConfig?: HomePageConfig;
  onUpdateHomeConfig?: (config: HomePageConfig) => void;
  onAddProduct: (newProduct: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onResetDemoData: () => void;
  onExitAdmin: () => void;
  onAdminLogout?: () => void;
  showToast: (msg: string) => void;
}

function readAndOptimizeDeviceImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'customers'
  | 'reports'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  homeConfig = DEFAULT_HOME_PAGE_CONFIG,
  onUpdateHomeConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onResetDemoData,
  onExitAdmin,
  onAdminLogout,
  showToast,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('voltedge_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [settingsSubTab, setSettingsSubTab] = useState<
    'all' | 'sales' | 'trending' | 'hero' | 'general'
  >('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Local editable Home Page Configuration state synced with parent prop
  const [localHomeConfig, setLocalHomeConfig] = useState<HomePageConfig>(homeConfig);
  useEffect(() => {
    setLocalHomeConfig(homeConfig);
  }, [homeConfig]);

  const updateAndSaveHomeConfig = (
    updater: (prev: HomePageConfig) => HomePageConfig,
    toastMessage?: string
  ) => {
    setLocalHomeConfig((prev) => {
      const next = updater(prev);
      if (onUpdateHomeConfig) {
        onUpdateHomeConfig(next);
      }
      return next;
    });
    if (toastMessage) {
      showToast(toastMessage);
    }
  };

  // New Trending Spotlight Form State (Photo + Existing Product + Description)
  const [newSpotlightProductId, setNewSpotlightProductId] = useState<number>(
    products[0]?.id || 1
  );
  const [newSpotlightTitle, setNewSpotlightTitle] = useState<string>(
    products[0]?.name || ''
  );
  const [newSpotlightDescription, setNewSpotlightDescription] = useState<string>(
    products[0]?.description || ''
  );
  const [newSpotlightImage, setNewSpotlightImage] = useState<string>(
    products[0]?.image || ''
  );
  const [newSpotlightBadge, setNewSpotlightBadge] = useState<string>(
    'TRENDING SPOTLIGHT'
  );
  const [isUploadingSpotlightPhoto, setIsUploadingSpotlightPhoto] = useState(false);
  const spotlightFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSelectSpotlightExistingProduct = (prodId: number) => {
    setNewSpotlightProductId(prodId);
    const found = products.find((p) => p.id === prodId);
    if (found) {
      setNewSpotlightTitle(found.name);
      setNewSpotlightDescription(found.description);
      setNewSpotlightImage(found.image);
      setNewSpotlightBadge(`TRENDING · ${found.category.toUpperCase()}`);
    }
  };

  const handleSpotlightPhotoUpload = async (
    files: FileList | File[] | null
  ) => {
    if (!files || files.length === 0) return;
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setIsUploadingSpotlightPhoto(true);
    try {
      const optimized = await readAndOptimizeDeviceImage(file);
      setNewSpotlightImage(optimized);
      showToast('Trending section photo uploaded from device');
    } catch {
      showToast('Could not process image file');
    } finally {
      setIsUploadingSpotlightPhoto(false);
    }
  };

  const handleAddTrendingSpotlight = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedProd =
      products.find((p) => p.id === newSpotlightProductId) || products[0];
    if (!linkedProd) return;

    const newItem: TrendingSpotlightItem = {
      id: `trend-spot-${Date.now()}`,
      productId: linkedProd.id,
      customTitle: newSpotlightTitle.trim() || linkedProd.name,
      customDescription:
        newSpotlightDescription.trim() || linkedProd.description,
      customImage: newSpotlightImage || linkedProd.image,
      badgeLabel:
        newSpotlightBadge.trim() ||
        `TRENDING · ${linkedProd.category.toUpperCase()}`,
    };

    updateAndSaveHomeConfig(
      (prev) => ({
        ...prev,
        trendingSpotlights: [newItem, ...prev.trendingSpotlights],
        trendingProductIds: prev.trendingProductIds.includes(linkedProd.id)
          ? prev.trendingProductIds
          : [linkedProd.id, ...prev.trendingProductIds],
      }),
      `Added "${newItem.customTitle}" to Trending Spotlight Section!`
    );
  };

  const handleRemoveTrendingSpotlight = (spotlightId: string) => {
    updateAndSaveHomeConfig(
      (prev) => ({
        ...prev,
        trendingSpotlights: prev.trendingSpotlights.filter(
          (s) => s.id !== spotlightId
        ),
      }),
      'Removed Trending Spotlight card'
    );
  };

  const toggleProductIdInList = (
    listKey: 'heroFeaturedProductIds' | 'saleProductIds' | 'trendingProductIds',
    productId: number,
    label: string
  ) => {
    updateAndSaveHomeConfig((prev) => {
      const exists = prev[listKey].includes(productId);
      const updatedList = exists
        ? prev[listKey].filter((id) => id !== productId)
        : [...prev[listKey], productId];
      return {
        ...prev,
        [listKey]: updatedList,
      };
    }, `Updated ${label} product selection`);
  };

  const handleApplySalePercentageToCatalogPrices = () => {
    const pct = Math.min(85, Math.max(5, Number(localHomeConfig.salesPercentage) || 20));
    let count = 0;
    products.forEach((p) => {
      if (localHomeConfig.saleProductIds.includes(p.id)) {
        const discountedPrice = Math.max(
          99,
          Math.round(p.originalPrice * (1 - pct / 100))
        );
        onUpdateProduct({
          ...p,
          price: discountedPrice,
          badge: 'Sale',
        });
        count += 1;
      }
    });
    showToast(
      `Applied ${pct}% sale discount to ${count} selected product(s) in catalog!`
    );
  };

  // Product Modal State (Add / Edit with Multi-Image Device Upload)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('1499');
  const [formOriginalPrice, setFormOriginalPrice] = useState('2499');
  const [formCategory, setFormCategory] = useState<Product['category']>('Power Banks');
  const [formStock, setFormStock] = useState('35');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reports Date Range State
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('7d');
  const [startDate, setStartDate] = useState('2026-09-23');
  const [endDate, setEndDate] = useState('2026-09-29');

  // Settings State
  const [storeName, setStoreName] = useState('VoltEdge India');
  const [supportEmail, setSupportEmail] = useState('support@voltedge.in');
  const [freeShipLimit, setFreeShipLimit] = useState('499');
  const [codEnabled, setCodEnabled] = useState(true);

  // Chart Refs
  const lineChartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineChartInstanceRef = useRef<any>(null);

  const barChartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const barChartInstanceRef = useRef<any>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const idLower = username.trim().toLowerCase();
    if (
      (idLower === 'owner@voltedge.in' || idLower === 'admin') &&
      (password === 'VoltEdge@Owner2026' || password === 'voltedge123')
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('voltedge_admin_auth', 'true');
      setLoginError('');
      showToast('Signed in to VoltEdge Admin Console');
    } else {
      setLoginError('Invalid owner credentials.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('voltedge_admin_auth');
    showToast('Logged out of Admin Console');
    if (onAdminLogout) {
      onAdminLogout();
    }
  };

  // KPI Calculations
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = orders.length;
  const uniqueCustomerPhones = new Set(orders.map((o) => o.phone));
  const totalCustomersCount = Math.max(uniqueCustomerPhones.size, 6);
  const avgOrderValue =
    totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Render Dashboard Revenue Line Chart (Chart.js)
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'dashboard') return;
    const canvas = lineChartCanvasRef.current;
    if (!canvas || !window.Chart) return;

    if (lineChartInstanceRef.current) {
      lineChartInstanceRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradientFill = ctx.createLinearGradient(0, 0, 0, 280);
    gradientFill.addColorStop(0, 'rgba(108, 99, 255, 0.38)');
    gradientFill.addColorStop(0.6, 'rgba(255, 107, 53, 0.12)');
    gradientFill.addColorStop(1, 'rgba(10, 10, 11, 0)');

    const borderGrad = ctx.createLinearGradient(0, 0, 600, 0);
    borderGrad.addColorStop(0, '#6C63FF');
    borderGrad.addColorStop(1, '#FF6B35');

    lineChartInstanceRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: [
          '23 Sep',
          '24 Sep',
          '25 Sep',
          '26 Sep',
          '27 Sep',
          '28 Sep',
          '29 Sep',
        ],
        datasets: [
          {
            label: 'Revenue (₹)',
            data: [14890, 19450, 24298, 21098, 28490, 34596, 41290],
            borderColor: borderGrad,
            backgroundColor: gradientFill,
            borderWidth: 3,
            fill: true,
            tension: 0.42,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#6C63FF',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A1A1F',
            titleColor: '#FFFFFF',
            bodyColor: '#A0A0B0',
            borderColor: 'rgba(108, 99, 255, 0.4)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label: (context: any) =>
                ` Revenue: ₹${Number(context.raw).toLocaleString('en-IN')}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#A0A0B0', font: { family: 'JetBrains Mono', size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#A0A0B0',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (val: number | string) =>
                '₹' + Number(val).toLocaleString('en-IN'),
            },
          },
        },
      },
    });

    return () => {
      if (lineChartInstanceRef.current) {
        lineChartInstanceRef.current.destroy();
      }
    };
  }, [isAuthenticated, activeTab, orders]);

  // Render Reports Revenue Bar Chart (Chart.js)
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'reports') return;
    const canvas = barChartCanvasRef.current;
    if (!canvas || !window.Chart) return;

    if (barChartInstanceRef.current) {
      barChartInstanceRef.current.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barGrad = ctx.createLinearGradient(0, 0, 0, 260);
    barGrad.addColorStop(0, '#6C63FF');
    barGrad.addColorStop(1, '#FF6B35');

    const multiplier =
      dateRange === '7d' ? 1 : dateRange === '30d' ? 3.8 : dateRange === '90d' ? 9.5 : 18.2;

    barChartInstanceRef.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          'Power Banks',
          'Earbuds',
          'Chargers & Cables',
          'Phone Cases',
          'Screen Protectors',
          'Smart Watches',
        ],
        datasets: [
          {
            label: 'Category Revenue (₹)',
            data: [
              Math.round(62475 * multiplier),
              Math.round(53982 * multiplier),
              Math.round(41860 * multiplier),
              Math.round(28970 * multiplier),
              Math.round(19550 * multiplier),
              Math.round(11660 * multiplier),
            ],
            backgroundColor: barGrad,
            borderRadius: 8,
            maxBarThickness: 44,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#A0A0B0', font: { family: 'Inter', size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#A0A0B0',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (val: number | string) =>
                '₹' + Number(val).toLocaleString('en-IN'),
            },
          },
        },
      },
    });

    return () => {
      if (barChartInstanceRef.current) {
        barChartInstanceRef.current.destroy();
      }
    };
  }, [isAuthenticated, activeTab, dateRange]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('1499');
    setFormOriginalPrice('2499');
    setFormCategory('Power Banks');
    setFormStock('40');
    setUploadedImages([]);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormOriginalPrice(String(product.originalPrice));
    setFormCategory(product.category);
    setFormStock(String(product.stock));
    const existingGalleryUrls =
      product.gallery && product.gallery.length > 0
        ? product.gallery.map((g) => g.url)
        : [product.image];
    const uniqueUrls = Array.from(new Set([product.image, ...existingGalleryUrls])).filter(
      Boolean
    );
    setUploadedImages(uniqueUrls);
    setIsProductModalOpen(true);
  };

  const handleProcessSelectedFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      showToast('Please select valid image files (JPG, PNG, WEBP, SVG).');
      return;
    }

    setIsUploadingFiles(true);
    try {
      const processedUrls = await Promise.all(
        files.map((file) => readAndOptimizeDeviceImage(file))
      );
      setUploadedImages((prev) => [...prev, ...processedUrls]);
      showToast(`Uploaded ${processedUrls.length} image(s) from your device`);
    } catch {
      showToast('Could not process one or more selected images.');
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveUploadedImage = (idxToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSetPrimaryImage = (idxToPromote: number) => {
    setUploadedImages((prev) => {
      if (idxToPromote <= 0 || idxToPromote >= prev.length) return prev;
      const chosen = prev[idxToPromote];
      const rest = prev.filter((_, idx) => idx !== idxToPromote);
      return [chosen, ...rest];
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Math.max(1, Number(formPrice) || 999);
    const numericOriginal = Math.max(
      numericPrice,
      Number(formOriginalPrice) || numericPrice + 500
    );
    const numericStock = Math.max(0, Number(formStock) || 0);
    const fallbackPlaceholder = `https://placehold.co/400x400/1A1A1F/6C63FF?text=${encodeURIComponent(
      formName.trim() || 'VoltEdge'
    )}`;
    const primaryImg = uploadedImages[0] || fallbackPlaceholder;
    const galleryList =
      uploadedImages.length > 0
        ? uploadedImages.map((url, idx) => ({
            label: idx === 0 ? 'Primary View' : `Product View ${idx + 1}`,
            url,
          }))
        : [
            { label: 'Studio View', url: primaryImg },
            { label: 'Internal Architecture', url: TEMPERED_GLASS_SVG },
          ];

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: formName.trim(),
        shortName: formName.trim().replace(/^VoltEdge\s+/i, ''),
        price: numericPrice,
        originalPrice: numericOriginal,
        category: formCategory,
        stock: numericStock,
        image: primaryImg,
        gallery: galleryList,
      });
      showToast(
        `Updated "${formName.trim()}" (${uploadedImages.length || 1} photo${
          uploadedImages.length === 1 ? '' : 's'
        })`
      );
    } else {
      onAddProduct({
        name: formName.trim() || 'VoltEdge Custom Accessory',
        shortName: (formName.trim() || 'Custom Accessory').replace(/^VoltEdge\s+/i, ''),
        price: numericPrice,
        originalPrice: numericOriginal,
        rating: 4.8,
        reviewsCount: 124,
        category: formCategory,
        stock: numericStock,
        image: primaryImg,
        placeholderUrl: fallbackPlaceholder,
        gallery: galleryList,
        tagline: 'Precision-engineered VoltEdge mobile performance accessory.',
        description:
          'Designed in-house for durability, high-efficiency power transfer, and seamless compatibility.',
        colors: [
          { name: 'Obsidian Black', hex: '#141418' },
          { name: 'Titanium Gray', hex: '#7A7A85' },
        ],
        sizes: ['Standard Edition', 'Pro Edition'],
        sizeLabel: 'Edition',
        specs: [
          { label: 'Build Material', value: 'Anodized Aluminum & Polycarbonate' },
          { label: 'Certification', value: 'BIS Certified India' },
          { label: 'Warranty', value: '1-Year Replacement Warranty' },
        ],
        starBreakdown: { 5: 80, 4: 15, 3: 5, 2: 0, 1: 0 },
        reviews: [],
        createdAt: new Date().toISOString().slice(0, 10),
      });
      showToast(
        `Added "${formName.trim()}" with ${uploadedImages.length || 1} product photo(s)`
      );
    }

    setIsProductModalOpen(false);
  };

  // Status semantic styling (always pairs color with explicit label & icon)
  const getOrderStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Packed':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Shipped':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  // Aggregate Customers List
  const customersMap = new Map<
    string,
    {
      name: string;
      phone: string;
      city: string;
      state: string;
      ordersCount: number;
      totalSpent: number;
      lastDate: string;
    }
  >();

  orders.forEach((o) => {
    const existing = customersMap.get(o.phone);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += o.total;
    } else {
      customersMap.set(o.phone, {
        name: o.customerName,
        phone: o.phone,
        city: o.address.city,
        state: o.address.state,
        ordersCount: 1,
        totalSpent: o.total,
        lastDate: o.date,
      });
    }
  });

  const customersList = Array.from(customersMap.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );

  /* ========================================================================
     LOGIN VIEW (Centered card, "Admin Login", admin / voltedge123)
     ======================================================================== */
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-12 animate-page-enter">
        <div className="w-full max-w-md bg-[#111113] border border-white/10 rounded-[16px] p-8 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-electric-gradient flex items-center justify-center text-white shadow-electric-glow">
                <i className="fa-solid fa-bolt text-sm" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white">
                  Admin Login
                </h1>
                <p className="text-xs text-[#A0A0B0]">VoltEdge Operations Console</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onExitAdmin}
              className="text-xs text-[#A0A0B0] hover:text-white"
            >
              ← Store
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-[8px] bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                id="admin-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]"
              />
              <label
                htmlFor="admin-username"
                className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
              >
                Username
              </label>
            </div>

            <div className="relative">
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]"
              />
              <label
                htmlFor="admin-password"
                className="absolute left-4 top-2 text-[10px] text-[#A0A0B0] transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-xs peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[#6C63FF]"
              >
                Password
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-[8px] bg-electric-gradient text-white font-display text-sm font-semibold shadow-electric-glow hover:scale-[1.01] transition-all btn-interactive"
            >
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.07] flex items-center justify-between text-xs text-[#A0A0B0]">
            <span>
              Demo: <code className="text-white font-mono-num">admin</code> /{' '}
              <code className="text-white font-mono-num">voltedge123</code>
            </span>
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('voltedge123');
              }}
              className="text-[#6C63FF] hover:underline font-medium"
            >
              Auto-Fill
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
     AUTHENTICATED ADMIN WORKSPACE (Left Sidebar 240px + Main Content Area)
     ======================================================================== */
  const sidebarItems: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'products', label: 'Products', icon: 'fa-box-open' },
    { id: 'orders', label: 'Orders', icon: 'fa-receipt' },
    { id: 'customers', label: 'Customers', icon: 'fa-users' },
    { id: 'reports', label: 'Reports', icon: 'fa-chart-pie' },
    { id: 'settings', label: 'Settings', icon: 'fa-sliders' },
  ];

  return (
    <div className="min-h-[calc(100vh-4.25rem)] flex flex-col lg:flex-row bg-[#0A0A0B] animate-page-enter">
      {/* LEFT SIDEBAR (240px on desktop) */}
      <aside className="w-full lg:w-[240px] shrink-0 bg-[#111113] border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col justify-between">
        <div className="p-4 lg:p-5">
          <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-white/[0.07]">
            <div>
              <span className="font-display text-sm font-bold text-white block">
                VoltEdge Admin
              </span>
              <span className="text-[11px] text-[#6B6B7B]">Merchant Portal</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active" />
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
            {sidebarItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-electric-gradient text-white shadow-electric-glow'
                      : 'text-[#A0A0B0] hover:text-white hover:bg-[#1A1A1F]'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} w-4 text-center`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Home Page CMS Shortcuts under Sidebar Navigation */}
          <div className="hidden lg:block mt-5 pt-4 border-t border-white/[0.07]">
            <span className="text-[10px] font-mono-num uppercase tracking-wider text-[#6B6B7B] block mb-2 px-2">
              Home Page CMS (Settings)
            </span>
            <div className="space-y-1">
              {(
                [
                  {
                    sub: 'sales',
                    label: 'Sales Menu (Sliding Bar)',
                    icon: 'fa-percent',
                    badge: `${localHomeConfig.salesPercentage}%`,
                  },
                  {
                    sub: 'trending',
                    label: 'Trending Section & Photos',
                    icon: 'fa-fire',
                    badge: `${localHomeConfig.trendingSpotlights.length}`,
                  },
                  {
                    sub: 'hero',
                    label: 'Main Home Hero Division',
                    icon: 'fa-Tv',
                    badge: `${localHomeConfig.heroFeaturedProductIds.length}`,
                  },
                ] as const
              ).map((entry) => {
                const isSubActive =
                  activeTab === 'settings' && settingsSubTab === entry.sub;
                return (
                  <button
                    key={entry.sub}
                    type="button"
                    onClick={() => {
                      setActiveTab('settings');
                      setSettingsSubTab(entry.sub);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] text-[11px] font-medium transition-all ${
                      isSubActive
                        ? 'bg-[#6C63FF]/20 text-white border border-[#6C63FF]/40'
                        : 'text-[#A0A0B0] hover:text-white hover:bg-[#1A1A1F]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <i
                        className={`fa-solid ${
                          entry.sub === 'hero'
                            ? 'fa-table-columns'
                            : entry.icon
                        } text-[#FF6B35] text-[10px] w-3.5 text-center`}
                      />
                      <span className="truncate">{entry.label}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono-num text-white shrink-0">
                      {entry.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hidden lg:block p-5 border-t border-white/[0.07] space-y-2">
          <button
            type="button"
            onClick={onExitAdmin}
            className="w-full px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] hover:bg-[#24242C] text-xs text-[#A0A0B0] hover:text-white flex items-center gap-2 transition-colors"
          >
            <i className="fa-solid fa-store text-xs" />
            <span>View Storefront</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3.5 py-2 rounded-[8px] text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
          >
            <i className="fa-solid fa-right-from-bracket text-xs" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1240px]">
        {/* Top Bar Contract: Breadcrumb left, Primary Actions right */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2 text-xs text-[#A0A0B0]">
            <span>Admin Console</span>
            <span>/</span>
            <span className="text-white font-semibold capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <button
                type="button"
                onClick={openAddProductModal}
                className="px-4 py-2 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow flex items-center gap-2 whitespace-nowrap"
              >
                <i className="fa-solid fa-plus text-[10px]" />
                <span>Add Product</span>
              </button>
            )}
            <button
              type="button"
              onClick={onExitAdmin}
              className="lg:hidden px-3 py-1.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white"
            >
              Storefront
            </button>
          </div>
        </div>

        {/* ====================================================================
           TAB 1: DASHBOARD VIEW
           ==================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-page-enter">
            {/* 4 KPI Cards in a Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Revenue (₹)',
                  value: formatINR(totalRevenue),
                  trend: '↑ 14.2%',
                  isPositive: true,
                  sub: 'vs last 7 days',
                },
                {
                  label: 'Total Orders',
                  value: totalOrdersCount.toLocaleString('en-IN'),
                  trend: '↑ 12.0%',
                  isPositive: true,
                  sub: '100% dispatch rate',
                },
                {
                  label: 'Active Customers',
                  value: totalCustomersCount.toLocaleString('en-IN'),
                  trend: '↑ 8.5%',
                  isPositive: true,
                  sub: 'Repeat buyer ratio 34%',
                },
                {
                  label: 'Avg Order Value',
                  value: formatINR(avgOrderValue),
                  trend: '↓ 3.1%',
                  isPositive: false,
                  sub: 'Target ₹2,800',
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="bg-[#1A1A1F] rounded-[16px] p-5 border border-white/[0.07]"
                >
                  <div className="flex items-center justify-between text-xs text-[#A0A0B0] mb-2">
                    <span>{kpi.label}</span>
                    <span
                      className={`font-mono-num font-semibold ${
                        kpi.isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {kpi.trend}
                    </span>
                  </div>
                  <div className="font-display text-2xl font-bold text-white font-mono-num mb-1">
                    {kpi.value}
                  </div>
                  <div className="text-[11px] text-[#6B6B7B]">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Revenue Line Chart (Last 7 Days) */}
            <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.07]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Revenue Trajectory (Last 7 Days)
                  </h2>
                  <p className="text-xs text-[#A0A0B0]">
                    Daily settled GMV across UPI, Card, and COD orders in ₹
                  </p>
                </div>
                <span className="font-mono-num text-xs text-emerald-400">
                  7-Day Total: ₹1,84,112
                </span>
              </div>
              <div className="h-[280px] w-full">
                <canvas ref={lineChartCanvasRef} />
              </div>
            </div>

            {/* Recent Orders Table (5 rows) */}
            <div className="bg-[#111113] rounded-[16px] border border-white/[0.07] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-white">
                  Recent Orders
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-[#6C63FF] hover:underline"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-[11px] uppercase text-[#6B6B7B]">
                      <th className="py-3.5 px-6">Order ID</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Items</th>
                      <th className="py-3.5 px-6 text-right">Total</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-xs">
                    {orders.slice(0, 5).map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => {
                          setActiveTab('orders');
                          setExpandedOrderId(ord.id);
                        }}
                        className="hover:bg-[#1A1A1F]/60 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-6 font-mono-num font-semibold text-white whitespace-nowrap">
                          {ord.id}
                        </td>
                        <td className="py-3.5 px-6 text-white whitespace-nowrap">
                          {ord.customerName}
                          <span className="text-[#6B6B7B] block text-[11px]">
                            {ord.address.city}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-[#A0A0B0] max-w-[240px] truncate">
                          {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono-num font-semibold text-white whitespace-nowrap">
                          {formatINR(ord.total)}
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${getOrderStatusStyle(
                              ord.status
                            )}`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono-num text-[#A0A0B0] whitespace-nowrap">
                          {ord.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
           TAB 2: PRODUCTS VIEW (Table + Add/Edit/Delete Modal)
           ==================================================================== */}
        {activeTab === 'products' && (
          <div className="bg-[#111113] rounded-[16px] border border-white/[0.07] overflow-hidden animate-page-enter">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[11px] uppercase text-[#6B6B7B]">
                    <th className="py-3.5 px-6">Product</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6 text-right">Price</th>
                    <th className="py-3.5 px-6 text-right">Stock</th>
                    <th className="py-3.5 px-6">Inventory Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {products.map((prod) => {
                    const statusLabel =
                      prod.stock === 0
                        ? 'Out of Stock'
                        : prod.stock <= 10
                        ? 'Low Stock'
                        : 'In Stock';
                    const statusClass =
                      prod.stock === 0
                        ? 'text-rose-400'
                        : prod.stock <= 10
                        ? 'text-amber-400'
                        : 'text-emerald-400';

                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-[#1A1A1F]/50 transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-[8px] overflow-hidden bg-[#1A1A1F] border border-white/10 shrink-0">
                              <ResilientImage
                                src={prod.image}
                                fallbackSrc={prod.placeholderUrl}
                                alt={prod.name}
                                className="w-full h-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-display font-semibold text-white truncate max-w-[260px]">
                                {prod.name}
                              </div>
                              <div className="text-[11px] text-[#6B6B7B] font-mono-num">
                                SKU: VE-00{prod.id} · {prod.rating}★
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-[#A0A0B0] whitespace-nowrap">
                          {prod.category}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono-num font-semibold text-white whitespace-nowrap">
                          {formatINR(prod.price)}
                        </td>
                        <td className="py-3.5 px-6 text-right font-mono-num text-white whitespace-nowrap">
                          {prod.stock} units
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span className={`font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProductModal(prod)}
                              className="px-2.5 py-1.5 rounded-[6px] bg-[#1A1A1F] hover:bg-white/10 text-white text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteProduct(prod.id);
                                showToast(`Removed "${prod.shortName}"`);
                              }}
                              className="px-2.5 py-1.5 rounded-[6px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================================================
           TAB 3: ORDERS VIEW (Status dropdown + Click row to expand details)
           ==================================================================== */}
        {activeTab === 'orders' && (
          <div className="bg-[#111113] rounded-[16px] border border-white/[0.07] overflow-hidden animate-page-enter">
            <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Order Fulfillment Queue
                </h2>
                <p className="text-xs text-[#A0A0B0]">
                  Click any order row to inspect full delivery address and itemized manifest
                </p>
              </div>
              <span className="text-xs font-mono-num text-[#A0A0B0]">
                {orders.length} total orders
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[11px] uppercase text-[#6B6B7B]">
                    <th className="py-3.5 px-6">Order ID</th>
                    <th className="py-3.5 px-6">Customer</th>
                    <th className="py-3.5 px-6">Items</th>
                    <th className="py-3.5 px-6 text-right">Total</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {orders.map((ord) => {
                    const isExpanded = expandedOrderId === ord.id;
                    return (
                      <React.Fragment key={ord.id}>
                        <tr
                          onClick={() =>
                            setExpandedOrderId(isExpanded ? null : ord.id)
                          }
                          className="hover:bg-[#1A1A1F]/60 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6 font-mono-num font-semibold text-white whitespace-nowrap">
                            <i
                              className={`fa-solid fa-chevron-right text-[10px] mr-2 text-[#6B6B7B] transition-transform ${
                                isExpanded ? 'rotate-90 text-[#6C63FF]' : ''
                              }`}
                            />
                            {ord.id}
                          </td>
                          <td className="py-4 px-6 text-white whitespace-nowrap">
                            {ord.customerName}
                            <span className="block text-[11px] text-[#6B6B7B] font-mono-num">
                              +91 {ord.phone}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-[#A0A0B0]">
                            {ord.items.reduce((s, i) => s + i.quantity, 0)} unit(s)
                          </td>
                          <td className="py-4 px-6 text-right font-mono-num font-semibold text-white whitespace-nowrap">
                            {formatINR(ord.total)}
                          </td>
                          <td
                            className="py-4 px-6 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={ord.status}
                              onChange={(e) => {
                                const nextStatus = e.target.value as OrderStatus;
                                onUpdateOrderStatus(ord.id, nextStatus);
                                showToast(`Order ${ord.id} marked as ${nextStatus}`);
                              }}
                              className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border focus:outline-none ${getOrderStatusStyle(
                                ord.status
                              )} bg-[#1A1A1F]`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="py-4 px-6 text-right font-mono-num text-[#A0A0B0] whitespace-nowrap">
                            {ord.date}
                          </td>
                        </tr>

                        {/* Expanded Order Details Row */}
                        {isExpanded && (
                          <tr className="bg-[#16161C]">
                            <td colSpan={6} className="p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 text-xs">
                                  <h4 className="font-display font-bold text-white uppercase tracking-wider text-[11px]">
                                    Shipping Destination &amp; Payment
                                  </h4>
                                  <p className="text-white font-semibold">
                                    {ord.address.fullName} (+91 {ord.address.phone})
                                  </p>
                                  <p className="text-[#A0A0B0]">{ord.address.area}</p>
                                  <p className="text-[#A0A0B0]">
                                    {ord.address.city}, {ord.address.state} —{' '}
                                    <span className="font-mono-num">
                                      {ord.address.pincode}
                                    </span>
                                  </p>
                                  <p className="text-[#A0A0B0] pt-1">
                                    Payment:{' '}
                                    <strong className="text-white">
                                      {ord.paymentMethod}
                                    </strong>{' '}
                                    {ord.paymentDetails ? `(${ord.paymentDetails})` : ''}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-display font-bold text-white uppercase tracking-wider text-[11px]">
                                    Line Items Manifest
                                  </h4>
                                  <div className="space-y-2">
                                    {ord.items.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between text-xs bg-[#111113] p-2.5 rounded-[8px] border border-white/[0.06]"
                                      >
                                        <div>
                                          <span className="text-white font-medium">
                                            {item.name}
                                          </span>
                                          <span className="block text-[11px] text-[#6B6B7B]">
                                            {item.color} · {item.size} × {item.quantity}
                                          </span>
                                        </div>
                                        <span className="font-mono-num text-white font-semibold">
                                          {formatINR(item.price * item.quantity)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================================================
           TAB 4: CUSTOMERS VIEW
           ==================================================================== */}
        {activeTab === 'customers' && (
          <div className="bg-[#111113] rounded-[16px] border border-white/[0.07] overflow-hidden animate-page-enter">
            <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Customer Directory
              </h2>
              <span className="text-xs text-[#A0A0B0] font-mono-num">
                {customersList.length} verified accounts
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[11px] uppercase text-[#6B6B7B]">
                    <th className="py-3.5 px-6">Customer Name</th>
                    <th className="py-3.5 px-6">Phone (+91)</th>
                    <th className="py-3.5 px-6">Location</th>
                    <th className="py-3.5 px-6 text-right">Orders</th>
                    <th className="py-3.5 px-6 text-right">Lifetime Spend</th>
                    <th className="py-3.5 px-6 text-right">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {customersList.map((cust) => (
                    <tr key={cust.phone} className="hover:bg-[#1A1A1F]/50">
                      <td className="py-3.5 px-6 font-display font-semibold text-white">
                        {cust.name}
                      </td>
                      <td className="py-3.5 px-6 font-mono-num text-[#A0A0B0]">
                        +91 {cust.phone}
                      </td>
                      <td className="py-3.5 px-6 text-[#A0A0B0]">
                        {cust.city}, {cust.state}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono-num text-white">
                        {cust.ordersCount}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono-num font-semibold text-electric-gradient">
                        {formatINR(cust.totalSpent)}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono-num text-[#6B6B7B]">
                        {cust.lastDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ====================================================================
           TAB 5: REPORTS VIEW (Date Range Picker, Bar Chart, Top 5 Lists)
           ==================================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-page-enter">
            {/* Date Range Picker Bar */}
            <div className="bg-[#111113] rounded-[16px] p-5 border border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {(
                  [
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: '90d', label: 'Last Quarter' },
                    { id: 'ytd', label: 'Year to Date' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDateRange(preset.id)}
                    className={`px-3.5 py-2 rounded-[8px] text-xs font-semibold transition-all ${
                      dateRange === preset.id
                        ? 'bg-electric-gradient text-white'
                        : 'bg-[#1A1A1F] text-[#A0A0B0] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-white font-mono-num text-xs"
                />
                <span className="text-[#6B6B7B]">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-white font-mono-num text-xs"
                />
              </div>
            </div>

            {/* Revenue Bar Chart */}
            <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.07]">
              <h2 className="font-display text-lg font-bold text-white mb-1">
                Revenue by Category
              </h2>
              <p className="text-xs text-[#A0A0B0] mb-6">
                Gross merchandise value breakdown across hardware lines
              </p>
              <div className="h-[270px] w-full">
                <canvas ref={barChartCanvasRef} />
              </div>
            </div>

            {/* Top 5 Products & Top 5 Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 5 Products */}
              <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.07]">
                <h3 className="font-display text-base font-bold text-white mb-4">
                  Top 5 Selling Products
                </h3>
                <div className="space-y-3.5">
                  {products.slice(0, 5).map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.05] last:border-none last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#1A1A1F] text-xs font-mono-num text-[#A0A0B0] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {p.name}
                          </div>
                          <div className="text-[11px] text-[#6B6B7B]">
                            {p.reviewsCount.toLocaleString('en-IN')} units sold
                          </div>
                        </div>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-white shrink-0">
                        {formatINR(p.price * (28 - idx * 4))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 Customers */}
              <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.07]">
                <h3 className="font-display text-base font-bold text-white mb-4">
                  Top 5 Customers by Spend
                </h3>
                <div className="space-y-3.5">
                  {customersList.slice(0, 5).map((c, idx) => (
                    <div
                      key={c.phone}
                      className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.05] last:border-none last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#1A1A1F] text-xs font-mono-num text-[#A0A0B0] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-[#6B6B7B]">
                            {c.city}, {c.state} · {c.ordersCount} order(s)
                          </div>
                        </div>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-electric-gradient shrink-0">
                        {formatINR(c.totalSpent)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
           TAB 6: SETTINGS VIEW (Home Page Management: Sales Menu, Trending Page,
           Main Home Hero Selected Division & Storefront Configuration)
           ==================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-page-enter">
            {/* Sub-Menu Navigation Bar inside Admin Settings Portal */}
            <div className="bg-[#111113] rounded-[16px] p-4 sm:p-5 border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono-num uppercase tracking-wider text-[#FF6B35]">
                    ADMIN SETTINGS &amp; HOME PAGE CMS PORTAL
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  Home Screen, Sliding Sales Bar &amp; Trending Management
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'all', label: 'All Sections', icon: 'fa-layer-group' },
                    {
                      id: 'sales',
                      label: 'Sales Menu (Sliding Bar)',
                      icon: 'fa-percent',
                    },
                    {
                      id: 'trending',
                      label: 'Trending Section',
                      icon: 'fa-fire',
                    },
                    {
                      id: 'hero',
                      label: 'Main Home Division',
                      icon: 'fa-table-columns',
                    },
                    {
                      id: 'general',
                      label: 'Store & Checkout',
                      icon: 'fa-sliders',
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsSubTab(tab.id)}
                    className={`px-3.5 py-2 rounded-[8px] text-xs font-semibold flex items-center gap-2 transition-all ${
                      settingsSubTab === tab.id
                        ? 'bg-electric-gradient text-white shadow-electric-glow'
                        : 'bg-[#1A1A1F] text-[#A0A0B0] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    <i className={`fa-solid ${tab.icon} text-[11px]`} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ================================================================
               SECTION 1: SALES MENU — SLIDING SALES BAR & SALE PRODUCTS
               ================================================================ */}
            {(settingsSubTab === 'all' || settingsSubTab === 'sales') && (
              <div className="bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.08] space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/[0.07]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FF6B35]/15 border border-[#FF6B35]/30 text-[10px] font-mono-num uppercase text-[#FF6B35] mb-2">
                      <i className="fa-solid fa-bolt" /> Sales Menu · Home Page Sliding Bar
                    </span>
                    <h3 className="font-display text-lg font-bold text-white">
                      Sliding Sales Bar &amp; Discount Campaign Manager
                    </h3>
                    <p className="text-xs text-[#A0A0B0] mt-1">
                      Set the percentage of sales and select existing products from your catalog to feature in the sliding sales bar on the Home Page.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 px-4 py-2.5 rounded-[10px] bg-[#1A1A1F] border border-white/10 cursor-pointer">
                    <span className="text-xs font-semibold text-white">
                      Sliding Sales Bar Active
                    </span>
                    <input
                      type="checkbox"
                      checked={localHomeConfig.salesBarEnabled}
                      onChange={(e) =>
                        updateAndSaveHomeConfig(
                          (prev) => ({
                            ...prev,
                            salesBarEnabled: e.target.checked,
                          }),
                          e.target.checked
                            ? 'Sliding Sales Bar enabled on Home Page'
                            : 'Sliding Sales Bar hidden on Home Page'
                        )
                      }
                      className="w-4 h-4 accent-[#FF6B35]"
                    />
                  </label>
                </div>

                {/* Percentage of Sales & Campaign Headline */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                  <div className="md:col-span-5 bg-[#1A1A1F] p-4 rounded-[12px] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-white">
                        Percentage of Sales (%)
                      </label>
                      <span className="px-2.5 py-0.5 rounded-full bg-electric-gradient text-white font-mono-num text-xs font-bold">
                        {localHomeConfig.salesPercentage}% OFF
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={80}
                        step={5}
                        value={localHomeConfig.salesPercentage}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateAndSaveHomeConfig((prev) => ({
                            ...prev,
                            salesPercentage: val,
                            salePercentage: val,
                          }));
                        }}
                        className="flex-1 accent-[#FF6B35] cursor-pointer"
                      />
                      <div className="relative w-24 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={localHomeConfig.salesPercentage}
                          onChange={(e) => {
                            const val = Math.min(
                              90,
                              Math.max(1, Number(e.target.value) || 10)
                            );
                            updateAndSaveHomeConfig((prev) => ({
                              ...prev,
                              salesPercentage: val,
                              salePercentage: val,
                            }));
                          }}
                          className="w-full px-3 py-2 rounded-[8px] bg-[#111113] border border-white/15 text-xs font-mono-num font-bold text-white text-center"
                        />
                        <span className="absolute right-2.5 top-2 text-xs text-[#6B6B7B] font-mono-num">
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs text-[#A0A0B0] mb-1.5">
                      Sliding Sales Banner Headline
                    </label>
                    <input
                      type="text"
                      value={localHomeConfig.salesHeadline}
                      onChange={(e) =>
                        updateAndSaveHomeConfig((prev) => ({
                          ...prev,
                          salesHeadline: e.target.value,
                          saleCampaignTitle: e.target.value,
                        }))
                      }
                      placeholder="VOLTEDGE FLASH POWER SALE · UP TO"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="button"
                      onClick={handleApplySalePercentageToCatalogPrices}
                      className="w-full py-2.5 px-4 rounded-[8px] bg-[#FF6B35]/15 hover:bg-[#FF6B35]/25 border border-[#FF6B35]/40 text-xs font-semibold text-[#FF6B35] transition-all flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-tags text-xs" />
                      <span>
                        Apply {localHomeConfig.salesPercentage}% to Catalog Prices
                      </span>
                    </button>
                  </div>
                </div>

                {/* Select Existing Products Under Sale */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white">
                        Select Existing Products Under Sale ({localHomeConfig.saleProductIds.length} Selected)
                      </h4>
                      <p className="text-[11px] text-[#A0A0B0]">
                        Click any existing product below to add or remove it from the Home Page Sliding Sales Bar.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateAndSaveHomeConfig(
                            (prev) => ({
                              ...prev,
                              saleProductIds: products.map((p) => p.id),
                            }),
                            'Selected all products for Sliding Sales Bar'
                          )
                        }
                        className="px-2.5 py-1 rounded text-[11px] bg-[#1A1A1F] hover:bg-white/10 text-[#A0A0B0] hover:text-white"
                      >
                        Select All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                    {products.map((prod) => {
                      const isSelected = localHomeConfig.saleProductIds.includes(
                        prod.id
                      );
                      const previewSalePrice = Math.round(
                        prod.originalPrice *
                          (1 - (localHomeConfig.salesPercentage || 20) / 100)
                      );
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() =>
                            toggleProductIdInList(
                              'saleProductIds',
                              prod.id,
                              'Sales Bar'
                            )
                          }
                          className={`p-3 rounded-[12px] border text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-[#FF6B35]/12 border-[#FF6B35] shadow-sm'
                              : 'bg-[#1A1A1F]/70 border-white/[0.07] hover:border-white/20'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-[8px] bg-[#0D0D10] border border-white/10 p-1 shrink-0">
                            <ResilientImage
                              src={prod.image}
                              alt={prod.name}
                              fallbackCategory={prod.category}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">
                              {prod.shortName || prod.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono-num">
                              <span className="text-[#FF6B35] font-bold">
                                {formatINR(prod.price)}
                              </span>
                              <span className="text-[#6B6B7B] line-through">
                                {formatINR(prod.originalPrice)}
                              </span>
                              <span className="text-emerald-400 text-[10px]">
                                ({localHomeConfig.salesPercentage}% →{' '}
                                {formatINR(previewSalePrice)})
                              </span>
                            </div>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] ${
                              isSelected
                                ? 'bg-[#FF6B35] text-white'
                                : 'bg-[#111113] border border-white/15 text-transparent'
                            }`}
                          >
                            <i className="fa-solid fa-check" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
               SECTION 2: TRENDING PAGE & TRENDING SECTION SPOTLIGHT MANAGER
               (Photo + Existing Product + Product Description + Carousel Selection)
               ================================================================ */}
            {(settingsSubTab === 'all' || settingsSubTab === 'trending') && (
              <div className="bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.08] space-y-6">
                <div className="pb-4 border-b border-white/[0.07]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#6C63FF]/15 border border-[#6C63FF]/30 text-[10px] font-mono-num uppercase text-[#6C63FF] mb-2">
                    <i className="fa-solid fa-fire" /> Trending Section &amp; Editorial Spotlights
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">
                    Manage Trending Page Section (Photo, Product &amp; Description)
                  </h3>
                  <p className="text-xs text-[#A0A0B0] mt-1">
                    Add Trending Spotlight cards with a dedicated photo, a selected existing product from your catalog, and a custom product description, plus choose which existing products appear in the Trending Now carousel.
                  </p>
                </div>

                {/* Add New Trending Section Spotlight Form */}
                <form
                  onSubmit={handleAddTrendingSpotlight}
                  className="bg-[#1A1A1F]/80 rounded-[14px] p-5 border border-white/[0.08] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-sm font-bold text-white flex items-center gap-2">
                      <i className="fa-solid fa-plus-circle text-[#FF6B35]" />
                      <span>
                        Add Trending Section Spotlight (Photo + Related Product + Description)
                      </span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column: Select Existing Product, Title, Badge, Description */}
                    <div className="lg:col-span-8 space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-white mb-1.5">
                            1. Select Existing Product from Catalog *
                          </label>
                          <select
                            value={newSpotlightProductId}
                            onChange={(e) =>
                              handleSelectSpotlightExistingProduct(
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/15 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.id} · {p.name} ({formatINR(p.price)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-[#A0A0B0] mb-1.5">
                            Spotlight Badge Label
                          </label>
                          <input
                            type="text"
                            value={newSpotlightBadge}
                            onChange={(e) => setNewSpotlightBadge(e.target.value)}
                            placeholder="e.g. TRENDING #1 · GAN POWER"
                            className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/15 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-[#A0A0B0] mb-1.5">
                          2. Trending Product Headline / Title
                        </label>
                        <input
                          type="text"
                          required
                          value={newSpotlightTitle}
                          onChange={(e) => setNewSpotlightTitle(e.target.value)}
                          placeholder="Enter trending product title"
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/15 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#A0A0B0] mb-1.5">
                          3. Trending Product Description *
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={newSpotlightDescription}
                          onChange={(e) =>
                            setNewSpotlightDescription(e.target.value)
                          }
                          placeholder="Describe why this product is trending, key specs, and customer highlights..."
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#111113] border border-white/15 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                        />
                      </div>
                    </div>

                    {/* Right Column: Trending Section Photo Upload / Preview */}
                    <div className="lg:col-span-4 flex flex-col justify-between bg-[#111113] rounded-[12px] p-4 border border-white/10">
                      <div>
                        <label className="block text-xs font-semibold text-white mb-2">
                          4. Trending Section Photo
                        </label>
                        <div className="relative h-36 rounded-[10px] bg-[#0A0A0B] border border-white/10 flex items-center justify-center p-2 overflow-hidden mb-3">
                          <ResilientImage
                            src={
                              newSpotlightImage ||
                              products.find((p) => p.id === newSpotlightProductId)
                                ?.image ||
                              ''
                            }
                            alt={newSpotlightTitle}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <input
                          ref={spotlightFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            void handleSpotlightPhotoUpload(e.target.files);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => spotlightFileInputRef.current?.click()}
                            disabled={isUploadingSpotlightPhoto}
                            className="flex-1 py-2 px-3 rounded-[8px] bg-[#1A1A1F] hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-white flex items-center justify-center gap-1.5"
                          >
                            <i className="fa-solid fa-upload text-[#6C63FF]" />
                            <span>
                              {isUploadingSpotlightPhoto
                                ? 'Uploading...'
                                : 'Upload Photo from Device'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const prod = products.find(
                                (p) => p.id === newSpotlightProductId
                              );
                              if (prod) {
                                setNewSpotlightImage(prod.image);
                                showToast('Using default product photo');
                              }
                            }}
                            className="py-2 px-2.5 rounded-[8px] bg-[#1A1A1F] hover:bg-white/10 border border-white/10 text-[11px] text-[#A0A0B0] hover:text-white"
                            title="Use Product Photo"
                          >
                            <i className="fa-solid fa-rotate-left" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="mt-4 w-full py-2.5 px-4 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-plus" />
                        <span>Add to Trending Section</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Active Trending Section Spotlight Cards */}
                <div>
                  <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white mb-3">
                    Active Trending Section Spotlights ({localHomeConfig.trendingSpotlights.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localHomeConfig.trendingSpotlights.map((spot) => {
                      const linkedProduct = products.find(
                        (p) => p.id === spot.productId
                      );
                      return (
                        <div
                          key={spot.id}
                          className="p-4 rounded-[12px] bg-[#1A1A1F] border border-white/10 flex items-start gap-3.5"
                        >
                          <div className="w-20 h-20 rounded-[10px] bg-[#0D0D10] border border-white/10 p-2 shrink-0">
                            <ResilientImage
                              src={spot.customImage || linkedProduct?.image || ''}
                              alt={spot.customTitle}
                              fallbackCategory={linkedProduct?.category}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono-num uppercase text-[#FF6B35] font-semibold">
                                {spot.badgeLabel}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveTrendingSpotlight(spot.id)
                                }
                                className="text-xs text-rose-400 hover:text-rose-300"
                                title="Remove Spotlight"
                              >
                                <i className="fa-solid fa-trash-can" />
                              </button>
                            </div>
                            <h5 className="font-display text-sm font-bold text-white truncate mt-0.5">
                              {spot.customTitle}
                            </h5>
                            <p className="text-[11px] text-[#A0A0B0] line-clamp-2 mt-1">
                              {spot.customDescription}
                            </p>
                            {linkedProduct && (
                              <div className="mt-2 inline-flex items-center gap-2 px-2 py-0.5 rounded bg-[#111113] border border-white/[0.06] text-[10px] font-mono-num text-[#A0A0B0]">
                                <span>Linked: {linkedProduct.shortName}</span>
                                <span className="text-white font-bold">
                                  {formatINR(linkedProduct.price)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Select Existing Products for "Trending Now" Carousel */}
                <div className="pt-4 border-t border-white/[0.07]">
                  <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white mb-1">
                    Select Existing Products for &ldquo;Trending Now&rdquo; Carousel ({localHomeConfig.trendingProductIds.length} Selected)
                  </h4>
                  <p className="text-[11px] text-[#A0A0B0] mb-3">
                    Choose which existing products from your product list appear in the horizontal Trending Now scroller on the Home Page.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1">
                    {products.map((prod) => {
                      const isSelected =
                        localHomeConfig.trendingProductIds.includes(prod.id);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() =>
                            toggleProductIdInList(
                              'trendingProductIds',
                              prod.id,
                              'Trending Carousel'
                            )
                          }
                          className={`p-3 rounded-[12px] border text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-[#6C63FF]/15 border-[#6C63FF] shadow-sm'
                              : 'bg-[#1A1A1F]/70 border-white/[0.07] hover:border-white/20'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-[8px] bg-[#0D0D10] border border-white/10 p-1 shrink-0">
                            <ResilientImage
                              src={prod.image}
                              alt={prod.name}
                              fallbackCategory={prod.category}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">
                              {prod.shortName || prod.name}
                            </div>
                            <div className="text-[11px] font-mono-num text-[#A0A0B0]">
                              {prod.category} · {formatINR(prod.price)}
                            </div>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] ${
                              isSelected
                                ? 'bg-[#6C63FF] text-white'
                                : 'bg-[#111113] border border-white/15 text-transparent'
                            }`}
                          >
                            <i className="fa-solid fa-check" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
               SECTION 3: MAIN HOME SCREEN — SELECTED HERO DIVISION CONTROL
               ================================================================ */}
            {(settingsSubTab === 'all' || settingsSubTab === 'hero') && (
              <div className="bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.08] space-y-6">
                <div className="pb-4 border-b border-white/[0.07]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono-num uppercase text-emerald-400 mb-2">
                    <i className="fa-solid fa-table-columns" /> Main Home Screen · Selected Division Control
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">
                    Main Home Screen Showcase Division Controller
                  </h3>
                  <p className="text-xs text-[#A0A0B0] mt-1">
                    Select which existing products from your catalog are displayed inside the Main Home Screen Hero Showcase division, and customize its header titles.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#A0A0B0] mb-1.5">
                      Main Home Division Title
                    </label>
                    <input
                      type="text"
                      value={localHomeConfig.heroDivisionTitle}
                      onChange={(e) =>
                        updateAndSaveHomeConfig((prev) => ({
                          ...prev,
                          heroDivisionTitle: e.target.value,
                        }))
                      }
                      placeholder="ADMIN CURATED SHOWCASE"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#A0A0B0] mb-1.5">
                      Main Home Division Subtitle
                    </label>
                    <input
                      type="text"
                      value={localHomeConfig.heroDivisionSubtitle}
                      onChange={(e) =>
                        updateAndSaveHomeConfig((prev) => ({
                          ...prev,
                          heroDivisionSubtitle: e.target.value,
                        }))
                      }
                      placeholder="Featured Flagship Hardware"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white">
                        Select Existing Products for Main Home Screen Division ({localHomeConfig.heroFeaturedProductIds.length} Selected)
                      </h4>
                      <p className="text-[11px] text-[#A0A0B0]">
                        Click any existing product below to feature or remove it from the Main Home Screen Hero Showcase division.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                    {products.map((prod) => {
                      const isSelected =
                        localHomeConfig.heroFeaturedProductIds.includes(prod.id);
                      const orderIdx =
                        localHomeConfig.heroFeaturedProductIds.indexOf(prod.id);
                      return (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() =>
                            toggleProductIdInList(
                              'heroFeaturedProductIds',
                              prod.id,
                              'Main Home Division'
                            )
                          }
                          className={`p-3 rounded-[12px] border text-left flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'bg-emerald-500/12 border-emerald-400/60 shadow-sm'
                              : 'bg-[#1A1A1F]/70 border-white/[0.07] hover:border-white/20'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-[8px] bg-[#0D0D10] border border-white/10 p-1 shrink-0">
                            <ResilientImage
                              src={prod.image}
                              alt={prod.name}
                              fallbackCategory={prod.category}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-white truncate">
                              {prod.shortName || prod.name}
                            </div>
                            <div className="text-[11px] font-mono-num text-[#A0A0B0]">
                              {prod.category} ·{' '}
                              <span className="text-white font-bold">
                                {formatINR(prod.price)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-mono-num font-bold ${
                              isSelected
                                ? 'bg-emerald-500 text-black'
                                : 'bg-[#111113] border border-white/15 text-transparent'
                            }`}
                          >
                            {isSelected ? `#${orderIdx + 1}` : '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================
               SECTION 4: GENERAL STOREFRONT & CHECKOUT CONFIGURATION
               ================================================================ */}
            {(settingsSubTab === 'all' || settingsSubTab === 'general') && (
              <div className="bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.07] space-y-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Storefront &amp; Checkout Configuration
                  </h2>
                  <p className="text-xs text-[#A0A0B0] mt-1">
                    Manage operational parameters for VoltEdge India DTC Storefront.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-[#A0A0B0] mb-1.5">
                      Brand Display Name
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A0A0B0] mb-1.5">
                      Customer Support Desk Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#A0A0B0] mb-1.5">
                      Free Express Shipping Threshold (₹)
                    </label>
                    <input
                      type="number"
                      value={freeShipLimit}
                      onChange={(e) => setFreeShipLimit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-[12px] bg-[#1A1A1F] border border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Cash on Delivery (COD) Pan-India
                    </span>
                    <span className="text-[11px] text-[#A0A0B0]">
                      Allow buyers to pay via Cash/UPI upon delivery
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#6C63FF]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/[0.07]">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDemoData();
                      showToast(
                        'Demo products, orders, and Home Page settings restored to seed state'
                      );
                    }}
                    className="px-4 py-2.5 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300"
                  >
                    Reset LocalStorage Seed Data
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onExitAdmin}
                      className="px-5 py-2.5 rounded-[8px] bg-[#1A1A1F] hover:bg-white/10 border border-white/15 text-xs font-semibold text-white"
                    >
                      Preview Live Home Screen →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateHomeConfig) {
                          onUpdateHomeConfig(localHomeConfig);
                        }
                        showToast(
                          'All Home Page & Storefront configurations saved!'
                        );
                      }}
                      className="px-6 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL (With Multi-Image Device Upload) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsProductModalOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <form
            onSubmit={handleSaveProduct}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#111113] border border-white/15 rounded-[16px] p-6 shadow-2xl space-y-4 animate-page-enter"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-[11px] text-[#A0A0B0]">
                  Upload multiple product photos directly from your device
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-[#A0A0B0] hover:text-white"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-[#A0A0B0] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. VoltEdge Titanium MagSafe Wallet"
                className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">
                  MRP Price (₹)
                </label>
                <input
                  type="number"
                  value={formOriginalPrice}
                  onChange={(e) => setFormOriginalPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) =>
                    setFormCategory(e.target.value as Product['category'])
                  }
                  className="w-full px-3 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                >
                  <option value="Power Banks">Power Banks</option>
                  <option value="Chargers & Cables">Chargers &amp; Cables</option>
                  <option value="Screen Protectors">Screen Protectors</option>
                  <option value="Earbuds">Earbuds</option>
                  <option value="Phone Cases">Phone Cases</option>
                  <option value="Smart Watches">Smart Watches</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#A0A0B0] mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  required
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
            </div>

            {/* MULTI-IMAGE DEVICE UPLOADER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs text-[#A0A0B0]">
                  Product Photos ({uploadedImages.length} selected)
                </label>
                {uploadedImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUploadedImages([])}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Clear All Photos
                  </button>
                )}
              </div>

              {/* Hidden Native Multi-File Picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => void handleProcessSelectedFiles(e.target.files)}
                className="hidden"
              />

              {/* Interactive Device File Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFiles(true);
                }}
                onDragLeave={() => setIsDraggingFiles(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingFiles(false);
                  void handleProcessSelectedFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-[12px] border-2 border-dashed p-5 text-center transition-all ${
                  isDraggingFiles
                    ? 'border-[#6C63FF] bg-[#6C63FF]/10'
                    : 'border-white/15 bg-[#1A1A1F]/70 hover:border-[#6C63FF]/60 hover:bg-[#1A1A1F]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#111113] border border-white/10 flex items-center justify-center mx-auto mb-2.5 text-[#6C63FF]">
                  {isUploadingFiles ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-sm" />
                  ) : (
                    <i className="fa-solid fa-cloud-arrow-up text-sm" />
                  )}
                </div>
                <p className="text-xs font-semibold text-white">
                  {isUploadingFiles
                    ? 'Processing & optimizing device images...'
                    : 'Select Product Images from Device'}
                </p>
                <p className="text-[11px] text-[#A0A0B0] mt-1">
                  Click to browse or drag &amp; drop multiple photos (PNG, JPG, WEBP)
                </p>
              </div>

              {/* Uploaded Images Preview Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                  {uploadedImages.map((imgSrc, idx) => (
                    <div
                      key={`${idx}-${imgSrc.slice(0, 24)}`}
                      className={`group relative aspect-square rounded-[10px] overflow-hidden bg-[#1A1A1F] border ${
                        idx === 0
                          ? 'border-[#6C63FF] ring-1 ring-[#6C63FF]'
                          : 'border-white/10'
                      }`}
                    >
                      <ResilientImage
                        src={imgSrc}
                        alt={`Uploaded preview ${idx + 1}`}
                        className="w-full h-full"
                        imgClassName="object-cover"
                      />

                      {/* Primary / Angle Indicator */}
                      <span
                        className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono-num font-bold ${
                          idx === 0
                            ? 'bg-electric-gradient text-white'
                            : 'bg-black/75 text-[#A0A0B0]'
                        }`}
                      >
                        {idx === 0 ? 'Cover' : `#${idx + 1}`}
                      </span>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadedImage(idx)}
                        title="Remove photo"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/80 hover:bg-rose-500 text-white flex items-center justify-center text-[10px] transition-colors"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>

                      {/* Promote to Cover Button */}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute inset-x-1 bottom-1 py-1 rounded bg-black/80 hover:bg-[#6C63FF] text-[9px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Set Cover
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add More Tile */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-[10px] border border-dashed border-white/15 bg-[#1A1A1F]/50 hover:bg-[#1A1A1F] hover:border-[#6C63FF] flex flex-col items-center justify-center gap-1 text-[#A0A0B0] hover:text-white transition-all"
                  >
                    <i className="fa-solid fa-plus text-xs text-[#6C63FF]" />
                    <span className="text-[10px] font-semibold">Add More</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-[8px] bg-[#1A1A1F] text-xs text-[#A0A0B0] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploadingFiles}
                className="px-5 py-2 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow"
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
