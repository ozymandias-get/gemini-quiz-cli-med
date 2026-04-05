

export type LanguageCode = 'tr' | 'en';

export enum Difficulty {
  EASY = 'Kolay',
  MEDIUM = 'Orta',
  HARD = 'Zor'
}

/** Google AI model kodları — bkz. https://ai.google.dev/gemini-api/docs/models (2026) */
export enum ModelType {
  PRO = 'gemini-3.1-pro-preview',
  FLASH = 'gemini-3-flash-preview',
  /** Kararlı 2.5 serisi — yüksek hacim / düşük gecikme */
  FLASH_2_5 = 'gemini-2.5-flash',
  LITE = 'gemini-3.1-flash-lite-preview'
}

export enum QuestionStyle {
  CLASSIC = 'CLASSIC',
  NEGATIVE = 'NEGATIVE',
  STATEMENT = 'STATEMENT',
  ORDERING = 'ORDERING',
  FILL_BLANK = 'FILL_BLANK',
  REASONING = 'REASONING',
  MATCHING = 'MATCHING',
  MIXED = 'MIXED'
}

export interface QuizSettings {
  questionCount: number;
  difficulty: Difficulty;
  model: ModelType;
  style: QuestionStyle[];
  focusTopic?: string;
  exampleText?: string;
  exampleImage?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[]; 
  correctAnswerIndex: number;
  explanation: string;
  sourceQuote?: string; // Kanıt cümlesi (Metinden birebir alıntı)
}

export interface Flashcard {
  id: string;
  front: string; // Terim veya Soru
  back: string;  // Tanım veya Cevap
}

export interface QuizState {
  questions: Question[];
  userAnswers: Record<string, number>;
  currentQuestionIndex: number;
  score: number;
  isFinished: boolean;
  startTime?: number;
  endTime?: number;
}

export enum AppStep {
  LANDING = 'LANDING',
  CONFIG = 'CONFIG',
  GENERATING = 'GENERATING',
  READY = 'READY', // Yeni Adım: Sınav hazır, başla butonu bekleniyor
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  STUDY = 'FLASHCARDS'
}