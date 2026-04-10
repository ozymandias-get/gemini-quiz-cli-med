import { useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { confirm } from '@tauri-apps/plugin-dialog';
import { AppStep } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { useRoutingStore } from '../store/useRoutingStore';
import { useSettingsStore } from '../store/useSettingsStore';

/** Diyalog takılırsa kullanıcıyı X ile sonsuz bekletmemek için üst sınır. */
const CLOSE_CONFIRM_TIMEOUT_MS = 120_000;

export function useAppCloseGuard(): void {
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const appWindow = WebviewWindow.getCurrent();
        unlisten = await appWindow.onCloseRequested(async (event) => {
          const currentStep = useRoutingStore.getState().step;
          if (currentStep !== AppStep.QUIZ && currentStep !== AppStep.GENERATING) {
            return;
          }

          event.preventDefault();

          const language = useSettingsStore.getState().language;
          const translation = TRANSLATIONS[language];

          let shouldClose = false;
          try {
            try {
              await appWindow.setFocus();
            } catch {
              // odak isteğe bağlı
            }

            const outcome = await Promise.race([
              confirm(translation.closeConfirmMessage, {
                title: translation.closeConfirmTitle,
                kind: 'warning',
              }),
              new Promise<null>((resolve) => {
                setTimeout(() => resolve(null), CLOSE_CONFIRM_TIMEOUT_MS);
              }),
            ]);

            shouldClose = outcome !== false;
          } catch {
            shouldClose = true;
          }

          if (shouldClose) {
            await appWindow.destroy();
          }
        });
        if (cancelled) unlisten();
      } catch {
        // ignore when listener cannot be attached
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
