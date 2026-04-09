import type { QuizSessionStore } from '../useQuizSessionStore';

export const selectQuizState = (state: QuizSessionStore) => state.quizState;
export const selectSetQuizState = (state: QuizSessionStore) => state.setQuizState;
export const selectSlideDirection = (state: QuizSessionStore) => state.slideDirection;
export const selectSetSlideDirection = (state: QuizSessionStore) => state.setSlideDirection;
export const selectFlashcards = (state: QuizSessionStore) => state.flashcards;
export const selectGoToQuestion = (state: QuizSessionStore) => state.goToQuestion;
export const selectToggleUserAnswer = (state: QuizSessionStore) => state.toggleUserAnswer;
