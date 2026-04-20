import { Download, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/i18n/context';

import type { UpdateStatus } from '../electron';

const RELEASES_URL = 'https://github.com/pheuter/claude-agent-desktop/releases';

export default function UpdateNotification() {
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
        if (newStatus.updateAvailable && !prevStatus?.updateAvailable) {
          setIsDismissed(false);
        }
        return newStatus;
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (isDismissed || !status || !status.updateAvailable || status.error || status.readyToInstall) {
    return null;
  }

  const handleDownload = async () => {
    await window.electron.update.download();
  };

  const handleViewReleaseNotes = async () => {
    const version = status?.updateInfo?.version;
    const url = version ? `${RELEASES_URL}/tag/v${version}` : RELEASES_URL;
    await window.electron.shell.openExternal(url);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="pointer-events-none fixed top-14 right-0 left-0 z-40 flex justify-center px-4 [-webkit-app-region:no-drag]">
      <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-2.5 rounded-2xl border border-[var(--info)]/30 bg-[var(--bg-surface)]/95 px-3 py-2.5 shadow-lg shadow-black/30 backdrop-blur-md">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--info)]/15 text-[var(--info)]">
          <RefreshCw className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {t('update.available')} {status.updateInfo?.version}
            </p>
            <button
              onClick={handleViewReleaseNotes}
              className="flex items-center gap-1 text-xs text-[var(--info)] transition-colors hover:text-[var(--text-primary)]"
            >
              {t('update.whatsNew')}
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
          {status.downloading && (
            <div className="space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--info)]/20">
                <div
                  className="h-full rounded-full bg-[var(--info)] transition-all duration-300"
                  style={{ width: `${status.downloadProgress}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {t('update.downloading')} {Math.round(status.downloadProgress)}%
              </p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!status.downloading && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-full bg-[var(--info)] px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:brightness-110 focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
            >
              <Download className="h-3.5 w-3.5" />
              {t('update.download')}
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="rounded-full border border-[var(--border-subtle)] p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
            aria-label={t('update.dismiss')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
