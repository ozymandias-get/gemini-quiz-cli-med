import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppStep } from '../types';
import { useRoutingStore } from '../store/useRoutingStore';
import { useQuizSessionStore } from '../store/useQuizSessionStore';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function readStoredDarkMode(): boolean {
  try {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? savedMode === 'true' : true;
  } catch {
    return true;
  }
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidMount(): void {
    this.syncDarkFromStorage();
  }

  componentDidUpdate(_prevProps: Props, prevState: State): void {
    if (!prevState.hasError && this.state.hasError) {
      this.syncDarkFromStorage();
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('AppErrorBoundary:', error, errorInfo.componentStack);
  }

  private syncDarkFromStorage(): void {
    const html = document.documentElement;
    if (readStoredDarkMode()) html.classList.add('dark');
    else html.classList.remove('dark');
  }

  /** Yönlendirmeyi sıfırla, kalıcı sınav oturumunu temizle, tam yenileme ile temiz React ağacı. */
  private handleRestart = (): void => {
    try {
      useRoutingStore.getState().setStep(AppStep.LANDING);
      useQuizSessionStore.persist.clearStorage();
    } catch {
      /* localStorage / persist kullanılamıyorsa yine de yenile */
    }
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    if (hasError && error) {
      const summary =
        error.message.length > 280 ? `${error.message.slice(0, 280)}…` : error.message;

      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-cream-50 px-4 dark:bg-[#171412]">
          <div className="w-full max-w-md rounded-2xl border border-stone-200/90 bg-white/80 p-6 shadow-lg backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/50">
            <h1 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              Bir şeyler ters gitti
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Uygulama beklenmedik bir hatayla karşılaştı. Aşağıdaki özeti geliştiricilerle
              paylaşabilir veya uygulamayı yeniden başlatabilirsiniz.
            </p>
            <p
              className="mt-4 max-h-24 overflow-y-auto break-words rounded-lg bg-cream-100/80 px-3 py-2 font-mono text-xs text-stone-500 dark:bg-stone-800/80 dark:text-stone-400"
              title={error.message}
            >
              {summary}
            </p>
            <div className="mt-6">
              <Button type="button" variant="primary" fullWidth onClick={this.handleRestart}>
                Uygulamayı Yeniden Başlat
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
