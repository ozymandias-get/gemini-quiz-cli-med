import { useEffect } from 'react';

export function useDarkModeClass(isDarkMode: boolean): void {
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
}
