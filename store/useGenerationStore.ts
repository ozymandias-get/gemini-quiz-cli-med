import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { create } from 'zustand';
import { AppStep, type Question } from '../types';
import { generateQuizQuestions, generateFlashcards } from '../services/geminiService';
import { TRANSLATIONS } from '../constants/translations';
import { getDemoQuestionPool } from '../constants/demoQuestions';
import { useRoutingStore } from './useRoutingStore';
import { useSettingsStore } from './useSettingsStore';
import { useQuizSessionStore } from './useQuizSessionStore';
import {
  isGenerationCancelledError,
  notifyIfOffline,
  showGenerationCancelledToast,
} from '../utils/toast';
import { yieldMacrotask, yieldToPaint } from '../utils/asyncScheduling';

const TOAST_DURATION_MS = 4000;

interface GenerationState {
  pdfText: string;
  setPdfText: (t: string) => void;
  pdfFile: File | null;
  setPdfFile: (f: File | null) => void;
  fileName: string;
  setFileName: (n: string) => void;
  isReadingPdf: boolean;
  setIsReadingPdf: (v: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (m: string) => void;
  usedQuestions: Question[];
  setUsedQuestions: (u: Question[] | ((prev: Question[]) => Question[])) => void;
  generationInProgress: boolean;
  setGenerationInProgress: (v: boolean) => void;
  /** Aktif sınav/kart üretimi için; İptal bu kontrolcere `abort()` çağırır. */
  generationAbortController: AbortController | null;
  setGenerationAbortController: (c: AbortController | null) => void;
  cancelGeneration: () => void;
  startQuizGeneration: () => Promise<void>;
  startFlashcardGeneration: () => Promise<void>;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  pdfText: '',
  setPdfText: (pdfText) => set({ pdfText }),
  pdfFile: null,
  setPdfFile: (pdfFile) => set({ pdfFile }),
  fileName: '',
  setFileName: (fileName) => set({ fileName }),
  isReadingPdf: false,
  setIsReadingPdf: (isReadingPdf) => set({ isReadingPdf }),
  loadingMessage: '',
  setLoadingMessage: (loadingMessage) => set({ loadingMessage }),
  usedQuestions: [],
  setUsedQuestions: (u) =>
    set((state) => ({
      usedQuestions: typeof u === 'function' ? u(state.usedQuestions) : u,
    })),
  generationInProgress: false,
  setGenerationInProgress: (generationInProgress) => set({ generationInProgress }),
  generationAbortController: null,
  setGenerationAbortController: (generationAbortController) => set({ generationAbortController }),
  cancelGeneration: () => {
    get().generationAbortController?.abort();
  },

  startQuizGeneration: async () => {
    const gen = useGenerationStore.getState();
    const routing = useRoutingStore.getState();
    const settingsState = useSettingsStore.getState();
    const quiz = useQuizSessionStore.getState();

    if (notifyIfOffline(settingsState.language)) return;

    if (gen.generationInProgress) return;

    const { pdfText, usedQuestions } = gen;
    const t = TRANSLATIONS[settingsState.language];

    if (!pdfText) {
      toast.error(t.uploadRequired, { duration: TOAST_DURATION_MS });
      return;
    }

    gen.setGenerationInProgress(true);
    const abortController = new AbortController();
    gen.setGenerationAbortController(abortController);
    try {
      flushSync(() => {
        gen.setLoadingMessage(t.creating);
        routing.setStep(AppStep.GENERATING);
      });
      await yieldMacrotask();
      await yieldToPaint();

      const MAX_BATCH_SIZE = 10;
      const targetQuestionCount =
        pdfText === 'DEMO'
          ? Math.min(settingsState.settings.questionCount, getDemoQuestionPool(settingsState.language).length)
          : settingsState.settings.questionCount;
      const numBatches = Math.ceil(targetQuestionCount / MAX_BATCH_SIZE);
      const accumulatedQuestions: Question[] = [];
      const localUsedQuestions = [...usedQuestions];

      for (let i = 0; i < numBatches; i++) {
        if (numBatches > 1) {
          flushSync(() => {
            gen.setLoadingMessage(
              t.batchCreating.replace('{current}', String(i + 1)).replace('{total}', String(numBatches))
            );
          });
          await yieldMacrotask();
          await yieldToPaint();
        }

        const remaining = targetQuestionCount - accumulatedQuestions.length;
        const batchSize = Math.min(MAX_BATCH_SIZE, remaining);

        const batchSettings = { ...settingsState.settings, questionCount: batchSize };
        const batch = await generateQuizQuestions(
          pdfText,
          batchSettings,
          settingsState.language,
          [],
          localUsedQuestions,
          { signal: abortController.signal }
        );

        accumulatedQuestions.push(...batch);
        localUsedQuestions.push(...batch);
      }

      if (accumulatedQuestions.length === 0) {
        toast.error(t.errors.noQuestions, { duration: TOAST_DURATION_MS });
        routing.setStep(AppStep.CONFIG);
        return;
      }

      // Çoklu batch'te her parti q-1..q-N ürettiği için id çakışmasını önle (userAnswers anahtarı soru başına tekil olmalı).
      const questionsWithGlobalIds = accumulatedQuestions.map((q, i) => ({
        ...q,
        id: `q-${i + 1}`,
      }));

      quiz.setQuizState({
        questions: questionsWithGlobalIds,
        userAnswers: {},
        currentQuestionIndex: 0,
        score: 0,
        isFinished: false,
      });

      if (questionsWithGlobalIds.length < targetQuestionCount) {
        toast.warning(
          t.toasts.questionsPartialAfterValidation
            .replace('{actual}', String(questionsWithGlobalIds.length))
            .replace('{requested}', String(targetQuestionCount)),
          { duration: TOAST_DURATION_MS }
        );
      } else {
        toast.success(t.ready.title, { duration: TOAST_DURATION_MS });
      }
      routing.setStep(AppStep.READY);
    } catch (err) {
      if (isGenerationCancelledError(err, settingsState.language)) {
        showGenerationCancelledToast(settingsState.language);
      } else {
        toast.error(err instanceof Error ? err.message : t.errors.noQuestions, { duration: TOAST_DURATION_MS });
      }
      routing.setStep(AppStep.CONFIG);
    } finally {
      gen.setGenerationAbortController(null);
      gen.setGenerationInProgress(false);
    }
  },

  startFlashcardGeneration: async () => {
    const gen = useGenerationStore.getState();
    const routing = useRoutingStore.getState();
    const settingsState = useSettingsStore.getState();

    if (notifyIfOffline(settingsState.language)) return;

    if (gen.generationInProgress) return;

    const t = TRANSLATIONS[settingsState.language];
    const { pdfText } = gen;

    if (!pdfText) {
      toast.error(t.uploadRequired, { duration: TOAST_DURATION_MS });
      return;
    }

    gen.setGenerationInProgress(true);
    const abortController = new AbortController();
    gen.setGenerationAbortController(abortController);
    try {
      flushSync(() => {
        gen.setLoadingMessage(t.creatingFlashcards);
        routing.setStep(AppStep.GENERATING);
      });
      await yieldMacrotask();
      await yieldToPaint();

      const cards = await generateFlashcards(pdfText, settingsState.settings, settingsState.language, {
        signal: abortController.signal,
      });
      useQuizSessionStore.getState().setFlashcards(cards);
      toast.success(t.toasts.flashcardsReady, { duration: TOAST_DURATION_MS });
      routing.setStep(AppStep.STUDY);
    } catch (err) {
      if (isGenerationCancelledError(err, settingsState.language)) {
        showGenerationCancelledToast(settingsState.language);
      } else {
        toast.error(err instanceof Error ? err.message : t.errors.generic, { duration: TOAST_DURATION_MS });
      }
      routing.setStep(AppStep.CONFIG);
    } finally {
      gen.setGenerationAbortController(null);
      gen.setGenerationInProgress(false);
    }
  },
}));
