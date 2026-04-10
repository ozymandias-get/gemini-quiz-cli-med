export type LanguageCode = 'tr' | 'en';

export enum Difficulty {
  EASY = 'Kolay',
  MEDIUM = 'Orta',
  HARD = 'Zor',
}

/** Google AI model kodlari — bkz. https://ai.google.dev/gemini-api/docs/models (2026) */
export enum ModelType {
  PRO = 'gemini-3.1-pro-preview',
  FLASH = 'gemini-3-flash-preview',
  /** Kararli 2.5 serisi — yuksek hacim / dusuk gecikme */
  FLASH_2_5 = 'gemini-2.5-flash',
  LITE = 'gemini-3.1-flash-lite-preview',
}

export enum QuestionStyle {
  CLASSIC = 'CLASSIC',
  NEGATIVE = 'NEGATIVE',
  STATEMENT = 'STATEMENT',
  ORDERING = 'ORDERING',
  FILL_BLANK = 'FILL_BLANK',
  REASONING = 'REASONING',
  MATCHING = 'MATCHING',
  MIXED = 'MIXED',
}

export interface QuizSettings {
  questionCount: number;
  difficulty: Difficulty;
  model: ModelType;
  style: QuestionStyle[];
  focusTopic?: string;
  exampleText?: string;
  exampleImage?: string;
  pdfExtraction: PdfExtractionOptions;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  sourceQuote?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
  charCount: number;
}

export interface OpenDataLoaderElement {
  id?: string | number;
  type: string;
  pageNumber?: number;
  content?: string;
  description?: string;
  boundingBox?: number[];
  headingLevel?: number;
  raw: Record<string, unknown>;
}

export interface PreparedDocumentPage {
  pageNumber: number;
  markdown: string;
  text: string;
  searchText: string;
  elementCount: number;
}

export interface PdfHybridServerConfig {
  port: number;
  forceOcr: boolean;
  ocrLang: string;
  enrichFormula: boolean;
  enrichPictureDescription: boolean;
}

export interface PdfExtractionOptions {
  sanitize: boolean;
  keepLineBreaks: boolean;
  useStructTree: boolean;
  includeHeaderFooter: boolean;
  detectStrikethrough: boolean;
  tableMethod: 'default' | 'cluster';
  readingOrder: 'xycut' | 'off';
  imageOutput: 'off' | 'external' | 'embedded';
  imageFormat: 'png' | 'jpeg';
  pages: string;
  hybrid: 'off' | 'docling-fast';
  hybridMode: 'auto' | 'full';
  hybridTimeout: string;
  hybridFallback: boolean;
  hybridUrl?: string;
  outputHtml: boolean;
  outputAnnotatedPdf: boolean;
  hybridServer: PdfHybridServerConfig;
}

export interface PdfArtifact {
  kind: string;
  path: string;
}

export interface PdfRuntimeStatus {
  isChecked: boolean;
  javaReady: boolean;
  javaVersion: string | null;
  javaPath: string | null;
  pythonFound: boolean;
  pythonVersion: string | null;
  pythonPath: string | null;
  runtimeBootstrapped: boolean;
  cliReady: boolean;
  hybridStatus: 'stopped' | 'starting' | 'healthy' | 'failed';
  hybridUrl: string | null;
  statusMessage: string | null;
}

export type GenerationLogLevel = 'info' | 'success' | 'warning' | 'error';

export interface GenerationLogEntry {
  stage: string;
  message: string;
  level: GenerationLogLevel;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export interface PreparedDocumentChunk {
  id: string;
  pageStart: number;
  pageEnd: number;
  text: string;
  charCount: number;
}

export interface PreparedDocument {
  pages: ExtractedPdfPage[];
  markdown: string;
  plainText: string;
  elements: OpenDataLoaderElement[];
  pageMap: PreparedDocumentPage[];
  artifacts: PdfArtifact[];
  sourceMode: 'local' | 'hybrid';
  extractionOptions: PdfExtractionOptions;
  chunks: PreparedDocumentChunk[];
  fullText: string;
  totalChars: number;
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
  PDF_EXTRACTION_HELP = 'PDF_EXTRACTION_HELP',
  GENERATING = 'GENERATING',
  READY = 'READY',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  STUDY = 'FLASHCARDS',
}

/** Üretim ekranında dönen notlar için bağlam (GeneratingView). */
export type GeneratingPresentation =
  | { mode: 'quiz'; targetQuestionCount: number; batchCount: number }
  | { mode: 'flashcards' }
  | { mode: 'remedial'; approximateCount: number };
