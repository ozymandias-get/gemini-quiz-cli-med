import { ModelType } from '../../types';
import { abortGeminiRunCommand, geminiRunCommand } from '../api/geminiBackend';
import type { GeminiResponseMode } from '../api/types/geminiCli';

function isGeminiCliMissingMessage(message: string): boolean {
  return (
    message.includes('gemini komutu bulunamadı') ||
    message.includes('Gemini CLI başlatılamadı')
  );
}

export type { GeminiResponseMode };

export type RunGeminiCliOptions = {
  signal?: AbortSignal;
  timeoutSecs?: number;
};

const TEXT_BASE_TIMEOUT_SECS = 120;
const TEXT_MIN_TIMEOUT_SECS = 180;
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
  await abortGeminiRunCommand();
}

export async function runGeminiCli(
  model: string,
  prompt: string,
  stdinContent: string,
  responseMode: GeminiResponseMode,
  options?: RunGeminiCliOptions
): Promise<string> {
  const selectedModel = model.trim();
  if (!selectedModel) throw new Error('Model adı boş.');
  if (!ALLOWED_MODELS.has(selectedModel)) {
    throw new Error(`Geçersiz model: ${selectedModel}`);
  }

  const trimmedPrompt = prompt.trim();
  const trimmedStdin = stdinContent.trim();
  if (!trimmedPrompt && !trimmedStdin) {
    throw new Error("İçerik boş; Gemini CLI'ye prompt gönderilmedi.");
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
    return await geminiRunCommand({
      model: selectedModel,
      prompt: trimmedPrompt,
      stdinContent: trimmedStdin || null,
      responseMode,
      timeoutSecs: options?.timeoutSecs ?? calculateGeminiTimeoutSecs(trimmedPrompt, trimmedStdin),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isGeminiCliMissingMessage(message)) {
      throw new Error('Gemini CLI kurulu değil veya PATH içinde bulunamıyor.');
    }
    if (/authenticate|login|sign in|api key|credentials/i.test(message)) {
      throw new Error('Gemini CLI kimlik doğrulaması hazır değil. Lütfen `gemini` komutuyla giriş yapın.');
    }
    if (/not allowed|invoke|tauri/i.test(message)) {
      throw new Error("Bu özellik yalnızca Tauri masaüstü uygulamasında çalışır. `npm run tauri:dev` ile başlatın.");
    }
    throw error instanceof Error ? error : new Error(message);
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}
