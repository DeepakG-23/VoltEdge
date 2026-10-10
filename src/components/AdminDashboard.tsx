import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AuditLogEntry,
  DEFAULT_HOME_PAGE_CONFIG,
  HomePageConfig,
  Order,
  OrderStatus,
  Product,
  ProductSpec,
  SEED_AUDIT_LOGS,
  STORE_EMAIL,
  STORE_MAPS_URL,
  STORE_MERCHANT_NAME,
  STORE_NAME,
  STORE_PHONE,
  STORE_PHONE_DISPLAY,
  STORE_UPI_ID,
  StorePaymentSettings,
  TEMPERED_GLASS_SVG,
  TrendingSpotlightItem,
  formatINR,
  getStorePaymentSettings,
  saveStorePaymentSettings,
} from '../data/seedData';
import { CrazyMobilesEmblem } from './CrazyMobilesLogo';
import { CrazyMobilesPaymentQR } from './CrazyMobilesPaymentQR';
import { ResilientImage } from './ResilientImage';
import { AdminOcrScreenshotReader, ExtractedProductOcrData } from './AdminOcrScreenshotReader';

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
  auditLogs?: AuditLogEntry[];
  onAddLog?: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  onClearLogs?: () => void;
  onUpdateHomeConfig?: (config: HomePageConfig) => void;
  onAddProduct: (newProduct: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onRestoreDefaultCatalog: () => void;
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
  | 'settings'
  | 'logs';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  homeConfig = DEFAULT_HOME_PAGE_CONFIG,
  auditLogs = SEED_AUDIT_LOGS,
  onAddLog,
  onClearLogs,
  onUpdateHomeConfig,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onRestoreDefaultCatalog,
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
    'all' | 'sales' | 'trending' | 'hero' | 'payments' | 'general'
  >('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Audit Logs Tab Filter & Search State
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<
    'all' | 'products' | 'orders' | 'cms' | 'auth' | 'system'
  >('all');

  // Admin Products Tab Category Filter State
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('All');

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

  // 5-Layer Structured Product Form State
  const [activeFormLayer, setActiveFormLayer] = useState<
    'basic' | 'compatibility' | 'specs' | 'description' | 'seo'
  >('basic');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formWarranty, setFormWarranty] = useState('6 Months Warranty');
  const [formTags, setFormTags] = useState('fast charge, genuine, crazy mobiles');
  const [formPhoneBrand, setFormPhoneBrand] = useState('Apple');
  const [formPhoneModels, setFormPhoneModels] = useState('iPhone 16 Pro, iPhone 15, Galaxy S24');
  const [formCompatibleDevices, setFormCompatibleDevices] = useState('Smartphones, Tablets, Laptops');
  const [formConnectorType, setFormConnectorType] = useState('USB-C');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [formSeoKeywords, setFormSeoKeywords] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSpecs, setFormSpecs] = useState<ProductSpec[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [isImportingWithAI, setIsImportingWithAI] = useState(false);
  const [importProgressStep, setImportProgressStep] = useState('');
  const [isGeneratingDescWithAI, setIsGeneratingDescWithAI] = useState(false);
  const [autoAiDescriptionEnabled, setAutoAiDescriptionEnabled] = useState(true);
  const [importedPreview, setImportedPreview] = useState<any | null>(null);

  // Helper to generate default specification fields based on Category
  const getCategoryPresetSpecs = (cat: Product['category']): ProductSpec[] => {
    switch (cat) {
      case 'Mobile Covers':
      case 'Phone Cases':
        return [
          { label: 'Case Type', value: 'MagSafe Armor Protective Case' },
          { label: 'Main Material', value: 'Polycarbonate & TPU Shock Cushion' },
          { label: 'Drop Rating', value: '12ft Military-Grade Drop Protection' },
          { label: 'MagSafe', value: 'MagSafe Compatible (N52 Magnet Ring)' },
          { label: 'Screen/Camera Lip', value: '1.5mm Elevated Bumper Rim' },
          { label: 'Finish', value: 'Matte Anti-Fingerprint Texture' },
        ];
      case 'Tempered Glass':
      case 'Screen Protectors':
        return [
          { label: 'Hardness Rating', value: '9H Tempered Glass' },
          { label: 'Glass Type', value: '28° Anti-Spy Privacy Filter' },
          { label: 'Edge Contour', value: '3D Curved Full Screen Coverage' },
          { label: 'Coating', value: 'Oleophobic Hydrophobic Oil-Resistant' },
          { label: 'Touch & Sensors', value: 'In-Display Fingerprint & Face ID Compatible' },
          { label: 'Included Kit', value: 'Dust Wipes + Alignment Applicator Frame' },
        ];
      case 'Cables':
        return [
          { label: 'Cable Type', value: 'USB-C to USB-C Fast Charging Cable' },
          { label: 'Cable Length', value: '1.5 Meter / 5 Feet' },
          { label: 'Max Power Wattage', value: '100W Power Delivery (PD 3.0)' },
          { label: 'Data Transfer Speed', value: '480 Mbps High Speed Sync' },
          { label: 'Construction', value: 'Double-Braided Nylon & Reinforced SR Joint' },
          { label: 'Warranty', value: '6 Months Replacement Warranty' },
        ];
      case 'Chargers':
      case 'Chargers & Cables':
        return [
          { label: 'Max Wattage', value: '65W GaN Fast Charger' },
          { label: 'Output Ports', value: '2x USB-C PD + 1x USB-A Quick Charge' },
          { label: 'Charging Protocol', value: 'Power Delivery 3.0 / PPS / QC 4.0' },
          { label: 'Input Voltage', value: '100-240V AC Universal Dual Pin' },
          { label: 'Safety Protections', value: 'Over-Voltage, Over-Temp, Short-Circuit IC' },
          { label: 'Warranty', value: '1-Year Official Warranty' },
        ];
      case 'Power Banks':
        return [
          { label: 'Battery Capacity', value: '10,000 mAh High-Density Li-Polymer' },
          { label: 'Max Output Wattage', value: '22.5W Fast Charge / 15W MagSafe' },
          { label: 'Ports', value: '1x USB-C PD Input/Output, 1x USB-A Output' },
          { label: 'Features', value: 'Digital LED % Display & Pass-Through Charging' },
          { label: 'Safety IC', value: 'Multi-Protect Temperature & Surge Control' },
          { label: 'Dimensions & Weight', value: '105 x 68 x 16 mm, 210g' },
        ];
      case 'Earphones':
      case 'Earbuds':
      case 'Earphones & Audio':
        return [
          { label: 'Driver Size', value: '13mm Titanium Dynamic Drivers' },
          { label: 'Connector / Wireless', value: 'Type-C Hi-Fi Audio / Bluetooth v5.4' },
          { label: 'Microphone', value: 'In-Line HD Mic with Call Control Button' },
          { label: 'Cable Material', value: 'Tangle-Free TPE Braided Cable' },
          { label: 'Compatibility', value: 'Universal Type-C Phones, Laptops & Tablets' },
        ];
      case 'Headphones':
        return [
          { label: 'Driver Size', value: '40mm Neodymium Over-Ear Drivers' },
          { label: 'Noise Cancellation', value: '35dB Hybrid Active Noise Cancellation (ANC)' },
          { label: 'Battery Playtime', value: '50 Hours ANC Off / 38 Hours ANC On' },
          { label: 'Comfort & Build', value: 'Memory Foam Ear Cushions & Foldable Hinge' },
          { label: 'Connectivity', value: 'Bluetooth v5.3 + 3.5mm AUX Backup Cable' },
        ];
      case 'Neckbands':
        return [
          { label: 'Driver Size', value: '12mm Deep Bass Drivers' },
          { label: 'Playback Time', value: '40 Hours Continuous Music Playback' },
          { label: 'Fast Charge', value: '10 Mins Charge = 10 Hours Playtime' },
          { label: 'Features', value: 'Magnetic Earbuds, ENC Call Noise Reduction' },
          { label: 'Protection Rating', value: 'IPX5 Sweat & Water Resistant' },
        ];
      case 'Wireless Accessories':
      case 'Wired Accessories':
      case 'Smart Watches':
      default:
        return [
          { label: 'Compatibility', value: 'Universal Mobile Accessories' },
          { label: 'Build Material', value: 'Anodized Aluminum Alloy & Silicone' },
          { label: 'Certification', value: 'BIS Certified India' },
          { label: 'Warranty', value: '1-Year Crazy Mobile Replacement Warranty' },
        ];
    }
  };

  // Gemini AI Helper: Monitors specifications & generates marketing-ready copy
  const monitorAndGenerateDescription = async (
    overrideSpecs?: ProductSpec[],
    silentToast = false
  ) => {
    const activeSpecs = overrideSpecs || formSpecs;
    const validSpecs = activeSpecs.filter(
      (s) => s && s.label && s.label.trim() && s.value && s.value.trim()
    );

    if (validSpecs.length === 0 && !formName.trim()) {
      return;
    }

    setIsGeneratingDescWithAI(true);
    try {
      const res = await fetch('/api/admin/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim() || `${STORE_NAME} ${formCategory}`,
          category: formCategory,
          brand: 'Crazy Mobile',
          specs: validSpecs,
          warranty: formWarranty,
          phoneBrand: formPhoneBrand,
          compatibleModels: formPhoneModels,
          connectorType: formConnectorType,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const {
            shortDescription,
            tagline,
            highlights,
            fullDescription,
            seoTitle,
            seoDescription,
            seoKeywords,
          } = json.data;

          if (shortDescription) setFormShortDescription(shortDescription);
          if (tagline) setFormTagline(tagline);
          if (fullDescription) setFormDescription(fullDescription);
          if (seoTitle) setFormSeoTitle(seoTitle);
          if (seoDescription) setFormSeoDescription(seoDescription);
          if (seoKeywords) {
            setFormSeoKeywords(
              Array.isArray(seoKeywords) ? seoKeywords.join(', ') : seoKeywords
            );
          }

          if (!silentToast) {
            showToast('✨ Gemini AI generated marketing copy & customer benefits!');
          }
          return;
        }
      }
      throw new Error('API fallback');
    } catch {
      // High quality client-side fallback synthesizer
      const name = formName.trim() || `${STORE_NAME} ${formCategory}`;
      const category = formCategory || 'Accessory';
      const specSummary = validSpecs
        .map((s) => `${s.label}: ${s.value}`)
        .join(', ');

      const clientShort = `Crafted for high-end mobile performance, the ${name} delivers ${
        validSpecs[0]
          ? `${validSpecs[0].label.toLowerCase()} of ${validSpecs[0].value}`
          : 'premium reliability'
      }. Engineered with ${
        validSpecs[1]
          ? validSpecs[1].value
          : 'heat-dissipating aerospace-grade materials'
      }, providing seamless everyday charging and protection backed by ${
        formWarranty || 'Crazy Mobile Warranty'
      }.`;

      const clientFull = `The ${name} is engineered for peak performance and everyday reliability. Featuring ${
        specSummary || 'premium quality construction'
      }, this ${category.toLowerCase()} delivers exceptional durability and high-efficiency functionality for your mobile device.\n\nBuilt with high-grade components, rigorous drop and surge testing, and seamless compatibility with ${formPhoneBrand} and modern smartphones.\n\nKey Highlights:\n${validSpecs
        .map((s) => `• ${s.label}: ${s.value}`)
        .join('\n')}`;

      setFormShortDescription(clientShort);
      setFormDescription(clientFull);
      setFormTagline(
        validSpecs[0]
          ? `Premium ${category} with ${validSpecs[0].value}`
          : `Engineered ${category} for peak performance.`
      );
      setFormSeoTitle(`${name} | Buy Online at ${STORE_NAME}`);
      setFormSeoDescription(clientShort.slice(0, 155));
      if (!silentToast) {
        showToast('✨ Synthesized customer description from specifications!');
      }
    } finally {
      setIsGeneratingDescWithAI(false);
    }
  };

  // Real-time debounce monitoring of Product Specification changes
  const specChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isProductModalOpen || !autoAiDescriptionEnabled) return;

    if (specChangeTimerRef.current) {
      clearTimeout(specChangeTimerRef.current);
    }

    const hasSpecs = formSpecs.some((s) => s.label.trim() && s.value.trim());
    if (!hasSpecs && !formName.trim()) return;

    specChangeTimerRef.current = setTimeout(() => {
      void monitorAndGenerateDescription(undefined, true);
    }, 1200);

    return () => {
      if (specChangeTimerRef.current) {
        clearTimeout(specChangeTimerRef.current);
      }
    };
  }, [
    formSpecs,
    formCategory,
    formName,
    formPhoneBrand,
    formConnectorType,
    formWarranty,
    autoAiDescriptionEnabled,
    isProductModalOpen,
  ]);

  const handleAddSpecRow = () => {
    setFormSpecs((prev) => [...prev, { label: '', value: '' }]);
  };

  const handleUpdateSpecRow = (
    idx: number,
    field: 'label' | 'value',
    val: string
  ) => {
    setFormSpecs((prev) => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], [field]: val };
      }
      return copy;
    });
  };

  const handleRemoveSpecRow = (idx: number) => {
    setFormSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleScrapeProductWithAI = async (
    e?: React.FormEvent,
    customUrlOverride?: string
  ) => {
    if (e) e.preventDefault();
    const targetUrl = (customUrlOverride || importUrl).trim();
    if (!targetUrl) {
      showToast('Please paste a product URL or select a sample to import.');
      return;
    }

    setIsImportingWithAI(true);
    setImportProgressStep('🌐 Fetching product page content & metadata...');

    try {
      const timer1 = setTimeout(() => {
        setImportProgressStep(
          '🧠 Gemini AI extracting category, specs & marketing copy...'
        );
      }, 900);

      const res = await fetch('/api/admin/scrape-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      clearTimeout(timer1);

      if (!res.ok) {
        throw new Error('Server returned error status');
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to extract product specs');
      }

      const data = json.data;
      setImportedPreview(data);

      if (data.name) setFormName(data.name);
      if (data.price) setFormPrice(String(data.price));
      if (data.originalPrice)
        setFormOriginalPrice(String(data.originalPrice));
      if (data.category)
        setFormCategory(data.category as Product['category']);
      if (data.subcategory) setFormSubcategory(data.subcategory);
      if (data.tagline) setFormTagline(data.tagline);
      if (data.shortDescription)
        setFormShortDescription(data.shortDescription);
      if (data.description) setFormDescription(data.description);
      if (data.warranty) setFormWarranty(data.warranty);
      if (data.sku) setFormSku(data.sku);
      if (Array.isArray(data.specs) && data.specs.length > 0) {
        setFormSpecs(data.specs);
      }
      if (Array.isArray(data.compatibleBrands) && data.compatibleBrands.length > 0) {
        setFormPhoneBrand(data.compatibleBrands[0]);
      }
      if (Array.isArray(data.compatibleModels) && data.compatibleModels.length > 0) {
        setFormPhoneModels(data.compatibleModels.join(', '));
      }
      if (Array.isArray(data.images) && data.images.length > 0) {
        setUploadedImages(data.images);
      }
      if (data.seoTitle) setFormSeoTitle(data.seoTitle);
      if (data.seoDescription) setFormSeoDescription(data.seoDescription);
      if (data.seoKeywords) {
        setFormSeoKeywords(
          Array.isArray(data.seoKeywords)
            ? data.seoKeywords.join(', ')
            : data.seoKeywords
        );
      }
      if (data.slug) setFormSlug(data.slug);

      showToast(
        `✨ Auto-imported "${data.name?.slice(0, 30)}..." into all 5 layers with ${
          data.specs?.length || 0
        } specifications!`
      );
    } catch {
      // Intelligent parsing fallback
      const cleanUrl = targetUrl.toLowerCase();
      let detectedCat: Product['category'] = 'Wireless Accessories';

      if (
        cleanUrl.includes('case') ||
        cleanUrl.includes('cover') ||
        cleanUrl.includes('magsafe')
      ) {
        detectedCat = 'Mobile Covers';
      } else if (
        cleanUrl.includes('glass') ||
        cleanUrl.includes('screen') ||
        cleanUrl.includes('protector')
      ) {
        detectedCat = 'Tempered Glass';
      } else if (
        cleanUrl.includes('charger') ||
        cleanUrl.includes('gan') ||
        cleanUrl.includes('adapter')
      ) {
        detectedCat = 'Chargers';
      } else if (
        cleanUrl.includes('cable') ||
        cleanUrl.includes('type-c') ||
        cleanUrl.includes('lightning')
      ) {
        detectedCat = 'Cables';
      } else if (
        cleanUrl.includes('powerbank') ||
        cleanUrl.includes('power-bank') ||
        cleanUrl.includes('battery')
      ) {
        detectedCat = 'Power Banks';
      } else if (cleanUrl.includes('watch') || cleanUrl.includes('strap')) {
        detectedCat = 'Smart Watches';
      } else if (
        cleanUrl.includes('earbud') ||
        cleanUrl.includes('tws') ||
        cleanUrl.includes('anc')
      ) {
        detectedCat = 'Earbuds';
      } else if (
        cleanUrl.includes('headphone') ||
        cleanUrl.includes('headset')
      ) {
        detectedCat = 'Headphones';
      } else if (cleanUrl.includes('neckband')) {
        detectedCat = 'Neckbands';
      }

      const urlParts = cleanUrl.replace(/https?:\/\//, '').split('/');
      const slug = urlParts.find((p) => p.length > 8) || 'Pro Mobile Accessory';
      const formattedTitle = slug
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .slice(0, 55);

      setFormName(formattedTitle);
      setFormCategory(detectedCat);
      setFormPrice('1499');
      setFormOriginalPrice('2499');
      setFormTagline(`Engineered ${detectedCat} for peak mobile performance.`);
      setFormShortDescription(
        `High-efficiency ${detectedCat.toLowerCase()} engineered with premium materials for maximum durability and fast everyday performance.`
      );
      setFormDescription(
        'Scraped e-commerce product catalog specifications auto-generated by AI.'
      );
      setFormSpecs([
        { label: 'Category', value: detectedCat },
        { label: 'Compatibility', value: 'Universal Mobile Devices' },
        { label: 'Material', value: 'Premium Grade Alloy & TPU' },
        { label: 'Warranty', value: '1-Year Official Crazy Mobile Warranty' },
      ]);
      showToast(
        `✨ Pre-populated category "${detectedCat}" and specifications for review!`
      );
    } finally {
      setIsImportingWithAI(false);
      setImportProgressStep('');
    }
  };

  // Reports Date Range State
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('7d');
  const [startDate, setStartDate] = useState('2026-09-23');
  const [endDate, setEndDate] = useState('2026-09-29');

  // Settings State
  const [storeName, setStoreName] = useState(STORE_NAME);
  const [supportEmail, setSupportEmail] = useState(STORE_EMAIL);
  const [freeShipLimit, setFreeShipLimit] = useState('499');
  const [codEnabled, setCodEnabled] = useState(true);

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<StorePaymentSettings>(() =>
    getStorePaymentSettings()
  );
  const [testQrAmount, setTestQrAmount] = useState<number>(999);

  const handleSavePaymentSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStorePaymentSettings(paymentSettings);
    if (onAddLog) {
      onAddLog({
        actor: 'Shoeb (Owner)',
        action: 'Updated Store Payment Settings & UPI Configuration',
        category: 'system',
        details: `Merchant: ${paymentSettings.merchantName} · UPI ID: ${paymentSettings.upiId} · COD: ${
          paymentSettings.enableCod ? 'Enabled' : 'Disabled'
        }`,
      });
    }
    showToast('Payment settings & UPI Gateway successfully saved and activated!');
  };

  // Chart Refs
  const lineChartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineChartInstanceRef = useRef<any>(null);

  const barChartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const barChartInstanceRef = useRef<any>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const idTrimmed = username.trim().toLowerCase();
    const passTrimmed = password.trim();
    if (
      (idTrimmed === 'shoeb' || idTrimmed === 'admin') &&
      (passTrimmed === 'admin' || passTrimmed === 'admin123' || passTrimmed === 'crazymobiles')
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('voltedge_admin_auth', 'true');
      setLoginError('');
      showToast(`Signed in to ${STORE_NAME} Admin Console`);
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

  // Recharts Sales Overview Metric State
  const [salesChartMetric, setSalesChartMetric] = useState<
    'revenue' | 'orders' | 'both'
  >('revenue');

  // Group and calculate monthly sales totals dynamically derived from the 'orders' state (recharts)
  const monthlySalesData = useMemo(() => {
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    const seriesMonths = [
      'May 2026',
      'Jun 2026',
      'Jul 2026',
      'Aug 2026',
      'Sep 2026',
      'Oct 2026',
    ];

    const dataMap: Record<
      string,
      {
        month: string;
        totalRevenue: number;
        ordersCount: number;
        avgOrder: number;
      }
    > = {};

    seriesMonths.forEach((m) => {
      dataMap[m] = {
        month: m,
        totalRevenue: 0,
        ordersCount: 0,
        avgOrder: 0,
      };
    });

    const historicalSeeds: Record<string, { rev: number; count: number }> = {
      'May 2026': { rev: 48900, count: 18 },
      'Jun 2026': { rev: 68400, count: 25 },
      'Jul 2026': { rev: 89500, count: 32 },
      'Aug 2026': { rev: 114200, count: 42 },
      'Sep 2026': { rev: 148900, count: 54 },
      'Oct 2026': { rev: 52400, count: 19 },
    };

    // Aggregate from the live `orders` state
    orders.forEach((o) => {
      let key = 'Sep 2026';
      if (o.date) {
        const parts = o.date.trim().split(' ');
        if (parts.length >= 3) {
          const rawM = parts[1];
          const rawY = parts[2];
          key = `${rawM} ${rawY}`;
        }
      } else if (o.timestamp) {
        const d = new Date(o.timestamp);
        key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }

      if (!dataMap[key]) {
        dataMap[key] = {
          month: key,
          totalRevenue: 0,
          ordersCount: 0,
          avgOrder: 0,
        };
      }
      dataMap[key].totalRevenue += o.total;
      dataMap[key].ordersCount += 1;
    });

    return Object.keys(dataMap).map((mKey) => {
      const entry = dataMap[mKey];
      const seed = historicalSeeds[mKey];
      const finalRevenue =
        entry.totalRevenue > 0
          ? entry.totalRevenue + (seed ? Math.round(seed.rev * 0.35) : 0)
          : seed?.rev || 25000;
      const finalOrders =
        entry.ordersCount > 0
          ? entry.ordersCount + (seed ? Math.round(seed.count * 0.25) : 0)
          : seed?.count || 10;
      return {
        month: mKey,
        totalRevenue: finalRevenue,
        ordersCount: finalOrders,
        avgOrder: Math.round(finalRevenue / finalOrders),
      };
    });
  }, [orders]);

  // Daily Order Volume Data for Recharts Bar Chart from Firestore orders
  const dailyOrderVolumeData = useMemo(() => {
    const map: Record<string, { date: string; ordersCount: number; revenue: number }> = {};
    orders.forEach((o) => {
      const dateKey = o.date || new Date(o.timestamp || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      if (!map[dateKey]) {
        map[dateKey] = { date: dateKey, ordersCount: 0, revenue: 0 };
      }
      map[dateKey].ordersCount += 1;
      map[dateKey].revenue += o.total;
    });
    const list = Object.values(map);
    if (list.length === 0) {
      return [
        { date: '23 Sep', ordersCount: 3, revenue: 14890 },
        { date: '24 Sep', ordersCount: 4, revenue: 19450 },
        { date: '25 Sep', ordersCount: 5, revenue: 24298 },
        { date: '26 Sep', ordersCount: 4, revenue: 21098 },
        { date: '27 Sep', ordersCount: 6, revenue: 28490 },
        { date: '28 Sep', ordersCount: 7, revenue: 34596 },
        { date: '29 Sep', ordersCount: 8, revenue: 41290 },
      ];
    }
    return list.slice(-10);
  }, [orders]);

  // Top Selling Product Categories Data for Recharts Pie Chart from Firestore orders & products
  const categorySalesData = useMemo(() => {
    const catMap: Record<string, number> = {};
    orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const found = products.find((p) => p.id === item.productId);
          const cat = found ? found.category : 'General Accessories';
          catMap[cat] = (catMap[cat] || 0) + item.quantity;
        });
      }
    });
    const list = Object.entries(catMap).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);

    if (list.length === 0) {
      return [
        { category: 'Power Banks', count: 42 },
        { category: 'Earphones', count: 35 },
        { category: 'Chargers', count: 28 },
        { category: 'Mobile Covers', count: 24 },
        { category: 'Tempered Glass', count: 18 },
      ];
    }
    return list;
  }, [orders, products]);

  const CATEGORY_COLORS = [
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F59E0B',
    '#10B981',
    '#06B6D4',
    '#6366F1',
    '#F43F5E',
    '#14B8A6',
  ];

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
    setActiveFormLayer('basic');
    setFormName('');
    setFormPrice('1499');
    setFormOriginalPrice('2499');
    setFormCategory('Cables');
    setFormSubcategory('USB-C Fast Charging Cable');
    setFormSku(`SKU-CM-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormWarranty('6 Months Replacement Warranty');
    setFormTags('fast charge, braided, type-c, pd 3.0');
    setFormStock('40');
    setUploadedImages([]);
    setImportUrl('');
    setImportedPreview(null);
    setFormTagline('');
    setFormShortDescription('');
    setFormDescription('');
    setFormPhoneBrand('Apple');
    setFormPhoneModels('iPhone 16 Pro, iPhone 15, Galaxy S24');
    setFormCompatibleDevices('Smartphones, Laptops, Tablets');
    setFormConnectorType('USB-C to USB-C');
    setFormSpecs(getCategoryPresetSpecs('Cables'));
    setFormSeoTitle('');
    setFormSeoDescription('');
    setFormSeoKeywords('');
    setFormSlug('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setActiveFormLayer('basic');
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormOriginalPrice(String(product.originalPrice));
    setFormCategory(product.category);
    setFormSubcategory(product.category);
    setFormSku(product.sku || `SKU-CM-${product.id}`);
    setFormWarranty(product.warranty || '1-Year Replacement Warranty');
    setFormTags(product.tags ? product.tags.join(', ') : 'crazy mobiles, accessory');
    setFormStock(String(product.stock));
    setImportUrl('');
    setImportedPreview(null);
    setFormTagline(product.tagline || '');
    setFormShortDescription(product.shortDescription || product.tagline || '');
    setFormDescription(product.description || '');
    setFormPhoneBrand(product.compatibleBrands ? product.compatibleBrands[0] || 'Apple' : 'Apple');
    setFormPhoneModels(product.compatibleModels ? product.compatibleModels.join(', ') : 'Universal');
    setFormCompatibleDevices('Smartphones, Laptops, Tablets');
    setFormConnectorType('USB-C');
    setFormSpecs(
      Array.isArray(product.specs) && product.specs.length > 0
        ? product.specs
        : getCategoryPresetSpecs(product.category)
    );
    setFormSeoTitle(product.seoTitle || `${product.name} | ${STORE_NAME}`);
    setFormSeoDescription(product.seoDescription || product.tagline || '');
    setFormSeoKeywords(product.seoKeywords ? product.seoKeywords.join(', ') : '');
    setFormSlug(product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

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
      formName.trim() || STORE_NAME
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

    const formattedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const formattedBrands = formPhoneBrand
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    const formattedModels = formPhoneModels
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const formattedKeywords = formSeoKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        name: formName.trim(),
        shortName: formName.trim().replace(new RegExp(`^${STORE_NAME}\\s+`, 'i'), ''),
        price: numericPrice,
        originalPrice: numericOriginal,
        category: formCategory,
        stock: numericStock,
        image: primaryImg,
        gallery: galleryList,
        sku: formSku.trim() || editingProduct.sku,
        warranty: formWarranty.trim() || editingProduct.warranty,
        tags: formattedTags,
        compatibleBrands: formattedBrands,
        compatibleModels: formattedModels,
        seoTitle: formSeoTitle.trim() || `${formName.trim()} | ${STORE_NAME}`,
        seoDescription: formSeoDescription.trim() || formTagline.trim(),
        seoKeywords: formattedKeywords,
        slug: formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: formTagline.trim() || editingProduct.tagline || `Precision-engineered ${STORE_NAME} mobile accessory.`,
        shortDescription: formShortDescription.trim() || formTagline.trim() || editingProduct.shortDescription,
        description: formDescription.trim() || editingProduct.description || 'Designed for durability, high-efficiency power transfer, and seamless compatibility.',
        specs: formSpecs.filter((s) => s.label.trim() && s.value.trim()),
      });
      showToast(
        `Updated "${formName.trim()}" (${uploadedImages.length || 1} photo${
          uploadedImages.length === 1 ? '' : 's'
        })`
      );
    } else {
      onAddProduct({
        name: formName.trim() || `${STORE_NAME} Custom Product`,
        shortName: (formName.trim() || 'Custom Product').replace(new RegExp(`^${STORE_NAME}\\s+`, 'i'), ''),
        price: numericPrice,
        originalPrice: numericOriginal,
        rating: 4.8,
        reviewsCount: 124,
        category: formCategory,
        stock: numericStock,
        image: primaryImg,
        placeholderUrl: fallbackPlaceholder,
        gallery: galleryList,
        sku: formSku.trim() || `SKU-CM-${Math.floor(1000 + Math.random() * 9000)}`,
        warranty: formWarranty.trim() || '6 Months Warranty',
        tags: formattedTags,
        compatibleBrands: formattedBrands,
        compatibleModels: formattedModels,
        seoTitle: formSeoTitle.trim() || `${formName.trim()} | ${STORE_NAME}`,
        seoDescription: formSeoDescription.trim() || formTagline.trim(),
        seoKeywords: formattedKeywords,
        slug: formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: formTagline.trim() || `Precision-engineered ${STORE_NAME} mobile smartphone & performance accessory.`,
        shortDescription: formShortDescription.trim() || formTagline.trim() || 'High-efficiency mobile accessory engineered with durable materials for everyday device power and protection.',
        description:
          formDescription.trim() ||
          'Designed in-house for durability, high-efficiency power transfer, and seamless compatibility.',
        colors: [
          { name: 'Obsidian Black', hex: '#141418' },
          { name: 'Titanium Gray', hex: '#7A7A85' },
        ],
        sizes: ['Standard Edition', 'Pro Edition'],
        sizeLabel: 'Edition',
        specs:
          formSpecs.filter((s) => s.label.trim() && s.value.trim()).length > 0
            ? formSpecs.filter((s) => s.label.trim() && s.value.trim())
            : [
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

  const rawLogs = auditLogs || [];
  const filteredAuditLogs = rawLogs.filter((log) => {
    const matchesCategory =
      auditCategoryFilter === 'all' ||
      log.category === auditCategoryFilter ||
      (auditCategoryFilter === 'products' && log.action.includes('Product')) ||
      (auditCategoryFilter === 'orders' && log.action.includes('Order')) ||
      (auditCategoryFilter === 'auth' &&
        (log.action.includes('Login') || log.action.includes('Logout'))) ||
      (auditCategoryFilter === 'cms' &&
        (log.action.includes('CMS') ||
          log.action.includes('Discount') ||
          log.action.includes('Spotlight')));

    const q = auditSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      String(log.entityId || '').toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  /* ========================================================================
     LOGIN VIEW (Centered card, "Admin Login", admin / voltedge123)
     ======================================================================== */
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center px-4 py-12 animate-page-enter">
        <div className="w-full max-w-md bg-[#111113] border border-white/10 rounded-[16px] p-8 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CrazyMobilesEmblem size={44} />
              <div>
                <h1 className="font-display text-xl font-bold text-white">
                  Admin Login
                </h1>
                <p className="text-xs text-[#A0A0B0]">{STORE_NAME} Operations Console</p>
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
              Owner: <code className="text-white font-mono-num">Shoeb</code> /{' '}
              <code className="text-white font-mono-num">admin</code>
            </span>
            <button
              type="button"
              onClick={() => {
                setUsername('Shoeb');
                setPassword('admin');
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
    { id: 'logs', label: 'Audit Logs', icon: 'fa-clipboard-list' },
  ];

  return (
    <div className="min-h-[calc(100vh-4.25rem)] flex flex-col lg:flex-row bg-[#0A0A0B] animate-page-enter">
      {/* LEFT SIDEBAR (240px on desktop) */}
      <aside className="w-full lg:w-[240px] shrink-0 bg-[#111113] border-b lg:border-b-0 lg:border-r border-white/[0.07] flex flex-col justify-between">
        <div className="p-4 lg:p-5">
          <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <CrazyMobilesEmblem size={32} />
              <div>
                <span className="font-display text-xs font-bold text-white block">
                  {STORE_NAME} Admin
                </span>
                <span className="text-[10px] text-[#6B6B7B]">Merchant Portal</span>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" title="Active" />
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

            {/* SALES OVERVIEW (Recharts Monthly Line Chart & GMV Performance) */}
            <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.08] shadow-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6C63FF] shadow-[0_0_8px_#6C63FF]" />
                    <h2 className="font-display text-lg font-bold text-white">
                      Sales Overview
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#6C63FF]/15 border border-[#6C63FF]/30 text-[10px] font-mono-num font-semibold text-[#9D95FF]">
                      Recharts Monthly Trajectory
                    </span>
                  </div>
                  <p className="text-xs text-[#A0A0B0] mt-1">
                    Monthly settled GMV trajectory &amp; order volume derived directly from the live orders state
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#1A1A1F] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSalesChartMetric('revenue')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                      salesChartMetric === 'revenue'
                        ? 'bg-electric-gradient text-white shadow-electric-glow'
                        : 'text-[#A0A0B0] hover:text-white'
                    }`}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesChartMetric('orders')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                      salesChartMetric === 'orders'
                        ? 'bg-electric-gradient text-white shadow-electric-glow'
                        : 'text-[#A0A0B0] hover:text-white'
                    }`}
                  >
                    Order Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => setSalesChartMetric('both')}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all ${
                      salesChartMetric === 'both'
                        ? 'bg-electric-gradient text-white shadow-electric-glow'
                        : 'text-[#A0A0B0] hover:text-white'
                    }`}
                  >
                    Dual Axis
                  </button>
                </div>
              </div>

              {/* Recharts Responsive Monthly Line / Area Chart */}
              <div className="h-[320px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlySalesData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="rechartsRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.45} />
                        <stop offset="60%" stopColor="#3B82F6" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#0A0A0B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rechartsOrdersGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#6B6B7B"
                      tick={{
                        fill: '#A0A0B0',
                        fontSize: 11,
                        fontFamily: 'Space Grotesk, sans-serif',
                      }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#6B6B7B"
                      tick={{
                        fill: '#A0A0B0',
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      tickFormatter={(val) => `₹${(Number(val) / 1000).toFixed(0)}k`}
                    />
                    {salesChartMetric === 'both' && (
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#F59E0B"
                        tick={{
                          fill: '#F59E0B',
                          fontSize: 11,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${val} ord`}
                      />
                    )}
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const rev = payload.find(
                            (p) => p.dataKey === 'totalRevenue'
                          )?.value;
                          const ords =
                            payload.find((p) => p.dataKey === 'ordersCount')
                              ?.value || payload[0]?.payload?.ordersCount;
                          const avg = payload[0]?.payload?.avgOrder;
                          return (
                            <div className="bg-[#181822]/95 backdrop-blur-md border border-white/15 rounded-xl p-3.5 shadow-2xl space-y-1.5 min-w-[190px]">
                              <p className="font-display text-xs font-bold text-white pb-1 border-b border-white/10">
                                {label} Performance
                              </p>
                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-[#A0A0B0]">Total Revenue:</span>
                                <span className="font-mono-num font-bold text-blue-400">
                                  {formatINR(Number(rev || 0))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[#A0A0B0]">Orders Logged:</span>
                                <span className="font-mono-num font-semibold text-amber-400">
                                  {ords} orders
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-[#6B6B7B] pt-0.5">
                                <span>Avg Order Value:</span>
                                <span className="font-mono-num text-white">
                                  {formatINR(Number(avg || 0))}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {(salesChartMetric === 'revenue' ||
                      salesChartMetric === 'both') && (
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalRevenue"
                        name="Gross Revenue (₹)"
                        stroke="#2563EB"
                        strokeWidth={3}
                        fill="url(#rechartsRevenueGlow)"
                        dot={{
                          r: 4,
                          fill: '#FFFFFF',
                          stroke: '#2563EB',
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 7,
                          fill: '#3B82F6',
                          stroke: '#FFFFFF',
                          strokeWidth: 2.5,
                        }}
                      />
                    )}
                    {(salesChartMetric === 'orders' ||
                      salesChartMetric === 'both') && (
                      <Line
                        yAxisId={salesChartMetric === 'both' ? 'right' : 'left'}
                        type="monotone"
                        dataKey="ordersCount"
                        name="Orders Placed"
                        stroke="#F59E0B"
                        strokeWidth={2.5}
                        dot={{
                          r: 3.5,
                          fill: '#F59E0B',
                          stroke: '#0A0A0B',
                          strokeWidth: 1.5,
                        }}
                        activeDot={{
                          r: 6,
                          fill: '#FFFFFF',
                          stroke: '#F59E0B',
                          strokeWidth: 2,
                        }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Stats Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                {monthlySalesData.map((m) => (
                  <div
                    key={m.month}
                    className="bg-[#1A1A1F] rounded-xl p-3 border border-white/[0.06] hover:border-white/15 transition-all"
                  >
                    <span className="text-[11px] text-[#A0A0B0] block truncate">
                      {m.month}
                    </span>
                    <span className="text-sm font-mono-num font-bold text-white block mt-0.5">
                      {formatINR(m.totalRevenue)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono-num mt-0.5 block">
                      {m.ordersCount} orders
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Revenue Line Chart (Last 7 Days) */}
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

            {/* Live Firestore Analytics: Daily Order Volume Bar Chart & Category Distribution Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart: Daily Order Volume */}
              <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.07]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      Daily Order Volume
                    </h2>
                    <p className="text-xs text-[#A0A0B0]">
                      Real-time order count per day from Firestore
                    </p>
                  </div>
                  <span className="font-mono-num text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                    Live Firestore Sync
                  </span>
                </div>
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyOrderVolumeData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#6B6B7B"
                        tick={{ fill: '#A0A0B0', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#6B6B7B"
                        tick={{ fill: '#A0A0B0', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#181822]/95 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-2xl space-y-1 min-w-[160px]">
                                <p className="font-display text-xs font-bold text-white pb-1 border-b border-white/10">
                                  {label}
                                </p>
                                <div className="flex items-center justify-between text-xs pt-1">
                                  <span className="text-[#A0A0B0]">Orders Placed:</span>
                                  <span className="font-mono-num font-bold text-blue-400">
                                    {data.ordersCount}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#A0A0B0]">Daily Revenue:</span>
                                  <span className="font-mono-num font-semibold text-emerald-400">
                                    {formatINR(data.revenue)}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="ordersCount" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart: Top-Selling Product Categories */}
              <div className="bg-[#111113] rounded-[16px] p-6 border border-white/[0.07]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      Top-Selling Product Categories
                    </h2>
                    <p className="text-xs text-[#A0A0B0]">
                      Unit sales distribution across catalog
                    </p>
                  </div>
                  <span className="font-mono-num text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                    {categorySalesData.length} Categories
                  </span>
                </div>
                <div className="h-[280px] w-full flex items-center justify-center">
                  {categorySalesData.length === 0 ? (
                    <div className="text-xs text-[#6B6B7B] py-12 text-center">
                      No order items data available yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySalesData}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={45}
                          paddingAngle={3}
                          label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {categorySalesData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                              stroke="rgba(255,255,255,0.1)"
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              return (
                                <div className="bg-[#181822]/95 backdrop-blur-md border border-white/15 rounded-xl p-3 shadow-2xl space-y-1">
                                  <p className="font-display text-xs font-bold text-white">
                                    {data.name}
                                  </p>
                                  <p className="text-xs font-mono-num text-purple-400">
                                    Units Sold: {data.value}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
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
          <div className="bg-[#111113] rounded-[16px] border border-white/[0.07] overflow-hidden animate-page-enter space-y-0">
            {/* Admin Category Filter Bar */}
            <div className="p-4 border-b border-white/[0.07] bg-[#16161C] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {[
                  'All',
                  'Mobile Covers',
                  'Tempered Glass',
                  'Earphones',
                  'Headphones',
                  'Neckbands',
                  'Wired Accessories',
                  'Wireless Accessories',
                  'Chargers',
                  'Cables',
                  'Power Banks',
                  'Smart Watches',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAdminCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      adminCategoryFilter === cat
                        ? 'bg-electric-gradient text-white shadow-electric-glow font-bold'
                        : 'bg-[#1A1A1F] text-[#A0A0B0] hover:text-white border border-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#6B6B7B] shrink-0 font-mono-num">
                Showing{' '}
                {
                  products.filter((p) => {
                    if (adminCategoryFilter === 'All') return true;
                    return p.category.toLowerCase().includes(adminCategoryFilter.toLowerCase());
                  }).length
                }{' '}
                of {products.length} products
              </span>
            </div>

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
                  {products
                    .filter((prod) => {
                      if (adminCategoryFilter === 'All') return true;
                      return prod.category.toLowerCase().includes(adminCategoryFilter.toLowerCase());
                    })
                    .map((prod) => {
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
                      id: 'payments',
                      label: 'Payment Settings (UPI & Gateway)',
                      icon: 'fa-qrcode',
                    },
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
                      placeholder="CRAZY MOBILES MEGA SALE · UP TO"
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
               SECTION: PAYMENT SETTINGS & OFFICIAL UPI GATEWAY CONFIGURATION
               ================================================================ */}
            {(settingsSubTab === 'all' || settingsSubTab === 'payments') && (
              <div className="bg-[#111113] rounded-[16px] p-6 sm:p-8 border border-white/[0.08] space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/[0.07]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-[10px] font-mono-num uppercase text-blue-400 mb-2">
                      <i className="fa-solid fa-qrcode" /> Official Merchant Payments &amp; NPCI UPI 2.0
                    </span>
                    <h3 className="font-display text-lg font-bold text-white">
                      Payment Settings &amp; UPI Gateway Manager
                    </h3>
                    <p className="text-xs text-[#A0A0B0] mt-1 max-w-2xl">
                      Configure your official merchant name, verified Virtual Payment Address (UPI ID), accepted payment methods, and test live QR codes for checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePaymentSettings}
                    className="px-5 py-2.5 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow flex items-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <i className="fa-solid fa-floppy-disk text-xs" />
                    <span>Save Payment Settings</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* LEFT: Payment Parameters Form (7 cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white mb-1.5">
                          Merchant Legal Registered Name *
                        </label>
                        <input
                          type="text"
                          value={paymentSettings.merchantName}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              merchantName: e.target.value,
                            }))
                          }
                          placeholder="e.g. CRAZY MOBILE SHOP AND MULTISERVICES"
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-[10px] text-[#A0A0B0] mt-1 block">
                          Appears on customer UPI apps &amp; official invoice receipts
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white mb-1.5">
                          Primary Merchant UPI ID (VPA) *
                        </label>
                        <input
                          type="text"
                          value={paymentSettings.upiId}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              upiId: e.target.value.trim(),
                            }))
                          }
                          placeholder="e.g. merchantqr.b5bhzh5d@digikhata"
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-blue-500/40 text-xs font-mono-num font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                        />
                        <span className="text-[10px] text-[#A0A0B0] mt-1 block">
                          Official NPCI UPI address encoded into checkout QR code
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-white mb-1.5">
                          Secondary / Fallback UPI ID
                        </label>
                        <input
                          type="text"
                          value={paymentSettings.secondaryUpiId}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              secondaryUpiId: e.target.value.trim(),
                            }))
                          }
                          placeholder="e.g. 9011221665@ybl"
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white mb-1.5">
                          Payment Dispatch WhatsApp Number
                        </label>
                        <input
                          type="text"
                          value={paymentSettings.paymentPhone}
                          onChange={(e) =>
                            setPaymentSettings((prev) => ({
                              ...prev,
                              paymentPhone: e.target.value.trim(),
                            }))
                          }
                          placeholder="9011221665"
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Enabled Payment Methods Toggles */}
                    <div className="p-4 rounded-[12px] bg-[#1A1A1F] border border-white/[0.06] space-y-3">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                        Active Payment Gateways &amp; Methods at Checkout
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#111113] border border-white/10 cursor-pointer">
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              Instant Merchant UPI QR
                            </span>
                            <span className="text-[10px] text-[#A0A0B0]">
                              Google Pay, PhonePe, Paytm, CRED
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={paymentSettings.enableUpiQr}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                enableUpiQr: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-blue-600"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#111113] border border-white/10 cursor-pointer">
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              1-Tap UPI Intent Apps
                            </span>
                            <span className="text-[10px] text-[#A0A0B0]">
                              Mobile app deep linking
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={paymentSettings.enableUpiIntent}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                enableUpiIntent: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-blue-600"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#111113] border border-white/10 cursor-pointer">
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              Cash on Delivery (COD)
                            </span>
                            <span className="text-[10px] text-[#A0A0B0]">
                              Pan-India doorstep payment
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={paymentSettings.enableCod}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                enableCod: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-blue-600"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#111113] border border-white/10 cursor-pointer">
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              Credit / Debit Cards
                            </span>
                            <span className="text-[10px] text-[#A0A0B0]">
                              Visa, Mastercard, RuPay &amp; Netbanking
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={paymentSettings.enableCards}
                            onChange={(e) =>
                              setPaymentSettings((prev) => ({
                                ...prev,
                                enableCards: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-purple-600"
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white mb-1.5">
                        Customer Payment Instructions Note
                      </label>
                      <textarea
                        rows={2}
                        value={paymentSettings.instructions}
                        onChange={(e) =>
                          setPaymentSettings((prev) => ({
                            ...prev,
                            instructions: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* RIGHT: Live Interactive UPI QR Preview (5 cols) */}
                  <div className="lg:col-span-5 bg-[#16161B] rounded-[16px] p-5 border border-white/10 space-y-4 text-center">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-left">
                      <div>
                        <h4 className="font-display text-xs font-bold text-white uppercase tracking-wider">
                          Live Merchant UPI QR Preview
                        </h4>
                        <p className="text-[11px] text-[#A0A0B0]">
                          Dynamically generated with configured settings
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-[#A0A0B0]">Test ₹</label>
                        <input
                          type="number"
                          value={testQrAmount}
                          onChange={(e) => setTestQrAmount(Number(e.target.value) || 1)}
                          className="w-20 px-2 py-1 rounded bg-[#111113] border border-white/15 text-xs font-mono-num font-bold text-emerald-400 text-right"
                        />
                      </div>
                    </div>

                    <CrazyMobilesPaymentQR
                      amount={testQrAmount}
                      upiId={paymentSettings.upiId}
                      merchantName={paymentSettings.merchantName}
                      className="mx-auto"
                      onCopySuccess={() => showToast('Copied test UPI ID to clipboard!')}
                    />

                    <div className="text-[11px] text-[#A0A0B0] bg-[#111113] p-3 rounded-xl border border-white/5 space-y-1 text-left">
                      <p className="flex items-center gap-1.5">
                        <i className="fa-solid fa-shield-halved text-emerald-400 shrink-0" />
                        <span>Scan with your smartphone camera or any UPI app.</span>
                      </p>
                      <p className="font-mono-num text-[10px] text-slate-400 break-all select-all">
                        URI: upi://pay?pa={paymentSettings.upiId}&amp;pn={encodeURIComponent(paymentSettings.merchantName)}
                      </p>
                    </div>
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
                    Manage operational parameters for {STORE_NAME} Storefront.
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
                      onRestoreDefaultCatalog();
                      showToast(
                        'Official store catalog, orders, and configuration restored to default state'
                      );
                    }}
                    className="px-4 py-2.5 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300"
                  >
                    Restore Default Store Catalog & Settings
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

        {/* ====================================================================
           TAB 7: AUDIT LOGS VIEW
           ==================================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-page-enter">
            {/* Header / Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111113] border border-white/10 rounded-[16px] p-6 shadow-card">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#6C63FF]/20 border border-[#6C63FF]/40 flex items-center justify-center text-[#6C63FF]">
                    <i className="fa-solid fa-clipboard-list text-sm" />
                  </div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Admin Audit &amp; Activity Log
                  </h2>
                </div>
                <p className="text-xs text-[#A0A0B0] mt-1.5 max-w-xl leading-relaxed">
                  Real-time chronological record of administrative actions, catalog modifications, order state transitions, and security events performed by authorized store operators.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const dataStr =
                      'data:text/json;charset=utf-8,' +
                      encodeURIComponent(JSON.stringify(rawLogs, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute(
                      'download',
                      `crazy_mobiles_audit_logs_${Date.now()}.json`
                    );
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    showToast('Audit log JSON export downloaded');
                  }}
                  className="px-3.5 py-2 rounded-[8px] bg-[#1A1A1F] hover:bg-[#24242C] border border-white/10 text-xs text-[#A0A0B0] hover:text-white flex items-center gap-2 transition-colors"
                >
                  <i className="fa-solid fa-download text-xs" />
                  <span>Export JSON</span>
                </button>

                {onClearLogs && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to clear all local audit log records?'
                        )
                      ) {
                        onClearLogs();
                      }
                    }}
                    className="px-3.5 py-2 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2 transition-colors"
                  >
                    <i className="fa-solid fa-trash-can text-xs" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111113] border border-white/10 rounded-[12px] p-4">
                <span className="text-[11px] text-[#A0A0B0] block">Total Logged Actions</span>
                <span className="text-2xl font-bold font-mono-num text-white mt-1 block">
                  {rawLogs.length}
                </span>
                <span className="text-[10px] text-emerald-400 mt-1 block">
                  Active monitoring enabled
                </span>
              </div>

              <div className="bg-[#111113] border border-white/10 rounded-[12px] p-4">
                <span className="text-[11px] text-[#A0A0B0] block">Product &amp; Catalog Actions</span>
                <span className="text-2xl font-bold font-mono-num text-[#6C63FF] mt-1 block">
                  {
                    rawLogs.filter(
                      (l) =>
                        l.category === 'products' ||
                        l.action.includes('Product')
                    ).length
                  }
                </span>
                <span className="text-[10px] text-[#A0A0B0] mt-1 block">
                  Add, update, and delete events
                </span>
              </div>

              <div className="bg-[#111113] border border-white/10 rounded-[12px] p-4">
                <span className="text-[11px] text-[#A0A0B0] block">Order State Transitions</span>
                <span className="text-2xl font-bold font-mono-num text-[#FF6B35] mt-1 block">
                  {
                    rawLogs.filter(
                      (l) =>
                        l.category === 'orders' ||
                        l.action.includes('Order')
                    ).length
                  }
                </span>
                <span className="text-[10px] text-[#A0A0B0] mt-1 block">
                  Status changes &amp; dispatch updates
                </span>
              </div>

              <div className="bg-[#111113] border border-white/10 rounded-[12px] p-4">
                <span className="text-[11px] text-[#A0A0B0] block">Authenticated Operator</span>
                <span className="text-sm font-bold text-white mt-1.5 block truncate">
                  Shaikh Shoeb (Admin)
                </span>
                <span className="text-[10px] text-blue-400 mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Verified Session
                </span>
              </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111113] border border-white/10 rounded-[12px] p-3">
              <div className="relative flex-1 max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B7B] text-xs" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search logs by action, details, order ID, product..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  ['all', 'products', 'orders', 'cms', 'auth', 'system'] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAuditCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-[8px] text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                      auditCategoryFilter === cat
                        ? 'bg-electric-gradient text-white shadow-electric-glow'
                        : 'bg-[#1A1A1F] text-[#A0A0B0] hover:text-white hover:bg-[#24242C]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs List Table */}
            <div className="bg-[#111113] border border-white/10 rounded-[16px] overflow-hidden shadow-card">
              {filteredAuditLogs.length === 0 ? (
                <div className="p-12 text-center text-[#A0A0B0]">
                  <i className="fa-solid fa-clipboard-check text-3xl mb-3 block text-[#6B6B7B]" />
                  <p className="text-sm font-medium text-white">No audit logs found</p>
                  <p className="text-xs mt-1">Actions performed by the store admin will appear here in chronological order.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {filteredAuditLogs.map((log) => {
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = dateObj.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const formattedTime = dateObj.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    // Action badge styling
                    let badgeBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                    let actionIcon = 'fa-pen';

                    if (log.action.includes('Added')) {
                      badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      actionIcon = 'fa-plus';
                    } else if (log.action.includes('Deleted')) {
                      badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                      actionIcon = 'fa-trash-can';
                    } else if (log.action.includes('Order') || log.action.includes('Status')) {
                      badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      actionIcon = 'fa-truck-fast';
                    } else if (log.action.includes('CMS') || log.action.includes('Discount')) {
                      badgeBg = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                      actionIcon = 'fa-palette';
                    } else if (log.action.includes('Login') || log.action.includes('Logout')) {
                      badgeBg = 'bg-[#6C63FF]/15 text-[#9D95FF] border-[#6C63FF]/30';
                      actionIcon = 'fa-shield-halved';
                    }

                    return (
                      <div
                        key={log.id}
                        className="p-4 hover:bg-[#1A1A1F]/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${badgeBg}`}
                          >
                            <i className={`fa-solid ${actionIcon} text-xs`} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-white">
                                {log.action}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-medium border ${badgeBg}`}
                              >
                                {log.category || 'admin'}
                              </span>
                              {log.entityId && (
                                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono-num text-[#A0A0B0]">
                                  ID: {log.entityId}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#A0A0B0] mt-1 leading-relaxed break-words">
                              {log.details}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-[#6B6B7B] shrink-0 md:text-right pl-11 md:pl-0">
                          <div>
                            <span className="block text-white/80 font-mono-num">
                              {formattedDate} {formattedTime}
                            </span>
                            <span className="block text-[10px] text-[#A0A0B0]">
                              by {log.actor}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL (5-Layer Category-Aware Architecture) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsProductModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <form
            onSubmit={handleSaveProduct}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111113] border border-white/15 rounded-[20px] p-6 sm:p-7 shadow-2xl space-y-5 animate-page-enter"
          >
            {/* Modal Header & Layer Stepper */}
            <div className="space-y-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <span>{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-electric-gradient text-[10px] font-bold text-white uppercase tracking-wide">
                      5-Layer Catalog
                    </span>
                  </h3>
                  <p className="text-xs text-[#A0A0B0] mt-0.5">
                    Category-aware product structuring with auto-generated descriptions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#1A1A1F] text-[#A0A0B0] hover:text-white flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              {/* 5-Layer Navigation Bar */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {(
                  [
                    { id: 'basic', label: 'A. Basic Info', icon: 'fa-cube' },
                    { id: 'compatibility', label: 'B. Compatibility', icon: 'fa-mobile-screen' },
                    { id: 'specs', label: 'C. Category Specs', icon: 'fa-sliders' },
                    { id: 'description', label: 'D. Description', icon: 'fa-wand-magic-sparkles' },
                    { id: 'seo', label: 'E. SEO Info', icon: 'fa-magnifying-glass' },
                  ] as const
                ).map((layer) => (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setActiveFormLayer(layer.id)}
                    className={`py-2 px-1.5 rounded-[8px] text-[11px] font-semibold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      activeFormLayer === layer.id
                        ? 'bg-electric-gradient text-white shadow-electric-glow font-bold'
                        : 'bg-[#1A1A1F] text-[#A0A0B0] hover:text-white border border-white/5'
                    }`}
                  >
                    <i className={`fa-solid ${layer.icon} text-[10px]`} />
                    <span className="truncate">{layer.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI-ASSISTED URL IMPORTER TOOLBAR (Universal Multi-Platform Parser) */}
            <div className="p-4 rounded-[16px] bg-[#14141B] border border-[#6C63FF]/40 space-y-3 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#6C63FF]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-electric-gradient flex items-center justify-center text-white text-xs shadow-electric-glow">
                    <i className="fa-solid fa-wand-magic-sparkles" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Universal AI Product Importer
                    </span>
                    <span className="text-[10px] text-[#A0A0B0]">
                      Paste any URL (Amazon, Flipkart, brand sites) or product title
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono-num font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Gemini 2.5 Multi-Site Parser
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                <div className="relative flex-1">
                  <i className="fa-solid fa-link absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B7B]" />
                  <input
                    type="text"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleScrapeProductWithAI();
                      }
                    }}
                    placeholder="Paste URL (e.g. amazon.in/dp/..., flipkart.com/..., official site)..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-[10px] bg-[#0E0E12] border border-white/15 text-xs text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF] transition-all shadow-inner"
                  />
                  {importUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImportUrl('');
                        setImportedPreview(null);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#A0A0B0] hover:text-white"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isImportingWithAI}
                  onClick={(e) => void handleScrapeProductWithAI(e)}
                  className="px-5 py-2.5 rounded-[10px] bg-electric-gradient text-white text-xs font-bold shadow-electric-glow whitespace-nowrap flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shrink-0"
                >
                  {isImportingWithAI ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-bolt text-xs text-[#FF6B35]" />
                      <span>Auto-Import</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Sample Test Links */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 relative z-10">
                <span className="text-[10px] text-[#A0A0B0] font-semibold flex items-center gap-1 mr-1">
                  <i className="fa-solid fa-bolt text-[9px] text-[#FF6B35]" />
                  Quick Samples:
                </span>
                {[
                  {
                    label: '⚡ 65W GaN Charger',
                    url: 'https://www.amazon.in/dp/B09C5R8Q47-anker-65w-gan-fast-charger-3-port-pd',
                  },
                  {
                    label: '🛡️ MagSafe Armor Case',
                    url: 'https://www.spigen.com/products/iphone-16-pro-case-ultra-hybrid-mag-fit-matte-black',
                  },
                  {
                    label: '🎧 boAt Airdopes 141 ANC',
                    url: 'https://www.boat-lifestyle.com/products/airdopes-141-anc-true-wireless-earbuds-42-hours-playback',
                  },
                  {
                    label: '📱 9H Privacy Glass',
                    url: 'https://www.amazon.in/dp/B0C9QW8811-iphone-16-pro-max-privacy-tempered-glass-screen-protector',
                  },
                  {
                    label: '🔗 100W Braided Cable',
                    url: 'https://www.amazon.in/dp/B0B5YVRN9X-type-c-to-type-c-100w-fast-charging-braided-cable-1-5m',
                  },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    disabled={isImportingWithAI}
                    onClick={() => {
                      setImportUrl(sample.url);
                      void handleScrapeProductWithAI(undefined, sample.url);
                    }}
                    className="px-2.5 py-1 rounded-[6px] bg-[#1E1E26] hover:bg-[#6C63FF]/20 hover:border-[#6C63FF]/50 border border-white/10 text-[10px] text-[#D0D0E0] hover:text-white transition-all disabled:opacity-50"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              {isImportingWithAI && (
                <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-[#111115] border border-[#6C63FF]/30 text-xs text-[#6C63FF] font-semibold animate-pulse">
                  <i className="fa-solid fa-gear fa-spin text-xs" />
                  <span>{importProgressStep}</span>
                </div>
              )}

              {/* Live Scraped Preview Drawer */}
              {importedPreview && !isImportingWithAI && (
                <div className="p-3 rounded-[12px] bg-[#111115] border border-emerald-500/30 flex items-center justify-between gap-3 text-xs animate-page-enter">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#1A1A1F] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      <ResilientImage
                        src={
                          importedPreview.images?.[0] ||
                          uploadedImages[0] ||
                          'https://placehold.co/100x100/1A1A1F/6C63FF?text=Product'
                        }
                        alt="Scraped Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate max-w-[280px]">
                          {importedPreview.name || formName}
                        </span>
                        <span className="px-2 py-0.2 rounded bg-[#6C63FF]/20 text-[#6C63FF] text-[9px] font-bold uppercase">
                          {importedPreview.category || formCategory}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A0A0B0] truncate">
                        ₹{importedPreview.price || formPrice} · {importedPreview.specs?.length || formSpecs.length} specs extracted · Auto-populated across 5 layers
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                    <i className="fa-solid fa-circle-check text-xs" />
                    Applied
                  </span>
                </div>
              )}
            </div>

            {/* LAYER A: BASIC INFORMATION */}
            {activeFormLayer === 'basic' && (
              <div className="space-y-4 animate-page-enter">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                       Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. CrazyCharge 100W Braided USB-C Cable"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        const newCat = e.target.value as Product['category'];
                        setFormCategory(newCat);
                        const newSpecs = getCategoryPresetSpecs(newCat);
                        setFormSpecs(newSpecs);
                        void monitorAndGenerateDescription(newSpecs, true);
                        showToast(`Switched specs preset to ${newCat}`);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="Mobile Covers">📱 Mobile Covers</option>
                      <option value="Tempered Glass">🛡️ Tempered Glass</option>
                      <option value="Cables">🔗 Cables</option>
                      <option value="Chargers">🔋 Chargers &amp; Adapters</option>
                      <option value="Earphones">🎧 Wired Earphones</option>
                      <option value="Earbuds">🎧 Wireless Earbuds / TWS</option>
                      <option value="Headphones">🎧 Headphones (Over-Ear)</option>
                      <option value="Neckbands">🎵 Bluetooth Neckbands</option>
                      <option value="Power Banks">⚡ Power Banks</option>
                      <option value="Smart Watches">⌚ Smart Watches</option>
                      <option value="Wired Accessories">🔌 Wired Accessories</option>
                      <option value="Wireless Accessories">📡 Wireless Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Subcategory / Type
                    </label>
                    <input
                      type="text"
                      value={formSubcategory}
                      onChange={(e) => setFormSubcategory(e.target.value)}
                      placeholder="e.g. Fast Charging Cable"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#A0A0B0]">
                        MRP Price (₹)
                      </label>
                      {Number(formOriginalPrice) > Number(formPrice) && (
                        <span className="text-[10px] text-amber-400 font-mono-num font-bold">
                          {Math.round(
                            ((Number(formOriginalPrice) - Number(formPrice)) /
                              Number(formOriginalPrice)) *
                              100
                          )}
                          % OFF
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
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

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      SKU Code
                    </label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="e.g. SKU-CM-9081"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Warranty Policy
                    </label>
                    <input
                      type="text"
                      value={formWarranty}
                      onChange={(e) => setFormWarranty(e.target.value)}
                      placeholder="e.g. 6 Months Replacement Warranty"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Search Tags (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      placeholder="fast charge, braided, type-c"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  {/* CUSTOMER-FRIENDLY SHORT DESCRIPTION (AI-MONITORED) */}
                  <div className="sm:col-span-2 pt-2 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <i className="fa-solid fa-wand-magic-sparkles text-[#FF6B35]" />
                        <span>Short Customer Description</span>
                      </label>
                      <button
                        type="button"
                        disabled={isGeneratingDescWithAI}
                        onClick={() => void monitorAndGenerateDescription()}
                        className="text-[11px] text-[#6C63FF] hover:text-white font-medium flex items-center gap-1"
                      >
                        {isGeneratingDescWithAI ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin text-[10px]" />
                            <span>Synthesizing...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-sparkles text-[10px]" />
                            <span>✨ Polish with Gemini</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={formShortDescription}
                      onChange={(e) => setFormShortDescription(e.target.value)}
                      placeholder="AI auto-summarizes technical specifications into customer-friendly benefits as you fill out fields..."
                      className="w-full p-3 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF] leading-relaxed"
                    />
                    <p className="text-[10px] text-[#A0A0B0] mt-1 flex items-center gap-1">
                      <i className="fa-solid fa-circle-info text-[9px] text-[#6C63FF]" />
                      Auto-generated by Gemini from Category Specs (Layer C) to translate raw numbers into buyer benefits.
                    </p>
                  </div>
                </div>

                {/* MULTI-IMAGE DEVICE UPLOADER */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-white">
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

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void handleProcessSelectedFiles(e.target.files)}
                    className="hidden"
                  />

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
                    className={`cursor-pointer rounded-[12px] border-2 border-dashed p-4 text-center transition-all ${
                      isDraggingFiles
                        ? 'border-[#6C63FF] bg-[#6C63FF]/10'
                        : 'border-white/15 bg-[#1A1A1F]/70 hover:border-[#6C63FF]/60 hover:bg-[#1A1A1F]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#111113] border border-white/10 flex items-center justify-center mx-auto mb-2 text-[#6C63FF]">
                      {isUploadingFiles ? (
                        <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                      ) : (
                        <i className="fa-solid fa-cloud-arrow-up text-xs" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {isUploadingFiles
                        ? 'Processing & optimizing photos...'
                        : 'Upload Device Photos'}
                    </p>
                    <p className="text-[10px] text-[#A0A0B0] mt-0.5">
                      Click to select or drag &amp; drop PNG, JPG, WEBP photos
                    </p>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {uploadedImages.map((imgSrc, idx) => (
                        <div
                          key={`${idx}-${imgSrc.slice(0, 20)}`}
                          className={`group relative aspect-square rounded-[8px] overflow-hidden bg-[#1A1A1F] border ${
                            idx === 0 ? 'border-[#6C63FF] ring-1 ring-[#6C63FF]' : 'border-white/10'
                          }`}
                        >
                          <ResilientImage
                            src={imgSrc}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-mono-num font-bold ${
                              idx === 0 ? 'bg-electric-gradient text-white' : 'bg-black/75 text-[#A0A0B0]'
                            }`}
                          >
                            {idx === 0 ? 'Cover' : `#${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedImage(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded bg-black/80 hover:bg-rose-500 text-white flex items-center justify-center text-[9px]"
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LAYER B: DEVICE COMPATIBILITY */}
            {activeFormLayer === 'compatibility' && (
              <div className="space-y-4 animate-page-enter">
                <div className="p-3.5 rounded-[12px] bg-[#16161C] border border-white/10 space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-mobile-screen-button text-[#FF6B35]" />
                    <span>Target Smartphone &amp; Connector Compatibility</span>
                  </h4>
                  <p className="text-[11px] text-[#A0A0B0]">
                    Ensures customers find exact accessory fits for their device
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Primary Phone Brand
                    </label>
                    <select
                      value={formPhoneBrand}
                      onChange={(e) => setFormPhoneBrand(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="Apple">Apple (iPhone)</option>
                      <option value="Samsung">Samsung (Galaxy)</option>
                      <option value="OnePlus">OnePlus</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Realme">Realme</option>
                      <option value="Redmi">Redmi / Xiaomi</option>
                      <option value="Motorola">Motorola</option>
                      <option value="Universal">Universal All Brands</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Connector / Interface
                    </label>
                    <select
                      value={formConnectorType}
                      onChange={(e) => setFormConnectorType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="USB-C to USB-C">USB-C to USB-C</option>
                      <option value="USB-A to USB-C">USB-A to USB-C</option>
                      <option value="USB-C to Lightning">USB-C to Lightning</option>
                      <option value="Lightning to USB-A">Lightning to USB-A</option>
                      <option value="MagSafe Wireless">MagSafe Qi Magnetic</option>
                      <option value="3.5mm Audio AUX">3.5mm Audio AUX</option>
                      <option value="Bluetooth Wireless">Bluetooth Wireless</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Compatible Phone Models (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={formPhoneModels}
                      onChange={(e) => setFormPhoneModels(e.target.value)}
                      placeholder="e.g. iPhone 16 Pro Max, iPhone 15 Pro, Galaxy S24 Ultra"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Compatible Hardware Devices
                    </label>
                    <input
                      type="text"
                      value={formCompatibleDevices}
                      onChange={(e) => setFormCompatibleDevices(e.target.value)}
                      placeholder="e.g. Smartphones, Laptops, MacBooks, Tablets, Power Banks"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* LAYER C: CATEGORY-SPECIFIC SPECIFICATIONS (MONITORED BY GEMINI) */}
            {activeFormLayer === 'specs' && (
              <div className="space-y-3.5 animate-page-enter">
                {/* AI Monitoring Banner */}
                <div className="p-3.5 rounded-[12px] bg-[#14141D] border border-[#6C63FF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#6C63FF]/20 border border-[#6C63FF]/40 flex items-center justify-center text-[#6C63FF] shrink-0">
                      <i className="fa-solid fa-robot text-xs" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Gemini Specification Monitor Active</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </span>
                      <p className="text-[11px] text-[#A0A0B0]">
                        As you edit fields (Material, Wattage, Drivers), AI automatically translates specs into customer benefits.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isGeneratingDescWithAI}
                      onClick={() => void monitorAndGenerateDescription()}
                      className="px-3 py-1.5 rounded-[8px] bg-electric-gradient text-white text-xs font-bold shadow-electric-glow flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isGeneratingDescWithAI ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-sparkles text-xs" />
                          <span>✨ Polish Description Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#16161C] border border-white/10">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <i className="fa-solid fa-list-check text-emerald-400" />
                      <span>{formCategory} Specifications ({formSpecs.length} fields)</span>
                    </h4>
                    <p className="text-[11px] text-[#A0A0B0]">
                      Tailored fields automatically customize when you change category
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="px-3 py-1.5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#25252E] border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm"
                  >
                    <i className="fa-solid fa-plus text-xs text-[#6C63FF]" />
                    <span>Add Custom Field</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {formSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => handleUpdateSpecRow(idx, 'label', e.target.value)}
                        placeholder="Field Name (e.g. Length, Wattage, Material)"
                        className="w-2/5 px-3 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-semibold text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF]"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(e) => handleUpdateSpecRow(idx, 'value', e.target.value)}
                        placeholder="Specification Value (e.g. 100W PD, Military Grade TPU)"
                        className="flex-1 px-3 py-2 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(idx)}
                        className="w-8 h-8 rounded-[8px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0"
                        title="Delete field"
                      >
                        <i className="fa-solid fa-xmark text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LAYER D: MARKETING DESCRIPTION */}
            {activeFormLayer === 'description' && (
              <div className="space-y-3.5 animate-page-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-[12px] bg-[#16161C] border border-[#6C63FF]/30">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <i className="fa-solid fa-wand-magic-sparkles text-[#FF6B35]" />
                      <span>Gemini Copywriting Engine</span>
                    </h4>
                    <p className="text-[11px] text-[#A0A0B0]">
                      Summarizes Layer C technical parameters into customer-ready copy
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingDescWithAI}
                    onClick={() => void monitorAndGenerateDescription()}
                    className="px-3.5 py-2 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow whitespace-nowrap flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all shrink-0 disabled:opacity-50"
                  >
                    {isGeneratingDescWithAI ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin text-xs" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-sparkles text-xs" />
                        <span>✨ Regenerate Copy with Gemini</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Screenshot to Description OCR Tool */}
                <AdminOcrScreenshotReader
                  onApplyData={(data: ExtractedProductOcrData) => {
                    if (data.tagline) setFormTagline(data.tagline);
                    if (data.shortDescription) setFormShortDescription(data.shortDescription);
                    if (data.fullDescription) setFormDescription(data.fullDescription);
                    else if (data.rawText) setFormDescription(data.rawText);
                    if (data.detectedTitle && (!formName || formName.trim() === '')) setFormName(data.detectedTitle);
                    if (data.detectedBrand) setFormPhoneBrand(data.detectedBrand);
                    if (data.extractedSpecs && data.extractedSpecs.length > 0) {
                      setFormSpecs((prev) => {
                        const existingLabels = new Set(prev.map((s) => s.label.toLowerCase()));
                        const newSpecs = data.extractedSpecs!.filter(
                          (s) => !existingLabels.has(s.label.toLowerCase())
                        );
                        return [...prev, ...newSpecs];
                      });
                    }
                    showToast('Extracted OCR specs & description applied to form!');
                  }}
                  onApplyDescriptionOnly={(desc: string) => {
                    setFormDescription(desc);
                    showToast('Description updated from screenshot OCR!');
                  }}
                />

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                    Short Catchy Tagline
                  </label>

                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g. 100W Ultra-Fast Power Delivery with 25000+ Bend Protection"
                    className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                    Customer-Facing Short Summary
                  </label>
                  <textarea
                    rows={3}
                    value={formShortDescription}
                    onChange={(e) => setFormShortDescription(e.target.value)}
                    placeholder="Concise customer benefits translated from technical specifications..."
                    className="w-full p-3 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                    Full Product Description &amp; Highlights (Editable)
                  </label>
                  <textarea
                    rows={6}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Click 'Regenerate Copy with Gemini' above or enter custom description..."
                    className="w-full p-3.5 rounded-[10px] bg-[#1A1A1F] border border-white/10 text-xs text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF] leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* LAYER E: SEO INFORMATION */}
            {activeFormLayer === 'seo' && (
              <div className="space-y-3.5 animate-page-enter">
                <div className="p-3.5 rounded-[12px] bg-[#16161C] border border-white/10 space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-magnifying-glass text-emerald-400" />
                    <span>Search Engine Optimization (SEO Metadata)</span>
                  </h4>
                  <p className="text-[11px] text-[#A0A0B0]">
                    Controls how this product appears on Google Search and social share cards
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      SEO Title Tag
                    </label>
                    <input
                      type="text"
                      value={formSeoTitle}
                      onChange={(e) => setFormSeoTitle(e.target.value)}
                      placeholder="e.g. Buy CrazyCharge 100W USB-C Cable | Best Price India"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      value={formSeoDescription}
                      onChange={(e) => setFormSeoDescription(e.target.value)}
                      placeholder="Brief search snippet describing product features & warranty..."
                      className="w-full p-3 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white placeholder-[#6B6B7B] focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      Keywords (Comma Separated)
                    </label>
                    <input
                      type="text"
                      value={formSeoKeywords}
                      onChange={(e) => setFormSeoKeywords(e.target.value)}
                      placeholder="usb-c cable, 100w pd, fast charging, crazy mobiles"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A0A0B0] mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="e.g. crazycharge-100w-usb-c-cable"
                      className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#1A1A1F] border border-white/10 text-xs font-mono-num text-white focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGeneratingDescWithAI}
                  onClick={() => void monitorAndGenerateDescription()}
                  className="px-3 py-1.5 rounded-[8px] bg-[#1A1A1F] hover:bg-[#25252E] border border-white/15 text-xs text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isGeneratingDescWithAI ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin text-[#FF6B35] text-xs" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles text-[#FF6B35] text-xs" />
                      <span>✨ Polish with Gemini</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-[8px] bg-[#1A1A1F] text-xs text-[#A0A0B0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingFiles || isImportingWithAI}
                  className="px-5 py-2 rounded-[8px] bg-electric-gradient text-white text-xs font-semibold shadow-electric-glow hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingProduct ? 'Save Product Changes' : 'Create Product Catalog Entry'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
