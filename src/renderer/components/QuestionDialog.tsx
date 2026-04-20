import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/i18n/context';

interface QuestionOption {
  id: string;
  label: string;
}

interface Question {
  id: string;
  title: string;
  options: QuestionOption[];
  allowMultiple?: boolean;
}

interface QuestionDialogProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string[]>) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function QuestionDialog({
  questions,
  onSubmit,
  onSkip,
  onClose
}: QuestionDialogProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus the dialog on mount
    dialog.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Focus trap: Tab cycles within dialog
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (questions.length === 0) return null;

  const currentQuestion = questions[currentIndex];
  const selectedOptions = answers[currentQuestion.id] ?? [];
  const totalQuestions = questions.length;

  const toggleOption = (optionId: string) => {
    setAnswers((prev) => {
      const current = prev[currentQuestion.id] ?? [];
      const isSelected = current.includes(optionId);
      const updated =
        isSelected ? current.filter((id) => id !== optionId)
        : currentQuestion.allowMultiple !== false ? [...current, optionId]
        : [optionId];
      return { ...prev, [currentQuestion.id]: updated };
    });
  };

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onSubmit(answers);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-dialog-title"
        tabIndex={-1}
        className="w-full max-w-xl rounded-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)] shadow-[0_16px_48px_rgba(0,0,0,0.5)] focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h3 id="question-dialog-title" className="text-sm font-medium text-[var(--accent)]">
            {currentQuestion.title}
          </h3>
          <div className="flex items-center gap-2">
            {/* Pagination */}
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-30"
                aria-label="Previous question"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span>
                {currentIndex + 1} {t('questionDialog.of')} {totalQuestions}
              </span>
              <button
                onClick={goNext}
                disabled={currentIndex === totalQuestions - 1}
                className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-30"
                aria-label="Next question"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-1 px-3 pb-3">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                  isSelected ?
                    'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected ?
                      'border-[var(--accent-blue)] bg-[var(--accent-blue)]'
                    : 'border-[var(--border-strong)] bg-transparent'
                  }`}
                >
                  {isSelected && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3">
          <span className="text-xs text-[var(--text-muted)]">
            {t('questionDialog.selected', { count: String(selectedOptions.length) })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="rounded-lg px-4 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              {t('questionDialog.skip')}
            </button>
            <button
              onClick={goNext}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] transition-colors hover:opacity-80"
              aria-label="Next"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
