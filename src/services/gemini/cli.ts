import { invoke } from '@tauri-apps/api/core';
import { ModelType } from '../../types';

function isGeminiCliMissingMessage(message: string): boolean {
  return (
    message.includes('gemini komutu bulunamadi') ||
    message.includes('Gemini CLI baslatilamadi')
  );
}

export type GeminiResponseMode = 'json' | 'text';

export type RunGeminiCliOptions = {
  signal?: AbortSignal;
  timeoutSecs?: number;
};

const TEXT_BASE_TIMEOUT_SECS = 90;
const TEXT_MIN_TIMEOUT_SECS = 120;
const TEXT_MAX_TIMEOUT_SECS = 600;
const ALLOWED_MODELS = new Set<string>(Object.values(ModelType));

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateGeminiTimeoutSecs(prompt: string, stdinContent = ''): number {
  const dynamic = TEXT_BASE_TIMEOUT_SECS + ((prompt.length + stdinContent.length) / 1000) * 1.75;
  return Math.round(clamp(dynamic, TEXT_MIN_TIMEOUT_SECS, TEXT_MAX_TIMEOUT_SECS));
}

export async function abortGeminiCliRun(): Promise<void> {
  try {
    await invoke('abort_gemini_run');
  } catch {
    /* ignore */
  }
}

export async function runGeminiCli(
  model: string,
  prompt: string,
  stdinContent: string,
  responseMode: GeminiResponseMode,
  options?: RunGeminiCliOptions
): Promise<string> {
  const selectedModel = model.trim();
  if (!selectedModel) throw new Error('Model adi bos.');
  if (!ALLOWED_MODELS.has(selectedModel)) {
    throw new Error(`Gecersiz model: ${selectedModel}`);
  }

  const trimmedPrompt = prompt.trim();
  const trimmedStdin = stdinContent.trim();
  if (!trimmedPrompt && !trimmedStdin) {
    throw new Error("Icerik bos; Gemini CLI'ye prompt gonderilmedi.");
  }

  const signal = options?.signal;
  const onAbort = () => {
    void abortGeminiCliRun();
  };

  if (signal) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await invoke<string>('gemini_run', {
      req: {
        model: selectedModel,
        prompt: trimmedPrompt,
        stdinContent: trimmedStdin || null,
        responseMode,
        timeoutSecs: options?.timeoutSecs ?? calculateGeminiTimeoutSecs(trimmedPrompt, trimmedStdin),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isGeminiCliMissingMessage(message)) {
      throw new Error('Gemini CLI kurulu degil veya PATH icinde bulunamiyor.');
    }
    if (/authenticate|login|sign in|api key|credentials/i.test(message)) {
      throw new Error('Gemini CLI kimlik dogrulamasi hazir degil. Lutfen `gemini` komutuyla giris yapin.');
    }
    if (/not allowed|invoke|tauri/i.test(message)) {
      throw new Error("Bu ozellik yalnizca Tauri masaustu uygulamasinda calisir. `npm run tauri:dev` ile baslatin.");
    }
    throw error instanceof Error ? error : new Error(message);
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}
