import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

export interface ExtractedProductOcrData {
  rawText: string;
  detectedTitle?: string;
  detectedBrand?: string;
  tagline?: string;
  shortDescription?: string;
  fullDescription?: string;
  extractedSpecs?: Array<{ label: string; value: string }>;
  highlights?: string[];
}

interface AdminOcrScreenshotReaderProps {
  onApplyData: (data: ExtractedProductOcrData) => void;
  onApplyDescriptionOnly: (description: string) => void;
}

export const AdminOcrScreenshotReader: React.FC<AdminOcrScreenshotReaderProps> = ({
  onApplyData,
  onApplyDescriptionOnly,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedProductOcrData | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'specs' | 'text'>('preview');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      await runOcr(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await processImageFile(file);
          return;
        }
      }
    }
  };

  const runOcr = async (base64Image: string, mimeType: string) => {
    setIsProcessing(true);
    setProgressMsg('Scanning screenshot with AI Vision...');
    setExtractedData(null);

    try {
      // 1. Try server-side Gemini Vision OCR
      const res = await fetch('/api/admin/ocr-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, mimeType }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setExtractedData(json.data);
          setIsProcessing(false);
          setProgressMsg('');
          return;
        }
      }
    } catch {
      // Fallback to client-side Tesseract.js
    }

    // 2. Client-side Tesseract fallback
    try {
      setProgressMsg('Extracting text locally with Tesseract OCR...');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(base64Image);
      await worker.terminate();

      const rawText = ret.data.text || '';
      const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

      const parsedSpecs: Array<{ label: string; value: string }> = [];
      lines.forEach((line) => {
        if (line.includes(':')) {
          const parts = line.split(':');
          if (parts[0] && parts[1]) {
            parsedSpecs.push({ label: parts[0].trim(), value: parts.slice(1).join(':').trim() });
          }
        }
      });

      const fallbackData: ExtractedProductOcrData = {
        rawText,
        detectedTitle: lines[0] || 'Mobile Accessory',
        tagline: lines[1] || 'Engineered for high performance and durability',
        shortDescription: lines.slice(0, 3).join('. ') + '.',
        fullDescription: rawText,
        extractedSpecs: parsedSpecs.length > 0 ? parsedSpecs : [{ label: 'Specification', value: 'Extracted from packaging' }],
        highlights: lines.slice(0, 5),
      };

      setExtractedData(fallbackData);
    } catch (err) {
      console.error('Tesseract fallback error:', err);
      setProgressMsg('Unable to recognize text from this image. Please try a clearer screenshot.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      className="p-4 rounded-xl bg-[#16161D] border border-blue-500/30 space-y-3.5 focus:outline-none"
      tabIndex={0}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold">
            <i className="fa-solid fa-camera" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Screenshot to Product Description (OCR)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold uppercase">
                AI Vision
              </span>
            </h4>
            <p className="text-[11px] text-[#A0A0B0]">
              Paste screenshot (`Ctrl+V`) or upload spec sheet to auto-fill description &amp; specs
            </p>
          </div>
        </div>

        {extractedData && (
          <button
            type="button"
            onClick={() => {
              setImagePreview(null);
              setExtractedData(null);
            }}
            className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Upload & Drop Zone */}
      {!imagePreview && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) {
              processImageFile(e.dataTransfer.files[0]);
            }
          }}
          className="p-5 border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-xl bg-blue-950/20 hover:bg-blue-950/30 text-center cursor-pointer transition-all space-y-2"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center text-base">
            <i className="fa-solid fa-cloud-arrow-up" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">
              Drop screenshot here, or click to browse
            </p>
            <p className="text-[11px] text-blue-300 mt-0.5">
              💡 Tip: You can also copy any screenshot and press <strong className="text-white">Ctrl+V / Cmd+V</strong> directly!
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                processImageFile(e.target.files[0]);
              }
            }}
          />
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="p-6 rounded-xl bg-[#111115] border border-blue-500/30 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center text-lg animate-spin">
            <i className="fa-solid fa-circle-notch" />
          </div>
          <p className="text-xs font-bold text-white">{progressMsg || 'Analyzing screenshot...'}</p>
          <div className="w-48 h-1.5 rounded-full bg-slate-800 mx-auto overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse w-full" />
          </div>
        </div>
      )}

      {/* Extracted Preview & Results */}
      {imagePreview && !isProcessing && extractedData && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111115] border border-white/10">
            <img
              src={imagePreview}
              alt="Uploaded screenshot"
              className="w-16 h-16 object-cover rounded-lg border border-white/10 shrink-0"
            />
            <div className="overflow-hidden flex-1">
              <span className="text-[10px] font-bold text-amber-400 block uppercase">
                {extractedData.detectedBrand || 'Extracted Product'}
              </span>
              <h5 className="text-xs font-bold text-white truncate">
                {extractedData.detectedTitle || 'Product Specs Detected'}
              </h5>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {extractedData.tagline || extractedData.shortDescription}
              </p>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`pb-1.5 px-2 font-bold transition-colors ${
                activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'
              }`}
            >
              Description Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-1.5 px-2 font-bold transition-colors ${
                activeTab === 'specs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'
              }`}
            >
              Specs ({extractedData.extractedSpecs?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`pb-1.5 px-2 font-bold transition-colors ${
                activeTab === 'text' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'
              }`}
            >
              Raw OCR
            </button>
          </div>

          {activeTab === 'preview' && (
            <div className="p-3 rounded-lg bg-[#0F172A] border border-blue-900/50 space-y-2 text-xs">
              {extractedData.tagline && (
                <div className="text-amber-400 font-bold text-[11px]">
                  Tagline: &quot;{extractedData.tagline}&quot;
                </div>
              )}
              {extractedData.shortDescription && (
                <div className="text-slate-300 text-xs leading-relaxed">
                  <strong>Summary:</strong> {extractedData.shortDescription}
                </div>
              )}
              {extractedData.highlights && extractedData.highlights.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="font-bold text-slate-200 text-[11px]">Key Highlights:</div>
                  <ul className="list-disc pl-4 text-slate-300 text-[11px] space-y-0.5">
                    {extractedData.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1">
              {extractedData.extractedSpecs?.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-[#0F172A] border border-slate-800 text-[11px]"
                >
                  <span className="text-slate-400 block">{s.label}:</span>
                  <span className="text-white font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'text' && (
            <textarea
              readOnly
              rows={4}
              value={extractedData.rawText}
              className="w-full p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 text-[11px] text-slate-300 font-mono focus:outline-none"
            />
          )}

          {/* Transfer Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onApplyData(extractedData)}
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-wand-magic-sparkles text-xs text-amber-300" />
              <span>Apply All to Form (Description, Title, Specs)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onApplyDescriptionOnly(
                  extractedData.fullDescription ||
                    extractedData.shortDescription ||
                    extractedData.rawText
                )
              }
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
            >
              Description Only
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
