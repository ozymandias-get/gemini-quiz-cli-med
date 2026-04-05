import { Question, LanguageCode, ModelType } from "../../types";
import { TRANSLATIONS } from "../../constants/translations";
import { CHAT_PROMPT_FLAG } from "./constants";
import { runGeminiCli } from "./cli";

export const askQuestionAssistant = async (
  question: Question,
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  language: LanguageCode = 'tr'
) => {
  const model = ModelType.FLASH_2_5;

  const correctAnswer = question.options[question.correctAnswerIndex];
  const historyUserLabel = language === 'en' ? 'Student' : 'Öğrenci';
  const historyModelLabel = language === 'en' ? 'Teacher' : 'Öğretmen';

  const systemInstruction = `
You are a friendly, patient, and highly knowledgeable medical tutor.
The student is reviewing a multiple-choice question and is asking you about it.

### QUESTION CONTEXT
- **Question:** "${question.text}"
- **Options:** ${question.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}
- **Correct Answer:** ${String.fromCharCode(65 + question.correctAnswerIndex)}) ${correctAnswer}
- **Official Explanation:** "${question.explanation}"

### YOUR MISSION
1. Explain the underlying pathophysiology or mechanism behind the student's area of confusion.
2. If they ask why an option is wrong, break down the distractor specifically.
3. Keep answers concise, clear, and encouraging.
4. Reply in ${language === 'tr' ? 'Turkish' : 'English'}.
5. Use markdown formatting (bold, bullet points). Do NOT output JSON.

### CHAT HISTORY
${history.map(m => `**${m.role === 'user' ? historyUserLabel : historyModelLabel}:** ${m.text}`).join('\n\n')}

### LATEST MESSAGE
**${historyUserLabel}:** ${newMessage}
  `.trim();

  const msg = TRANSLATIONS[language];
  try {
    const responseText = await runGeminiCli(model, systemInstruction, CHAT_PROMPT_FLAG);
    return responseText || msg.errors.generic;
  } catch (error) {
    console.error("Chatbot Error:", error);
    return msg.errors.chatUnavailable;
  }
};
