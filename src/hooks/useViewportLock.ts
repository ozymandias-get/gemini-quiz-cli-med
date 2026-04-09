import { useLayoutEffect } from 'react';

export function useViewportLock(lockViewport: boolean): void {
  useLayoutEffect(() => {
    if (!lockViewport) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.scrollTop = 0;
    body.scrollTop = 0;
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [lockViewport]);
}
