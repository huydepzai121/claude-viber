import type { ToolUseSimple, WebFetchInput } from '@/types/chat';

import { CollapsibleTool } from './CollapsibleTool';
import { ToolHeader } from './utils';

interface WebFetchToolProps {
  tool: ToolUseSimple;
}

export default function WebFetchTool({ tool }: WebFetchToolProps) {
  const input = tool.parsedInput as WebFetchInput;

  if (!input) {
    return (
      <div className="my-0.5">
        <ToolHeader tool={tool} toolName={tool.name} />
      </div>
    );
  }

  const collapsedContent = (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolHeader tool={tool} toolName={tool.name} />
      <a
        href={input.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 px-1.5 py-0.5 font-mono text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
      >
        {input.url}
      </a>
    </div>
  );

  const expandedContent = (
    <div className="space-y-1.5">
      {input.prompt && <div className="text-[10px] text-[var(--text-muted)]">{input.prompt}</div>}

      {tool.result && (
        <pre className="overflow-x-auto rounded bg-[var(--bg-elevated)]/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
          {tool.result}
        </pre>
      )}
    </div>
  );

  return <CollapsibleTool collapsedContent={collapsedContent} expandedContent={expandedContent} />;
}
