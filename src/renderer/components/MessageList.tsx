import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import type { CSSProperties, RefObject } from 'react';

import Message from '@/components/Message';
import { getRandomSuggestion } from '@/constants/chatSuggestions';
import { useTranslation } from '@/i18n/context';
import type { Message as MessageType } from '@/types/chat';

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  bottomPadding?: number;
}

const containerClasses = 'flex-1 overflow-y-auto bg-[var(--bg-primary)] px-3 py-3';

export default function MessageList({
  messages,
  isLoading,
  containerRef,
  bottomPadding
}: MessageListProps) {
  const containerStyle: CSSProperties | undefined =
    bottomPadding ? { paddingBottom: bottomPadding } : undefined;
  const { t } = useTranslation();

  const suggestion = useMemo(() => {
    if (messages.length === 0) {
      return getRandomSuggestion();
    }
    return '';
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        ref={containerRef}
        className={`relative flex ${containerClasses}`}
        style={containerStyle}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4">
          <div className="w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-8 text-center shadow-md shadow-black/20">
            <p className="text-[11px] font-semibold tracking-[0.35em] text-[var(--text-muted)] uppercase">
              {t('chat.emptyStateLabel')}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{suggestion}</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${containerClasses}`} style={containerStyle}>
      <div className="mx-auto max-w-3xl space-y-1.5">
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            isLoading={isLoading && index === messages.length - 1}
          />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)]">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{t('chat.streaming')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
