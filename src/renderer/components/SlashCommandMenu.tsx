import { useEffect, useRef } from 'react';

import type { SlashCommand } from '../../shared/types/ipc';

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  visible: boolean;
  menuId: string;
}

export default function SlashCommandMenu({
  commands,
  selectedIndex,
  onSelect,
  visible,
  menuId
}: SlashCommandMenuProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!visible || commands.length === 0) {
    return null;
  }

  return (
    <div
      id={menuId}
      className="absolute right-0 bottom-full left-0 mb-2 max-h-64 overflow-y-auto rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)]/95 shadow-xl shadow-black/30 backdrop-blur-xl"
      role="listbox"
      aria-label="Slash commands"
    >
      {commands.map((cmd, index) => {
        const optionId = `${menuId}-option-${index}`;
        return (
          <button
            key={cmd.name}
            id={optionId}
            ref={index === selectedIndex ? selectedRef : undefined}
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => onSelect(cmd)}
            className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
              index === selectedIndex ?
                'bg-[var(--accent)]/10 text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
            }`}
          >
            <span className="shrink-0 font-mono text-sm font-bold text-[var(--accent)]">
              {cmd.name}
            </span>
            <span className="flex-1 text-sm text-[var(--text-muted)]">{cmd.description}</span>
            {cmd.argumentHint && (
              <span className="shrink-0 text-xs text-[var(--text-disabled)]">
                {cmd.argumentHint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
