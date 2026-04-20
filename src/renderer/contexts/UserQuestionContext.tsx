import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface PendingQuestion {
  id: string;
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

interface UserQuestionContextValue {
  pendingQuestions: PendingQuestion[];
  showQuestions: (questions: PendingQuestion[]) => void;
  clearQuestions: () => void;
  onAnswer: ((answers: Record<string, string[]>) => void) | null;
  setOnAnswer: (handler: ((answers: Record<string, string[]>) => void) | null) => void;
}

const UserQuestionContext = createContext<UserQuestionContextValue | null>(null);

export function UserQuestionProvider({ children }: { children: ReactNode }) {
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestion[]>([]);
  const [onAnswer, setOnAnswerState] = useState<
    ((answers: Record<string, string[]>) => void) | null
  >(null);

  const showQuestions = useCallback((questions: PendingQuestion[]) => {
    setPendingQuestions(questions);
  }, []);

  const clearQuestions = useCallback(() => {
    setPendingQuestions([]);
    setOnAnswerState(null);
  }, []);

  const setOnAnswer = useCallback(
    (handler: ((answers: Record<string, string[]>) => void) | null) => {
      setOnAnswerState(() => handler);
    },
    []
  );

  return (
    <UserQuestionContext
      value={{ pendingQuestions, showQuestions, clearQuestions, onAnswer, setOnAnswer }}
    >
      {children}
    </UserQuestionContext>
  );
}

export function useUserQuestion(): UserQuestionContextValue {
  const ctx = useContext(UserQuestionContext);
  if (!ctx) {
    throw new Error('useUserQuestion must be used within a UserQuestionProvider');
  }
  return ctx;
}
