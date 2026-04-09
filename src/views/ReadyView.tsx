import { type FC } from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, HelpCircle, BarChart3, ChevronRight, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { glassCardClass } from '../utils/helpers';
import { useTranslation } from '../hooks/useTranslations';
import { useGenerationStore } from '../store/useGenerationStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { handleStartActiveQuiz } from '../services/appFlows';

export const ReadyView: FC = () => {
  const { t } = useTranslation();
  const fileName = useGenerationStore((s) => s.fileName);
  const settings = useSettingsStore((s) => s.settings);
  const questionCount = useQuizSessionStore((s) => s.quizState.questions.length);
  const onStart = handleStartActiveQuiz;
  const estimatedTime = Math.ceil(questionCount * 1.5);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
      <div className="flex w-full flex-1 flex-col items-center justify-center p-3 py-6 md:py-8">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`${glassCardClass} w-full max-w-xl rounded-[2.5rem] p-6 md:p-12 text-center relative overflow-hidden shadow-2xl`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-sand-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-900 dark:bg-sand-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <Play size={24} className="text-white dark:text-stone-900 ml-1" fill="currentColor" />
            </div>

            <h2 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-3">{t.ready.title}</h2>
            <p className="text-stone-500 text-sm md:text-lg mb-8">{t.ready.subtitle}</p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-50 dark:bg-stone-800 rounded-full text-[11px] font-bold text-stone-500 mb-8 border border-stone-100 dark:border-stone-700 max-w-full">
                <FileText size={12} className="shrink-0" />
                <span className="truncate max-w-[150px]">{fileName || t.demoQuizTitle}</span>
            </div>

            {/* Bilgi Kutucukları: Mobilde 2x2 veya tekli, tablette 3'lü */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mb-8">
                <div className="bg-white/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-700">
                    <HelpCircle size={16} className="text-sand-600 mb-2 mx-auto" />
                    <div className="text-xl font-bold text-stone-800 dark:text-stone-100">{questionCount}</div>
                    <div className="text-[10px] uppercase font-bold text-stone-400">{t.ready.questionCount}</div>
                </div>
                <div className="bg-white/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-700">
                    <Clock size={16} className="text-sand-600 mb-2 mx-auto" />
                    <div className="text-xl font-bold text-stone-800 dark:text-stone-100">{estimatedTime} {t.ready.minutes}</div>
                    <div className="text-[10px] uppercase font-bold text-stone-400">{t.ready.estimatedTime}</div>
                </div>
                <div className="bg-white/50 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-700 col-span-2 md:col-span-1">
                    <BarChart3 size={16} className="text-sand-600 mb-2 mx-auto" />
                    <div className="text-xl font-bold text-stone-800 dark:text-stone-100">{t.diffs[settings.difficulty]}</div>
                    <div className="text-[10px] uppercase font-bold text-stone-400">{t.ready.difficulty}</div>
                </div>
            </div>

            <Button onClick={onStart} fullWidth className="py-5 text-lg rounded-2xl shadow-2xl">
                {t.ready.startBtn} <ChevronRight size={22} />
            </Button>

            <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/50">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-900 dark:text-amber-200 text-left leading-tight">{t.aiDisclaimer}</p>
            </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
};
