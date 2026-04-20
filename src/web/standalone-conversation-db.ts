/**
 * Standalone conversation DB for web server mode.
 * Mirror of src/main/lib/conversation-db.ts — keep in sync.
 * Differences: uses ~/.claude-agent-desktop/conversations/ instead of app.getPath('userData').
 * No Electron imports.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Conversation {
  id: string;
  title: string;
  messages: string; // JSON stringified Message[]
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  sessionId?: string | null;
}

interface ConversationFile {
  id: string;
  title: string;
  messages: unknown[];
  createdAt: number;
  updatedAt: number;
  sessionId?: string | null;
}

let conversationsDir: string | null = null;

function getConversationsDir(): string {
  if (!conversationsDir) {
    conversationsDir = join(homedir(), '.claude-agent-desktop', 'conversations');
    if (!existsSync(conversationsDir)) {
      mkdirSync(conversationsDir, { recursive: true });
    }
  }
  return conversationsDir;
}

function getConversationFilePath(id: string): string {
  return join(getConversationsDir(), `${id}.json`);
}

function readConversationFile(id: string): ConversationFile | null {
  const filePath = getConversationFilePath(id);
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const fileContent = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as ConversationFile;
  } catch (error) {
    console.error(`Error reading conversation file ${id}:`, error);
    return null;
  }
}

function writeConversationFile(conversation: ConversationFile): void {
  const filePath = getConversationFilePath(conversation.id);
  writeFileSync(filePath, JSON.stringify(conversation, null, 2), 'utf-8');
}

export function initializeDatabase(): void {
  getConversationsDir();
}

export function closeDatabase(): void {
  conversationsDir = null;
}

export function createConversation(
  title: string,
  messages: unknown[],
  sessionId?: string | null
): Conversation {
  const id = Date.now().toString();
  const now = Date.now();

  const conversationFile: ConversationFile = {
    id,
    title,
    messages,
    createdAt: now,
    updatedAt: now,
    sessionId
  };

  writeConversationFile(conversationFile);

  return {
    id,
    title,
    messages: JSON.stringify(messages),
    createdAt: now,
    updatedAt: now,
    sessionId
  };
}

export function updateConversation(
  id: string,
  title?: string,
  messages?: unknown[],
  sessionId?: string | null
): void {
  const existing = readConversationFile(id);
  if (!existing) {
    throw new Error(`Conversation ${id} not found`);
  }

  const messagesChanged =
    messages !== undefined && JSON.stringify(existing.messages) !== JSON.stringify(messages);
  const titleChanged = title !== undefined && existing.title !== title;
  const now = Date.now();
  const sessionIdChanged = sessionId !== undefined && existing.sessionId !== sessionId;

  const updated: ConversationFile = {
    ...existing,
    ...(title !== undefined && { title }),
    ...(messages !== undefined && { messages }),
    ...(sessionId !== undefined && { sessionId }),
    ...((messagesChanged || titleChanged || sessionIdChanged) && { updatedAt: now })
  };

  writeConversationFile(updated);
}

export function getConversation(id: string): Conversation | null {
  const conversationFile = readConversationFile(id);
  if (!conversationFile) {
    return null;
  }

  return {
    id: conversationFile.id,
    title: conversationFile.title,
    messages: JSON.stringify(conversationFile.messages),
    createdAt: conversationFile.createdAt,
    updatedAt: conversationFile.updatedAt,
    sessionId: conversationFile.sessionId ?? null
  };
}

export function listConversations(limit: number = 100): Conversation[] {
  const dir = getConversationsDir();
  const files = readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const id = file.replace('.json', '');
      const filePath = join(dir, file);
      try {
        const fileContent = readFileSync(filePath, 'utf-8');
        const conversationFile = JSON.parse(fileContent) as ConversationFile;
        return { id, updatedAt: conversationFile.updatedAt, conversationFile };
      } catch (error) {
        console.error(`Error reading conversation file ${id}:`, error);
        return null;
      }
    })
    .filter(
      (item): item is { id: string; updatedAt: number; conversationFile: ConversationFile } =>
        item !== null
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);

  return files.map(({ conversationFile }) => ({
    id: conversationFile.id,
    title: conversationFile.title,
    messages: JSON.stringify(conversationFile.messages),
    createdAt: conversationFile.createdAt,
    updatedAt: conversationFile.updatedAt,
    sessionId: conversationFile.sessionId ?? null
  }));
}

export function deleteConversation(id: string): void {
  const filePath = getConversationFilePath(id);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

export function generateTitleFromMessages(messages: unknown[]): string {
  for (const msg of messages) {
    if (typeof msg === 'object' && msg !== null && 'role' in msg && msg.role === 'user') {
      let content = '';
      if ('content' in msg && typeof msg.content === 'string') {
        content = msg.content;
      }
      return content.length > 60 ? content.substring(0, 60) + '...' : content || 'New Chat';
    }
  }
  return 'New Chat';
}
