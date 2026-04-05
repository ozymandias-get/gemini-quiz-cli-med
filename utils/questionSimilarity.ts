import { Question } from "../types";

/** Jaccard similarity on token sets; ignores 1-char tokens. */
export const STEM_SIMILARITY_THRESHOLD = 0.78;

export function normalizeStem(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(normalized: string): Set<string> {
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);
  return new Set(words);
}

function jaccardWords(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) {
    if (B.has(w)) inter++;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function diceBigrams(normalized: string): string[] {
  if (normalized.length < 2) return normalized.length === 0 ? [] : [normalized];
  const bigrams: string[] = [];
  for (let i = 0; i < normalized.length - 1; i++) {
    bigrams.push(normalized.slice(i, i + 2));
  }
  return bigrams;
}

function diceCoefficientBigrams(a: string, b: string): number {
  const ba = diceBigrams(a);
  const bb = diceBigrams(b);
  if (ba.length === 0 && bb.length === 0) return 1;
  if (ba.length === 0 || bb.length === 0) return 0;
  const count = new Map<string, number>();
  for (const x of ba) count.set(x, (count.get(x) ?? 0) + 1);
  let inter = 0;
  for (const x of bb) {
    const c = count.get(x);
    if (c && c > 0) {
      inter++;
      count.set(x, c - 1);
    }
  }
  return (2 * inter) / (ba.length + bb.length);
}

/** 0–1; higher means more similar. Uses max(Jaccard words, Dice bigrams). */
export function stemSimilarity(a: string, b: string): number {
  const na = normalizeStem(a);
  const nb = normalizeStem(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return Math.max(jaccardWords(na, nb), diceCoefficientBigrams(na, nb));
}

export function dedupeQuestionsByStem(
  questions: Question[],
  threshold: number = STEM_SIMILARITY_THRESHOLD
): { kept: Question[]; removed: Question[] } {
  const kept: Question[] = [];
  const removed: Question[] = [];

  for (const q of questions) {
    const stem = q.text ?? "";
    let duplicate = false;
    for (const k of kept) {
      if (stemSimilarity(stem, k.text ?? "") >= threshold) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) removed.push(q);
    else kept.push(q);
  }

  return { kept, removed };
}
