import { Globe, History, Plus, Settings } from 'lucide-react';

import { useTranslation } from '@/i18n/context';

interface TitleBarProps {
  onOpenHistory?: () => void;
  onNewChat?: () => void;
  onOpenSettings?: () => void;
}

export default function TitleBar({ onOpenHistory, onNewChat, onOpenSettings }: TitleBarProps) {
  const isWindows = navigator.platform.toLowerCase().includes('win');
  const hasActions = onOpenHistory || onNewChat;
  const { t, language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  };

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-40 h-12 border-b border-[var(--border-subtle)] bg-[var(--bg-deepest)]/90 backdrop-blur-md [-webkit-app-region:drag]">
      <div
        className={`pointer-events-auto flex h-full items-center justify-between pr-3 sm:pr-4 ${
          isWindows ? 'pl-3 sm:pl-4' : 'pl-16 sm:pl-20'
        }`}
      >
        {hasActions ?
          <div className="flex items-center gap-2 [-webkit-app-region:no-drag]">
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] shadow-sm shadow-black/10 transition-colors hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
                title={t('titleBar.openChatHistory')}
                aria-label={t('titleBar.openChatHistory')}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">{t('titleBar.chats')}</span>
              </button>
            )}

            {onNewChat && (
              <button
                onClick={onNewChat}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm shadow-black/10 transition-colors hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
                title={t('titleBar.startNewChat')}
                aria-label={t('titleBar.startNewChat')}
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        : <div />}

        <div className="flex items-center gap-2 [-webkit-app-region:no-drag]">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-sm shadow-black/10 transition-colors hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
              title={t('titleBar.openSettings')}
              aria-label={t('titleBar.openSettings')}
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
            aria-label={t(
              language === 'en' ? 'titleBar.switchToVietnamese' : 'titleBar.switchToEnglish'
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            {language === 'en' ? 'EN' : 'VI'}
          </button>
        </div>
      </div>
    </div>
  );
}
