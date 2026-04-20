import AttachmentPreviewList from '@/components/AttachmentPreviewList';
import BlockGroup from '@/components/BlockGroup';
import Markdown from '@/components/Markdown';
import type { ContentBlock, Message as MessageType } from '@/types/chat';

interface MessageProps {
  message: MessageType;
  isLoading?: boolean;
}

export default function Message({ message, isLoading = false }: MessageProps) {
  if (message.role === 'user') {
    const userContent = typeof message.content === 'string' ? message.content : '';
    const hasText = userContent.trim().length > 0;
    const hasAttachments = Boolean(message.attachments?.length);
    const attachmentItems =
      message.attachments?.map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        isImage: attachment.isImage ?? attachment.mimeType.startsWith('image/'),
        previewUrl: attachment.previewUrl,
        footnoteLines: [attachment.relativePath ?? attachment.savedPath].filter(
          (line): line is string => Boolean(line)
        )
      })) ?? [];

    return (
      <div className="flex justify-end px-1">
        <article className="relative max-w-[min(34rem,calc(100%-2rem))] rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-raised)] px-3 py-2 text-base leading-relaxed text-[var(--text-primary)] shadow-sm shadow-black/20">
          {hasText && (
            <div className="prose prose-base max-w-none prose-invert">
              <Markdown>{userContent}</Markdown>
            </div>
          )}
          {hasAttachments && (
            <div className={hasText ? 'mt-2' : ''}>
              <AttachmentPreviewList attachments={attachmentItems} />
            </div>
          )}
        </article>
      </div>
    );
  }

  // Assistant message
  if (typeof message.content === 'string') {
    return (
      <div className="flex justify-start">
        <article className="w-full px-3 py-2">
          <div className="prose prose-base max-w-none text-base leading-relaxed prose-invert">
            <Markdown>{message.content}</Markdown>
          </div>
        </article>
      </div>
    );
  }

  // Group consecutive thinking/tool blocks together
  const groupedBlocks: (ContentBlock | ContentBlock[])[] = [];
  let currentGroup: ContentBlock[] = [];

  for (const block of message.content) {
    if (block.type === 'text') {
      if (currentGroup.length > 0) {
        groupedBlocks.push([...currentGroup]);
        currentGroup = [];
      }
      groupedBlocks.push(block);
    } else if (block.type === 'thinking' || block.type === 'tool_use') {
      currentGroup.push(block);
    }
  }

  if (currentGroup.length > 0) {
    groupedBlocks.push(currentGroup);
  }

  const lastBlockGroupIndex = groupedBlocks.findLastIndex((item) => Array.isArray(item));

  const hasIncompleteBlocks = message.content.some((block) => {
    if (block.type === 'thinking') {
      return !block.isComplete;
    }
    if (block.type === 'tool_use') {
      return !block.tool?.result;
    }
    return false;
  });

  const isStreaming = isLoading && hasIncompleteBlocks;

  return (
    <div className="flex justify-start">
      <article className="w-full px-3 py-2">
        <div className="space-y-3">
          {groupedBlocks.map((item, index) => {
            if (!Array.isArray(item)) {
              if (item.type === 'text' && item.text) {
                return (
                  <div
                    key={index}
                    className="prose prose-base max-w-none text-base leading-relaxed prose-invert"
                  >
                    <Markdown>{item.text}</Markdown>
                  </div>
                );
              }
              return null;
            }

            const isLatestActiveSection = index === lastBlockGroupIndex;
            const hasTextAfter =
              index < groupedBlocks.length - 1 &&
              groupedBlocks
                .slice(index + 1)
                .some((nextItem) => !Array.isArray(nextItem) && nextItem.type === 'text');

            return (
              <BlockGroup
                key={`group-${index}`}
                blocks={item}
                isLatestActiveSection={isLatestActiveSection}
                isStreaming={isStreaming}
                hasTextAfter={hasTextAfter}
              />
            );
          })}
        </div>
      </article>
    </div>
  );
}
