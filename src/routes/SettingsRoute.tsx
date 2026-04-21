import { useTranslation } from 'react-i18next';

import { RouteLayout } from '../components/RouteLayout';
import { SettingsView } from '../features/settings/SettingsView';

export function SettingsRoute() {
  const { t } = useTranslation();
  return (
    <RouteLayout trail={[t('nav.settings').toLowerCase()]} hideStatus>
      <SettingsView />
    </RouteLayout>
  );
}
