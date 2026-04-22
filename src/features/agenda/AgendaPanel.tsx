import { useTranslation } from 'react-i18next';
import { Calendar, FileText } from 'lucide-react';

import { useAgenda, type AgendaEvent } from './fixtures';

export function AgendaPanel() {
  const { t } = useTranslation();
  const events = useAgenda();
  const grouped = groupByDay(events);

  return (
    <div className="p-4 flex flex-col gap-6">
      <section>
        <h4 className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-2">
          {t('agendaPanel.upcoming')}
        </h4>
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('agendaPanel.empty')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map((group) => (
              <div key={group.dateLabel}>
                <p className="text-[11px] text-muted-foreground/70 mb-1">
                  {group.dateLabel}
                </p>
                <ul className="flex flex-col">
                  {group.events.map((ev) => (
                    <li key={ev.id}>
                      <EventRow event={ev} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EventRow({ event }: { event: AgendaEvent }) {
  const { t } = useTranslation();
  const time = new Date(event.startsAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <article className="flex items-start gap-2 py-2 border-b border-border last:border-0">
      <Calendar
        size={14}
        aria-hidden="true"
        className="mt-0.5 text-muted-foreground shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium truncate">{event.title}</p>
        <p className="text-[12px] text-muted-foreground">
          {time} · {event.durationMin}
          {t('agendaPanel.minutesSuffix')}
        </p>
        {event.meetingId && (
          <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1 mt-1">
            <FileText size={10} aria-hidden="true" />
            {t('agendaPanel.hasMeetingNote')}
          </p>
        )}
      </div>
    </article>
  );
}

function groupByDay(
  events: AgendaEvent[],
): Array<{ dateLabel: string; events: AgendaEvent[] }> {
  const buckets = new Map<string, AgendaEvent[]>();
  for (const ev of events) {
    const key = new Date(ev.startsAt).toLocaleDateString(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
    const bucket = buckets.get(key) ?? [];
    bucket.push(ev);
    buckets.set(key, bucket);
  }
  return Array.from(buckets, ([dateLabel, evs]) => ({
    dateLabel,
    events: evs,
  }));
}
