import { Question, LanguageCode, QuizSettings } from "../../types";
import { getDemoQuestionPool } from "../../constants/demoQuestions";
import { cleanAndParseJSON, prioritizeTextContent, scrambleTextContent } from "../../utils/textProcessing";
import { filterValidQuestions } from "../../utils/parseAiQuestions";
import { devWarn } from "../../utils/devLog";
import { dedupeQuestionsByStem } from "../../utils/questionSimilarity";
import { QUIZ_JSON_PROMPT_FLAG, LANGUAGE_NAMES } from "./constants";
import { runGeminiCli, type RunGeminiCliOptions } from "./cli";
import { TRANSLATIONS } from "../../constants/translations";
import {
  buildPersonaBlock,
  buildDifficultyBlock,
  buildStyleBlock,
  buildQualityRulesBlock,
  buildContextBlock,
  buildFocusBlock,
  buildOutputFormatBlock,
  buildIntraBatchUniquenessBlock,
  buildAvoidNearDuplicateStemsBlock,
} from "./quizPrompts";

const MAX_TOPUP_ATTEMPTS = 3;

export const generateQuizQuestions = async (
  pdfText: string,
  settings: QuizSettings,
  language: LanguageCode,
  failedQuestionsContext: Question[] = [],
  previousQuestions: Question[] = [],
  options?: RunGeminiCliOptions
): Promise<Question[]> => {
  const cancelledMsg = TRANSLATIONS[language].errors.generationCancelled;

  if (pdfText === "DEMO") {
    const pool = getDemoQuestionPool(language);
    const offset = previousQuestions.length;
    if (offset === 0) {
      const sig = options?.signal;
      await new Promise<void>((resolve, reject) => {
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
        }, 10000);
      });
    }
    const end = Math.min(offset + settings.questionCount, pool.length);
    return pool.slice(offset, end);
  }

  let processedText = pdfText;
  const focus = settings.focusTopic?.trim() ?? "";
  const failedSnippet = failedQuestionsContext.length > 0
    ? failedQuestionsContext.map(q => q.text).join(" ")
    : "";

  if (focus.length > 0) {
    processedText = prioritizeTextContent(pdfText, failedSnippet ? `${focus} ${failedSnippet}` : focus);
  } else if (failedSnippet.length > 0) {
    processedText = prioritizeTextContent(pdfText, failedSnippet);
  } else if (previousQuestions.length > 0) {
    processedText = scrambleTextContent(pdfText);
  }

  const MAX_CHARS = 100000;
  const truncatedText = processedText.length > MAX_CHARS
    ? processedText.slice(0, MAX_CHARS) + "\n...(truncated due to limits)"
    : processedText;

  const targetLang = LANGUAGE_NAMES[language];
  const questionCount = failedQuestionsContext.length > 0
    ? failedQuestionsContext.length
    : settings.questionCount;

  const buildQuizPrompt = (needCount: number, contextPrevious: Question[], extraBlocks: string[]) => {
    const sections = [
      buildPersonaBlock(targetLang),
      buildDifficultyBlock(settings.difficulty),
      buildStyleBlock(settings.style, needCount),
      buildQualityRulesBlock(targetLang),
      buildContextBlock(failedQuestionsContext, contextPrevious),
      buildFocusBlock(settings.focusTopic),
      buildIntraBatchUniquenessBlock(),
      ...extraBlocks,
      buildOutputFormatBlock(needCount, targetLang),
      settings.exampleText ? `### STYLE REFERENCE\nMimic this style: "${settings.exampleText}"` : "",
      `### SOURCE TEXT\n${truncatedText}`,
    ].filter(Boolean);
    return sections.join("\n\n");
  };

  try {
    let responseText = await runGeminiCli(
      settings.model,
      buildQuizPrompt(questionCount, previousQuestions, []),
      QUIZ_JSON_PROMPT_FLAG,
      options
    );
    let parsed = filterValidQuestions(cleanAndParseJSON(responseText));

    let { kept, removed } = dedupeQuestionsByStem(parsed);
    let allKept = kept.slice(0, questionCount);
    let lastRemoved = removed;

    let attempts = 0;
    while (allKept.length < questionCount && attempts < MAX_TOPUP_ATTEMPTS) {
      attempts++;
      const need = questionCount - allKept.length;
      const extraBlocks = [buildAvoidNearDuplicateStemsBlock(allKept, lastRemoved)];
      const contextPrevious = [...previousQuestions, ...allKept];

      responseText = await runGeminiCli(
        settings.model,
        buildQuizPrompt(need, contextPrevious, extraBlocks),
        QUIZ_JSON_PROMPT_FLAG,
        options
      );
      const moreParsed = filterValidQuestions(cleanAndParseJSON(responseText));
      const merged = dedupeQuestionsByStem([...allKept, ...moreParsed]);
      allKept = merged.kept.slice(0, questionCount);
      lastRemoved = merged.removed;
    }

    if (allKept.length < questionCount) {
      devWarn(
        `[generateQuizQuestions] Only ${allKept.length} unique stems after deduplication; requested ${questionCount}.`
      );
    }

    return allKept.map((q, i) => ({
      ...q,
      id: `q-${i + 1}`,
    }));
  } catch (error) {
    console.error("Gemini CLI Error:", error);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(cancelledMsg);
    }
    const msg = error instanceof Error ? error.message : "";
    if (/iptal edildi|kullanıcı tarafından|cancelled/i.test(msg)) {
      throw new Error(cancelledMsg);
    }
    let errorMsg = "Soru oluşturulamadı.";
    if (error instanceof Error) {
      if (error.message.includes("503")) errorMsg = "Servis yoğun, tekrar deneyin.";
      else errorMsg = `Hata: ${error.message}`;
    }
    throw new Error(errorMsg);
  }
};
