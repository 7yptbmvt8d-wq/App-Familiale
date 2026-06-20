import { Icon } from './Icon';
import styles from './TabBar.module.css';

const TABS = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'map', label: 'Carte', icon: 'pin' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'albums', label: 'Albums', icon: 'photo' },
  { id: 'tree', label: 'Arbre', icon: 'tree' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className={styles.bar}>
      {TABS.map((t) => {
        const on = active === t.id;
        return (
          <button
            key={t.id}
            className={`${styles.tab} ${on ? styles.on : ''}`}
            onClick={() => onChange(t.id)}
            aria-current={on ? 'page' : undefined}
          >
            <Icon name={t.icon} size={24} filled={on} stroke={on ? 1.9 : 1.8} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
