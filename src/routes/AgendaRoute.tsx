import { useTranslation } from 'react-i18next';

import { AppShell } from '../components/AppShell';
import { AgendaPanel } from '../features/agenda/AgendaPanel';
import { AgendaView } from '../features/agenda/AgendaView';

export function AgendaRoute() {
  const { t } = useTranslation();
  return (
    <AppShell
      trail={[t('nav.agenda').toLowerCase()]}
      tabs={[{ id: 'agenda', label: t('nav.agenda'), active: true }]}
      sidePanel={<AgendaPanel />}
    >
      <AgendaView />
    </AppShell>
  );
}
