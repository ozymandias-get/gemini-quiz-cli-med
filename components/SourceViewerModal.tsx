import { useEffect, useRef, useState, useCallback, type FC } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
  PanelRightClose,
  PanelRightOpen,
  Target,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { getDocument, TextLayer } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import '../services/pdfjsWorker';
import type { Question } from '../types';
import { useTranslation } from '../hooks/useTranslations';

interface SourceViewerModalProps {
  file: File | null;
  question: Question;
  onClose: () => void;
}

/** Metin öğelerinden düz string üretir (pdf.js TextItem / TextMarkedContent). */
function joinTextItems(items: { str?: string }[]): string {
  return items.map((item) => ('str' in item && typeof item.str === 'string' ? item.str : '')).join(' ');
}

function normalizeSearch(str: string, locale: string) {
  return str
    .toLocaleLowerCase(locale)
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const SourceViewerModal: FC<SourceViewerModalProps> = ({ file, question, onClose }) => {
  const { t, language } = useTranslation();
  const sv = t.sourceViewer;
  const searchLocale = language === 'en' ? 'en' : 'tr';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerControllerRef = useRef<TextLayer | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [scale, setScale] = useState<number | null>(null);

  const [searchText, setSearchText] = useState<string>(question.sourceQuote || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'IDLE' | 'FOUND' | 'NOT_FOUND'>('IDLE');
  const [activeHighlightType, setActiveHighlightType] = useState<'EVIDENCE' | 'OPTION' | 'MANUAL'>('EVIDENCE');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const loadPdf = async () => {
      if (!file) {
        toast.error(sv.fileNotFound, { duration: 4000 });
        setPdfLoadFailed(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setPdfLoadFailed(false);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error(sv.loadError, { duration: 4000 });
        setPdfLoadFailed(true);
        setLoading(false);
      }
    };
    void loadPdf();
  }, [file, sv.fileNotFound, sv.loadError]);

  useEffect(() => {
    const findPageForText = async () => {
      if (!pdfDoc || !searchText || searchText.length < 3) {
        setSearchStatus('IDLE');
        return;
      }

      setIsSearching(true);
      setSearchStatus('IDLE');

      try {
        const normalizedQuery = normalizeSearch(searchText, searchLocale);
        const queryWords = normalizedQuery.split(' ').filter((w) => w.length > 3);

        const maxPage = Math.min(pdfDoc.numPages, 50);

        let bestPage = -1;
        let maxScore = 0;

        const scoreText = (pageText: string) => {
          const normalizedPage = normalizeSearch(pageText, searchLocale);

          if (normalizedPage.includes(normalizedQuery.substring(0, 50))) return 1000;

          let matches = 0;
          queryWords.forEach((word) => {
            if (normalizedPage.includes(word)) matches++;
          });

          return queryWords.length > 0 ? (matches / queryWords.length) * 100 : 0;
        };

        const currentPageObj = await pdfDoc.getPage(pageNumber);
        const currentContent = await currentPageObj.getTextContent();
        const currentText = joinTextItems(currentContent.items as { str?: string }[]);

        const currentScore = scoreText(currentText);
        if (currentScore > 70) {
          setIsSearching(false);
          setSearchStatus('FOUND');
          return;
        }

        for (let i = 1; i <= maxPage; i++) {
          if (i === pageNumber) continue;

          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = joinTextItems(textContent.items as { str?: string }[]);

          const score = scoreText(pageText);
          if (score > maxScore) {
            maxScore = score;
            bestPage = i;
          }

          if (maxScore === 1000) break;
        }

        if (bestPage !== -1 && maxScore > 40) {
          setPageNumber(bestPage);
          setSearchStatus('FOUND');
        } else {
          setSearchStatus('NOT_FOUND');
        }
      } catch (e) {
        console.error('Search error', e);
        setSearchStatus('NOT_FOUND');
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      void findPageForText();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText, pdfDoc, searchLocale]);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current || !containerRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNumber);

      let renderScale = scale;
      if (!renderScale) {
        const container = containerRef.current;
        const style = window.getComputedStyle(container);
        const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const availableWidth = container.clientWidth - paddingX;
        const unscaledViewport = page.getViewport({ scale: 1 });
        renderScale = Math.min(availableWidth / unscaledViewport.width, 2.0);
        if (renderScale < 0.6) renderScale = 0.6;
      }

      const viewport = page.getViewport({ scale: renderScale });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (context) {
        const renderContext = { canvasContext: context, viewport: viewport };
        await page.render(renderContext).promise;
      }

      const textContent = await page.getTextContent();
      const textLayerDiv = textLayerRef.current;
      textLayerDiv.innerHTML = '';
      textLayerDiv.style.height = `${viewport.height}px`;
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.setProperty('--scale-factor', String(renderScale));

      textLayerControllerRef.current?.cancel();
      const layer = new TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: viewport,
      });
      textLayerControllerRef.current = layer;
      await layer.render();

      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        if (!searchText) return;

        const normalizedQuery = normalizeSearch(searchText, searchLocale);
        const spans = textLayerDiv.querySelectorAll('span');
        const queryWords = new Set(normalizedQuery.split(' ').filter((w) => w.length > 3));

        let firstMatch: HTMLElement | null = null;

        let highlightColor = 'rgba(255, 215, 0, 0.5)';
        if (activeHighlightType === 'OPTION') highlightColor = 'rgba(59, 130, 246, 0.4)';
        if (activeHighlightType === 'MANUAL') highlightColor = 'rgba(251, 146, 60, 0.5)';

        spans.forEach((span) => {
          const rawSpanText = span.textContent || '';
          const spanText = normalizeSearch(rawSpanText, searchLocale);
          let isMatch = false;

          if (spanText.length > 4 && normalizedQuery.includes(spanText)) {
            isMatch = true;
          } else if (spanText.length > 3) {
            const words = spanText.split(' ');
            const matchCount = words.filter((w) => queryWords.has(w)).length;
            if (matchCount > 0 && matchCount / words.length >= 0.5) {
              isMatch = true;
            }
          }

          if (isMatch) {
            span.style.backgroundColor = highlightColor;
            span.style.borderRadius = '3px';
            span.style.boxShadow = `0 0 4px ${highlightColor}`;
            if (!firstMatch) firstMatch = span as HTMLElement;
          }
        });

        if (firstMatch && containerRef.current) {
          firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } catch (err) {
      console.error('Page render error:', err);
    }
  }, [pdfDoc, pageNumber, searchText, scale, activeHighlightType, searchLocale]);

  useEffect(() => {
    void renderPage();
  }, [renderPage]);

  useEffect(() => {
    const handleResize = () => {
      if (scale === null) void renderPage();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scale, renderPage]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      textLayerControllerRef.current?.cancel();
      textLayerControllerRef.current = null;
    };
  }, []);

  const changePage = (delta: number) => {
    const newPage = pageNumber + delta;
    if (newPage >= 1 && newPage <= totalPages) setPageNumber(newPage);
  };

  const zoom = (factor: number) => {
    setScale((prev) => {
      const current = prev || 1.0;
      const next = current * factor;
      return Math.max(0.5, Math.min(next, 3.0));
    });
  };

  const handleHighlightOption = (text: string) => {
    setSearchText(text);
    setActiveHighlightType('OPTION');
  };

  const handleHighlightEvidence = () => {
    setSearchText(question.sourceQuote || '');
    setActiveHighlightType('EVIDENCE');
  };

  if (!file) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-stone-900 w-full h-full md:h-[95vh] md:w-[95vw] md:rounded-3xl flex flex-col md:flex-row shadow-2xl overflow-hidden border border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex flex-col h-full relative min-w-0">
          <div className="p-3 border-b border-stone-800 flex justify-between items-center bg-stone-900 z-20 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-stone-800 rounded-lg text-stone-300">
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </div>

              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setActiveHighlightType('MANUAL');
                }}
                placeholder={sv.searchPlaceholder}
                className="bg-stone-800 border-none text-stone-200 text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-sand-500 w-full md:w-64 transition-all"
              />

              <span className="text-[10px] md:text-xs text-stone-500 whitespace-nowrap hidden sm:block ml-2">
                {sv.page} {pageNumber} / {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-stone-800 rounded-lg">
                <button type="button" onClick={() => zoom(0.9)} className="p-2 text-stone-400 hover:text-white">
                  <ZoomOut size={16} />
                </button>
                <button type="button" onClick={() => zoom(1.1)} className="p-2 text-stone-400 hover:text-white">
                  <ZoomIn size={16} />
                </button>
              </div>

              <div className="flex items-center bg-stone-800 rounded-lg ml-2">
                <button
                  type="button"
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  className="p-2 text-stone-400 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= totalPages}
                  className="p-2 text-stone-400 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg ml-2 transition-colors hidden md:block ${isSidebarOpen ? 'bg-sand-500 text-stone-900' : 'bg-stone-800 text-stone-400 hover:text-white'}`}
              >
                {isSidebarOpen ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-red-900/50 rounded-lg text-stone-400 hover:text-red-400 transition-colors ml-2"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 overflow-auto scroll-y-pan bg-stone-900/50 relative flex justify-center p-4 md:p-8 scroll-smooth"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center text-stone-400 h-full">
                <Loader2 size={40} className="animate-spin mb-4 text-sand-500" />
                <p>{sv.loadingPdf}</p>
              </div>
            ) : pdfLoadFailed || !pdfDoc ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-500 dark:text-stone-400" aria-hidden>
                <AlertCircle size={40} className="mb-2 opacity-80" />
              </div>
            ) : (
              <div className="relative shadow-2xl origin-top">
                <canvas ref={canvasRef} className="block" />
                <div ref={textLayerRef} className="textLayer absolute inset-0 leading-none origin-top-left" />
              </div>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="h-[30vh] md:h-full bg-stone-950 border-t md:border-t-0 md:border-l border-stone-800 flex flex-col shrink-0 overflow-hidden"
            >
              <div className="p-4 border-b border-stone-800 bg-stone-900/50 flex items-center gap-2">
                <Target size={16} className="text-sand-500" />
                <h3 className="text-sm font-bold text-stone-100 uppercase tracking-wider">{sv.questionContext}</h3>
              </div>

              <div className="flex-1 overflow-y-auto scroll-y-pan p-4 space-y-6">
                <div className="bg-stone-900/50 rounded-xl p-3 border border-stone-800">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <HelpCircle size={12} /> {t.question}
                  </p>
                  <p className="text-sm text-stone-300 font-serif leading-relaxed">{question.text}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{sv.correctEvidence}</p>
                  <button
                    type="button"
                    onClick={handleHighlightEvidence}
                    className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                      activeHighlightType === 'EVIDENCE'
                        ? 'bg-yellow-900/20 border-yellow-500/50 text-yellow-200 shadow-md'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    <span className="flex items-center gap-2 mb-1 text-[10px] font-bold uppercase text-yellow-500">
                      <CheckCircle2 size={12} /> {sv.sourceText}
                    </span>
                    {question.sourceQuote}
                  </button>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{sv.searchOptions}</p>
                  <div className="space-y-2">
                    {question.options.map((opt, idx) => {
                      const isCorrect = idx === question.correctAnswerIndex;
                      const isActive = activeHighlightType === 'OPTION' && searchText === opt;

                      let containerClass = 'bg-stone-900 border-stone-800 text-stone-400';

                      if (isCorrect) {
                        containerClass = 'bg-emerald-900/20 border-emerald-500/50 text-emerald-100';
                      } else {
                        containerClass = 'bg-red-900/10 border-red-900/30 text-stone-400';
                      }

                      if (isActive) {
                        containerClass += ' ring-1 ring-blue-500';
                      }

                      return (
                        <div key={idx} className="relative">
                          <button
                            type="button"
                            onClick={() => handleHighlightOption(opt)}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition-all group relative overflow-hidden ${containerClass} hover:opacity-80`}
                          >
                            <div className="flex gap-3">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 ${
                                  isCorrect ? 'border-emerald-500 text-emerald-500' : 'border-red-800/50 text-red-700/50'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </div>

                            <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Search size={12} className="text-stone-500" />
                            </div>
                          </button>

                          {isActive && searchStatus === 'NOT_FOUND' && !isSearching && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-1 mt-1 text-[10px] text-red-400 font-bold px-2"
                            >
                              <AlertCircle size={10} />
                              {sv.notInSource}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="md:hidden p-2 bg-stone-900 border-t border-stone-800 text-center">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-xs text-stone-400 uppercase font-bold py-2 w-full"
                >
                  {sv.hidePanel}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .textLayer { opacity: 1; mix-blend-mode: multiply; }
        .textLayer span { color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0% 0%; }
        .textLayer ::selection { background: rgba(59, 130, 246, 0.3); }
      `}</style>
    </motion.div>
  );
};
