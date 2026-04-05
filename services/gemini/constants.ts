import { Flashcard, LanguageCode } from "../../types";

export const QUIZ_JSON_PROMPT_FLAG =
  "Yanıtın YALNIZCA geçerli bir JSON dizisi (array) olmalı; markdown kod bloğu, açıklama veya başka metin eklemeyin. Array dışında hiçbir şey yazmayın.";

export const FLASHCARD_JSON_PROMPT_FLAG =
  "Yanıtın YALNIZCA geçerli bir JSON dizisi [{ id, front, back }, ...] olmalı; markdown kod bloğu veya başka metin yok.";

export const CHAT_PROMPT_FLAG =
  "Son kullanıcı mesajına göre öğretmen yanıtını üret. Sadece düz metin ve markdown (###, **, maddeler) kullan; JSON kullanma.";

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  tr: "Türkçe",
  en: "English",
};

export const MOCK_DEMO_FLASHCARDS: Flashcard[] = [
  { id: "fc-1", front: "Mitoz Bölünme", back: "Tek bir ana hücreden genetik olarak birbirinin aynısı iki yavru hücrenin oluştuğu hücre bölünmesi." }
];
