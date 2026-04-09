import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Cpu, Loader2, Play, RefreshCcw, Square, ToggleLeft, ToggleRight } from 'lucide-react';
import type { FC } from 'react';
import type { LanguageCode, PdfExtractionOptions, PdfHybridServerConfig, QuizSettings } from '../../types';
import { SELECTED_CHOICE } from './configChoiceClasses';
import { usePdfRuntimeStore } from '../../store/usePdfRuntimeStore';

const COPY = {
  tr: {
    title: 'PDF Isleme Motoru',
    subtitle: 'OpenDataLoader extraction ve hybrid kontrolu',
    local: 'Yerel',
    hybrid: 'Hybrid',
    bootstrap: 'Runtime kur',
    refresh: 'Durumu yenile',
    startHybrid: 'Hybrid baslat',
    stopHybrid: 'Hybrid durdur',
    status: 'Durum',
    options: 'Extraction ayarlari',
    advanced: 'Hybrid zenginlestirme',
    structTree: 'Struct tree kullan',
    sanitize: 'Veri sanitization',
    lineBreaks: 'Satir kirilimlarini koru',
    headerFooter: 'Header/footer dahil et',
    strikethrough: 'Strikethrough tespiti',
    formula: 'Formul zenginlestirme',
    picture: 'Gorsel/aciklama zenginlestirme',
    ocr: 'OCR zorla',
    tableMethod: 'Tablo yontemi',
    readingOrder: 'Okuma sirasi',
    pageRange: 'Sayfa araligi',
    hybridMode: 'Hybrid triage',
    hybridTimeout: 'Hybrid timeout (ms)',
    ocrLang: 'OCR dili',
    port: 'Port',
    imageOutput: 'Gorsel cikisi',
    imageFormat: 'Gorsel format',
    runtimeReady: 'Runtime hazir',
    runtimeMissing: 'Runtime hazir degil',
  },
  en: {
    title: 'PDF Engine',
    subtitle: 'OpenDataLoader extraction and hybrid control',
    local: 'Local',
    hybrid: 'Hybrid',
    bootstrap: 'Bootstrap runtime',
    refresh: 'Refresh status',
    startHybrid: 'Start hybrid',
    stopHybrid: 'Stop hybrid',
    status: 'Status',
    options: 'Extraction options',
    advanced: 'Hybrid enrichment',
    structTree: 'Use struct tree',
    sanitize: 'Sanitize sensitive data',
    lineBreaks: 'Keep line breaks',
    headerFooter: 'Include header/footer',
    strikethrough: 'Detect strikethrough',
    formula: 'Formula enrichment',
    picture: 'Picture/chart enrichment',
    ocr: 'Force OCR',
    tableMethod: 'Table method',
    readingOrder: 'Reading order',
    pageRange: 'Page range',
    hybridMode: 'Hybrid triage',
    hybridTimeout: 'Hybrid timeout (ms)',
    ocrLang: 'OCR language',
    port: 'Port',
    imageOutput: 'Image output',
    imageFormat: 'Image format',
    runtimeReady: 'Runtime ready',
    runtimeMissing: 'Runtime not ready',
  },
} as const;

interface Props {
  language: LanguageCode;
  settings: QuizSettings;
  activeSection: string | null;
  toggleSection: (id: string) => void;
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
}

export const PdfExtractionCollapsible: FC<Props> = ({
  language,
  settings,
  activeSection,
  toggleSection,
  updateSetting,
}) => {
  const copy = COPY[language];
  const runtime = usePdfRuntimeStore((state) => state.status);
  const isLoading = usePdfRuntimeStore((state) => state.isLoading);
  const isBootstrapping = usePdfRuntimeStore((state) => state.isBootstrapping);
  const isStartingHybrid = usePdfRuntimeStore((state) => state.isStartingHybrid);
  const isStoppingHybrid = usePdfRuntimeStore((state) => state.isStoppingHybrid);
  const checkStatus = usePdfRuntimeStore((state) => state.checkStatus);
  const bootstrapRuntime = usePdfRuntimeStore((state) => state.bootstrapRuntime);
  const startHybrid = usePdfRuntimeStore((state) => state.startHybrid);
  const stopHybrid = usePdfRuntimeStore((state) => state.stopHybrid);

  const extraction = settings.pdfExtraction;
  const isOpen = activeSection === 'pdf-extraction';

  const updateExtraction = (patch: Partial<PdfExtractionOptions>) => {
    updateSetting('pdfExtraction', { ...extraction, ...patch });
  };

  const updateHybridServer = (patch: Partial<PdfHybridServerConfig>) => {
    updateExtraction({
      hybridServer: {
        ...extraction.hybridServer,
        ...patch,
      },
    });
  };

  const Toggle = ({
    value,
    onChange,
    label,
  }: {
    value: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-left text-[12px] font-medium text-stone-700 shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200"
    >
      <span>{label}</span>
      {value ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} className="text-stone-400" />}
    </button>
  );

  return (
    <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/60 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => toggleSection('pdf-extraction')}
        className="w-full flex items-center justify-between p-3 lg:p-2.5 text-left transition-colors bg-gradient-to-r hover:from-white/50 hover:to-transparent dark:hover:from-white/[0.02]"
      >
        <div className="flex items-center gap-3 text-stone-700 dark:text-stone-200 min-w-0">
          <div
            className={`p-1.5 lg:p-1.5 rounded-xl transition-colors shrink-0 ${isOpen ? SELECTED_CHOICE : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-sm'}`}
          >
            <Cpu size={17} />
          </div>
          <div>
            <h4 className="font-bold text-[13px] text-stone-800 dark:text-stone-200">{copy.title}</h4>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 opacity-80 line-clamp-1">
              {runtime.runtimeBootstrapped ? copy.runtimeReady : copy.runtimeMissing}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800/50">
          <ChevronDown size={18} className={`transition-transform duration-300 text-stone-500 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-3 text-[11px] text-stone-600 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-300">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-stone-800 dark:text-stone-100">{copy.status}</p>
                    <p className="mt-1">{runtime.statusMessage ?? copy.subtitle}</p>
                    <p className="mt-1">
                      Java: {runtime.javaReady ? runtime.javaVersion ?? 'OK' : 'missing'} | Python:{' '}
                      {runtime.pythonFound ? runtime.pythonVersion ?? 'OK' : 'missing'} | Hybrid: {runtime.hybridStatus}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => void bootstrapRuntime()}
                      disabled={isBootstrapping}
                      className="rounded-xl bg-stone-900 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60 dark:bg-sand-500 dark:text-stone-900"
                    >
                      {isBootstrapping ? <Loader2 size={14} className="animate-spin inline" /> : copy.bootstrap}
                    </button>
                    <button
                      type="button"
                      onClick={() => void checkStatus({ force: true })}
                      disabled={isLoading}
                      className="rounded-xl border border-stone-200 px-3 py-2 text-[11px] font-bold text-stone-700 dark:border-white/10 dark:text-stone-100"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin inline" /> : copy.refresh}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateExtraction({ hybrid: 'off' })}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold ${extraction.hybrid === 'off' ? 'border-stone-900 bg-stone-900 text-white dark:border-sand-500 dark:bg-sand-500 dark:text-stone-900' : 'border-stone-200 bg-white/70 text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200'}`}
                >
                  {copy.local}
                </button>
                <button
                  type="button"
                  onClick={() => updateExtraction({ hybrid: 'docling-fast' })}
                  className={`rounded-2xl border px-3 py-3 text-xs font-bold ${extraction.hybrid !== 'off' ? 'border-stone-900 bg-stone-900 text-white dark:border-sand-500 dark:bg-sand-500 dark:text-stone-900' : 'border-stone-200 bg-white/70 text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200'}`}
                >
                  {copy.hybrid}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Toggle value={extraction.useStructTree} onChange={() => updateExtraction({ useStructTree: !extraction.useStructTree })} label={copy.structTree} />
                <Toggle value={extraction.sanitize} onChange={() => updateExtraction({ sanitize: !extraction.sanitize })} label={copy.sanitize} />
                <Toggle value={extraction.keepLineBreaks} onChange={() => updateExtraction({ keepLineBreaks: !extraction.keepLineBreaks })} label={copy.lineBreaks} />
                <Toggle value={extraction.includeHeaderFooter} onChange={() => updateExtraction({ includeHeaderFooter: !extraction.includeHeaderFooter })} label={copy.headerFooter} />
                <Toggle value={extraction.detectStrikethrough} onChange={() => updateExtraction({ detectStrikethrough: !extraction.detectStrikethrough })} label={copy.strikethrough} />
                <Toggle value={extraction.hybridFallback} onChange={() => updateExtraction({ hybridFallback: !extraction.hybridFallback })} label="Hybrid fallback" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                  <span className="block mb-1">{copy.tableMethod}</span>
                  <select
                    value={extraction.tableMethod}
                    onChange={(event) => updateExtraction({ tableMethod: event.target.value as PdfExtractionOptions['tableMethod'] })}
                    className="w-full bg-transparent outline-none"
                  >
                    <option value="default">default</option>
                    <option value="cluster">cluster</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                  <span className="block mb-1">{copy.readingOrder}</span>
                  <select
                    value={extraction.readingOrder}
                    onChange={(event) => updateExtraction({ readingOrder: event.target.value as PdfExtractionOptions['readingOrder'] })}
                    className="w-full bg-transparent outline-none"
                  >
                    <option value="xycut">xycut</option>
                    <option value="off">off</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                  <span className="block mb-1">{copy.imageOutput}</span>
                  <select
                    value={extraction.imageOutput}
                    onChange={(event) => updateExtraction({ imageOutput: event.target.value as PdfExtractionOptions['imageOutput'] })}
                    className="w-full bg-transparent outline-none"
                  >
                    <option value="off">off</option>
                    <option value="external">external</option>
                    <option value="embedded">embedded</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                  <span className="block mb-1">{copy.imageFormat}</span>
                  <select
                    value={extraction.imageFormat}
                    onChange={(event) => updateExtraction({ imageFormat: event.target.value as PdfExtractionOptions['imageFormat'] })}
                    className="w-full bg-transparent outline-none"
                  >
                    <option value="png">png</option>
                    <option value="jpeg">jpeg</option>
                  </select>
                </label>
                <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200 sm:col-span-2">
                  <span className="block mb-1">{copy.pageRange}</span>
                  <input
                    value={extraction.pages}
                    onChange={(event) => updateExtraction({ pages: event.target.value })}
                    placeholder="1,3,5-7"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
              </div>

              {extraction.hybrid !== 'off' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Toggle value={extraction.hybridServer.forceOcr} onChange={() => updateHybridServer({ forceOcr: !extraction.hybridServer.forceOcr })} label={copy.ocr} />
                    <Toggle value={extraction.hybridServer.enrichFormula} onChange={() => updateHybridServer({ enrichFormula: !extraction.hybridServer.enrichFormula })} label={copy.formula} />
                    <Toggle value={extraction.hybridServer.enrichPictureDescription} onChange={() => updateHybridServer({ enrichPictureDescription: !extraction.hybridServer.enrichPictureDescription })} label={copy.picture} />
                    <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                      <span className="block mb-1">{copy.hybridMode}</span>
                      <select
                        value={extraction.hybridMode}
                        onChange={(event) => updateExtraction({ hybridMode: event.target.value as PdfExtractionOptions['hybridMode'] })}
                        className="w-full bg-transparent outline-none"
                      >
                        <option value="auto">auto</option>
                        <option value="full">full</option>
                      </select>
                    </label>
                    <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                      <span className="block mb-1">{copy.hybridTimeout}</span>
                      <input
                        value={extraction.hybridTimeout}
                        onChange={(event) => updateExtraction({ hybridTimeout: event.target.value })}
                        className="w-full bg-transparent outline-none"
                      />
                    </label>
                    <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                      <span className="block mb-1">{copy.ocrLang}</span>
                      <input
                        value={extraction.hybridServer.ocrLang}
                        onChange={(event) => updateHybridServer({ ocrLang: event.target.value })}
                        className="w-full bg-transparent outline-none"
                      />
                    </label>
                    <label className="rounded-2xl border border-stone-200/80 bg-white/70 px-3 py-2 text-[11px] font-medium text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200">
                      <span className="block mb-1">{copy.port}</span>
                      <input
                        value={String(extraction.hybridServer.port)}
                        onChange={(event) => updateHybridServer({ port: Number(event.target.value || 5002) })}
                        className="w-full bg-transparent outline-none"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void startHybrid(extraction.hybridServer)}
                      disabled={isStartingHybrid}
                      className="rounded-2xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {isStartingHybrid ? <Loader2 size={14} className="animate-spin inline" /> : <><Play size={14} className="inline mr-1" />{copy.startHybrid}</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => void stopHybrid()}
                      disabled={isStoppingHybrid}
                      className="rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                    >
                      {isStoppingHybrid ? <Loader2 size={14} className="animate-spin inline" /> : <><Square size={14} className="inline mr-1" />{copy.stopHybrid}</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
