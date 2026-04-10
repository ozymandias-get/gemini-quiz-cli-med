import type {
  AppStep,
  Flashcard,
  GenerationLogEntry,
  GeneratingPresentation,
  LanguageCode,
  PreparedDocument,
  Question,
  QuizSettings,
} from '../../../types';

export interface GenerationFlowContext {
  language: LanguageCode;
  settings: QuizSettings;
  pdfText: string;
  preparedDocument: PreparedDocument | null;
  usedQuestions: Question[];
}

export interface GenerationFlowActions {
  setStep: (step: AppStep) => void;
  setLoadingMessage: (message: string) => void;
  setGeneratingPresentation: (presentation: GeneratingPresentation | null) => void;
  setGenerationInProgress: (value: boolean) => void;
  setGenerationAbortController: (controller: AbortController | null) => void;
  setQuizQuestions: (questions: Question[]) => void;
  setFlashcards: (flashcards: Flashcard[]) => void;
  setUsedQuestions: (updater: Question[] | ((prev: Question[]) => Question[])) => void;
  addGenerationLog: (entry: GenerationLogEntry) => void;
  clearGenerationLogs: () => void;
}

export function hasRequiredInput(context: GenerationFlowContext): boolean {
  if (context.pdfText === 'DEMO') return true;
  return Boolean(context.preparedDocument && context.pdfText.trim().length > 0);
}
