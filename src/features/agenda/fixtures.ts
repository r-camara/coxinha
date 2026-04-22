export interface AgendaEvent {
  id: string;
  title: string;
  startsAt: string;
  durationMin: number;
  participants: string[];
  meetingId?: string;
  linkedNoteId?: string;
}

export const __isFixture = true;

/**
 * Fixture agenda dataset. Upcoming events synthesized around 2026-04-22.
 * Shape matches spec 0057's AgendaEvent row so the side-panel consumer
 * stays stable when the real calendar integration lands.
 */
export const agendaFixtures: AgendaEvent[] = [
  {
    id: 'ev-1',
    title: 'IT Weekly Status',
    startsAt: '2026-04-22T10:00:00-03:00',
    durationMin: 45,
    participants: ['Rita', 'Ana', 'Kathia'],
    meetingId: 'it-weekly-status',
  },
  {
    id: 'ev-2',
    title: '1:1 Kathia',
    startsAt: '2026-04-22T14:00:00-03:00',
    durationMin: 30,
    participants: ['Kathia'],
  },
  {
    id: 'ev-3',
    title: 'Roadmap NPV — revisão',
    startsAt: '2026-04-23T09:30:00-03:00',
    durationMin: 60,
    participants: ['Rita', 'Sofia', 'Rodolfo'],
  },
];

export function useAgenda(): AgendaEvent[] {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[fixture] agenda.useAgenda');
  }
  return agendaFixtures;
}
