import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/i18n/context';

interface McpServerEntry {
  name: string;
  type: string;
  command?: string;
  args?: string[];
  url?: string;
  status?: string;
}

interface McpManagerProps {
  sessionMcpServers?: { name: string; status: string }[];
}

export default function McpManager({ sessionMcpServers = [] }: McpManagerProps) {
  const { t } = useTranslation();
  const [servers, setServers] = useState<McpServerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rawServers, setRawServers] = useState<Record<string, unknown>>({});

  // Add form state
  const [newName, setNewName] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const [newArgs, setNewArgs] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadServers = async () => {
    try {
      const response = await window.electron.config.getMcpServers();
      const mcpServers = response.mcpServers as Record<string, Record<string, unknown>>;
      setRawServers(mcpServers);
      const entries: McpServerEntry[] = Object.entries(mcpServers).map(([name, config]) => {
        const sessionServer = sessionMcpServers.find((s) => s.name === name);
        return {
          name,
          type: (config.type as string) || 'stdio',
          command: config.command as string | undefined,
          args: config.args as string[] | undefined,
          url: config.url as string | undefined,
          status: sessionServer?.status
        };
      });
      setServers(entries);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async () => {
    if (!newName.trim() || !newCommand.trim()) return;
    setIsSaving(true);
    try {
      const args = newArgs.trim() ? newArgs.split(/\s+/) : undefined;
      const updated = {
        ...rawServers,
        [newName.trim()]: {
          command: newCommand.trim(),
          ...(args && { args })
        }
      };
      await window.electron.config.setMcpServers(updated);
      setNewName('');
      setNewCommand('');
      setNewArgs('');
      await loadServers();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (name: string) => {
    setIsSaving(true);
    try {
      const updated = { ...rawServers };
      delete updated[name];
      await window.electron.config.setMcpServers(updated);
      await loadServers();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-[var(--text-muted)]">{t('settings.loading')}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Server list */}
      {servers.length === 0 ?
        <p className="text-sm text-[var(--text-muted)]">{t('settings.mcp.noServers')}</p>
      : <div className="space-y-2">
          {servers.map((server) => (
            <div
              key={server.name}
              className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{server.name}</span>
                  <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                    {server.type}
                  </span>
                  {server.status && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        server.status === 'connected' ?
                          'bg-[var(--success)]/10 text-[var(--success)]'
                        : 'bg-[var(--error)]/10 text-[var(--error)]'
                      }`}
                    >
                      {server.status}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]">
                  {server.command || server.url || ''}
                  {server.args?.length ? ` ${server.args.join(' ')}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleRemove(server.name)}
                disabled={isSaving}
                className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--error)]/10 hover:text-[var(--error)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none disabled:opacity-50"
                aria-label={t('settings.mcp.remove')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      }

      {/* Add form */}
      <div className="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          {t('settings.mcp.addTitle')}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('settings.mcp.namePlaceholder')}
            aria-label={t('settings.mcp.namePlaceholder')}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
          />
          <input
            type="text"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder={t('settings.mcp.commandPlaceholder')}
            aria-label={t('settings.mcp.commandPlaceholder')}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
          />
          <input
            type="text"
            value={newArgs}
            onChange={(e) => setNewArgs(e.target.value)}
            placeholder={t('settings.mcp.argsPlaceholder')}
            aria-label={t('settings.mcp.argsPlaceholder')}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !newCommand.trim() || isSaving}
            className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('settings.mcp.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
