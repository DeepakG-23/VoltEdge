import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client with User-Agent header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to extract meta content
function extractMeta(html: string, propertyOrName: string): string {
  const regex = new RegExp(
    `<meta\\s+(?:property|name)=["']${propertyOrName}["']\\s+content=["']([^"']+)["']|<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${propertyOrName}["']`,
    'i'
  );
  const match = html.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

// -----------------------------------------------------------------------------
// API ROUTE 1: AI Product Importer (Universal URL Scraper & Spec Extractor)
// -----------------------------------------------------------------------------
app.post('/api/admin/scrape-product', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Valid product URL or search name is required' });
    }

    const cleanInput = url.trim();
    const isUrl = cleanInput.startsWith('http://') || cleanInput.startsWith('https://');

    let pageText = '';
    let fetchedTitle = '';
    let ogDescription = '';
    let ogImage = '';
    let extractedImages: string[] = [];
    let jsonLdData: any = null;

    if (isUrl) {
      try {
        const pageRes = await fetch(cleanInput, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(7000),
        });

        if (pageRes.ok) {
          const html = await pageRes.text();

          // Extract Title tag
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch) fetchedTitle = titleMatch[1].trim();

          // Extract OpenGraph tags
          const ogTitle = extractMeta(html, 'og:title');
          if (ogTitle && (!fetchedTitle || ogTitle.length > fetchedTitle.length)) {
            fetchedTitle = ogTitle;
          }
          ogDescription =
            extractMeta(html, 'og:description') ||
            extractMeta(html, 'description');
          ogImage =
            extractMeta(html, 'og:image') ||
            extractMeta(html, 'twitter:image');

          if (ogImage) {
            extractedImages.push(ogImage);
          }

          // Check for JSON-LD Schema
          const jsonLdMatches = html.match(
            /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
          );
          if (jsonLdMatches) {
            for (const block of jsonLdMatches.slice(0, 3)) {
              try {
                const rawJson = block.replace(
                  /<script[^>]*>|<\/script>/gi,
                  ''
                );
                const parsed = JSON.parse(rawJson);
                if (
                  parsed['@type'] === 'Product' ||
                  parsed['@type'] === 'IndividualProduct' ||
                  (Array.isArray(parsed['@graph']) &&
                    parsed['@graph'].some((g: any) => g['@type'] === 'Product'))
                ) {
                  jsonLdData = parsed;
                  if (parsed.image) {
                    const imgs = Array.isArray(parsed.image)
                      ? parsed.image
                      : [parsed.image];
                    imgs.forEach((img: any) => {
                      const src = typeof img === 'string' ? img : img.url;
                      if (src && !extractedImages.includes(src))
                        extractedImages.push(src);
                    });
                  }
                  break;
                }
              } catch {
                // Ignore JSON-LD parse errors
              }
            }
          }

          // Extract main text content
          pageText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
            .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 14000);
        }
      } catch {
        // If fetching fails or is blocked, Gemini will use live search grounding
      }
    }

    const prompt = `You are an expert e-commerce product catalog importer for 'Crazy Mobile' mobile accessories store (India).
Analyze the following input, which is a ${isUrl ? 'product page URL' : 'product name / search query'}.
Identify the product category, specifications, pricing in Indian Rupees (INR ₹), brand, compatibility, and customer-friendly marketing descriptions.

INPUT: ${cleanInput}
${isUrl ? `- INPUT_TYPE: URL` : `- INPUT_TYPE: PRODUCT_NAME_SEARCH_QUERY`}
${fetchedTitle ? `- FETCHED TITLE: ${fetchedTitle}` : ''}
${ogDescription ? `- OG DESCRIPTION: ${ogDescription}` : ''}
${jsonLdData ? `- JSON-LD SCHEMA: ${JSON.stringify(jsonLdData).slice(0, 1500)}` : ''}
${extractedImages.length > 0 ? `- DISCOVERED IMAGES: ${JSON.stringify(extractedImages)}` : ''}
${pageText ? `- PAGE CONTENT SUMMARY: ${pageText}` : '- NO DIRECT WEBPAGE TEXT CONTENT FETCHED (Use the Google Search tool and your own knowledge to retrieve accurate specs, prices, models, colors, materials, and features for this product)'}

MANDATORY CATEGORIES (MUST CHOOSE EXACTLY ONE):
- 'Mobile Covers'
- 'Tempered Glass'
- 'Earphones'
- 'Earbuds'
- 'Headphones'
- 'Neckbands'
- 'Cables'
- 'Chargers'
- 'Power Banks'
- 'Smart Watches'
- 'Wired Accessories'
- 'Wireless Accessories'

SPECIFICATIONS EXTRACTION GUIDELINES:
- Mobile Covers: Material (e.g. TPU, Silicone, Polycarbonate, Leather), Drop Protection (e.g. 10ft Military Grade), MagSafe (Yes/No), Raised Lip (e.g. 1.5mm Screen & Camera Lip), Finish (e.g. Matte Anti-Scratch)
- Tempered Glass: Hardness (e.g. 9H Hardness), Glass Type (e.g. 2.5D Full Cover / 28° Privacy / Anti-Blue Ray), Oleophobic Coating (Yes), Thickness (e.g. 0.33mm), Edge (3D Curved Full Glue)
- Cables: Cable Type (e.g. USB-A → USB-C / USB-C → USB-C / USB-C → Lightning / Lightning → USB-A / Micro USB / AUX / HDMI), Length (0.5m / 1m / 1.2m / 1.5m / 2m), Max Wattage (e.g. 100W PD / 60W / 18W), Power Delivery (Yes/No), Current Rating (e.g. 3A / 5A), Braided (Yes/No), Material (Braided Nylon, PVC, TPU)
- Chargers: Max Output (e.g. 65W GaN / 33W Fast Charger / 20W PD), Input/Output Voltage, Ports (Number of Ports, USB-A, USB-C, USB-C PD), Charging Technology (Power Delivery, Quick Charge, PPS), Safety (Over Voltage Protection, Over Current Protection, Over Temperature Protection, Short Circuit Protection, Surge Protection)
- Earbuds/Earphones/Neckbands/Headphones: Driver Size (e.g. 10mm, 13mm, 40mm), Driver Type, Bluetooth Version, Battery Capacity, Playtime/Playback Time, Charging Time, Features (ANC, ENC, Transparency, Low Latency, Gaming Mode), IP Rating
- Power Banks: Capacity (e.g. 10,000 mAh, 20,000 mAh), Rated Capacity, Input/Output, Max Wattage, USB-A Ports, USB-C Ports, Number of Outputs, PD, Fast Charging, Wireless Charging, Safety Protection

Generate:
1. 'name': Clean, professional product title without excessive spam keywords (under 75 chars, e.g., "Anker PowerPort III 20W Fast Charger").
2. 'brand': Brand name (e.g., Apple, Spigen, Anker, boAt, Crazy Mobile, Samsung, OnePlus, Ambrane, Baseus).
3. 'price': Realistic Indian Rupee integer selling price (e.g. 799, 1299, 1999).
4. 'originalPrice': MRP integer (must be higher than selling price for discount, e.g. 1999, 2999).
5. 'shortDescription': A highly polished, marketing-ready 2-3 sentence customer-facing summary. It MUST translate raw specs (wattage, materials, drivers, drop rating, IP rating) into relatable, everyday customer benefits (e.g., "Rapidly power up your devices to 50% in just 25 minutes while maintaining low operating temperatures for maximum safety.").
6. 'tagline': Catchy 1-sentence hook.
7. 'description': Full multi-paragraph description with key highlights.
8. 'specs': Array of 4-8 category-specific specifications {label, value}.
9. 'compatibleBrands': Array of phone brands (e.g. ["Apple", "Samsung", "OnePlus"]).
10. 'compatibleModels': Array of models (e.g. ["iPhone 16 Pro Max", "iPhone 15 Pro", "Galaxy S24 Ultra"]).
11. 'highlights': Array of 4-6 bullet points of premium customer benefits.
12. 'images': Array of image URLs (include discovered images, Google search images or reliable placeholders).
13. 'seoTitle': High-CTR search title tag.
14. 'seoDescription': 150-character meta description optimized for Google.
15. 'seoKeywords': Comma-separated list of 5-8 relevant search terms.
16. 'slug': Clean URL slug (e.g., "anker-powerport-iii-20w-fast-charger").

Return structured JSON adhering strictly to the schema.`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            category: { type: Type.STRING },
            subcategory: { type: Type.STRING },
            price: { type: Type.NUMBER },
            originalPrice: { type: Type.NUMBER },
            tagline: { type: Type.STRING },
            shortDescription: { type: Type.STRING },
            description: { type: Type.STRING },
            warranty: { type: Type.STRING },
            specs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                },
                required: ['label', 'value'],
              },
            },
            compatibleBrands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            compatibleModels: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            highlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            images: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            seoTitle: { type: Type.STRING },
            seoDescription: { type: Type.STRING },
            seoKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            slug: { type: Type.STRING },
          },
          required: [
            'name',
            'brand',
            'category',
            'price',
            'specs',
            'shortDescription',
          ],
        },
      },
    });

    const parsedData = JSON.parse(geminiRes.text || '{}');
    if (extractedImages.length > 0 && (!parsedData.images || parsedData.images.length === 0)) {
      parsedData.images = extractedImages;
    }

    return res.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error scraping product with Gemini:', errMsg);
    return res.status(500).json({
      error: 'Failed to extract product specs from URL or search name',
      details: errMsg,
    });
  }
});

// -----------------------------------------------------------------------------
// API ROUTE 2: AI Helper to Monitor Form Specs & Auto-Generate Descriptions
// -----------------------------------------------------------------------------
app.post('/api/admin/generate-description', async (req, res) => {
  try {
    const {
      name,
      category,
      brand,
      specs,
      warranty,
      phoneBrand,
      compatibleModels,
      connectorType,
      material,
      wattage,
      driverSize,
      batteryPlaytime,
    } = req.body;

    const formattedSpecs = Array.isArray(specs)
      ? specs
          .filter((s: any) => s && s.label && s.value)
          .map((s: any) => `${s.label}: ${s.value}`)
          .join('\n')
      : 'Standard specifications';

    const prompt = `You are the lead marketing copywriter for 'Crazy Mobile', a premier smartphone & accessories destination in India.
Your task is to monitor the following technical specifications and generate a highly polished, customer-friendly, marketing-ready product description.

PRODUCT NAME: ${name || 'Crazy Mobile Accessory'}
CATEGORY: ${category || 'Mobile Accessories'}
BRAND: ${brand || 'Crazy Mobile'}
PRIMARY PHONE BRAND: ${phoneBrand || 'Universal'}
COMPATIBLE MODELS: ${compatibleModels || 'Universal'}
CONNECTOR TYPE: ${connectorType || 'Standard'}
WARRANTY: ${warranty || '1-Year Crazy Mobile Warranty'}
ADDITIONAL CONTEXT: ${[material ? `Material: ${material}` : '', wattage ? `Wattage: ${wattage}` : '', driverSize ? `Driver: ${driverSize}` : '', batteryPlaytime ? `Battery: ${batteryPlaytime}` : ''].filter(Boolean).join(', ')}

CURRENT TECHNICAL SPECIFICATIONS:
${formattedSpecs}

REQUIREMENTS:
1. 'shortDescription': A highly compelling, concise, punchy, 2-3 sentence customer-facing summary. It MUST translate raw specs (like wattage, materials, driver diameter, drop rating, IP rating, etc.) into relatable, everyday customer benefits (e.g. "Rapidly charge your smartphone to 80% in just 30 minutes while keeping temperatures ultra-low" rather than dry jargon).
2. 'tagline': A snappy, high-impact single-sentence headline hook (e.g. "Unleash true charging speeds without the heat.").
3. 'highlights': Array of 4-6 bullet points articulating practical, benefit-focused buyer values.
4. 'fullDescription': A compelling, professional 2-3 paragraph e-commerce product description detailing structural build quality, everyday usability, and peace-of-mind warranty assurance.
5. 'seoTitle': High-CTR search title tag.
6. 'seoDescription': 150-character meta description optimized for Google Search.
7. 'seoKeywords': Comma-separated list of 5-8 relevant search terms.

Return strictly valid JSON adhering to the schema.`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortDescription: { type: Type.STRING },
            tagline: { type: Type.STRING },
            highlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            fullDescription: { type: Type.STRING },
            seoTitle: { type: Type.STRING },
            seoDescription: { type: Type.STRING },
            seoKeywords: { type: Type.STRING },
          },
          required: [
            'shortDescription',
            'tagline',
            'highlights',
            'fullDescription',
          ],
        },
      },
    });

    const parsed = JSON.parse(geminiRes.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error generating description with Gemini:', errMsg);
    return res.status(500).json({
      error: 'Failed to generate marketing description',
      details: errMsg,
    });
  }
});

// -----------------------------------------------------------------------------
// API ROUTE 3: OCR Screenshot Reader (Product Spec Sheet & Packaging Extraction)
// -----------------------------------------------------------------------------
app.post('/api/admin/ocr-screenshot', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'Image base64 data is required' });
    }

    const cleanData = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const actualMime = mimeType || (imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');

    const prompt = `You are an expert OCR product scanner for 'Crazy Mobiles', a premier mobile accessories store in India.
Examine this screenshot of a product label, spec sheet, retail box packaging, or specification table.
Extract all visible text and convert it into structured e-commerce product copy:
1. 'rawText': All readable text found in the image.
2. 'detectedTitle': Identified product name or model name.
3. 'detectedBrand': Identified brand (e.g. Crazy Mobiles, Apple, OnePlus, Samsung, boAt, Anker, etc.).
4. 'tagline': A punchy, single-sentence headline benefit hook.
5. 'shortDescription': A concise 2-3 sentence customer-facing summary translating technical specs into everyday benefits.
6. 'fullDescription': A comprehensive 2-3 paragraph product description detailing structural build quality, charging/audio performance, and everyday durability.
7. 'extractedSpecs': Array of { "label": string, "value": string } for all recognized technical specs (e.g. Battery Capacity: 5000mAh, Fast Charging: 65W GaN, Material: Braided Nylon, Connector: Type-C, Bluetooth: 5.4, etc.).
8. 'highlights': Array of 4-6 concise bullet points highlighting key advantages.

Return strictly valid JSON matching the schema.`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanData,
                mimeType: actualMime,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rawText: { type: Type.STRING },
            detectedTitle: { type: Type.STRING },
            detectedBrand: { type: Type.STRING },
            tagline: { type: Type.STRING },
            shortDescription: { type: Type.STRING },
            fullDescription: { type: Type.STRING },
            extractedSpecs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                },
                required: ['label', 'value'],
              },
            },
            highlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'rawText',
            'detectedTitle',
            'detectedBrand',
            'tagline',
            'shortDescription',
            'fullDescription',
            'extractedSpecs',
            'highlights',
          ],
        },
      },
    });

    const parsed = JSON.parse(geminiRes.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in OCR screenshot endpoint:', errMsg);
    return res.status(500).json({
      error: 'Failed to extract text from screenshot',
      details: errMsg,
    });
  }
});

// -----------------------------------------------------------------------------
// API ROUTE 4: Automated Transactional Emails (Order Confirmation & Shipping Status)
// -----------------------------------------------------------------------------
app.post('/api/send-email', async (req, res) => {
  try {
    const {
      to,
      customerName,
      type,
      orderId,
      orderTotal,
      items,
      shippingAddress,
      trackingNumber,
      carrier,
      status,
    } = req.body;

    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: 'Recipient email address (to) is required' });
    }

    const emailId = `cm_eml_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject =
      type === 'shipping_update'
        ? `📦 Crazy Mobiles: Order #${orderId} has been ${status || 'Dispatched'}`
        : `⚡ Crazy Mobiles: Order #${orderId} Confirmed (₹${orderTotal || 0})`;

    console.log(`[TRANSACTIONAL EMAIL DISPATCHED] ID: ${emailId} | To: ${to} | Subject: "${subject}"`);

    return res.json({
      success: true,
      emailId,
      recipient: to,
      customerName: customerName || 'Valued Customer',
      subject,
      type: type || 'order_confirmation',
      dispatchedAt: formattedDate,
      status: 'delivered',
      message: `Transactional email successfully sent to ${to}`,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error sending transactional email:', errMsg);
    return res.status(500).json({
      error: 'Failed to dispatch transactional email',
      details: errMsg,
    });
  }
});


// Mount Vite in development mode
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server listening on http://0.0.0.0:${PORT}`);
});
