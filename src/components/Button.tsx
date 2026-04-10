
import { type FC, type ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass' | 'custom';
  fullWidth?: boolean;
  disableShimmer?: boolean;
  children?: ReactNode;
}

export const Button: FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  disableShimmer = false,
  className = '',
  ...props 
}) => {
  // Mobile: Daha büyük dokunma alanı (py-4), Desktop: Standart (md:py-3.5)
  const baseStyles = "px-5 py-3.5 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group text-sm md:text-base active:scale-95";
  
  const variants = {
    primary: "bg-stone-900 text-white shadow-lg shadow-stone-900/10 hover:bg-black dark:bg-sand-500 dark:text-stone-900 dark:hover:bg-sand-400 dark:shadow-sand-500/20",
    secondary: "bg-sand-500 text-white shadow-md shadow-sand-500/10 hover:bg-sand-600 dark:bg-stone-700 dark:text-white dark:hover:bg-stone-600",
    outline: "border-2 border-stone-200 bg-transparent text-stone-600 hover:border-stone-800 hover:text-stone-800 dark:border-stone-700 dark:text-stone-300 dark:hover:border-sand-500 dark:hover:text-sand-500",
    glass: "bg-gradient-to-br from-white/60 to-white/20 dark:from-white/10 dark:to-transparent backdrop-blur-md backdrop-saturate-150 border border-white/50 border-b-white/10 border-r-white/10 dark:border-white/10 dark:border-b-transparent dark:border-r-transparent text-stone-800 dark:text-stone-100 hover:from-white/80 hover:to-white/40 dark:hover:from-white/20 dark:hover:to-white/5 shadow-lg shadow-black/5 hover:shadow-black/10 dark:shadow-black/30 dark:hover:shadow-black/40 ring-1 ring-transparent hover:ring-white/50 dark:hover:ring-white/20 transition-all duration-300",
    custom: ""
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.96 }}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {!disableShimmer && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
      )}
    </motion.button>
  );
};
