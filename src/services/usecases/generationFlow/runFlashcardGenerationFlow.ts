import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { AppStep } from '../../../types';
import { generateFlashcards } from '../../gemini';
import { TRANSLATIONS } from '../../../constants/translations';
import {
  isGenerationCancelledError,
  showGenerationCancelledToast,
  STANDARD_TOAST_DURATION_MS,
} from '../../../utils/toast';
import { yieldMacrotask, yieldToPaint } from '../../../utils/asyncScheduling';
import { hasRequiredInput, type GenerationFlowActions, type GenerationFlowContext } from './types';

export async function runFlashcardGenerationFlow(
  context: GenerationFlowContext,
  actions: GenerationFlowActions
): Promise<void> {
  const t = TRANSLATIONS[context.language];
  if (!hasRequiredInput(context)) {
    toast.error(t.uploadRequired, { duration: STANDARD_TOAST_DURATION_MS });
    return;
  }

  actions.setGenerationInProgress(true);
  actions.clearGenerationLogs();
  actions.addGenerationLog({
    stage: 'generation.flashcards',
    message: 'Flashcard uretimi baslatildi.',
    level: 'info',
    timestamp: Date.now(),
    meta: {
      model: context.settings.model,
      sourceMode: context.preparedDocument?.sourceMode ?? (context.pdfText === 'DEMO' ? 'demo' : 'text'),
    },
  });
  const abortController = new AbortController();
  actions.setGenerationAbortController(abortController);

  try {
    flushSync(() => {
      actions.setLoadingMessage(t.creatingFlashcards);
      actions.setStep(AppStep.GENERATING);
      actions.setGeneratingPresentation({ mode: 'flashcards' });
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
    actions.addGenerationLog({
      stage: 'generation.flashcards',
      message: 'Flashcard uretimi basariyla tamamlandi.',
      level: 'success',
      timestamp: Date.now(),
      meta: { flashcardCount: flashcards.length },
    });
    toast.success(t.toasts.flashcardsReady, { duration: STANDARD_TOAST_DURATION_MS });
    actions.setStep(AppStep.STUDY);
  } catch (error) {
    if (isGenerationCancelledError(error, context.language)) {
      actions.addGenerationLog({
        stage: 'generation.flashcards',
        message: 'Flashcard uretimi kullanici tarafindan iptal edildi.',
        level: 'warning',
        timestamp: Date.now(),
      });
      showGenerationCancelledToast(context.language);
    } else {
      actions.addGenerationLog({
        stage: 'generation.flashcards',
        message: 'Flashcard uretimi hata ile sonlandi.',
        level: 'error',
        timestamp: Date.now(),
        meta: { error: error instanceof Error ? error.message : String(error) },
      });
      toast.error(error instanceof Error ? error.message : t.errors.generic, { duration: STANDARD_TOAST_DURATION_MS });
    }
    actions.setStep(AppStep.CONFIG);
  } finally {
    actions.setGeneratingPresentation(null);
    actions.setGenerationAbortController(null);
    actions.setGenerationInProgress(false);
  }
}
