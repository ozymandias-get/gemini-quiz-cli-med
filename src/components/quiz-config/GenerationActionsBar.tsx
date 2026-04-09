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
  <div className="relative pt-2 mt-1 lg:pt-2 lg:mt-1 border-t border-stone-200/50 dark:border-stone-700/50 z-20 bg-white/10 dark:bg-black/10 shrink-0">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-2 mb-2">
      <Button
        fullWidth
        onClick={onStartQuiz}
        disabled={!pdfText}
        className="py-3.5 text-[14px] relative overflow-hidden group border border-transparent transition-all rounded-[1.25rem] bg-gradient-to-r from-sand-500 to-sand-600 hover:from-sand-600 hover:to-sand-700 text-white shadow-lg shadow-sand-500/25 dark:from-sand-600 dark:to-sand-700 dark:text-stone-50"
      >
        <span className="relative z-10 flex items-center justify-center gap-2 w-full font-extrabold tracking-wide">
          {t.createQuiz} <Play size={16} fill="currentColor" />
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-12 z-0" />
      </Button>
      <Button
        variant="outline"
        fullWidth
        onClick={onStartFlashcards}
        disabled={!pdfText}
        className="py-3.5 text-[14px] bg-white/50 dark:bg-stone-800/40 backdrop-blur border-stone-200/80 dark:border-stone-700 shadow-sm hover:bg-white dark:hover:bg-stone-800 rounded-[1.25rem] font-bold"
      >
        {t.createFlashcards} <LibraryBig size={17} />
      </Button>
    </div>

    <div className="flex items-center justify-center gap-2 text-[10px] text-amber-600/90 dark:text-amber-500/90 font-bold uppercase tracking-[0.1em] text-center bg-amber-50/50 dark:bg-amber-900/10 py-2 rounded-xl backdrop-blur-sm">
      <AlertTriangle size={12} strokeWidth={2.5} className="shrink-0" />
      <span>{t.aiDisclaimer}</span>
    </div>
  </div>
);
