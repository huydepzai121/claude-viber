import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/i18n/context';

import type { UpdateStatus } from '../electron';

export default function UpdateCheckFeedback() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
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
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const wrapperClasses =
    'pointer-events-none fixed top-14 right-0 left-0 z-40 flex justify-center px-4 [-webkit-app-region:no-drag]';
  const cardBase =
    'pointer-events-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md';

  // Show checking indicator
  if (status?.checking) {
    return (
      <div className={wrapperClasses}>
        <div
          className={`${cardBase} border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 shadow-black/30`}
        >
          <Loader2 className="h-4 w-4 animate-spin text-[var(--text-secondary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">{t('update.checking')}</p>
        </div>
      </div>
    );
  }

  // Show "no update available" message
  if (status?.lastCheckComplete && !status.updateAvailable && !status.error) {
    return (
      <div className={wrapperClasses}>
        <div
          className={`${cardBase} border-[var(--success)]/30 bg-[var(--bg-surface)]/95 text-[var(--text-primary)] shadow-black/30`}
        >
          <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
          <p className="text-sm font-semibold">{t('update.upToDate')}</p>
        </div>
      </div>
    );
  }

  // Show error message
  if (status?.lastCheckComplete && status.error) {
    return (
      <div className={wrapperClasses}>
        <div
          className={`${cardBase} border-[var(--error)]/30 bg-[var(--bg-surface)]/95 text-[var(--error)] shadow-black/30`}
        >
          <XCircle className="h-4 w-4 text-[var(--error)]" />
          <p className="text-sm font-semibold">{status.error}</p>
        </div>
      </div>
    );
  }

  return null;
}
