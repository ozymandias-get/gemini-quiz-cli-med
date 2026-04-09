import { useState, useEffect, createElement, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, BrainCircuit, PenTool, Sparkles, CheckCircle2, CircleSlash } from 'lucide-react';
import { glassCardClass } from '../utils/helpers';
import { getModelDisplayName } from '../constants/translations';
import { useTranslation } from '../hooks/useTranslations';
import { useGenerationStore } from '../store/useGenerationStore';
import { useSettingsStore } from '../store/useSettingsStore';

const steps = [
  { icon: FileSearch, key: 'step1', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { icon: BrainCircuit, key: 'step2', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { icon: PenTool, key: 'step3', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { icon: Sparkles, key: 'step4', color: 'text-sand-500', bg: 'bg-sand-100 dark:bg-sand-900/30' },
];

export const GeneratingView: FC = () => {
  const { t } = useTranslation();
  const message = useGenerationStore((s) => s.loadingMessage);
  const cancelGeneration = useGenerationStore((s) => s.cancelGeneration);
  const model = useSettingsStore((s) => s.settings.model);
  const modelLabel = getModelDisplayName(model, t);
  const [activeStep, setActiveStep] = useState(0);

  // Simulate progress through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800); // Change step every 1.8 seconds roughly

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full min-w-0 max-w-2xl flex-1 flex-col justify-center overflow-y-auto overscroll-contain px-2 py-4 [scrollbar-gutter:stable] md:px-4 md:py-6">
      <div className={`relative flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden ${glassCardClass} rounded-[2rem] p-6 md:rounded-[3rem] md:p-10 lg:p-12`}>
        
        {/* Statik blur — sürekli motion layout WebView’da pahalı; donma hissini azaltır */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sand-200/40 dark:bg-sand-900/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-stone-200/40 dark:bg-stone-800/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Central Animation Icon */}
        <div className="relative mb-12 z-10">
            <motion.div 
                className="w-24 h-24 bg-white dark:bg-stone-800 rounded-3xl shadow-xl flex items-center justify-center relative z-10"
                animate={{ rotate: activeStep % 2 === 0 ? 4 : -4 }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className={`${steps[activeStep].color}`}
                    >
                        {createElement(steps[activeStep].icon, { size: 48 })}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>

        {/* Status Text — sabit h-16 kaldırıldı; uzun batch mesajları ve İptal için alan */}
        <div className="z-10 mb-8 w-full max-w-lg text-center md:mb-10">
             <AnimatePresence mode="wait">
                <motion.h3 
                    key={activeStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xl font-serif font-bold leading-snug text-stone-800 sm:text-2xl dark:text-stone-100"
                >
                    {message || t.generation[steps[activeStep].key]}
                </motion.h3>
             </AnimatePresence>
             <p className="mt-2 text-sm font-medium tracking-wide text-stone-500 dark:text-stone-400">
                 {modelLabel} · {t.generation.processing}
             </p>
        </div>

        {/* Step Indicators */}
        <div className="z-10 w-full max-w-sm space-y-4">
             {steps.map((step, index) => {
                 const isActive = index === activeStep;
                 const isCompleted = index < activeStep;
                 const Icon = step.icon;

                 return (
                     <div key={index} className="flex items-center gap-4">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${
                             isCompleted ? 'bg-emerald-500 text-white' : 
                             isActive ? step.bg + ' ' + step.color : 
                             'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600'
                         }`}>
                             {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                         </div>
                         <div className="flex-1 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                             <motion.div 
                                className="h-full bg-sand-500"
                                initial={{ width: "0%" }}
                                animate={{ width: isCompleted ? "100%" : isActive ? "60%" : "0%" }}
                                transition={{ duration: 0.5 }}
                             />
                         </div>
                     </div>
                 )
             })}
        </div>

        {/* İptal: ilerleme listesinin altında, kart içinde ikincil eylem */}
        <div className="z-10 mt-8 flex w-full max-w-sm justify-center md:mt-10">
          <button
            type="button"
            onClick={() => cancelGeneration()}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-[0.99] dark:border-stone-600 dark:bg-stone-800/90 dark:text-stone-200 dark:hover:bg-stone-700/90 sm:w-auto sm:min-w-[12rem]"
          >
            <CircleSlash size={18} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            {t.generation.cancel}
          </button>
        </div>

      </div>
    </div>
  );
};