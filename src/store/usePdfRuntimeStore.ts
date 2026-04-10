import { create } from 'zustand';
import { isTauri } from '@tauri-apps/api/core';
import {
  pdfBootstrapRuntime,
  pdfHybridStart,
  pdfHybridStop,
  pdfRuntimeStatus as fetchPdfRuntimeStatus,
} from '../services/api/pdfRuntime';
import type { PdfExtractionOptions, PdfHybridServerConfig, PdfRuntimeStatus } from '../types';

const initialStatus: PdfRuntimeStatus = {
  isChecked: false,
  javaReady: false,
  javaVersion: null,
  javaPath: null,
  pythonFound: false,
  pythonVersion: null,
  pythonPath: null,
  runtimeBootstrapped: false,
  cliReady: false,
  hybridStatus: 'stopped',
  hybridUrl: null,
  statusMessage: null,
};

interface PdfRuntimeStoreState {
  status: PdfRuntimeStatus;
  isLoading: boolean;
  isBootstrapping: boolean;
  isStartingHybrid: boolean;
  isStoppingHybrid: boolean;
}

interface PdfRuntimeStoreActions {
  checkStatus: (options?: { force?: boolean }) => Promise<void>;
  bootstrapRuntime: () => Promise<void>;
  startHybrid: (config?: PdfHybridServerConfig) => Promise<void>;
  stopHybrid: () => Promise<void>;
}

type PdfRuntimeStore = PdfRuntimeStoreState & PdfRuntimeStoreActions;

export const usePdfRuntimeStore = create<PdfRuntimeStore>((set, get) => ({
  status: initialStatus,
  isLoading: false,
  isBootstrapping: false,
  isStartingHybrid: false,
  isStoppingHybrid: false,

  checkStatus: async (options) => {
    const force = options?.force ?? false;
    if (!isTauri()) {
      set({
        status: {
          ...initialStatus,
          isChecked: true,
          statusMessage: 'PDF runtime sadece Tauri masaustu uygulamasinda kullanilabilir.',
        },
      });
      return;
    }
    if (!force && get().status.isChecked) return;

    set({ isLoading: true });
    try {
      const status = await fetchPdfRuntimeStatus();
      set({ status });
    } catch (error) {
      set({
        status: {
          ...initialStatus,
          isChecked: true,
          statusMessage: error instanceof Error ? error.message : String(error),
          hybridStatus: 'failed',
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  bootstrapRuntime: async () => {
    if (!isTauri()) return;
    set({ isBootstrapping: true });
    try {
      const status = await pdfBootstrapRuntime();
      set({ status });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  startHybrid: async (config) => {
    if (!isTauri()) return;
    set({ isStartingHybrid: true });
    try {
      const status = await pdfHybridStart(config);
      set({ status });
    } finally {
      set({ isStartingHybrid: false });
    }
  },

  stopHybrid: async () => {
    if (!isTauri()) return;
    set({ isStoppingHybrid: true });
    try {
      const status = await pdfHybridStop();
      set({ status });
    } finally {
      set({ isStoppingHybrid: false });
    }
  },
}));

export function needsPreparedDocumentRefresh(
  preparedOptions: PdfExtractionOptions | undefined,
  nextOptions: PdfExtractionOptions
): boolean {
  return stableStringify(preparedOptions ?? null) !== stableStringify(nextOptions);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysRecursively(value));
}

function sortKeysRecursively(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeysRecursively(entry));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortKeysRecursively((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }
  return value;
}
