import type { AgentInput, ToolUseSimple } from '@/types/chat';

import { CollapsibleTool } from './CollapsibleTool';
import { ToolHeader } from './utils';

interface TaskToolProps {
  tool: ToolUseSimple;
}

export default function TaskTool({ tool }: TaskToolProps) {
  const input = tool.parsedInput as AgentInput;

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
      <span className="rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300">
        {input.subagent_type}
      </span>
      {input.model && (
        <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
          {input.model}
        </span>
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-1.5">
      {input.prompt && (
        <pre className="overflow-x-auto rounded bg-[var(--bg-elevated)]/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
          {input.prompt}
        </pre>
      )}

      {tool.result && (
        <pre className="overflow-x-auto rounded bg-[var(--bg-elevated)]/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
          {tool.result}
        </pre>
      )}
    </div>
  );

  return <CollapsibleTool collapsedContent={collapsedContent} expandedContent={expandedContent} />;
}
