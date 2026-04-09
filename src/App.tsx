
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, FlaskConical } from 'lucide-react';
import { AppStep } from './types';
import { GeneratingView } from './views/GeneratingView';
import { ReadyView } from './views/ReadyView';
import { Background } from './components/Background';
import { SettingsModal } from './components/SettingsModal';
import { LandingView } from './views/LandingView';
import { ConfigView } from './views/ConfigView';
import { QuizView } from './views/QuizView';
import { ResultsView } from './views/ResultsView';
import { FlashcardsView } from './views/FlashcardsView';
import { Toaster } from 'sonner';
import { useRoutingStore } from './store/useRoutingStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useCliStatusStore } from './store/useCliStatusStore';
import { usePdfRuntimeStore } from './store/usePdfRuntimeStore';
import { useTranslation } from './hooks/useTranslations';
import { navigateToLanding } from './services/appFlows';
import { useDarkModeClass } from './hooks/useDarkModeClass';
import { useAppCloseGuard } from './hooks/useAppCloseGuard';
import { useViewportLock } from './hooks/useViewportLock';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const step = useRoutingStore((s) => s.step);
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  const cliChecked = useCliStatusStore((s) => s.cliStatus.isChecked);
  const checkCliStatus = useCliStatusStore((s) => s.checkCliStatus);
  const pdfRuntimeChecked = usePdfRuntimeStore((s) => s.status.isChecked);
  const checkPdfRuntimeStatus = usePdfRuntimeStore((s) => s.checkStatus);
  const { t } = useTranslation();

  useEffect(() => {
    if (cliChecked) return;
    void checkCliStatus();
  }, [cliChecked, checkCliStatus]);

  useEffect(() => {
    if (pdfRuntimeChecked) return;
    void checkPdfRuntimeStatus();
  }, [pdfRuntimeChecked, checkPdfRuntimeStatus]);

  useDarkModeClass(isDarkMode);
  useAppCloseGuard();

  /** Tek ekran yüksekliği: gövde kaydırması yok; içerik taşarsa main/view içinde kayar (READY→QUIZ geçişinde alt flaş / şerit önlenir). */
  const lockViewport =
    step === AppStep.CONFIG ||
    step === AppStep.QUIZ ||
    step === AppStep.READY ||
    step === AppStep.GENERATING;

  useViewportLock(lockViewport);

  return (
    <div
      className={
        lockViewport
          ? 'h-[100dvh] max-h-[100dvh] min-h-0 flex flex-col relative overflow-x-hidden overflow-y-hidden bg-cream-50 dark:bg-[#171412] selection:bg-sand-300 selection:text-stone-900 dark:selection:bg-sand-500/30 dark:selection:text-stone-100'
          : 'min-h-[100dvh] flex flex-col relative overflow-x-hidden bg-cream-50 dark:bg-[#171412] selection:bg-sand-300 selection:text-stone-900 dark:selection:bg-sand-500/30 dark:selection:text-stone-100'
      }
    >
      <Background />
      <Toaster
        theme={isDarkMode ? 'dark' : 'light'}
        position="top-right"
        toastOptions={{ duration: 4000 }}
        closeButton
      />
      <header
        className={
          step === AppStep.GENERATING
            ? 'shrink-0 z-50 w-full border-b border-stone-200/70 bg-cream-50/95 backdrop-blur-md dark:border-stone-700/50 dark:bg-[#171412]/95'
            : 'shrink-0 relative z-50 w-full max-w-7xl mx-auto'
        }
      >
        <div
          className={
            step === AppStep.LANDING
              ? 'flex w-full items-center justify-between gap-3 px-4 py-2 md:px-6 md:py-2'
              : 'flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5'
          }
        >
          <button
            onClick={() => {
              navigateToLanding();
            }}
            className="flex min-w-0 shrink items-center gap-2 text-stone-800 transition-opacity hover:opacity-70 md:gap-3 dark:text-stone-100"
          >
            <FlaskConical className="h-7 w-7 shrink-0 md:h-9 md:w-9" />
            <h1 className="truncate font-serif text-lg font-bold md:text-2xl">{t.appTitle}</h1>
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="shrink-0 rounded-full border border-stone-200/90 bg-white/70 p-2.5 shadow-sm backdrop-blur-md transition-all hover:scale-105 dark:border-stone-600 dark:bg-stone-800/80 md:p-3"
          >
            <Settings size={20} className="md:h-[22px] md:w-[22px] text-stone-700 dark:text-stone-300" />
          </button>
        </div>
      </header>

      {step === AppStep.GENERATING ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="generating-panel"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden bg-cream-50 dark:bg-[#171412]"
          >
            <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col px-3 pb-2 pt-1 md:px-4 md:pb-3">
              <GeneratingView />
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
      <main
        className={
          step === AppStep.CONFIG
            ? 'flex flex-1 flex-col items-stretch w-full max-w-7xl mx-auto min-h-0 h-full overflow-hidden px-0 pt-2 md:pt-3 pb-2'
            : step === AppStep.QUIZ || step === AppStep.READY
              ? 'flex flex-1 flex-col items-stretch w-full max-w-7xl mx-auto min-h-0 h-full min-w-0 overflow-hidden px-3 pt-2 pb-2 md:pb-3'
              : step === AppStep.LANDING
                ? 'flex flex-1 min-h-0 flex-col items-center w-full max-w-7xl mx-auto pt-0 pb-4'
                : 'flex flex-1 min-h-0 flex-col items-center w-full max-w-7xl mx-auto pt-2 md:pt-10 pb-4'
        }
      >
        <AnimatePresence mode="wait">
          {step === AppStep.LANDING && (
            <LandingView
              key="landing"
            />
          )}
          {step === AppStep.CONFIG && (
            <ConfigView 
              key="config"
            />
          )}
          {step === AppStep.READY && (
            <div
              key="ready"
              className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch"
            >
              <ReadyView />
            </div>
          )}
          {step === AppStep.QUIZ && (
            <div
              key="quiz"
              className="flex min-h-0 w-full min-w-0 flex-1 flex-col items-stretch"
            >
              <QuizView />
            </div>
          )}
          {step === AppStep.STUDY && (
              <FlashcardsView 
                  key="flashcards"
              />
          )}
          {step === AppStep.RESULTS && (
            <ResultsView 
              key="results"
            />
          )}
        </AnimatePresence>
      </main>
      )}

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
