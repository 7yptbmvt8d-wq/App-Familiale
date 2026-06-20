import { useMemo } from 'react';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { relativeTime } from '../../lib/format';
import { useApp } from '../../store/AppContext';
import styles from './AlbumsScreen.module.css';

export function AlbumsScreen() {
  const { feed, memberById } = useApp();

  const photos = useMemo(
    () => feed.filter((p) => (p.type === 'photo' || p.type === 'memory') && (p.caption || p.imageUrl)),
    [feed],
  );

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Albums</h1>
        <p className={styles.sub}>{photos.length} souvenirs partagés</p>
      </header>

      <div className={styles.grid}>
        {photos.map((p) => {
          const author = memberById(p.authorId);
          return (
            <figure key={p.id} className={styles.polaroid} style={{ transform: `rotate(${p.tilt ?? 0}deg)` }}>
              <PhotoPlaceholder caption={p.caption} imageUrl={p.imageUrl} ratio={1} />
              <figcaption className={styles.cap}>
                <span className={styles.capText}>{p.text ?? p.caption}</span>
                <span className={styles.capMeta}>
                  {author?.name} · {relativeTime(p.createdAt)}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {photos.length === 0 && <p className={styles.empty}>Aucune photo pour l'instant.</p>}
    </div>
  );
}
