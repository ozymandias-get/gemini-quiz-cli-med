import { useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import { AppStep } from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { useRoutingStore } from '../store/useRoutingStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useAppCloseGuard(): void {
  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        unlisten = await getCurrentWindow().onCloseRequested(async (event) => {
          const currentStep = useRoutingStore.getState().step;
          if (currentStep !== AppStep.QUIZ && currentStep !== AppStep.GENERATING) {
            return;
          }
          const language = useSettingsStore.getState().language;
          const translation = TRANSLATIONS[language];
          const ok = await confirm(translation.closeConfirmMessage, {
            title: translation.closeConfirmTitle,
            kind: 'warning',
          });
          if (!ok) {
            event.preventDefault();
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
