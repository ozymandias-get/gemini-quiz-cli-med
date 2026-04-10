import { invoke } from '@tauri-apps/api/core';
import type { PdfExtractionOptions } from '../../types';
import type { BackendExtractionResponse } from './types/pdfBackend';

const REQUESTED_FORMATS = ['markdown', 'json', 'text'] as const;

export async function extractPdfDocumentFromPath(
  path: string,
  options: PdfExtractionOptions
): Promise<BackendExtractionResponse> {
  return invoke<BackendExtractionResponse>('extract_pdf_document', {
    req: {
      path,
      options,
      requestedFormats: [...REQUESTED_FORMATS],
    },
  });
}

export async function extractPdfDocumentFromPayload(
  fileName: string,
  base64: string,
  options: PdfExtractionOptions
): Promise<BackendExtractionResponse> {
  return invoke<BackendExtractionResponse>('extract_pdf_document_payload', {
    req: {
      fileName,
      base64,
      options,
      requestedFormats: [...REQUESTED_FORMATS],
    },
  });
}
