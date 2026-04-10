import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { FC, ReactNode } from 'react';
import { SELECTED_CHOICE, UNSELECTED_CHOICE_TILE } from './configChoiceClasses';
import { configInputGlassClass, configSectionGlassClass } from '../../utils/helpers';

const OUTER_SHADOW = 'shadow-sm hover:shadow-[0_10px_24px_-18px_rgba(15,23,42,0.32)] transition-shadow';

const DEFAULT_TOGGLE_CLASS =
  'w-full flex items-center justify-between p-3 lg:p-2.5 text-left transition-colors bg-gradient-to-r from-white/14 to-transparent hover:from-white/35 dark:from-white/[0.01] dark:hover:from-white/[0.04]';

const COLLAPSE_MOTION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25, ease: 'easeInOut' as const },
};

export const ConfigCollapsibleShell: FC<{
  isOpen: boolean;
  onToggle: () => void;
  icon: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
  /** Üst satırda toggle’dan sonra (ör. PDF yardım düğmesi) */
  headerTrailing?: ReactNode;
  /** `headerTrailing` kullanılıyorsa dış satır; örn. `flex w-full items-center gap-2 p-3 lg:p-2.5` */
  headerRowClassName?: string;
  /** Varsayılan tam genişlik toggle; PDF için `min-w-0 flex-1 flex ...` */
  toggleButtonClassName?: string;
  selectedTileClass?: string;
  unselectedTileClass?: string;
}> = ({
  isOpen,
  onToggle,
  icon,
  title,
  subtitle,
  children,
  headerTrailing,
  headerRowClassName,
  toggleButtonClassName = DEFAULT_TOGGLE_CLASS,
  selectedTileClass = SELECTED_CHOICE,
  unselectedTileClass = UNSELECTED_CHOICE_TILE,
}) => {
  const toggleButton = (
    <button type="button" onClick={onToggle} className={toggleButtonClassName}>
      <div className="flex items-center gap-3 text-stone-700 dark:text-stone-200 min-w-0">
        <div
          className={`p-1.5 lg:p-1.5 rounded-xl transition-colors shrink-0 ${isOpen ? selectedTileClass : unselectedTileClass}`}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-[13px] text-stone-800 dark:text-stone-200">{title}</h4>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 opacity-80 line-clamp-1">{subtitle}</p>
        </div>
      </div>
      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${configInputGlassClass}`}>
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 text-stone-500 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
  );

  return (
    <div className={`${configSectionGlassClass} overflow-hidden ${OUTER_SHADOW}`}>
      {headerRowClassName ? (
        <div className={headerRowClassName}>
          {toggleButton}
          {headerTrailing}
        </div>
      ) : (
        toggleButton
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div {...COLLAPSE_MOTION} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
