import { useState } from 'react';
import { AgendaScreen } from '../features/agenda/AgendaScreen';
import { FamilleScreen } from '../features/famille/FamilleScreen';
import { FilScreen } from '../features/fil/FilScreen';
import { MapScreen } from '../features/map/MapScreen';
import { SouvenirsScreen } from '../features/souvenirs/SouvenirsScreen';
import { TabBar, type TabId } from './TabBar';
import styles from './AppShell.module.css';

export function AppShell() {
  const [tab, setTab] = useState<TabId>('fil');

  return (
    <div className={styles.frame}>
      <main className={styles.content} key={tab}>
        {tab === 'fil' && <FilScreen onNavigate={setTab} />}
        {tab === 'map' && <MapScreen />}
        {tab === 'agenda' && <AgendaScreen />}
        {tab === 'souvenirs' && <SouvenirsScreen />}
        {tab === 'famille' && <FamilleScreen />}
      </main>
      <TabBar active={tab} onChange={setTab} />
      {/* Cible des feuilles modales : hors du flux des écrans (qui portent une
          transformation d'animation créant un contexte d'empilement) afin que
          les feuilles passent par-dessus la barre d'onglets. */}
      <div id="app-sheet-root" />
    </div>
  );
}
