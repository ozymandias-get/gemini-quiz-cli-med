import { useEffect, useMemo, useState } from 'react';
import { AppStep } from '../types';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { useRoutingStore } from '../store/useRoutingStore';
import { useTranslation } from './useTranslations';

export function useResumeQuizState() {
  const [persistHydrated, setPersistHydrated] = useState(false);
  const { t } = useTranslation();
  const quizState = useQuizSessionStore((state) => state.quizState);
  const clearQuizSession = useQuizSessionStore((state) => state.clearQuizSession);
  const setStep = useRoutingStore((state) => state.setStep);

  useEffect(() => {
    const unsubscribe = useQuizSessionStore.persist.onFinishHydration(() => {
      setPersistHydrated(true);
    });
    if (useQuizSessionStore.persist.hasHydrated()) {
      setPersistHydrated(true);
    }
    return unsubscribe;
  }, []);

  const canResumeQuiz = useMemo(
    () => persistHydrated && quizState.questions.length > 0 && !quizState.isFinished,
    [persistHydrated, quizState.isFinished, quizState.questions.length]
  );

  const handleResumeQuiz = () => {
    const state = useQuizSessionStore.getState().quizState;
    setStep(state.startTime != null ? AppStep.QUIZ : AppStep.READY);
  };

  const handleDeleteResumeQuiz = () => {
    const confirmed = window.confirm(t.landing.deleteResumeQuizConfirm);
    if (!confirmed) return;
    clearQuizSession();
  };

  return { canResumeQuiz, handleResumeQuiz, handleDeleteResumeQuiz };
}
