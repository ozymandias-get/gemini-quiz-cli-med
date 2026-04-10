import type { FC } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CircleHelp, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslations';
import { navigateToConfig } from '../services/appFlows';

export const PdfExtractionHelpView: FC = () => {
  const { t, language } = useTranslation();
  const sections = t.pdfExtractionHelp.sections;
  const groupedSections = [
    {
      title: language === 'tr' ? 'Temel Modlar' : 'Core Modes',
      items: sections.slice(0, 2),
    },
    {
      title: language === 'tr' ? 'Metin ve Yapı Ayarları' : 'Text & Structure Settings',
      items: sections.slice(2, 11),
    },
    {
      title: language === 'tr' ? 'Hibrit ve OCR Ayarları' : 'Hybrid & OCR Settings',
      items: sections.slice(11, 18),
    },
    {
      title: language === 'tr' ? 'Görsel ve Çıktı' : 'Image & Output',
      items: sections.slice(18),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 min-h-0 w-full flex-col px-3 md:px-4 pb-2 md:pb-3"
    >
      <div className="relative flex min-h-0 h-full flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/45 p-3 md:p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
        <div
          className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-sand-300/20 blur-3xl dark:bg-sand-400/10"
          aria-hidden
        />

        <div className="mb-3 shrink-0 rounded-2xl border border-stone-200/80 bg-white/75 p-3 md:p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-stone-100/80 px-2.5 py-1 text-[11px] font-bold text-stone-700 dark:bg-stone-800/70 dark:text-stone-200">
                <CircleHelp size={14} />
                {t.pdfExtraction.title}
              </div>
              <h2 className="text-lg md:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                {t.pdfExtractionHelp.title}
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{t.pdfExtractionHelp.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={navigateToConfig}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200/90 bg-white/80 px-3 py-2 text-xs font-bold text-stone-700 shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-white/[0.08] dark:text-stone-200 dark:hover:bg-white/[0.12]"
            >
              <ArrowLeft size={14} />
              {t.pdfExtractionHelp.back}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-sand-200/90 bg-sand-100/70 px-2.5 py-1 text-[11px] font-semibold text-sand-800 dark:border-sand-500/40 dark:bg-sand-500/15 dark:text-sand-200">
              <Sparkles size={12} />
              {t.pdfExtractionHelp.sections.length}+
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              {t.pdfExtractionHelp.tip}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-gutter:stable] space-y-4">
          {groupedSections.map((group) => (
            <section key={group.title} className="space-y-2.5">
              <div className="sticky top-0 z-10 -mx-0.5 px-0.5 py-1 bg-gradient-to-b from-cream-50/80 to-transparent dark:from-app-dark/65">
                <h3 className="inline-flex items-center rounded-full border border-stone-200/80 bg-white/85 px-2.5 py-1 text-[11px] font-bold tracking-wide text-stone-700 dark:border-white/10 dark:bg-white/[0.08] dark:text-stone-200">
                  {group.title}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((section, index) => (
                  <article
                    key={`${group.title}-${section.term}`}
                    className="group rounded-2xl border border-stone-200/80 bg-white/80 p-3.5 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-stone-300/90 hover:shadow-md dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white/20"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-100 px-1.5 text-[10px] font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                        {index + 1}
                      </span>
                      <h4 className="text-[13px] font-bold text-stone-800 dark:text-stone-100">{section.term}</h4>
                    </div>
                    <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300">{section.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
          
          <div className="pt-1">
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {language === 'tr'
                ? 'Not: Belgenin yapısına göre en iyi sonuç için farklı kombinasyonlar deneyebilirsiniz.'
                : 'Note: Depending on document structure, try different combinations for best results.'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
