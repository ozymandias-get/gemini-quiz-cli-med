import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslations';
import { useQuizConfigPanel } from '../hooks/useQuizConfigPanel';
import { useSettingsStore } from '../store/useSettingsStore';
import { useGenerationStore } from '../store/useGenerationStore';
import { configPanel3dWrapClass, configPanel3dInnerClass } from '../utils/helpers';
import { configItemVariants } from '../utils/configMotion';
import { RegenerationBanner } from './quiz-config/RegenerationBanner';
import { ModelDifficultyCountBlock } from './quiz-config/ModelDifficultyCountBlock';
import { QuestionStylesBlock } from './quiz-config/QuestionStylesBlock';
import { FocusTopicCollapsible } from './quiz-config/FocusTopicCollapsible';
import { ExampleReferenceCollapsible } from './quiz-config/ExampleReferenceCollapsible';
import { GenerationActionsBar } from './quiz-config/GenerationActionsBar';
import { PdfExtractionCollapsible } from './quiz-config/PdfExtractionCollapsible';

/** Ayar paneli: alt modüllere bölündü; motion variant tek kaynakta (configMotion). */
export const QuizConfigurationForm: FC = () => {
  const { t, language } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const toggleQuestionStyle = useSettingsStore((s) => s.toggleQuestionStyle);
  const pdfText = useGenerationStore((s) => s.pdfText);
  const isRegenerating = useGenerationStore((s) => s.usedQuestions.length > 0);
  const startQuizGeneration = useGenerationStore((s) => s.startQuizGeneration);
  const startFlashcardGeneration = useGenerationStore((s) => s.startFlashcardGeneration);

  const {
    activeSection,
    toggleSection,
    isUploadingExample,
    fileInputRef,
    handleExampleFile,
    clearExample,
  } = useQuizConfigPanel();

  return (
    <motion.div variants={configItemVariants} className={`${configPanel3dWrapClass} h-full min-h-0 max-h-full`}>
      <div
        className={`${configPanel3dInnerClass} p-3 md:p-4 lg:p-3 flex flex-col h-full min-h-0 max-h-full overflow-hidden`}
      >
        <div
          className="absolute top-0 right-0 w-56 h-56 bg-sand-200/10 dark:bg-stone-700/30 rounded-full blur-[64px] pointer-events-none"
          style={{ zIndex: 0 }}
        />
        <div
          className="absolute bottom-0 left-0 w-40 h-40 bg-amber-200/7 dark:bg-stone-700/25 rounded-full blur-[52px] pointer-events-none"
          style={{ zIndex: 0 }}
        />

        <div className="flex items-center justify-between pb-2 md:pb-3 lg:pb-2 shrink-0 relative z-10 rounded-2xl border border-white/50 dark:border-white/10 bg-white/28 dark:bg-white/[0.025] px-2.5 py-2 backdrop-blur-sm">
          <h2 className="text-lg md:text-xl lg:text-xl font-serif font-extrabold bg-gradient-to-br from-stone-800 to-stone-500 dark:from-stone-100 dark:to-stone-400 bg-clip-text text-transparent leading-tight tracking-tight">
            {t.settingsTitle}
          </h2>
          <div className="p-2 bg-white/52 dark:bg-white/[0.05] rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <Wand2 size={18} className="text-sand-600 dark:text-sand-300" />
          </div>
        </div>

        <AnimatePresence>
          {isRegenerating && <RegenerationBanner t={t} />}
        </AnimatePresence>

        <div
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-1 space-y-2.5 md:space-y-3 lg:space-y-2 relative z-10 scrollbar-thin py-1 lg:py-0.5 [scrollbar-gutter:stable]"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          <ModelDifficultyCountBlock t={t} settings={settings} updateSetting={updateSetting} />
          <QuestionStylesBlock t={t} settings={settings} toggleQuestionStyle={toggleQuestionStyle} />
          <div className="space-y-2 lg:space-y-1.5 pb-1 pt-0">
            <FocusTopicCollapsible
              t={t}
              settings={settings}
              activeSection={activeSection}
              toggleSection={toggleSection}
              updateSetting={updateSetting}
            />
            <ExampleReferenceCollapsible
              settings={settings}
              activeSection={activeSection}
              toggleSection={toggleSection}
              updateSetting={updateSetting}
              fileInputRef={fileInputRef}
              isUploadingExample={isUploadingExample}
              handleExampleFile={handleExampleFile}
              clearExample={clearExample}
            />
            <PdfExtractionCollapsible
              language={language}
              settings={settings}
              activeSection={activeSection}
              toggleSection={toggleSection}
              updateSetting={updateSetting}
            />
          </div>
        </div>

        <GenerationActionsBar
          t={t}
          pdfText={pdfText}
          onStartQuiz={() => void startQuizGeneration()}
          onStartFlashcards={() => void startFlashcardGeneration()}
        />
      </div>
    </motion.div>
  );
};
