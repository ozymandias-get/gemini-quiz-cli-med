import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import type { FC } from 'react';
import type { TranslationContent } from '../../constants/translations';

/** Yeniden üretim modunda üst bilgi şeridi. */
export const RegenerationBanner: FC<{ t: Pick<TranslationContent, 'regenerateActive' | 'regenerateActiveDesc'> }> = ({
  t,
}) => (
  <motion.div
    initial={{ height: 0, opacity: 0, scale: 0.95 }}
    animate={{ height: 'auto', opacity: 1, scale: 1 }}
    exit={{ height: 0, opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl p-2.5 lg:p-2 flex gap-2.5 mb-2 lg:mb-2 shrink-0 shadow-inner"
  >
    <div className="p-2 bg-indigo-100/80 dark:bg-indigo-800/80 rounded-xl text-indigo-600 dark:text-indigo-300 shrink-0 h-fit shadow-sm">
      <RefreshCw size={16} className="animate-spin-slow" />
    </div>
    <div className="min-w-0">
      <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-0.5">{t.regenerateActive}</h4>
      <p className="text-[11px] text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed font-medium">{t.regenerateActiveDesc}</p>
    </div>
  </motion.div>
);
