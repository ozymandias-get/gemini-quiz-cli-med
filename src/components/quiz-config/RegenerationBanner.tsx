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
    className="bg-gradient-to-r from-sand-100 to-amber-50/90 dark:from-sand-900/35 dark:to-amber-950/25 border border-sand-200/80 dark:border-sand-700/45 rounded-2xl p-2.5 lg:p-2 flex gap-2.5 mb-2 lg:mb-2 shrink-0 shadow-inner"
  >
    <div className="p-2 bg-sand-200/90 dark:bg-stone-800/85 rounded-xl text-sand-800 dark:text-sand-400 shrink-0 h-fit shadow-sm">
      <RefreshCw size={16} className="animate-spin-slow" />
    </div>
    <div className="min-w-0">
      <h4 className="text-xs font-bold text-stone-900 dark:text-sand-200 mb-0.5">{t.regenerateActive}</h4>
      <p className="text-[11px] text-stone-700/95 dark:text-stone-300/90 leading-relaxed font-medium">{t.regenerateActiveDesc}</p>
    </div>
  </motion.div>
);
