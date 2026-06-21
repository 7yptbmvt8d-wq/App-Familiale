import { useMemo, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { LiveDot } from '../../components/LiveDot';
import { Sheet } from '../../components/Sheet';
import type { GeofenceKind } from '../../backend/types';
import { etaClock, etaLabel } from '../../lib/format';
import { placeLabel } from '../../lib/labels';
import { useApp } from '../../store/AppContext';
import { OrbitHub } from './OrbitHub';
import styles from './MapScreen.module.css';

const rank = (s: string) => (s === 'home' ? 0 : s === 'nearby' ? 1 : s === 'away' ? 2 : 3);

const ZONES: { kind: GeofenceKind; label: string }[] = [
  { kind: 'home', label: 'Maison' },
  { kind: 'school', label: 'École' },
  { kind: 'work', label: 'Travail' },
];

function getPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Géolocalisation indisponible sur cet appareil.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords),
      (e) => reject(new Error(e.code === 1 ? 'Autorisation de localisation refusée.' : 'Position indisponible.')),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

export function MapScreen() {
  const { live, session, me, upsertGeofence } = useApp();
  const [selected, setSelected] = useState<string | undefined>();
  const [zonesOpen, setZonesOpen] = useState(false);
  const [zoneBusy, setZoneBusy] = useState<GeofenceKind | null>(null);
  const [geoError, setGeoError] = useState('');

  const isAdmin = me?.role === 'admin';

  const ordered = useMemo(() => [...live].sort((a, b) => rank(a.status) - rank(b.status)), [live]);
  const stable = useMemo(() => [...live].sort((a, b) => a.id.localeCompare(b.id)), [live]);
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
  const home = fences.find((f) => f.kind === 'home');
  const fenceCount = (id: string) => live.filter((m) => m.zone?.id === id).length;

  const setZone = async (kind: GeofenceKind, label: string) => {
    setGeoError('');
    setZoneBusy(kind);
    try {
      const c = await getPosition();
      await upsertGeofence({ kind, label, lat: c.latitude, lng: c.longitude, radius: 120 });
    } catch (e) {
      setGeoError(e instanceof Error ? e.message : 'Erreur de localisation.');
    } finally {
      setZoneBusy(null);
    }
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Carte</h1>
          <p className={styles.sub}>Présence du foyer en temps réel</p>
        </div>
        {isAdmin && (
          <button className={styles.lieuxBtn} onClick={() => setZonesOpen(true)}>
            <Icon name="pin" size={15} /> Lieux
          </button>
        )}
      </header>

      {isAdmin && !home && (
        <button
          className={styles.setupCard}
          onClick={() => setZone('home', 'Maison')}
          disabled={zoneBusy === 'home'}
        >
          <Icon name="home" size={20} />
          <div className={styles.setupText}>
            <strong>Définis ta Maison</strong>
            <span>{zoneBusy === 'home' ? 'Localisation en cours…' : geoError || 'Utilise ta position actuelle pour activer la carte'}</span>
          </div>
          <Icon name="chevron-right" size={18} />
        </button>
      )}

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

      <OrbitHub members={stable} homeCount={homeCount} onSelect={setSelected} selectedId={selected} />

      {fences.length > 0 && (
        <div className={styles.fences}>
          {fences.map((f) => (
            <div key={f.id} className={styles.fence}>
              <Icon name={f.kind === 'home' ? 'home' : 'pin'} size={16} />
              <span className={styles.fenceLabel}>{f.label}</span>
              <span className={styles.fenceCount}>{fenceCount(f.id)}</span>
            </div>
          ))}
        </div>
      )}

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

      <Sheet open={zonesOpen} onClose={() => setZonesOpen(false)} title="Définir les lieux">
        <p className={styles.zonesIntro}>
          Enregistre un lieu avec <strong>ta position actuelle</strong>. La carte saura alors qui est « à la maison »,
          « à l'école »… Tu peux redéfinir un lieu à tout moment.
        </p>
        {ZONES.map((z) => {
          const cur = fences.find((f) => f.kind === z.kind);
          return (
            <div key={z.kind} className={styles.zoneRow}>
              <div className={styles.zoneInfo}>
                <Icon name={z.kind === 'home' ? 'home' : 'pin'} size={18} />
                <div>
                  <strong>{z.label}</strong>
                  <span>{cur ? 'Défini ✓' : 'Non défini'}</span>
                </div>
              </div>
              <button className={styles.zoneBtn} disabled={zoneBusy === z.kind} onClick={() => setZone(z.kind, z.label)}>
                {zoneBusy === z.kind ? '…' : cur ? 'Redéfinir ici' : 'Définir ici'}
              </button>
            </div>
          );
        })}
        {geoError && <p className={styles.zoneError}>{geoError}</p>}
      </Sheet>
    </div>
  );
}
