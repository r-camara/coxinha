import { useTranslation } from 'react-i18next';

import { RouteLayout } from '../components/RouteLayout';
import { MeetingsView } from '../features/meetings/MeetingsView';

export function MeetingsRoute() {
  const { t } = useTranslation();
  return (
    <RouteLayout trail={[t('nav.meetings').toLowerCase()]} hideStatus>
      <MeetingsView />
    </RouteLayout>
  );
}
