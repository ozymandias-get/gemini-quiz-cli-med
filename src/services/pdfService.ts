import { invoke, isTauri } from '@tauri-apps/api/core';
import type {
  ExtractedPdfPage,
  OpenDataLoaderElement,
  PdfArtifact,
  PdfExtractionOptions,
  PreparedDocument,
  PreparedDocumentChunk,
  PreparedDocumentPage,
} from '../types';
import { sanitizePDFText } from '../utils/textProcessing';

const MIN_READABLE_TEXT_LENGTH = 50;
const DEFAULT_CHUNK_CHAR_BUDGET = 6000;

interface BackendPreparedPage {
  pageNumber: number;
  markdown: string;
  text: string;
  elementCount: number;
}

interface BackendArtifact {
  kind: string;
  path: string;
}

interface BackendExtractionResponse {
  markdown: string;
  text: string;
  jsonElements: Array<Record<string, unknown>>;
  pages: BackendPreparedPage[];
  images: string[];
  mode: 'local' | 'hybrid';
  artifacts: BackendArtifact[];
}

function normalizePdfText(text: string): string {
  return sanitizePDFText(
    text
      .replace(/\r\n/g, '\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\uFFFD/g, '')
      .normalize('NFKC')
  );
}

function buildChunkText(pages: PreparedDocumentPage[]): string {
  return pages.map((page) => `--- Page ${page.pageNumber} ---\n${page.markdown}`).join('\n\n').trim();
}

function buildPreparedDocumentChunks(
  pages: PreparedDocumentPage[],
  maxCharsPerChunk = DEFAULT_CHUNK_CHAR_BUDGET
): PreparedDocumentChunk[] {
  if (pages.length === 0) return [];

  const chunks: PreparedDocumentChunk[] = [];
  let pendingPages: PreparedDocumentPage[] = [];
  let pendingChars = 0;

  const flushPending = () => {
    if (pendingPages.length === 0) return;
    const text = buildChunkText(pendingPages);
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      pageStart: pendingPages[0].pageNumber,
      pageEnd: pendingPages[pendingPages.length - 1].pageNumber,
      text,
      charCount: text.length,
    });
    pendingPages = [];
    pendingChars = 0;
  };

  for (const page of pages) {
    const pageChars = page.markdown.length;
    if (pendingPages.length > 0 && pendingChars + pageChars > maxCharsPerChunk) {
      flushPending();
    }
    pendingPages.push(page);
    pendingChars += pageChars;

    if (pageChars >= maxCharsPerChunk) {
      flushPending();
    }
  }

  flushPending();
  return chunks;
}

function normalizeElement(raw: Record<string, unknown>): OpenDataLoaderElement {
  const rawPageNumber = raw['page number'] ?? raw.pageNumber;
  const rawBoundingBox = raw['bounding box'] ?? raw.boundingBox;
  const pageNumber =
    typeof rawPageNumber === 'number'
      ? rawPageNumber
      : typeof rawPageNumber === 'string'
        ? Number(rawPageNumber)
        : undefined;
  const boundingBox = Array.isArray(rawBoundingBox)
    ? rawBoundingBox.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : undefined;

  return {
    id: typeof raw.id === 'string' || typeof raw.id === 'number' ? raw.id : undefined,
    type: typeof raw.type === 'string' ? raw.type : 'unknown',
    pageNumber: pageNumber && Number.isFinite(pageNumber) ? pageNumber : undefined,
    content: typeof raw.content === 'string' ? raw.content : undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    boundingBox: boundingBox && boundingBox.length > 0 ? boundingBox : undefined,
    headingLevel:
      typeof raw['heading level'] === 'number'
        ? raw['heading level']
        : typeof raw.headingLevel === 'number'
          ? raw.headingLevel
          : undefined,
    raw,
  };
}

function normalizePreparedPages(pages: BackendPreparedPage[]): PreparedDocumentPage[] {
  return pages.map((page) => {
    const markdown = normalizePdfText(page.markdown);
    const text = normalizePdfText(page.text);
    return {
      pageNumber: page.pageNumber,
      markdown,
      text,
      searchText: normalizePdfText(`${markdown}\n${text}`),
      elementCount: page.elementCount,
    };
  });
}

function toExtractedPages(pageMap: PreparedDocumentPage[]): ExtractedPdfPage[] {
  return pageMap.map((page) => ({
    pageNumber: page.pageNumber,
    text: page.markdown,
    charCount: page.markdown.length,
  }));
}

export function buildPreparedDocumentFromExtraction(
  response: BackendExtractionResponse,
  extractionOptions: PdfExtractionOptions
): PreparedDocument {
  const pageMap = normalizePreparedPages(response.pages).filter((page) => page.markdown.trim().length > 0);
  const elements = response.jsonElements.map(normalizeElement);
  const markdown = normalizePdfText(response.markdown);
  const plainText = normalizePdfText(response.text);
  const fullText = pageMap.length > 0 ? buildChunkText(pageMap) : markdown;
  const chunks = buildPreparedDocumentChunks(pageMap);
  const pages = toExtractedPages(pageMap);
  const artifacts: PdfArtifact[] = response.artifacts.map((artifact) => ({
    kind: artifact.kind,
    path: artifact.path,
  }));

  return {
    pages,
    markdown,
    plainText,
    elements,
    pageMap,
    artifacts,
    sourceMode: response.mode,
    extractionOptions,
    chunks,
    fullText,
    totalChars: fullText.length,
  };
}

async function readFileAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function assertDesktopRuntime(): void {
  if (!isTauri()) {
    throw new Error("Bu ozellik yalnizca Tauri masaustu uygulamasinda calisir. `npm run tauri:dev` ile baslatin.");
  }
}

export async function preparePdfDocumentFromPath(
  path: string,
  extractionOptions: PdfExtractionOptions
): Promise<PreparedDocument> {
  assertDesktopRuntime();

  const response = await invoke<BackendExtractionResponse>('extract_pdf_document', {
    req: {
      path,
      options: extractionOptions,
      requestedFormats: ['markdown', 'json', 'text'],
    },
  });
  const preparedDocument = buildPreparedDocumentFromExtraction(response, extractionOptions);

  if (preparedDocument.fullText.trim().length < MIN_READABLE_TEXT_LENGTH) {
    throw new Error(
      'PDF metni okunamadi. Taranmis goruntuler icin hybrid OCR modunu acin veya secilebilir metin iceren bir PDF yukleyin.'
    );
  }

  return preparedDocument;
}

export async function preparePdfDocumentFromFile(
  file: File,
  extractionOptions: PdfExtractionOptions
): Promise<PreparedDocument> {
  assertDesktopRuntime();

  const base64 = await readFileAsBase64(file);
  const response = await invoke<BackendExtractionResponse>('extract_pdf_document_payload', {
    req: {
      fileName: file.name,
      base64,
      options: extractionOptions,
      requestedFormats: ['markdown', 'json', 'text'],
    },
  });
  const preparedDocument = buildPreparedDocumentFromExtraction(response, extractionOptions);

  if (preparedDocument.fullText.trim().length < MIN_READABLE_TEXT_LENGTH) {
    throw new Error(
      'PDF metni okunamadi. Taranmis goruntuler icin hybrid OCR modunu acin veya secilebilir metin iceren bir PDF yukleyin.'
    );
  }

  return preparedDocument;
}

export async function extractTextFromPDF(
  file: File,
  extractionOptions: PdfExtractionOptions
): Promise<string> {
  const preparedDocument = await preparePdfDocumentFromFile(file, extractionOptions);
  return preparedDocument.fullText;
}
