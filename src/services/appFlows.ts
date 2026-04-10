import { flushSync } from 'react-dom';
import { toast } from 'sonner';
import { isTauri } from '@tauri-apps/api/core';
import { readPdfFileInfo } from './api/pdfFiles';
import { open } from '@tauri-apps/plugin-dialog';
import { AppStep, type Question } from '../types';
import { preparePdfDocumentFromPath } from './pdfService';
import { generateQuizQuestions } from './gemini';
import { TRANSLATIONS } from '../constants/translations';
import { useRoutingStore } from '../store/useRoutingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { useGenerationStore } from '../store/useGenerationStore';
import { isGenerationCancelledError, showGenerationCancelledToast, STANDARD_TOAST_DURATION_MS } from '../utils/toast';
import { MAX_PDF_SIZE_BYTES } from '../constants/pdfLimits';
import { yieldMacrotask, yieldToPaint } from '../utils/asyncScheduling';
import { getErrorMessage } from '../utils/errorMessage';

function tNow() {
  const language = useSettingsStore.getState().language;
  return TRANSLATIONS[language];
}

export function handleFileUpload() {
  const t = tNow();
  const generationState = useGenerationStore.getState();

  if (!isTauri()) {
    toast.error("Bu ozellik yalnizca Tauri masaustu uygulamasinda calisir. `npm run tauri:dev` ile baslatin.", {
      duration: STANDARD_TOAST_DURATION_MS,
    });
    return;
  }

  void (async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (!selected) return;

      const absolutePath = Array.isArray(selected) ? selected[0] : selected;
      if (!absolutePath) return;

      const { fileName, sizeBytes } = await readPdfFileInfo(absolutePath);

      if (sizeBytes > MAX_PDF_SIZE_BYTES) {
        toast.error(t.errors.fileSizePdf, { duration: STANDARD_TOAST_DURATION_MS });
        return;
      }

      generationState.setIsReadingPdf(true);
      generationState.setFileName(fileName);
      generationState.setPdfSourcePath(absolutePath);
      generationState.setUsedQuestions([]);

      const preparedDocument = await preparePdfDocumentFromPath(
        absolutePath,
        useSettingsStore.getState().settings.pdfExtraction
      );
      generationState.setPreparedDocument(preparedDocument);
      generationState.setPdfText(preparedDocument.fullText);
      toast.success(t.fileSelected, { duration: STANDARD_TOAST_DURATION_MS });
    } catch (error) {
      toast.error(getErrorMessage(error, t.errors.generic), { duration: STANDARD_TOAST_DURATION_MS });
      generationState.setPdfText('');
      generationState.setPreparedDocument(null);
      generationState.setFileName('');
      generationState.setPdfSourcePath(null);
    } finally {
      generationState.setIsReadingPdf(false);
    }
  })();
}

export function startQuizGeneration() {
  return useGenerationStore.getState().startQuizGeneration();
}

export function handleStartActiveQuiz() {
  const quizState = useQuizSessionStore.getState();
  const routingState = useRoutingStore.getState();
  quizState.setQuizState((prev) => ({
    ...prev,
    startTime: Date.now(),
  }));
  routingState.setStep(AppStep.QUIZ);
}

export function startFlashcardGeneration() {
  return useGenerationStore.getState().startFlashcardGeneration();
}

export async function startRemedialQuiz() {
  const generationState = useGenerationStore.getState();
  const routingState = useRoutingStore.getState();
  const settingsState = useSettingsStore.getState();
  const quizState = useQuizSessionStore.getState();

  const { questions, userAnswers } = quizState.quizState;
  const failedQuestions: Question[] = [];
  questions.forEach((question) => {
    const answer = userAnswers[question.id];
    if (answer === undefined || answer !== question.correctAnswerIndex) {
      failedQuestions.push(question);
    }
  });

  if (failedQuestions.length === 0) return;
  if (generationState.generationInProgress) return;

  const t = TRANSLATIONS[settingsState.language];

  generationState.setGenerationInProgress(true);
  const abortController = new AbortController();
  generationState.setGenerationAbortController(abortController);

  try {
    flushSync(() => {
      generationState.setLoadingMessage(t.remedialCreating);
      generationState.setGeneratingPresentation({
        mode: 'remedial',
        approximateCount: failedQuestions.length,
      });
      routingState.setStep(AppStep.GENERATING);
    });
    await yieldMacrotask();
    await yieldToPaint();

    const newQuestions = await generateQuizQuestions(
      generationState.pdfText,
      generationState.preparedDocument,
      settingsState.settings,
      settingsState.language,
      failedQuestions,
      [],
      { signal: abortController.signal }
    );

    if (newQuestions.length === 0) {
      toast.error(t.errors.noQuestions, { duration: STANDARD_TOAST_DURATION_MS });
      routingState.setStep(AppStep.RESULTS);
      return;
    }

    quizState.setQuizState({
      questions: newQuestions,
      userAnswers: {},
      currentQuestionIndex: 0,
      score: 0,
      isFinished: false,
    });

    if (newQuestions.length < failedQuestions.length) {
      toast.warning(
        t.toasts.questionsPartialAfterValidation
          .replace('{actual}', String(newQuestions.length))
          .replace('{requested}', String(failedQuestions.length)),
        { duration: STANDARD_TOAST_DURATION_MS }
      );
    } else {
      toast.success(t.ready.title, { duration: STANDARD_TOAST_DURATION_MS });
    }
    routingState.setStep(AppStep.READY);
  } catch (error) {
    if (isGenerationCancelledError(error, settingsState.language)) {
      showGenerationCancelledToast(settingsState.language);
    } else {
      toast.error(getErrorMessage(error, t.errors.noQuestions), { duration: STANDARD_TOAST_DURATION_MS });
    }
    routingState.setStep(AppStep.RESULTS);
  } finally {
    generationState.setGeneratingPresentation(null);
    generationState.setGenerationAbortController(null);
    generationState.setGenerationInProgress(false);
  }
}

export function finishQuiz() {
  const quizState = useQuizSessionStore.getState();
  const routingState = useRoutingStore.getState();
  quizState.setQuizState((prev) => {
    const correctCount = prev.questions.reduce((accumulator, question) => {
      const answer = prev.userAnswers[question.id];
      return accumulator + (answer !== undefined && answer === question.correctAnswerIndex ? 1 : 0);
    }, 0);
    return { ...prev, score: correctCount, isFinished: true, endTime: Date.now() };
  });
  routingState.setStep(AppStep.RESULTS);
}

export function handleRestart() {
  const generationState = useGenerationStore.getState();
  const routingState = useRoutingStore.getState();
  generationState.setPdfText('');
  generationState.setPreparedDocument(null);
  generationState.setFileName('');
  generationState.setPdfSourcePath(null);
  generationState.setUsedQuestions([]);
  routingState.setStep(AppStep.CONFIG);
}

export function handleRegenerate() {
  const generationState = useGenerationStore.getState();
  const routingState = useRoutingStore.getState();
  const quizState = useQuizSessionStore.getState();
  generationState.setUsedQuestions((prev) => [...prev, ...quizState.quizState.questions]);
  routingState.setStep(AppStep.CONFIG);
}

export function prepareDemoQuiz() {
  const generationState = useGenerationStore.getState();
  const routingState = useRoutingStore.getState();
  const settingsState = useSettingsStore.getState();
  generationState.setPdfText('DEMO');
  generationState.setPreparedDocument(null);
  generationState.setFileName('demo.pdf');
  generationState.setPdfSourcePath(null);
  settingsState.setSettings((settings) => ({ ...settings, questionCount: 10 }));
  routingState.setStep(AppStep.CONFIG);
}

export function clearPdfUpload() {
  const generationState = useGenerationStore.getState();
  generationState.setPdfText('');
  generationState.setPreparedDocument(null);
  generationState.setFileName('');
  generationState.setPdfSourcePath(null);
  generationState.setUsedQuestions([]);
}

export function navigateToLanding() {
  useRoutingStore.getState().setStep(AppStep.LANDING);
}

export function navigateToConfig() {
  useRoutingStore.getState().setStep(AppStep.CONFIG);
}

export function navigateToPdfExtractionHelp() {
  useRoutingStore.getState().setStep(AppStep.PDF_EXTRACTION_HELP);
}
