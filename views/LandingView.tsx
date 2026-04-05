import { type FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { ArrowRight, Brain, Sparkles, Zap, Microscope, Copy, LibraryBig, Play, Terminal, RefreshCw, History } from 'lucide-react';
import { Button } from '../components/Button';
import { AppStep } from '../types';
import { glassCardClass, ScrollReveal } from '../utils/helpers';
import { SUPPORTED_LANGUAGES } from '../constants/translations';
import { useTranslation } from '../hooks/useTranslations';
import { useRoutingStore } from '../store/useRoutingStore';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCliStatusStore } from '../store/useCliStatusStore';
import { prepareDemoQuiz } from '../services/appFlows';

export const LandingView: FC = () => {
  const { t } = useTranslation();
  const setStep = useRoutingStore((s) => s.setStep);
  const quizState = useQuizSessionStore((s) => s.quizState);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const g = t.landing.geminiCli;
  const cliStatus = useCliStatusStore((s) => s.cliStatus);
  const cliLoading = useCliStatusStore((s) => s.cliCheckLoading);
  const checkCliStatus = useCliStatusStore((s) => s.checkCliStatus);
  const [cliSetupBusy, setCliSetupBusy] = useState(false);
  const [persistHydrated, setPersistHydrated] = useState(false);
  const inTauri = typeof window !== 'undefined' && isTauri();

  const canResumeQuiz =
    persistHydrated &&
    quizState.questions.length > 0 &&
    !quizState.isFinished;

  useEffect(() => {
    const unsub = useQuizSessionStore.persist.onFinishHydration(() => {
      setPersistHydrated(true);
    });
    if (useQuizSessionStore.persist.hasHydrated()) {
      setPersistHydrated(true);
    }
    return unsub;
  }, []);

  const handleResumeQuiz = () => {
    const { quizState: qs } = useQuizSessionStore.getState();
    if (qs.startTime != null) {
      setStep(AppStep.QUIZ);
    } else {
      setStep(AppStep.READY);
    }
  };

  const handleGeminiCliSetup = async () => {
    if (!inTauri) return;
    setCliSetupBusy(true);
    try {
      await invoke('gemini_cli_setup_action');
      if (!cliStatus.isDevBuild) {
        await checkCliStatus({ force: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCliSetupBusy(false);
    }
  };

  const showDevSetupButton = Boolean(cliStatus.isDevBuild);
  const showReleaseInstallButton = Boolean(
    cliStatus.isChecked && !cliStatus.isDevBuild && !cliStatus.isInstalled
  );

  return (
    <div className="w-full flex flex-col gap-16 md:gap-24 pb-20">
      
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center pt-0 md:pt-2 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-2 flex flex-col items-center gap-2"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
            {t.selectLanguage}
          </p>
          <div
            className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-stone-200/90 bg-white/70 p-1.5 shadow-sm backdrop-blur-md dark:border-stone-600/80 dark:bg-stone-900/70"
            role="group"
            aria-label={t.selectLanguage}
          >
            {SUPPORTED_LANGUAGES.map((l) => {
              const active = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={[
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                    active
                      ? 'bg-stone-900 text-white shadow-md dark:bg-sand-500 dark:text-stone-950'
                      : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800/80',
                  ].join(' ')}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {l.flag}
                  </span>
                  <span>{l.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-stone-800/60 backdrop-blur-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-widest mb-3 shadow-sm">
            <Sparkles size={14} className="text-sand-500" />
            {t.landing.badge}
          </div>
        </ScrollReveal>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-3 md:mb-4 leading-[1.1] md:leading-[1.1] max-w-5xl tracking-tight"
        >
          {t.landing.titleStart} <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sand-600 via-stone-600 to-sand-700 dark:from-sand-300 dark:via-stone-400 dark:to-sand-500">
            {t.landing.titleHighlight}
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-2xl text-stone-600 dark:text-stone-400 max-w-3xl mb-2 md:mb-4 leading-relaxed font-light"
        >
          {t.landing.subtitle}
        </motion.p>

        {inTauri && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-4 w-full max-w-xl px-2"
          >
            <div
              className={`${glassCardClass} rounded-2xl border border-stone-200/80 p-5 text-left shadow-sm dark:border-stone-600/60`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Terminal size={18} className="text-sand-600 dark:text-sand-400" aria-hidden />
                <span className="text-sm font-bold text-stone-800 dark:text-stone-100">{g.title}</span>
                {cliStatus.isDevBuild && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {g.devBadge}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void checkCliStatus({ force: true })}
                  disabled={cliLoading}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  <RefreshCw size={14} className={cliLoading ? 'animate-spin' : ''} />
                  {g.refresh}
                </button>
              </div>
              {cliLoading && !cliStatus.isChecked ? (
                <p className="text-sm text-stone-500 dark:text-stone-400">{g.loading}</p>
              ) : cliStatus.isChecked ? (
                <>
                  <div className="mb-4 flex flex-wrap items-baseline gap-2 text-sm">
                    <span
                      className={
                        cliStatus.isInstalled
                          ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                          : 'font-semibold text-amber-800 dark:text-amber-300'
                      }
                    >
                      {cliStatus.isInstalled ? g.installed : g.notInstalled}
                    </span>
                    {cliStatus.isInstalled && cliStatus.version ? (
                      <span className="text-stone-500 dark:text-stone-400">
                        ({g.versionLabel}: {cliStatus.version})
                      </span>
                    ) : null}
                  </div>
                  {(showDevSetupButton || showReleaseInstallButton) && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={cliSetupBusy}
                      onClick={() => void handleGeminiCliSetup()}
                      className="w-full border-stone-300 py-3 text-sm font-bold dark:border-stone-600"
                    >
                      {showDevSetupButton ? g.devOnlyButton : g.installButton}
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-sm text-stone-500 dark:text-stone-400">{t.errors.generic}</p>
              )}
            </div>
          </motion.div>
        )}

        {!inTauri && (
          <p className="mb-4 max-w-xl px-2 text-center text-xs text-stone-400 dark:text-stone-500">
            {g.desktopOnly}
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="flex w-full max-w-lg flex-col items-stretch gap-4 sm:max-w-2xl"
        >
          {canResumeQuiz && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResumeQuiz}
              className="border-2 border-emerald-500/80 bg-emerald-50/90 py-4 text-base font-bold text-emerald-900 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/30 hover:border-emerald-600 hover:bg-emerald-100/95 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-600/20 dark:hover:border-emerald-400 sm:min-w-[200px] md:text-lg"
            >
              <History size={20} className="shrink-0" />
              {t.landing.resumeQuizCta}
            </Button>
          )}
          <Button
            onClick={() => setStep(AppStep.CONFIG)}
            className="py-4 px-8 text-lg shadow-2xl shadow-sand-500/20 sm:min-w-[200px] md:px-10 md:text-xl"
          >
            {t.landing.cta} <ArrowRight size={22} />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              prepareDemoQuiz();
            }}
            className="border-2 border-sand-400/90 bg-gradient-to-br from-sand-50/90 to-amber-50/80 py-4 text-base font-extrabold text-stone-800 shadow-lg shadow-sand-500/15 ring-2 ring-sand-300/40 hover:border-sand-500 hover:from-sand-100/95 hover:to-amber-50 dark:border-sand-500/50 dark:from-sand-900/40 dark:to-stone-900/70 dark:text-sand-100 dark:ring-sand-600/30 dark:hover:border-sand-400 sm:min-w-[200px] md:text-lg"
          >
            <Play size={20} className="shrink-0 fill-current" />
            {t.landing.demoCta}
          </Button>
        </motion.div>
      </section>

      {/* Feature Cards Grid */}
      <section className="px-4 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.landing.cards.map((card, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div className={`${glassCardClass} p-8 rounded-[2rem] h-full hover:scale-[1.02] transition-transform duration-500`}>
                <div className="w-14 h-14 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-6 text-stone-900 dark:text-stone-100 shadow-sm">
                  {idx === 0 ? <Brain size={28} /> : idx === 1 ? <Zap size={28} /> : <Sparkles size={28} />}
                </div>
                <h3 className="text-2xl font-bold font-serif mb-4 text-stone-800 dark:text-stone-100">{card.title}</h3>
                <p className="text-stone-500 dark:text-stone-400 leading-relaxed">{card.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="px-4 w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
            <ScrollReveal>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-6 tracking-tight">{t.landing.whyTitle}</h2>
                <div className="w-24 h-1.5 bg-sand-500 rounded-full mx-auto opacity-50"></div>
            </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
            
            {/* Focus Mode - Wide */}
            <ScrollReveal>
                <div className={`${glassCardClass} md:col-span-2 p-10 rounded-[2.5rem] relative overflow-hidden h-full flex flex-col justify-center group`}>
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 transform scale-150 translate-x-10 -translate-y-10">
                        <Microscope size={300} />
                    </div>
                    <div className="relative z-10 max-w-lg">
                        <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                            <Microscope size={28} />
                        </div>
                        <h3 className="text-3xl font-bold mb-4 text-stone-800 dark:text-stone-100">{t.landing.bento.focusTitle}</h3>
                        <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">{t.landing.bento.focusDesc}</p>
                    </div>
                </div>
            </ScrollReveal>

            {/* Style Cloning - Tall */}
            <ScrollReveal delay={0.1}>
                <div className={`${glassCardClass} md:row-span-2 p-10 rounded-[2.5rem] relative overflow-hidden h-full flex flex-col`}>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200/40 dark:bg-purple-900/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3"></div>
                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <Copy size={28} />
                    </div>
                    <h3 className="text-3xl font-bold mb-4 text-stone-800 dark:text-stone-100">{t.landing.bento.styleTitle}</h3>
                    <p className="text-stone-500 dark:text-stone-400 leading-relaxed mb-auto">{t.landing.bento.styleDesc}</p>
                    
                    <div className="mt-8 bg-white/60 dark:bg-stone-950/40 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 backdrop-blur-sm">
                        <div className="flex gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full bg-red-400"></div>
                             <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                             <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        </div>
                        <div className="space-y-2 opacity-60">
                            <div className="h-2 bg-stone-300 dark:bg-stone-700 rounded-full w-3/4"></div>
                            <div className="h-2 bg-stone-300 dark:bg-stone-700 rounded-full w-1/2"></div>
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            {/* Flashcards - Wide */}
            <ScrollReveal delay={0.2}>
                <div className={`${glassCardClass} md:col-span-2 p-10 rounded-[2.5rem] relative overflow-hidden h-full flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-white/70 to-emerald-50/50 dark:from-stone-900/70 dark:to-emerald-900/10`}>
                    <div className="flex-1 relative z-10">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                            <LibraryBig size={28} />
                        </div>
                        <h3 className="text-3xl font-bold mb-4 text-stone-800 dark:text-stone-100">{t.landing.bento.flashTitle}</h3>
                        <p className="text-lg text-stone-500 dark:text-stone-400 leading-relaxed">{t.landing.bento.flashDesc}</p>
                    </div>
                    
                    {/* Visual Card Stack */}
                    <div className="relative w-48 h-40 shrink-0 hidden md:block perspective-1000">
                         <motion.div 
                            animate={{ rotate: [6, 12, 6], y: [0, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-lg transform rotate-6 origin-bottom-right"
                         />
                         <motion.div 
                            animate={{ rotate: [-3, 3, -3], y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            className="absolute inset-0 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-md transform -rotate-3"
                         />
                         <div className="absolute inset-0 bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xl flex items-center justify-center p-6 text-center z-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Flashcard</span>
                         </div>
                    </div>
                </div>
            </ScrollReveal>

        </div>
      </section>

    </div>
  );
};
