import { toast as sonnerToast } from 'sonner';
import { TRANSLATIONS } from '../constants/translations';
import type { LanguageCode } from '../types';
import { matchesCliUserCancellationMessage } from './cancellation';

export { toast } from 'sonner';

/** Çoğu bilgi / başarı toast’u için ortak süre. */
export const STANDARD_TOAST_DURATION_MS = 4000;

const ERROR_DURATION_MS = 6000;
const GENERATION_CANCELLED_DURATION_MS = 4500;

export function showError(message: string) {
  return sonnerToast.error(message, { duration: ERROR_DURATION_MS });
}

/** Üretim iptali (AbortSignal / Rust kill); toast metni seçilen dilde. */
export function showGenerationCancelledToast(language: LanguageCode) {
  const msg = TRANSLATIONS[language].toasts.generationCancelled;
  return sonnerToast.info(msg, { duration: GENERATION_CANCELLED_DURATION_MS });
}

export function showOfflineToast(language: LanguageCode) {
  const msg = TRANSLATIONS[language].toasts.offlineNoConnection;
  return showError(msg);
}

/** Çevrimdışıysa toast gösterir ve `true` döner (çağıran erken çıkmalı). */
export function notifyIfOffline(language: LanguageCode): boolean {
  if (typeof navigator === 'undefined' || navigator.onLine) return false;
  showOfflineToast(language);
  return true;
}

export function isGenerationCancelledError(err: unknown, language: LanguageCode): boolean {
  const t = TRANSLATIONS[language];
  if (!(err instanceof Error)) return false;
  const m = err.message;
  if (m === t.errors.generationCancelled) return true;
  if (m === t.toasts.generationCancelled) return true;
  if (m === 'Aborted') return true;
  if (matchesCliUserCancellationMessage(m)) return true;
  return false;
}
