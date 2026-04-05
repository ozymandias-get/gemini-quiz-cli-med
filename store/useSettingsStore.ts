import { create } from 'zustand';
import {
  Difficulty,
  ModelType,
  QuestionStyle,
  type LanguageCode,
  type QuizSettings,
} from '../types';
import { extractTextFromPDF } from '../services/pdfService';

const LANGUAGE_STORAGE_KEY = 'quizlab-language';

function readStoredLanguage(): LanguageCode {
  try {
    const s = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (s === 'en' || s === 'tr') return s;
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
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) resolve(event.target.result as string);
      else reject(new Error('No result'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

interface SettingsState {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  settings: QuizSettings;
  setSettings: (u: QuizSettings | ((prev: QuizSettings) => QuizSettings)) => void;
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
  toggleQuestionStyle: (style: QuestionStyle) => void;
  uploadExampleReference: (file: File) => Promise<void>;
  clearExampleReference: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
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
  setSettings: (u) =>
    set((state) => ({
      settings: typeof u === 'function' ? u(state.settings) : u,
    })),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    })),
  toggleQuestionStyle: (style) =>
    set((state) => {
      const s = state.settings;
      const isSelected = s.style.includes(style);
      let newStyles =
        style === QuestionStyle.MIXED ? [QuestionStyle.MIXED] : s.style.filter((x) => x !== QuestionStyle.MIXED);
      if (isSelected) {
        newStyles = newStyles.filter((x) => x !== style);
        if (newStyles.length === 0) newStyles = [QuestionStyle.MIXED];
      } else {
        newStyles.push(style);
      }
      return { settings: { ...s, style: newStyles } };
    }),
  uploadExampleReference: async (file) => {
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        const truncatedText = text.slice(0, 5000);
        set((state) => ({
          settings: { ...state.settings, exampleText: truncatedText, exampleImage: undefined },
        }));
      } else if (file.type.startsWith('image/')) {
        const dataUrl = await readFileAsDataURL(file);
        set((state) => ({
          settings: { ...state.settings, exampleImage: dataUrl, exampleText: undefined },
        }));
      }
    } catch (error) {
      console.error('Error reading example file:', error);
    }
  },
  clearExampleReference: () =>
    set((state) => ({
      settings: { ...state.settings, exampleText: undefined, exampleImage: undefined },
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
