/**
 * Web message queue — mirror of src/main/lib/message-queue.ts.
 * No Electron imports.
 */
import type { SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';

export interface MessageQueueItem {
  message: SDKUserMessage['message'];
  resolve: () => void;
}

export const messageQueue: MessageQueueItem[] = [];
let sessionId = `session-${Date.now()}`;
let shouldAbort = false;

export function clearMessageQueue(): void {
  while (messageQueue.length > 0) {
    const item = messageQueue.shift();
    if (item) {
      item.resolve();
    }
  }
}

export function abortGenerator(): void {
  shouldAbort = true;
}

export function resetAbortFlag(): void {
  shouldAbort = false;
}

function generateSessionId(): string {
  return `session-${Date.now()}`;
}

export function setSessionId(nextSessionId?: string | null): void {
  if (nextSessionId && nextSessionId.trim().length > 0) {
    sessionId = nextSessionId;
    return;
  }
  sessionId = generateSessionId();
}

export function regenerateSessionId(nextSessionId?: string | null): void {
  setSessionId(nextSessionId);
}

export function getSessionId(): string {
  return sessionId;
}

export async function* messageGenerator(): AsyncGenerator<SDKUserMessage> {
  while (true) {
    if (shouldAbort) return;

    await new Promise<void>((resolve) => {
      const checkQueue = () => {
        if (shouldAbort) {
          resolve();
          return;
        }
        if (messageQueue.length > 0) {
          resolve();
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });

    if (shouldAbort) return;

    const item = messageQueue.shift();
    if (item) {
      yield {
        type: 'user',
        message: item.message,
        parent_tool_use_id: null,
        session_id: getSessionId()
      };
      item.resolve();
    }
  }
}
