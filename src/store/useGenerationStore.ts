import { create } from 'zustand';
import { toast } from 'sonner';
import type { PreparedDocument, Question } from '../types';
import { useRoutingStore } from './useRoutingStore';
import { useSettingsStore } from './useSettingsStore';
import { useQuizSessionStore } from './useQuizSessionStore';
import { notifyIfOffline } from '../utils/toast';
import { runFlashcardGenerationFlow, runQuizGenerationFlow } from '../services/usecases/generationFlow';
import { preparePdfDocumentFromPath } from '../services/pdfService';
import { needsPreparedDocumentRefresh } from './usePdfRuntimeStore';

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
      generationState.setIsReadingPdf(true);
      try {
        const preparedDocument = await preparePdfDocumentFromPath(
          generationState.pdfSourcePath,
          settingsState.settings.pdfExtraction
        );
        generationState.setPreparedDocument(preparedDocument);
        generationState.setPdfText(preparedDocument.fullText);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'PDF yeniden islenemedi.');
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
      generationState.setIsReadingPdf(true);
      try {
        const preparedDocument = await preparePdfDocumentFromPath(
          generationState.pdfSourcePath,
          settingsState.settings.pdfExtraction
        );
        generationState.setPreparedDocument(preparedDocument);
        generationState.setPdfText(preparedDocument.fullText);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'PDF yeniden islenemedi.');
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
      }
    );
  },
}));
