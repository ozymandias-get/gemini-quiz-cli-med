import { z } from 'zod';
import type { Flashcard, LanguageCode, PreparedDocument, QuizSettings } from '../../types';
import { parseModelJson } from '../../utils/textProcessing';
import { FLASHCARD_JSON_PROMPT_FLAG, LANGUAGE_NAMES, MOCK_DEMO_FLASHCARDS } from './constants';
import { calculateGeminiTimeoutSecs, runGeminiCli, type RunGeminiCliOptions } from './cli';
import { TRANSLATIONS } from '../../constants/translations';
import { selectPreparedDocumentContext } from '../documentContext';

export async function generateFlashcards(
  pdfText: string,
  preparedDocument: PreparedDocument | null,
  settings: QuizSettings,
  language: LanguageCode,
  options?: RunGeminiCliOptions
): Promise<Flashcard[]> {
  const flashcardSchema = z.array(
    z.object({
      id: z.string().min(1),
      front: z.string().min(1),
      back: z.string().min(1),
    })
  );
  const cancelledMessage = TRANSLATIONS[language].errors.generationCancelled;

  if (pdfText === 'DEMO') {
    await new Promise<void>((resolve, reject) => {
      const signal = options?.signal;
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      let timer: ReturnType<typeof setTimeout>;
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, 1500);
    });
    return MOCK_DEMO_FLASHCARDS;
  }

  if (!preparedDocument) {
    throw new Error('PDF icerigi hazir degil. Lutfen dosyayi yeniden yukleyin.');
  }

  const targetLanguage = LANGUAGE_NAMES[language];
  const sourceText = selectPreparedDocumentContext(preparedDocument, {
    mode: 'flashcards',
    focusTopic: settings.focusTopic,
  });

  const promptBody = `
You are an expert in active recall and spaced repetition.
Your goal is to extract the 10 most critical concepts from the text and create high-yield flashcards.
All text must be written in ${targetLanguage}.

**Requirements:**
- Front: Short term, question, or concept (Max 10 words).
- Back: Concise definition or answer (Max 3 sentences).
- Avoid overly simple concepts.
- ${settings.focusTopic ? `Focus entirely on topics related to "${settings.focusTopic}".` : 'Cover the document broadly.'}

**Output:**
Return ONLY a JSON array like:
[ { "id": "fc-1", "front": "...", "back": "..." } ]

### SOURCE TEXT
${sourceText}
  `.trim();

  try {
    const responseText = await runGeminiCli(
      settings.model,
      FLASHCARD_JSON_PROMPT_FLAG,
      promptBody,
      'json',
      {
        ...options,
        timeoutSecs: calculateGeminiTimeoutSecs(FLASHCARD_JSON_PROMPT_FLAG, promptBody),
      }
    );
    return parseModelJson(responseText, flashcardSchema);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(cancelledMessage);
    }

    const message = error instanceof Error ? error.message : '';
    if (/cancelled|kullanici tarafindan|iptal edildi/i.test(message)) {
      throw new Error(cancelledMessage);
    }

    throw new Error('Calisma kartlari olusturulamadi.');
  }
}
