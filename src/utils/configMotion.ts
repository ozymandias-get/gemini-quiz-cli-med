import type { Variants } from 'framer-motion';

/** Config ekranı üst konteyneri: alt öğeleri sırayla (stagger) gösterir. */
export const configContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

/** PDF yükleme ve ayar panelleri için ortak giriş animasyonu. */
export const configItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
};
