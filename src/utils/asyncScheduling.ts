/** Üretim ekranına geçişte tarayıcıya bir kare boyama fırsatı verir (flash/azaltma). */
export function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Mikro görev kuyruğundan sonra devam etmek için kısa gecikme. */
export function yieldMacrotask(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

/** `setTimeout` gecikmesi; `signal` verilirse abort’ta `AbortError` fırlatır. */
export function delayWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
  });
}
