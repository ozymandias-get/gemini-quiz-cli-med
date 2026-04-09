import { motion, AnimatePresence } from 'framer-motion';
import { Microscope, Search, ChevronDown } from 'lucide-react';
import type { FC } from 'react';
import type { QuizSettings } from '../../types';
import type { TranslationContent } from '../../constants/translations';
import { SELECTED_CHOICE } from './configChoiceClasses';

/** Odak konusu — accordion + arama alanı. */
export const FocusTopicCollapsible: FC<{
  t: TranslationContent;
  settings: QuizSettings;
  activeSection: string | null;
  toggleSection: (id: string) => void;
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
}> = ({ t, settings, activeSection, toggleSection, updateSetting }) => (
  <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/60 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <button
      type="button"
      onClick={() => toggleSection('focus')}
      className="w-full flex items-center justify-between p-3 lg:p-2.5 text-left transition-colors bg-gradient-to-r hover:from-white/50 hover:to-transparent dark:hover:from-white/[0.02]"
    >
      <div className="flex items-center gap-3 text-stone-700 dark:text-stone-200 min-w-0">
        <div
          className={`p-1.5 lg:p-1.5 rounded-xl transition-colors shrink-0 ${activeSection === 'focus' ? SELECTED_CHOICE : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-sm'}`}
        >
          <Microscope size={17} />
        </div>
        <div>
          <h4 className="font-bold text-[13px] text-stone-800 dark:text-stone-200">{t.focusTopic || 'Odak Konusu'}</h4>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 opacity-80 line-clamp-1">
            {settings.focusTopic || 'Belirli bir alt konuya odaklanın'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800/50">
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 text-stone-500 ${activeSection === 'focus' ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
    <AnimatePresence>
      {activeSection === 'focus' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="p-4 pt-0">
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white/80 dark:bg-black/20 border border-stone-200/80 dark:border-white/5 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-sand-400/50 transition-all">
              <Search size={16} className="text-sand-500 shrink-0" />
              <input
                type="text"
                placeholder={t.focusPlaceholder}
                value={settings.focusTopic}
                onChange={(e) => updateSetting('focusTopic', e.target.value)}
                className="w-full min-w-0 bg-transparent outline-none text-[13px] font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400"
              />
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 px-1 font-medium">{t.focusDesc}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
