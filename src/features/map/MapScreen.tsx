import { useMemo, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { LiveDot } from '../../components/LiveDot';
import { etaClock, etaLabel } from '../../lib/format';
import { placeLabel } from '../../lib/labels';
import { useApp } from '../../store/AppContext';
import { OrbitHub } from './OrbitHub';
import styles from './MapScreen.module.css';

const rank = (s: string) => (s === 'home' ? 0 : s === 'nearby' ? 1 : s === 'away' ? 2 : 3);

export function MapScreen() {
  const { live, session } = useApp();
  const [selected, setSelected] = useState<string | undefined>();

  const ordered = useMemo(() => [...live].sort((a, b) => rank(a.status) - rank(b.status)), [live]);
  const incoming = useMemo(
    () => live.filter((m) => m.etaMinutes != null).sort((a, b) => a.etaMinutes! - b.etaMinutes!),
    [live],
  );
  const next = incoming[0];

  const shared = live.filter((m) => m.status !== 'unknown');
  const homeCount = shared.filter((m) => m.status === 'home' || m.status === 'nearby').length;
  const awayCount = shared.filter((m) => m.status === 'away').length;
  const summary =
    homeCount === 0
      ? 'Maison vide'
      : homeCount === shared.length
        ? 'Tout le foyer est à la maison'
        : `${homeCount} à la maison · ${awayCount} dehors`;

  const fences = session?.family.geofences ?? [];
  const fenceCount = (id: string) => live.filter((m) => m.zone?.id === id).length;

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Carte</h1>
        <p className={styles.sub}>Présence du foyer en temps réel</p>
      </header>

      <div className={styles.banner}>
        <div className={styles.bannerTop}>
          <LiveDot size={7} />
          <span className="overline">État du foyer</span>
        </div>
        <p className={styles.summary}>{summary}</p>
        {next && next.etaMinutes != null && (
          <p className={styles.eta}>
            Prochaine arrivée {etaClock(next.etaMinutes)} · {next.name}
          </p>
        )}
      </div>

      <OrbitHub members={ordered} homeCount={homeCount} onSelect={setSelected} selectedId={selected} />

      <div className={styles.fences}>
        {fences.map((f) => (
          <div key={f.id} className={styles.fence}>
            <Icon name={f.kind === 'home' ? 'home' : 'pin'} size={16} />
            <span className={styles.fenceLabel}>{f.label}</span>
            <span className={styles.fenceCount}>{fenceCount(f.id)}</span>
          </div>
        ))}
      </div>

      <p className="overline" style={{ padding: '6px 16px 8px' }}>
        Membres · {live.length}
      </p>
      <ul className={styles.list}>
        {ordered.map((m) => (
          <li
            key={m.id}
            className={`${styles.row} ${selected === m.id ? styles.rowSel : ''}`}
            onClick={() => setSelected(m.id)}
          >
            <Avatar
              initials={m.initials}
              color={m.color}
              size={46}
              status={m.status}
              auto={m.role === 'minor'}
              live={m.status !== 'unknown'}
            />
            <div className={styles.rowMain}>
              <div className={styles.rowName}>
                {m.name}
                {m.role === 'minor' && <span className={styles.autoTag}>AUTO</span>}
              </div>
              <div className={`${styles.place} ${m.status === 'away' ? styles.awayText : ''}`}>
                {placeLabel(m)}
              </div>
            </div>
            <div className={styles.rowMeta}>
              {m.etaMinutes != null && <span className={styles.metaEta}>{etaLabel(m.etaMinutes)}</span>}
              {m.location?.battery != null && (
                <span className={styles.metaItem}>
                  <Icon name="battery" size={14} /> {Math.round(m.location.battery * 100)}%
                </span>
              )}
              {m.location?.speed != null && m.location.speed > 2 && (
                <span className={styles.metaItem}>
                  <Icon name="speed" size={14} /> {Math.round(m.location.speed)} km/h
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
