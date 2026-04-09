import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatTimeDuration } from '../utils/helpers';

interface QuizTimerProps {
  startTime: number;
}

export const QuizTimer = ({ startTime }: QuizTimerProps) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return (
    <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 font-mono text-sm bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 shadow-sm">
      <Clock size={16} className="text-sand-500" />
      <span>{formatTimeDuration(elapsed)}</span>
    </div>
  );
};