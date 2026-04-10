
import { useState, useCallback, useRef, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  CircleDashed,
  XCircle,
  ChevronUp,
  MessageCircle,
  Zap,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import { formatText } from '../utils/helpers';
import { showError } from '../utils/toast';
import { Question } from '../types';
import { QuestionChat } from './QuestionChat';
import { useTranslation } from '../hooks/useTranslations';

interface ResultQuestionCardProps {
  q: Question;
  idx: number;
  userAnswer?: number;
  isCorrect: boolean;
  onShowSource?: (question: Question) => void;
}

const STRIPE = 'border-l-[3px]';

/** Panoya düz metin — **bold** ve fazla boşlukları sadeleştirir */
function toPlainCopyText(raw: string): string {
  return raw
    .replace(/\*\*/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

export const ResultQuestionCard: FC<ResultQuestionCardProps> = ({ q, idx, userAnswer, isCorrect, onShowSource }) => {
  const { t } = useTranslation();
  const [showAiChat, setShowAiChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<number>(0);
  const isBlank = userAnswer === undefined;

  const handleCopyQuestion = useCallback(async () => {
    const stem = toPlainCopyText(q.text);
    const opts = q.options
      .map((opt, i) => `${String.fromCharCode(65 + i)}. ${toPlainCopyText(opt)}`)
      .join('\n');
    const block = `${t.question} ${idx + 1}\n\n${stem}\n\n${opts}`;
    try {
      await navigator.clipboard.writeText(block);
      setCopied(true);
      window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showError(t.errors.generic);
    }
  }, [q.text, q.options, idx, t.question, t.errors.generic]);

  return (
    <motion.div
      layout
      className="relative rounded-2xl border border-stone-200/70 bg-white/80 p-4 shadow-sm ring-1 ring-stone-900/5 transition-shadow dark:border-stone-700/80 dark:bg-stone-900/55 dark:ring-white/5 md:p-5 md:rounded-[1.35rem] group hover:shadow-md"
    >
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${
          isCorrect ? 'bg-emerald-500' : isBlank ? 'bg-stone-400' : 'bg-red-500'
        }`}
        aria-hidden
      />

      <div className="pl-3.5">
        <div className="flex gap-2.5 items-start justify-between mb-3 md:mb-3.5">
          <div className="min-w-0 flex-1 flex gap-2.5 items-start">
            <span
              className="mt-0.5 inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-lg bg-sand-700 px-2 text-xs font-bold text-white shadow-sm dark:bg-sand-600 dark:text-stone-900"
              aria-label={`${t.question} ${idx + 1}`}
            >
              {idx + 1}
            </span>
            <div className="min-w-0 font-serif text-[0.9375rem] font-medium leading-snug text-stone-800 dark:text-stone-100 md:text-base">
              {formatText(q.text)}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleCopyQuestion}
              title={copied ? t.copyQuestionDone : t.copyQuestion}
              aria-label={t.copyQuestionAria}
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-sand-700 dark:hover:bg-stone-800 dark:hover:text-sand-400"
            >
              {copied ? (
                <Check size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.25} aria-hidden />
              ) : (
                <Copy size={18} strokeWidth={2.25} aria-hidden />
              )}
            </button>
            {isCorrect ? (
              <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                <CheckCircle size={18} strokeWidth={2.25} aria-hidden />
              </div>
            ) : isBlank ? (
              <div className="rounded-full bg-stone-100 p-1.5 text-stone-500 dark:bg-stone-800">
                <CircleDashed size={18} strokeWidth={2.25} aria-hidden />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 p-1.5 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                <XCircle size={18} strokeWidth={2.25} aria-hidden />
              </div>
            )}
          </div>
        </div>

        {isBlank && (
          <div className="mb-2.5">
            <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              {t.blankAnswer}
            </span>
          </div>
        )}

        {/* Kapsamlı çözüm — doğrudan soru kökünün altında */}
        <div
          className={`${STRIPE} mb-3.5 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50/95 to-amber-50/40 p-4 pl-3.5 text-stone-800 shadow-sm border-l-amber-500 dark:border-amber-700/40 dark:from-amber-950/35 dark:to-amber-950/10 dark:text-stone-200 md:mb-4 md:p-4.5`}
        >
          <div className="mb-3 flex items-center gap-2 border-b border-amber-200/60 pb-2.5 dark:border-amber-800/40">
            <Zap size={16} className="shrink-0 text-amber-600 dark:text-amber-400" fill="currentColor" aria-hidden />
            <span className="text-sm font-bold tracking-tight text-amber-900 dark:text-amber-300">{t.detailedSolution}</span>
          </div>
          <div className="text-[13px] leading-[1.7] text-stone-800 dark:text-stone-200 md:text-[0.9375rem] md:leading-[1.75] [&_h4]:mt-3 [&_h4]:text-[0.9375rem] [&_h4]:font-bold [&_h4]:text-amber-900 dark:[&_h4]:text-amber-200/95 [&_p]:mb-2.5 [&_p:last-child]:mb-0">
            {formatText(q.explanation)}
          </div>
        </div>

        <div className="space-y-1.5 mb-3 md:mb-4">
          {q.options.map((opt: string, optIdx: number) => {
            const isRight = optIdx === q.correctAnswerIndex;
            const isWrongPick = optIdx === userAnswer && !isCorrect;
            let row =
              `${STRIPE} flex items-start gap-2 rounded-lg border border-transparent py-2 pl-2 pr-2.5 text-sm transition-colors `;
            if (isRight) {
              row +=
                'border-emerald-200/80 bg-emerald-50/90 text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-950/25 dark:text-emerald-100 border-l-emerald-500 font-medium';
            } else if (isWrongPick) {
              row +=
                'border-red-200/80 bg-red-50/90 text-red-950 dark:border-red-800/60 dark:bg-red-950/25 dark:text-red-100 border-l-red-500';
            } else {
              row +=
                'border-stone-200/70 bg-stone-50/80 text-stone-600 dark:border-stone-700/80 dark:bg-stone-800/40 dark:text-stone-400 border-l-sand-400 dark:border-l-sand-500/45';
            }
            return (
              <div key={optIdx} className={row}>
                <span
                  className={`w-5 shrink-0 pt-0.5 text-center text-[11px] font-bold tabular-nums ${
                    isRight
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : isWrongPick
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-stone-500 dark:text-stone-500'
                  }`}
                >
                  {String.fromCharCode(65 + optIdx)}.
                </span>
                <div className="min-w-0 flex-1 leading-snug [&_p]:m-0">{formatText(opt)}</div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => setShowAiChat(!showAiChat)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone-500 transition-colors hover:text-sand-700 dark:text-stone-400 dark:hover:text-sand-400"
          >
            {showAiChat ? <ChevronUp size={14} /> : <MessageCircle size={14} />}
            {showAiChat ? t.hideExplanation : t.showExplanation}
          </button>

          {q.sourceQuote && onShowSource && (
            <button
              type="button"
              onClick={() => onShowSource(q)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sand-700 transition-colors hover:text-sand-800 dark:text-sand-400 dark:hover:text-sand-300"
            >
              <BookOpen size={14} /> {t.showSource}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showAiChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-0.5"
            >
              <QuestionChat question={q} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
