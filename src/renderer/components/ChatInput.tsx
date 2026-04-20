import { ArrowRight, Folder, Loader2, Plus, Square } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import AttachmentPreviewList from '@/components/AttachmentPreviewList';
import FolderPicker from '@/components/FolderPicker';
import ModelSelectorDropdown from '@/components/ModelSelectorDropdown';
import SlashCommandMenu from '@/components/SlashCommandMenu';
import { useTranslation } from '@/i18n/context';

import type { ChatModelPreference, SessionInitData, SlashCommand } from '../../shared/types/ipc';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onStopStreaming?: () => void;
  autoFocus?: boolean;
  onHeightChange?: (height: number) => void;
  attachments?: {
    id: string;
    file: File;
    previewUrl?: string;
    previewIsBlobUrl?: boolean;
    isImage: boolean;
  }[];
  onFilesSelected?: (files: FileList | File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  canSend?: boolean;
  attachmentError?: string | null;
  modelPreference: ChatModelPreference;
  onModelPreferenceChange: (preference: ChatModelPreference) => void;
  isModelPreferenceUpdating?: boolean;
  currentModelId?: string;
  onModelChange?: (modelId: string) => void;
  slashCommands?: SlashCommand[];
  sessionInitData?: SessionInitData | null;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  onStopStreaming,
  autoFocus = false,
  onHeightChange,
  attachments = [],
  onFilesSelected,
  onRemoveAttachment,
  canSend,
  attachmentError,
  modelPreference: _modelPreference,
  onModelPreferenceChange: _onModelPreferenceChange,
  isModelPreferenceUpdating: _isModelPreferenceUpdating = false,
  currentModelId = 'claude-sonnet-4-6',
  onModelChange,
  slashCommands = [],
  sessionInitData
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MIN_TEXTAREA_HEIGHT = 44;
  const MAX_TEXTAREA_HEIGHT = 200;
  const lastReportedHeightRef = useRef<number | null>(null);
  const dragCounterRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const computedCanSend = canSend ?? Boolean(value.trim());
  const { t } = useTranslation();
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
  const [recentFolders, setRecentFolders] = useState<string[]>([]);

  // Slash command autocomplete state
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [slashMenuDismissed, setSlashMenuDismissed] = useState(false);
  const [filesystemCommands, setFilesystemCommands] = useState<SlashCommand[]>([]);
  const slashFilter = value.startsWith('/') ? value.slice(1).split(' ')[0] : '';
  const slashMenuId = 'slash-command-menu';

  // Load commands from ~/.claude/ on mount
  useEffect(() => {
    window.electron.config
      .getClaudeCommands()
      .then(({ commands }) => {
        setFilesystemCommands(commands);
      })
      .catch(() => {
        // ignore — filesystem may not be accessible
      });
    // Load current workspace
    window.electron.config
      .getWorkspaceDir()
      .then(({ workspaceDir }) => {
        setCurrentWorkspace(workspaceDir);
      })
      .catch(() => {});
    // Load recent folders
    window.electron.config
      .getRecentFolders()
      .then(({ folders }) => {
        setRecentFolders(folders);
      })
      .catch(() => {});

    const unsubWorkspace = window.electron.config.onWorkspaceChanged(({ workspaceDir }) => {
      setCurrentWorkspace(workspaceDir);
      window.electron.config
        .getRecentFolders()
        .then(({ folders }) => setRecentFolders(folders))
        .catch(() => {});
    });

    return () => {
      unsubWorkspace();
    };
  }, []);

  // Build effective commands: prefer SDK data, fallback to init data, then filesystem
  const effectiveCommands: SlashCommand[] =
    slashCommands.length > 0 ?
      slashCommands.map((cmd) => ({
        ...cmd,
        name: cmd.name.startsWith('/') ? cmd.name : `/${cmd.name}`
      }))
    : (sessionInitData?.slashCommands ?? []).length > 0 ?
      (sessionInitData?.slashCommands ?? []).map((name) => ({
        name: name.startsWith('/') ? name : `/${name}`,
        description: '',
        argumentHint: ''
      }))
    : filesystemCommands;

  const filteredCommands = effectiveCommands.filter((cmd) =>
    cmd.name.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Derive showSlashMenu: starts with /, no space yet, has matches, not dismissed
  const showSlashMenu =
    value.startsWith('/') &&
    !value.includes(' ') &&
    filteredCommands.length > 0 &&
    !slashMenuDismissed;

  // Clamp selectedIndex to valid range
  const clampedSlashIndex = Math.min(slashSelectedIndex, Math.max(0, filteredCommands.length - 1));

  // Active descendant id for ARIA
  const activeDescendantId =
    showSlashMenu ? `${slashMenuId}-option-${clampedSlashIndex}` : undefined;

  const handleSlashSelect = (command: SlashCommand) => {
    const name = command.name.startsWith('/') ? command.name : `/${command.name}`;
    onChange(name + ' ');
    setSlashMenuDismissed(false);
  };

  const reportHeight = useCallback(
    (height: number) => {
      if (!onHeightChange) return;
      const roundedHeight = Math.round(height);
      if (lastReportedHeightRef.current === roundedHeight) return;
      lastReportedHeightRef.current = roundedHeight;
      onHeightChange(roundedHeight);
    },
    [onHeightChange]
  );

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const measuredHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${Math.max(measuredHeight, MIN_TEXTAREA_HEIGHT)}px`;
  };

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle slash command menu navigation
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        return;
      }
      if (e.key === 'Enter' && filteredCommands[slashSelectedIndex]) {
        e.preventDefault();
        handleSlashSelect(filteredCommands[slashSelectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenuDismissed(true);
        return;
      }
      if (e.key === 'Tab' && filteredCommands[slashSelectedIndex]) {
        e.preventDefault();
        handleSlashSelect(filteredCommands[slashSelectedIndex]);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && computedCanSend) {
        onSend();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items);
    const fileItems = items.filter((item) => item.kind === 'file');

    if (fileItems.length > 0) {
      e.preventDefault();
      const files: File[] = [];

      for (const item of fileItems) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }

      if (files.length > 0) {
        onFilesSelected?.(files);
      }
    }
  };

  const handleInputContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    if (
      tag !== 'TEXTAREA' &&
      tag !== 'BUTTON' &&
      tag !== 'SELECT' &&
      tag !== 'OPTION' &&
      textareaRef.current
    ) {
      textareaRef.current.focus();
    }
  };

  const handleTextareaInput = () => {
    adjustTextareaHeight();
  };

  const handleRemoveAttachmentClick = (attachmentId: string) => {
    onRemoveAttachment?.(attachmentId);
  };

  const handleAttachmentButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      onFilesSelected?.(event.target.files);
    }
    event.target.value = '';
  };

  const isFileDrag = (event: React.DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes('Files');

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDragActive(false);
    if (event.dataTransfer?.files?.length) {
      onFilesSelected?.(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    reportHeight(element.getBoundingClientRect().height);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      reportHeight(entry.contentRect.height);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [reportHeight]);

  return (
    <div
      ref={containerRef}
      className="sticky inset-x-0 bottom-0 z-10 px-4 pt-6 pb-5 [-webkit-app-region:no-drag]"
    >
      <div className="mx-auto max-w-3xl">
        <div className="relative">
          <SlashCommandMenu
            commands={filteredCommands}
            selectedIndex={clampedSlashIndex}
            onSelect={handleSlashSelect}
            visible={showSlashMenu}
            menuId={slashMenuId}
          />
          <div
            className={`rounded-2xl border bg-[var(--bg-surface)] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${
              isDragActive ? 'border-[var(--accent)]/60' : 'border-[var(--border-medium)]'
            }`}
            onClick={handleInputContainerClick}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
            />

            {attachments.length > 0 && (
              <AttachmentPreviewList
                attachments={attachments.map((attachment) => ({
                  id: attachment.id,
                  name: attachment.file.name,
                  size: attachment.file.size,
                  isImage: attachment.isImage,
                  previewUrl: attachment.previewUrl
                }))}
                onRemove={handleRemoveAttachmentClick}
                className="mb-2 px-2"
              />
            )}

            {attachmentError && (
              <p className="px-3 pb-2 text-xs text-[var(--error)]">{attachmentError}</p>
            )}

            <div className="relative">
              {/* Styled overlay for slash command coloring — only while typing command name (no space yet) */}
              {value.startsWith('/') && !value.includes(' ') && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 overflow-hidden px-3 py-2 text-[length:inherit] leading-[inherit] break-words whitespace-pre-wrap"
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
                    maxHeight: `${MAX_TEXTAREA_HEIGHT}px`
                  }}
                >
                  <span className="font-semibold text-[var(--accent)]">{value}</span>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setSlashSelectedIndex(0);
                  setSlashMenuDismissed(false);
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={t('chat.placeholder')}
                rows={1}
                role="combobox"
                aria-expanded={showSlashMenu}
                aria-haspopup="listbox"
                aria-controls={showSlashMenu ? slashMenuId : undefined}
                aria-activedescendant={activeDescendantId}
                aria-autocomplete="list"
                className={`w-full resize-none border-0 bg-transparent px-3 py-2 pr-12 placeholder-[var(--text-muted)] focus:outline-none ${
                  value.startsWith('/') && !value.includes(' ') ?
                    'text-transparent caret-[var(--text-primary)]'
                  : 'text-[var(--text-primary)]'
                }`}
                style={{
                  minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
                  maxHeight: `${MAX_TEXTAREA_HEIGHT}px`
                }}
                onInput={handleTextareaInput}
              />
              {/* Send/Stop button inside textarea area */}
              <div className="absolute right-2 bottom-2">
                <button
                  onClick={isLoading && onStopStreaming ? onStopStreaming : onSend}
                  disabled={isLoading && onStopStreaming ? false : !computedCanSend || isLoading}
                  aria-label={
                    isLoading && onStopStreaming ? t('chat.stopStreaming') : t('chat.send')
                  }
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    isLoading && onStopStreaming ?
                      'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-raised)]'
                    : computedCanSend ?
                      'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-80'
                    : 'text-[var(--text-disabled)]'
                  }`}
                >
                  {isLoading ?
                    onStopStreaming ?
                      <Square className="h-4 w-4" />
                    : <Loader2 className="h-4 w-4 animate-spin" />
                  : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pt-2">
              <div className="flex items-center gap-1">
                {Boolean((window as any).__isWebMode) ? (
                  <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-secondary)]">
                    <Folder className="h-4 w-4" />
                    <span>{currentWorkspace ? currentWorkspace.split('/').pop() : 'Workspace'}</span>
                    <a
                      href="https://www.npmjs.com/package/claude-viber"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-xs text-[var(--accent)] hover:underline"
                      title="npm i -g claude-viber && claude-viber-app"
                    >
                      Cài app
                    </a>
                  </div>
                ) : (
                  <FolderPicker
                    currentFolder={currentWorkspace}
                    recentFolders={recentFolders}
                    onFolderChange={(folder) => {
                      setCurrentWorkspace(folder);
                      window.electron.config.setWorkspaceDir(folder).catch((err) => {
                        console.error('Failed to set workspace:', err);
                      });
                      window.electron.config
                        .addRecentFolder(folder)
                        .then(() => {
                          window.electron.config
                            .getRecentFolders()
                            .then(({ folders }) => {
                              setRecentFolders(folders);
                            })
                            .catch(() => {});
                        })
                        .catch(() => {});
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={handleAttachmentButtonClick}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
                  title={t('attachments.attach')}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <ModelSelectorDropdown
                  currentModelId={currentModelId}
                  onModelChange={(modelId) => onModelChange?.(modelId)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
