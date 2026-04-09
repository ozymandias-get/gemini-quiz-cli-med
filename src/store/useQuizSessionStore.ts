import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { Flashcard, QuizState } from '../types';

export type SlideDirection = -1 | 0 | 1;

interface QuizSessionStoreState {
  quizState: QuizState;
  flashcards: Flashcard[];
  slideDirection: SlideDirection;
}

interface QuizSessionStoreActions {
  setQuizState: (updater: QuizState | ((prev: QuizState) => QuizState)) => void;
  clearQuizSession: () => void;
  setFlashcards: (flashcards: Flashcard[]) => void;
  setSlideDirection: (slideDirection: SlideDirection) => void;
  goToQuestion: (questionIndex: number, slideDirection: SlideDirection) => void;
  toggleUserAnswer: (questionId: string, optionIndex: number) => void;
}

export type QuizSessionStore = QuizSessionStoreState & QuizSessionStoreActions;

const initialQuizState: QuizState = {
  questions: [],
  userAnswers: {},
  currentQuestionIndex: 0,
  score: 0,
  isFinished: false,
};

const PERSIST_NAME = 'quizlab-med-session';
const LEGACY_PERSIST_NAME = 'quizlab-quiz-session';
const QUESTIONS_PERSIST_NAME = `${PERSIST_NAME}-questions`;

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

interface PersistedQuizMeta {
  hasQuestions: boolean;
  userAnswers: PersistedQuizFields['userAnswers'];
  currentQuestionIndex: PersistedQuizFields['currentQuestionIndex'];
  startTime: PersistedQuizFields['startTime'];
}

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

function safeStorageParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const quizSessionStorage: PersistStorage<{ quizState: PersistedQuizFields }> = {
  getItem: (name) => {
    if (typeof localStorage === 'undefined') return null;

    const storedValue = safeStorageParse<
      StorageValue<{ quizState: PersistedQuizFields | PersistedQuizMeta }>
    >(localStorage.getItem(name));

    if (!storedValue?.state?.quizState) return null;

    const storedQuizState = storedValue.state.quizState as Partial<PersistedQuizFields & PersistedQuizMeta>;
    const inlineQuestions = Array.isArray(storedQuizState.questions) ? storedQuizState.questions : null;
    const splitQuestions = storedQuizState.hasQuestions
      ? safeStorageParse<PersistedQuizFields['questions']>(localStorage.getItem(QUESTIONS_PERSIST_NAME)) ?? []
      : [];

    return {
      version: storedValue.version,
      state: {
        quizState: {
          questions: inlineQuestions ?? splitQuestions,
          userAnswers: storedQuizState.userAnswers ?? {},
          currentQuestionIndex: storedQuizState.currentQuestionIndex ?? 0,
          startTime: storedQuizState.startTime,
        },
      },
    };
  },

  setItem: (name, value) => {
    if (typeof localStorage === 'undefined') return;

    const persistedQuizState = value.state.quizState;
    const questions = persistedQuizState.questions ?? [];
    const nextQuestionsJson = JSON.stringify(questions);
    const previousQuestionsJson = localStorage.getItem(QUESTIONS_PERSIST_NAME);

    if (questions.length === 0) {
      localStorage.removeItem(QUESTIONS_PERSIST_NAME);
    } else if (previousQuestionsJson !== nextQuestionsJson) {
      localStorage.setItem(QUESTIONS_PERSIST_NAME, nextQuestionsJson);
    }

    const metaValue: StorageValue<{ quizState: PersistedQuizMeta }> = {
      version: value.version,
      state: {
        quizState: {
          hasQuestions: questions.length > 0,
          userAnswers: persistedQuizState.userAnswers,
          currentQuestionIndex: persistedQuizState.currentQuestionIndex,
          startTime: persistedQuizState.startTime,
        },
      },
    };

    localStorage.setItem(name, JSON.stringify(metaValue));
  },

  removeItem: (name) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(name);
    localStorage.removeItem(QUESTIONS_PERSIST_NAME);
  },
};

export const useQuizSessionStore = create<QuizSessionStore>()(
  persist(
    (set) => ({
      quizState: initialQuizState,
      setQuizState: (updater) =>
        set((state) => ({
          quizState: typeof updater === 'function' ? updater(state.quizState) : updater,
        })),
      clearQuizSession: () => set({ quizState: { ...initialQuizState }, slideDirection: 0 }),
      flashcards: [],
      setFlashcards: (flashcards) => set({ flashcards }),
      slideDirection: 0,
      setSlideDirection: (slideDirection) => set({ slideDirection }),
      goToQuestion: (questionIndex, slideDirection) =>
        set((state) => ({
          slideDirection,
          quizState: {
            ...state.quizState,
            currentQuestionIndex: questionIndex,
          },
        })),
      toggleUserAnswer: (questionId, optionIndex) =>
        set((state) => {
          const currentAnswer = state.quizState.userAnswers[questionId];
          const userAnswers = { ...state.quizState.userAnswers };

          if (currentAnswer === optionIndex) {
            delete userAnswers[questionId];
          } else {
            userAnswers[questionId] = optionIndex;
          }

          return {
            quizState: {
              ...state.quizState,
              userAnswers,
            },
          };
        }),
    }),
    {
      name: PERSIST_NAME,
      version: 1,
      storage: quizSessionStorage,
      partialize: (state) => ({
        quizState: pickPersistedQuizSlice(state.quizState),
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<QuizSessionStore> | null | undefined;
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
