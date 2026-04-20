import { Check, ChevronUp, Folder, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DirectoryBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

export default function DirectoryBrowser({
  isOpen,
  onClose,
  onSelect,
  initialPath
}: DirectoryBrowserProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDirectories = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/config/list-directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: path || undefined })
      });
      const data = (await res.json()) as {
        error?: string;
        currentPath?: string;
        directories?: string[];
        parentPath?: string | null;
      };
      if (data.error) {
        setError(data.error);
      } else {
        setCurrentPath(data.currentPath ?? '');
        setDirectories(data.directories ?? []);
        setParentPath(data.parentPath ?? null);
      }
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Load initial directories once when modal opens
  useEffect(() => {
    if (!isOpen) return;
    loadDirectories(initialPath || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentPath('');
      setDirectories([]);
      setParentPath(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    loadDirectories(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[600px] w-[480px] flex-col rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Select Folder</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current path */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2">
          <div className="flex items-center gap-2">
            {parentPath && (
              <button
                onClick={() => navigateTo(parentPath)}
                className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-raised)]"
                aria-label="Go up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            <code className="flex-1 truncate text-sm text-[var(--text-secondary)]">
              {currentPath}
            </code>
          </div>
        </div>

        {/* Directory list */}
        <div className="min-h-[200px] flex-1 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
            </div>
          )}
          {!loading && error && (
            <div className="px-3 py-2 text-sm text-[var(--error)]">{error}</div>
          )}
          {!loading && !error && directories.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--text-muted)]">No subdirectories</div>
          )}
          {!loading &&
            !error &&
            directories.map((dir) => (
              <button
                key={dir}
                onClick={() => navigateTo(currentPath.replace(/\/$/, '') + '/' + dir)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-elevated)]"
              >
                <Folder className="h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-primary)]">{dir}</span>
              </button>
            ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border-medium)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(currentPath)}
            disabled={!currentPath}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
}
