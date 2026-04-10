import { useEffect, useState } from 'react';
import type { LanguageCode, PdfExtractionOptions, PdfHybridServerConfig, QuizSettings } from '../../../types';
import { usePdfRuntimeStore } from '../../../store/usePdfRuntimeStore';
import { configInputGlassClass } from '../../../utils/helpers';
import {
  HYBRID_OCR_CUSTOM_VALUE,
  isHybridOcrLangCustom,
} from '../../../constants/hybridOcrLanguages';
import { PDF_EXTRACTION_COPY, type PdfExtractionCopy } from './pdfExtractionCopy';

export function usePdfExtractionSection(
  language: LanguageCode,
  settings: QuizSettings,
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void
) {
  const copy: PdfExtractionCopy = PDF_EXTRACTION_COPY[language];
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
  const ocrLangValue = extraction.hybridServer.ocrLang;
  const [preferCustomOcrUi, setPreferCustomOcrUi] = useState(false);

  useEffect(() => {
    if (isHybridOcrLangCustom(ocrLangValue)) {
      setPreferCustomOcrUi(true);
    }
  }, [ocrLangValue]);

  const showOcrCustomInput = preferCustomOcrUi || isHybridOcrLangCustom(ocrLangValue);
  const ocrLangSelectValue =
    showOcrCustomInput && !isHybridOcrLangCustom(ocrLangValue)
      ? HYBRID_OCR_CUSTOM_VALUE
      : isHybridOcrLangCustom(ocrLangValue)
        ? HYBRID_OCR_CUSTOM_VALUE
        : ocrLangValue.trim() || 'en';

  const runtimeStatusText = isBootstrapping ? copy.bootstrapping : runtime.statusMessage ?? copy.subtitle;

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

  const inputSurfaceClass = `rounded-2xl px-3 py-2 text-[11px] font-medium ${configInputGlassClass}`;

  return {
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
    preferCustomOcrUi,
    setPreferCustomOcrUi,
    showOcrCustomInput,
    ocrLangSelectValue,
    runtimeStatusText,
    updateExtraction,
    updateHybridServer,
    inputSurfaceClass,
  };
}
