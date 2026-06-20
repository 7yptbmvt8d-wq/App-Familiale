import { useState } from 'react';
import { AgendaScreen } from '../features/agenda/AgendaScreen';
import { AlbumsScreen } from '../features/albums/AlbumsScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { MapScreen } from '../features/map/MapScreen';
import { TreeScreen } from '../features/tree/TreeScreen';
import { TabBar, type TabId } from './TabBar';
import styles from './AppShell.module.css';

export function AppShell() {
  const [tab, setTab] = useState<TabId>('home');

  return (
    <div className={styles.frame}>
      <main className={styles.content} key={tab}>
        {tab === 'home' && <HomeScreen onNavigate={setTab} />}
        {tab === 'map' && <MapScreen />}
        {tab === 'agenda' && <AgendaScreen />}
        {tab === 'albums' && <AlbumsScreen />}
        {tab === 'tree' && <TreeScreen />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
