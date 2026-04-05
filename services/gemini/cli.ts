import { invoke } from '@tauri-apps/api/core';
import { useCliStatusStore } from '../../store/useCliStatusStore';

function isGeminiCliMissingMessage(msg: string): boolean {
  if (msg.includes('gemini veya npx bulunamadı')) return true;
  if (
    msg.includes('Gemini CLI başlatılamadı') &&
    (msg.includes('npx') || msg.includes('Kurulum') || msg.includes('kurulum'))
  ) {
    return true;
  }
  return false;
}

export type RunGeminiCliOptions = {
  /** İptal edildiğinde Rust tarafında `abort_gemini_run` çağrılır. */
  signal?: AbortSignal;
};

/** Tauri komutu: çalışan `gemini` CLI sürecini sonlandırır. */
export async function abortGeminiCliRun(): Promise<void> {
  try {
    await invoke('abort_gemini_run');
  } catch {
    // no-op — süreç yoksa veya zaten bittiyse
  }
}

export async function runGeminiCli(
  model: string,
  stdinContent: string,
  promptFlag: string,
  options?: RunGeminiCliOptions
): Promise<string> {
  const body = stdinContent.trim();
  const tail = promptFlag.trim();
  if (!body) throw new Error("İçerik boş; Gemini CLI'ye prompt gönderilmedi.");
  if (!tail) throw new Error("Son talimat boş.");

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
      req: { model: model.trim(), stdinContent: body, promptFlag: tail },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isGeminiCliMissingMessage(msg)) {
      useCliStatusStore.getState().markCliMissingFromRunError();
    }
    if (/not allowed|invoke|tauri|TAURI/i.test(msg)) {
      throw new Error("Bu özellik yalnızca Tauri masaüstü uygulamasında çalışır. `npm run tauri:dev` ile başlatın.");
    }
    throw e instanceof Error ? e : new Error(msg);
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}
