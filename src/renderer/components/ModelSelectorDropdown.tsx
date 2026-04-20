import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/i18n/context';

interface ModelOption {
  id: string;
  label: string;
  description: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'claude-opus-4-6', label: 'Opus 4.6', description: 'modelSelector.opusDesc' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', description: 'modelSelector.sonnetDesc' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', description: 'modelSelector.haikuDesc' }
];

interface ModelSelectorDropdownProps {
  currentModelId: string;
  onModelChange: (modelId: string) => void;
}

export default function ModelSelectorDropdown({
  currentModelId,
  onModelChange
}: ModelSelectorDropdownProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = MODEL_OPTIONS.find((m) => m.id === currentModelId) ?? MODEL_OPTIONS[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{currentModel.label}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] p-1 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
          <div role="listbox" aria-label={t('model.select')}>
            {MODEL_OPTIONS.map((model) => (
              <button
                key={model.id}
                role="option"
                aria-selected={model.id === currentModelId}
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-elevated)]"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {model.label}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{t(model.description)}</div>
                </div>
                {model.id === currentModelId && (
                  <Check className="h-4 w-4 flex-shrink-0 text-[var(--success)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
