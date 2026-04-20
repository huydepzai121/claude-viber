import { useTranslation } from '@/i18n/context';

export default function Greeting() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      {/* Coral sparkle icon */}
      <div className="mb-4 text-4xl text-[var(--accent)]">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
        </svg>
      </div>
      <h1 className="mb-2 text-center text-3xl font-semibold text-[var(--text-primary)]">
        {t('greeting.title')}
      </h1>
      <p className="text-center text-sm text-[var(--text-muted)]">{t('greeting.subtitle')}</p>
    </div>
  );
}
