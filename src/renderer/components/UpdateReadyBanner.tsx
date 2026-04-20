import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/i18n/context';

import type { UpdateStatus } from '../electron';

export default function UpdateReadyBanner() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    window.electron.update
      .getStatus()
      .then((initialStatus) => {
        setStatus(initialStatus);
      })
      .catch(() => {
        // Ignore errors in dev mode
      });

    const unsubscribe = window.electron.update.onStatusChanged((newStatus) => {
      setStatus((prevStatus) => {
        if (newStatus.readyToInstall && !prevStatus?.readyToInstall) {
          setIsDismissed(false);
        }
        return newStatus;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isDismissed || !status || !status.readyToInstall || status.error) {
    return null;
  }

  const handleInstall = async () => {
    await window.electron.update.install();
  };

  return (
    <div className="pointer-events-none fixed top-14 right-0 left-0 z-40 flex justify-center px-4 [-webkit-app-region:no-drag]">
      <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl border border-[var(--success)]/30 bg-[var(--bg-surface)]/95 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--success)]/15 text-[var(--success)]">
            <RefreshCw className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {t('update.ready')} {status.updateInfo?.version}
            </p>
            <p className="text-xs text-[var(--text-muted)]">{t('update.restartHint')}</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 rounded-full bg-[var(--success)] px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:brightness-110 focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('update.restartInstall')}
        </button>
      </div>
    </div>
  );
}
