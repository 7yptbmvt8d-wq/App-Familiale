import { Avatar } from '../../components/Avatar';
import type { LiveMember } from '../../backend/types';
import { placeLabel } from '../../lib/labels';
import styles from './PresenceStrip.module.css';

export function PresenceStrip({ members, onOpen }: { members: LiveMember[]; onOpen?: () => void }) {
  return (
    <div className={styles.strip}>
      {members.map((m) => (
        <button key={m.id} className={styles.item} onClick={onOpen}>
          <Avatar
            initials={m.initials}
            color={m.color}
            size={54}
            status={m.status}
            auto={m.role === 'minor'}
            live={m.status !== 'unknown'}
          />
          <span className={styles.name}>{m.name}</span>
          <span className={`${styles.dist} ${m.status === 'away' ? styles.away : ''}`}>{placeLabel(m)}</span>
        </button>
      ))}
    </div>
  );
}
