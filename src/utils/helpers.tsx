
import { type FC, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export const glassCardClass =
  "bg-gradient-to-br from-white/60 to-white/20 dark:from-stone-950/70 dark:to-stone-900/30 backdrop-blur-xl md:backdrop-blur-2xl backdrop-saturate-150 " +
  "border border-white/50 border-b-white/20 border-r-white/20 dark:border-white/10 dark:border-b-white/5 dark:border-r-white/5 " +
  "shadow-2xl shadow-stone-800/10 dark:shadow-black/50 ring-1 ring-white/40 dark:ring-white/5";

/** Dış gradient çerçeve + derin gölge (Config: PDF / ayarlar panelleri) */
export const configPanel3dWrapClass =
  "rounded-[2rem] p-[1px] bg-gradient-to-br from-white/80 via-white/40 to-white/10 dark:from-white/20 dark:via-white/5 dark:to-transparent " +
  "shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]";

/** İç yüz: cam + inset highlight (üst kenar ışığı) */
export const configPanel3dInnerClass =
  "rounded-[calc(2rem-1px)] relative overflow-hidden flex flex-col min-h-0 " +
  "bg-gradient-to-br from-white/60 to-white/30 dark:from-stone-900/85 dark:to-stone-900/60 backdrop-blur-2xl backdrop-saturate-150 " +
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] " +
  "ring-1 ring-black/[0.02] dark:ring-white/[0.05]";

/** Config alt modüllerinde kart/accordion yüzeyi için ortak glass katman */
export const configSectionGlassClass =
  "rounded-3xl bg-gradient-to-br from-white/50 to-white/20 dark:from-stone-800/50 dark:to-stone-900/30 " +
  "backdrop-blur-lg backdrop-saturate-150 shadow-xl shadow-stone-900/5 dark:shadow-black/40 " +
  "border border-white/40 border-b-white/10 border-r-white/10 dark:border-stone-700/30 dark:border-b-transparent dark:border-r-transparent";

/** Input/select/textarea yüzeyi için ortak glass katman */
export const configInputGlassClass =
  "bg-white/40 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300 backdrop-blur-md backdrop-saturate-150 " +
  "border border-white/30 dark:border-stone-700/40 " +
  "shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] " +
  "transition-all duration-300 hover:bg-white/60 dark:hover:bg-stone-800/60 hover:border-white/50 dark:hover:border-stone-600/50 " +
  "focus-within:bg-white/80 dark:focus-within:bg-stone-800/70 focus-within:ring-2 focus-within:ring-sand-400/50 dark:focus-within:ring-sand-400/50 focus-within:border-transparent dark:focus-within:border-transparent";

// Satır içi kalın metinleri işler (**text**)
const parseInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export const formatText = (text: string) => {
  if (!text) return null;

  // 1. Temizlik ve Düzeltme Katmanı
  let clean = text
    // A. HTML Entity Decode
    .replace(/&uuml;/g, 'ü').replace(/&Uuml;/g, 'Ü')
    .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
    .replace(/&ccedil;/g, 'ç').replace(/&Ccedil;/g, 'Ç')
    .replace(/&gbreve;/g, 'ğ').replace(/&Gbreve;/g, 'Ğ')
    .replace(/&imath;/g, 'ı').replace(/&Idot;/g, 'İ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    
    // B. PDF Font Hataları Düzeltme
    .replace(/ő/g, 'ş')
    .replace(/ē/g, 'ğ')
    .replace(/ý/g, 'ı')
    .replace(/Þ/g, 'Ş')
    .replace(/ð/g, 'ğ')
    .replace(/Ý/g, 'İ')
    
    // C. UTF-8 Bozulmaları
    .replace(/Ã¼/g, 'ü').replace(/Ã¶/g, 'ö').replace(/Ã§/g, 'ç')
    .replace(/Ä±/g, 'ı').replace(/Ä°/g, 'İ').replace(/ÄŸ/g, 'ğ')
    .replace(/ÅŸ/g, 'ş').replace(/Å/g, 'Ş')

    // D. LaTeX Sembolleri
    .replace(/\$\\beta\$/g, 'β').replace(/\\beta/g, 'β')
    .replace(/\$\\alpha\$/g, 'α').replace(/\\alpha/g, 'α')
    .replace(/\$\\gamma\$/g, 'γ').replace(/\\gamma/g, 'γ')
    .replace(/\$\\delta\$/g, 'δ').replace(/\\delta/g, 'δ')
    .replace(/\$\\mu\$/g, 'μ').replace(/\\mu/g, 'μ')
    .replace(/\$\\sigma\$/g, 'σ').replace(/\\sigma/g, 'σ')
    .replace(/\$\\theta\$/g, 'θ').replace(/\\theta/g, 'θ')
    .replace(/\$\\lambda\$/g, 'λ').replace(/\\lambda/g, 'λ')
    .replace(/\$/g, '');

  // 2. Paragraflara böl (Satırları birleştir)
  // PDF'den gelen metinlerdeki gereksiz satır sonlarını (line break) boşluğa çeviriyoruz.
  const paragraphs = clean.split(/\n\s*\n/);

  return (
    <div className="flex flex-col gap-3 text-inherit w-full">
      {paragraphs.map((para, i) => {
        // Replace all newlines and multiple spaces with a single space
        const trimmed = para.trim().replace(/\s+/g, ' '); 
        if (!trimmed) return null;

        // Başlıklar (### Title veya ## Title)
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const content = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={i} className="font-bold text-sand-700 dark:text-sand-400 mt-2 mb-1 text-sm md:text-base border-b border-sand-200 dark:border-sand-800/40 pb-1">
              {parseInlineStyles(content)}
            </h4>
          );
        }

        // Listeler (* Item veya - Item)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
           const content = trimmed.replace(/^[\*\-]\s*/, '');
           return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-sand-500 shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              <span className="leading-relaxed">{parseInlineStyles(content)}</span>
            </div>
           )
        }

        // Normal Paragraf
        return (
            <p key={i} className="leading-relaxed whitespace-pre-wrap">
                {parseInlineStyles(trimmed)}
            </p>
        );
      })}
    </div>
  );
};

export const formatTimeDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ScrollReveal: FC<{ children: ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay }}
  >
    {children}
  </motion.div>
);
