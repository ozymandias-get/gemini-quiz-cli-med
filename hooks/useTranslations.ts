import type { LanguageCode } from '../types';
import { TRANSLATIONS, type TranslationContent } from '../constants/translations';
import { useSettingsStore } from '../store/useSettingsStore';

export function useTranslation(): { t: TranslationContent; language: LanguageCode } {
  const language = useSettingsStore((s) => s.language);
  return { t: TRANSLATIONS[language], language };
}
