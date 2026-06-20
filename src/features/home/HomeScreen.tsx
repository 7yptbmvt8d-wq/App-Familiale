import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import type { TabId } from '../../components/TabBar';
import { headerDate } from '../../lib/format';
import { useApp } from '../../store/AppContext';
import { SettingsSheet } from '../settings/SettingsSheet';
import { Composer } from './Composer';
import { FeedItem } from './FeedItem';
import { PresenceStrip } from './PresenceStrip';
import styles from './HomeScreen.module.css';

export function HomeScreen({ onNavigate }: { onNavigate?: (t: TabId) => void }) {
  const { me, live, feed } = useApp();
  const [composer, setComposer] = useState(false);
  const [settings, setSettings] = useState(false);

  const memory = useMemo(() => feed.find((p) => p.type === 'memory'), [feed]);
  const timeline = useMemo(() => feed.filter((p) => p.id !== memory?.id), [feed, memory]);

  const ordered = useMemo(() => {
    const rank = (s: string) => (s === 'home' ? 0 : s === 'nearby' ? 1 : s === 'away' ? 2 : 3);
    return [...live].sort((a, b) => rank(a.status) - rank(b.status));
  }, [live]);

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

      <section>
        <p className="overline" style={{ padding: '0 16px 8px' }}>
          Présence du foyer
        </p>
        <PresenceStrip members={ordered} onOpen={() => onNavigate?.('map')} />
      </section>

      <button className={styles.compose} onClick={() => setComposer(true)}>
        <span className={styles.composeAvatar}>{me?.initials}</span>
        <span className={styles.composeText}>Partager un moment…</span>
        <Icon name="plus" size={18} />
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
