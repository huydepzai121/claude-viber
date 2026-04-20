import type { EditInput, ToolUseSimple } from '@/types/chat';

import { CollapsibleTool } from './CollapsibleTool';
import { FilePath, ToolHeader } from './utils';

interface EditToolProps {
  tool: ToolUseSimple;
}

export default function EditTool({ tool }: EditToolProps) {
  const input = tool.parsedInput as EditInput;

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
      <FilePath path={input.file_path} />
      {input.replace_all && (
        <span className="rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-300">
          replace all
        </span>
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-1.5">
      <pre className="overflow-x-auto rounded bg-red-950/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-red-300">
        {input.old_string || ''}
      </pre>

      <pre className="overflow-x-auto rounded bg-green-950/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-green-300">
        {input.new_string || ''}
      </pre>
    </div>
  );

  return <CollapsibleTool collapsedContent={collapsedContent} expandedContent={expandedContent} />;
}
