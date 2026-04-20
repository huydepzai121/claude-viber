import { Eye } from 'lucide-react';

import { useFilePreview } from '@/contexts/FilePreviewContext';
import type { ReadInput, ToolUseSimple } from '@/types/chat';
import { isPreviewable } from '@/utils/filePreview';

import { CollapsibleTool } from './CollapsibleTool';
import { FilePath, ToolHeader } from './utils';

interface ReadToolProps {
  tool: ToolUseSimple;
}

export default function ReadTool({ tool }: ReadToolProps) {
  const input = tool.parsedInput as ReadInput;
  const { openPreview } = useFilePreview();

  if (!input) {
    return (
      <div className="my-0.5">
        <ToolHeader tool={tool} toolName={tool.name} />
      </div>
    );
  }

  const canPreview = tool.result && isPreviewable(input.file_path);

  const collapsedContent = (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolHeader tool={tool} toolName={tool.name} />
      <FilePath path={input.file_path} />
      {input.offset !== undefined && (
        <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--text-disabled)] uppercase">
          offset {input.offset}
        </span>
      )}
      {input.limit !== undefined && (
        <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[var(--text-disabled)] uppercase">
          limit {input.limit}
        </span>
      )}
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
    </div>
  );

  const expandedContent =
    tool.result ?
      <pre className="max-h-72 overflow-x-auto rounded bg-[var(--bg-elevated)]/50 px-2 py-1 font-mono text-sm wrap-break-word whitespace-pre-wrap text-[var(--text-secondary)]">
        {tool.result}
      </pre>
    : null;

  return <CollapsibleTool collapsedContent={collapsedContent} expandedContent={expandedContent} />;
}
