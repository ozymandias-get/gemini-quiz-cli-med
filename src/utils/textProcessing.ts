import type { ZodType } from 'zod';
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

const MIN_FILTERED_TEXT_LEN = 600;

function buildFallbackText(fullText: string): string {
  const pages = fullText.split(/--- Sayfa \d+ ---/).filter(p => p.trim().length > 0);
  if (pages.length > 1) {
    return pages.slice(0, 5).join('\n\n--- Sayfa ---\n\n').trim();
  }
  return fullText.trim();
}

/**
 * Odak konusuna göre paragraf penceresi (önceki + eşleşen + sonraki) filtreleme.
 */
export function filterTextByFocusTopic(fullText: string, focusTopic: string): string {
  const source = fullText?.trim() ?? '';
  const focus = focusTopic?.trim() ?? '';
  if (!source || focus.length < 2) {
    return source;
  }

  const paragraphs = source
    .split(/\n{2,}|\r\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);
  const normalizedParagraphs = (paragraphs.length > 0
    ? paragraphs
    : source.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  );

  if (normalizedParagraphs.length === 0) {
    return buildFallbackText(source);
  }

  const terms = focus
    .toLowerCase()
    .split(/[\s,.;:!?()[\]{}"']+/)
    .map(t => t.trim())
    .filter(t => t.length > 1);
  if (terms.length === 0) {
    return buildFallbackText(source);
  }

  const matchedIndices = new Set<number>();
  normalizedParagraphs.forEach((paragraph, idx) => {
    const lower = paragraph.toLowerCase();
    if (terms.some(term => lower.includes(term))) {
      matchedIndices.add(idx);
      if (idx > 0) matchedIndices.add(idx - 1);
      if (idx < normalizedParagraphs.length - 1) matchedIndices.add(idx + 1);
    }
  });

  if (matchedIndices.size === 0) {
    return buildFallbackText(source);
  }

  const filtered = Array.from(matchedIndices)
    .sort((a, b) => a - b)
    .map(idx => normalizedParagraphs[idx])
    .join('\n\n')
    .trim();

  if (!filtered || (filtered.length < MIN_FILTERED_TEXT_LEN && source.length > MIN_FILTERED_TEXT_LEN * 2)) {
    return buildFallbackText(source);
  }

  return filtered;
}

/**
 * Helper to safely parse JSON from Gemini response which might include Markdown code blocks.
 */
function parseRawModelJson(text: string): unknown {
  if (!text) throw new Error('Boş yanıt.');
  const raw = text.trim();
  const normalize = (s: string) => s.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}').trim();
  const unwrapEnvelope = (parsed: unknown): unknown => {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return parsed;
    const obj = parsed as Record<string, unknown>;
    const response = obj.response;
    if (typeof response === 'string' && response.trim().length > 0) {
      return response.trim();
    }
    return parsed;
  };
  const coerceParsed = (parsed: unknown): unknown => {
    const unwrapped = unwrapEnvelope(parsed);
    if (typeof unwrapped === 'string') {
      const nested = tryParse(unwrapped);
      if (nested !== null) return nested;
      return [unwrapped];
    }
    parsed = unwrapped;
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object' && 'questions' in parsed && Array.isArray((parsed as { questions?: unknown[] }).questions)) {
      return (parsed as { questions: unknown[] }).questions;
    }
    if (parsed && typeof parsed === 'object' && 'items' in parsed && Array.isArray((parsed as { items?: unknown[] }).items)) {
      return (parsed as { items: unknown[] }).items;
    }
    return [parsed];
  };
  const tryParse = (candidate: string): unknown | null => {
    try {
      return coerceParsed(JSON.parse(normalize(candidate)) as unknown);
    } catch {
      return null;
    }
  };

  const direct = tryParse(raw);
  if (direct !== null) return direct;

  const fencedJsonBlocks = Array.from(raw.matchAll(/```json\s*([\s\S]*?)\s*```/gi));
  for (const match of fencedJsonBlocks) {
    const parsed = tryParse(match[1] ?? '');
    if (parsed !== null) return parsed;
  }

  const fencedBlocks = Array.from(raw.matchAll(/```(?:\w+)?\s*([\s\S]*?)\s*```/g));
  for (const match of fencedBlocks) {
    const parsed = tryParse(match[1] ?? '');
    if (parsed !== null) return parsed;
  }

  // Fallback: model may prepend commentary before a valid JSON payload.
  const starts: number[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '[' || ch === '{') starts.push(i);
  }
  for (const start of starts) {
    const parsed = tryParse(raw.slice(start));
    if (parsed !== null) return parsed;
  }

  throw new Error('AI yanıtı geçerli bir formatta değil. Lütfen tekrar deneyin.');
}

export function parseModelJson<T>(text: string, schema: ZodType<T>): T {
  let parsed: unknown;
  try {
    parsed = parseRawModelJson(text);
  } catch {
    throw new Error('AI yanıtı geçerli bir formatta değil. Lütfen tekrar deneyin.');
  }

  const validated = schema.safeParse(parsed);
  if (!validated.success) {
    throw new Error('AI yanıtı beklenen formatta değil. Lütfen tekrar deneyin.');
  }
  return validated.data;
}

export const cleanAndParseJSON = (text: string): unknown[] => {
  try {
    const parsed = parseRawModelJson(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    throw new Error('AI yanıtı geçerli bir formatta değil. Lütfen tekrar deneyin.');
  }
};
