import { Play, LibraryBig, AlertTriangle } from 'lucide-react';
import type { FC } from 'react';
import { Button } from '../Button';
import type { TranslationContent } from '../../constants/translations';

/** Sınav / flashcard üretim CTA ve uyarı şeridi. */
export const GenerationActionsBar: FC<{
  t: TranslationContent;
  pdfText: string;
  onStartQuiz: () => void;
  onStartFlashcards: () => void;
}> = ({ t, pdfText, onStartQuiz, onStartFlashcards }) => (
  <div className="relative pt-2 mt-1 lg:pt-2 lg:mt-1 border-t border-white/45 dark:border-white/10 z-20 bg-white/10 dark:bg-white/[0.02] shrink-0 rounded-2xl px-1.5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-2 mb-2">
      <Button
        fullWidth
        onClick={onStartQuiz}
        disabled={!pdfText}
        className="py-3.5 text-[14px] relative overflow-hidden group border border-transparent transition-all rounded-[1.25rem] bg-gradient-to-r from-sand-500/95 to-sand-600/95 hover:from-sand-600 hover:to-sand-700 text-white shadow-[0_10px_20px_-14px_rgba(217,146,52,0.55)] dark:from-sand-600 dark:to-sand-700 dark:text-stone-50"
      >
        <span className="relative z-10 flex items-center justify-center gap-2 w-full font-extrabold tracking-wide">
          {t.createQuiz} <Play size={16} fill="currentColor" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.7s_infinite] skew-x-12 z-0" />
      </Button>
      <Button
        variant="glass"
        fullWidth
        onClick={onStartFlashcards}
        disabled={!pdfText}
        className="py-3.5 text-[14px] rounded-[1.25rem] font-bold"
      >
        {t.createFlashcards} <LibraryBig size={17} />
      </Button>
    </div>

    <div className="flex items-center justify-center gap-2 text-[10px] text-amber-700/92 dark:text-amber-400/92 font-bold uppercase tracking-[0.1em] text-center bg-amber-50/58 dark:bg-amber-900/16 py-2 rounded-xl backdrop-blur-sm border border-amber-200/60 dark:border-amber-700/24">
      <AlertTriangle size={12} strokeWidth={2.5} className="shrink-0" />
      <span>{t.aiDisclaimer}</span>
    </div>
  </div>
);
