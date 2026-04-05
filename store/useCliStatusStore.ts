import { create } from 'zustand';
import { invoke, isTauri } from '@tauri-apps/api/core';

/** Tauri `gemini_cli_status` yanıtı (serde camelCase). */
export interface GeminiCliStatusPayload {
  installed: boolean;
  version?: string | null;
  isDevBuild: boolean;
}

export interface CliStatusSnapshot {
  isChecked: boolean;
  isInstalled: boolean;
  version: string | null;
  isDevBuild: boolean;
}

interface CliStatusState {
  cliStatus: CliStatusSnapshot;
  cliCheckLoading: boolean;
  checkCliStatus: (options?: { force?: boolean }) => Promise<void>;
  recheckCliStatus: () => Promise<void>;
  /** `gemini_run` vb. hata mesajından CLI eksikliği çıkarıldığında (invoke yok). */
  markCliMissingFromRunError: () => void;
}

const initialCliStatus: CliStatusSnapshot = {
  isChecked: false,
  isInstalled: false,
  version: null,
  isDevBuild: false,
};

export const useCliStatusStore = create<CliStatusState>((set, get) => ({
  cliStatus: initialCliStatus,
  cliCheckLoading: false,

  checkCliStatus: async (options) => {
    const force = options?.force ?? false;
    const { cliStatus } = get();

    if (!isTauri()) {
      set({
        cliStatus: {
          ...get().cliStatus,
          isChecked: true,
          isInstalled: false,
          version: null,
        },
      });
      return;
    }

    if (!force && cliStatus.isChecked) {
      return;
    }

    set({ cliCheckLoading: true });
    try {
      const s = await invoke<GeminiCliStatusPayload>('gemini_cli_status');
      set({
        cliStatus: {
          isChecked: true,
          isInstalled: s.installed,
          version: s.version ?? null,
          isDevBuild: s.isDevBuild,
        },
      });
    } catch {
      set({
        cliStatus: {
          isChecked: true,
          isInstalled: false,
          version: null,
          isDevBuild: false,
        },
      });
    } finally {
      set({ cliCheckLoading: false });
    }
  },

  recheckCliStatus: async () => {
    set((state) => ({
      cliStatus: { ...state.cliStatus, isChecked: false },
    }));
    await get().checkCliStatus({ force: true });
  },

  markCliMissingFromRunError: () =>
    set((state) => ({
      cliStatus: {
        ...state.cliStatus,
        isChecked: true,
        isInstalled: false,
      },
    })),
}));
