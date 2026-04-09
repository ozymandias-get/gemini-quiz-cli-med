import { describe, expect, it } from 'vitest';
import { buildPreparedDocumentFromExtraction } from './pdfService';
import type { PdfExtractionOptions } from '../types';

const extractionOptions: PdfExtractionOptions = {
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

describe('buildPreparedDocumentFromExtraction', () => {
  it('normalizes markdown pages, elements, and chunks', () => {
    const prepared = buildPreparedDocumentFromExtraction(
      {
        markdown: '# Title\nBody',
        text: 'Title\nBody',
        jsonElements: [
          { type: 'heading', id: 1, pageNumber: 1, content: 'Title' },
          { type: 'paragraph', id: 2, pageNumber: 1, content: 'Body' },
        ],
        pages: [
          { pageNumber: 1, markdown: '# Title\nBody', text: 'Title\nBody', elementCount: 2 },
        ],
        images: [],
        mode: 'local',
        artifacts: [
          { kind: 'markdown', path: 'doc.md' },
          { kind: 'json', path: 'doc.json' },
          { kind: 'text', path: 'doc.txt' },
        ],
      },
      extractionOptions
    );

    expect(prepared.sourceMode).toBe('local');
    expect(prepared.pageMap).toHaveLength(1);
    expect(prepared.elements).toHaveLength(2);
    expect(prepared.pages[0].text).toContain('# Title');
    expect(prepared.fullText).toContain('--- Page 1 ---');
    expect(prepared.chunks[0].pageStart).toBe(1);
    expect(prepared.artifacts.map((artifact) => artifact.kind)).toEqual(['markdown', 'json', 'text']);
  });
});
