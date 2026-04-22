import { useTranslation } from 'react-i18next';

import { AppShell } from '../components/AppShell';
import { SettingsView } from '../features/settings/SettingsView';

export function SettingsRoute() {
  const { t } = useTranslation();
  return (
    <AppShell
      trail={[t('nav.settings').toLowerCase()]}
      tabs={[{ id: 'settings', label: t('nav.settings'), active: true }]}
    >
      <SettingsView />
    </AppShell>
  );
}
