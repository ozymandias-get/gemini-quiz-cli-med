import { invoke } from '@tauri-apps/api/core';
import type { PdfHybridServerConfig, PdfRuntimeStatus } from '../../types';

export async function pdfRuntimeStatus(): Promise<PdfRuntimeStatus> {
  return invoke<PdfRuntimeStatus>('pdf_runtime_status');
}

export async function pdfBootstrapRuntime(): Promise<PdfRuntimeStatus> {
  return invoke<PdfRuntimeStatus>('pdf_bootstrap_runtime');
}

export async function pdfHybridStart(config?: PdfHybridServerConfig): Promise<PdfRuntimeStatus> {
  return invoke<PdfRuntimeStatus>('pdf_hybrid_start', { config });
}

export async function pdfHybridStop(): Promise<PdfRuntimeStatus> {
  return invoke<PdfRuntimeStatus>('pdf_hybrid_stop');
}
