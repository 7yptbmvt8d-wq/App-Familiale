import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import type { LiveMember } from '../../backend/types';
import { formatDistance } from '../../lib/geo';
import styles from './OrbitHub.module.css';

function shortDist(m: LiveMember): string {
  if (m.status === 'unknown') return 'off';
  if (m.status === 'home') return 'maison';
  return formatDistance(m.distanceMeters);
}

function radiusFactor(m: LiveMember): number {
  if (m.status === 'unknown') return 0.47;
  // distance réelle → rayon continu : proche au centre, loin au bord.
  return 0.24 + 0.23 * Math.min(1, m.distanceMeters / 2500);
}

export function OrbitHub({
  members,
  homeCount,
  onSelect,
  selectedId,
}: {
  members: LiveMember[];
  homeCount: number;
  onSelect?: (id: string) => void;
  selectedId?: string;
}) {
  const n = Math.max(members.length, 1);
  return (
    <div className={styles.hub}>
      <div className={`${styles.ring} ${styles.ring1}`} />
      <div className={`${styles.ring} ${styles.ring2}`} />
      <div className={`${styles.ring} ${styles.ring3}`} />

      <div className={styles.medallion}>
        <Icon name="home" size={20} />
        <span>Maison</span>
        <small>{homeCount} présent{homeCount > 1 ? 's' : ''}</small>
      </div>

      {members.map((m, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const rf = radiusFactor(m);
        const x = 50 + Math.cos(angle) * rf * 100;
        const y = 50 + Math.sin(angle) * rf * 100;
        return (
          <button
            key={m.id}
            className={`${styles.sat} ${selectedId === m.id ? styles.sel : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelect?.(m.id)}
          >
            <Avatar
              initials={m.initials}
              color={m.color}
              size={38}
              status={m.status}
              auto={m.role === 'minor'}
              live={m.status !== 'unknown'}
            />
            <span className={styles.satName}>{m.name}</span>
            <span className={`${styles.satDist} ${m.status === 'away' ? styles.away : ''}`}>{shortDist(m)}</span>
          </button>
        );
      })}
    </div>
  );
}
