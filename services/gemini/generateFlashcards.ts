import { Flashcard, LanguageCode, QuizSettings } from "../../types";
import { cleanAndParseJSON, prioritizeTextContent } from "../../utils/textProcessing";
import { FLASHCARD_JSON_PROMPT_FLAG, LANGUAGE_NAMES, MOCK_DEMO_FLASHCARDS } from "./constants";
import { runGeminiCli, type RunGeminiCliOptions } from "./cli";
import { TRANSLATIONS } from "../../constants/translations";

export const generateFlashcards = async (
  pdfText: string,
  settings: QuizSettings,
  language: LanguageCode,
  options?: RunGeminiCliOptions
): Promise<Flashcard[]> => {
  const cancelledMsg = TRANSLATIONS[language].errors.generationCancelled;

  if (pdfText === "DEMO") {
    await new Promise<void>((resolve, reject) => {
      const sig = options?.signal;
      if (sig?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      let timer: ReturnType<typeof setTimeout>;
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      };
      sig?.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(() => {
        sig?.removeEventListener('abort', onAbort);
        resolve();
      }, 1500);
    });
    return MOCK_DEMO_FLASHCARDS;
  }

  let processedText = pdfText;
  if (settings.focusTopic) {
    processedText = prioritizeTextContent(pdfText, settings.focusTopic);
  }

  const MAX_CHARS = 80000;
  const truncatedText = processedText.length > MAX_CHARS
    ? processedText.slice(0, MAX_CHARS) + "\n...(truncated)"
    : processedText;

  const targetLang = LANGUAGE_NAMES[language];

  const promptText = `
You are an expert in active recall and spaced repetition.
Your goal is to extract the 10 most critical concepts from the text and create high-yield flashcards.
All text must be securely translated and written in ${targetLang}.

**Requirements:**
- Front: Short term, question, or concept (Max 10 words).
- Back: Concise definition or answer (Max 3 sentences).
- Avoid overly simple concepts (e.g., "What is a cell?").
- ${settings.focusTopic ? `Focus entirely on topics related to "${settings.focusTopic}".` : ''}

**Output:**
Return ONLY a JSON array like:
[ { "id": "fc-1", "front": "...", "back": "..." } ]

### SOURCE TEXT
${truncatedText}
`.trim();

  try {
    const responseText = await runGeminiCli(settings.model, promptText, FLASHCARD_JSON_PROMPT_FLAG, options);
    return cleanAndParseJSON(responseText);
  } catch (error) {
    console.error("Flashcard Gen Error:", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(cancelledMsg);
    }
    const msg = error instanceof Error ? error.message : "";
    if (/iptal edildi|kullanıcı tarafından|cancelled/i.test(msg)) {
      throw new Error(cancelledMsg);
    }
    throw new Error("Çalışma kartları oluşturulamadı.");
  }
};
