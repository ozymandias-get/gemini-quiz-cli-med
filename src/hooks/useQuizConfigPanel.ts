import { useState, useRef, type ChangeEvent } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

/** Accordion bölümleri ve örnek dosya yükleme — QuizConfigurationForm UI state'i (iş mantığı store'da). */
export function useQuizConfigPanel() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isUploadingExample, setIsUploadingExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadExampleReference = useSettingsStore((s) => s.uploadExampleReference);
  const clearExampleReference = useSettingsStore((s) => s.clearExampleReference);

  const toggleSection = (section: string) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const handleExampleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingExample(true);
    try {
      await uploadExampleReference(file);
    } finally {
      setIsUploadingExample(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearExample = () => {
    clearExampleReference();
  };

  return {
    activeSection,
    toggleSection,
    isUploadingExample,
    fileInputRef,
    handleExampleFile,
    clearExample,
  };
}
