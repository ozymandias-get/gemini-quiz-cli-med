import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import type { FC } from 'react';
import { QuestionStyle, type QuizSettings } from '../../types';
import type { TranslationContent } from '../../constants/translations';
import { styleIcons } from './styleIcons';
import {
  SELECTED_CHOICE,
  UNSELECTED_CHOICE_STYLE_TILE,
  ICON_ON_SELECTED,
} from './configChoiceClasses';
import { configSectionGlassClass } from '../../utils/helpers';

/** Soru tarzı çoklu seçim grid’i. */
export const QuestionStylesBlock: FC<{
  t: TranslationContent;
  settings: QuizSettings;
  toggleQuestionStyle: (style: QuestionStyle) => void;
}> = ({ t, settings, toggleQuestionStyle }) => (
  <div className={`${configSectionGlassClass} p-3 md:p-4 lg:p-3 transition-all`}>
    <div className="flex items-center gap-2 mb-2 lg:mb-2">
      <span className="w-1.5 h-4 bg-sand-400 rounded-full inline-block" />
      <label className="text-[12px] font-extrabold text-stone-700 dark:text-stone-300 uppercase tracking-widest block">
        {t.style}
      </label>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-1.5">
      {Object.values(QuestionStyle).map((style) => {
        const isSelected = settings.style.includes(style);
        const Icon = styleIcons[style] || Target;
        return (
          <motion.button
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            key={style}
            type="button"
            onClick={() => toggleQuestionStyle(style)}
            className={[
              'group relative flex flex-col items-center justify-center gap-2',
              'min-h-[6.5rem] lg:min-h-[4.75rem] w-full rounded-xl lg:rounded-2xl p-2 lg:p-2',
              'transition-all duration-200 ease-out overflow-hidden',
              'focus-visible:outline-none',
              isSelected ? SELECTED_CHOICE : UNSELECTED_CHOICE_STYLE_TILE,
            ].join(' ')}
          >
            <div
              className={[
                'relative flex h-9 w-9 sm:h-10 sm:w-10 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-[1rem] backdrop-blur-sm transition-all duration-200 z-10',
                isSelected
                  ? `bg-white/20 dark:bg-stone-900/10 ${ICON_ON_SELECTED}`
                  : 'bg-gradient-to-br from-white/60 to-white/20 dark:from-white/10 dark:to-transparent text-stone-500 shadow-sm dark:text-stone-400 group-hover:text-sand-600 dark:group-hover:text-sand-400 ring-1 ring-white/40 dark:ring-white/10 backdrop-blur-md',
              ].join(' ')}
            >
              <Icon size={20} strokeWidth={2} />
            </div>
            <span className="relative z-10 text-[11px] sm:text-xs font-bold text-center leading-snug line-clamp-2 px-1">
              {t.styles[style]}
            </span>
          </motion.button>
        );
      })}
    </div>
  </div>
);
