import { motion } from 'framer-motion';
import { Brain, Zap, Feather, Rabbit } from 'lucide-react';
import type { FC } from 'react';
import { Difficulty, ModelType, type QuizSettings } from '../../types';
import { getModelDisplayName, type TranslationContent } from '../../constants/translations';
import {
  SELECTED_CHOICE,
  UNSELECTED_CHOICE_TILE,
  UNSELECTED_CHOICE_COUNT,
  ICON_ON_SELECTED,
} from './configChoiceClasses';

/** Model seçimi, zorluk sekmeleri ve soru adedi — ayar store ile bağlı. */
export const ModelDifficultyCountBlock: FC<{
  t: TranslationContent;
  settings: QuizSettings;
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
}> = ({ t, settings, updateSetting }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-2">
    <div className="flex flex-col bg-white/50 dark:bg-white/[0.03] backdrop-blur-md p-3 md:p-4 lg:p-3 rounded-2xl lg:rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div className="flex items-center gap-2 mb-2 lg:mb-2">
        <span className="w-1.5 h-4 bg-sand-400 rounded-full inline-block" />
        <label className="text-[12px] font-extrabold text-stone-700 dark:text-stone-200 uppercase tracking-widest block">
          {t.modelLabel}
        </label>
      </div>
      <div className="grid grid-cols-2 min-[1100px]:grid-cols-4 gap-1.5 lg:gap-1.5 flex-1">
        {[
          { type: ModelType.PRO, icon: <Brain size={18} /> },
          { type: ModelType.FLASH, icon: <Zap size={18} /> },
          { type: ModelType.FLASH_2_5, icon: <Feather size={18} /> },
          { type: ModelType.LITE, icon: <Rabbit size={18} /> },
        ].map((m) => {
          const isSelected = settings.model === m.type;
          return (
            <motion.button
              key={m.type}
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateSetting('model', m.type)}
              className={`relative min-h-[4rem] lg:min-h-[3.25rem] px-1.5 py-2 lg:py-2 rounded-xl lg:rounded-2xl flex flex-col items-center justify-center gap-1 lg:gap-1 transition-all duration-300 overflow-hidden ${
                isSelected ? SELECTED_CHOICE : UNSELECTED_CHOICE_TILE
              }`}
            >
              <span
                className={`relative z-10 transition-colors duration-300 ${isSelected ? `${ICON_ON_SELECTED} drop-shadow-md` : 'text-stone-400'}`}
              >
                {m.icon}
              </span>
              <span
                className={`relative z-10 text-[11px] font-bold leading-tight text-center px-0.5 ${isSelected ? 'tracking-wide' : ''}`}
              >
                {getModelDisplayName(m.type, t)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>

    <div className="flex flex-col gap-3 md:gap-4 lg:gap-2 h-full min-h-0">
      <div className="flex-1 flex flex-col justify-center bg-white/50 dark:bg-white/[0.03] backdrop-blur-md p-3 md:p-4 lg:p-3 rounded-2xl lg:rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[7.5rem] lg:min-h-0 lg:shrink">
        <div className="flex items-center gap-2 mb-2 lg:mb-1.5">
          <span className="w-1.5 h-4 bg-sand-400 rounded-full inline-block" />
          <label className="text-[12px] font-extrabold text-stone-700 dark:text-stone-200 uppercase tracking-widest block">
            {t.difficulty}
          </label>
        </div>
        <div className="relative flex bg-stone-100/80 dark:bg-stone-950/40 p-1.5 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 shadow-inner">
          {Object.values(Difficulty).map((diff) => {
            const isActive = settings.difficulty === diff;
            return (
              <button
                key={diff}
                type="button"
                onClick={() => updateSetting('difficulty', diff)}
                className={`relative flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold uppercase rounded-xl transition-all duration-300 z-10 ${
                  isActive
                    ? 'text-stone-900'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="diffTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-sand-100/90 to-sand-200/80 shadow-[0_2px_10px_rgba(212,197,169,0.25)] ring-1 ring-sand-400/50 dark:from-sand-300/60 dark:to-sand-400/55 dark:shadow-[0_2px_12px_rgba(212,197,169,0.35)] dark:ring-sand-400/55 z-[-1]"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                {t.diffs[diff]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center bg-white/50 dark:bg-white/[0.03] backdrop-blur-md p-3 md:p-4 lg:p-3 rounded-2xl lg:rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[7.5rem] lg:min-h-0 lg:shrink relative overflow-hidden group">
        <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-gradient-to-bl from-sand-200/40 to-transparent dark:from-stone-800/40 rounded-full blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />
        <div className="flex justify-between items-center gap-3 mb-2 lg:mb-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-sand-400 rounded-full inline-block" />
            <label className="text-[12px] font-extrabold text-stone-700 dark:text-stone-200 uppercase tracking-widest shrink-0">
              {t.qCount}
            </label>
          </div>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.questionCount}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                updateSetting('questionCount', Math.max(1, Math.min(100, val)));
              }
            }}
            className="w-16 text-center text-lg font-extrabold text-stone-900 dark:text-white bg-white/70 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 py-1.5 px-2 outline-none focus:ring-2 focus:ring-sand-400 transition-all tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="relative z-10 grid grid-cols-4 sm:grid-cols-7 gap-2">
          {[5, 10, 15, 20, 30, 50, 100].map((count) => (
            <motion.button
              key={count}
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateSetting('questionCount', count)}
              className={`
                                            relative px-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer
                                            ${settings.questionCount === count ? SELECTED_CHOICE : UNSELECTED_CHOICE_COUNT}
                                        `}
            >
              {count}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  </div>
);
