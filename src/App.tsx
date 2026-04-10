
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
import { PdfExtractionHelpView } from './views/PdfExtractionHelpView';
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
import { APP_SCROLL_ROOT_ID } from './constants/domIds';

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

  const scrollableMain =
    step === AppStep.LANDING ||
    step === AppStep.RESULTS ||
    step === AppStep.STUDY;

  const mainPaddingClass = (() => {
    switch (step) {
      case AppStep.CONFIG:
      case AppStep.PDF_EXTRACTION_HELP:
        return 'px-0 pt-2 md:pt-3 pb-2';
      case AppStep.QUIZ:
      case AppStep.READY:
        return 'px-3 pt-2 pb-2 md:pb-3';
      case AppStep.LANDING:
        return 'pt-0 pb-4';
      case AppStep.STUDY:
      case AppStep.RESULTS:
        return 'pt-2 md:pt-10 pb-4';
      default:
        return 'pt-2 md:pt-10 pb-4';
    }
  })();

  const mainInnerAlign =
    step === AppStep.LANDING || step === AppStep.RESULTS || step === AppStep.STUDY
      ? 'items-center'
      : 'items-stretch';

  const mainInnerClass = scrollableMain
    ? `flex flex-1 flex-col min-h-0 min-w-0 w-full overflow-y-scroll overscroll-contain [scrollbar-gutter:stable] ${mainInnerAlign}`
    : `flex flex-1 flex-col min-h-0 min-w-0 w-full h-full overflow-hidden ${mainInnerAlign}`;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col relative overflow-hidden bg-cream-50 dark:bg-app-dark selection:bg-sand-300 selection:text-stone-900 dark:selection:bg-sand-500/30 dark:selection:text-stone-100">
      <Background />
      <Toaster
        theme={isDarkMode ? 'dark' : 'light'}
        position="top-right"
        toastOptions={{ duration: 4000 }}
        closeButton
      />
      <header className="relative z-50 mx-auto w-full max-w-7xl shrink-0 border-b border-white/50 bg-gradient-to-r from-white/70 to-cream-50/40 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:from-app-dark/90 dark:to-stone-900/50">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
          <button
            type="button"
            onClick={() => {
              if (step !== AppStep.LANDING) navigateToLanding();
            }}
            className="flex min-w-0 shrink items-center gap-2 rounded-lg text-left text-stone-800 transition-opacity hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sand-500/50 md:gap-3 dark:text-stone-100"
          >
            <FlaskConical className="h-7 w-7 shrink-0 md:h-9 md:w-9" />
            <h1 className="truncate font-serif text-lg font-bold md:text-2xl">{t.appTitle}</h1>
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="shrink-0 rounded-full border border-white/60 border-b-white/20 border-r-white/20 bg-gradient-to-br from-white/60 to-white/20 p-2.5 shadow-md ring-1 ring-white/40 backdrop-blur-md transition-all hover:scale-105 hover:from-white/80 hover:to-white/40 hover:shadow-lg dark:border-white/10 dark:border-b-transparent dark:border-r-transparent dark:from-white/10 dark:to-transparent dark:ring-white/10 dark:hover:from-white/20 dark:hover:to-white/5 md:p-3"
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
            className="flex min-h-0 flex-1 flex-col overflow-hidden bg-cream-50 dark:bg-app-dark"
          >
            <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col px-3 pb-2 pt-1 md:px-4 md:pb-3">
              <GeneratingView />
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
      <main
        className={`flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden mx-auto ${mainPaddingClass}`}
      >
        <div
          id={scrollableMain ? APP_SCROLL_ROOT_ID : undefined}
          className={mainInnerClass}
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
          {step === AppStep.PDF_EXTRACTION_HELP && (
            <PdfExtractionHelpView
              key="pdf-extraction-help"
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
        </div>
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
