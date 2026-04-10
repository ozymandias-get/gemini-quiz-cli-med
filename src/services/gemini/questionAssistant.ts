import { TRANSLATIONS } from '../../constants/translations';
import { type LanguageCode, type Question, ModelType } from '../../types';
import { CHAT_PROMPT_FLAG } from './constants';
import { runGeminiCli } from './cli';

export async function askQuestionAssistant(
  question: Question,
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  language: LanguageCode = 'tr'
) {
  const model = ModelType.FLASH_2_5;
  const correctAnswer = question.options[question.correctAnswerIndex];
  const historyUserLabel = language === 'en' ? 'Student' : 'Öğrenci';
  const historyModelLabel = language === 'en' ? 'Teacher' : 'Öğretmen';

  const promptBody = `
You are a friendly, patient, and highly knowledgeable medical tutor.
The student is reviewing a multiple-choice question and is asking you about it.

### QUESTION CONTEXT
- Question: "${question.text}"
- Options: ${question.options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join(', ')}
- Correct Answer: ${String.fromCharCode(65 + question.correctAnswerIndex)}) ${correctAnswer}
- Official Explanation: "${question.explanation}"

### YOUR MISSION
1. Explain the underlying pathophysiology or mechanism behind the student's confusion.
2. If they ask why an option is wrong, break down that distractor specifically.
3. Keep answers concise and clear.
4. Reply in ${language === 'tr' ? 'Türkçe' : 'English'}.
5. Use markdown formatting. Do NOT output JSON.

### CHAT HISTORY
${history.map((message) => `**${message.role === 'user' ? historyUserLabel : historyModelLabel}:** ${message.text}`).join('\n\n')}

### LATEST MESSAGE
**${historyUserLabel}:** ${newMessage}
  `.trim();

  const messages = TRANSLATIONS[language];
  try {
    const responseText = await runGeminiCli(model, CHAT_PROMPT_FLAG, promptBody, 'text');
    return responseText || messages.errors.generic;
  } catch {
    return messages.errors.chatUnavailable;
  }
}
