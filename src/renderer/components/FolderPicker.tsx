import { ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/i18n/context';

import DirectoryBrowser from './DirectoryBrowser';

interface FolderPickerProps {
  currentFolder: string | null;
  recentFolders?: string[];
  onFolderChange: (folder: string) => void;
}

export default function FolderPicker({
  currentFolder,
  recentFolders = [],
  onFolderChange
}: FolderPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = currentFolder ? currentFolder.split('/').pop() || currentFolder : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowBrowser(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrowse = async () => {
    try {
      setError(null);
      const result = await window.electron.config.browseFolder();
      if (!result.canceled && result.folder) {
        onFolderChange(result.folder);
        setIsOpen(false);
      }
      // If canceled, just close the dropdown (native dialog was dismissed)
    } catch (err) {
      console.error('Error browsing folder:', err);
      setError(err instanceof Error ? err.message : 'Failed to open folder picker');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setShowBrowser(false);
    }
  };

  return (
    <>
      <DirectoryBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={(folder) => {
          onFolderChange(folder);
          setShowBrowser(false);
          setIsOpen(false);
        }}
        initialPath={currentFolder || undefined}
      />
      <div ref={dropdownRef} className="relative" onKeyDown={handleKeyDown}>
        {error && (
          <div className="absolute bottom-full left-0 mb-1 rounded-lg bg-[var(--error)] px-2 py-1 text-xs text-white">
            {error}
          </div>
        )}
        <button
          onClick={() => {
            setError(null);
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Folder className="h-4 w-4" />
          <span>{displayName || t('folderPicker.workInProject')}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] p-1 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
            {/* Recent folders */}
            {recentFolders.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                  {t('folderPicker.recentFolders')}
                </div>
                {recentFolders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => {
                      onFolderChange(folder);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-elevated)]"
                  >
                    <FolderOpen className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                    <span className="truncate text-sm text-[var(--text-primary)]">
                      {folder.split('/').pop() || folder}
                    </span>
                  </button>
                ))}
                <div className="mx-2 my-1 border-t border-[var(--border-subtle)]" />
              </>
            )}

            {recentFolders.length === 0 && (
              <div className="px-3 py-2 text-xs text-[var(--text-disabled)]">
                {t('folderPicker.noRecentFolders')}
              </div>
            )}

            {/* Browse button */}
            <button
              onClick={handleBrowse}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-elevated)]"
            >
              <Folder className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-primary)]">{t('folderPicker.browse')}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
