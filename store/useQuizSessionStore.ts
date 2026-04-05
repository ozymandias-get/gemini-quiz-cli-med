import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Flashcard, QuizState } from '../types';

interface QuizSessionState {
  quizState: QuizState;
  setQuizState: (u: QuizState | ((prev: QuizState) => QuizState)) => void;
  flashcards: Flashcard[];
  setFlashcards: (cards: Flashcard[]) => void;
  slideDirection: number;
  setSlideDirection: (dir: number) => void;
}

const initialQuizState: QuizState = {
  questions: [],
  userAnswers: {},
  currentQuestionIndex: 0,
  score: 0,
  isFinished: false,
};

const PERSIST_NAME = 'quizlab-med-session';
const LEGACY_PERSIST_NAME = 'quizlab-quiz-session';

/** Eski localStorage anahtarından bir kez taşıma (Aşama 6). */
function migrateLegacyQuizSessionKey(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(PERSIST_NAME)) return;
    const legacy = localStorage.getItem(LEGACY_PERSIST_NAME);
    if (!legacy) return;
    localStorage.setItem(PERSIST_NAME, legacy);
    localStorage.removeItem(LEGACY_PERSIST_NAME);
  } catch {
    /* quota / gizli mod */
  }
}

migrateLegacyQuizSessionKey();

type PersistedQuizFields = Pick<
  QuizState,
  'questions' | 'userAnswers' | 'currentQuestionIndex' | 'startTime'
>;

function emptyPersistedQuizSlice(): PersistedQuizFields {
  return {
    questions: [],
    userAnswers: {},
    currentQuestionIndex: 0,
    startTime: undefined,
  };
}

function pickPersistedQuizSlice(q: QuizState): PersistedQuizFields {
  if (q.isFinished || q.questions.length === 0) {
    return emptyPersistedQuizSlice();
  }
  return {
    questions: q.questions,
    userAnswers: q.userAnswers,
    currentQuestionIndex: q.currentQuestionIndex,
    startTime: q.startTime,
  };
}

function buildQuizStateFromPersisted(pq: Partial<QuizState>): QuizState {
  const questions = pq.questions ?? [];
  if (questions.length === 0) {
    return { ...initialQuizState };
  }
  return {
    questions,
    userAnswers: pq.userAnswers ?? {},
    currentQuestionIndex: pq.currentQuestionIndex ?? 0,
    startTime: pq.startTime,
    score: 0,
    isFinished: false,
    endTime: undefined,
  };
}

export const useQuizSessionStore = create<QuizSessionState>()(
  persist(
    (set) => ({
      quizState: initialQuizState,
      setQuizState: (u) =>
        set((state) => ({
          quizState: typeof u === 'function' ? u(state.quizState) : u,
        })),
      flashcards: [],
      setFlashcards: (flashcards) => set({ flashcards }),
      slideDirection: 0,
      setSlideDirection: (slideDirection) => set({ slideDirection }),
    }),
    {
      name: PERSIST_NAME,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        quizState: pickPersistedQuizSlice(state.quizState),
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<QuizSessionState> | null | undefined;
        if (!p?.quizState) {
          return currentState;
        }
        return {
          ...currentState,
          quizState: buildQuizStateFromPersisted(p.quizState),
        };
      },
    }
  )
);
