import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { headerDate } from '../../lib/format';
import { useApp } from '../../store/AppContext';
import { SettingsSheet } from '../settings/SettingsSheet';
import { Composer } from './Composer';
import { FeedItem } from './FeedItem';
import styles from './FilScreen.module.css';

export function FilScreen() {
  const { me, feed } = useApp();
  const [composer, setComposer] = useState(false);
  const [settings, setSettings] = useState(false);

  const memory = useMemo(() => feed.find((p) => p.type === 'memory'), [feed]);
  const timeline = useMemo(() => feed.filter((p) => p.id !== memory?.id), [feed, memory]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>{headerDate()}</p>
          <h1 className={styles.title}>Bonjour {me?.name}</h1>
        </div>
        <button className={styles.gear} onClick={() => setSettings(true)} aria-label="Réglages">
          <Icon name="sliders" size={20} />
        </button>
      </header>

      <button className={styles.compose} onClick={() => setComposer(true)}>
        <span className={styles.composeAvatar}>{me?.initials}</span>
        <span className={styles.composeText}>Partager un souvenir…</span>
        <Icon name="camera" size={18} />
      </button>

      {memory && (
        <section className={styles.block}>
          <FeedItem post={memory} />
        </section>
      )}

      <section className={styles.feed}>
        {timeline.map((p) => (
          <FeedItem key={p.id} post={p} />
        ))}
      </section>

      <Composer open={composer} onClose={() => setComposer(false)} />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
