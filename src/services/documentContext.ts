import type { PreparedDocument, PreparedDocumentChunk, Question } from '../types';

type DocumentContextMode = 'quiz' | 'flashcards';

interface SelectDocumentContextOptions {
  mode: DocumentContextMode;
  focusTopic?: string;
  failedQuestions?: Question[];
  previousQuestions?: Question[];
}

const QUIZ_MAX_CHUNKS = 4;
const QUIZ_MAX_CHARS = 18000;
const FLASHCARD_MAX_CHUNKS = 6;
const FLASHCARD_MAX_CHARS = 24000;

function tokenize(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);
}

function countTermHits(haystack: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  let total = 0;
  for (const term of terms) {
    let cursor = 0;
    while (cursor < haystack.length) {
      const foundIndex = haystack.indexOf(term, cursor);
      if (foundIndex === -1) break;
      total += 1;
      cursor = foundIndex + term.length;
    }
  }
  return total;
}

function getSpreadIndices(totalChunks: number, desiredCount: number): number[] {
  if (totalChunks <= desiredCount) {
    return Array.from({ length: totalChunks }, (_, index) => index);
  }

  const indices = new Set<number>();
  for (let slot = 0; slot < desiredCount; slot += 1) {
    const ratio = desiredCount === 1 ? 0 : slot / (desiredCount - 1);
    indices.add(Math.round(ratio * (totalChunks - 1)));
  }

  return Array.from(indices).sort((a, b) => a - b);
}

function buildChunkOrder(
  chunks: PreparedDocumentChunk[],
  options: SelectDocumentContextOptions
): PreparedDocumentChunk[] {
  if (chunks.length === 0) return [];

  const previousQuestions = options.previousQuestions ?? [];
  const failedQuestions = options.failedQuestions ?? [];
  const focusTerms = tokenize(options.focusTopic);
  const failedTerms = tokenize(failedQuestions.map((question) => question.text).join(' '));
  const hasSearchTerms = focusTerms.length > 0 || failedTerms.length > 0;

  if (!hasSearchTerms) {
    if (options.mode === 'flashcards') {
      return getSpreadIndices(chunks.length, FLASHCARD_MAX_CHUNKS).map((index) => chunks[index]);
    }

    const rotation = previousQuestions.length > 0 ? previousQuestions.length % chunks.length : 0;
    return [...chunks.slice(rotation), ...chunks.slice(0, rotation)];
  }

  const rotation = previousQuestions.length > 0 ? previousQuestions.length % chunks.length : 0;
  const scored = chunks.map((chunk, index) => {
    const haystack = chunk.text.toLowerCase();
    const focusScore = countTermHits(haystack, focusTerms) * 12;
    const failedScore = countTermHits(haystack, failedTerms) * 7;
    const distanceFromRotation = ((index - rotation) + chunks.length) % chunks.length;
    return {
      chunk,
      score: focusScore + failedScore,
      distanceFromRotation,
      index,
    };
  });

  scored.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (left.distanceFromRotation !== right.distanceFromRotation) {
      return left.distanceFromRotation - right.distanceFromRotation;
    }
    return left.index - right.index;
  });

  return scored.map((entry) => entry.chunk);
}

export function selectPreparedDocumentContext(
  preparedDocument: PreparedDocument,
  options: SelectDocumentContextOptions
): string {
  const maxChunks = options.mode === 'flashcards' ? FLASHCARD_MAX_CHUNKS : QUIZ_MAX_CHUNKS;
  const maxChars = options.mode === 'flashcards' ? FLASHCARD_MAX_CHARS : QUIZ_MAX_CHARS;
  const orderedChunks = buildChunkOrder(preparedDocument.chunks, options);

  const selectedChunks: PreparedDocumentChunk[] = [];
  let totalChars = 0;

  for (const chunk of orderedChunks) {
    if (selectedChunks.length >= maxChunks) break;

    const nextCharCount = totalChars + chunk.charCount;
    if (selectedChunks.length > 0 && nextCharCount > maxChars) continue;

    selectedChunks.push(chunk);
    totalChars = nextCharCount;
  }

  if (selectedChunks.length === 0 && preparedDocument.chunks.length > 0) {
    selectedChunks.push(preparedDocument.chunks[0]);
  }

  return selectedChunks.map((chunk) => chunk.text).join('\n\n');
}
