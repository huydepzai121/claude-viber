import { CheckCircle2, ChevronRight, Circle } from 'lucide-react';

import type { TodoWriteInput, ToolUseSimple } from '@/types/chat';

import { CollapsibleTool } from './CollapsibleTool';
import { ToolHeader } from './utils';

interface TodoWriteToolProps {
  tool: ToolUseSimple;
}

export default function TodoWriteTool({ tool }: TodoWriteToolProps) {
  const input = tool.parsedInput as TodoWriteInput;

  if (!input || !input.todos) {
    return (
      <div className="my-0.5">
        <ToolHeader tool={tool} toolName={tool.name} />
      </div>
    );
  }

  const completedCount = input.todos.filter((t) => t.status === 'completed').length;
  const totalCount = input.todos.length;

  const collapsedContent = (
    <div className="flex items-center gap-1.5">
      <ToolHeader tool={tool} toolName={tool.name} />
      <span className="text-[10px] text-[var(--text-disabled)]">
        {completedCount}/{totalCount} completed
      </span>
    </div>
  );

  const expandedContent = (
    <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30 px-2 py-1.5">
      <div className="space-y-1">
        {input.todos.map((todo, index) => (
          <div key={index} className="flex items-start gap-1.5 text-sm">
            <span className="mt-0.5 flex-shrink-0">
              {todo.status === 'completed' ?
                <CheckCircle2 className="size-3 text-[var(--success)]" />
              : todo.status === 'in_progress' ?
                <ChevronRight className="size-3 text-blue-400" />
              : <Circle className="size-3 text-[var(--text-disabled)]" />}
            </span>
            <span
              className={`${
                todo.status === 'completed' ?
                  'text-[var(--text-disabled)] line-through'
                : 'text-[var(--text-secondary)]'
              }`}
            >
              {todo.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return <CollapsibleTool collapsedContent={collapsedContent} expandedContent={expandedContent} />;
}
