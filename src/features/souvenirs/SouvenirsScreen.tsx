import { useMemo } from 'react';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import { relativeTime, souvenirLabel } from '../../lib/format';
import { useApp } from '../../store/AppContext';
import { FeedItem } from '../fil/FeedItem';
import styles from './SouvenirsScreen.module.css';

export function SouvenirsScreen() {
  const { feed, memberById } = useApp();

  // « Souvenir du jour » : le plus ancien souvenir daté.
  const hero = useMemo(
    () => feed.filter((p) => p.memoryDate).sort((a, b) => a.memoryDate! - b.memoryDate!)[0],
    [feed],
  );
  const photos = useMemo(
    () => feed.filter((p) => p.id !== hero?.id && (p.type === 'photo' || p.type === 'memory') && (p.caption || p.imageUrl)),
    [feed, hero],
  );

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Souvenirs</h1>
        <p className={styles.sub}>La mémoire de la famille, qui remonte le temps</p>
      </header>

      {hero && (
        <section>
          <p className="overline" style={{ padding: '0 16px 8px' }}>
            Souvenir du jour
          </p>
          <div style={{ padding: '0 16px' }}>
            <FeedItem post={hero} />
          </div>
        </section>
      )}

      <p className="overline" style={{ padding: '18px 16px 8px' }}>
        Tous les souvenirs · {photos.length}
      </p>
      <div className={styles.grid}>
        {photos.map((p) => {
          const author = memberById(p.authorId);
          return (
            <figure key={p.id} className={styles.polaroid} style={{ transform: `rotate(${p.tilt ?? 0}deg)` }}>
              <PhotoPlaceholder caption={p.caption} imageUrl={p.imageUrl} ratio={1} />
              <figcaption className={styles.cap}>
                <span className={styles.capText}>{p.text ?? p.caption}</span>
                <span className={styles.capMeta}>
                  {author?.name} · {p.memoryDate ? souvenirLabel(p.memoryDate) : relativeTime(p.createdAt)}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      {photos.length === 0 && <p className={styles.empty}>Aucun autre souvenir en photo pour l'instant.</p>}
    </div>
  );
}
