import { Eye } from 'lucide-react';
import { useMemo } from 'react';

import { useFilePreview } from '@/contexts/FilePreviewContext';
import type { BashInput, ToolUseSimple } from '@/types/chat';
import { isPreviewable } from '@/utils/filePreview';

import { CollapsibleTool } from './CollapsibleTool';
import { ToolHeader } from './utils';

const FILE_PATH_REGEX =
  /(?:wrote|created|saved|output|generated|writing)[:\s]+([/~][^\s\n"']+\.[a-z]{2,6})/gi;

function detectFiles(result: string | undefined): string[] {
  if (!result) return [];
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  FILE_PATH_REGEX.lastIndex = 0;
  while ((match = FILE_PATH_REGEX.exec(result)) !== null) {
    const path = match[1];
    if (isPreviewable(path) && !matches.includes(path)) {
      matches.push(path);
    }
  }
  return matches;
}

interface BashToolProps {
  tool: ToolUseSimple;
}

export default function BashTool({ tool }: BashToolProps) {
  const input = tool.parsedInput as BashInput;
  const { openPreview } = useFilePreview();
  const detectedFiles = useMemo(() => detectFiles(tool.result), [tool.result]);

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
      {input.run_in_background && (
        <span className="rounded border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-blue-300 uppercase">
          background
        </span>
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-1.5">
      <code className="block font-mono text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
        $ {input.command}
      </code>

      {tool.result && (
        <pre className="overflow-x-auto rounded bg-[var(--bg-elevated)]/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-[var(--text-secondary)]">
          {tool.result}
        </pre>
      )}

      {tool.isError && tool.result && (
        <pre className="overflow-x-auto rounded bg-red-950/50 px-2 py-1 font-mono text-sm break-words whitespace-pre-wrap text-red-200">
          {tool.result}
        </pre>
      )}

      {detectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {detectedFiles.map((filePath) => (
            <button
              key={filePath}
              onClick={() => openPreview(filePath)}
              className="flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-medium)] hover:text-[var(--text-primary)]"
            >
              <Eye className="h-3 w-3" />
              {filePath.split('/').pop()}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return <CollapsibleTool collapsedContent={collapsedContent} expandedContent={expandedContent} />;
}
