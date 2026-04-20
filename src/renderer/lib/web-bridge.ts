/**
 * Web bridge — implements the full ElectronAPI interface using HTTP/WebSocket.
 * Installed onto window.electron before React mounts when running in a browser (not Electron).
 *
 * chat.* methods use WebSocket to ws://<host>/ws
 * config.*, conversation.*, file.*, shell.* methods use fetch('/api/...')
 * update.* methods are graceful no-ops (web mode has no auto-updates)
 * onNavigate is a no-op subscriber (navigation via React state in web mode)
 */

import type {
  ChatModelPreference,
  SendMessagePayload,
  SessionInitData,
  SlashCommand,
  ModelInfo
} from '../../shared/types/ipc';
import type {
  ChatResponse,
  ConversationCreateResponse,
  ConversationDeleteResponse,
  ConversationGetResponse,
  ConversationListResponse,
  ConversationUpdateResponse,
  DiagnosticMetadataResponse,
  EnvVarsResponse,
  PathInfoResponse,
  SetWorkspaceResponse,
  UpdateStatus,
  WorkspaceResponse,
  ContentBlockStop,
  ThinkingChunk,
  ThinkingStart,
  ToolInputDelta,
  ToolResultComplete,
  ToolResultDelta,
  ToolResultStart,
  ToolUse,
} from '../electron.d';

// --- Event Emitter ---

type Listener = (data?: unknown) => void;

class EventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error(`Error in listener for ${event}:`, err);
      }
    });
  }
}

// --- WebSocket Manager with Reconnect ---

const WS_URL = `ws://${window.location.host}/ws`;
const RECONNECT_DELAYS = [2000, 4000, 8000, 16000, 30000];

class WsManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSessionId: string | null = null;
  private intentionallyClosed = false;

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionallyClosed = false;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('[web-bridge] WebSocket connected');
      this.reconnectAttempt = 0;

      // Resume session if we have a last session ID (reconnect scenario)
      if (this.lastSessionId) {
        this.send({ type: 'reset-session', resumeSessionId: this.lastSessionId });
      }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      let msg: { type: string; [key: string]: unknown };
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      // Track session ID for reconnect
      if (msg.type === 'session-updated' && typeof msg.sessionId === 'string') {
        this.lastSessionId = msg.sessionId;
      }

      this.emit(msg.type, msg);
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('[web-bridge] WebSocket error:', err);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    console.log(`[web-bridge] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.connect();
    }, delay);
  }

  send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      // Queue connect and retry
      this.connect();
      setTimeout(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msg));
        }
      }, 500);
    }
  }

  close(): void {
    this.intentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

// --- REST Helper ---

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return res.json() as Promise<T>;
}

function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
}

function apiDelete<T>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}

function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
}

// --- Idle UpdateStatus ---

const IDLE_UPDATE_STATUS: UpdateStatus = {
  checking: false,
  updateAvailable: false,
  downloading: false,
  downloadProgress: 0,
  readyToInstall: false,
  error: null,
  updateInfo: null,
  lastCheckComplete: false
};

// --- Build the ElectronAPI ---

let _wsInstance: WsManager | null = null;

export function buildWebBridge(): typeof window.electron {
  const ws = new WsManager();
  _wsInstance = ws;
  ws.connect();

  return {
    onNavigate: (_callback: (view: string) => void) => {
      // Navigation in web mode is driven by UI buttons, not server events
      return () => {};
    },

    chat: {
      sendMessage: async (payload: SendMessagePayload): Promise<ChatResponse> => {
        ws.send({ type: 'send-message', payload });
        return { success: true };
      },

      stopMessage: async () => {
        ws.send({ type: 'stop-message' });
        return { success: true };
      },

      startSession: async () => {
        ws.send({ type: 'start-session' });
        return { success: true };
      },

      resetSession: async (resumeSessionId?: string | null) => {
        ws.send({ type: 'reset-session', resumeSessionId: resumeSessionId ?? null });
        return { success: true };
      },

      getModelPreference: async () => {
        return apiGet<{ preference: ChatModelPreference }>('/api/config/model-preference').catch(() => ({
          preference: 'smart-sonnet' as ChatModelPreference
        }));
      },

      setModelPreference: async (preference: ChatModelPreference) => {
        ws.send({ type: 'set-model-preference', preference });
        await apiPost('/api/config/model-preference', { preference }).catch(() => {});
        return { success: true, preference };
      },

      onMessageChunk: (callback: (chunk: string) => void) => {
        return ws.on('message-chunk', (msg) => {
          const data = msg as { chunk?: string; type: string };
          callback(data.chunk ?? '');
        });
      },

      onThinkingStart: (callback: (data: ThinkingStart) => void) => {
        return ws.on('thinking-start', (msg) => callback(msg as ThinkingStart));
      },

      onThinkingChunk: (callback: (data: ThinkingChunk) => void) => {
        return ws.on('thinking-chunk', (msg) => callback(msg as ThinkingChunk));
      },

      onMessageComplete: (callback: () => void) => {
        return ws.on('message-complete', () => callback());
      },

      onMessageStopped: (callback: () => void) => {
        return ws.on('message-stopped', () => callback());
      },

      onMessageError: (callback: (error: string) => void) => {
        return ws.on('message-error', (msg) => {
          const data = msg as { error?: string; chunk?: string; type: string };
          callback(data.error ?? data.chunk ?? 'Unknown error');
        });
      },

      onDebugMessage: (callback: (message: string) => void) => {
        return ws.on('debug-message', (msg) => {
          const data = msg as { message?: string; chunk?: string; type: string };
          callback(data.message ?? data.chunk ?? '');
        });
      },

      onToolUseStart: (callback: (tool: ToolUse) => void) => {
        return ws.on('tool-use-start', (msg) => callback(msg as ToolUse));
      },

      onToolInputDelta: (callback: (data: ToolInputDelta) => void) => {
        return ws.on('tool-input-delta', (msg) => callback(msg as ToolInputDelta));
      },

      onContentBlockStop: (callback: (data: ContentBlockStop) => void) => {
        return ws.on('content-block-stop', (msg) => callback(msg as ContentBlockStop));
      },

      onToolResultStart: (callback: (data: ToolResultStart) => void) => {
        return ws.on('tool-result-start', (msg) => callback(msg as ToolResultStart));
      },

      onToolResultDelta: (callback: (data: ToolResultDelta) => void) => {
        return ws.on('tool-result-delta', (msg) => callback(msg as ToolResultDelta));
      },

      onToolResultComplete: (callback: (data: ToolResultComplete) => void) => {
        return ws.on('tool-result-complete', (msg) => callback(msg as ToolResultComplete));
      },

      onSessionUpdated: (callback: (data: { sessionId: string; resumed: boolean }) => void) => {
        return ws.on('session-updated', (msg) =>
          callback(msg as { sessionId: string; resumed: boolean })
        );
      },

      onSessionInit: (callback: (data: SessionInitData) => void) => {
        return ws.on('session-init', (msg) => callback(msg as SessionInitData));
      },

      onSlashCommands: (callback: (commands: SlashCommand[]) => void) => {
        return ws.on('slash-commands', (msg) => {
          const data = msg as { commands?: SlashCommand[] };
          callback(data.commands ?? []);
        });
      },

      onSupportedModels: (callback: (models: ModelInfo[]) => void) => {
        return ws.on('supported-models', (msg) => {
          const data = msg as { models?: ModelInfo[] };
          callback(data.models ?? []);
        });
      },

      setModelDirect: async (modelId: string) => {
        ws.send({ type: 'set-model-direct', modelId });
        return { success: true };
      },

      onAskUserQuestion: (callback: (data: { questions: unknown[] }) => void) => {
        return ws.on('ask-user-question', (msg) =>
          callback(msg as { questions: unknown[] })
        );
      },

      answerUserQuestion: async (answers: Record<string, string[]>) => {
        ws.send({ type: 'answer-user-question', answers });
        return { success: true };
      }
    },

    config: {
      getWorkspaceDir: () => apiGet<WorkspaceResponse>('/api/config/workspace-dir'),
      setWorkspaceDir: (workspaceDir: string) =>
        apiPost<SetWorkspaceResponse>('/api/config/workspace-dir', { workspaceDir }),
      getDebugMode: () => apiGet<{ debugMode: boolean }>('/api/config/debug-mode'),
      setDebugMode: (debugMode: boolean) =>
        apiPost<{ success: boolean }>('/api/config/debug-mode', { debugMode }),
      getPathInfo: () => apiGet<PathInfoResponse>('/api/config/path-info'),
      getEnvVars: () => apiGet<EnvVarsResponse>('/api/config/env-vars'),
      getDiagnosticMetadata: () =>
        apiGet<DiagnosticMetadataResponse>('/api/config/diagnostic-metadata'),
      getApiKeyStatus: () =>
        apiGet<{
          status: { configured: boolean; source: 'env' | 'local' | null; lastFour: string | null };
        }>('/api/config/api-key-status'),
      setApiKey: (apiKey?: string | null) =>
        apiPost<{
          success: boolean;
          status: { configured: boolean; source: 'env' | 'local' | null; lastFour: string | null };
        }>('/api/config/api-key', { apiKey }),
      getApiBaseUrl: () => apiGet<{ apiBaseUrl: string | null }>('/api/config/api-base-url'),
      setApiBaseUrl: (apiBaseUrl?: string | null) =>
        apiPost<{ success: boolean }>('/api/config/api-base-url', { apiBaseUrl }),
      getMcpServers: () =>
        apiGet<{ mcpServers: Record<string, unknown> }>('/api/config/mcp-servers'),
      setMcpServers: (mcpServers: Record<string, unknown>) =>
        apiPost<{ success: boolean }>('/api/config/mcp-servers', { mcpServers }),
      getClaudeCommands: () =>
        apiGet<{ commands: { name: string; description: string; argumentHint: string }[] }>(
          '/api/config/claude-commands'
        ),
      browseFolder: async () => {
        try {
          return await apiPost<{ canceled: boolean; folder: string | null }>(
            '/api/config/browse-folder'
          );
        } catch {
          return { canceled: true, folder: null };
        }
      },
      getRecentFolders: () => apiGet<{ folders: string[] }>('/api/config/recent-folders'),
      addRecentFolder: (folder: string) =>
        apiPost<{ success: boolean }>('/api/config/recent-folders', { folder }),
      getUserProfile: () =>
        apiGet<{ profile: { name: string; plan: string } }>('/api/config/user-profile'),
      setUserProfile: (profile: { name: string; plan: string }) =>
        apiPost<{ success: boolean }>('/api/config/user-profile', { profile }),
      getOnboardingState: () =>
        apiGet<{ dismissed: boolean; completed: Record<string, boolean> }>(
          '/api/config/onboarding-state'
        ),
      setOnboardingDismissed: (dismissed: boolean) =>
        apiPost<{ success: boolean }>('/api/config/onboarding-dismissed', { dismissed }),
      setOnboardingTaskCompleted: (taskId: string, completed: boolean) =>
        apiPost<{ success: boolean }>('/api/config/onboarding-task-completed', {
          taskId,
          completed
        }),
      getSidebarCollapsed: () =>
        apiGet<{ collapsed: boolean }>('/api/config/sidebar-collapsed'),
      setSidebarCollapsed: (collapsed: boolean) =>
        apiPost<{ success: boolean }>('/api/config/sidebar-collapsed', { collapsed }),
      getSkills: () => apiGet<{ skills: { name: string; description: string; path: string }[] }>('/api/config/skills'),
      onWorkspaceChanged: (_callback: (data: { workspaceDir: string }) => void) => {
        // No-op in web context — workspace changes are not broadcast via WebSocket
        return () => {};
      }
    },

    file: {
      readText: (filePath: string) =>
        apiGet<{ content: string | null; error: string | null }>(
          `/api/file/read-text?path=${encodeURIComponent(filePath)}`
        ),
      readBinaryBase64: (filePath: string) =>
        apiGet<{ data: string | null; mimeType: string | null; error: string | null }>(
          `/api/file/read-binary?path=${encodeURIComponent(filePath)}`
        ),
      getInfo: (filePath: string) =>
        apiGet<{ exists: boolean; size: number; extension: string; mimeType: string }>(
          `/api/file/info?path=${encodeURIComponent(filePath)}`
        ),
      openInDefaultApp: (filePath: string) => {
        window.open(`/files?path=${encodeURIComponent(filePath)}`, '_blank');
        return Promise.resolve({ success: true, error: null });
      },
      convertToImages: (filePath: string) =>
        apiPost<{ pages: { data: string; mimeType: string }[]; error: string | null }>(
          '/api/file/convert-to-images',
          { filePath }
        )
    },

    shell: {
      openExternal: (url: string) => {
        window.open(url, '_blank');
        return Promise.resolve({ success: true });
      },
      openFolder: (folderPath: string) =>
        apiPost<{ success: boolean; error?: string }>('/api/shell/open-folder', { folderPath })
    },

    conversation: {
      list: () => apiGet<ConversationListResponse>('/api/conversation'),
      create: (messages: unknown[], sessionId?: string | null) =>
        apiPost<ConversationCreateResponse>('/api/conversation', { messages, sessionId }),
      get: (id: string) => apiGet<ConversationGetResponse>(`/api/conversation/${id}`),
      update: (id: string, title?: string, messages?: unknown[], sessionId?: string | null) =>
        apiPut<ConversationUpdateResponse>(`/api/conversation/${id}`, {
          title,
          messages,
          sessionId
        }),
      delete: (id: string) => apiDelete<ConversationDeleteResponse>(`/api/conversation/${id}`)
    },

    update: {
      getStatus: () => Promise.resolve(IDLE_UPDATE_STATUS),
      check: () => Promise.resolve({ success: true }),
      download: () => Promise.resolve({ success: true }),
      install: () => Promise.resolve({ success: true }),
      onStatusChanged: (_callback: (status: UpdateStatus) => void) => {
        // No-op — web mode has no auto-updates
        return () => {};
      }
    }
  };
}

export function installWebBridge(): void {
  const bridge = buildWebBridge();
  (window as Window & { electron: typeof window.electron }).electron = bridge;
  (window as any).__isWebMode = true;

  // Close WebSocket cleanly on page unload to prevent reconnect timer leaks
  window.addEventListener('beforeunload', () => {
    _wsInstance?.close();
  });
}
