import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { AppStep, type Question } from '../../../types';
import { generateQuizQuestions } from '../../gemini';
import { TRANSLATIONS } from '../../../constants/translations';
import { getDemoQuestionPool } from '../../../constants/demoQuestions';
import {
  isGenerationCancelledError,
  showGenerationCancelledToast,
  STANDARD_TOAST_DURATION_MS,
} from '../../../utils/toast';
import { yieldMacrotask, yieldToPaint } from '../../../utils/asyncScheduling';
import { hasRequiredInput, type GenerationFlowActions, type GenerationFlowContext } from './types';

export async function runQuizGenerationFlow(
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
    stage: 'generation.quiz',
    message: 'Soru uretimi baslatildi.',
    level: 'info',
    timestamp: Date.now(),
    meta: {
      requestedQuestionCount: context.settings.questionCount,
      model: context.settings.model,
      sourceMode: context.preparedDocument?.sourceMode ?? (context.pdfText === 'DEMO' ? 'demo' : 'text'),
    },
  });
  const abortController = new AbortController();
  actions.setGenerationAbortController(abortController);

  const maxBatchSize = 10;
  const targetQuestionCount =
    context.pdfText === 'DEMO'
      ? Math.min(context.settings.questionCount, getDemoQuestionPool(context.language).length)
      : context.settings.questionCount;
  const numBatches = Math.ceil(targetQuestionCount / maxBatchSize);

  try {
    flushSync(() => {
      actions.setLoadingMessage(t.creating);
      actions.setStep(AppStep.GENERATING);
      actions.setGeneratingPresentation({
        mode: 'quiz',
        targetQuestionCount,
        batchCount: numBatches,
      });
    });
    await yieldMacrotask();
    await yieldToPaint();
    const accumulatedQuestions: Question[] = [];
    const localUsedQuestions = [...context.usedQuestions];

    for (let index = 0; index < numBatches; index += 1) {
      if (numBatches > 1) {
        actions.addGenerationLog({
          stage: 'generation.quiz.batch',
          message: `Batch ${index + 1}/${numBatches} hazirlaniyor.`,
          level: 'info',
          timestamp: Date.now(),
        });
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
      actions.addGenerationLog({
        stage: 'generation.quiz.batch',
        message: `Batch ${index + 1}/${numBatches} tamamlandi.`,
        level: 'success',
        timestamp: Date.now(),
        meta: {
          batchSize: batch.length,
          accumulated: accumulatedQuestions.length,
        },
      });
    }

    if (accumulatedQuestions.length === 0) {
      actions.addGenerationLog({
        stage: 'generation.quiz',
        message: 'Uretimde gecerli soru elde edilemedi.',
        level: 'error',
        timestamp: Date.now(),
      });
      toast.error(t.errors.noQuestions, { duration: STANDARD_TOAST_DURATION_MS });
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
        { duration: STANDARD_TOAST_DURATION_MS }
      );
    } else {
      toast.success(t.ready.title, { duration: STANDARD_TOAST_DURATION_MS });
    }
    actions.addGenerationLog({
      stage: 'generation.quiz',
      message: 'Soru uretimi basariyla tamamlandi.',
      level: 'success',
      timestamp: Date.now(),
      meta: {
        producedQuestionCount: questionsWithGlobalIds.length,
        targetQuestionCount,
      },
    });
    actions.setStep(AppStep.READY);
  } catch (error) {
    if (isGenerationCancelledError(error, context.language)) {
      actions.addGenerationLog({
        stage: 'generation.quiz',
        message: 'Soru uretimi kullanici tarafindan iptal edildi.',
        level: 'warning',
        timestamp: Date.now(),
      });
      showGenerationCancelledToast(context.language);
    } else {
      actions.addGenerationLog({
        stage: 'generation.quiz',
        message: 'Soru uretimi hata ile sonlandi.',
        level: 'error',
        timestamp: Date.now(),
        meta: { error: error instanceof Error ? error.message : String(error) },
      });
      toast.error(error instanceof Error ? error.message : t.errors.noQuestions, { duration: STANDARD_TOAST_DURATION_MS });
    }
    actions.setStep(AppStep.CONFIG);
  } finally {
    actions.setGeneratingPresentation(null);
    actions.setGenerationAbortController(null);
    actions.setGenerationInProgress(false);
  }
}
