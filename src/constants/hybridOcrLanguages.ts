/** Values for `opendataloader-pdf-hybrid --ocr-lang` (EasyOCR-style codes; comma-separated for multiple). */
export const HYBRID_OCR_CUSTOM_VALUE = '__custom__';

export const HYBRID_OCR_LANG_OPTIONS: ReadonlyArray<{
  value: string;
  labelTr: string;
  labelEn: string;
}> = [
  { value: 'en', labelTr: 'İngilizce', labelEn: 'English' },
  { value: 'tr', labelTr: 'Türkçe', labelEn: 'Turkish' },
  { value: 'de', labelTr: 'Almanca', labelEn: 'German' },
  { value: 'fr', labelTr: 'Fransızca', labelEn: 'French' },
  { value: 'es', labelTr: 'İspanyolca', labelEn: 'Spanish' },
  { value: 'it', labelTr: 'İtalyanca', labelEn: 'Italian' },
  { value: 'pt', labelTr: 'Portekizce', labelEn: 'Portuguese' },
  { value: 'ru', labelTr: 'Rusça', labelEn: 'Russian' },
  { value: 'ar', labelTr: 'Arapça', labelEn: 'Arabic' },
  { value: 'ja', labelTr: 'Japonca', labelEn: 'Japanese' },
  { value: 'ko', labelTr: 'Korece', labelEn: 'Korean' },
  { value: 'ch_sim', labelTr: 'Basitleştirilmiş Çince', labelEn: 'Simplified Chinese' },
  { value: 'ch_tra', labelTr: 'Geleneksel Çince', labelEn: 'Traditional Chinese' },
  { value: 'hi', labelTr: 'Hintçe', labelEn: 'Hindi' },
];

const PRESET_SET = new Set(HYBRID_OCR_LANG_OPTIONS.map((o) => o.value));

export function isHybridOcrLangCustom(ocrLang: string): boolean {
  const t = ocrLang.trim();
  if (!t) return false;
  if (t.includes(',')) return true;
  return !PRESET_SET.has(t);
}
