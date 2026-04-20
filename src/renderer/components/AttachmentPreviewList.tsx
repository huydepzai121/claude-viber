import { Paperclip, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/i18n/context';
import { formatFileSize } from '@/utils/formatFileSize';

export interface AttachmentPreviewItem {
  id: string;
  name: string;
  size: number;
  isImage?: boolean;
  previewUrl?: string;
  footnoteLines?: string[];
}

interface AttachmentPreviewListProps {
  attachments: AttachmentPreviewItem[];
  onRemove?: (id: string) => void;
  className?: string;
  cardClassName?: string;
  imageDimensions?: string;
}

export default function AttachmentPreviewList({
  attachments,
  onRemove,
  className = '',
  cardClassName = '',
  imageDimensions = 'h-28 w-28'
}: AttachmentPreviewListProps) {
  const [previewErrorIds, setPreviewErrorIds] = useState<string[]>([]);
  const { t } = useTranslation();
  const previewErrorIdSet = useMemo(() => {
    const validIds = new Set(attachments.map((attachment) => attachment.id));
    return new Set(previewErrorIds.filter((id) => validIds.has(id)));
  }, [attachments, previewErrorIds]);

  const markPreviewError = (attachmentId: string) => {
    setPreviewErrorIds((prev) => (prev.includes(attachmentId) ? prev : [...prev, attachmentId]));
  };

  const handleRemove = (attachmentId: string) => {
    setPreviewErrorIds((prev) => prev.filter((id) => id !== attachmentId));
    onRemove?.(attachmentId);
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {attachments.map((attachment) => {
        const showImagePreview =
          attachment.isImage && attachment.previewUrl && !previewErrorIdSet.has(attachment.id);

        return (
          <div
            key={attachment.id}
            className={`relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm ${cardClassName}`}
          >
            {showImagePreview ?
              <div className={`relative overflow-hidden rounded-2xl ${imageDimensions}`}>
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="h-full w-full object-cover"
                  onError={() => markPreviewError(attachment.id)}
                  loading="lazy"
                />
                <div className="absolute inset-x-1 bottom-1 rounded-md bg-black/70 px-1 py-0.5 text-[10px] font-medium text-white/90">
                  <span className="block truncate">{attachment.name}</span>
                </div>
              </div>
            : <div className="flex min-w-[14rem] items-center gap-3 px-3 py-2">
                <div className="rounded-full bg-[var(--bg-raised)] p-2 text-[var(--text-secondary)]">
                  <Paperclip className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {attachment.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {formatFileSize(attachment.size)}
                  </p>
                  {attachment.footnoteLines?.map((line, index) => (
                    <p
                      key={`${attachment.id}-footnote-${index}`}
                      className="text-[11px] text-[var(--text-muted)]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            }
            {onRemove && (
              <button
                type="button"
                aria-label={`${t('attachments.remove')} ${attachment.name}`}
                onClick={() => handleRemove(attachment.id)}
                className="absolute top-1.5 right-1.5 rounded-full bg-[var(--bg-deepest)]/80 p-1 text-[var(--text-secondary)] shadow-sm transition hover:bg-[var(--bg-deepest)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
