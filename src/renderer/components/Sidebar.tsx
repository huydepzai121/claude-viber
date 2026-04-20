import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Lightbulb,
  Plus,
  Search,
  Settings,
  User
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/i18n/context';

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface RecentSession {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewTask: () => void;
  onOpenSearch?: () => void;
  onOpenIdeas?: () => void;
  onLoadSession?: (sessionId: string) => void;
  recentSessions?: RecentSession[];
  onboardingTasks?: OnboardingTask[];
  onToggleOnboardingTask?: (taskId: string) => void;
  onDismissOnboarding?: () => void;
  showOnboarding?: boolean;
  updateAvailable?: {
    version: string;
    onRelaunch: () => void;
  } | null;
  userProfile?: {
    name: string;
    plan: string;
    avatar?: string;
  } | null;
  onOpenSettings?: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  onNewTask,
  onOpenSearch,
  onOpenIdeas,
  onLoadSession,
  recentSessions = [],
  onboardingTasks = [],
  onToggleOnboardingTask,
  onDismissOnboarding,
  showOnboarding = true,
  updateAvailable,
  userProfile,
  onOpenSettings
}: SidebarProps) {
  const { t } = useTranslation();
  const [onboardingExpanded, setOnboardingExpanded] = useState(true);

  const completedOnboardingCount = onboardingTasks.filter((task) => task.completed).length;
  const onboardingProgress =
    onboardingTasks.length > 0 ? completedOnboardingCount / onboardingTasks.length : 0;

  const navItems = [
    { icon: Plus, label: t('sidebar.newTask'), onClick: onNewTask, primary: true },
    { icon: Search, label: t('sidebar.search'), onClick: onOpenSearch },
    { icon: Lightbulb, label: t('sidebar.ideas'), onClick: onOpenIdeas },
    { icon: Settings, label: t('sidebar.settings'), onClick: onOpenSettings }
  ];

  const isWindows = navigator.platform.toLowerCase().includes('win');

  return (
    <aside
      className={`relative flex h-full flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-all duration-300 ${
        isCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      }`}
    >
      {/* Collapse toggle button */}
      <button
        onClick={onToggleCollapse}
        className="absolute top-4 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-medium)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
        aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
      >
        {isCollapsed ?
          <ChevronRight className="h-3 w-3" />
        : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Navigation items — add top padding for macOS traffic lights */}
      <nav className={`flex flex-col gap-1 p-2 ${isWindows ? 'pt-2' : 'pt-8'}`}>
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            disabled={!item.onClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              item.primary ?
                'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon
              className={`h-4 w-4 flex-shrink-0 ${item.primary ? 'text-[var(--text-primary)]' : ''}`}
            />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-3 my-2 border-t border-[var(--border-subtle)]" />

      {/* Onboarding section */}
      {showOnboarding && !isCollapsed && onboardingTasks.length > 0 && !Boolean((window as any).__isWebMode) && (
        <div className="px-3">
          <button
            onClick={() => setOnboardingExpanded(!onboardingExpanded)}
            aria-expanded={onboardingExpanded}
            className="flex w-full items-center justify-between py-2 text-xs font-medium text-[var(--text-muted)]"
          >
            <span>{t('sidebar.getToKnow')}</span>
            <div className="flex items-center gap-2">
              {/* Progress circle */}
              <svg className="h-4 w-4" viewBox="0 0 20 20">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="var(--border-medium)"
                  strokeWidth="2"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeDasharray={`${onboardingProgress * 50.27} 50.27`}
                  strokeLinecap="round"
                  transform="rotate(-90 10 10)"
                />
              </svg>
            </div>
          </button>

          {onboardingExpanded && (
            <div className="space-y-2 pb-3">
              {onboardingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onToggleOnboardingTask?.(task.id)}
                  className="flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors hover:bg-[var(--bg-elevated)]"
                >
                  {task.completed ?
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--success)]" />
                  : <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium ${task.completed ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}
                    >
                      {task.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{task.description}</div>
                  </div>
                </button>
              ))}
              {onDismissOnboarding && completedOnboardingCount === onboardingTasks.length && (
                <button
                  onClick={onDismissOnboarding}
                  className="mt-2 w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-raised)]"
                >
                  {t('sidebar.dismissOnboarding')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recents section */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto px-3">
          <div className="py-2 text-xs font-medium text-[var(--text-muted)]">
            {t('sidebar.recents')}
          </div>
          {recentSessions.length === 0 ?
            <div className="py-2 text-sm text-[var(--text-disabled)]">
              {t('sidebar.noSessions')}
            </div>
          : <div className="space-y-1">
              {recentSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onLoadSession?.(session.id)}
                  className="flex w-full flex-col items-start rounded-lg p-2 text-left transition-colors hover:bg-[var(--bg-elevated)]"
                >
                  <span className="truncate text-sm text-[var(--text-primary)]">
                    {session.title}
                  </span>
                </button>
              ))}
            </div>
          }
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Update notification */}
      {updateAvailable && !isCollapsed && (
        <div className="mx-3 mb-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
          <div className="mb-3 flex justify-center">
            {/* Leaf icon */}
            <svg
              className="h-12 w-12 text-[var(--text-secondary)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.5 5.07-1.37" />
              <path d="M17 8c-4 0-7 3-7 7" />
              <path d="M22 2L12 12" />
              <path d="M22 2c0 0-6.5 0-10 3.5S8 16 8 16" />
            </svg>
          </div>
          <div className="mb-1 text-center text-sm font-medium text-[var(--text-primary)]">
            {t('sidebar.updatedTo', { version: updateAvailable.version })}
          </div>
          <div className="mb-3 text-center text-xs text-[var(--text-muted)]">
            {t('sidebar.relaunchToApply')}
          </div>
          <button
            onClick={updateAvailable.onRelaunch}
            className="w-full rounded-lg border border-[var(--border-medium)] bg-[var(--bg-raised)] py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface)]"
          >
            {t('sidebar.relaunch')}
          </button>
        </div>
      )}

      {/* User profile */}
      <div className="border-t border-[var(--border-subtle)] p-3">
        <button
          onClick={onOpenSettings}
          className={`flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--bg-elevated)] ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white">
            {userProfile?.avatar ?
              <img
                src={userProfile.avatar}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            : userProfile?.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                {userProfile?.name || t('sidebar.user')}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {userProfile?.plan || t('sidebar.freePlan')}
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
