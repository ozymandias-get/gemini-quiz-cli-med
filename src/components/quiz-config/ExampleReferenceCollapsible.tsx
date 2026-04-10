import { motion } from 'framer-motion';
import { FileQuestion, Upload, Loader2, Lightbulb, Image as ImageIcon, FileText, X } from 'lucide-react';
import type { FC, RefObject, ChangeEvent } from 'react';
import type { QuizSettings } from '../../types';
import { configInputGlassClass } from '../../utils/helpers';
import { ConfigCollapsibleShell } from './ConfigCollapsibleShell';

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
}) => {
  const isOpen = activeSection === 'example';
  return (
    <ConfigCollapsibleShell
      isOpen={isOpen}
      onToggle={() => toggleSection('example')}
      icon={<FileQuestion size={17} />}
      title="Örnek Soru & Stil"
      subtitle={
        settings.exampleImage || settings.exampleText
          ? 'Örnek içerik eklendi'
          : 'Model için referans soru formatı sağlayın'
      }
    >
      <div className="p-4 pt-0">
        {!settings.exampleText && !settings.exampleImage ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingExample}
                className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-colors group relative overflow-hidden ${configInputGlassClass}`}
              >
                {isUploadingExample ? (
                  <Loader2 size={18} className="animate-spin text-stone-400" />
                ) : (
                  <Upload size={18} className="text-stone-400 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                )}
                <span className="text-[12px] font-bold text-stone-700 dark:text-stone-300">Dosya Seç (PDF/Resim)</span>
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
                className={`w-full rounded-2xl p-3.5 text-[13px] text-stone-800 dark:text-stone-300 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-sand-400/40 transition-all min-h-[80px] resize-none ${configInputGlassClass}`}
                onChange={(e) => updateSetting('exampleText', e.target.value)}
              />
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 flex items-center justify-center gap-1.5">
              <Lightbulb size={12} className="text-amber-500" /> Yapay zeka bu örneğin stiline benzer sorular üretir.
            </p>
          </div>
        ) : (
          <div className={`${configInputGlassClass} rounded-2xl p-3 flex items-start gap-3 relative shadow-sm`}>
            <div className="p-2.5 bg-gradient-to-br from-white/60 to-white/20 dark:from-white/10 dark:to-transparent backdrop-blur-md rounded-[14px] shrink-0 text-stone-400 shadow-sm ring-1 ring-white/40 dark:ring-white/10">
              {settings.exampleImage ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div className="flex-1 min-w-0 self-center">
              <p className="text-[13px] font-bold text-stone-800 dark:text-stone-300 mb-0.5">Örnek Referans İletildi</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-300 truncate pr-2">
                {settings.exampleImage ? '1 Görsel dosyası baz alınacak' : `"${settings.exampleText?.substring(0, 50)}..."`}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={clearExample}
              className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-full transition-colors absolute top-3 right-3"
            >
              <X size={14} strokeWidth={3} />
            </motion.button>
          </div>
        )}
      </div>
    </ConfigCollapsibleShell>
  );
};
