/** Yalnızca geliştirme modunda konsola yazar; üretim gürültüsünü keser. */
export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}
