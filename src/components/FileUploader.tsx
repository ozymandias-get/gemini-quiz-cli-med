import { type FC } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { configPanel3dWrapClass, configPanel3dInnerClass } from '../utils/helpers';
import { configItemVariants } from '../utils/configMotion';
import { useTranslation } from '../hooks/useTranslations';

interface FileUploaderProps {
  pdfText: string;
  fileName: string;
  isReadingPdf: boolean;
  onUpload: () => void;
  onResetPdf: () => void;
}

/** PDF yükleme kartı; motion variant configMotion ile paylaşılır (prop drilling yok). */
export const FileUploader: FC<FileUploaderProps> = ({ pdfText, fileName, isReadingPdf, onUpload, onResetPdf }) => {
    const { t } = useTranslation();
    return (
        <motion.div
             variants={configItemVariants}
             className={`${configPanel3dWrapClass} min-h-[240px] md:min-h-[300px] lg:min-h-0 h-full max-h-full`}
           >
              <div className={`${configPanel3dInnerClass} p-5 md:p-6 h-full max-h-full`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-sand-200/20 dark:bg-sand-900/10 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-lg md:text-xl font-serif font-bold mb-4 text-stone-800 dark:text-stone-100 flex items-center gap-2.5 relative z-10 shrink-0">
                <div className="p-2 bg-sand-100 dark:bg-stone-800 rounded-xl text-sand-600 dark:text-sand-400">
                  <Upload size={18} />
                </div>
                {t.uploadTitle}
              </h2>

              {!pdfText ? (
                <div className="flex-1 flex flex-col relative z-10">
                   {isReadingPdf ? (
                     <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 animate-spin text-sand-500 mb-4" />
                        <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">{t.analyzing}</p>
                     </div>
                   ) : (
                    <div className="flex-1 group/label">
                      <div className="h-full border-2 border-dashed border-stone-200 dark:border-stone-700/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 bg-stone-50/30 dark:bg-stone-900/20 hover:bg-sand-50/50 transition-all duration-300">
                        <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-2xl flex items-center justify-center shadow-md">
                          <FileText size={30} className="text-stone-400" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-base text-stone-800 dark:text-stone-100 font-bold">{t.features.upload}</p>
                           <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium px-4">{t.uploadDesc}</p>
                           <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium px-4">{t.uploadLimitsHint}</p>
                           <button
                             type="button"
                             onClick={onUpload}
                             className="mt-2 rounded-xl bg-stone-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white dark:bg-sand-500 dark:text-stone-900"
                           >
                             {t.clickToSelect}
                           </button>
                        </div>
                      </div>
                    </div>
                   )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                   <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-3xl flex items-center justify-center mb-4">
                      <CheckCircle size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">{t.fileSelected}</h3>
                   <p className="text-[11px] font-mono text-stone-500 mb-6 truncate max-w-full px-6">{fileName}</p>
                   <div className="flex w-full max-w-xs flex-col items-stretch gap-2.5 sm:max-w-none sm:flex-row sm:justify-center">
                   <button type="button" onClick={onUpload} className="cursor-pointer flex-1 sm:flex-none">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full">
                        <RefreshCw size={14} /> {t.changeFile}
                      </span>
                   </button>
                   <button
                      type="button"
                      onClick={onResetPdf}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200/90 bg-red-50/90 px-5 py-3 text-xs font-bold uppercase tracking-widest text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70 sm:flex-none"
                   >
                      <Trash2 size={14} strokeWidth={2.5} aria-hidden />
                      {t.resetPdf}
                   </button>
                   </div>
                </div>
              )}
              </div>
           </motion.div>
    );
};
