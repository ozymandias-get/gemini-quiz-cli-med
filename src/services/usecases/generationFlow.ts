import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import {
  AppStep,
  type Flashcard,
  type LanguageCode,
  type PreparedDocument,
  type Question,
  type QuizSettings,
} from '../../types';
import { generateFlashcards, generateQuizQuestions } from '../gemini';
import { TRANSLATIONS } from '../../constants/translations';
import { getDemoQuestionPool } from '../../constants/demoQuestions';
import { isGenerationCancelledError, showGenerationCancelledToast } from '../../utils/toast';
import { yieldMacrotask, yieldToPaint } from '../../utils/asyncScheduling';

const TOAST_DURATION_MS = 4000;

interface GenerationFlowContext {
  language: LanguageCode;
  settings: QuizSettings;
  pdfText: string;
  preparedDocument: PreparedDocument | null;
  usedQuestions: Question[];
}

interface GenerationFlowActions {
  setStep: (step: AppStep) => void;
  setLoadingMessage: (message: string) => void;
  setGenerationInProgress: (value: boolean) => void;
  setGenerationAbortController: (controller: AbortController | null) => void;
  setQuizQuestions: (questions: Question[]) => void;
  setFlashcards: (flashcards: Flashcard[]) => void;
  setUsedQuestions: (updater: Question[] | ((prev: Question[]) => Question[])) => void;
}

function hasRequiredInput(context: GenerationFlowContext): boolean {
  if (context.pdfText === 'DEMO') return true;
  return Boolean(context.preparedDocument && context.pdfText.trim().length > 0);
}

export async function runQuizGenerationFlow(
  context: GenerationFlowContext,
  actions: GenerationFlowActions
): Promise<void> {
  const t = TRANSLATIONS[context.language];
  if (!hasRequiredInput(context)) {
    toast.error(t.uploadRequired, { duration: TOAST_DURATION_MS });
    return;
  }

  actions.setGenerationInProgress(true);
  const abortController = new AbortController();
  actions.setGenerationAbortController(abortController);

  try {
    flushSync(() => {
      actions.setLoadingMessage(t.creating);
      actions.setStep(AppStep.GENERATING);
    });
    await yieldMacrotask();
    await yieldToPaint();

    const maxBatchSize = 10;
    const targetQuestionCount =
      context.pdfText === 'DEMO'
        ? Math.min(context.settings.questionCount, getDemoQuestionPool(context.language).length)
        : context.settings.questionCount;
    const numBatches = Math.ceil(targetQuestionCount / maxBatchSize);
    const accumulatedQuestions: Question[] = [];
    const localUsedQuestions = [...context.usedQuestions];

    for (let index = 0; index < numBatches; index += 1) {
      if (numBatches > 1) {
        flushSync(() => {
          actions.setLoadingMessage(
            t.batchCreating.replace('{current}', String(index + 1)).replace('{total}', String(numBatches))
          );
        });
        await yieldMacrotask();
        await yieldToPaint();
      }

      const remaining = targetQuestionCount - accumulatedQuestions.length;
      const batchSize = Math.min(maxBatchSize, remaining);
      const batchSettings = { ...context.settings, questionCount: batchSize };
      const batch = await generateQuizQuestions(
        context.pdfText,
        context.preparedDocument,
        batchSettings,
        context.language,
        [],
        localUsedQuestions,
        { signal: abortController.signal }
      );
      accumulatedQuestions.push(...batch);
      localUsedQuestions.push(...batch);
    }

    if (accumulatedQuestions.length === 0) {
      toast.error(t.errors.noQuestions, { duration: TOAST_DURATION_MS });
      actions.setStep(AppStep.CONFIG);
      return;
    }

    const questionsWithGlobalIds = accumulatedQuestions.map((question, index) => ({
      ...question,
      id: `q-${index + 1}`,
    }));
    actions.setQuizQuestions(questionsWithGlobalIds);

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
    actions.setStep(AppStep.READY);
  } catch (error) {
    if (isGenerationCancelledError(error, context.language)) {
      showGenerationCancelledToast(context.language);
    } else {
      toast.error(error instanceof Error ? error.message : t.errors.noQuestions, { duration: TOAST_DURATION_MS });
    }
    actions.setStep(AppStep.CONFIG);
  } finally {
    actions.setGenerationAbortController(null);
    actions.setGenerationInProgress(false);
  }
}

export async function runFlashcardGenerationFlow(
  context: GenerationFlowContext,
  actions: GenerationFlowActions
): Promise<void> {
  const t = TRANSLATIONS[context.language];
  if (!hasRequiredInput(context)) {
    toast.error(t.uploadRequired, { duration: TOAST_DURATION_MS });
    return;
  }

  actions.setGenerationInProgress(true);
  const abortController = new AbortController();
  actions.setGenerationAbortController(abortController);

  try {
    flushSync(() => {
      actions.setLoadingMessage(t.creatingFlashcards);
      actions.setStep(AppStep.GENERATING);
    });
    await yieldMacrotask();
    await yieldToPaint();

    const flashcards = await generateFlashcards(
      context.pdfText,
      context.preparedDocument,
      context.settings,
      context.language,
      { signal: abortController.signal }
    );
    actions.setFlashcards(flashcards);
    toast.success(t.toasts.flashcardsReady, { duration: TOAST_DURATION_MS });
    actions.setStep(AppStep.STUDY);
  } catch (error) {
    if (isGenerationCancelledError(error, context.language)) {
      showGenerationCancelledToast(context.language);
    } else {
      toast.error(error instanceof Error ? error.message : t.errors.generic, { duration: TOAST_DURATION_MS });
    }
    actions.setStep(AppStep.CONFIG);
  } finally {
    actions.setGenerationAbortController(null);
    actions.setGenerationInProgress(false);
  }
}
