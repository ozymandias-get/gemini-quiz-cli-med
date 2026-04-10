import { create } from 'zustand';
import { toast } from 'sonner';
import { isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { GeneratingPresentation, GenerationLogEntry, PreparedDocument, Question } from '../types';
import { useRoutingStore } from './useRoutingStore';
import { useSettingsStore } from './useSettingsStore';
import { useQuizSessionStore } from './useQuizSessionStore';
import { notifyIfOffline } from '../utils/toast';
import { runFlashcardGenerationFlow, runQuizGenerationFlow } from '../services/usecases/generationFlow';
import { preparePdfDocumentFromPath } from '../services/pdfService';
import { needsPreparedDocumentRefresh } from './usePdfRuntimeStore';
import { getErrorMessage } from '../utils/errorMessage';

const GENERATION_LOG_EVENT = 'quizlab://generation-log';
const MAX_GENERATION_LOGS = 200;

interface GenerationStoreState {
  pdfText: string;
  preparedDocument: PreparedDocument | null;
  pdfSourcePath: string | null;
  fileName: string;
  isReadingPdf: boolean;
  loadingMessage: string;
  usedQuestions: Question[];
  generationInProgress: boolean;
  generationAbortController: AbortController | null;
  generationLogs: GenerationLogEntry[];
  debugPanelOpen: boolean;
  autoScrollLogs: boolean;
  generationLogListenerReady: boolean;
  generationLogUnlisten: (() => void) | null;
  generatingPresentation: GeneratingPresentation | null;
}

interface GenerationStoreActions {
  setPdfText: (pdfText: string) => void;
  setPreparedDocument: (preparedDocument: PreparedDocument | null) => void;
  setPdfSourcePath: (pdfSourcePath: string | null) => void;
  setFileName: (fileName: string) => void;
  setIsReadingPdf: (isReadingPdf: boolean) => void;
  setLoadingMessage: (loadingMessage: string) => void;
  setUsedQuestions: (updater: Question[] | ((prev: Question[]) => Question[])) => void;
  setGenerationInProgress: (generationInProgress: boolean) => void;
  setGenerationAbortController: (controller: AbortController | null) => void;
  addGenerationLog: (entry: GenerationLogEntry) => void;
  clearGenerationLogs: () => void;
  setDebugPanelOpen: (open: boolean) => void;
  setAutoScrollLogs: (enabled: boolean) => void;
  ensureGenerationLogListener: () => Promise<void>;
  stopGenerationLogListener: () => void;
  setGeneratingPresentation: (presentation: GeneratingPresentation | null) => void;
  cancelGeneration: () => void;
  startQuizGeneration: () => Promise<void>;
  startFlashcardGeneration: () => Promise<void>;
}

export type GenerationStore = GenerationStoreState & GenerationStoreActions;

export const useGenerationStore = create<GenerationStore>((set, get) => ({
  pdfText: '',
  setPdfText: (pdfText) => set({ pdfText }),
  preparedDocument: null,
  setPreparedDocument: (preparedDocument) => set({ preparedDocument }),
  pdfSourcePath: null,
  setPdfSourcePath: (pdfSourcePath) => set({ pdfSourcePath }),
  fileName: '',
  setFileName: (fileName) => set({ fileName }),
  isReadingPdf: false,
  setIsReadingPdf: (isReadingPdf) => set({ isReadingPdf }),
  loadingMessage: '',
  setLoadingMessage: (loadingMessage) => set({ loadingMessage }),
  usedQuestions: [],
  setUsedQuestions: (updater) =>
    set((state) => ({
      usedQuestions: typeof updater === 'function' ? updater(state.usedQuestions) : updater,
    })),
  generationInProgress: false,
  setGenerationInProgress: (generationInProgress) => set({ generationInProgress }),
  generationAbortController: null,
  setGenerationAbortController: (generationAbortController) => set({ generationAbortController }),
  generationLogs: [],
  debugPanelOpen: false,
  autoScrollLogs: true,
  generationLogListenerReady: false,
  generationLogUnlisten: null,
  generatingPresentation: null,
  setGeneratingPresentation: (generatingPresentation) => set({ generatingPresentation }),
  addGenerationLog: (entry) =>
    set((state) => ({
      generationLogs: [...state.generationLogs, entry].slice(-MAX_GENERATION_LOGS),
    })),
  clearGenerationLogs: () => set({ generationLogs: [] }),
  setDebugPanelOpen: (debugPanelOpen) => set({ debugPanelOpen }),
  setAutoScrollLogs: (autoScrollLogs) => set({ autoScrollLogs }),
  ensureGenerationLogListener: async () => {
    const state = get();
    if (state.generationLogListenerReady || !isTauri()) return;
    const unlisten = await listen<GenerationLogEntry>(GENERATION_LOG_EVENT, (event) => {
      useGenerationStore.getState().addGenerationLog(event.payload);
    });
    set({ generationLogListenerReady: true, generationLogUnlisten: unlisten });
  },
  stopGenerationLogListener: () => {
    const state = get();
    state.generationLogUnlisten?.();
    set({ generationLogListenerReady: false, generationLogUnlisten: null });
  },
  cancelGeneration: () => {
    get().generationAbortController?.abort();
  },

  startQuizGeneration: async () => {
    const generationState = useGenerationStore.getState();
    const routingState = useRoutingStore.getState();
    const settingsState = useSettingsStore.getState();

    if (notifyIfOffline(settingsState.language)) return;
    if (generationState.generationInProgress) return;

    if (
      generationState.pdfSourcePath &&
      needsPreparedDocumentRefresh(generationState.preparedDocument?.extractionOptions, settingsState.settings.pdfExtraction)
    ) {
      generationState.addGenerationLog({
        stage: 'pdf.reextract',
        message: 'PDF extraction ayarlari degistigi icin dokuman yeniden islenecek.',
        level: 'info',
        timestamp: Date.now(),
      });
      generationState.setIsReadingPdf(true);
      try {
        const preparedDocument = await preparePdfDocumentFromPath(
          generationState.pdfSourcePath,
          settingsState.settings.pdfExtraction
        );
        generationState.setPreparedDocument(preparedDocument);
        generationState.setPdfText(preparedDocument.fullText);
        generationState.addGenerationLog({
          stage: 'pdf.reextract',
          message: 'PDF yeniden isleme tamamlandi.',
          level: 'success',
          timestamp: Date.now(),
          meta: {
            totalChars: preparedDocument.totalChars,
            pageCount: preparedDocument.pages.length,
            sourceMode: preparedDocument.sourceMode,
          },
        });
      } catch (error) {
        generationState.addGenerationLog({
          stage: 'pdf.reextract',
          message: 'PDF yeniden isleme hata ile sonlandi.',
          level: 'error',
          timestamp: Date.now(),
          meta: { error: getErrorMessage(error, 'PDF yeniden islenemedi.') },
        });
        toast.error(getErrorMessage(error, 'PDF yeniden islenemedi.'));
        return;
      } finally {
        generationState.setIsReadingPdf(false);
      }
    }

    await runQuizGenerationFlow(
      {
        language: settingsState.language,
        settings: settingsState.settings,
        pdfText: generationState.pdfText,
        preparedDocument: generationState.preparedDocument,
        usedQuestions: generationState.usedQuestions,
      },
      {
        setStep: routingState.setStep,
        setLoadingMessage: generationState.setLoadingMessage,
        setGenerationInProgress: generationState.setGenerationInProgress,
        setGenerationAbortController: generationState.setGenerationAbortController,
        addGenerationLog: generationState.addGenerationLog,
        clearGenerationLogs: generationState.clearGenerationLogs,
        setQuizQuestions: (questions) => {
          useQuizSessionStore.getState().setQuizState({
            questions,
            userAnswers: {},
            currentQuestionIndex: 0,
            score: 0,
            isFinished: false,
          });
        },
        setFlashcards: (flashcards) => useQuizSessionStore.getState().setFlashcards(flashcards),
        setUsedQuestions: generationState.setUsedQuestions,
        setGeneratingPresentation: generationState.setGeneratingPresentation,
      }
    );
  },

  startFlashcardGeneration: async () => {
    const generationState = useGenerationStore.getState();
    const routingState = useRoutingStore.getState();
    const settingsState = useSettingsStore.getState();

    if (notifyIfOffline(settingsState.language)) return;
    if (generationState.generationInProgress) return;

    if (
      generationState.pdfSourcePath &&
      needsPreparedDocumentRefresh(generationState.preparedDocument?.extractionOptions, settingsState.settings.pdfExtraction)
    ) {
      generationState.addGenerationLog({
        stage: 'pdf.reextract',
        message: 'PDF extraction ayarlari degistigi icin dokuman yeniden islenecek.',
        level: 'info',
        timestamp: Date.now(),
      });
      generationState.setIsReadingPdf(true);
      try {
        const preparedDocument = await preparePdfDocumentFromPath(
          generationState.pdfSourcePath,
          settingsState.settings.pdfExtraction
        );
        generationState.setPreparedDocument(preparedDocument);
        generationState.setPdfText(preparedDocument.fullText);
        generationState.addGenerationLog({
          stage: 'pdf.reextract',
          message: 'PDF yeniden isleme tamamlandi.',
          level: 'success',
          timestamp: Date.now(),
          meta: {
            totalChars: preparedDocument.totalChars,
            pageCount: preparedDocument.pages.length,
            sourceMode: preparedDocument.sourceMode,
          },
        });
      } catch (error) {
        generationState.addGenerationLog({
          stage: 'pdf.reextract',
          message: 'PDF yeniden isleme hata ile sonlandi.',
          level: 'error',
          timestamp: Date.now(),
          meta: { error: getErrorMessage(error, 'PDF yeniden islenemedi.') },
        });
        toast.error(getErrorMessage(error, 'PDF yeniden islenemedi.'));
        return;
      } finally {
        generationState.setIsReadingPdf(false);
      }
    }

    await runFlashcardGenerationFlow(
      {
        language: settingsState.language,
        settings: settingsState.settings,
        pdfText: generationState.pdfText,
        preparedDocument: generationState.preparedDocument,
        usedQuestions: generationState.usedQuestions,
      },
      {
        setStep: routingState.setStep,
        setLoadingMessage: generationState.setLoadingMessage,
        setGenerationInProgress: generationState.setGenerationInProgress,
        setGenerationAbortController: generationState.setGenerationAbortController,
        addGenerationLog: generationState.addGenerationLog,
        clearGenerationLogs: generationState.clearGenerationLogs,
        setQuizQuestions: (questions) => {
          useQuizSessionStore.getState().setQuizState({
            questions,
            userAnswers: {},
            currentQuestionIndex: 0,
            score: 0,
            isFinished: false,
          });
        },
        setFlashcards: (flashcards) => useQuizSessionStore.getState().setFlashcards(flashcards),
        setUsedQuestions: generationState.setUsedQuestions,
        setGeneratingPresentation: generationState.setGeneratingPresentation,
      }
    );
  },
}));
