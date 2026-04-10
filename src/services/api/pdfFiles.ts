import { invoke } from '@tauri-apps/api/core';

export interface PdfFileInfo {
  fileName: string;
  sizeBytes: number;
}

export async function readPdfFileInfo(path: string): Promise<PdfFileInfo> {
  return invoke<PdfFileInfo>('read_pdf_file_info', { path });
}
