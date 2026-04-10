import { CircleHelp, Cpu, Loader2, Play, Square } from 'lucide-react';
import type { FC } from 'react';
import type { LanguageCode, PdfExtractionOptions, QuizSettings } from '../../types';
import { PDF_INTERACTIVE_SURFACE, PDF_INTERACTIVE_SURFACE_ACTIVE } from './configChoiceClasses';
import { ConfigCollapsibleShell } from './ConfigCollapsibleShell';
import { navigateToPdfExtractionHelp } from '../../services/appFlows';
import { configInputGlassClass } from '../../utils/helpers';
import { HYBRID_OCR_CUSTOM_VALUE, HYBRID_OCR_LANG_OPTIONS } from '../../constants/hybridOcrLanguages';
import { PdfExtractionToggle } from './pdf-extraction/PdfExtractionToggle';
import { usePdfExtractionSection } from './pdf-extraction/usePdfExtractionSection';

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
  const {
    copy,
    runtime,
    isLoading,
    isBootstrapping,
    isStartingHybrid,
    isStoppingHybrid,
    checkStatus,
    bootstrapRuntime,
    startHybrid,
    stopHybrid,
    extraction,
    ocrLangValue,
    setPreferCustomOcrUi,
    showOcrCustomInput,
    ocrLangSelectValue,
    runtimeStatusText,
    updateExtraction,
    updateHybridServer,
    inputSurfaceClass,
  } = usePdfExtractionSection(language, settings, updateSetting);

  const isOpen = activeSection === 'pdf-extraction';

  return (
    <ConfigCollapsibleShell
      isOpen={isOpen}
      onToggle={() => toggleSection('pdf-extraction')}
      icon={<Cpu size={17} />}
      title={copy.title}
      subtitle={
        isBootstrapping ? copy.runtimeInstalling : runtime.runtimeBootstrapped ? copy.runtimeReady : copy.runtimeMissing
      }
      headerRowClassName="w-full flex items-center gap-2 p-3 lg:p-2.5"
      toggleButtonClassName="min-w-0 flex-1 flex items-center justify-between text-left transition-colors bg-gradient-to-r from-white/14 to-transparent hover:from-white/35 dark:from-white/[0.01] dark:hover:from-white/[0.04] rounded-2xl px-2 py-1.5"
      headerTrailing={
        <button
          type="button"
          onClick={navigateToPdfExtractionHelp}
          aria-label={copy.helpAria}
          title={copy.helpAria}
          className={`shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full text-stone-600 transition-colors hover:text-stone-800 dark:text-stone-300 dark:hover:text-stone-100 ${configInputGlassClass}`}
        >
          <CircleHelp size={16} />
        </button>
      }
    >
      <div className="p-4 pt-0 space-y-4">
        <div className={`${configInputGlassClass} rounded-2xl p-3 text-[11px] text-stone-600 dark:text-stone-300`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-stone-800 dark:text-stone-100">{copy.status}</p>
              <p className="mt-1">{runtimeStatusText}</p>
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
                {isBootstrapping ? (
                  <>
                    <Loader2 size={14} className="animate-spin inline mr-1" />
                    {copy.bootstrapping}
                  </>
                ) : (
                  copy.bootstrap
                )}
              </button>
              <button
                type="button"
                onClick={() => void checkStatus({ force: true })}
                disabled={isLoading}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold ${configInputGlassClass}`}
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
            className={`rounded-2xl px-3 py-3 text-xs font-bold ${extraction.hybrid === 'off' ? PDF_INTERACTIVE_SURFACE_ACTIVE : PDF_INTERACTIVE_SURFACE}`}
          >
            {copy.local}
          </button>
          <button
            type="button"
            onClick={() => updateExtraction({ hybrid: 'docling-fast' })}
            className={`rounded-2xl px-3 py-3 text-xs font-bold ${extraction.hybrid !== 'off' ? PDF_INTERACTIVE_SURFACE_ACTIVE : PDF_INTERACTIVE_SURFACE}`}
          >
            {copy.hybrid}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <PdfExtractionToggle
            value={extraction.useStructTree}
            onChange={() => updateExtraction({ useStructTree: !extraction.useStructTree })}
            label={copy.structTree}
          />
          <PdfExtractionToggle
            value={extraction.sanitize}
            onChange={() => updateExtraction({ sanitize: !extraction.sanitize })}
            label={copy.sanitize}
          />
          <PdfExtractionToggle
            value={extraction.keepLineBreaks}
            onChange={() => updateExtraction({ keepLineBreaks: !extraction.keepLineBreaks })}
            label={copy.lineBreaks}
          />
          <PdfExtractionToggle
            value={extraction.includeHeaderFooter}
            onChange={() => updateExtraction({ includeHeaderFooter: !extraction.includeHeaderFooter })}
            label={copy.headerFooter}
          />
          <PdfExtractionToggle
            value={extraction.detectStrikethrough}
            onChange={() => updateExtraction({ detectStrikethrough: !extraction.detectStrikethrough })}
            label={copy.strikethrough}
          />
          <PdfExtractionToggle
            value={extraction.hybridFallback}
            onChange={() => updateExtraction({ hybridFallback: !extraction.hybridFallback })}
            label={copy.hybridFallback}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className={inputSurfaceClass}>
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
          <label className={inputSurfaceClass}>
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
          <label className={inputSurfaceClass}>
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
          <label className={inputSurfaceClass}>
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
          <label className={`${inputSurfaceClass} sm:col-span-2`}>
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
              <PdfExtractionToggle
                value={extraction.hybridServer.forceOcr}
                onChange={() => updateHybridServer({ forceOcr: !extraction.hybridServer.forceOcr })}
                label={copy.ocr}
              />
              <PdfExtractionToggle
                value={extraction.hybridServer.enrichFormula}
                onChange={() => updateHybridServer({ enrichFormula: !extraction.hybridServer.enrichFormula })}
                label={copy.formula}
              />
              <PdfExtractionToggle
                value={extraction.hybridServer.enrichPictureDescription}
                onChange={() =>
                  updateHybridServer({ enrichPictureDescription: !extraction.hybridServer.enrichPictureDescription })
                }
                label={copy.picture}
              />
              <label className={inputSurfaceClass}>
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
              <label className={inputSurfaceClass}>
                <span className="block mb-1">{copy.hybridTimeout}</span>
                <input
                  value={extraction.hybridTimeout}
                  onChange={(event) => updateExtraction({ hybridTimeout: event.target.value })}
                  className="w-full bg-transparent outline-none"
                />
              </label>
              <label className={`${inputSurfaceClass} sm:col-span-2`}>
                <span className="block mb-1">{copy.ocrLang}</span>
                <select
                  value={ocrLangSelectValue}
                  onChange={(event) => {
                    const v = event.target.value;
                    if (v === HYBRID_OCR_CUSTOM_VALUE) {
                      setPreferCustomOcrUi(true);
                      updateHybridServer({
                        ocrLang: ocrLangValue.trim() || 'en',
                      });
                    } else {
                      setPreferCustomOcrUi(false);
                      updateHybridServer({ ocrLang: v });
                    }
                  }}
                  className="w-full bg-transparent outline-none"
                >
                  {HYBRID_OCR_LANG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {language === 'tr' ? opt.labelTr : opt.labelEn} ({opt.value})
                    </option>
                  ))}
                  <option value={HYBRID_OCR_CUSTOM_VALUE}>
                    {language === 'tr' ? 'Özel (virgülle birden fazla dil)' : 'Custom (comma-separated)'}
                  </option>
                </select>
                {showOcrCustomInput && (
                  <>
                    <input
                      value={ocrLangValue}
                      onChange={(event) => updateHybridServer({ ocrLang: event.target.value })}
                      placeholder="ko,en"
                      className="mt-2 w-full bg-transparent outline-none"
                      aria-label={copy.ocrLang}
                    />
                    <p className="mt-1.5 text-[10px] text-stone-500 dark:text-stone-400 leading-snug">
                      {copy.ocrLangCustomHint}
                    </p>
                  </>
                )}
              </label>
              <label className={inputSurfaceClass}>
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
                className="rounded-2xl bg-emerald-600/88 px-3 py-3 text-xs font-bold text-white shadow-sm ring-1 ring-emerald-400/30 backdrop-blur-sm disabled:opacity-60"
              >
                {isStartingHybrid ? (
                  <Loader2 size={14} className="animate-spin inline" />
                ) : (
                  <>
                    <Play size={14} className="inline mr-1" />
                    {copy.startHybrid}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => void stopHybrid()}
                disabled={isStoppingHybrid}
                className="rounded-2xl border border-red-200/75 bg-red-50/80 px-3 py-3 text-xs font-bold text-red-700 shadow-sm ring-1 ring-red-200/38 backdrop-blur-sm disabled:opacity-60 dark:border-red-900/38 dark:bg-red-950/26 dark:text-red-300 dark:ring-red-900/30"
              >
                {isStoppingHybrid ? (
                  <Loader2 size={14} className="animate-spin inline" />
                ) : (
                  <>
                    <Square size={14} className="inline mr-1" />
                    {copy.stopHybrid}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </ConfigCollapsibleShell>
  );
};
