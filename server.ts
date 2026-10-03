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

app.use(express.json());

// Initialize Gemini Client with User-Agent header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: AI Product Importer (URL Scraper & Category/Spec Extractor)
app.post('/api/admin/scrape-product', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Valid product URL is required' });
    }

    const cleanUrl = url.trim();
    let pageText = '';
    let fetchedTitle = '';

    try {
      const pageRes = await fetch(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (pageRes.ok) {
        const html = await pageRes.text();

        // Extract Title tag
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) fetchedTitle = titleMatch[1].trim();

        // Strip scripts, styles, HTML tags
        pageText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 12000);
      }
    } catch {
      // If fetching fails, proceed with Gemini analyzing the URL string
    }

    const prompt = `You are an expert e-commerce product analysis engine for 'Crazy Mobile' mobile accessories store.
Analyze the following product page content and URL to identify product category, specifications, pricing, brand, and details.

PRODUCT URL: ${cleanUrl}
PAGE TITLE: ${fetchedTitle || 'N/A'}
PAGE CONTENT SUMMARY:
${pageText || 'Content could not be directly fetched; analyze product details from the URL path, keywords, brand, and model numbers.'}

CATEGORIES AVAILABLE (MUST CHOOSE EXACTLY ONE):
- 'Mobile Covers'
- 'Tempered Glass'
- 'Earphones'
- 'Headphones'
- 'Neckbands'
- 'Wired Accessories'
- 'Wireless Accessories'
- 'Chargers'
- 'Cables'
- 'Power Banks'
- 'Smart Watches'

EXTRACT CATEGORY-SPECIFIC SPECIFICATIONS (ARRAY OF {label, value}):
- For Chargers: Output Power (e.g. 65W GaN), Ports (e.g. 2x USB-C + 1x USB-A), Fast Charging Tech (e.g. PD 3.0 / PPS), Input Voltage, Safety Certification
- For Cables: Length (e.g. 1.2m), Connector (e.g. USB-C to USB-C), Max Wattage (e.g. 100W PD), Data Speed (e.g. 480 Mbps), Jacket Material (e.g. Nylon Braided)
- For Mobile Covers: Material (e.g. TPU & Polycarbonate), Drop Rating (e.g. 12ft Military Grade), MagSafe (e.g. MagSafe Compatible), Screen/Camera Lip, Finish (e.g. Matte Anti-Scratch)
- For Tempered Glass: Hardness (e.g. 9H Hardness), Glass Type (e.g. 28° Anti-Spy Privacy Glass), Edge Contour (e.g. 3D Curved Full Edge), Oleophobic Coating, Thickness (e.g. 0.33mm)
- For Earphones/Earbuds/Headphones/Neckbands: Driver Size (e.g. 13mm Dynamic), Battery Playtime (e.g. 40 Hours), ANC Level (e.g. 35dB Hybrid ANC), Bluetooth Version (e.g. v5.4), Water Resistance (e.g. IPX5)

Return structured JSON adhering strictly to the schema.`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            brand: { type: Type.STRING },
            category: { type: Type.STRING },
            price: { type: Type.NUMBER },
            originalPrice: { type: Type.NUMBER },
            tagline: { type: Type.STRING },
            description: { type: Type.STRING },
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
            colors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                },
                required: ['name', 'hex'],
              },
            },
          },
          required: ['name', 'brand', 'category', 'price', 'specs'],
        },
      },
    });

    const parsedData = JSON.parse(geminiRes.text || '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error scraping product with Gemini:', errMsg);
    return res.status(500).json({
      error: 'Failed to extract product specs from URL',
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
