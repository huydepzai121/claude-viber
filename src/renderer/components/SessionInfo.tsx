import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/i18n/context';

import type { SessionInitData } from '../../shared/types/ipc';

interface SessionInfoProps {
  sessionInitData: SessionInitData | null;
}

export default function SessionInfo({ sessionInitData }: SessionInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  if (!sessionInitData) {
    return null;
  }

  const connectedMcp = sessionInitData.mcpServers.filter((s) => s.status === 'connected').length;

  return (
    <div className="mx-auto max-w-3xl px-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="session-info-details"
        className="flex w-full items-center justify-center gap-2 rounded-full px-3 py-1 text-[11px] text-[var(--text-disabled)] transition-colors hover:text-[var(--text-muted)]"
      >
        <span>{t('sessionInfo.tools', { count: sessionInitData.tools.length })}</span>
        <span className="text-[var(--border-subtle)]">/</span>
        <span>
          {t('sessionInfo.mcpServers', {
            connected: connectedMcp,
            total: sessionInitData.mcpServers.length
          })}
        </span>
        <span className="text-[var(--border-subtle)]">/</span>
        <span>{t('sessionInfo.skills', { count: sessionInitData.skills.length })}</span>
        {isExpanded ?
          <ChevronUp className="h-3 w-3" />
        : <ChevronDown className="h-3 w-3" />}
      </button>

      {isExpanded && (
        <div
          id="session-info-details"
          className="mt-2 space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 p-4 text-xs backdrop-blur-sm"
        >
          {/* Tools */}
          <div>
            <p className="mb-1 font-semibold text-[var(--text-muted)]">
              {t('sessionInfo.toolsLabel')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sessionInitData.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[var(--text-secondary)]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* MCP Servers */}
          {sessionInitData.mcpServers.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-[var(--text-muted)]">
                {t('sessionInfo.mcpLabel')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sessionInitData.mcpServers.map((server) => (
                  <span
                    key={server.name}
                    className={`rounded-full px-2 py-0.5 ${
                      server.status === 'connected' ?
                        'bg-[var(--success)]/10 text-[var(--success)]'
                      : 'bg-[var(--error)]/10 text-[var(--error)]'
                    }`}
                  >
                    {server.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {sessionInitData.skills.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-[var(--text-muted)]">
                {t('sessionInfo.skillsLabel')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sessionInitData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[var(--accent)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Plugins */}
          {sessionInitData.plugins.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-[var(--text-muted)]">
                {t('sessionInfo.pluginsLabel')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sessionInitData.plugins.map((plugin) => (
                  <span
                    key={plugin.name}
                    className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[var(--text-secondary)]"
                  >
                    {plugin.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
