import { useState, useEffect, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Map, ArrowUp } from 'lucide-react';
import { ResultQuestionCard } from '../components/ResultQuestionCard';
import { Confetti } from '../components/Confetti';
import type { Question } from '../types';
import { SourceViewerModal } from '../components/SourceViewerModal';
import { ResultsStats } from '../components/ResultsStats';
import { useTranslation } from '../hooks/useTranslations';
import { useSettingsStore } from '../store/useSettingsStore';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { useGenerationStore } from '../store/useGenerationStore';
import { handleRestart, startRemedialQuiz, handleRegenerate } from '../services/appFlows';

type FilterType = 'ALL' | 'WRONG' | 'EMPTY';

export const ResultsView: FC = () => {
  const { t } = useTranslation();
  const quizState = useQuizSessionStore((s) => s.quizState);
  const settings = useSettingsStore((s) => s.settings);
  const fileName = useGenerationStore((s) => s.fileName);
  const pdfFile = useGenerationStore((s) => s.pdfFile);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalQ = quizState.questions.length;
  const percentage = totalQ > 0 ? Math.round((quizState.score / totalQ) * 100) : 0;

  const scrollToQuestion = (index: number) => {
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getQuestionStatus = (qId: string, correctIndex: number) => {
    const userAnswer = quizState.userAnswers[qId];
    if (userAnswer === undefined) return 'EMPTY';
    if (userAnswer === correctIndex) return 'CORRECT';
    return 'WRONG';
  };
  
  const hasMistakes = quizState.questions.some(q => {
      const status = getQuestionStatus(q.id, q.correctAnswerIndex);
      return status === 'WRONG' || status === 'EMPTY';
  });

  const filteredQuestions = quizState.questions.map((q, idx) => ({ q, idx })).filter(item => {
    const status = getQuestionStatus(item.q.id, item.q.correctAnswerIndex);
    if (filter === 'ALL') return true;
    if (filter === 'WRONG') return status === 'WRONG';
    if (filter === 'EMPTY') return status === 'EMPTY';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 px-4 relative">
      {percentage >= 70 && <Confetti />}
      
      <AnimatePresence>
        {selectedQuestion && pdfFile && (
            <SourceViewerModal 
                file={pdfFile} 
                question={selectedQuestion} 
                onClose={() => setSelectedQuestion(null)}
            />
        )}
      </AnimatePresence>

      <ResultsStats 
        quizState={quizState}
        settings={settings}
        fileName={fileName}
        onRestart={handleRestart}
        onRetryMistakes={startRemedialQuiz}
        onRegenerate={handleRegenerate}
        hasMistakes={hasMistakes}
      />

      {/* Navigation & Filter Bar */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8 md:mb-10"
      >
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 px-2">
            <h3 className="flex items-center gap-2 font-serif text-lg text-stone-600 dark:text-stone-300 mb-4 md:mb-0">
                <Map size={18} className="text-sand-500" /> {t.navTitle}
            </h3>
            
            <div className="flex p-1 bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 w-full md:w-auto overflow-x-auto">
                {(['ALL', 'WRONG', 'EMPTY'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${
                            filter === f 
                            ? 'bg-stone-800 text-white dark:bg-sand-500 dark:text-stone-900 shadow-md' 
                            : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
                        }`}
                    >
                        {f === 'ALL' ? t.filterAll : f === 'WRONG' ? t.filterWrong : t.filterBlank}
                    </button>
                ))}
            </div>
        </div>

        {/* Quick Access Grid */}
        <div className="bg-white/40 dark:bg-stone-900/40 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/50 dark:border-stone-800 shadow-sm flex flex-wrap gap-2 md:gap-3 justify-center md:justify-start">
             {quizState.questions.map((q, idx) => {
                 const status = getQuestionStatus(q.id, q.correctAnswerIndex);
                 const isActive = filter === 'ALL' || (filter === 'WRONG' && status === 'WRONG') || (filter === 'EMPTY' && status === 'EMPTY');
                 
                 return (
                     <motion.button
                        key={idx}
                        layout
                        onClick={() => scrollToQuestion(idx)}
                        disabled={!isActive}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300 relative group
                            ${!isActive ? 'opacity-30 grayscale' : 'opacity-100'}
                            ${status === 'CORRECT' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                                : status === 'WRONG'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                                : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-300 dark:border-stone-700'}
                        `}
                     >
                        {idx + 1}
                        
                        <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white dark:border-stone-900 flex items-center justify-center
                             ${status === 'CORRECT' ? 'bg-emerald-500' : status === 'WRONG' ? 'bg-red-500' : 'bg-stone-400'}
                        `}>
                        </div>
                     </motion.button>
                 )
             })}
             
             {/* Legend */}
             <div className="w-full flex items-center justify-center gap-4 md:gap-6 mt-2 md:mt-4 pt-4 border-t border-stone-100 dark:border-stone-700/50 opacity-60">
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> {t.correct}
                </div>
                 <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> {t.filterWrong}
                </div>
                 <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-400"></div> {t.filterBlank}
                </div>
             </div>
        </div>
      </motion.div>

      {/* Questions List */}
      <div className="space-y-6 md:space-y-8 min-h-[200px]">
        <AnimatePresence initial={false}>
            {filteredQuestions.length > 0 ? (
                filteredQuestions.map(({ q, idx }) => (
                <motion.div 
                    key={q.id}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    id={`question-${idx}`}
                    className="scroll-mt-24 w-full"
                >
                    <ResultQuestionCard 
                    q={q} 
                    idx={idx} 
                    userAnswer={quizState.userAnswers[q.id]} 
                    isCorrect={quizState.userAnswers[q.id] === q.correctAnswerIndex} 
                    onShowSource={pdfFile ? (question) => setSelectedQuestion(question) : undefined}
                    />
                </motion.div>
                ))
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-center py-20 text-stone-400 dark:text-stone-500"
                >
                    <Filter size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">{t.filterNoResults}</p>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showScrollTop && (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToTop}
                className="fixed bottom-8 right-8 z-40 p-4 bg-stone-800 text-white dark:bg-sand-500 dark:text-stone-900 rounded-full shadow-xl hover:shadow-2xl transition-shadow"
            >
                <ArrowUp size={24} />
            </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
