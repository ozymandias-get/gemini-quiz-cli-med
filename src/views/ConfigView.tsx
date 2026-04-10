import { type FC } from 'react';
import { motion } from 'framer-motion';
import { FileUploader } from '../components/FileUploader';
import { QuizConfigurationForm } from '../components/QuizConfigurationForm';
import { useGenerationStore } from '../store/useGenerationStore';
import { handleFileUpload, clearPdfUpload } from '../services/appFlows';
import { configContainerVariants } from '../utils/configMotion';

export const ConfigView: FC = () => {
  const pdfText = useGenerationStore((s) => s.pdfText);
  const fileName = useGenerationStore((s) => s.fileName);
  const isReadingPdf = useGenerationStore((s) => s.isReadingPdf);
  return (
    <motion.div 
      variants={configContainerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col flex-1 min-h-0 h-full w-full max-w-7xl mx-auto px-3 md:px-4 gap-2 pb-2 md:pb-3 overflow-hidden"
    >
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-stretch min-h-0 lg:flex-1 lg:min-h-0 lg:h-full lg:overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2.2rem] bg-gradient-to-br from-white/22 via-transparent to-sand-200/15 dark:from-stone-900/30 dark:to-sand-900/40 blur-xl" />
        
        {/* LEFT COLUMN: Upload */}
        <div className="lg:col-span-4 min-h-0 flex flex-col lg:max-h-full lg:overflow-y-auto [scrollbar-gutter:stable]">
           <FileUploader 
                pdfText={pdfText}
                fileName={fileName}
                isReadingPdf={isReadingPdf}
                onUpload={handleFileUpload}
                onResetPdf={clearPdfUpload}
           />
        </div>

        {/* RIGHT COLUMN: Settings */}
        <div className="lg:col-span-8 min-h-0 flex flex-col lg:max-h-full lg:h-full lg:min-h-0">
            <QuizConfigurationForm />
        </div>
      </div>
    </motion.div>
  );
};
