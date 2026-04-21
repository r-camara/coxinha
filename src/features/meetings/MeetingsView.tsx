import { useTranslation } from 'react-i18next';

export function MeetingsView() {
  const { t } = useTranslation();
  return (
    <section className="p-8" aria-labelledby="meetings-heading">
      <h1 id="meetings-heading" className="cx-display text-4xl mb-4">
        {t('meetings.title')}
      </h1>
      <p className="text-muted-foreground">{t('meetings.comingSoon')}</p>
    </section>
  );
}
