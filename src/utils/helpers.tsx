
import { type FC, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export const glassCardClass = "bg-white/70 dark:bg-stone-900/60 backdrop-blur-xl border border-white/60 dark:border-stone-700/50 shadow-2xl dark:shadow-stone-950/50";

/** Dış gradient çerçeve + derin gölge (Config: PDF / ayarlar panelleri) */
export const configPanel3dWrapClass =
  "rounded-[2rem] p-[1px] bg-gradient-to-br from-white/50 via-stone-100/40 to-stone-300/45 dark:from-white/12 dark:via-stone-700/35 dark:to-black/55 " +
  "shadow-[0_18px_50px_-14px_rgba(15,23,42,0.28),0_6px_20px_-8px_rgba(0,0,0,0.12)] " +
  "dark:shadow-[0_22px_56px_-12px_rgba(0,0,0,0.72),0_10px_28px_-10px_rgba(0,0,0,0.45)]";

/** İç yüz: cam + inset highlight (üst kenar ışığı) */
export const configPanel3dInnerClass =
  "rounded-[calc(2rem-1px)] relative overflow-hidden flex flex-col min-h-0 " +
  "bg-white/82 dark:bg-stone-900/72 backdrop-blur-xl " +
  "border border-white/55 dark:border-stone-600/35 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.04)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-2px_12px_rgba(0,0,0,0.35)] " +
  "ring-1 ring-black/[0.04] dark:ring-white/[0.07]";

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
            <h4 key={i} className="font-bold text-indigo-600 dark:text-indigo-400 mt-2 mb-1 text-sm md:text-base border-b border-indigo-100 dark:border-indigo-900/30 pb-1">
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
