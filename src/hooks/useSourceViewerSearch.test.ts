import { describe, expect, it } from 'vitest';
import { normalizeSearch } from './useSourceViewerSearch';
import { needsPreparedDocumentRefresh } from '../store/usePdfRuntimeStore';
import type { PdfExtractionOptions } from '../types';

const baseOptions: PdfExtractionOptions = {
  sanitize: false,
  keepLineBreaks: false,
  useStructTree: true,
  includeHeaderFooter: false,
  detectStrikethrough: false,
  tableMethod: 'default',
  readingOrder: 'xycut',
  imageOutput: 'off',
  imageFormat: 'png',
  pages: '',
  hybrid: 'off',
  hybridMode: 'auto',
  hybridTimeout: '15000',
  hybridFallback: false,
  hybridUrl: '',
  outputHtml: false,
  outputAnnotatedPdf: false,
  hybridServer: {
    port: 5002,
    forceOcr: false,
    ocrLang: 'en',
    enrichFormula: false,
    enrichPictureDescription: false,
  },
};

describe('normalizeSearch', () => {
  it('normalizes punctuation and whitespace', () => {
    expect(normalizeSearch('  Mitoz,  BÖLÜNME! ', 'tr')).toBe('mitoz bölünme');
  });
});

describe('needsPreparedDocumentRefresh', () => {
  it('detects extraction setting changes', () => {
    expect(needsPreparedDocumentRefresh(baseOptions, baseOptions)).toBe(false);
    expect(
      needsPreparedDocumentRefresh(baseOptions, {
        ...baseOptions,
        hybrid: 'docling-fast',
      })
    ).toBe(true);
  });
});
