import { type FC } from 'react';
import { motion } from 'framer-motion';
import { isTauri } from '@tauri-apps/api/core';
import { X, Moon, Sun } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants/translations';
import { useTranslation } from '../hooks/useTranslations';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCliStatusStore } from '../store/useCliStatusStore';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const setIsDarkMode = useSettingsStore((s) => s.setIsDarkMode);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const cliStatus = useCliStatusStore((s) => s.cliStatus);
  const cliCheckLoading = useCliStatusStore((s) => s.cliCheckLoading);
  const recheckCliStatus = useCliStatusStore((s) => s.recheckCliStatus);
  const inTauri = typeof window !== 'undefined' && isTauri();
  const showCliWarning = inTauri && cliStatus.isChecked && !cliStatus.isInstalled;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl p-8 rounded-[2rem] max-w-sm w-full shadow-2xl border border-white/50 dark:border-stone-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold font-serif text-stone-800 dark:text-stone-100">{t.settings}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-500 dark:text-stone-400"
          >
            <X size={20} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex justify-between items-center p-4 bg-stone-100/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-2xl mb-6 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all duration-300"
        >
          <span className="font-medium">{t.darkMode}</span>
          <div
            className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'bg-stone-700 text-yellow-400' : 'bg-white text-orange-500 shadow-sm'}`}
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </div>
        </button>

        {showCliWarning && (
          <div className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-4 text-left dark:border-amber-800/50 dark:bg-amber-950/40">
            <p className="text-sm leading-snug text-amber-950 dark:text-amber-100">{t.settingsCliMissing}</p>
            <button
              type="button"
              onClick={() => void recheckCliStatus()}
              disabled={cliCheckLoading}
              className="mt-3 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-800 disabled:opacity-50 dark:text-amber-200 dark:hover:text-amber-50"
            >
              {t.recheckCli}
            </button>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-bold text-stone-400 uppercase tracking-widest pl-2">{t.selectLanguage}</label>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`p-3 rounded-xl border font-medium transition-all duration-300 flex items-center gap-3 ${
                  language === l.code
                    ? 'bg-stone-800 text-white border-stone-800 dark:bg-sand-500 dark:text-stone-900 dark:border-sand-500 shadow-lg scale-[1.02]'
                    : 'bg-white/50 border-stone-200 dark:bg-stone-800/30 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-white dark:hover:bg-stone-800'
                }`}
              >
                <span className="text-lg leading-none">{l.flag}</span>
                <span className="text-sm">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
