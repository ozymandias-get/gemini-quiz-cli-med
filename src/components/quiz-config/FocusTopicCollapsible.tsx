import { Microscope, Search } from 'lucide-react';
import type { FC } from 'react';
import type { QuizSettings } from '../../types';
import type { TranslationContent } from '../../constants/translations';
import { configInputGlassClass } from '../../utils/helpers';
import { ConfigCollapsibleShell } from './ConfigCollapsibleShell';

/** Odak konusu — accordion + arama alanı. */
export const FocusTopicCollapsible: FC<{
  t: TranslationContent;
  settings: QuizSettings;
  activeSection: string | null;
  toggleSection: (id: string) => void;
  updateSetting: <K extends keyof QuizSettings>(key: K, value: QuizSettings[K]) => void;
}> = ({ t, settings, activeSection, toggleSection, updateSetting }) => {
  const isOpen = activeSection === 'focus';
  return (
    <ConfigCollapsibleShell
      isOpen={isOpen}
      onToggle={() => toggleSection('focus')}
      icon={<Microscope size={17} />}
      title={t.focusTopic || 'Odak Konusu'}
      subtitle={settings.focusTopic || 'Belirli bir alt konuya odaklanın'}
    >
      <div className="p-4 pt-0">
        <div
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl focus-within:ring-2 focus-within:ring-sand-400/40 transition-all ${configInputGlassClass}`}
        >
          <Search size={16} className="text-stone-400 shrink-0" />
          <input
            type="text"
            placeholder={t.focusPlaceholder}
            value={settings.focusTopic}
            onChange={(e) => updateSetting('focusTopic', e.target.value)}
            className="w-full min-w-0 bg-transparent outline-none text-[13px] font-medium text-stone-800 dark:text-stone-300 placeholder:text-stone-400"
          />
        </div>
        <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 px-1 font-medium">{t.focusDesc}</p>
      </div>
    </ConfigCollapsibleShell>
  );
};
