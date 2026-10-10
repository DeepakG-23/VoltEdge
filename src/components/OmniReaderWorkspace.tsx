import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Trash2, 
  Clock, 
  Search, 
  Image as ImageIcon, 
  FileCode, 
  FileSpreadsheet, 
  AlertCircle,
  RefreshCw,
  Eye,
  CheckCircle2,
  FileCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface ExtractedDocumentData {
  id: string;
  timestamp: string;
  fileName: string;
  fileType: string;
  fileSize?: string;
  rawText: string;
  detectedTitle: string;
  detectedBrand: string;
  category?: string;
  tagline: string;
  shortDescription: string;
  fullDescription: string;
  extractedSpecs: Array<{ label: string; value: string }>;
  highlights: string[];
}

const SAMPLE_DOCUMENTS = [
  {
    name: 'Sample Product Spec Sheet.png',
    type: 'image/png',
    badge: 'Product Spec Sheet',
    preview: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
    description: 'High-end smartwatch retail packaging with 45mm AMOLED display, 7-day battery life, and military-grade durability specs.'
  },
  {
    name: 'Tech Invoice & Warranty.png',
    type: 'image/png',
    badge: 'Invoice / Receipt',
    preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    description: 'Detailed purchase invoice with line items, tax breakdown, serial numbers, and warranty card terms.'
  },
  {
    name: 'GaN Charger User Manual.png',
    type: 'image/png',
    badge: 'Technical Manual',
    preview: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    description: 'Multi-port 65W GaN fast charger specifications, input/output voltage ratings, and safety certifications.'
  }
];

export const OmniReaderWorkspace: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [currentExtraction, setCurrentExtraction] = useState<ExtractedDocumentData | null>(null);
  const [history, setHistory] = useState<ExtractedDocumentData[]>(() => {
    try {
      const saved = localStorage.getItem('omnireader_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'raw' | 'highlights'>('overview');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('omnireader_history_v1', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload a valid image (PNG, JPG, WEBP) or PDF document.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setFilePreview(file.type === 'application/pdf' ? 'pdf' : base64);
      await processDocument(base64, file.type, file.name);
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
          await handleFileSelect(file);
          return;
        }
      }
    }
  };

  const loadSampleDocument = async (sample: typeof SAMPLE_DOCUMENTS[0]) => {
    setIsProcessing(true);
    setProgressStatus(`Loading sample ${sample.badge}...`);
    try {
      // Fetch sample image and convert to base64
      const resp = await fetch(sample.preview);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setFilePreview(base64);
        await processDocument(base64, sample.type, sample.name);
      };
      reader.readAsDataURL(blob);
    } catch {
      setIsProcessing(false);
      alert('Failed to load sample document.');
    }
  };

  const processDocument = async (base64Data: string, mimeType: string, fileName: string) => {
    setIsProcessing(true);
    setProgressStatus('Uploading document to Gemini Vision AI...');
    setCurrentExtraction(null);

    try {
      const res = await fetch('/api/admin/ocr-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });

      if (!res.ok) {
        throw new Error('Server extraction failed');
      }

      setProgressStatus('Grabbing every piece of description, specs & text...');
      const json = await res.json();
      if (json.success && json.data) {
        const newDoc: ExtractedDocumentData = {
          id: 'doc-' + Date.now(),
          timestamp: new Date().toLocaleString(),
          fileName,
          fileType: mimeType,
          rawText: json.data.rawText || '',
          detectedTitle: json.data.detectedTitle || 'Extracted Document',
          detectedBrand: json.data.detectedBrand || 'General',
          category: json.data.category || 'Document / Specification',
          tagline: json.data.tagline || '',
          shortDescription: json.data.shortDescription || '',
          fullDescription: json.data.fullDescription || json.data.rawText,
          extractedSpecs: json.data.extractedSpecs || [],
          highlights: json.data.highlights || [],
        };

        setCurrentExtraction(newDoc);
        setHistory((prev) => [newDoc, ...prev.filter((d) => d.fileName !== fileName)].slice(0, 25));
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing document with AI. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadJson = () => {
    if (!currentExtraction) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentExtraction, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${currentExtraction.detectedTitle.replace(/\s+/g, '_')}_extraction.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const downloadMarkdown = () => {
    if (!currentExtraction) return;
    const md = `# ${currentExtraction.detectedTitle}
**Brand / Source:** ${currentExtraction.detectedBrand}
**Category:** ${currentExtraction.category || 'General'}
**Extracted At:** ${currentExtraction.timestamp}

## Tagline
> ${currentExtraction.tagline}

## Short Description
${currentExtraction.shortDescription}

## Full Description
${currentExtraction.fullDescription}

## Key Highlights
${currentExtraction.highlights.map((h) => `- ${h}`).join('\n')}

## Specifications & Data Table
| Specification | Value |
| --- | --- |
${currentExtraction.extractedSpecs.map((s) => `| ${s.label} | ${s.value} |`).join('\n')}

## Raw OCR Text
\`\`\`
${currentExtraction.rawText}
\`\`\`
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `${currentExtraction.detectedTitle.replace(/\s+/g, '_')}_extraction.md`;
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  const filteredHistory = history.filter(
    (item) =>
      item.detectedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detectedBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rawText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onPaste={handlePaste}
      tabIndex={0}
      className="min-h-screen bg-[#0A0A0F] text-slate-100 flex flex-col focus:outline-none font-sans"
    >
      {/* Top Navigation / Hero Banner */}
      <header className="border-b border-white/10 bg-[#121218]/80 backdrop-blur-xl sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                OmniReader AI
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-semibold">
                  Universal Description Grabber
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Instantly extract every piece of description, specs, tables & text from screenshots, images, & PDFs using Gemini AI Vision.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-200">AI Engine Ready</div>
              <div className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                gemini-3.8-flash active
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload / Paste Center & Sample Documents */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Upload Card */}
          <div className="p-5 rounded-2xl bg-[#161622] border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Document or Screenshot
              </h3>
              <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded">
                Ctrl+V to Paste
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 rounded-xl p-6 text-center bg-blue-950/10 hover:bg-blue-950/20 cursor-pointer transition-all space-y-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/10">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Click to upload or drag & drop</p>
                <p className="text-[11px] text-slate-400">
                  Screenshots, product photos, invoices, manuals (PNG, JPG, PDF)
                </p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Sample Documents Quick Select */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Or try a sample document:
              </div>
              <div className="space-y-2">
                {SAMPLE_DOCUMENTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadSampleDocument(sample)}
                    disabled={isProcessing}
                    className="w-full text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {sample.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{sample.badge}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Extraction History Panel */}
          <div className="p-5 rounded-2xl bg-[#161622] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> Recent Extractions
              </h3>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past extractions..."
                className="w-full bg-[#0D0D12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No extractions yet. Upload or paste a screenshot above!
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentExtraction(item)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      currentExtraction?.id === item.id
                        ? 'bg-blue-900/30 border-blue-500/50 shadow-md'
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        {item.detectedBrand}
                      </span>
                      <span className="text-[9px] text-slate-500">{item.timestamp}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{item.detectedTitle}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.tagline || item.shortDescription}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Processing / Results View */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Processing State Banner */}
          {isProcessing && (
            <div className="p-10 rounded-2xl bg-[#161622] border border-blue-500/30 text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center text-2xl animate-spin shadow-lg shadow-blue-600/20">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">AI Vision OCR & Description Extractor</h3>
                <p className="text-xs text-blue-300 font-medium">{progressStatus || 'Analyzing document...'}</p>
              </div>
              <div className="w-64 h-2 rounded-full bg-slate-800 mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* Empty State when no document loaded */}
          {!isProcessing && !currentExtraction && (
            <div className="p-16 rounded-2xl bg-[#161622] border border-white/10 text-center space-y-4 shadow-2xl flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-20 h-20 rounded-3xl bg-blue-600/10 text-blue-400 flex items-center justify-center text-3xl shadow-xl border border-blue-500/20">
                <FileCheck className="w-10 h-10" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-base font-extrabold text-white">Ready to Grab Every Piece of Description</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload any product screenshot, receipt, invoice, technical manual, or specification sheet. OmniReader AI will instantly parse, structure, and extract every description and detail for you.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Screenshot / PDF
                </button>
              </div>
            </div>
          )}

          {/* Results View */}
          {!isProcessing && currentExtraction && (
            <div className="space-y-6">
              
              {/* Document Header Card */}
              <div className="p-6 rounded-2xl bg-[#161622] border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase border border-amber-500/30">
                        {currentExtraction.detectedBrand}
                      </span>
                      {currentExtraction.category && (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase border border-blue-500/30">
                          {currentExtraction.category}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{currentExtraction.timestamp}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1.5 tracking-tight">
                      {currentExtraction.detectedTitle}
                    </h2>
                    <p className="text-xs text-blue-300 mt-1 font-medium italic">
                      "{currentExtraction.tagline}"
                    </p>
                  </div>

                  {/* Export / Copy Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => downloadJson()}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all inline-flex items-center gap-1.5"
                      title="Download JSON"
                    >
                      <FileCode className="w-3.5 h-3.5 text-amber-400" /> JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadMarkdown()}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-all inline-flex items-center gap-1.5"
                      title="Download Markdown Report"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" /> Export MD
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-white/10 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-3 font-bold transition-all border-b-2 ${
                      activeTab === 'overview'
                        ? 'text-blue-400 border-blue-500'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    Descriptions & Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('specs')}
                    className={`pb-2 px-3 font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                      activeTab === 'specs'
                        ? 'text-blue-400 border-blue-500'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Structured Specs ({currentExtraction.extractedSpecs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('highlights')}
                    className={`pb-2 px-3 font-bold transition-all border-b-2 ${
                      activeTab === 'highlights'
                        ? 'text-blue-400 border-blue-500'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    Highlights ({currentExtraction.highlights.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raw')}
                    className={`pb-2 px-3 font-bold transition-all border-b-2 ${
                      activeTab === 'raw'
                        ? 'text-blue-400 border-blue-500'
                        : 'text-slate-400 border-transparent hover:text-white'
                    }`}
                  >
                    Raw OCR Text
                  </button>
                </div>
              </div>

              {/* Tab 1: Overview & Descriptions */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#161622] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Short Summary</h4>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentExtraction.shortDescription, 'short')}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        {copiedSection === 'short' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSection === 'short' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-white bg-white/5 p-3.5 rounded-xl border border-white/5">
                      {currentExtraction.shortDescription}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#161622] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Full Detailed Description</h4>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(currentExtraction.fullDescription, 'full')}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        {copiedSection === 'full' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSection === 'full' ? 'Copied!' : 'Copy Full Description'}
                      </button>
                    </div>
                    <div className="text-xs leading-relaxed text-slate-200 bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                      {currentExtraction.fullDescription}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Structured Specs Table */}
              {activeTab === 'specs' && (
                <div className="p-5 rounded-2xl bg-[#161622] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Extracted Specifications & Data Table</h4>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          currentExtraction.extractedSpecs.map((s) => `${s.label}: ${s.value}`).join('\n'),
                          'specs'
                        )
                      }
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      {copiedSection === 'specs' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'specs' ? 'Copied Table!' : 'Copy Table'}
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-slate-400 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-3">Specification / Attribute</th>
                          <th className="p-3">Extracted Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {currentExtraction.extractedSpecs.map((spec, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-bold text-slate-300">{spec.label}</td>
                            <td className="p-3 text-white font-medium">{spec.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Highlights */}
              {activeTab === 'highlights' && (
                <div className="p-5 rounded-2xl bg-[#161622] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Key Takeaways & Highlights</h4>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentExtraction.highlights.join('\n'), 'highlights')}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      {copiedSection === 'highlights' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'highlights' ? 'Copied Highlights!' : 'Copy'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentExtraction.highlights.map((h, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-white font-medium">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Raw OCR Text */}
              {activeTab === 'raw' && (
                <div className="p-5 rounded-2xl bg-[#161622] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Raw Verbatim OCR Text</h4>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentExtraction.rawText, 'raw')}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      {copiedSection === 'raw' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSection === 'raw' ? 'Copied Raw Text!' : 'Copy Raw Text'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0D0D12] border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {currentExtraction.rawText}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </main>
    </div>
  );
};
