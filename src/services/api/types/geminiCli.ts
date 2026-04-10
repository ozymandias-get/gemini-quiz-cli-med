export interface GeminiCliStatusPayload {
  installed: boolean;
  version?: string | null;
  isDevBuild: boolean;
  isAuthenticated: boolean;
  isHeadlessReady: boolean;
  statusMessage?: string | null;
}

export type GeminiResponseMode = 'json' | 'text';

export interface GeminiRunRequestPayload {
  model: string;
  prompt: string;
  stdinContent: string | null;
  responseMode: GeminiResponseMode;
  timeoutSecs: number;
}
