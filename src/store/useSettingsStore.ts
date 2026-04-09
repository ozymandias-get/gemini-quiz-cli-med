import { create } from 'zustand';
import {
  Difficulty,
  ModelType,
  QuestionStyle,
  type PdfExtractionOptions,
  type LanguageCode,
  type QuizSettings,
} from '../types';
import { extractTextFromPDF } from '../services/pdfService';

const LANGUAGE_STORAGE_KEY = 'quizlab-language';

function readStoredLanguage(): LanguageCode {
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLanguage === 'en' || storedLanguage === 'tr') return storedLanguage;
  } catch {
    /* ignore */
  }
  return 'tr';
}

function readStoredDarkMode(): boolean {
  try {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? savedMode === 'true' : true;
  } catch {
    return true;
  }
}

const defaultSettings: QuizSettings = {
  questionCount: 5,
  difficulty: Difficulty.MEDIUM,
  model: ModelType.FLASH,
  style: [QuestionStyle.MIXED],
  focusTopic: '',
  exampleText: '',
  exampleImage: undefined,
  pdfExtraction: {
    sanitize: false,
    keepLineBreaks: false,
    useStructTree: true,
    includeHeaderFooter: false,
    detectStrikethrough: false,
    tableMethod: 'default',
    readingOrder: 'xycut',
    imageOutput: 'off',
    imageFormat: 'png',
    pages: '',
    hybrid: 'off',
    hybridMode: 'auto',
    hybridTimeout: '15000',
    hybridFallback: false,
    hybridUrl: '',
    outputHtml: false,
    outputAnnotatedPdf: false,
    hybridServer: {
      port: 5002,
      forceOcr: false,
      ocrLang: 'en',
      enrichFormula: false,
      enrichPictureDescription: false,
    },
  } satisfies PdfExtractionOptions,
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('No result'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

interface SettingsStoreState {
  language: LanguageCode;
  settings: QuizSettings;
  isDarkMode: boolean;
}

interface SettingsStoreActions {
  setLanguage: (language: LanguageCode) => void;
  setSettings: (updater: QuizSettings | ((prev: QuizSettings) => QuizSettings)) => void;
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
  toggleQuestionStyle: (style: QuestionStyle) => void;
  uploadExampleReference: (file: File) => Promise<void>;
  clearExampleReference: () => void;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  language: readStoredLanguage(),
  setLanguage: (language) => {
    set({ language });
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  },
  settings: defaultSettings,
  setSettings: (updater) =>
    set((state) => ({
      settings: typeof updater === 'function' ? updater(state.settings) : updater,
    })),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
  toggleQuestionStyle: (style) =>
    set((state) => {
      const currentSettings = state.settings;
      const isSelected = currentSettings.style.includes(style);
      let nextStyles =
        style === QuestionStyle.MIXED
          ? [QuestionStyle.MIXED]
          : currentSettings.style.filter((value) => value !== QuestionStyle.MIXED);

      if (isSelected) {
        nextStyles = nextStyles.filter((value) => value !== style);
        if (nextStyles.length === 0) nextStyles = [QuestionStyle.MIXED];
      } else {
        nextStyles.push(style);
      }

      return {
        settings: { ...currentSettings, style: nextStyles },
      };
    }),
  uploadExampleReference: async (file) => {
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file, get().settings.pdfExtraction);
        set((state) => ({
          settings: {
            ...state.settings,
            exampleText: text.slice(0, 5000),
            exampleImage: undefined,
          },
        }));
      } else if (file.type.startsWith('image/')) {
        const dataUrl = await readFileAsDataURL(file);
        set((state) => ({
          settings: {
            ...state.settings,
            exampleImage: dataUrl,
            exampleText: undefined,
          },
        }));
      }
    } catch {
      /* ignore unsupported or unreadable files */
    }
  },
  clearExampleReference: () =>
    set((state) => ({
      settings: {
        ...state.settings,
        exampleText: undefined,
        exampleImage: undefined,
      },
    })),
  isDarkMode: readStoredDarkMode(),
  setIsDarkMode: (isDarkMode) => {
    set({ isDarkMode });
    try {
      localStorage.setItem('darkMode', isDarkMode.toString());
    } catch {
      /* ignore */
    }
  },
}));
