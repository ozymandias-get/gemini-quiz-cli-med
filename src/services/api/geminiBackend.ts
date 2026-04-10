import { invoke } from '@tauri-apps/api/core';
import type { GeminiCliStatusPayload, GeminiRunRequestPayload } from './types/geminiCli';

export async function fetchGeminiCliStatus(): Promise<GeminiCliStatusPayload> {
  return invoke<GeminiCliStatusPayload>('gemini_cli_status');
}

export async function geminiCliSetupAction(): Promise<void> {
  await invoke('gemini_cli_setup_action');
}

export async function abortGeminiRunCommand(): Promise<void> {
  try {
    await invoke('abort_gemini_run');
  } catch {
    /* ignore */
  }
}

export async function geminiRunCommand(req: GeminiRunRequestPayload): Promise<string> {
  return invoke<string>('gemini_run', { req });
}
