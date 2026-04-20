import { CheckCircle2, Puzzle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/i18n/context';

import type { SkillInfo } from '../../shared/types/ipc';

interface SkillsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  loadedSkills?: string[];
}

export default function SkillsPanel({ isOpen, onClose, loadedSkills = [] }: SkillsPanelProps) {
  const { t } = useTranslation();
  const [skills, setSkills] = useState<SkillInfo[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { skills: s } = await window.electron.config.getSkills();
        if (!cancelled) setSkills(s);
      } catch {
        if (!cancelled) setSkills([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const loadedSet = new Set(loadedSkills);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      )}

      <div
        className={`fixed top-0 left-0 z-50 flex h-full w-80 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-primary)] shadow-[0_0_40px_rgba(0,0,0,0.4)] transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Puzzle className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-medium text-[var(--text-primary)]">{t('skills.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="px-4 pt-3 pb-2 text-xs text-[var(--text-muted)]">{t('skills.subtitle')}</p>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {skills.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">{t('skills.noSkills')}</p>
              <p className="mt-1 text-xs text-[var(--text-disabled)]">{t('skills.noSkillsHint')}</p>
            </div>
          )}

          {skills.map((skill) => {
            const isLoaded = loadedSet.has(skill.name);
            return (
              <div
                key={skill.path}
                className="mt-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {skill.name}
                  </span>
                  {isLoaded && (
                    <span className="flex items-center gap-1 text-[10px] text-[var(--success)]">
                      <CheckCircle2 className="h-3 w-3" />
                      {t('skills.loaded')}
                    </span>
                  )}
                </div>
                {skill.description && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{skill.description}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
