import { useState, useEffect, createElement, useMemo, useRef, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch,
  BrainCircuit,
  PenTool,
  Sparkles,
  CheckCircle2,
  CircleSlash,
  ChevronDown,
  Bug,
  Trash2,
} from 'lucide-react';
import { glassCardClass } from '../utils/helpers';
import { getModelDisplayName } from '../constants/translations';
import { useTranslation } from '../hooks/useTranslations';
import { useGenerationStore } from '../store/useGenerationStore';
import { useSettingsStore } from '../store/useSettingsStore';

const stepKeys = ['step1', 'step2', 'step3', 'step4'] as const;

const steps = [
  { icon: FileSearch, key: stepKeys[0], color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { icon: BrainCircuit, key: stepKeys[1], color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { icon: PenTool, key: stepKeys[2], color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { icon: Sparkles, key: stepKeys[3], color: 'text-sand-500', bg: 'bg-sand-100 dark:bg-sand-900/30' },
];

export const GeneratingView: FC = () => {
  const { t, language } = useTranslation();
  const message = useGenerationStore((s) => s.loadingMessage);
  const cancelGeneration = useGenerationStore((s) => s.cancelGeneration);
  const generationLogs = useGenerationStore((s) => s.generationLogs);
  const debugPanelOpen = useGenerationStore((s) => s.debugPanelOpen);
  const autoScrollLogs = useGenerationStore((s) => s.autoScrollLogs);
  const setDebugPanelOpen = useGenerationStore((s) => s.setDebugPanelOpen);
  const setAutoScrollLogs = useGenerationStore((s) => s.setAutoScrollLogs);
  const clearGenerationLogs = useGenerationStore((s) => s.clearGenerationLogs);
  const ensureGenerationLogListener = useGenerationStore((s) => s.ensureGenerationLogListener);
  const model = useSettingsStore((s) => s.settings.model);
  const modelLabel = getModelDisplayName(model, t);
  const generatingPresentation = useGenerationStore((s) => s.generatingPresentation);
  const [activeStep, setActiveStep] = useState(0);
  const [statusNoteIndex, setStatusNoteIndex] = useState(0);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  const rotatingStatusNotes = useMemo(() => {
    const p = generatingPresentation;
    if (!p) return [];
    if (p.mode === 'quiz') {
      const base = t.generation.quizStatusNotes;
      const extra = p.targetQuestionCount > 10 ? t.generation.quizBatchExtraNotes : [];
      return [...base, ...extra];
    }
    if (p.mode === 'flashcards') return t.generation.flashcardStatusNotes;
    return t.generation.remedialStatusNotes;
  }, [generatingPresentation, t]);

  useEffect(() => {
    setStatusNoteIndex(0);
  }, [rotatingStatusNotes]);

  useEffect(() => {
    if (rotatingStatusNotes.length <= 1) return;
    const interval = setInterval(() => {
      setStatusNoteIndex((prev) => (prev + 1) % rotatingStatusNotes.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [rotatingStatusNotes]);

  // Simulate progress through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800); // Change step every 1.8 seconds roughly

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void ensureGenerationLogListener();
  }, [ensureGenerationLogListener]);

  useEffect(() => {
    if (!autoScrollLogs || !debugPanelOpen || !logsContainerRef.current) return;
    logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
  }, [generationLogs, autoScrollLogs, debugPanelOpen]);

  const renderedLogs = useMemo(() => generationLogs.slice(-120), [generationLogs]);

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
                    {message || t.generation[stepKeys[activeStep]]}
                </motion.h3>
             </AnimatePresence>
             {rotatingStatusNotes.length > 0 && (
               <AnimatePresence mode="wait">
                 <motion.p
                   key={statusNoteIndex}
                   initial={{ opacity: 0, y: 6 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -6 }}
                   transition={{ duration: 0.25 }}
                   className="mt-2 min-h-[1.25rem] text-sm leading-snug text-stone-600 dark:text-stone-300"
                 >
                   {rotatingStatusNotes[statusNoteIndex]}
                 </motion.p>
               </AnimatePresence>
             )}
             <p
               className={`text-sm font-medium tracking-wide text-stone-500 dark:text-stone-400 ${
                 rotatingStatusNotes.length > 0 ? 'mt-1.5' : 'mt-2'
               }`}
             >
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

        <div className="z-10 mt-6 w-full max-w-xl">
          <button
            type="button"
            onClick={() => setDebugPanelOpen(!debugPanelOpen)}
            className="flex w-full items-center justify-between rounded-2xl border border-stone-200/80 bg-white/80 px-4 py-3 text-left text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-white dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-200 dark:hover:bg-stone-900"
          >
            <span className="inline-flex items-center gap-2">
              <Bug size={16} className="text-amber-600 dark:text-amber-400" />
              {language === 'tr' ? 'Tam o ekranda neler oluyor?' : "What's happening behind the scenes?"}
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
              {generationLogs.length} log
              <ChevronDown size={16} className={`transition-transform ${debugPanelOpen ? 'rotate-180' : ''}`} />
            </span>
          </button>

          <AnimatePresence initial={false}>
            {debugPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-2xl border border-stone-200/80 bg-stone-50/90 p-3 dark:border-stone-700 dark:bg-stone-900/70">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-xs text-stone-600 dark:text-stone-300">
                      <input
                        type="checkbox"
                        checked={autoScrollLogs}
                        onChange={(event) => setAutoScrollLogs(event.target.checked)}
                        className="h-3.5 w-3.5 rounded border-stone-300 text-sand-600 focus:ring-sand-500"
                      />
                      Auto scroll
                    </label>
                    <button
                      type="button"
                      onClick={() => clearGenerationLogs()}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300 px-2 py-1 text-xs text-stone-600 transition hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
                    >
                      <Trash2 size={12} />
                      Clear
                    </button>
                  </div>

                  <div
                    ref={logsContainerRef}
                    className="max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white/90 p-2 text-xs dark:border-stone-700 dark:bg-stone-950/70"
                  >
                    {renderedLogs.length === 0 ? (
                      <p className="px-2 py-3 text-center text-stone-500 dark:text-stone-400">
                        Henüz teknik log yok.
                      </p>
                    ) : (
                      renderedLogs.map((log, index) => (
                        <div
                          key={`${log.timestamp}-${index}`}
                          className="mb-2 rounded-lg border border-stone-200/70 bg-stone-50 px-2 py-1.5 text-stone-700 last:mb-0 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200"
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="font-semibold">{log.stage}</span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap break-words">{log.message}</p>
                          {log.meta && (
                            <pre className="mt-1 max-h-24 overflow-auto rounded bg-black/80 p-2 text-[10px] text-emerald-200">
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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