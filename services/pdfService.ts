import { getDocument } from 'pdfjs-dist';
import './pdfjsWorker';
import { MAX_PDF_PAGES } from '../constants/pdfLimits';
import { sanitizePDFText } from '../utils/textProcessing';

/**
 * Extracts text from a PDF file using PDF.js (bundled, no cross-origin CDN)
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  const originalWarn = console.warn;

  console.warn = (msg, ...args) => {
    if (typeof msg === 'string' && msg.includes('Knockout groups')) return;
    if (typeof msg === 'string' && msg.includes('TT:')) return;
    originalWarn(msg, ...args);
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;

    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(
        `Sayfa sınırı aşıldı. Maksimum ${MAX_PDF_PAGES} sayfalık belgeler desteklenmektedir.`
      );
    }

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += `--- Sayfa ${i} ---\n${pageText}\n\n`;
    }

    const sanitizedText = sanitizePDFText(
      fullText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\uFFFD/g, '')
        .normalize('NFKC')
        .replace(/-\s*\n\s*/g, '')
        .replace(/-\s+/g, '')
    );

    return sanitizedText;
  } catch (error) {
    console.error("PDF extraction failed:", error);

    if (error instanceof Error && error.message.includes('Sayfa sınırı')) {
      throw error;
    }

    const errName = error instanceof Error ? error.name : '';

    if (errName === 'PasswordException') {
      throw new Error("Bu PDF şifre ile korunuyor. Lütfen şifresiz bir dosya yükleyin.");
    }

    if (errName === 'InvalidPDFException') {
      throw new Error("Dosya bozuk veya geçerli bir PDF formatında değil.");
    }

    throw new Error("PDF metni okunamadı. Dosya taranmış görsellerden oluşuyor olabilir. Lütfen metin seçilebilen dijital bir PDF yükleyin.");
  } finally {
    console.warn = originalWarn;
  }
};
