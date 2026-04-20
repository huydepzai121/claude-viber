import { Clock, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Conversation } from '@/electron';
import { useTranslation } from '@/i18n/context';

const truncateText = (text: string, maxLength: number = 90) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
};

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversationId: string) => void;
  currentConversationId: string | null;
  onNewChat: () => void | Promise<void>;
}

export default function ChatHistoryDrawer({
  isOpen,
  onClose,
  onLoadConversation,
  currentConversationId,
  onNewChat
}: ChatHistoryDrawerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  const relativeTimeFormatter = useMemo(
    () =>
      new Intl.RelativeTimeFormat(undefined, {
        numeric: 'always'
      }),
    []
  );

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await window.electron.conversation.list();
      if (response.success && response.conversations) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm(t('chatHistory.deleteConfirm'))) {
      try {
        const response = await window.electron.conversation.delete(conversationId);
        if (response.success) {
          await loadConversations();
          if (conversationId === currentConversationId) {
            await onNewChat();
            onClose();
          }
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const handleNewChat = async () => {
    await onNewChat();
    onClose();
  };

  const conversationPreviews = useMemo(() => {
    return conversations.reduce<Record<string, string>>((acc, conversation) => {
      try {
        const parsed = JSON.parse(conversation.messages) as Array<{
          role: string;
          content: string | { type: string; text?: string }[];
        }>;
        let lastUserMessage: (typeof parsed)[0] | undefined;
        for (let i = parsed.length - 1; i >= 0; i--) {
          if (parsed[i].role === 'user') {
            lastUserMessage = parsed[i];
            break;
          }
        }
        if (lastUserMessage) {
          if (typeof lastUserMessage.content === 'string') {
            acc[conversation.id] = truncateText(lastUserMessage.content);
          } else if (Array.isArray(lastUserMessage.content)) {
            const textBlock = lastUserMessage.content.find(
              (block) => typeof block === 'object' && block !== null && 'text' in block
            );
            if (textBlock && typeof textBlock === 'object' && textBlock !== null) {
              acc[conversation.id] =
                'text' in textBlock && typeof textBlock.text === 'string' ?
                  truncateText(textBlock.text)
                : '';
            }
          }
        }
      } catch {
        acc[conversation.id] = '';
      }
      acc[conversation.id] = acc[conversation.id] || t('chatHistory.defaultPreview');
      return acc;
    }, {});
  }, [conversations, t]);

  const formatRelativeDate = useCallback(
    (timestamp: number) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return '';

      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes < 60) {
        const minutes = Math.max(1, diffMinutes);
        return relativeTimeFormatter.format(-minutes, 'minute');
      }

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return relativeTimeFormatter.format(-diffHours, 'hour');
      }

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) {
        return relativeTimeFormatter.format(-diffDays, 'day');
      }

      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return relativeTimeFormatter.format(-weeks, 'week');
      }

      const months = Math.floor(diffDays / 30);
      if (months < 12) {
        return relativeTimeFormatter.format(-months, 'month');
      }

      const years = Math.floor(months / 12);
      return relativeTimeFormatter.format(-years, 'year');
    },
    [relativeTimeFormatter]
  );

  return (
    <>
      <div
        className={`fixed top-14 left-4 z-40 h-[calc(100vh-4rem)] w-[360px] max-w-[calc(100vw-2rem)] transition-all duration-300 ease-out ${
          isOpen ?
            'pointer-events-auto translate-x-0 opacity-100'
          : 'pointer-events-none -translate-x-[calc(100%+1.5rem)] opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deepest)]/90 p-4 shadow-[0_20px_60px_-36px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all duration-300 ease-out">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/5 via-transparent to-transparent opacity-90" />
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t('chatHistory.title')}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">{t('chatHistory.subtitle')}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
                aria-label={t('chatHistory.closeDrawer')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
            >
              <Plus className="relative h-4 w-4" />
              <span className="relative">{t('chatHistory.newChat')}</span>
            </button>

            <div className="flex-1 overflow-y-auto">
              {isLoading ?
                <div className="flex h-full items-center justify-center">
                  <div className="text-sm text-[var(--text-muted)]">{t('chatHistory.loading')}</div>
                </div>
              : conversations.length === 0 ?
                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-muted)] shadow-sm shadow-black/10">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    {t('chatHistory.noConversations')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t('chatHistory.noConversationsHint')}
                  </p>
                </div>
              : <div className="space-y-2">
                  {conversations.map((conversation) => {
                    const isActive = conversation.id === currentConversationId;
                    return (
                      <div
                        key={conversation.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          onLoadConversation(conversation.id);
                          onClose();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onLoadConversation(conversation.id);
                            onClose();
                          }
                        }}
                        className={`group relative cursor-pointer rounded-lg border px-3 py-3 transition-colors duration-150 focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none ${
                          isActive ?
                            'border-[var(--accent)]/30 bg-[var(--bg-raised)] shadow-[0_4px_12px_-4px_rgba(139,92,246,0.15)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 hover:border-[var(--border-medium)] hover:bg-[var(--bg-surface)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {conversation.title}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                              {conversationPreviews[conversation.id]}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-disabled)]">
                              <Clock className="h-3 w-3" />
                              <span>{formatRelativeDate(conversation.updatedAt)}</span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(e, conversation.id)}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-transparent text-[var(--text-disabled)] opacity-0 transition-colors duration-150 group-hover:opacity-100 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--error)] focus:opacity-100 focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
                            aria-label={t('chatHistory.deleteConversation')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
