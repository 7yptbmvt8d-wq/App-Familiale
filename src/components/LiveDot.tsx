import styles from './LiveDot.module.css';

export function LiveDot({ color = 'var(--terracotta)', size = 8 }: { color?: string; size?: number }) {
  return <span className={styles.dot} style={{ width: size, height: size, ['--c' as string]: color }} />;
}
