import { ToggleLeft, ToggleRight } from 'lucide-react';
import type { FC } from 'react';
import { PDF_INTERACTIVE_SURFACE } from '../configChoiceClasses';

export interface PdfExtractionToggleProps {
  value: boolean;
  onChange: () => void;
  label: string;
}

export const PdfExtractionToggle: FC<PdfExtractionToggleProps> = ({ value, onChange, label }) => (
  <button
    type="button"
    onClick={onChange}
    className={`flex items-center justify-between rounded-2xl px-3 py-2 text-left text-[12px] font-medium ${PDF_INTERACTIVE_SURFACE} ${value ? 'ring-emerald-400/45 dark:ring-emerald-400/38' : ''}`}
  >
    <span>{label}</span>
    {value ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} className="text-stone-400" />}
  </button>
);
