import { create } from 'zustand';
import { invoke, isTauri } from '@tauri-apps/api/core';

export interface GeminiCliStatusPayload {
  installed: boolean;
  version?: string | null;
  isDevBuild: boolean;
  isAuthenticated: boolean;
  isHeadlessReady: boolean;
  statusMessage?: string | null;
}

export interface CliStatusSnapshot {
  isChecked: boolean;
  isInstalled: boolean;
  version: string | null;
  isDevBuild: boolean;
  isAuthenticated: boolean;
  isHeadlessReady: boolean;
  statusMessage: string | null;
}

interface CliStatusStoreState {
  cliStatus: CliStatusSnapshot;
  cliCheckLoading: boolean;
}

interface CliStatusStoreActions {
  checkCliStatus: (options?: { force?: boolean }) => Promise<void>;
  recheckCliStatus: () => Promise<void>;
}

type CliStatusStore = CliStatusStoreState & CliStatusStoreActions;

const initialCliStatus: CliStatusSnapshot = {
  isChecked: false,
  isInstalled: false,
  version: null,
  isDevBuild: false,
  isAuthenticated: false,
  isHeadlessReady: false,
  statusMessage: null,
};

export const useCliStatusStore = create<CliStatusStore>((set, get) => ({
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
          isAuthenticated: false,
          isHeadlessReady: false,
          statusMessage: null,
        },
      });
      return;
    }

    if (!force && cliStatus.isChecked) return;

    set({ cliCheckLoading: true });
    try {
      const status = await invoke<GeminiCliStatusPayload>('gemini_cli_status');
      set({
        cliStatus: {
          isChecked: true,
          isInstalled: status.installed,
          version: status.version ?? null,
          isDevBuild: status.isDevBuild,
          isAuthenticated: status.isAuthenticated,
          isHeadlessReady: status.isHeadlessReady,
          statusMessage: status.statusMessage ?? null,
        },
      });
    } catch {
      set({
        cliStatus: {
          isChecked: true,
          isInstalled: false,
          version: null,
          isDevBuild: false,
          isAuthenticated: false,
          isHeadlessReady: false,
          statusMessage: null,
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
}));
