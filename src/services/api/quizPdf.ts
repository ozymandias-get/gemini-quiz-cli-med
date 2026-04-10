import { invoke } from '@tauri-apps/api/core';

export async function saveQuizPdf(defaultName: string, pdfBase64: string): Promise<string | null> {
  return invoke<string | null>('save_quiz_pdf', {
    defaultName,
    pdfBase64,
  });
}
