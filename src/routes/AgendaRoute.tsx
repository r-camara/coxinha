import { useTranslation } from 'react-i18next';

import { RouteLayout } from '../components/RouteLayout';
import { AgendaView } from '../features/agenda/AgendaView';

export function AgendaRoute() {
  const { t } = useTranslation();
  return (
    <RouteLayout trail={[t('nav.agenda').toLowerCase()]} hideStatus>
      <AgendaView />
    </RouteLayout>
  );
}
