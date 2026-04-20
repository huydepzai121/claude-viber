import { useEffect } from 'react';

import { useUserQuestion } from '@/contexts/UserQuestionContext';
import type { ToolUseSimple } from '@/types/chat';

import { CollapsibleTool } from './CollapsibleTool';
import { ToolHeader } from './utils';

interface QuestionOption {
  label: string;
  description?: string;
}

interface Question {
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

interface AskUserQuestionInput {
  questions: Question[];
}

interface AskUserQuestionToolProps {
  tool: ToolUseSimple;
}

export default function AskUserQuestionTool({ tool }: AskUserQuestionToolProps) {
  const input = tool.parsedInput as AskUserQuestionInput | undefined;
  const { showQuestions, pendingQuestions } = useUserQuestion();
  const hasResult = Boolean(tool.result);
  const hasQuestions = Boolean(input?.questions?.length);

  // When tool input is parsed and no result yet, show the dialog
  useEffect(() => {
    if (hasQuestions && !hasResult && pendingQuestions.length === 0) {
      const questions = input!.questions.map((q, i) => ({
        id: `q-${i}`,
        question: q.question,
        header: q.header,
        options: q.options.map((o) => ({ label: o.label, description: o.description })),
        multiSelect: q.multiSelect
      }));
      showQuestions(questions);
    }
  }, [hasQuestions, hasResult, input, showQuestions, pendingQuestions.length]);

  if (!hasQuestions) {
    return (
      <div className="my-0.5">
        <ToolHeader tool={tool} toolName={tool.name} />
      </div>
    );
  }

  const questions = input!.questions;

  const collapsedContent = (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolHeader tool={tool} toolName="Question" />
      <span className="rounded border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
        {questions.length} {questions.length === 1 ? 'question' : 'questions'}
      </span>
      {hasResult && (
        <span className="rounded border border-[var(--success)]/30 bg-[var(--success)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--success)]">
          answered
        </span>
      )}
    </div>
  );

  const expandedContent =
    hasResult ?
      <pre className="rounded bg-[var(--bg-elevated)]/50 px-2 py-1 text-xs whitespace-pre-wrap text-[var(--text-secondary)]">
        {tool.result}
      </pre>
    : <div className="text-xs text-[var(--text-muted)] italic">Waiting for your answer...</div>;

  return (
    <CollapsibleTool
      collapsedContent={collapsedContent}
      expandedContent={expandedContent}
      defaultExpanded={!hasResult}
    />
  );
}
