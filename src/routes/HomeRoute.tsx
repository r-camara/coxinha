import { useTranslation } from 'react-i18next';

import { AppShell } from '../components/AppShell';
import { HomeCanvas } from '../features/home/HomeCanvas';
import { HomePanel } from '../features/home/HomePanel';

export function HomeRoute() {
  const { t } = useTranslation();
  return (
    <AppShell
      trail={[t('nav.home').toLowerCase()]}
      tabs={[{ id: 'home', label: t('nav.home'), active: true }]}
      sidePanel={<HomePanel />}
    >
      <HomeCanvas />
    </AppShell>
  );
}
