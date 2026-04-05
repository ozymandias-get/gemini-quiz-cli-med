import { flushSync } from 'react-dom';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { AppStep, type Question } from '../types';
import { extractTextFromPDF } from './pdfService';
import { generateQuizQuestions } from './geminiService';
import { TRANSLATIONS } from '../constants/translations';
import { useRoutingStore } from '../store/useRoutingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { useGenerationStore } from '../store/useGenerationStore';
import { isGenerationCancelledError, showGenerationCancelledToast } from '../utils/toast';
import { MAX_PDF_SIZE_BYTES } from '../constants/pdfLimits';
import { yieldMacrotask, yieldToPaint } from '../utils/asyncScheduling';

const TOAST_DURATION_MS = 4000;

function tNow() {
  const lang = useSettingsStore.getState().language;
  return TRANSLATIONS[lang];
}

export function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  const t = tNow();
  const gen = useGenerationStore.getState();

  if (file.size > MAX_PDF_SIZE_BYTES) {
    toast.error(t.errors.fileSizePdf, { duration: TOAST_DURATION_MS });
    return;
  }
  if (file.type !== 'application/pdf') {
    toast.error(t.errors.format, { duration: TOAST_DURATION_MS });
    return;
  }

  void (async () => {
    try {
      gen.setIsReadingPdf(true);
      gen.setFileName(file.name);
      gen.setPdfFile(file);
      gen.setUsedQuestions([]);

      const text = await extractTextFromPDF(file);
      if (text.trim().length < 50) throw new Error(t.errors.textLength);
      gen.setPdfText(text);
      toast.success(t.fileSelected, { duration: TOAST_DURATION_MS });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.errors.generic, { duration: TOAST_DURATION_MS });
      gen.setPdfText('');
      gen.setFileName('');
      gen.setPdfFile(null);
    } finally {
      gen.setIsReadingPdf(false);
    }
  })();
}

export function startQuizGeneration() {
  return useGenerationStore.getState().startQuizGeneration();
}

export function handleStartActiveQuiz() {
  const quiz = useQuizSessionStore.getState();
  const routing = useRoutingStore.getState();
  quiz.setQuizState((prev) => ({
    ...prev,
    startTime: Date.now(),
  }));
  routing.setStep(AppStep.QUIZ);
}

export function startFlashcardGeneration() {
  return useGenerationStore.getState().startFlashcardGeneration();
}

export async function startRemedialQuiz() {
  const gen = useGenerationStore.getState();
  const routing = useRoutingStore.getState();
  const settingsState = useSettingsStore.getState();
  const quiz = useQuizSessionStore.getState();

  const { questions, userAnswers } = quiz.quizState;
  const failedQuestions: Question[] = [];
  questions.forEach((q) => {
    const answer = userAnswers[q.id];
    if (answer === undefined || answer !== q.correctAnswerIndex) {
      failedQuestions.push(q);
    }
  });

  if (failedQuestions.length === 0) return;
  if (gen.generationInProgress) return;

  const t = TRANSLATIONS[settingsState.language];
  const { pdfText } = gen;

  gen.setGenerationInProgress(true);
  const abortController = new AbortController();
  gen.setGenerationAbortController(abortController);
  try {
    flushSync(() => {
      gen.setLoadingMessage(t.remedialCreating);
      routing.setStep(AppStep.GENERATING);
    });
    await yieldMacrotask();
    await yieldToPaint();

    const newQuestions = await generateQuizQuestions(
      pdfText,
      settingsState.settings,
      settingsState.language,
      failedQuestions,
      [],
      { signal: abortController.signal }
    );

    if (newQuestions.length === 0) {
      toast.error(t.errors.noQuestions, { duration: TOAST_DURATION_MS });
      routing.setStep(AppStep.RESULTS);
      return;
    }

    quiz.setQuizState({
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
    routing.setStep(AppStep.RESULTS);
  } finally {
    gen.setGenerationAbortController(null);
    gen.setGenerationInProgress(false);
  }
}

export function finishQuiz() {
  const quiz = useQuizSessionStore.getState();
  const routing = useRoutingStore.getState();
  quiz.setQuizState((prev) => {
    const correctCount = prev.questions.reduce((acc, q) => {
      const ans = prev.userAnswers[q.id];
      return acc + (ans !== undefined && ans === q.correctAnswerIndex ? 1 : 0);
    }, 0);
    return { ...prev, score: correctCount, isFinished: true, endTime: Date.now() };
  });
  routing.setStep(AppStep.RESULTS);
}

export function handleRestart() {
  const gen = useGenerationStore.getState();
  const routing = useRoutingStore.getState();
  gen.setPdfText('');
  gen.setFileName('');
  gen.setPdfFile(null);
  gen.setUsedQuestions([]);
  routing.setStep(AppStep.CONFIG);
}

export function handleRegenerate() {
  const gen = useGenerationStore.getState();
  const routing = useRoutingStore.getState();
  const quiz = useQuizSessionStore.getState();
  gen.setUsedQuestions((prev) => [...prev, ...quiz.quizState.questions]);
  routing.setStep(AppStep.CONFIG);
}

export function prepareDemoQuiz() {
  const gen = useGenerationStore.getState();
  const routing = useRoutingStore.getState();
  const settings = useSettingsStore.getState();
  gen.setPdfText('DEMO');
  gen.setFileName('demo.pdf');
  gen.setPdfFile(null);
  settings.setSettings((s) => ({ ...s, questionCount: 10 }));
  routing.setStep(AppStep.CONFIG);
}

export function clearPdfUpload() {
  const gen = useGenerationStore.getState();
  gen.setPdfText('');
  gen.setFileName('');
  gen.setPdfFile(null);
  gen.setUsedQuestions([]);
}

export function navigateToLanding() {
  useRoutingStore.getState().setStep(AppStep.LANDING);
}

export function navigateToConfig() {
  useRoutingStore.getState().setStep(AppStep.CONFIG);
}
