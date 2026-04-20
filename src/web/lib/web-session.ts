/**
 * Web session — streaming session for web server mode.
 * Mirrors src/main/lib/claude-session.ts logic.
 * Key difference: instead of mainWindow.webContents.send(event, data),
 * uses a sendEvent(type, data) callback provided by the WebSocket handler.
 * Also replaces ipcMain.handleOnce for AskUserQuestion with a Promise-based callback.
 */
import { createRequire } from 'module';
import { query, type Query } from '@anthropic-ai/claude-agent-sdk';

import type { ChatModelPreference } from '../../shared/types/ipc';
import {
  buildClaudeSessionEnv,
  getApiKey,
  getChatModelPreferenceSetting,
  getDebugMode,
  getWorkspaceDir,
  setChatModelPreferenceSetting
} from '../standalone-config';
import {
  abortGenerator,
  clearMessageQueue,
  messageGenerator,
  regenerateSessionId,
  resetAbortFlag,
  setSessionId
} from './web-message-queue';

const requireModule = createRequire(import.meta.url);

const FAST_MODEL_ID = 'claude-haiku-4-5-20251001';
const SMART_SONNET_MODEL_ID = 'claude-sonnet-4-6';
const SMART_OPUS_MODEL_ID = 'claude-opus-4-6';

const MODEL_BY_PREFERENCE: Record<ChatModelPreference, string> = {
  fast: FAST_MODEL_ID,
  'smart-sonnet': SMART_SONNET_MODEL_ID,
  'smart-opus': SMART_OPUS_MODEL_ID
};

const SYSTEM_PROMPT_APPEND = `**Identity:**
You are the AI assistant of Viber.vn Cowork — a cowork platform built by author Huy.
Viber.vn provides API services for Claude Code and Augment Code.
For support, join our Telegram group: https://t.me/augmentsupporter — our admins are always happy to help.

**Language:**
Always respond in Vietnamese (tiếng Việt) by default. Only switch to another language if the user explicitly requests it.
When a user greets you (e.g., "hello", "hi", "xin chào"), introduce yourself as: "Xin chào! Tôi là trợ lý AI của Viber.vn Cowork — nền tảng cung cấp dịch vụ API cho Claude Code và Augment Code. Tôi có thể giúp gì cho bạn?"

**User Interaction — IMPORTANT:**
When you need to clarify requirements, gather preferences, or let the user choose between options, you MUST use the AskUserQuestion tool instead of asking in plain text. This tool shows an interactive dialog with checkboxes that the user can click to select options. Use it for:
- Choosing between approaches or technologies
- Selecting features or categories
- Gathering preferences (style, language, scope, etc.)
- Any multiple-choice question where options can be predefined
Only ask in plain text when the question requires a free-form text answer.

**Workspace Context:**
This is a multi-purpose workspace for diverse projects, scripts, and workflows—not a single monolithic codebase. Each subdirectory may represent different applications or tasks. Always understand context before making assumptions about project structure.

**Tooling preferences:**
- JavaScript/TypeScript: Use bun (not node/npm/npx).
- Python: Use uv (not python/pip/conda). Write scripts to files (e.g., temp.py) instead of inline -c commands and run with uv run --with <deps> script.py.

**Memory:**
Maintain \`CLAUDE.md\` in the workspace root as your persistent memory. Update continuously (not just when asked) with: database schemas, project patterns, code snippets, user preferences, and anything useful for future tasks.`;

/** Callback type for sending events to WebSocket client */
export type SendEventFn = (type: string, data?: unknown) => void;

/** Callback type for waiting for user answer (AskUserQuestion) */
export type WaitForAnswerFn = (
  questions: unknown[]
) => Promise<{ answers: Record<string, string[]> }>;

let querySession: Query | null = null;
let isProcessing = false;
let shouldAbortSession = false;
let sessionTerminationPromise: Promise<void> | null = null;
let isInterruptingResponse = false;
const streamIndexToToolId: Map<number, string> = new Map();
let pendingResumeSessionId: string | null = null;
let currentModelPreference: ChatModelPreference = getChatModelPreferenceSetting();

function resolveClaudeCodeCli(): string {
  const cliPath = requireModule.resolve('@anthropic-ai/claude-agent-sdk/cli.js');
  return cliPath;
}

function getModelIdForPreference(preference: ChatModelPreference = currentModelPreference): string {
  return MODEL_BY_PREFERENCE[preference] ?? FAST_MODEL_ID;
}

export function getCurrentModelPreference(): ChatModelPreference {
  return currentModelPreference;
}

export async function setChatModelPreference(preference: ChatModelPreference): Promise<void> {
  if (preference === currentModelPreference) return;

  const previousPreference = currentModelPreference;
  currentModelPreference = preference;

  if (querySession) {
    try {
      await querySession.setModel(getModelIdForPreference(preference));
    } catch (error) {
      currentModelPreference = previousPreference;
      console.error('Failed to update Claude model preference:', error);
      throw error;
    }
  }

  setChatModelPreferenceSetting(currentModelPreference);
}

export async function setModelDirect(modelId: string): Promise<void> {
  if (querySession) {
    await querySession.setModel(modelId);
  }
}

export function isSessionActive(): boolean {
  return isProcessing || querySession !== null;
}

export async function interruptCurrentResponse(sendEvent: SendEventFn): Promise<boolean> {
  if (!querySession) return false;

  if (isInterruptingResponse) return true;

  isInterruptingResponse = true;
  try {
    await querySession.interrupt();
    sendEvent('message-stopped');
    return true;
  } catch (error) {
    console.error('Failed to interrupt current response:', error);
    throw error;
  } finally {
    isInterruptingResponse = false;
  }
}

export async function resetSession(resumeSessionId?: string | null): Promise<void> {
  shouldAbortSession = true;
  abortGenerator();
  clearMessageQueue();
  regenerateSessionId(resumeSessionId ?? null);
  pendingResumeSessionId = resumeSessionId ?? null;

  if (sessionTerminationPromise) {
    await sessionTerminationPromise;
  }

  querySession = null;
  isProcessing = false;
  sessionTerminationPromise = null;
}

export async function startStreamingSession(
  sendEvent: SendEventFn,
  waitForAnswer: WaitForAnswerFn
): Promise<void> {
  if (sessionTerminationPromise) {
    await sessionTerminationPromise;
  }

  if (isProcessing || querySession) return;

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key is not configured');
  }

  shouldAbortSession = false;
  resetAbortFlag();
  isProcessing = true;
  streamIndexToToolId.clear();

  let resolveTermination: () => void;
  sessionTerminationPromise = new Promise((resolve) => {
    resolveTermination = resolve;
  });

  try {
    const env = buildClaudeSessionEnv();
    env.ANTHROPIC_API_KEY = apiKey;

    const resumeSessionId = pendingResumeSessionId;
    const isResumedSession = typeof resumeSessionId === 'string' && resumeSessionId.length > 0;
    pendingResumeSessionId = null;

    const modelId = getModelIdForPreference();

    querySession = query({
      prompt: messageGenerator(),
      options: {
        model: modelId,
        maxThinkingTokens: 32_000,
        settingSources: ['user', 'project'],
        permissionMode: 'default',
        canUseTool: async (toolName, input) => {
          if (toolName === 'AskUserQuestion') {
            const questions = (input as { questions?: unknown[] }).questions ?? [];
            // waitForAnswer sends the ask-user-question event — do NOT send it here too
            const response = await waitForAnswer(questions);
            const answerParts: string[] = [];
            const typedQuestions =
              (
                input as {
                  questions?: { header?: string; options?: { label?: string }[] }[];
                }
              ).questions ?? [];
            for (const q of typedQuestions) {
              const qId = `q-${typedQuestions.indexOf(q)}`;
              const selected = response.answers[qId] ?? [];
              if (selected.length > 0) {
                const labels = selected.map((optId: string) => {
                  const idx = parseInt(optId.replace('opt-', ''), 10);
                  return q.options?.[idx]?.label ?? optId;
                });
                answerParts.push(`${q.header ?? 'Answer'}: ${labels.join(', ')}`);
              }
            }
            return {
              behavior: 'allow' as const,
              updatedInput: {
                ...input,
                _userResponse: answerParts.join('\n') || 'Skipped'
              }
            };
          }
          return { behavior: 'allow' as const, updatedInput: input };
        },
        pathToClaudeCodeExecutable: resolveClaudeCodeCli(),
        executable: 'bun',
        env,
        stderr: (message: string) => {
          if (getDebugMode()) {
            sendEvent('debug-message', message);
          }
        },
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: SYSTEM_PROMPT_APPEND
        },
        cwd: getWorkspaceDir(),
        includePartialMessages: true,
        ...(isResumedSession && { resume: resumeSessionId! })
      }
    });

    for await (const sdkMessage of querySession) {
      if (shouldAbortSession) break;

      if (sdkMessage.type === 'stream_event') {
        const streamEvent = sdkMessage.event;
        if (streamEvent.type === 'content_block_delta') {
          if (streamEvent.delta.type === 'text_delta') {
            sendEvent('message-chunk', streamEvent.delta.text);
          } else if (streamEvent.delta.type === 'thinking_delta') {
            sendEvent('thinking-chunk', {
              index: streamEvent.index,
              delta: streamEvent.delta.thinking
            });
          } else if (streamEvent.delta.type === 'input_json_delta') {
            const toolId = streamIndexToToolId.get(streamEvent.index);
            sendEvent('tool-input-delta', {
              index: streamEvent.index,
              toolId: toolId || '',
              delta: streamEvent.delta.partial_json
            });
          }
        } else if (streamEvent.type === 'content_block_start') {
          if (streamEvent.content_block.type === 'thinking') {
            sendEvent('thinking-start', { index: streamEvent.index });
          } else if (streamEvent.content_block.type === 'tool_use') {
            streamIndexToToolId.set(streamEvent.index, streamEvent.content_block.id);
            sendEvent('tool-use-start', {
              id: streamEvent.content_block.id,
              name: streamEvent.content_block.name,
              input: streamEvent.content_block.input || {},
              streamIndex: streamEvent.index
            });
          } else if (
            (streamEvent.content_block.type === 'web_search_tool_result' ||
              streamEvent.content_block.type === 'web_fetch_tool_result' ||
              streamEvent.content_block.type === 'code_execution_tool_result' ||
              streamEvent.content_block.type === 'bash_code_execution_tool_result' ||
              streamEvent.content_block.type === 'text_editor_code_execution_tool_result' ||
              streamEvent.content_block.type === 'mcp_tool_result') &&
            'tool_use_id' in streamEvent.content_block
          ) {
            const toolResultBlock = streamEvent.content_block as {
              tool_use_id: string;
              content?: string | unknown;
              is_error?: boolean;
            };
            let contentStr = '';
            if (typeof toolResultBlock.content === 'string') {
              contentStr = toolResultBlock.content;
            } else if (toolResultBlock.content !== null && toolResultBlock.content !== undefined) {
              contentStr = JSON.stringify(toolResultBlock.content, null, 2);
            }
            if (contentStr) {
              sendEvent('tool-result-start', {
                toolUseId: toolResultBlock.tool_use_id,
                content: contentStr,
                isError: toolResultBlock.is_error || false
              });
            }
          }
        } else if (streamEvent.type === 'content_block_stop') {
          const toolId = streamIndexToToolId.get(streamEvent.index);
          sendEvent('content-block-stop', {
            index: streamEvent.index,
            toolId: toolId || undefined
          });
        }
      } else if (sdkMessage.type === 'assistant') {
        const assistantMessage = sdkMessage.message;
        if (assistantMessage.content) {
          for (const block of assistantMessage.content) {
            if (
              typeof block === 'object' &&
              block !== null &&
              'tool_use_id' in block &&
              'content' in block
            ) {
              const toolResultBlock = block as {
                tool_use_id: string;
                content: string | unknown[] | unknown;
                is_error?: boolean;
              };

              let contentStr: string;
              if (typeof toolResultBlock.content === 'string') {
                contentStr = toolResultBlock.content;
              } else if (Array.isArray(toolResultBlock.content)) {
                contentStr = toolResultBlock.content
                  .map((c) => {
                    if (typeof c === 'string') return c;
                    if (typeof c === 'object' && c !== null) {
                      if ('text' in c && typeof c.text === 'string') return c.text;
                      if ('type' in c && c.type === 'text' && 'text' in c) return String(c.text);
                      return JSON.stringify(c, null, 2);
                    }
                    return String(c);
                  })
                  .join('\n');
              } else if (
                typeof toolResultBlock.content === 'object' &&
                toolResultBlock.content !== null
              ) {
                contentStr = JSON.stringify(toolResultBlock.content, null, 2);
              } else {
                contentStr = String(toolResultBlock.content);
              }

              sendEvent('tool-result-complete', {
                toolUseId: toolResultBlock.tool_use_id,
                content: contentStr,
                isError: toolResultBlock.is_error || false
              });
            }
          }
        }
      } else if (sdkMessage.type === 'result') {
        sendEvent('message-complete');
      } else if (sdkMessage.type === 'system') {
        if (sdkMessage.subtype === 'init') {
          const sessionIdFromSdk = sdkMessage.session_id;
          if (sessionIdFromSdk) {
            setSessionId(sessionIdFromSdk);
            sendEvent('session-updated', {
              sessionId: sessionIdFromSdk,
              resumed: isResumedSession
            });
            sendEvent('session-init', {
              tools: sdkMessage.tools ?? [],
              slashCommands: sdkMessage.slash_commands ?? [],
              skills: sdkMessage.skills ?? [],
              plugins: sdkMessage.plugins ?? [],
              mcpServers: sdkMessage.mcp_servers ?? [],
              model: sdkMessage.model ?? '',
              permissionMode: sdkMessage.permissionMode ?? ''
            });

            if (querySession) {
              querySession
                .supportedCommands()
                .then((commands) => {
                  sendEvent('slash-commands', { commands });
                })
                .catch((err) => {
                  console.error('Failed to fetch supported commands:', err);
                });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in streaming session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    sendEvent('message-error', errorMessage);
  } finally {
    isProcessing = false;
    querySession = null;
    resolveTermination!();
  }
}
