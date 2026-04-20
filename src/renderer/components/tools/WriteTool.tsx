import { ExternalLink, Eye } from 'lucide-react';

import { useFilePreview } from '@/contexts/FilePreviewContext';
import type { ToolUseSimple, WriteInput } from '@/types/chat';
import { isPreviewable } from '@/utils/filePreview';

import { CollapsibleTool } from './CollapsibleTool';
import { FilePath, ToolHeader } from './utils';

interface WriteToolProps {
  tool: ToolUseSimple;
}

export default function WriteTool({ tool }: WriteToolProps) {
  const input = tool.parsedInput as WriteInput;
  const { openPreview } = useFilePreview();

  if (!input) {
    return (
      <div className="my-0.5">
        <ToolHeader tool={tool} toolName={tool.name} />
      </div>
    );
  }

  const canPreview = isPreviewable(input.file_path);

  const collapsedContent = (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolHeader tool={tool} toolName={tool.name} />
      <FilePath path={input.file_path} />
      {canPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openPreview(input.file_path);
          }}
          className="rounded p-0.5 text-[var(--text-disabled)] transition-colors hover:text-[var(--text-secondary)]"
          title="Preview"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.electron.file.openInDefaultApp(input.file_path).catch(() => {});
        }}
        className="rounded p-0.5 text-[var(--text-disabled)] transition-colors hover:text-[var(--text-secondary)]"
        title="Open in app"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const expandedContent = (
    <pre className="overflow-x-auto rounded bg-[var(--bg-elevated)]/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
      {input.content || ''}
    </pre>
  );

  return <CollapsibleTool collapsedContent={collapsedContent} expandedContent={expandedContent} />;
}
