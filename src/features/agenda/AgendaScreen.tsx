import { useMemo } from 'react';
import { Icon } from '../../components/Icon';
import { Avatar } from '../../components/Avatar';
import { formatTime } from '../../lib/format';
import { useApp } from '../../store/AppContext';
import styles from './AgendaScreen.module.css';

const MONTHS_SHORT = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];

function nextBirthday(iso: string): Date {
  const d = new Date(iso);
  const now = new Date();
  const next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next < new Date(now.toDateString())) next.setFullYear(now.getFullYear() + 1);
  return next;
}

export function AgendaScreen() {
  const { feed, members, memberById } = useApp();

  const events = useMemo(
    () => feed.filter((p) => p.type === 'event' && p.eventDate).sort((a, b) => a.eventDate! - b.eventDate!),
    [feed],
  );

  const birthdays = useMemo(
    () =>
      members
        .filter((m) => m.birthDate)
        .map((m) => ({ m, date: nextBirthday(m.birthDate!), birth: new Date(m.birthDate!) }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 5),
    [members],
  );

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Agenda</h1>
        <p className={styles.sub}>Rendez-vous & moments à venir</p>
      </header>

      <p className="overline" style={{ padding: '0 16px 8px' }}>
        Prochains événements
      </p>
      <ul className={styles.list}>
        {events.map((e) => {
          const d = new Date(e.eventDate!);
          const author = memberById(e.authorId);
          return (
            <li key={e.id} className={styles.event}>
              <div className={styles.dateChip}>
                <span className={styles.day}>{d.getDate()}</span>
                <span className={styles.mon}>{MONTHS_SHORT[d.getMonth()]}</span>
              </div>
              <div className={styles.body}>
                <h3 className={styles.eventTitle}>{e.text}</h3>
                <div className={styles.meta}>
                  <span>
                    <Icon name="calendar" size={14} /> {formatTime(e.eventDate!)}
                  </span>
                  {e.eventLocation && (
                    <span>
                      <Icon name="pin" size={14} /> {e.eventLocation}
                    </span>
                  )}
                </div>
                {author && <span className={styles.room}>par {author.name}</span>}
              </div>
            </li>
          );
        })}
        {events.length === 0 && <li className={styles.empty}>Aucun événement programmé.</li>}
      </ul>

      <p className="overline" style={{ padding: '14px 16px 8px' }}>
        Anniversaires
      </p>
      <ul className={styles.list}>
        {birthdays.map(({ m, date, birth }) => (
          <li key={m.id} className={styles.bday}>
            <Avatar initials={m.initials} color={m.color} size={42} />
            <div className={styles.body}>
              <h3 className={styles.bdayName}>{m.name}</h3>
              <span className={styles.room}>{m.relation}</span>
            </div>
            <div className={styles.bdayDate}>
              <span>
                {date.getDate()} {MONTHS_SHORT[date.getMonth()].toLowerCase()}
              </span>
              <small>{date.getFullYear() - birth.getFullYear()} ans</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
