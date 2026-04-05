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
