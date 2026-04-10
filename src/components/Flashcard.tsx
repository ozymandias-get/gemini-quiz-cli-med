
import { useState, useEffect, type FC, type MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Flashcard as FlashcardType } from '../types';
import { useTranslation } from '../hooks/useTranslations';

interface FlashcardProps {
  data: FlashcardType;
  onNext?: () => void;
  onPrev?: () => void;
  canNext?: boolean;
  canPrev?: boolean;
}

export const Flashcard: FC<FlashcardProps> = ({ 
    data, onNext, onPrev, canNext = false, canPrev = false 
}) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [data]);

  const handleNav = (e: MouseEvent, action?: () => void) => {
      e.stopPropagation();
      if (action) action();
  };

  // Darker card background for contrast against the new container
  const cardBgClass = "bg-white dark:bg-app-dark-elevated border border-stone-200 dark:border-stone-800 shadow-2xl";

  const renderControls = () => (
      <div className="absolute bottom-16 flex gap-4 z-20" onClick={(e) => e.stopPropagation()}>
        <button 
            onClick={(e) => handleNav(e, onPrev)} 
            disabled={!canPrev}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                canPrev 
                ? 'border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200' 
                : 'border-stone-100 text-stone-300 dark:border-stone-800 dark:text-stone-800 cursor-not-allowed'
            }`}
        >
            <ChevronLeft size={24} />
        </button>
        <button 
            onClick={(e) => handleNav(e, onNext)} 
            disabled={!canNext}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
                canNext
                ? 'border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200' 
                : 'border-stone-100 text-stone-300 dark:border-stone-800 dark:text-stone-800 cursor-not-allowed'
            }`}
        >
            <ChevronRight size={24} />
        </button>
      </div>
  );

  return (
    <div className="relative w-full h-full perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT */}
        <div 
            className={`absolute inset-0 backface-hidden ${cardBgClass} rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center`}
            style={{ backfaceVisibility: 'hidden' }}
        >
             <div className="absolute top-8 left-8 text-xs font-bold uppercase tracking-widest text-stone-400">{t.studyMode.frontSideLabel}</div>
             
             <div className="flex-1 flex items-center justify-center w-full pb-16">
                 <div className="text-3xl md:text-4xl font-serif font-bold text-stone-800 dark:text-stone-100 leading-tight">
                    {data.front}
                 </div>
             </div>
             
             {renderControls()}

             <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600 animate-pulse">
                <RotateCcw size={12} /> {t.studyMode.flipInstruction}
             </div>
        </div>

        {/* BACK */}
        <div 
            className={`absolute inset-0 backface-hidden ${cardBgClass} rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
             <div className="absolute top-8 left-8 text-xs font-bold uppercase tracking-widest text-stone-400">{t.studyMode.backSideLabel}</div>
             
             <div className="flex-1 flex items-center justify-center w-full pb-16 overflow-y-auto scroll-y-pan scrollbar-hide">
                 <div className="text-xl md:text-2xl font-medium leading-relaxed text-stone-700 dark:text-stone-300">
                    {data.back}
                 </div>
             </div>

             {/* Also render controls on back so user can navigate without flipping back */}
             {renderControls()}
             
             <div className="absolute bottom-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600">
                <RotateCcw size={12} /> {t.studyMode.flipInstruction}
             </div>
        </div>
      </motion.div>
    </div>
  );
};
