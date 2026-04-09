import type { ElementType } from 'react';
import {
  CheckSquare,
  Ban,
  ListChecks,
  ArrowDownUp,
  MoreHorizontal,
  Lightbulb,
  ArrowRightLeft,
  Layers,
} from 'lucide-react';
import { QuestionStyle } from '../../types';

/** Soru stili → ikon eşlemesi; grid bileşeninde tekrar kullanılır. */
export const styleIcons: Record<QuestionStyle, ElementType> = {
  [QuestionStyle.CLASSIC]: CheckSquare,
  [QuestionStyle.NEGATIVE]: Ban,
  [QuestionStyle.STATEMENT]: ListChecks,
  [QuestionStyle.ORDERING]: ArrowDownUp,
  [QuestionStyle.FILL_BLANK]: MoreHorizontal,
  [QuestionStyle.REASONING]: Lightbulb,
  [QuestionStyle.MATCHING]: ArrowRightLeft,
  [QuestionStyle.MIXED]: Layers,
};
