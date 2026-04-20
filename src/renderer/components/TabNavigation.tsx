import { useTranslation } from '@/i18n/context';

export default function TabNavigation() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center [-webkit-app-region:drag]">
      <div className="rounded-lg bg-[var(--bg-elevated)] px-4 py-1.5 [-webkit-app-region:no-drag]">
        <span className="text-sm font-medium text-[var(--text-primary)]">{t('tabs.cowork')}</span>
      </div>
    </div>
  );
}
