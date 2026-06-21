import type { GeoStatus } from '../backend/types';
import { Icon } from './Icon';
import styles from './Avatar.module.css';

interface Props {
  initials: string;
  color: string;
  size?: number;
  status?: GeoStatus;
  /** Mineur — partage automatique : badge cadenas. */
  auto?: boolean;
  /** Point « en direct ». */
  live?: boolean;
}

const ringClass: Record<GeoStatus, string> = {
  home: styles.home,
  nearby: styles.home,
  away: styles.away,
  unknown: styles.unknown,
};

export function Avatar({ initials, color, size = 46, status, auto, live }: Props) {
  const ring = status ? ringClass[status] : styles.plain;
  return (
    <span className={`${styles.wrap} ${ring}`} style={{ width: size, height: size }}>
      <span
        className={styles.disc}
        style={{
          background: `color-mix(in oklab, var(--sand-deep) 80%, ${color})`,
          fontSize: Math.round(size * 0.34),
        }}
      >
        {initials}
      </span>
      {auto && (
        <span className={styles.auto} title="Partage automatique (mineur)">
          <Icon name="lock" size={Math.round(size * 0.3)} stroke={2} />
        </span>
      )}
      {live && <span className={styles.live} />}
    </span>
  );
}
