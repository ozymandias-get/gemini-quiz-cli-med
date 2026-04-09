import { motion, AnimatePresence } from 'framer-motion';
import {
  FileQuestion,
  ChevronDown,
  Upload,
  Loader2,
  Lightbulb,
  Image as ImageIcon,
  FileText,
  X,
} from 'lucide-react';
import type { FC, RefObject, ChangeEvent } from 'react';
import type { QuizSettings } from '../../types';
import { SELECTED_CHOICE } from './configChoiceClasses';

/** Örnek soru / referans yükleme — accordion. */
export const ExampleReferenceCollapsible: FC<{
  settings: QuizSettings;
  activeSection: string | null;
  toggleSection: (id: string) => void;
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  isUploadingExample: boolean;
  handleExampleFile: (e: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  clearExample: () => void;
}> = ({
  settings,
  activeSection,
  toggleSection,
  updateSetting,
  fileInputRef,
  isUploadingExample,
  handleExampleFile,
  clearExample,
}) => (
  <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/60 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <button
      type="button"
      onClick={() => toggleSection('example')}
      className="w-full flex items-center justify-between p-3 lg:p-2.5 text-left transition-colors bg-gradient-to-r hover:from-white/50 hover:to-transparent dark:hover:from-white/[0.02]"
    >
      <div className="flex items-center gap-3 text-stone-700 dark:text-stone-200 min-w-0">
        <div
          className={`p-1.5 lg:p-1.5 rounded-xl transition-colors shrink-0 ${activeSection === 'example' ? SELECTED_CHOICE : 'bg-white dark:bg-stone-800 text-stone-500 dark:text-stone-400 shadow-sm'}`}
        >
          <FileQuestion size={17} />
        </div>
        <div>
          <h4 className="font-bold text-[13px] text-stone-800 dark:text-stone-200">Örnek Soru & Stil</h4>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 opacity-80 line-clamp-1">
            {settings.exampleImage || settings.exampleText ? 'Örnek içerik eklendi' : 'Model için referans soru formatı sağlayın'}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800/50">
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 text-stone-500 ${activeSection === 'example' ? 'rotate-180' : ''}`}
        />
      </div>
    </button>
    <AnimatePresence>
      {activeSection === 'example' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="p-4 pt-0">
            {!settings.exampleText && !settings.exampleImage ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingExample}
                    className="flex-1 py-3 px-4 bg-white/80 dark:bg-white/5 border border-stone-200/80 dark:border-white/10 shadow-sm rounded-2xl flex items-center justify-center gap-2.5 hover:bg-white dark:hover:bg-white/10 transition-colors group relative overflow-hidden"
                  >
                    {isUploadingExample ? (
                      <Loader2 size={18} className="animate-spin text-sand-500" />
                    ) : (
                      <Upload size={18} className="text-sand-500 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    )}
                    <span className="text-[12px] font-bold text-stone-700 dark:text-stone-200">Dosya Seç (PDF/Resim)</span>
                  </motion.button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={handleExampleFile}
                  />
                </div>

                <div className="relative group">
                  <textarea
                    placeholder="Veya referans teşkil edecek soru metnini doğrudan buraya yapıştırın..."
                    className="w-full bg-white/80 dark:bg-black/20 border border-stone-200/80 dark:border-white/5 rounded-2xl p-3.5 text-[13px] text-stone-800 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-sand-400/50 focus:border-sand-400/50 transition-all min-h-[80px] resize-none shadow-inner"
                    onChange={(e) => updateSetting('exampleText', e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1.5">
                  <Lightbulb size={12} className="text-amber-500" /> Yapay zeka bu örneğin stiline benzer sorular üretir.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-sand-50/80 to-white/80 dark:from-stone-900/80 dark:to-stone-800/80 rounded-2xl p-3 flex items-start gap-3 border border-sand-200 dark:border-stone-700 relative shadow-sm">
                <div className="p-2.5 bg-white dark:bg-black/40 rounded-[14px] shrink-0 text-sand-500 shadow-sm ring-1 ring-sand-100 dark:ring-white/5">
                  {settings.exampleImage ? <ImageIcon size={20} /> : <FileText size={20} />}
                </div>
                <div className="flex-1 min-w-0 self-center">
                  <p className="text-[13px] font-bold text-stone-800 dark:text-stone-200 mb-0.5">Örnek Referans İletildi</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate pr-2">
                    {settings.exampleImage ? '1 Görsel dosyası baz alınacak' : `"${settings.exampleText?.substring(0, 50)}..."`}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={clearExample}
                  className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-full transition-colors absolute top-3 right-3"
                >
                  <X size={14} strokeWidth={3} />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
