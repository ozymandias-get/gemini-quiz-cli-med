import { useCallback, useMemo, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, Eraser, Clock } from 'lucide-react';
import { Button } from '../components/Button';
import { QuizTimer } from '../components/QuizTimer';
import { formatText } from '../utils/helpers';
import { useTranslation } from '../hooks/useTranslations';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { finishQuiz } from '../services/appFlows';
import {
  selectGoToQuestion,
  selectSlideDirection,
  selectToggleUserAnswer,
} from '../store/selectors/quizSessionSelectors';
import { useQuizKeyboardShortcuts } from '../hooks/useQuizKeyboardShortcuts';

const slideVariants = {
  enter: (direction: -1 | 0 | 1) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: -1 | 0 | 1) => ({
    zIndex: 0,
    x: direction < 0 ? 40 : -40,
    opacity: 0,
    scale: 0.98,
  }),
};

/** Ok tuşları, 1–5 / A–E şık seçimi, son soruda Enter ile bitir — input odaktayken devre dışı. */
export const QuizView: FC = () => {
  const { t } = useTranslation();
  const questions = useQuizSessionStore((state) => state.quizState.questions);
  const currentQuestionIndex = useQuizSessionStore((state) => state.quizState.currentQuestionIndex);
  const userAnswers = useQuizSessionStore((state) => state.quizState.userAnswers);
  const startTime = useQuizSessionStore((state) => state.quizState.startTime);
  const goToQuestion = useQuizSessionStore(selectGoToQuestion);
  const toggleUserAnswer = useQuizSessionStore(selectToggleUserAnswer);
  const slideDirection = useQuizSessionStore(selectSlideDirection);

  useQuizKeyboardShortcuts(finishQuiz);

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-1 min-h-0 flex-col items-center justify-center px-3 py-8 text-center text-stone-600 dark:text-stone-400">
        {t.errors.noQuestions}
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const isFirst = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;
  const selectedAnswer = userAnswers[currentQ.id];
  const answeredCount = useMemo(() => Object.keys(userAnswers).length, [userAnswers]);
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  const formattedQuestionText = useMemo(() => formatText(currentQ.text), [currentQ.text]);
  const formattedOptions = useMemo(() => currentQ.options.map((option) => formatText(option)), [currentQ.options]);

  const handleAnswerToggle = useCallback((optionIndex: number) => {
    toggleUserAnswer(currentQ.id, optionIndex);
  }, [currentQ.id, toggleUserAnswer]);

  const navigateQuestion = useCallback((direction: -1 | 1) => {
    const newIndex = currentQuestionIndex + direction;
    if (newIndex >= 0 && newIndex < questions.length) {
      goToQuestion(newIndex, direction);
    }
  }, [currentQuestionIndex, goToQuestion, questions.length]);

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="w-full max-w-4xl mx-auto flex min-h-0 flex-1 flex-col px-0 min-w-0">
      {/* Top Progress Bar */}
      <div className="mb-2 shrink-0 md:mb-3">
        <div className="flex justify-between items-center rounded-2xl border border-white/60 bg-white/70 p-2.5 shadow-lg shadow-black/5 ring-1 ring-white/40 backdrop-blur-xl dark:border-stone-700/50 dark:bg-stone-900/60 dark:shadow-black/30 dark:ring-white/5 md:p-3">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Question counter pill */}
            <div className="flex items-center gap-2 bg-stone-100/80 dark:bg-stone-800/80 px-3 py-1.5 rounded-xl ring-1 ring-black/5 dark:ring-white/5">
              <span className="text-lg md:text-xl font-extrabold text-stone-900 dark:text-white tabular-nums tracking-tight">
                {currentQuestionIndex + 1}
              </span>
              <span className="text-stone-400 dark:text-stone-500 text-sm font-medium">/</span>
              <span className="text-sm font-bold text-stone-500 dark:text-stone-400 tabular-nums">
                {questions.length}
              </span>
            </div>

            {/* Animated progress bar */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="w-36 md:w-48 h-2 bg-stone-200/80 dark:bg-stone-800 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-sand-400 to-sand-500 rounded-full"
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 tabular-nums whitespace-nowrap">
                {answeredCount}/{questions.length}
              </span>
            </div>
          </div>

          {/* Timer */}
          {startTime != null ? (
            <div className="flex items-center gap-2 bg-stone-100/80 dark:bg-stone-800/60 px-3 py-1.5 rounded-xl ring-1 ring-black/5 dark:ring-white/5">
              <Clock size={14} className="text-sand-500" />
              <QuizTimer startTime={startTime} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Question Card — fills remaining viewport; no page scroll */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={slideDirection}>
            <motion.div 
              key={currentQ.id}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.15 }, scale: { duration: 0.2 } }}
              className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/70 shadow-2xl shadow-black/5 ring-1 ring-white/40 backdrop-blur-xl dark:border-stone-700/50 dark:bg-stone-900/60 dark:shadow-black/40 dark:ring-white/5 md:rounded-[2rem]"
            >
              {/* Question body: only this region scrolls if stem + options exceed space */}
              <div
                className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden [container-type:size]"
              >
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-gutter:stable] md:px-6 md:py-5"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                  
                  {/* Question number badge */}
                  <div className="mb-3 flex items-center gap-2 md:mb-3.5">
                    <span className="inline-block h-4 w-1.5 rounded-full bg-sand-400 md:h-5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400 md:text-[11px]">
                      {t.questionLabel} {currentQuestionIndex + 1}
                    </span>
                  </div>

                  <div className="mb-4 font-serif text-[clamp(0.95rem,2.8cqmin,1.5rem)] font-semibold leading-snug text-stone-900 dark:text-stone-50 md:mb-5 md:leading-relaxed">
                    {formattedQuestionText}
                  </div>
                  
                  <div className="space-y-2 pb-2 md:space-y-2.5 md:pb-3">
                    {currentQ.options.map((opt, idx) => {
                        const isSelected = selectedAnswer === idx;
                        return (
                        <motion.button 
                            key={idx}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={() => handleAnswerToggle(idx)} 
                            className={[
                              'w-full text-left p-3 rounded-xl border transition-all duration-300 flex gap-3 group items-start relative overflow-hidden md:gap-4 md:rounded-2xl md:p-4',
                              isSelected 
                                ? 'bg-sand-100/80 border-sand-400 text-stone-900 shadow-md ring-1 ring-sand-400/50 dark:bg-sand-500/10 dark:border-sand-400 dark:text-stone-100 dark:ring-sand-400/30' 
                                : 'bg-white/50 dark:bg-stone-800/30 border-stone-200/80 dark:border-stone-700/50 hover:bg-white/90 dark:hover:bg-stone-800/60 hover:border-sand-300/80 dark:hover:border-stone-600 hover:shadow-md shadow-sm ring-1 ring-black/[0.03] dark:ring-white/5'
                            ].join(' ')}
                        >
                            {/* Subtle pattern on selected */}
                            {isSelected && (
                              <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                                backgroundSize: '16px 16px'
                              }} />
                            )}

                            <span className={[
                              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold transition-all duration-300 relative z-10 md:h-8 md:w-8 md:rounded-xl md:text-xs',
                              isSelected 
                                ? 'bg-sand-500 text-white dark:bg-sand-400 dark:text-stone-900' 
                                : 'bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-600/50 text-stone-500 dark:text-stone-400 group-hover:bg-sand-50 group-hover:border-sand-300 group-hover:text-sand-600 dark:group-hover:text-sand-400 dark:group-hover:border-sand-500/40'
                            ].join(' ')}>
                              {optionLetters[idx]}
                            </span>
                            <div className={[
                              'flex-1 pt-0.5 text-[13px] leading-snug transition-colors relative z-10 md:text-[15px] md:leading-relaxed md:pt-1',
                              isSelected
                                ? 'font-bold text-stone-900 dark:text-stone-50'
                                : 'text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100'
                            ].join(' ')}>
                              {formattedOptions[idx]}
                            </div>
                        </motion.button>
                        );
                    })}
                  </div>
              </div>
              </div>
              
              {/* Navigation */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-stone-200/50 bg-white/30 p-3 backdrop-blur-sm dark:border-stone-700/40 dark:bg-black/10 md:gap-3 md:px-6 md:py-3.5">
                  <Button 
                    variant="outline" 
                    onClick={() => navigateQuestion(-1)} 
                    disabled={isFirst}
                    className="min-w-[50px] md:min-w-[120px] py-3.5 rounded-xl bg-white/50 dark:bg-stone-800/40 border-stone-200/80 dark:border-stone-700 shadow-sm"
                  >
                    <ChevronLeft size={20} /> <span className="hidden sm:inline">{t.prevBtn}</span>
                  </Button>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => selectedAnswer !== undefined && handleAnswerToggle(selectedAnswer)}
                    disabled={selectedAnswer === undefined}
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
                      selectedAnswer !== undefined 
                        ? 'text-red-500 bg-red-50/80 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 ring-1 ring-red-200/50 dark:ring-red-500/20' 
                        : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    <Eraser size={14} /> <span className="hidden sm:inline">{t.clearSelection}</span>
                  </motion.button>

                  <Button 
                    onClick={() => (isLast ? finishQuiz() : navigateQuestion(1))}
                    className={`flex-1 py-3.5 text-base rounded-xl shadow-lg ${
                      isLast 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white dark:from-emerald-500 dark:to-emerald-400 dark:text-stone-950' 
                        : ''
                    }`}
                    variant="primary"
                  >
                    <span className="font-extrabold tracking-wide">{isLast ? t.finishBtn : t.nextBtn}</span>
                    {isLast ? <CheckCircle size={20} /> : <ChevronRight size={20} />}
                  </Button>
              </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
