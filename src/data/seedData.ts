export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  variant: string;
  title: string;
  comment: string;
  verified: boolean;
}

export interface Product {
  id: number;
  name: string;
  shortName: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  category:
    | 'Phone Cases'
    | 'Chargers & Cables'
    | 'Screen Protectors'
    | 'Earbuds'
    | 'Power Banks'
    | 'Smart Watches';
  stock: number;
  image: string;
  placeholderUrl: string;
  gallery: {
    label: string;
    url: string;
  }[];
  tagline: string;
  description: string;
  colors: ProductColor[];
  sizes: string[];
  sizeLabel: string;
  specs: ProductSpec[];
  starBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: ProductReview[];
  isTrending?: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
}

export type OrderStatus = 'Pending' | 'Packed' | 'Shipped' | 'Delivered';

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: OrderAddress;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'COD';
  paymentDetails?: string;
  status: OrderStatus;
  date: string;
  timestamp: number;
}

// High-craft studio SVG illustrations encoded as Data URIs for products and technical gallery views
const createStudioSvgDataUri = (svgContent: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;

export const TEMPERED_GLASS_SVG = createStudioSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#232334" />
      <stop offset="60%" stop-color="#141419" />
      <stop offset="100%" stop-color="#0D0D10" />
    </radialGradient>
    <linearGradient id="glassSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22" />
      <stop offset="35%" stop-color="#6C63FF" stop-opacity="0.12" />
      <stop offset="70%" stop-color="#0A0A0B" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#FF6B35" stop-opacity="0.18" />
    </linearGradient>
    <linearGradient id="accentStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6C63FF" />
      <stop offset="100%" stop-color="#FF6B35" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgGlow)" />
  <circle cx="300" cy="300" r="210" fill="none" stroke="#6C63FF" stroke-opacity="0.12" stroke-width="1" stroke-dasharray="4 6" />
  <!-- Back Protector Sheet (2-Pack) -->
  <g transform="translate(215, 105) rotate(8 110 200)">
    <rect x="0" y="0" width="210" height="410" rx="34" fill="#181820" stroke="#38384A" stroke-width="2" />
    <rect x="6" y="6" width="198" height="398" rx="29" fill="url(#glassSheen)" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1" />
    <rect x="72" y="18" width="66" height="16" rx="8" fill="#0B0B0E" />
  </g>
  <!-- Front Protector Sheet with Alignment Frame -->
  <g transform="translate(165, 95) rotate(-5 110 200)">
    <rect x="-8" y="-8" width="226" height="426" rx="40" fill="none" stroke="url(#accentStroke)" stroke-width="2" stroke-opacity="0.65" />
    <rect x="0" y="0" width="210" height="410" rx="34" fill="#121217" fill-opacity="0.78" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2" />
    <rect x="7" y="7" width="196" height="396" rx="28" fill="url(#glassSheen)" />
    <!-- Dynamic Island Cutout -->
    <rect x="72" y="18" width="66" height="18" rx="9" fill="#09090B" stroke="#2D2D3A" stroke-width="1" />
    <circle cx="124" cy="27" r="4" fill="#1F1F2E" />
    <!-- Diagonal Specular Highlight -->
    <path d="M25 60 L155 60 L45 350 L15 350 Z" fill="#FFFFFF" fill-opacity="0.07" />
    <!-- 9H Hardness Indicator -->
    <rect x="52" y="338" width="106" height="28" rx="14" fill="#0A0A0B" fill-opacity="0.75" stroke="url(#accentStroke)" stroke-width="1.2" />
    <text x="105" y="356" fill="#FFFFFF" font-family="Space Grotesk, sans-serif" font-size="11" font-weight="700" text-anchor="middle" letter-spacing="1.5">9H SAPPHIRE</text>
  </g>
</svg>
`);

export const USBC_CABLE_SVG = createStudioSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <radialGradient id="bgCable" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#212030" />
      <stop offset="65%" stop-color="#131318" />
      <stop offset="100%" stop-color="#0A0A0B" />
    </radialGradient>
    <linearGradient id="electricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6C63FF" />
      <stop offset="100%" stop-color="#FF6B35" />
    </linearGradient>
    <linearGradient id="metalShell" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2A2A35" />
      <stop offset="50%" stop-color="#454556" />
      <stop offset="100%" stop-color="#1E1E26" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgCable)" />
  <!-- Coiled Braided Cable Loops -->
  <ellipse cx="300" cy="330" rx="175" ry="125" fill="none" stroke="#1E1E28" stroke-width="26" />
  <ellipse cx="300" cy="330" rx="175" ry="125" fill="none" stroke="#323242" stroke-width="20" stroke-dasharray="6 4" />
  <ellipse cx="300" cy="330" rx="145" ry="98" fill="none" stroke="#191922" stroke-width="24" />
  <ellipse cx="300" cy="330" rx="145" ry="98" fill="none" stroke="#2D2D3C" stroke-width="18" stroke-dasharray="5 4" />
  <!-- Left Connector (100W E-Marker) -->
  <g transform="translate(175, 130)">
    <!-- Gold plated USB-C tip -->
    <rect x="20" y="0" width="28" height="24" rx="5" fill="#D4AF37" stroke="#AA8822" stroke-width="1.5" />
    <rect x="16" y="22" width="36" height="10" fill="#111115" />
    <!-- Anodized Aluminum Housing -->
    <rect x="8" y="30" width="52" height="82" rx="10" fill="url(#metalShell)" stroke="#5A5A6E" stroke-width="1.5" />
    <!-- Accent Ring -->
    <rect x="8" y="44" width="52" height="5" fill="url(#electricGrad)" />
    <!-- LED Wattage Display Window -->
    <rect x="16" y="58" width="36" height="26" rx="5" fill="#08080A" stroke="#333342" stroke-width="1" />
    <text x="34" y="75" fill="#FF6B35" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700" text-anchor="middle">100W</text>
    <!-- Strain Relief -->
    <path d="M22 112 L46 112 L42 145 L26 145 Z" fill="#1F1F27" />
  </g>
  <!-- Right Connector -->
  <g transform="translate(355, 130)">
    <rect x="20" y="0" width="28" height="24" rx="5" fill="#D4AF37" stroke="#AA8822" stroke-width="1.5" />
    <rect x="16" y="22" width="36" height="10" fill="#111115" />
    <rect x="8" y="30" width="52" height="82" rx="10" fill="url(#metalShell)" stroke="#5A5A6E" stroke-width="1.5" />
    <rect x="8" y="44" width="52" height="5" fill="url(#electricGrad)" />
    <path d="M31 63 L27 74 L34 74 L31 85 L41 71 L34 71 Z" fill="#6C63FF" />
    <path d="M22 112 L46 112 L42 145 L26 145 Z" fill="#1F1F27" />
  </g>
</svg>
`);

export const WATCH_STRAP_SVG = createStudioSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <radialGradient id="bgWatch" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#221F2E" />
      <stop offset="65%" stop-color="#131318" />
      <stop offset="100%" stop-color="#0A0A0B" />
    </radialGradient>
    <linearGradient id="electricAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6C63FF" />
      <stop offset="100%" stop-color="#FF6B35" />
    </linearGradient>
    <linearGradient id="siliconeBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1A1A22" />
      <stop offset="50%" stop-color="#282834" />
      <stop offset="100%" stop-color="#16161D" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgWatch)" />
  <!-- Top Fluoroelastomer Strap -->
  <g transform="translate(230, 65)">
    <path d="M15 0 L125 0 L135 145 L5 145 Z" fill="url(#siliconeBody)" stroke="#383848" stroke-width="1.5" />
    <!-- Ribbed Ventilation Grooves -->
    <rect x="32" y="24" width="76" height="10" rx="5" fill="#121217" stroke="#2E2E3C" stroke-width="1" />
    <rect x="30" y="48" width="80" height="10" rx="5" fill="#121217" stroke="#2E2E3C" stroke-width="1" />
    <rect x="28" y="72" width="84" height="10" rx="5" fill="#121217" stroke="#2E2E3C" stroke-width="1" />
    <rect x="26" y="96" width="88" height="10" rx="5" fill="#121217" stroke="#2E2E3C" stroke-width="1" />
    <!-- Titanium Pin Clasp -->
    <circle cx="70" cy="122" r="8" fill="url(#electricAccent)" />
  </g>
  <!-- Bottom Fluoroelastomer Strap -->
  <g transform="translate(230, 390)">
    <path d="M5 0 L135 0 L120 145 L20 145 Z" fill="url(#siliconeBody)" stroke="#383848" stroke-width="1.5" />
    <circle cx="70" cy="28" r="5" fill="#0B0B0E" stroke="#383848" stroke-width="1" />
    <circle cx="70" cy="50" r="5" fill="#0B0B0E" stroke="#383848" stroke-width="1" />
    <circle cx="70" cy="72" r="5" fill="#0B0B0E" stroke="#383848" stroke-width="1" />
    <circle cx="70" cy="94" r="5" fill="#0B0B0E" stroke="#383848" stroke-width="1" />
    <circle cx="70" cy="116" r="5" fill="#0B0B0E" stroke="#383848" stroke-width="1" />
  </g>
  <!-- Watch Case Preview -->
  <g transform="translate(195, 195)">
    <!-- Titanium Lug Connectors -->
    <rect x="25" y="0" width="160" height="16" rx="6" fill="#3A3A48" />
    <rect x="25" y="194" width="160" height="16" rx="6" fill="#3A3A48" />
    <!-- Main Watch Body -->
    <rect x="10" y="10" width="190" height="190" rx="42" fill="#1F1F28" stroke="#4A4A5E" stroke-width="3" />
    <rect x="20" y="20" width="170" height="170" rx="34" fill="#09090C" stroke="url(#electricAccent)" stroke-width="1.5" />
    <!-- Orange Action Button & Crown -->
    <rect x="200" y="52" width="10" height="36" rx="4" fill="#3E3E4F" />
    <rect x="0" y="85" width="8" height="42" rx="3" fill="#FF6B35" />
    <!-- Minimalist Watch Face -->
    <text x="105" y="98" fill="#FFFFFF" font-family="Space Grotesk, sans-serif" font-size="36" font-weight="700" text-anchor="middle">09:41</text>
    <text x="105" y="128" fill="#A0A0B0" font-family="JetBrains Mono, monospace" font-size="11" text-anchor="middle">VOLTEDGE ULTRA</text>
    <rect x="65" y="142" width="80" height="4" rx="2" fill="url(#electricAccent)" />
  </g>
</svg>
`);

export const CAR_MOUNT_SVG = createStudioSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <radialGradient id="bgMount" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#202232" />
      <stop offset="65%" stop-color="#121217" />
      <stop offset="100%" stop-color="#0A0A0B" />
    </radialGradient>
    <linearGradient id="magRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6C63FF" />
      <stop offset="100%" stop-color="#FF6B35" />
    </linearGradient>
    <linearGradient id="mountBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2A2A36" />
      <stop offset="50%" stop-color="#1B1B23" />
      <stop offset="100%" stop-color="#111116" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgMount)" />
  <!-- Articulated Aluminum Arm & Base -->
  <path d="M260 360 L235 495 L365 495 L340 360 Z" fill="#23232E" stroke="#3F3F52" stroke-width="2" />
  <rect x="195" y="485" width="210" height="28" rx="12" fill="#181820" stroke="#38384A" stroke-width="2" />
  <circle cx="300" cy="380" r="28" fill="#14141A" stroke="#444458" stroke-width="2" />
  <!-- Main Magnetic Puck Head -->
  <circle cx="300" cy="245" r="138" fill="url(#mountBody)" stroke="#3E3E50" stroke-width="3" />
  <circle cx="300" cy="245" r="122" fill="#121217" stroke="#292936" stroke-width="1.5" />
  <!-- N52 Neodymium MagSafe Ring -->
  <circle cx="300" cy="245" r="86" fill="none" stroke="url(#magRing)" stroke-width="14" stroke-dasharray="16 4" />
  <circle cx="300" cy="245" r="64" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1" />
  <!-- Alignment Tail Magnet -->
  <rect x="292" y="344" width="16" height="28" rx="8" fill="url(#magRing)" />
  <!-- Center Brand Emblem -->
  <path d="M304 218 L286 247 L301 247 L296 274 L316 242 L301 242 Z" fill="url(#magRing)" />
</svg>
`);

export const SCHEMATIC_CUTAWAY_SVG = createStudioSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <rect width="600" height="600" fill="#0F0F14" />
  <!-- Blueprint Grid -->
  <g stroke="#6C63FF" stroke-opacity="0.1" stroke-width="1">
    <line x1="0" y1="100" x2="600" y2="100" />
    <line x1="0" y1="200" x2="600" y2="200" />
    <line x1="0" y1="300" x2="600" y2="300" />
    <line x1="0" y1="400" x2="600" y2="400" />
    <line x1="0" y1="500" x2="600" y2="500" />
    <line x1="100" y1="0" x2="100" y2="600" />
    <line x1="200" y1="0" x2="200" y2="600" />
    <line x1="300" y1="0" x2="300" y2="600" />
    <line x1="400" y1="0" x2="400" y2="600" />
    <line x1="500" y1="0" x2="500" y2="600" />
  </g>
  <rect x="150" y="90" width="300" height="420" rx="36" fill="#16161E" stroke="#6C63FF" stroke-width="2" />
  <circle cx="300" cy="265" r="92" fill="none" stroke="#FF6B35" stroke-width="2" stroke-dasharray="8 6" />
  <circle cx="300" cy="265" r="68" fill="none" stroke="#6C63FF" stroke-width="6" />
  <rect x="200" y="385" width="200" height="75" rx="12" fill="#1E1E2A" stroke="#3B3B52" stroke-width="1.5" />
  <text x="300" y="420" fill="#FFFFFF" font-family="JetBrains Mono, monospace" font-size="13" text-anchor="middle">N52 MAGNETIC ARRAY</text>
  <text x="300" y="442" fill="#A0A0B0" font-family="JetBrains Mono, monospace" font-size="11" text-anchor="middle">THERMAL GRAPHENE SHIELD</text>
  <text x="300" y="62" fill="#6C63FF" font-family="JetBrains Mono, monospace" font-size="12" text-anchor="middle" letter-spacing="2">PRECISION INTERNAL ARCHITECTURE</text>
</svg>
`);

export const IN_BOX_CONTENTS_SVG = createStudioSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <rect width="600" height="600" fill="#101014" />
  <rect x="60" y="110" width="215" height="380" rx="22" fill="#1A1A22" stroke="#323242" stroke-width="2" />
  <text x="167" y="290" fill="#FFFFFF" font-family="Space Grotesk, sans-serif" font-size="22" font-weight="700" text-anchor="middle">VoltEdge</text>
  <text x="167" y="318" fill="#FF6B35" font-family="JetBrains Mono, monospace" font-size="11" text-anchor="middle">RETAIL PACKAGING</text>
  <rect x="315" y="110" width="225" height="175" rx="18" fill="#181820" stroke="#6C63FF" stroke-opacity="0.5" stroke-width="1.5" />
  <text x="427" y="195" fill="#FFFFFF" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="600" text-anchor="middle">Main Hardware Unit</text>
  <text x="427" y="218" fill="#A0A0B0" font-family="Inter, sans-serif" font-size="12" text-anchor="middle">1-Yr Warranty Card Included</text>
  <rect x="315" y="315" width="225" height="175" rx="18" fill="#181820" stroke="#2D2D3B" stroke-width="1.5" />
  <text x="427" y="400" fill="#FFFFFF" font-family="Space Grotesk, sans-serif" font-size="15" font-weight="600" text-anchor="middle">Braided Power Accessory</text>
  <text x="427" y="423" fill="#A0A0B0" font-family="Inter, sans-serif" font-size="12" text-anchor="middle">Quick Start Guide &amp; Pouch</text>
</svg>
`);

export const HERO_ECOSYSTEM_IMAGE =
  '/src/assets/images/voltedge_hero_ecosystem_1790736246088.jpg';

export const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'VoltEdge MagSafe Power Bank 10000mAh',
    shortName: 'MagSafe Power Bank',
    price: 2499,
    originalPrice: 3999,
    rating: 4.8,
    reviewsCount: 2341,
    category: 'Power Banks',
    stock: 42,
    image: '/src/assets/images/voltedge_magsafe_powerbank_1790736178785.jpg',
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=MagSafe+Power+Bank',
    gallery: [
      {
        label: 'Studio View',
        url: '/src/assets/images/voltedge_magsafe_powerbank_1790736178785.jpg',
      },
      {
        label: 'Ecosystem View',
        url: '/src/assets/images/voltedge_hero_ecosystem_1790736246088.jpg',
      },
      {
        label: 'Internal Architecture',
        url: SCHEMATIC_CUTAWAY_SVG,
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: 'Ultra-slim 15W Qi2 magnetic wireless power with graphene thermal control.',
    description:
      'Engineered with high-density cobalt-lithium cells and an N52 neodymium magnetic array, the VoltEdge 10000mAh MagSafe Power Bank snaps effortlessly to your phone without blocking the camera plateau. Features 20W USB-C PD pass-through charging and real-time NTC temperature regulation.',
    colors: [
      { name: 'Obsidian Black', hex: '#141417' },
      { name: 'Natural Titanium', hex: '#8A8A86' },
      { name: 'Electric Indigo', hex: '#6C63FF' },
    ],
    sizes: ['10,000mAh Slim', '10,000mAh + Kickstand'],
    sizeLabel: 'Configuration',
    specs: [
      { label: 'Battery Capacity', value: '10,000mAh (38.5Wh High-Density Li-Polymer)' },
      { label: 'Wireless Output', value: '15W Max Qi2 / MagSafe Certified' },
      { label: 'USB-C Wired PD', value: '20W Input / 22.5W Output Bi-Directional' },
      { label: 'Magnetic Hold Force', value: '1,400g N52 Cryo-Aligned Neodymium' },
      { label: 'Dimensions & Weight', value: '104 × 68 × 12.8 mm · 184g' },
      { label: 'Safety Certification', value: 'BIS Certified (R-41198241) · Multi-Protect IC' },
      { label: 'Warranty', value: '1-Year VoltEdge India Replacement Warranty' },
    ],
    starBreakdown: { 5: 82, 4: 13, 3: 3, 2: 1, 1: 1 },
    reviews: [
      {
        id: 'rev-101',
        author: 'Aarav Sharma',
        location: 'Bengaluru, KA',
        rating: 5,
        date: '14 Sep 2026',
        variant: 'Obsidian Black · 10,000mAh Slim',
        title: 'Strongest magnetic lock I have tested on iPhone 16 Pro',
        comment:
          'Switched from a generic power bank that constantly ran hot. VoltEdge stays remarkably cool during 15W wireless charging and charges my iPhone 16 Pro from 15% to 100% with 35% still left in the tank.',
        verified: true,
      },
      {
        id: 'rev-102',
        author: 'Neha Kapoor',
        location: 'Mumbai, MH',
        rating: 5,
        date: '08 Sep 2026',
        variant: 'Natural Titanium · 10,000mAh + Kickstand',
        title: 'Sleek enough to slip into a jeans pocket while attached',
        comment:
          'The matte finish feels identical to Apple hardware. Took it on a 4-day trip to Goa and never needed to carry a wall brick during the day.',
        verified: true,
      },
    ],
    isTrending: true,
    createdAt: '2026-09-01',
  },
  {
    id: 2,
    name: 'VoltEdge GaN Fast Charger 65W',
    shortName: 'GaN Fast Charger 65W',
    price: 1299,
    originalPrice: 1999,
    rating: 4.7,
    reviewsCount: 1892,
    category: 'Chargers & Cables',
    stock: 68,
    image: '/src/assets/images/voltedge_gan_charger_65w_1790736195608.jpg',
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=GaN+Charger+65W',
    gallery: [
      {
        label: 'Studio View',
        url: '/src/assets/images/voltedge_gan_charger_65w_1790736195608.jpg',
      },
      {
        label: 'Ecosystem View',
        url: '/src/assets/images/voltedge_hero_ecosystem_1790736246088.jpg',
      },
      {
        label: 'Internal Architecture',
        url: SCHEMATIC_CUTAWAY_SVG,
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: '3rd-Gen Gallium Nitride power architecture. Powers your MacBook and phone simultaneously.',
    description:
      'Powered by Navitas GaNFast III semiconductors, this pocket-sized 65W power adapter is 52% smaller than standard silicon bricks. Intelligent dynamic power allocation distributes 45W + 20W across dual USB-C ports with zero voltage drop.',
    colors: [
      { name: 'Charcoal Matte', hex: '#1C1C22' },
      { name: 'Lunar Silver', hex: '#C2C2CC' },
    ],
    sizes: ['65W Dual USB-C + USB-A', '65W Compact Dual USB-C'],
    sizeLabel: 'Port Layout',
    specs: [
      { label: 'Total Power Output', value: '65W Max (PD 3.0 / PPS / QC 4+)' },
      { label: 'Semiconductor Tech', value: 'GaN III High-Frequency Switching' },
      { label: 'Port Configuration', value: '2× USB-C (PD 65W) + 1× USB-A (22.5W)' },
      { label: 'Plug Type', value: 'Indian BIS Standard 2-Pin Round (IS 1293)' },
      { label: '0–50% Charge Time', value: '24 Mins (iPhone 16 Pro / S24 Ultra)' },
      { label: 'Dimensions & Weight', value: '51 × 39 × 32 mm · 112g' },
      { label: 'Warranty', value: '1-Year VoltEdge India Replacement Warranty' },
    ],
    starBreakdown: { 5: 79, 4: 15, 3: 4, 2: 1, 1: 1 },
    reviews: [
      {
        id: 'rev-201',
        author: 'Rohan Deshmukh',
        location: 'Pune, MH',
        rating: 5,
        date: '19 Sep 2026',
        variant: 'Charcoal Matte · 65W Dual USB-C + USB-A',
        title: 'Replaced both my MacBook Air brick and Samsung 45W charger',
        comment:
          'Triggers Super Fast Charging 2.0 on my S24 Ultra and powers my M3 MacBook Air effortlessly. Fits snugly into Indian wall sockets without wobbling.',
        verified: true,
      },
    ],
    isTrending: true,
    createdAt: '2026-09-03',
  },
  {
    id: 3,
    name: 'VoltEdge Tempered Glass Pro (2-Pack)',
    shortName: 'Tempered Glass Pro',
    price: 399,
    originalPrice: 699,
    rating: 4.9,
    reviewsCount: 5203,
    category: 'Screen Protectors',
    stock: 145,
    image: TEMPERED_GLASS_SVG,
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=Tempered+Glass+Pro',
    gallery: [
      {
        label: 'Studio View',
        url: TEMPERED_GLASS_SVG,
      },
      {
        label: 'Internal Architecture',
        url: SCHEMATIC_CUTAWAY_SVG,
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: '9H aluminosilicate glass with zero-dust auto-alignment installation tray.',
    description:
      'Crafted from double-ion-exchanged Japanese Asahi glass with a vacuum-deposited oleophobic coating that repels fingerprints and smudges. Includes our patented Pull-Tab Dust-Free Alignment Tray for a bubble-free installation in 10 seconds.',
    colors: [
      { name: 'HD Crystal Clear', hex: '#E5E7EB' },
      { name: '28° Anti-Spy Privacy', hex: '#27272A' },
    ],
    sizes: ['iPhone 16 / 15', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'Samsung S24 Ultra'],
    sizeLabel: 'Device Model',
    specs: [
      { label: 'Surface Hardness', value: '9H Certified (Withstands 28kg Edge Impact)' },
      { label: 'Glass Thickness', value: '0.33mm Ultra-Responsive Micro-Bevel 2.5D' },
      { label: 'Light Transmittance', value: '99.4% Optical Clarity' },
      { label: 'Coating', value: 'Electroplated Hydrophobic & Oleophobic Layer' },
      { label: 'Package Contents', value: '2× Tempered Glass, Auto-Align Tray, Cleaning Kit' },
      { label: 'Warranty', value: '1-Year Replacement Against Manufacturing Defects' },
    ],
    starBreakdown: { 5: 89, 4: 8, 3: 2, 2: 1, 1: 0 },
    reviews: [
      {
        id: 'rev-301',
        author: 'Karthik Iyer',
        location: 'Chennai, TN',
        rating: 5,
        date: '21 Sep 2026',
        variant: 'HD Crystal Clear · iPhone 16 Pro',
        title: 'Zero bubbles on the very first attempt',
        comment:
          'The alignment frame pulls out dust automatically when you pull the tab. Edges blend seamlessly with my MagSafe case.',
        verified: true,
      },
    ],
    isTrending: true,
    createdAt: '2026-09-05',
  },
  {
    id: 4,
    name: 'VoltEdge Wireless Earbuds ANC',
    shortName: 'Wireless Earbuds ANC',
    price: 2999,
    originalPrice: 4999,
    rating: 4.6,
    reviewsCount: 3456,
    category: 'Earbuds',
    stock: 29,
    image: '/src/assets/images/voltedge_anc_earbuds_1790736214610.jpg',
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=Wireless+Earbuds+ANC',
    gallery: [
      {
        label: 'Studio View',
        url: '/src/assets/images/voltedge_anc_earbuds_1790736214610.jpg',
      },
      {
        label: 'Ecosystem View',
        url: '/src/assets/images/voltedge_hero_ecosystem_1790736246088.jpg',
      },
      {
        label: 'Acoustic Chamber',
        url: SCHEMATIC_CUTAWAY_SVG,
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: '48dB Hybrid Active Noise Cancellation with 11mm titanium-coated dynamic drivers.',
    description:
      'Designed with a smoked translucent polycarbonate shell and 6-mic environmental noise cancellation array. Enjoy 42 hours of total playback, spatial audio head-tracking, and 45ms ultra-low latency mode.',
    colors: [
      { name: 'Smoked Obsidian', hex: '#16161B' },
      { name: 'Frost Transparent', hex: '#D4D4DC' },
      { name: 'Volt Orange Edition', hex: '#FF6B35' },
    ],
    sizes: ['Standard Edition', 'Pro LDAC Hi-Res Edition'],
    sizeLabel: 'Audio Edition',
    specs: [
      { label: 'Noise Cancellation', value: 'Up to 48dB Hybrid Adaptive ANC + Transparency' },
      { label: 'Driver Unit', value: '11mm Custom Titanium-Diaphragm Dynamic Driver' },
      { label: 'Battery Life', value: '9 Hrs (Buds) / 42 Hrs Total with MagSafe Case' },
      { label: 'Bluetooth Version', value: 'Bluetooth 5.4 Dual-Device Multipoint' },
      { label: 'Water Resistance', value: 'IPX5 Sweat & Splash Resistant' },
      { label: 'Fast Charge', value: '10 Mins Charge = 4 Hours Playback' },
    ],
    starBreakdown: { 5: 74, 4: 18, 3: 5, 2: 2, 1: 1 },
    reviews: [
      {
        id: 'rev-401',
        author: 'Ananya Patel',
        location: 'Ahmedabad, GJ',
        rating: 5,
        date: '17 Sep 2026',
        variant: 'Smoked Obsidian · Pro LDAC Hi-Res Edition',
        title: 'Drowns out Delhi Metro & flight cabin noise effortlessly',
        comment:
          'At ₹2,999 these punch way above their price bracket. The translucent case looks straight out of a flagship industrial design studio.',
        verified: true,
      },
    ],
    isTrending: true,
    createdAt: '2026-09-08',
  },
  {
    id: 5,
    name: 'VoltEdge Clear MagSafe Case (iPhone 16)',
    shortName: 'Clear MagSafe Case',
    price: 999,
    originalPrice: 1499,
    rating: 4.5,
    reviewsCount: 892,
    category: 'Phone Cases',
    stock: 54,
    image: '/src/assets/images/voltedge_magsafe_case_1790736227154.jpg',
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=Clear+MagSafe+Case',
    gallery: [
      {
        label: 'Studio View',
        url: '/src/assets/images/voltedge_magsafe_case_1790736227154.jpg',
      },
      {
        label: 'Internal Architecture',
        url: SCHEMATIC_CUTAWAY_SVG,
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: 'Anti-yellowing Bayer polycarbonate with CNC-machined aluminum camera bezel.',
    description:
      'Engineered with German Bayer Makrolon polycarbonate that resists UV yellowing for 24 months. Built-in Halbach magnet ring delivers 2× stronger magnetic lock than standard cases, paired with 10-foot military drop protection.',
    colors: [
      { name: 'Smoked Clear', hex: '#3A3A46' },
      { name: 'Crystal Clear', hex: '#E4E4EC' },
      { name: 'Stealth Matte Black', hex: '#141418' },
    ],
    sizes: ['iPhone 16', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 15 Pro'],
    sizeLabel: 'Model Fit',
    specs: [
      { label: 'Drop Protection', value: 'MIL-STD-810G 10ft (3m) Air-Pocket Corners' },
      { label: 'Camera Lip', value: '2.2mm Raised Anodized Aluminum Bezel' },
      { label: 'Magnetic Array', value: '38× N52 Quadrupole MagSafe Magnets' },
      { label: 'Material', value: 'Bayer Anti-Yellowing PC + Shock-Absorbing TPU' },
      { label: 'Buttons', value: 'Tactile Machined Metallic Action & Camera Buttons' },
    ],
    starBreakdown: { 5: 71, 4: 19, 3: 6, 2: 2, 1: 2 },
    reviews: [
      {
        id: 'rev-501',
        author: 'Vikram Malhotra',
        location: 'New Delhi, DL',
        rating: 5,
        date: '12 Sep 2026',
        variant: 'Smoked Clear · iPhone 16 Pro',
        title: 'Clicky metal buttons and rock-solid MagSafe grip',
        comment:
          'Love the smoked tint on my black titanium iPhone. The raised metal camera ring lets the phone sit flat and protects the lenses.',
        verified: true,
      },
    ],
    isTrending: true,
    createdAt: '2026-09-10',
  },
  {
    id: 6,
    name: 'VoltEdge 100W USB-C to USB-C Cable (2m)',
    shortName: '100W USB-C Cable (2m)',
    price: 499,
    originalPrice: 799,
    rating: 4.8,
    reviewsCount: 4102,
    category: 'Chargers & Cables',
    stock: 112,
    image: USBC_CABLE_SVG,
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=100W+USB-C+Cable',
    gallery: [
      {
        label: 'Studio View',
        url: USBC_CABLE_SVG,
      },
      {
        label: 'Ecosystem View',
        url: '/src/assets/images/voltedge_hero_ecosystem_1790736246088.jpg',
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: 'Ballistic Kevlar-braided 2m cord with smart E-Marker chip & real-time LED wattage meter.',
    description:
      'Built to survive 35,000+ 90-degree bends, this 2-meter braided cable features an integrated E-Marker smart chip that safely negotiates up to 100W (20V/5A) PD fast charging for laptops, tablets, and flagship smartphones.',
    colors: [
      { name: 'Obsidian Weave', hex: '#1B1B22' },
      { name: 'Electric Orange Weave', hex: '#FF6B35' },
    ],
    sizes: ['1.2m Standard', '2.0m Extended Reach'],
    sizeLabel: 'Length',
    specs: [
      { label: 'Max Power Delivery', value: '100W (20V / 5A) PD 3.0 with Smart E-Marker IC' },
      { label: 'Data Transfer', value: '480 Mbps USB 2.0 High-Speed Sync' },
      { label: 'Outer Jacket', value: 'Double-Braided Aramid Kevlar Fiber' },
      { label: 'Bend Lifespan', value: '35,000+ Cycles Lab Tested' },
      { label: 'Connector Shell', value: 'CNC Zinc-Alloy with Live Wattage Display' },
    ],
    starBreakdown: { 5: 84, 4: 12, 3: 3, 2: 1, 1: 0 },
    reviews: [
      {
        id: 'rev-601',
        author: 'Siddharth Rao',
        location: 'Hyderabad, TS',
        rating: 5,
        date: '15 Sep 2026',
        variant: 'Obsidian Weave · 2.0m Extended Reach',
        title: 'Live wattage display is super satisfying',
        comment:
          'Seeing the real-time 65W / 45W readout right on the plug is awesome. Thick, tangle-free braiding and comes with a silicone organizer strap.',
        verified: true,
      },
    ],
    isTrending: true,
    createdAt: '2026-09-12',
  },
  {
    id: 7,
    name: 'VoltEdge Smart Watch Strap (Silicone)',
    shortName: 'Smart Watch Strap',
    price: 299,
    originalPrice: 499,
    rating: 4.4,
    reviewsCount: 678,
    category: 'Smart Watches',
    stock: 8,
    image: WATCH_STRAP_SVG,
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=Smart+Watch+Strap',
    gallery: [
      {
        label: 'Studio View',
        url: WATCH_STRAP_SVG,
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: 'High-density compression-molded fluoroelastomer with brushed titanium pin-and-tuck clasp.',
    description:
      'Sweatproof, UV-resistant, and ultra-soft against the wrist during intense workouts or all-day wear. Precision lug connectors lock securely into Apple Watch Series 1–10, SE, and Ultra 1/2.',
    colors: [
      { name: 'Stealth Black', hex: '#18181F' },
      { name: 'Volt Orange', hex: '#FF6B35' },
      { name: 'Indigo Pulse', hex: '#6C63FF' },
    ],
    sizes: ['41mm / 40mm / 42mm', '45mm / 44mm / 49mm Ultra'],
    sizeLabel: 'Case Size',
    specs: [
      { label: 'Material', value: 'Skin-Safe Fluoroelastomer (FKM Grade)' },
      { label: 'Clasp Hardware', value: '316L Brushed Stainless Steel Pin-and-Tuck' },
      { label: 'Wrist Fit', value: '140mm – 215mm Adjustable Perforations' },
      { label: 'Waterproof Rating', value: '100% Swim & Sweat Impervious' },
    ],
    starBreakdown: { 5: 65, 4: 22, 3: 8, 2: 3, 1: 2 },
    reviews: [
      {
        id: 'rev-701',
        author: 'Meera Krishnan',
        location: 'Kochi, KL',
        rating: 4,
        date: '10 Sep 2026',
        variant: 'Stealth Black · 45mm / 44mm / 49mm Ultra',
        title: 'Zero skin irritation even in humid weather',
        comment:
          'Breathing channels underneath keep my wrist dry during morning runs. Fantastic value at ₹299.',
        verified: true,
      },
    ],
    isTrending: false,
    createdAt: '2026-09-14',
  },
  {
    id: 8,
    name: 'VoltEdge Car Mount (Magnetic)',
    shortName: 'Magnetic Car Mount',
    price: 599,
    originalPrice: 999,
    rating: 4.3,
    reviewsCount: 1234,
    category: 'Phone Cases',
    stock: 19,
    image: CAR_MOUNT_SVG,
    placeholderUrl:
      'https://placehold.co/400x400/1A1A1F/6C63FF?text=Magnetic+Car+Mount',
    gallery: [
      {
        label: 'Studio View',
        url: CAR_MOUNT_SVG,
      },
      {
        label: 'Internal Architecture',
        url: SCHEMATIC_CUTAWAY_SVG,
      },
      {
        label: 'In The Box',
        url: IN_BOX_CONTENTS_SVG,
      },
    ],
    tagline: '20× N52 ring magnet array engineered for Indian road conditions with 360° ball joint.',
    description:
      'Tested over speed breakers and rough highways, the VoltEdge Magnetic Car Mount uses a steel-hook air vent lock and a 3M VHB dashboard base so your phone stays rock-steady in portrait or landscape navigation.',
    colors: [
      { name: 'Anodized Gunmetal', hex: '#23232D' },
      { name: 'Obsidian Matte', hex: '#121216' },
    ],
    sizes: ['Vent + Dash Dual Mount', '3M Dashboard Pro Arm'],
    sizeLabel: 'Mount Type',
    specs: [
      { label: 'Magnet Array', value: '20× N52 Ring Magnets (2.2kg Holding Force)' },
      { label: 'Rotation', value: '360° Machined Aluminum Ball Joint' },
      { label: 'Mounting Options', value: 'Steel Vent Hook + 3M VHB Adhesive Pad Included' },
      { label: 'Compatibility', value: 'Direct MagSafe + 2× Metal Rings for Any Phone' },
    ],
    starBreakdown: { 5: 62, 4: 21, 3: 11, 2: 4, 1: 2 },
    reviews: [
      {
        id: 'rev-801',
        author: 'kabir Gill',
        location: 'Chandigarh, PB',
        rating: 5,
        date: '06 Sep 2026',
        variant: 'Anodized Gunmetal · Vent + Dash Dual Mount',
        title: 'Does not budge over potholes',
        comment:
          'The metal vent hook actually locks onto the blade instead of slipping off like spring clips. One-handed snap on and off is effortless.',
        verified: true,
      },
    ],
    isTrending: false,
    createdAt: '2026-09-16',
  },
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'VE-20260929-001',
    customerName: 'Aarav Sharma',
    customerEmail: 'aarav.sharma@gmail.com',
    phone: '9820411290',
    address: {
      fullName: 'Aarav Sharma',
      phone: '9820411290',
      pincode: '560034',
      area: '402, Palm Grove Indiranagar, 100 Feet Road',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
    items: [
      {
        productId: 1,
        name: 'VoltEdge MagSafe Power Bank 10000mAh',
        price: 2499,
        originalPrice: 3999,
        image: '/src/assets/images/voltedge_magsafe_powerbank_1790736178785.jpg',
        color: 'Obsidian Black',
        size: '10,000mAh Slim',
        quantity: 1,
      },
      {
        productId: 6,
        name: 'VoltEdge 100W USB-C to USB-C Cable (2m)',
        price: 499,
        originalPrice: 799,
        image: USBC_CABLE_SVG,
        color: 'Obsidian Weave',
        size: '2.0m Extended Reach',
        quantity: 1,
      },
    ],
    subtotal: 2998,
    shipping: 0,
    discount: 0,
    total: 2998,
    paymentMethod: 'UPI',
    paymentDetails: 'GPay (aarav@okicici)',
    status: 'Delivered',
    date: '29 Sep 2026',
    timestamp: Date.now() - 3600 * 1000 * 5,
  },
  {
    id: 'VE-20260928-002',
    customerName: 'Priya Nair',
    customerEmail: 'priya.nair@outlook.com',
    phone: '9845092311',
    address: {
      fullName: 'Priya Nair',
      phone: '9845092311',
      pincode: '400050',
      area: '14B, Sea Breeze Apartments, Pali Hill, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    items: [
      {
        productId: 4,
        name: 'VoltEdge Wireless Earbuds ANC',
        price: 2999,
        originalPrice: 4999,
        image: '/src/assets/images/voltedge_anc_earbuds_1790736214610.jpg',
        color: 'Smoked Obsidian',
        size: 'Pro LDAC Hi-Res Edition',
        quantity: 1,
      },
    ],
    subtotal: 2999,
    shipping: 0,
    discount: 0,
    total: 2999,
    paymentMethod: 'Card',
    paymentDetails: 'HDFC Infinia •••• 4829',
    status: 'Shipped',
    date: '28 Sep 2026',
    timestamp: Date.now() - 3600 * 1000 * 26,
  },
  {
    id: 'VE-20260928-003',
    customerName: 'Rohan Deshmukh',
    customerEmail: 'rohan.d@techcorp.in',
    phone: '9765401928',
    address: {
      fullName: 'Rohan Deshmukh',
      phone: '9765401928',
      pincode: '411007',
      area: 'Plot 28, Baner Pashan Link Road, Aundh',
      city: 'Pune',
      state: 'Maharashtra',
    },
    items: [
      {
        productId: 2,
        name: 'VoltEdge GaN Fast Charger 65W',
        price: 1299,
        originalPrice: 1999,
        image: '/src/assets/images/voltedge_gan_charger_65w_1790736195608.jpg',
        color: 'Charcoal Matte',
        size: '65W Dual USB-C + USB-A',
        quantity: 2,
      },
    ],
    subtotal: 2598,
    shipping: 0,
    discount: 0,
    total: 2598,
    paymentMethod: 'UPI',
    paymentDetails: 'PhonePe (rohan@ybl)',
    status: 'Packed',
    date: '28 Sep 2026',
    timestamp: Date.now() - 3600 * 1000 * 32,
  },
  {
    id: 'VE-20260927-004',
    customerName: 'Vikram Malhotra',
    customerEmail: 'vikram.m@gmail.com',
    phone: '9811239045',
    address: {
      fullName: 'Vikram Malhotra',
      phone: '9811239045',
      pincode: '110016',
      area: 'C-48, Hauz Khas Enclave',
      city: 'New Delhi',
      state: 'Delhi',
    },
    items: [
      {
        productId: 5,
        name: 'VoltEdge Clear MagSafe Case (iPhone 16)',
        price: 999,
        originalPrice: 1499,
        image: '/src/assets/images/voltedge_magsafe_case_1790736227154.jpg',
        color: 'Smoked Clear',
        size: 'iPhone 16 Pro',
        quantity: 1,
      },
      {
        productId: 3,
        name: 'VoltEdge Tempered Glass Pro (2-Pack)',
        price: 399,
        originalPrice: 699,
        image: TEMPERED_GLASS_SVG,
        color: 'HD Crystal Clear',
        size: 'iPhone 16 Pro',
        quantity: 1,
      },
    ],
    subtotal: 1398,
    shipping: 0,
    discount: 0,
    total: 1398,
    paymentMethod: 'COD',
    paymentDetails: 'Cash on Delivery',
    status: 'Pending',
    date: '27 Sep 2026',
    timestamp: Date.now() - 3600 * 1000 * 50,
  },
  {
    id: 'VE-20260926-005',
    customerName: 'Ananya Patel',
    customerEmail: 'ananya.patel@designstudio.co',
    phone: '9898112233',
    address: {
      fullName: 'Ananya Patel',
      phone: '9898112233',
      pincode: '380015',
      area: '901, Titanium City Centre, Prahlad Nagar',
      city: 'Ahmedabad',
      state: 'Gujarat',
    },
    items: [
      {
        productId: 1,
        name: 'VoltEdge MagSafe Power Bank 10000mAh',
        price: 2499,
        originalPrice: 3999,
        image: '/src/assets/images/voltedge_magsafe_powerbank_1790736178785.jpg',
        color: 'Electric Indigo',
        size: '10,000mAh + Kickstand',
        quantity: 1,
      },
      {
        productId: 8,
        name: 'VoltEdge Car Mount (Magnetic)',
        price: 599,
        originalPrice: 999,
        image: CAR_MOUNT_SVG,
        color: 'Anodized Gunmetal',
        size: 'Vent + Dash Dual Mount',
        quantity: 1,
      },
    ],
    subtotal: 3098,
    shipping: 0,
    discount: 0,
    total: 3098,
    paymentMethod: 'UPI',
    paymentDetails: 'Paytm (9898112233@paytm)',
    status: 'Delivered',
    date: '26 Sep 2026',
    timestamp: Date.now() - 3600 * 1000 * 74,
  },
  {
    id: 'VE-20260925-006',
    customerName: 'Siddharth Rao',
    customerEmail: 'sid.rao@hyderabadtech.in',
    phone: '9000123456',
    address: {
      fullName: 'Siddharth Rao',
      phone: '9000123456',
      pincode: '500081',
      area: 'Tower 3, My Home Bhooja, HITEC City',
      city: 'Hyderabad',
      state: 'Telangana',
    },
    items: [
      {
        productId: 4,
        name: 'VoltEdge Wireless Earbuds ANC',
        price: 2999,
        originalPrice: 4999,
        image: '/src/assets/images/voltedge_anc_earbuds_1790736214610.jpg',
        color: 'Volt Orange Edition',
        size: 'Pro LDAC Hi-Res Edition',
        quantity: 1,
      },
      {
        productId: 2,
        name: 'VoltEdge GaN Fast Charger 65W',
        price: 1299,
        originalPrice: 1999,
        image: '/src/assets/images/voltedge_gan_charger_65w_1790736195608.jpg',
        color: 'Charcoal Matte',
        size: '65W Dual USB-C + USB-A',
        quantity: 1,
      },
    ],
    subtotal: 4298,
    shipping: 0,
    discount: 0,
    total: 4298,
    paymentMethod: 'Card',
    paymentDetails: 'ICICI Sapphiro •••• 9104',
    status: 'Delivered',
    date: '25 Sep 2026',
    timestamp: Date.now() - 3600 * 1000 * 96,
  },
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const CATEGORIES_DATA = [
  {
    name: 'Phone Cases' as const,
    icon: 'fa-mobile-screen-button',
    subtitle: 'MagSafe & Drop-Tested Armor',
    count: '14 Models',
    image: '/src/assets/images/voltedge_magsafe_case_1790736227154.jpg',
    secondaryImage: CAR_MOUNT_SVG,
    featuredItems: ['Clear MagSafe Case (iPhone 16)', 'Magnetic N52 Car Mount'],
    startingPrice: 599,
  },
  {
    name: 'Chargers & Cables' as const,
    icon: 'fa-bolt',
    subtitle: 'GaN III Bricks & 100W Kevlar',
    count: '9 Products',
    image: '/src/assets/images/voltedge_gan_charger_65w_1790736195608.jpg',
    secondaryImage: USBC_CABLE_SVG,
    featuredItems: ['65W GaN III Fast Charger', '100W Braided USB-C Cable (2m)'],
    startingPrice: 499,
  },
  {
    name: 'Screen Protectors' as const,
    icon: 'fa-shield-halved',
    subtitle: '9H Sapphire & Privacy Glass',
    count: '12 Models',
    image: TEMPERED_GLASS_SVG,
    secondaryImage: SCHEMATIC_CUTAWAY_SVG,
    featuredItems: ['9H Tempered Glass Pro (2-Pack)', '28° Anti-Spy Privacy Glass'],
    startingPrice: 399,
  },
  {
    name: 'Earbuds' as const,
    icon: 'fa-headphones-simple',
    subtitle: '48dB Hybrid ANC Acoustics',
    count: '4 Editions',
    image: '/src/assets/images/voltedge_anc_earbuds_1790736214610.jpg',
    secondaryImage: HERO_ECOSYSTEM_IMAGE,
    featuredItems: ['Wireless Earbuds 48dB ANC', 'Pro LDAC Hi-Res Edition'],
    startingPrice: 2999,
  },
  {
    name: 'Power Banks' as const,
    icon: 'fa-battery-full',
    subtitle: 'Qi2 Magnetic & High-Output',
    count: '6 Models',
    image: '/src/assets/images/voltedge_magsafe_powerbank_1790736178785.jpg',
    secondaryImage: HERO_ECOSYSTEM_IMAGE,
    featuredItems: ['10000mAh Qi2 MagSafe Bank', '22.5W PD Pass-Through Slim'],
    startingPrice: 2499,
  },
  {
    name: 'Smart Watches' as const,
    icon: 'fa-clock',
    subtitle: 'Fluoroelastomer & Titanium Bands',
    count: '8 Straps',
    image: WATCH_STRAP_SVG,
    secondaryImage: IN_BOX_CONTENTS_SVG,
    featuredItems: ['FKM Silicone Sport Strap', '49mm Ultra Titanium Clasp'],
    startingPrice: 299,
  },
];

export interface TrendingSpotlightItem {
  id: string;
  productId: number;
  customTitle: string;
  customDescription: string;
  customImage: string;
  badgeLabel: string;
}

export interface HomePageConfig {
  heroFeaturedProductIds: number[];
  heroHeadline: string;
  heroSubtext: string;
  salesBarEnabled: boolean;
  salePercentage: number;
  saleCampaignTitle: string;
  saleProductIds: number[];
  trendingProductIds: number[];
  trendingSpotlights: TrendingSpotlightItem[];
}

export const DEFAULT_HOME_PAGE_CONFIG: HomePageConfig = {
  heroFeaturedProductIds: [1, 2, 4, 5],
  heroHeadline: 'Power Up Your Phone',
  heroSubtext:
    'Premium mobile accessories engineered for performance. Precision GaN III charging, cryo-aligned N52 MagSafe architecture, and flagship acoustics.',
  salesBarEnabled: true,
  salePercentage: 30,
  saleCampaignTitle: 'VOLTEDGE FLASH POWER SALE — FLAT 30% OFF SELECTED HARDWARE',
  saleProductIds: [1, 2, 4, 6],
  trendingProductIds: [1, 2, 3, 4, 5, 6],
  trendingSpotlights: [
    {
      id: 'spot-1',
      productId: 4,
      customTitle: 'VoltEdge Wireless Earbuds ANC — Studio Acoustic Isolation',
      customDescription:
        'Engineered with 48dB Hybrid Active Noise Cancellation, 11mm titanium-coated dynamic drivers, and a translucent smoked polycarbonate MagSafe case. Built to drown out metro commutes and cabin noise with 42 hours of total playback.',
      customImage: '/src/assets/images/voltedge_anc_earbuds_1790736214610.jpg',
      badgeLabel: 'Trending #1 in Audio',
    },
    {
      id: 'spot-2',
      productId: 2,
      customTitle: 'VoltEdge 65W GaN III Fast Charger — Dual-Device Powerhouse',
      customDescription:
        'Powered by 3rd-Gen Navitas Gallium Nitride semiconductors, this pocket-sized block delivers 65W PD 3.0 output to charge your MacBook Air and flagship phone simultaneously with zero thermal throttling.',
      customImage: '/src/assets/images/voltedge_gan_charger_65w_1790736195608.jpg',
      badgeLabel: 'Trending #1 in Power',
    },
  ],
};

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}
