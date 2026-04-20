// Shared IPC response types used by both main and renderer processes

export interface WorkspaceDirResponse {
  workspaceDir: string;
}

export interface SuccessResponse {
  success: boolean;
  error?: string;
}

export type ChatModelPreference = 'fast' | 'smart-sonnet' | 'smart-opus';
export type SmartModelVariant = 'sonnet' | 'opus';

export interface SerializedAttachmentPayload {
  name: string;
  mimeType: string;
  size: number;
  data: ArrayBuffer | Uint8Array;
}

export interface SendMessagePayload {
  text: string;
  attachments?: SerializedAttachmentPayload[];
}

export interface GetChatModelPreferenceResponse {
  preference: ChatModelPreference;
}

export interface SetChatModelPreferenceResponse extends SuccessResponse {
  preference: ChatModelPreference;
}

export interface SavedAttachmentInfo {
  name: string;
  mimeType: string;
  size: number;
  savedPath: string;
  relativePath: string;
}

export interface SendMessageResponse {
  success: boolean;
  error?: string;
  attachments?: SavedAttachmentInfo[];
}

export interface ShellResponse {
  success: boolean;
  error?: string;
}

export interface SlashCommand {
  name: string;
  description: string;
  argumentHint: string;
}

export interface SessionInitData {
  tools: string[];
  slashCommands: string[];
  skills: string[];
  plugins: { name: string; path: string }[];
  mcpServers: { name: string; status: string }[];
  model: string;
  permissionMode: string;
}

export interface ModelInfo {
  value: string;
  displayName: string;
  description: string;
}

export interface SkillInfo {
  name: string;
  description: string;
  path: string;
}

export interface FileInfo {
  exists: boolean;
  size: number;
  extension: string;
  mimeType: string;
}
