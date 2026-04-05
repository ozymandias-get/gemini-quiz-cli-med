
import { useState, useEffect, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Download, Zap, Repeat, AlertTriangle, Loader2, CheckCircle2, Info, X, Ban } from 'lucide-react';
import { Button } from './Button';
import { QuizState, QuizSettings } from '../types';
import { formatTimeDuration, glassCardClass } from '../utils/helpers';
import { exportQuizToPDF } from '../services/pdfExportService';
import { showError } from '../utils/toast';
import { getModelDisplayName } from '../constants/translations';
import { useTranslation } from '../hooks/useTranslations';

interface ResultsStatsProps {
    quizState: QuizState;
    settings: QuizSettings;
    fileName: string;
    onRestart: () => void;
    onRetryMistakes: () => void;
    onRegenerate: () => void;
    hasMistakes: boolean;
}

export const ResultsStats: FC<ResultsStatsProps> = ({
    quizState, settings, fileName, onRestart, onRetryMistakes, onRegenerate, hasMistakes
}) => {
    const { t } = useTranslation();
    const [isDownloading, setIsDownloading] = useState(false);
    const [pdfNotice, setPdfNotice] = useState<
        | { variant: 'saved'; path: string }
        | { variant: 'browser'; fileName: string }
        | { variant: 'cancelled' }
        | null
    >(null);

    useEffect(() => {
        if (!pdfNotice) return;
        const id = window.setTimeout(() => setPdfNotice(null), 14000);
        return () => window.clearTimeout(id);
    }, [pdfNotice]);

    const totalQ = quizState.questions.length;
    const percentage = totalQ > 0 ? Math.round((quizState.score / totalQ) * 100) : 0;
    const duration = quizState.startTime && quizState.endTime ? quizState.endTime - quizState.startTime : 0;

    const handleDownload = async () => {
        setIsDownloading(true);
        setPdfNotice(null);
        try {
            const r = await exportQuizToPDF(quizState, fileName, t.pdfExport);
            if (r.kind === 'saved') {
                setPdfNotice({ variant: 'saved', path: r.path });
            } else if (r.kind === 'browser') {
                setPdfNotice({ variant: 'browser', fileName: r.fileName });
            } else {
                setPdfNotice({ variant: 'cancelled' });
            }
        } catch (e) {
            console.error(e);
            showError(t.pdfExport.saveError);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className={`rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 text-center mb-8 md:mb-10 ${glassCardClass} relative overflow-hidden`}>
        {/* Background blobs for flair */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-sand-200/50 dark:bg-sand-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-stone-200/50 dark:bg-stone-800/30 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="inline-flex p-4 md:p-6 rounded-3xl bg-sand-100 dark:bg-sand-900/30 mb-4 md:mb-6 text-sand-600 dark:text-sand-400 shadow-inner"
        >
          <Trophy size={32} className="md:w-12 md:h-12" />
        </motion.div>
        
        <h2 className="text-2xl md:text-4xl font-serif font-bold mb-4 text-stone-900 dark:text-stone-50">{percentage >= 70 ? t.successTitle : t.failTitle}</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8 md:mt-10 relative z-10">
          <div className="p-3 md:p-4 bg-white/50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
            <div className="text-[10px] md:text-xs text-stone-500 dark:text-stone-400 mb-1 font-bold uppercase">{t.score}</div>
            <div className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100">%{percentage}</div>
          </div>
          <div className="p-3 md:p-4 bg-white/50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
            <div className="text-[10px] md:text-xs text-stone-500 dark:text-stone-400 mb-1 font-bold uppercase">{t.correct}</div>
            <div className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100">
              {totalQ > 0 ? `${quizState.score}/${totalQ}` : '—'}
            </div>
          </div>
          <div className="p-3 md:p-4 bg-white/50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
            <div className="text-[10px] md:text-xs text-stone-500 dark:text-stone-400 mb-1 font-bold uppercase">{t.time}</div>
            <div className="text-2xl md:text-3xl font-bold text-stone-800 dark:text-stone-100">{formatTimeDuration(duration)}</div>
          </div>
           <div className="p-3 md:p-4 bg-white/50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-700">
            <div className="text-[10px] md:text-xs text-stone-500 dark:text-stone-400 mb-1 font-bold uppercase">{t.modelLabel}</div>
            <div className="text-lg md:text-xl font-bold text-stone-800 dark:text-stone-100 leading-tight pt-1">{getModelDisplayName(settings.model, t)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-8 md:mt-10">
          {hasMistakes && (
             <Button 
                onClick={onRetryMistakes} 
                className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20 shadow-lg border-none py-3 md:py-4"
                fullWidth
             >
                <Zap size={18} fill="currentColor" /> {t.remedialBtn}
             </Button>
          )}
          
          <Button variant="primary" fullWidth onClick={onRegenerate} className="py-3 md:py-4">
              <Repeat size={18} /> {t.regenerateBtn}
          </Button>

          <Button variant="outline" fullWidth onClick={onRestart} className="py-3 md:py-4"><RefreshCw size={18} /> {t.newPdf}</Button>
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={handleDownload} 
            disabled={isDownloading} 
            className="py-3 md:py-4"
          >
            {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
            {isDownloading ? t.downloadPreparing : t.downloadPdf}
          </Button>
        </div>

        <AnimatePresence>
            {pdfNotice && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className={`mt-6 rounded-2xl border p-4 text-left shadow-sm md:p-5 ${
                        pdfNotice.variant === 'saved'
                            ? 'border-emerald-200/90 bg-emerald-50/95 dark:border-emerald-800/60 dark:bg-emerald-950/35'
                            : pdfNotice.variant === 'browser'
                              ? 'border-sky-200/90 bg-sky-50/90 dark:border-sky-800/50 dark:bg-sky-950/30'
                              : 'border-stone-200/90 bg-stone-100/90 dark:border-stone-600/60 dark:bg-stone-800/60'
                    }`}
                    role="status"
                >
                    <div className="flex gap-3">
                        {pdfNotice.variant === 'saved' ? (
                            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        ) : pdfNotice.variant === 'browser' ? (
                            <Info className="h-6 w-6 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
                        ) : (
                            <Ban className="h-6 w-6 shrink-0 text-stone-500 dark:text-stone-400" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                            {pdfNotice.variant === 'saved' && (
                                <>
                                    <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                                        {t.pdfExport.savedToLocation}
                                    </p>
                                    <p className="mt-2 break-all font-mono text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">
                                        {pdfNotice.path}
                                    </p>
                                </>
                            )}
                            {pdfNotice.variant === 'browser' && (
                                <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">
                                    {t.pdfExport.browserDownload.replace('{name}', pdfNotice.fileName)}
                                </p>
                            )}
                            {pdfNotice.variant === 'cancelled' && (
                                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                                    {t.pdfExport.saveCancelled}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPdfNotice(null)}
                            className="-m-1 shrink-0 rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-black/5 hover:text-stone-800 dark:hover:bg-white/10 dark:hover:text-stone-100"
                            aria-label={t.close}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="mt-8 pt-4 border-t border-stone-100 dark:border-stone-800/50 flex justify-center">
            <div className="px-5 py-2.5 bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-600 rounded-full flex items-center gap-2 backdrop-blur-sm shadow-sm">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-500" />
                <p className="text-xs font-bold text-amber-900 dark:text-stone-300">
                    {t.aiDisclaimer}
                </p>
            </div>
        </div>
      </div>
    );
};
