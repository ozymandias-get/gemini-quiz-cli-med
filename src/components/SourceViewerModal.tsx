import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Target,
  X,
} from 'lucide-react';
import type { PreparedDocument, Question } from '../types';
import { useTranslation } from '../hooks/useTranslations';
import { normalizeSearch, useSourceViewerSearch } from '../hooks/useSourceViewerSearch';

interface SourceViewerModalProps {
  preparedDocument: PreparedDocument;
  question: Question;
  onClose: () => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string, colorClass: string): ReactNode {
  if (!query.trim()) return text;
  const escaped = escapeRegExp(query.trim());
  if (!escaped) return text;
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={`${part}-${index}`} className={`rounded px-1 ${colorClass}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function findEvidenceSnippets(preparedDocument: PreparedDocument, query: string, locale: string): string[] {
  const normalized = normalizeSearch(query, locale);
  if (!normalized) return [];
  return preparedDocument.elements
    .filter((element) => {
      const content = normalizeSearch(element.content ?? element.description ?? '', locale);
      return content.includes(normalized);
    })
    .slice(0, 5)
    .map((element) => element.content ?? element.description ?? '')
    .filter((value) => value.trim().length > 0);
}

export const SourceViewerModal: FC<SourceViewerModalProps> = ({ preparedDocument, question, onClose }) => {
  const { t, language } = useTranslation();
  const sv = t.sourceViewer;
  const searchLocale = language === 'en' ? 'en' : 'tr';
  const [pageNumber, setPageNumber] = useState(1);
  const [searchText, setSearchText] = useState<string>(question.sourceQuote || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'IDLE' | 'FOUND' | 'NOT_FOUND'>('IDLE');
  const [activeHighlightType, setActiveHighlightType] = useState<'EVIDENCE' | 'OPTION' | 'MANUAL'>('EVIDENCE');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useSourceViewerSearch({
    pageMap: preparedDocument.pageMap,
    searchText,
    searchLocale,
    pageNumber,
    setPageNumber,
    setIsSearching,
    setSearchStatus,
  });

  useEffect(() => {
    setSearchText(question.sourceQuote || '');
    setActiveHighlightType('EVIDENCE');
  }, [question.id, question.sourceQuote]);

  const totalPages = preparedDocument.pageMap.length;
  const currentPage = preparedDocument.pageMap.find((page) => page.pageNumber === pageNumber) ?? preparedDocument.pageMap[0];

  useEffect(() => {
    if (!currentPage && preparedDocument.pageMap.length > 0) {
      setPageNumber(preparedDocument.pageMap[0].pageNumber);
    }
  }, [currentPage, preparedDocument.pageMap]);

  const evidenceSnippets = useMemo(
    () => findEvidenceSnippets(preparedDocument, searchText, searchLocale),
    [preparedDocument, searchLocale, searchText]
  );

  const highlightClass =
    activeHighlightType === 'OPTION'
      ? 'bg-sky-300/40 text-stone-900'
      : activeHighlightType === 'MANUAL'
        ? 'bg-orange-300/50 text-stone-900'
        : 'bg-yellow-300/50 text-stone-900';

  const changePage = (delta: number) => {
    const newPage = pageNumber + delta;
    if (newPage >= 1 && newPage <= totalPages) setPageNumber(newPage);
  };

  const handleHighlightOption = (text: string) => {
    setSearchText(text);
    setActiveHighlightType('OPTION');
  };

  const handleHighlightEvidence = () => {
    setSearchText(question.sourceQuote || '');
    setActiveHighlightType('EVIDENCE');
  };

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
                className="bg-stone-800 border-none text-stone-200 text-sm rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-sand-500 w-full md:w-72 transition-all"
              />

              <span className="text-[10px] md:text-xs text-stone-500 whitespace-nowrap hidden sm:block ml-2">
                {sv.page} {currentPage?.pageNumber ?? 1} / {totalPages}
              </span>
            </div>

            <div className="flex items-center gap-2">
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

          <div className="flex-1 overflow-auto bg-stone-900/50 relative p-4 md:p-8 scroll-smooth">
            {!currentPage ? (
              <div className="flex flex-col items-center justify-center h-full text-stone-500 dark:text-stone-400">
                <AlertCircle size={40} className="mb-2 opacity-80" />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="rounded-3xl border border-stone-800 bg-stone-950/70 p-4 md:p-6 shadow-2xl">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 mb-3">
                    <FileText size={14} /> Markdown Page {currentPage.pageNumber}
                  </div>
                  <div className="whitespace-pre-wrap break-words font-mono text-[13px] leading-6 text-stone-200">
                    {highlightText(currentPage.markdown, searchText, highlightClass)}
                  </div>
                </div>

                {evidenceSnippets.length > 0 && (
                  <div className="rounded-3xl border border-stone-800 bg-stone-950/60 p-4 md:p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500 mb-3">Evidence snippets</p>
                    <div className="space-y-2">
                      {evidenceSnippets.map((snippet, index) => (
                        <div key={`${snippet}-${index}`} className="rounded-2xl border border-stone-800 bg-stone-900 px-3 py-2 text-xs leading-relaxed text-stone-300">
                          {highlightText(snippet, searchText, highlightClass)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="bg-stone-900/50 rounded-xl p-3 border border-stone-800">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{t.question}</p>
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
    </motion.div>
  );
};
