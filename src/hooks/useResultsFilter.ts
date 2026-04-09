import { useMemo } from 'react';
import type { QuizState } from '../types';

export type ResultsFilterType = 'ALL' | 'WRONG' | 'EMPTY';
export type QuestionStatus = 'CORRECT' | 'WRONG' | 'EMPTY';

export function getQuestionStatus(quizState: QuizState, questionId: string, correctAnswerIndex: number): QuestionStatus {
  const userAnswer = quizState.userAnswers[questionId];
  if (userAnswer === undefined) return 'EMPTY';
  if (userAnswer === correctAnswerIndex) return 'CORRECT';
  return 'WRONG';
}

export function useResultsFilter(quizState: QuizState, filter: ResultsFilterType) {
  const hasMistakes = useMemo(
    () =>
      quizState.questions.some((question) => {
        const status = getQuestionStatus(quizState, question.id, question.correctAnswerIndex);
        return status === 'WRONG' || status === 'EMPTY';
      }),
    [quizState]
  );

  const filteredQuestions = useMemo(
    () =>
      quizState.questions
        .map((question, index) => ({ question, index }))
        .filter(({ question }) => {
          const status = getQuestionStatus(quizState, question.id, question.correctAnswerIndex);
          if (filter === 'ALL') return true;
          if (filter === 'WRONG') return status === 'WRONG';
          return status === 'EMPTY';
        }),
    [filter, quizState]
  );

  return { hasMistakes, filteredQuestions };
}
