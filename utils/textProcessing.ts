/**
 * PDF’den çıkan ham metni modele göndermeden önce sıkıştırır (token tasarrufu, gürültü azaltma).
 * — Yalnızca rakam içeren satırlar (sayfa numarası)
 * — Ardışık 3+ boşluk
 * — Ardışık 3+ boş satır (en fazla çift satır sonu)
 */
export function sanitizePDFText(text: string): string {
  let s = text;
  s = s.replace(/^\s*\d+\s*$/gm, '');
  s = s.replace(/ {3,}/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/**
 * Metni sayfa veya paragraflara böler.
 */
export const splitTextIntoChunks = (text: string): string[] => {
  // 1. Sayfa ayracına göre böl
  let chunks = text.split(/--- Sayfa \d+ ---/);
  // 2. Eğer ayraç yoksa veya çok az parça varsa paragraflara böl
  if (chunks.length <= 1) {
    chunks = text.split('\n\n');
  }
  return chunks.filter(c => c.trim().length > 0);
};

/**
 * "Farklı Sorularla Tekrarla" modu için metni karıştırır.
 * Yapay zeka genellikle metnin ilk %20'lik kısmına odaklanma eğilimindedir.
 */
export const scrambleTextContent = (fullText: string): string => {
  const chunks = splitTextIntoChunks(fullText);
  
  const cutPoint = Math.floor(chunks.length / 2);
  const firstHalf = chunks.slice(0, cutPoint);
  const secondHalf = chunks.slice(cutPoint);
  
  const newOrder = [...secondHalf.reverse(), ...firstHalf.reverse()];
  
  return newOrder.join('\n\n--- [YENİ BAĞLAM AKIŞI] ---\n\n');
};

/**
 * Odak konusuna göre metni önceliklendirir.
 */
export const prioritizeTextContent = (fullText: string, focusTopic: string): string => {
  if (!focusTopic || focusTopic.trim().length < 2) return fullText;

  const chunks = splitTextIntoChunks(fullText);
  const topicTerms = focusTopic.toLowerCase().split(' ').filter(t => t.length > 2);
  
  const scoredChunks = chunks.map(chunk => {
    const lowerChunk = chunk.toLowerCase();
    let score = 0;
    if (lowerChunk.includes(focusTopic.toLowerCase())) score += 100;
    topicTerms.forEach(term => {
      const count = lowerChunk.split(term).length - 1;
      score += count * 10;
    });
    return { content: chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.map(item => item.content).join('\n\n--- [ODAK BÖLÜMÜ] ---\n\n');
};

/**
 * Helper to safely parse JSON from Gemini response which might include Markdown code blocks.
 */
export const cleanAndParseJSON = (text: string) => {
    if (!text) throw new Error("Boş yanıt.");
    
    let jsonStr = text.trim();
    
    // Regex to find content inside ```json ... ``` or just ``` ... ```
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
        jsonStr = match[1];
    }

    // Common AI JSON errors cleanup
    jsonStr = jsonStr
      .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
      .replace(/,\s*}/g, "}"); // Remove trailing commas in objects
    
    // Attempt parsing
    try {
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed)) {
            if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
            if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
            return [parsed];
        }
        return parsed;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("Raw Text:", text);
        throw new Error("AI yanıtı geçerli bir formatta değil. Lütfen tekrar deneyin.");
    }
};
