import { useMemo, useState } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { geminiCliSetupAction } from '../services/api/geminiBackend';
import { useCliStatusStore } from '../store/useCliStatusStore';

export function useGeminiCliPanel() {
  const [cliSetupBusy, setCliSetupBusy] = useState(false);
  const cliStatus = useCliStatusStore((state) => state.cliStatus);
  const cliLoading = useCliStatusStore((state) => state.cliCheckLoading);
  const checkCliStatus = useCliStatusStore((state) => state.checkCliStatus);
  const inTauri = typeof window !== 'undefined' && isTauri();

  const handleGeminiCliSetup = async () => {
    if (!inTauri) return;
    setCliSetupBusy(true);
    try {
      await geminiCliSetupAction();
      if (!cliStatus.isDevBuild) {
        await checkCliStatus({ force: true });
      }
    } finally {
      setCliSetupBusy(false);
    }
  };

  const showDevSetupButton = useMemo(() => Boolean(cliStatus.isDevBuild), [cliStatus.isDevBuild]);
  const showReleaseInstallButton = useMemo(
    () => Boolean(cliStatus.isChecked && !cliStatus.isDevBuild && !cliStatus.isHeadlessReady),
    [cliStatus.isChecked, cliStatus.isDevBuild, cliStatus.isHeadlessReady]
  );

  return {
    cliStatus,
    cliLoading,
    cliSetupBusy,
    inTauri,
    checkCliStatus,
    handleGeminiCliSetup,
    showDevSetupButton,
    showReleaseInstallButton,
  };
}
