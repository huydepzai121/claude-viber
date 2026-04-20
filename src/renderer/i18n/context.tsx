import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import en from './en.json';
import vi from './vi.json';

export type Language = 'en' | 'vi';

const STORAGE_KEY = 'app-language';

const translations: Record<Language, Record<string, unknown>> = { en, vi };

function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function loadStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'vi' || stored === 'en') return stored;
  } catch {
    // localStorage unavailable — fall through
  }
  return 'en';
}

function persistLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage unavailable — ignore
  }
}

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(loadStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    persistLanguage(lang);
  }, []);

  // Update <html lang> attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Try active language first
      let value = getNestedValue(translations[language], key);

      // Fallback to English
      if (value === undefined && language !== 'en') {
        value = getNestedValue(translations.en, key);
      }

      // Last resort — return the key itself
      if (value === undefined) return key;

      // Interpolate {param} placeholders
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, name: string) =>
          name in params ? String(params[name]) : `{${name}}`
        );
      }

      return value;
    },
    [language]
  );

  return <I18nContext value={{ language, setLanguage, t }}>{children}</I18nContext>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
}
