import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface CollapsibleToolProps {
  collapsedContent: ReactNode;
  expandedContent: ReactNode | null;
  defaultExpanded?: boolean;
}

export function CollapsibleTool({
  collapsedContent,
  expandedContent,
  defaultExpanded = false
}: CollapsibleToolProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const hasExpandedContent = expandedContent !== null && expandedContent !== undefined;

  return (
    <div className="my-0.5">
      <button
        type="button"
        onClick={() => hasExpandedContent && setIsExpanded(!isExpanded)}
        disabled={!hasExpandedContent}
        aria-expanded={isExpanded}
        className={`flex w-full items-center gap-1.5 text-left transition-colors ${
          hasExpandedContent ?
            'cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          : 'cursor-default text-[var(--text-disabled)]'
        }`}
      >
        <div className="flex-1">{collapsedContent}</div>
        {hasExpandedContent && (
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[var(--text-disabled)] transition-colors">
            {isExpanded ?
              <ChevronUp className="size-3" />
            : <ChevronDown className="size-3" />}
          </span>
        )}
      </button>
      {isExpanded && hasExpandedContent && (
        <div className="collapsible-tool-expanded mt-1 ml-3 border-l border-[var(--border-subtle)] pl-2.5">
          <div className="space-y-1.5">{expandedContent}</div>
        </div>
      )}
    </div>
  );
}
