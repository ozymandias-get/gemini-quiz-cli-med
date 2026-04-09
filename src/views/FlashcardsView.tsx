import { useState, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Flashcard } from '../components/Flashcard';
import { glassCardClass } from '../utils/helpers';
import { useTranslation } from '../hooks/useTranslations';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { navigateToConfig } from '../services/appFlows';

export const FlashcardsView: FC = () => {
  const { t } = useTranslation();
  const flashcards = useQuizSessionStore((s) => s.flashcards);
  const onBack = navigateToConfig;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (flashcards.length === 0) {
    return (
      <div className="max-w-4xl w-full px-4 py-16 text-center">
        <p className="text-stone-600 dark:text-stone-400 mb-6">{t.studyMode.empty}</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sand-600 dark:text-sand-400 font-bold text-sm underline underline-offset-2"
        >
          {t.studyMode.backToConfig}
        </button>
      </div>
    );
  }

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <div className="max-w-4xl w-full px-4 py-8">
      
      <div className={`w-full p-8 md:p-12 rounded-[2.5rem] ${glassCardClass} flex flex-col items-center min-h-[600px] relative overflow-hidden`}>
          
          {/* Header */}
          <div className="w-full flex items-center justify-between mb-8 relative z-10">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors font-bold text-sm"
            >
                <ArrowLeft size={18} /> {t.studyMode.backToConfig}
            </button>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-800 dark:text-stone-100 absolute left-1/2 -translate-x-1/2">
                {t.studyMode.title}
            </h2>
            <div className="text-sm font-mono font-medium text-stone-500 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-lg">
                {currentIndex + 1} / {flashcards.length}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full mb-12 overflow-hidden relative z-10 max-w-2xl">
            <motion.div 
                className="h-full bg-sand-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>

          {/* Card Container */}
          <div className="w-full max-w-md aspect-square relative z-10">
            <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full h-full"
                >
                    <Flashcard 
                        data={flashcards[currentIndex]} 
                        onNext={nextCard}
                        onPrev={prevCard}
                        canNext={currentIndex < flashcards.length - 1}
                        canPrev={currentIndex > 0}
                    />
                </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Background Decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-sand-100/20 to-transparent dark:from-stone-800/20 pointer-events-none rounded-[3rem]" />

      </div>
    </div>
  );
};
