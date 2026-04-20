import { ArrowLeft, ChevronDown, ChevronUp, Folder, FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

import McpManager from '@/components/McpManager';
import { useTranslation } from '@/i18n/context';
import type { Language } from '@/i18n/context';

interface SettingsProps {
  onBack: () => void;
  sessionMcpServers?: { name: string; status: string }[];
}

type ApiKeyStatus = {
  configured: boolean;
  source: 'env' | 'local' | null;
  lastFour: string | null;
};

function Settings({ onBack, sessionMcpServers }: SettingsProps) {
  const { t, language, setLanguage } = useTranslation();
  const [workspaceDir, setWorkspaceDir] = useState('');
  const [currentWorkspaceDir, setCurrentWorkspaceDir] = useState('');
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [workspaceSaveStatus, setWorkspaceSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  const [debugMode, setDebugMode] = useState(false);
  const [isLoadingDebugMode, setIsLoadingDebugMode] = useState(true);
  const [isSavingDebugMode, setIsSavingDebugMode] = useState(false);

  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const [pathInfo, setPathInfo] = useState<{
    platform: string;
    pathSeparator: string;
    pathEntries: string[];
    pathCount: number;
    fullPath: string;
  } | null>(null);
  const [isLoadingPathInfo, setIsLoadingPathInfo] = useState(false);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }> | null>(null);
  const [isLoadingEnvVars, setIsLoadingEnvVars] = useState(false);
  const [diagnosticMetadata, setDiagnosticMetadata] = useState<{
    appVersion: string;
    electronVersion: string;
    chromiumVersion: string;
    v8Version: string;
    nodeVersion: string;
    claudeAgentSdkVersion: string;
    platform: string;
    arch: string;
    osRelease: string;
    osType: string;
    osVersion: string;
  } | null>(null);
  const [isLoadingDiagnosticMetadata, setIsLoadingDiagnosticMetadata] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({
    configured: false,
    source: null,
    lastFour: null
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [apiKeySaveState, setApiKeySaveState] = useState<'idle' | 'success' | 'error'>('idle');

  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [currentApiBaseUrl, setCurrentApiBaseUrl] = useState<string | null>(null);
  const [isSavingApiBaseUrl, setIsSavingApiBaseUrl] = useState(false);
  const [apiBaseUrlSaveState, setApiBaseUrlSaveState] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );

  useEffect(() => {
    window.electron.config
      .getWorkspaceDir()
      .then((response) => {
        setCurrentWorkspaceDir(response.workspaceDir);
        setIsLoadingWorkspace(false);
      })
      .catch(() => {
        setIsLoadingWorkspace(false);
      });

    const unsubWorkspace = window.electron.config.onWorkspaceChanged(({ workspaceDir }) => {
      setCurrentWorkspaceDir(workspaceDir);
    });

    window.electron.config
      .getDebugMode()
      .then((response) => {
        setDebugMode(response.debugMode);
        setIsLoadingDebugMode(false);
      })
      .catch(() => {
        setIsLoadingDebugMode(false);
      });

    window.electron.config
      .getApiKeyStatus()
      .then((response) => {
        setApiKeyStatus(response.status);
      })
      .catch(() => {
        // ignore
      });

    window.electron.config
      .getApiBaseUrl()
      .then((response) => {
        setCurrentApiBaseUrl(response.apiBaseUrl);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      unsubWorkspace();
    };
  }, []);

  const loadPathInfo = async () => {
    setIsLoadingPathInfo(true);
    try {
      const info = await window.electron.config.getPathInfo();
      setPathInfo(info);
    } catch {
      // Ignore errors
    } finally {
      setIsLoadingPathInfo(false);
    }
  };

  const loadEnvVars = async () => {
    setIsLoadingEnvVars(true);
    try {
      const response = await window.electron.config.getEnvVars();
      setEnvVars(response.envVars);
    } catch {
      // Ignore errors
    } finally {
      setIsLoadingEnvVars(false);
    }
  };

  const loadDiagnosticMetadata = async () => {
    setIsLoadingDiagnosticMetadata(true);
    try {
      const metadata = await window.electron.config.getDiagnosticMetadata();
      setDiagnosticMetadata(metadata);
    } catch {
      // Ignore errors
    } finally {
      setIsLoadingDiagnosticMetadata(false);
    }
  };

  useEffect(() => {
    if (isDebugExpanded) {
      if (!pathInfo) {
        loadPathInfo();
      }
      if (!envVars) {
        loadEnvVars();
      }
      if (!diagnosticMetadata) {
        loadDiagnosticMetadata();
      }
    }
  }, [isDebugExpanded, pathInfo, envVars, diagnosticMetadata]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack]);

  const handleSaveWorkspace = async () => {
    setIsSavingWorkspace(true);
    setWorkspaceSaveStatus('idle');

    try {
      const response = await window.electron.config.setWorkspaceDir(
        workspaceDir || currentWorkspaceDir
      );
      if (response.success) {
        setWorkspaceSaveStatus('success');
        setWorkspaceDir('');
        const workspaceResponse = await window.electron.config.getWorkspaceDir();
        setCurrentWorkspaceDir(workspaceResponse.workspaceDir);
        setTimeout(() => setWorkspaceSaveStatus('idle'), 2000);
      } else {
        setWorkspaceSaveStatus('error');
        setTimeout(() => setWorkspaceSaveStatus('idle'), 3000);
      }
    } catch (_error) {
      setWorkspaceSaveStatus('error');
      setTimeout(() => setWorkspaceSaveStatus('idle'), 3000);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleToggleDebugMode = async () => {
    setIsSavingDebugMode(true);
    const newValue = !debugMode;
    const previousValue = debugMode;

    try {
      await window.electron.config.setDebugMode(newValue);
      setDebugMode(newValue);
    } catch (_error) {
      setDebugMode(previousValue);
    } finally {
      setIsSavingDebugMode(false);
    }
  };

  const handleSaveApiKey = async () => {
    setIsSavingApiKey(true);
    setApiKeySaveState('idle');

    try {
      const response = await window.electron.config.setApiKey(apiKeyInput);
      setApiKeyStatus(response.status);
      setApiKeyInput('');
      setApiKeySaveState('success');
      setTimeout(() => setApiKeySaveState('idle'), 2000);
    } catch (_error) {
      setApiKeySaveState('error');
      setTimeout(() => setApiKeySaveState('idle'), 2500);
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleClearStoredApiKey = async () => {
    setIsSavingApiKey(true);
    setApiKeySaveState('idle');
    try {
      const response = await window.electron.config.setApiKey(null);
      setApiKeyStatus(response.status);
      setApiKeyInput('');
      setApiKeySaveState('success');
      setTimeout(() => setApiKeySaveState('idle'), 2000);
    } catch (_error) {
      setApiKeySaveState('error');
      setTimeout(() => setApiKeySaveState('idle'), 2500);
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleSaveApiBaseUrl = async () => {
    setIsSavingApiBaseUrl(true);
    setApiBaseUrlSaveState('idle');

    try {
      await window.electron.config.setApiBaseUrl(apiBaseUrl);
      setCurrentApiBaseUrl(apiBaseUrl.trim() || null);
      setApiBaseUrl('');
      setApiBaseUrlSaveState('success');
      setTimeout(() => setApiBaseUrlSaveState('idle'), 2000);
    } catch (_error) {
      setApiBaseUrlSaveState('error');
      setTimeout(() => setApiBaseUrlSaveState('idle'), 2500);
    } finally {
      setIsSavingApiBaseUrl(false);
    }
  };

  const handleClearApiBaseUrl = async () => {
    setIsSavingApiBaseUrl(true);
    setApiBaseUrlSaveState('idle');
    try {
      await window.electron.config.setApiBaseUrl(null);
      setCurrentApiBaseUrl(null);
      setApiBaseUrl('');
      setApiBaseUrlSaveState('success');
      setTimeout(() => setApiBaseUrlSaveState('idle'), 2000);
    } catch (_error) {
      setApiBaseUrlSaveState('error');
      setTimeout(() => setApiBaseUrlSaveState('idle'), 2500);
    } finally {
      setIsSavingApiBaseUrl(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const isFormLoading = isLoadingWorkspace || isLoadingDebugMode;
  const apiKeyPlaceholder =
    apiKeyStatus.lastFour ? '****' : t('settings.apiKey.placeholder');

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-primary)]">
      <div className="fixed top-0 right-0 left-0 z-50 h-12 [-webkit-app-region:drag]" />

      <div className="flex flex-1 flex-col overflow-hidden pt-12">
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-16">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
                  {t('settings.title')}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{t('settings.subtitle')}</p>
              </div>
              <button
                onClick={onBack}
                className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors [-webkit-app-region:no-drag] hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('settings.back')}
              </button>
            </div>

            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl shadow-black/30 [-webkit-app-region:no-drag]">
              {isFormLoading ?
                <div className="flex items-center justify-center py-12 text-sm text-[var(--text-muted)]">
                  {t('settings.loading')}
                </div>
              : <div className="space-y-8">
                  {/* Anthropic API Key */}
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {t('settings.apiKey.title')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t('settings.apiKey.description')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${
                            apiKeyStatus.configured ?
                              'text-[var(--text-primary)]'
                            : 'text-[var(--text-disabled)]'
                          }`}
                        >
                          {apiKeyStatus.configured ?
                            apiKeyStatus.source === 'env' ?
                              t('settings.apiKey.usingEnvKey')
                            : t('settings.apiKey.storedLocally')
                          : t('settings.apiKey.noKeyConfigured')}
                        </span>
                        {apiKeyStatus.lastFour && apiKeyStatus.configured && (
                          <span className="font-mono text-xs text-[var(--text-disabled)]">
                            ****
                          </span>
                        )}
                      </div>
                      {apiKeyStatus.source === 'env' && (
                        <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
                          {t('settings.apiKey.envOverride')}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <input
                        id="api-key-input"
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={apiKeyPlaceholder}
                        aria-label={t('settings.apiKey.title')}
                        className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center justify-end gap-3 text-right">
                        {apiKeyStatus.source === 'local' && (
                          <button
                            onClick={handleClearStoredApiKey}
                            disabled={isSavingApiKey}
                            className="rounded-full border border-[var(--error)]/40 px-5 py-2 text-sm font-semibold text-[var(--error)] transition-colors hover:border-[var(--error)]/60 hover:bg-[var(--error)]/10 focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t('settings.apiKey.clearStoredKey')}
                          </button>
                        )}
                        <button
                          onClick={handleSaveApiKey}
                          disabled={!apiKeyInput.trim() || isSavingApiKey}
                          className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingApiKey ? t('settings.apiKey.saving') : t('settings.apiKey.save')}
                        </button>
                        {apiKeySaveState === 'success' && (
                          <span className="text-xs font-medium text-[var(--success)]">
                            {t('settings.apiKey.saved')}
                          </span>
                        )}
                        {apiKeySaveState === 'error' && (
                          <span className="text-xs font-medium text-[var(--error)]">
                            {t('settings.apiKey.saveFailed')}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[var(--border-subtle)]" />

                  {/* API Base URL */}
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {t('settings.apiBaseUrl.title')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t('settings.apiBaseUrl.description')}
                      </p>
                    </div>
                    {currentApiBaseUrl && (
                      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
                        ****
                      </div>
                    )}
                    <div className="space-y-3">
                      <input
                        id="api-base-url-input"
                        type="password"
                        value={apiBaseUrl}
                        onChange={(e) => setApiBaseUrl(e.target.value)}
                        placeholder={t('settings.apiBaseUrl.placeholder')}
                        aria-label={t('settings.apiBaseUrl.title')}
                        className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center justify-end gap-3 text-right">
                        {currentApiBaseUrl && (
                          <button
                            onClick={handleClearApiBaseUrl}
                            disabled={isSavingApiBaseUrl}
                            className="rounded-full border border-[var(--error)]/40 px-5 py-2 text-sm font-semibold text-[var(--error)] transition-colors hover:border-[var(--error)]/60 hover:bg-[var(--error)]/10 focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {t('settings.apiBaseUrl.clear')}
                          </button>
                        )}
                        <button
                          onClick={handleSaveApiBaseUrl}
                          disabled={!apiBaseUrl.trim() || isSavingApiBaseUrl}
                          className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingApiBaseUrl ?
                            t('settings.apiBaseUrl.saving')
                          : t('settings.apiBaseUrl.save')}
                        </button>
                        {apiBaseUrlSaveState === 'success' && (
                          <span className="text-xs font-medium text-[var(--success)]">
                            {t('settings.apiBaseUrl.saved')}
                          </span>
                        )}
                        {apiBaseUrlSaveState === 'error' && (
                          <span className="text-xs font-medium text-[var(--error)]">
                            {t('settings.apiBaseUrl.saveFailed')}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[var(--border-subtle)]" />

                  {/* Language */}
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {t('settings.language.title')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t('settings.language.description')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none ${
                          language === 'en' ?
                            'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-hover)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)]'
                        }`}
                        aria-label="English"
                        aria-pressed={language === 'en'}
                      >
                        {t('settings.language.english')}
                      </button>
                      <button
                        onClick={() => handleLanguageChange('vi')}
                        className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none ${
                          language === 'vi' ?
                            'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-hover)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)]'
                        }`}
                        aria-label="Tiếng Việt"
                        aria-pressed={language === 'vi'}
                      >
                        {t('settings.language.vietnamese')}
                      </button>
                    </div>
                  </section>

                  <div className="border-t border-[var(--border-subtle)]" />

                  {/* Workspace Directory */}
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {t('settings.workspace.title')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t('settings.workspace.description')}
                      </p>
                    </div>
                    {Boolean((window as any).__isWebMode) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-sm text-[var(--text-secondary)]">
                          <Folder className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                          <span className="truncate">{currentWorkspaceDir || '/workspace'}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Để mở folder trên máy bạn, cài ứng dụng:{' '}
                          <a
                            href="https://www.npmjs.com/package/claude-viber"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[var(--accent)] hover:underline"
                          >
                            npm i -g claude-viber && claude-viber-app
                          </a>
                        </p>
                      </div>
                    ) : (
                      <>
                        <input
                          id="workspace-input"
                          type="text"
                          value={workspaceDir || currentWorkspaceDir}
                          onChange={(e) => setWorkspaceDir(e.target.value)}
                          placeholder="/path/to/workspace"
                          aria-label={t('settings.workspace.title')}
                          className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none"
                        />
                        <div className="flex justify-end gap-3">
                          {currentWorkspaceDir && (
                            <button
                              onClick={() => {
                                window.electron.shell.openFolder(currentWorkspaceDir).catch(() => {});
                              }}
                              className="flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
                            >
                              <FolderOpen className="h-4 w-4" />
                              {t('settings.workspace.openFolder')}
                            </button>
                          )}
                          <button
                            onClick={handleSaveWorkspace}
                            disabled={
                              !(workspaceDir || currentWorkspaceDir).trim() || isSavingWorkspace
                            }
                            className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSavingWorkspace ?
                              t('settings.workspace.saving')
                            : t('settings.workspace.save')}
                          </button>
                        </div>
                        {workspaceSaveStatus === 'success' && (
                          <p className="text-xs font-medium text-[var(--success)]">
                            {t('settings.workspace.success')}
                          </p>
                        )}
                        {workspaceSaveStatus === 'error' && (
                          <p className="text-xs font-medium text-[var(--error)]">
                            {t('settings.workspace.error')}
                          </p>
                        )}
                      </>
                    )}
                  </section>

                  <div className="border-t border-[var(--border-subtle)]" />

                  {/* MCP Server Management */}
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {t('settings.mcp.title')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t('settings.mcp.description')}
                      </p>
                    </div>
                    <McpManager sessionMcpServers={sessionMcpServers} />
                  </section>

                  <div className="border-t border-[var(--border-subtle)]" />

                  {/* Diagnostics */}
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {t('settings.diagnostics.title')}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t('settings.diagnostics.description')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {debugMode ?
                            t('settings.diagnostics.enabled')
                          : t('settings.diagnostics.disabled')}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {debugMode ?
                            t('settings.diagnostics.enabledHint')
                          : t('settings.diagnostics.disabledHint')}
                        </p>
                      </div>
                      <button
                        id="debug-mode-toggle"
                        type="button"
                        onClick={handleToggleDebugMode}
                        disabled={isSavingDebugMode}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border border-transparent px-0.5 transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-[var(--accent)]/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                          debugMode ? 'bg-[var(--accent)]' : 'bg-[var(--bg-raised)]'
                        }`}
                        role="switch"
                        aria-checked={debugMode}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            debugMode ? 'translate-x-7' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </section>

                  <div className="border-t border-[var(--border-subtle)]" />

                  {/* Developer / Debug Info Section */}
                  <section className="space-y-4">
                    <button
                      onClick={() => {
                        setIsDebugExpanded(!isDebugExpanded);
                        if (!isDebugExpanded) {
                          loadPathInfo();
                          loadEnvVars();
                        }
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--border-medium)] hover:bg-[var(--bg-raised)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:outline-none"
                    >
                      <span>{t('settings.diagnostics.debugInfo')}</span>
                      {isDebugExpanded ?
                        <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {isDebugExpanded && (
                      <div className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                        {/* App Information */}
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold tracking-[0.35em] text-[var(--text-disabled)] uppercase">
                            {t('settings.diagnostics.appInfo')}
                          </p>
                          {isLoadingDiagnosticMetadata ?
                            <p className="text-xs text-[var(--text-muted)]">
                              {t('settings.diagnostics.loadingInfo')}
                            </p>
                          : diagnosticMetadata ?
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {[
                                ['appVersion', diagnosticMetadata.appVersion],
                                ['electronVersion', diagnosticMetadata.electronVersion],
                                ['chromiumVersion', diagnosticMetadata.chromiumVersion],
                                ['v8Version', diagnosticMetadata.v8Version],
                                ['nodeVersion', diagnosticMetadata.nodeVersion],
                                ['sdkVersion', diagnosticMetadata.claudeAgentSdkVersion],
                                [
                                  'platform',
                                  `${diagnosticMetadata.platform} (${diagnosticMetadata.arch})`
                                ],
                                ['osType', diagnosticMetadata.osType],
                                ['osRelease', diagnosticMetadata.osRelease]
                              ].map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-xs font-semibold text-[var(--text-disabled)]">
                                    {t(`settings.diagnostics.${key}`)}
                                  </p>
                                  <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
                                    {value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          : <p className="text-xs text-[var(--text-muted)]">
                              {t('settings.diagnostics.failedInfo')}
                            </p>
                          }
                        </div>

                        <div className="border-t border-[var(--border-subtle)]" />

                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold tracking-[0.35em] text-[var(--text-disabled)] uppercase">
                            {t('settings.diagnostics.pathEnvVar')}
                          </p>
                          {isLoadingPathInfo ?
                            <p className="text-xs text-[var(--text-muted)]">
                              {t('settings.diagnostics.loadingInfo')}
                            </p>
                          : pathInfo ?
                            <div className="space-y-2">
                              <div className="text-xs text-[var(--text-muted)]">
                                <span className="font-medium">
                                  {t('settings.diagnostics.pathPlatform')}:
                                </span>{' '}
                                {pathInfo.platform}
                                {' • '}
                                <span className="font-medium">
                                  {t('settings.diagnostics.pathEntries')}:
                                </span>{' '}
                                {pathInfo.pathCount}
                                {' • '}
                                <span className="font-medium">
                                  {t('settings.diagnostics.pathSeparator')}:
                                </span>{' '}
                                {pathInfo.pathSeparator === ';' ?
                                  t('settings.diagnostics.pathSepWindows')
                                : t('settings.diagnostics.pathSepUnix')}
                              </div>
                              <div className="max-h-64 overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deepest)] px-3 py-2">
                                <div className="space-y-1">
                                  {pathInfo.pathEntries.map((entry, index) => (
                                    <div
                                      key={index}
                                      className="font-mono text-xs text-[var(--text-secondary)]"
                                    >
                                      <span className="text-[var(--text-disabled)]">
                                        {String(index + 1).padStart(3, ' ')}.
                                      </span>{' '}
                                      {entry}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          : <p className="text-xs text-[var(--text-muted)]">
                              {t('settings.diagnostics.failedPath')}
                            </p>
                          }
                        </div>

                        <div className="border-t border-[var(--border-subtle)]" />

                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold tracking-[0.35em] text-[var(--text-disabled)] uppercase">
                            {t('settings.diagnostics.allEnvVars')}
                          </p>
                          {isLoadingEnvVars ?
                            <p className="text-xs text-[var(--text-muted)]">
                              {t('settings.diagnostics.loadingInfo')}
                            </p>
                          : envVars ?
                            <div className="space-y-2">
                              <div className="text-xs text-[var(--text-muted)]">
                                <span className="font-medium">
                                  {t('settings.diagnostics.totalVars')}:
                                </span>{' '}
                                {envVars.length} {t('settings.diagnostics.variables')}
                              </div>
                              <div className="max-h-64 overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-deepest)] px-3 py-2">
                                <div className="space-y-1">
                                  {envVars.map((envVar, index) => (
                                    <div
                                      key={index}
                                      className="font-mono text-xs text-[var(--text-secondary)]"
                                    >
                                      <span className="text-[var(--text-disabled)]">
                                        {String(index + 1).padStart(3, ' ')}.
                                      </span>{' '}
                                      <span className="font-semibold text-[var(--text-primary)]">
                                        {envVar.key}
                                      </span>
                                      {' = '}
                                      <span className="text-[var(--text-muted)]">
                                        {envVar.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          : <p className="text-xs text-[var(--text-muted)]">
                              {t('settings.diagnostics.failedEnvVars')}
                            </p>
                          }
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
