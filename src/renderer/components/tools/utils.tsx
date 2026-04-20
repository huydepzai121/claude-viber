import { cloneElement, isValidElement } from 'react';
import type { ReactNode } from 'react';

import type { ToolUseSimple } from '@/types/chat';

import {
  getThinkingBadgeConfig,
  getThinkingExpandedLabel,
  getToolBadgeConfig,
  getToolExpandedLabel
} from './toolBadgeConfig';

export function getToolColors(toolName: string): {
  text: string;
  icon: string;
} {
  const config = getToolBadgeConfig(toolName);
  return {
    text: config.colors.text,
    icon: config.colors.iconColor
  };
}

interface ToolHeaderProps {
  icon?: ReactNode;
  label?: string;
  toolName?: string;
  tool?: ToolUseSimple;
}

export function ToolHeader({ icon, label, toolName, tool }: ToolHeaderProps) {
  const config = toolName ? getToolBadgeConfig(toolName) : null;
  let displayIcon = config?.icon || icon;

  if (config?.icon && isValidElement(displayIcon)) {
    const element = displayIcon as React.ReactElement<{ className?: string }>;
    const existingProps = element.props as { className?: string };
    const existingClassName = existingProps?.className || '';
    const newClassName =
      existingClassName ? existingClassName.replace(/size-\d+(\.\d+)?/g, 'size-3') : 'size-3';
    displayIcon = cloneElement(element, {
      ...existingProps,
      className: newClassName
    });
  }

  const displayLabel = tool ? getToolExpandedLabel(tool) : label || toolName || '';

  return (
    <div
      className={`flex items-center gap-1.5 text-sm font-medium ${config?.colors.text || 'text-[var(--text-muted)]'}`}
    >
      {displayIcon && (
        <span
          className={`flex h-4 w-4 items-center justify-center ${config?.colors.iconColor || 'text-[var(--text-disabled)]'}`}
        >
          {displayIcon}
        </span>
      )}
      <span className="tracking-tight">{displayLabel}</span>
    </div>
  );
}

export function MonoText({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <code className={`font-mono text-sm tracking-tight text-[var(--text-secondary)] ${className}`}>
      {children}
    </code>
  );
}

export function FilePath({ path }: { path: string }) {
  return (
    <MonoText className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5">
      {path}
    </MonoText>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <MonoText className="rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-1.5 py-0.5">
      {children}
    </MonoText>
  );
}

interface ThinkingHeaderProps {
  isComplete: boolean;
  durationMs?: number;
}

export function ThinkingHeader({ isComplete, durationMs }: ThinkingHeaderProps) {
  const config = getThinkingBadgeConfig();
  const label = getThinkingExpandedLabel(isComplete, durationMs);

  let displayIcon = config.icon;
  if (isValidElement(displayIcon)) {
    const element = displayIcon as React.ReactElement<{ className?: string }>;
    const existingProps = element.props as { className?: string };
    const existingClassName = existingProps?.className || '';
    const newClassName =
      existingClassName ? existingClassName.replace(/size-\d+(\.\d+)?/g, 'size-3') : 'size-3';
    displayIcon = cloneElement(element, {
      ...existingProps,
      className: newClassName
    });
  }

  return (
    <div className={`flex items-center gap-1.5 text-sm font-medium ${config.colors.text}`}>
      {displayIcon && (
        <span className={`flex h-4 w-4 items-center justify-center ${config.colors.iconColor}`}>
          {displayIcon}
        </span>
      )}
      <span className="tracking-wide">{label}</span>
    </div>
  );
}
