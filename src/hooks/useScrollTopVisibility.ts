import { useEffect, useState } from 'react';
import { APP_SCROLL_ROOT_ID } from '../constants/domIds';

export function useScrollTopVisibility(threshold = 300): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(APP_SCROLL_ROOT_ID);
    const getY = () => (el ? el.scrollTop : window.scrollY);

    const handleScroll = () => {
      setIsVisible(getY() > threshold);
    };
    const target: HTMLElement | Window = el ?? window;
    target.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => target.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isVisible;
}
