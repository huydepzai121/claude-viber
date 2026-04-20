/**
 * WebSocket handler for chat streaming.
 * Handles WS upgrade at /ws, maps incoming command messages to web-session functions,
 * and wires sendEvent callback to write WS messages back to client.
 */
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import type { IncomingMessage, Server } from 'http';
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';

import { ATTACHMENTS_DIR_NAME, MAX_ATTACHMENT_BYTES } from '../../shared/constants';
import type {
  ChatModelPreference,
  SavedAttachmentInfo,
  SendMessagePayload,
  SerializedAttachmentPayload
} from '../../shared/types/ipc';
import { messageQueue } from '../lib/web-message-queue';
import {
  getCurrentModelPreference,
  interruptCurrentResponse,
  isSessionActive,
  resetSession,
  setChatModelPreference,
  setModelDirect,
  startStreamingSession
} from '../lib/web-session';
import type { WaitForAnswerFn } from '../lib/web-session';
import { getApiKey, getWorkspaceDir } from '../standalone-config';

function sanitizeFileName(name: string): string {
  const withoutIllegal = name.replace(/[<>:"/\\|?*]/g, '_');
  const withoutControlChars = Array.from(withoutIllegal)
    .map((char) => (char.charCodeAt(0) < 32 ? '_' : char))
    .join('');
  return withoutControlChars.replace(/\s+/g, ' ').trim() || 'attachment';
}

async function persistAttachments(
  attachments: SerializedAttachmentPayload[]
): Promise<SavedAttachmentInfo[]> {
  if (attachments.length === 0) return [];

  const workspaceDir = getWorkspaceDir();
  const destinationDir = join(workspaceDir, ATTACHMENTS_DIR_NAME);
  await mkdir(destinationDir, { recursive: true });

  const saves: SavedAttachmentInfo[] = [];

  for (const attachment of attachments) {
    if (attachment.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(
        `Attachment "${attachment.name}" exceeds the ${Math.floor(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB limit.`
      );
    }

    const sanitized = sanitizeFileName(attachment.name);
    const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitized}`;
    const savedPath = join(destinationDir, uniqueName);

    const buffer =
      attachment.data instanceof Uint8Array ?
        Buffer.from(attachment.data.buffer, attachment.data.byteOffset, attachment.data.byteLength)
      : Buffer.from(attachment.data);

    await writeFile(savedPath, buffer);

    const relativePath = relative(workspaceDir, savedPath);

    saves.push({
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      savedPath,
      relativePath: relativePath.startsWith('..') ? savedPath : relativePath
    });
  }

  return saves;
}

function buildUserMessage(text: string, attachments: SavedAttachmentInfo[]) {
  const contentBlocks: { type: 'text'; text: string }[] = [];
  if (text) {
    contentBlocks.push({ type: 'text', text });
  }

  attachments.forEach((attachment) => {
    const relativeSegment = attachment.relativePath;
    const relativeWithinWorkspace =
      relativeSegment && !relativeSegment.startsWith('..') ? relativeSegment : null;
    const readTarget =
      relativeWithinWorkspace ?
        relativeWithinWorkspace.startsWith('.') ?
          relativeWithinWorkspace
        : `./${relativeWithinWorkspace}`
      : attachment.savedPath;
    const displayPath = relativeWithinWorkspace ? readTarget : attachment.savedPath;
    const instruction = `Attachment "${attachment.name}" is available at ${displayPath}. Please run Read("${readTarget}") when you need to inspect it.`;
    contentBlocks.push({ type: 'text', text: instruction });
  });

  if (contentBlocks.length === 0) {
    contentBlocks.push({ type: 'text', text: 'User uploaded files without additional context.' });
  }

  return { role: 'user' as const, content: contentBlocks };
}

export function setupChatWebSocket(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  // Pending AskUserQuestion resolver — one at a time
  let pendingAnswerResolver: ((response: { answers: Record<string, string[]> }) => void) | null =
    null;

  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const url = request.url ?? '';
    if (url === '/ws' || url.startsWith('/ws?')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket) => {
    // Create sendEvent that writes to this WebSocket
    const sendEvent = (type: string, data?: unknown): void => {
      if (ws.readyState === ws.OPEN) {
        if (data !== undefined && data !== null) {
          if (typeof data === 'string') {
            ws.send(JSON.stringify({ type, chunk: data }));
          } else {
            ws.send(JSON.stringify({ type, ...((data as object) || {}) }));
          }
        } else {
          ws.send(JSON.stringify({ type }));
        }
      }
    };

    // WaitForAnswer callback — sends ask-user-question and awaits the response
    const waitForAnswer: WaitForAnswerFn = (questions) => {
      return new Promise((resolve) => {
        pendingAnswerResolver = resolve;
        sendEvent('ask-user-question', { questions });
      });
    };

    ws.on('message', async (raw) => {
      let msg: { type: string; [key: string]: unknown };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      try {
        switch (msg.type) {
          case 'send-message': {
            const payload = msg.payload as SendMessagePayload;
            const apiKey = getApiKey();
            if (!apiKey) {
              sendEvent('message-error', 'API key is not configured. Add your Anthropic API key in Settings or set ANTHROPIC_API_KEY.');
              return;
            }

            const text = payload.text?.trim() ?? '';
            const attachments = (payload.attachments ?? []) as SerializedAttachmentPayload[];

            if (!text && attachments.length === 0) {
              sendEvent('message-error', 'Please enter a message or attach a file before sending.');
              return;
            }

            const savedAttachments = await persistAttachments(attachments);
            const userMessage = buildUserMessage(text, savedAttachments);

            if (!isSessionActive()) {
              startStreamingSession(sendEvent, waitForAnswer).catch((error) => {
                console.error('Failed to start streaming session:', error);
              });
            }

            await new Promise<void>((resolve) => {
              messageQueue.push({ message: userMessage, resolve });
            });
            break;
          }

          case 'stop-message': {
            await interruptCurrentResponse(sendEvent);
            break;
          }

          case 'reset-session': {
            const resumeSessionId = typeof msg.resumeSessionId === 'string' ? msg.resumeSessionId : null;
            await resetSession(resumeSessionId);
            break;
          }

          case 'set-model-preference': {
            const preference = msg.preference as ChatModelPreference;
            await setChatModelPreference(preference);
            break;
          }

          case 'set-model-direct': {
            const modelId = msg.modelId as string;
            await setModelDirect(modelId);
            break;
          }

          case 'answer-user-question': {
            const answers = msg.answers as Record<string, string[]>;
            if (pendingAnswerResolver) {
              pendingAnswerResolver({ answers });
              pendingAnswerResolver = null;
            }
            break;
          }

          case 'get-model-preference': {
            sendEvent('model-preference', { preference: getCurrentModelPreference() });
            break;
          }

          case 'start-session': {
            if (!isSessionActive()) {
              startStreamingSession(sendEvent, waitForAnswer).catch((error) => {
                console.error('Failed to start session:', error);
              });
            }
            break;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendEvent('message-error', errorMessage);
      }
    });

    ws.on('close', () => {
      // Abort any pending answer resolver
      if (pendingAnswerResolver) {
        pendingAnswerResolver({ answers: {} });
        pendingAnswerResolver = null;
      }
      // Abort any in-flight streaming session to stop consuming API credits
      // Use a no-op sendEvent since client is already disconnected
      const noopSend = (_type: string, _data?: unknown) => {};
      interruptCurrentResponse(noopSend).catch(() => {});
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });
}
