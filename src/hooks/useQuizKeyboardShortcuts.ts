import { useEffect } from 'react';
import { useQuizSessionStore } from '../store/useQuizSessionStore';

function isTypingInField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') return true;
  return target.isContentEditable;
}

export function useQuizKeyboardShortcuts(onFinishQuiz: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingInField(event.target)) return;
      const { quizState, goToQuestion, toggleUserAnswer } = useQuizSessionStore.getState();
      if (quizState.questions.length === 0) return;

      const questionIndex = quizState.currentQuestionIndex;
      const currentQuestion = quizState.questions[questionIndex];
      const totalQuestions = quizState.questions.length;
      const isLastQuestion = questionIndex === totalQuestions - 1;
      const optionCount = currentQuestion.options.length;

      if (event.key === 'ArrowLeft') {
        const nextIndex = questionIndex - 1;
        if (nextIndex >= 0) {
          event.preventDefault();
          goToQuestion(nextIndex, -1);
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        const nextIndex = questionIndex + 1;
        if (nextIndex < totalQuestions) {
          event.preventDefault();
          goToQuestion(nextIndex, 1);
        }
        return;
      }

      if (event.key === 'Enter' && isLastQuestion) {
        event.preventDefault();
        onFinishQuiz();
        return;
      }

      let optionIndex: number | null = null;
      if (/^[1-5]$/.test(event.key)) {
        optionIndex = parseInt(event.key, 10) - 1;
      } else {
        const lowerKey = event.key.toLowerCase();
        if (lowerKey >= 'a' && lowerKey <= 'e') {
          optionIndex = lowerKey.charCodeAt(0) - 'a'.charCodeAt(0);
        }
      }

      if (optionIndex !== null && optionIndex >= 0 && optionIndex < optionCount) {
        event.preventDefault();
        toggleUserAnswer(currentQuestion.id, optionIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFinishQuiz]);
}
