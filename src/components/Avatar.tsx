import styles from './Avatar.module.css';

interface Props {
  initials: string;
  color: string;
  size?: number;
}

export function Avatar({ initials, color, size = 46 }: Props) {
  return (
    <span className={`${styles.wrap} ${styles.plain}`} style={{ width: size, height: size }}>
      <span
        className={styles.disc}
        style={{
          background: `color-mix(in oklab, var(--sand-deep) 80%, ${color})`,
          fontSize: Math.round(size * 0.34),
        }}
      >
        {initials}
      </span>
    </span>
  );
}
