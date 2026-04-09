import type { LanguageCode, PreparedDocument, Question, QuizSettings } from '../../types';
import { getDemoQuestionPool } from '../../constants/demoQuestions';
import { cleanAndParseJSON } from '../../utils/textProcessing';
import { filterValidQuestions } from '../../utils/parseAiQuestions';
import { devWarn } from '../../utils/devLog';
import { dedupeQuestionsByStem } from '../../utils/questionSimilarity';
import { QUIZ_JSON_PROMPT_FLAG, LANGUAGE_NAMES } from './constants';
import { calculateGeminiTimeoutSecs, runGeminiCli, type RunGeminiCliOptions } from './cli';
import { TRANSLATIONS } from '../../constants/translations';
import {
  buildContextBlock,
  buildDifficultyBlock,
  buildFocusBlock,
  buildIntraBatchUniquenessBlock,
  buildOutputFormatBlock,
  buildPersonaBlock,
  buildQualityRulesBlock,
  buildStyleBlock,
  buildAvoidNearDuplicateStemsBlock,
} from './quizPrompts';
import { selectPreparedDocumentContext } from '../documentContext';

const MAX_TOPUP_ATTEMPTS = 3;

function buildStructuredPrompt(promptBody: string): { prompt: string; stdinContent: string } {
  return {
    prompt: QUIZ_JSON_PROMPT_FLAG,
    stdinContent: promptBody,
  };
}

export async function generateQuizQuestions(
  pdfText: string,
  preparedDocument: PreparedDocument | null,
  settings: QuizSettings,
  language: LanguageCode,
  failedQuestionsContext: Question[] = [],
  previousQuestions: Question[] = [],
  options?: RunGeminiCliOptions
): Promise<Question[]> {
  const cancelledMessage = TRANSLATIONS[language].errors.generationCancelled;

  if (pdfText === 'DEMO') {
    const pool = getDemoQuestionPool(language);
    const offset = previousQuestions.length;
    if (offset === 0) {
      const signal = options?.signal;
      await new Promise<void>((resolve, reject) => {
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
        }, 10000);
      });
    }
    return pool.slice(offset, Math.min(offset + settings.questionCount, pool.length));
  }

  if (!preparedDocument) {
    throw new Error('PDF icerigi hazir degil. Lutfen dosyayi yeniden yukleyin.');
  }

  const targetLanguage = LANGUAGE_NAMES[language];
  const requestedCount = failedQuestionsContext.length > 0 ? failedQuestionsContext.length : settings.questionCount;

  const buildQuizPromptBody = (needCount: number, currentPreviousQuestions: Question[], extraBlocks: string[]) => {
    const sourceText = selectPreparedDocumentContext(preparedDocument, {
      mode: 'quiz',
      focusTopic: settings.focusTopic,
      failedQuestions: failedQuestionsContext,
      previousQuestions: currentPreviousQuestions,
    });

    const sections = [
      buildPersonaBlock(targetLanguage),
      buildDifficultyBlock(settings.difficulty),
      buildStyleBlock(settings.style, needCount),
      buildQualityRulesBlock(targetLanguage),
      buildContextBlock(failedQuestionsContext, currentPreviousQuestions),
      buildFocusBlock(settings.focusTopic),
      buildIntraBatchUniquenessBlock(),
      ...extraBlocks,
      buildOutputFormatBlock(needCount, targetLanguage),
      settings.exampleText ? `### STYLE REFERENCE\nMimic this style: "${settings.exampleText}"` : '',
      `### SOURCE TEXT\n${sourceText}`,
    ].filter(Boolean);

    return sections.join('\n\n');
  };

  try {
    const firstPromptBody = buildQuizPromptBody(requestedCount, previousQuestions, []);
    const firstPrompt = buildStructuredPrompt(firstPromptBody);
    const requestOptions: RunGeminiCliOptions = {
      ...options,
      timeoutSecs: calculateGeminiTimeoutSecs(firstPrompt.prompt, firstPrompt.stdinContent),
    };

    let responseText = await runGeminiCli(
      settings.model,
      firstPrompt.prompt,
      firstPrompt.stdinContent,
      'json',
      requestOptions
    );
    let parsedQuestions = filterValidQuestions(cleanAndParseJSON(responseText));

    let { kept, removed } = dedupeQuestionsByStem(parsedQuestions);
    let allKept = kept.slice(0, requestedCount);
    let lastRemoved = removed;

    let attempts = 0;
    while (allKept.length < requestedCount && attempts < MAX_TOPUP_ATTEMPTS) {
      attempts += 1;
      const neededCount = requestedCount - allKept.length;
      const extraBlocks = [buildAvoidNearDuplicateStemsBlock(allKept, lastRemoved)];
      const currentPreviousQuestions = [...previousQuestions, ...allKept];
      const topUpPromptBody = buildQuizPromptBody(neededCount, currentPreviousQuestions, extraBlocks);
      const topUpPrompt = buildStructuredPrompt(topUpPromptBody);

      responseText = await runGeminiCli(
        settings.model,
        topUpPrompt.prompt,
        topUpPrompt.stdinContent,
        'json',
        {
          ...options,
          timeoutSecs: calculateGeminiTimeoutSecs(topUpPrompt.prompt, topUpPrompt.stdinContent),
        }
      );

      const topUpQuestions = filterValidQuestions(cleanAndParseJSON(responseText));
      const merged = dedupeQuestionsByStem([...allKept, ...topUpQuestions]);
      allKept = merged.kept.slice(0, requestedCount);
      lastRemoved = merged.removed;
    }

    if (allKept.length < requestedCount) {
      devWarn(`[generateQuizQuestions] Only ${allKept.length} unique stems after deduplication; requested ${requestedCount}.`);
    }

    return allKept.map((question, index) => ({
      ...question,
      id: `q-${index + 1}`,
    }));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(cancelledMessage);
    }
    const message = error instanceof Error ? error.message : '';
    if (/cancelled|kullanici tarafindan|iptal edildi/i.test(message)) {
      throw new Error(cancelledMessage);
    }

    let errorMessage = 'Soru olusturulamadi.';
    if (error instanceof Error) {
      if (error.message.includes('503')) {
        errorMessage = 'Servis yogun, tekrar deneyin.';
      } else {
        errorMessage = `Hata: ${error.message}`;
      }
    }
    throw new Error(errorMessage);
  }
}
