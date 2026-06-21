import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useApp } from '../../store/AppContext';
import styles from './AuthScreen.module.css';

type Mode = 'join' | 'create';

export function AuthScreen() {
  const { join, createFamily, demoSignIn, members, backendKind } = useApp();
  const [mode, setMode] = useState<Mode>('join');
  const [code, setCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = mode === 'join' ? !!(code && name) : !!(familyName && name);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (mode === 'join') await join(code, { name, relation: relation || undefined });
      else await createFamily(familyName, { name, relation: relation || undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const helene = members.find((m) => m.id === 'm-helene') ?? members.find((m) => m.role === 'admin');
  const lea = members.find((m) => m.id === 'm-lea') ?? members.find((m) => m.role === 'minor');

  return (
    <div className={styles.screen}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <Icon name="home" size={26} filled />
        </div>
        <h1 className={styles.title}>Famille</h1>
        <p className={styles.tag}>Votre mémoire familiale, privée et sur invitation.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.modeTabs}>
          <button className={`${styles.modeTab} ${mode === 'join' ? styles.modeOn : ''}`} onClick={() => setMode('join')}>
            Rejoindre
          </button>
          <button className={`${styles.modeTab} ${mode === 'create' ? styles.modeOn : ''}`} onClick={() => setMode('create')}>
            Créer ma famille
          </button>
        </div>

        {mode === 'join' ? (
          <>
            <label className={styles.label}>Code d'invitation</label>
            <input
              className={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="LACROIX-2026"
              autoCapitalize="characters"
            />
          </>
        ) : (
          <>
            <label className={styles.label}>Nom de la famille</label>
            <input
              className={styles.input}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Famille Martin"
            />
          </>
        )}

        <label className={styles.label}>Votre prénom</label>
        <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Camille" />
        <label className={styles.label}>Lien de parenté (optionnel)</label>
        <input
          className={styles.input}
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Mère, Oncle…"
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.join} onClick={submit} disabled={busy || !canSubmit}>
          {busy ? 'Un instant…' : mode === 'join' ? 'Rejoindre la famille' : 'Créer ma famille'}
        </button>

        {mode === 'create' && (
          <p className={styles.hint}>
            Tu deviens <strong>responsable</strong> : tu pourras ensuite inviter les autres
            (Réglages → Inviter un membre).
            {backendKind === 'mock' && ' En démo, cela remplace la famille d’exemple dans ce navigateur.'}
          </p>
        )}

        {mode === 'join' && backendKind === 'mock' && (
          <div className={styles.codes}>
            <span>Codes de démo :</span>
            <code onClick={() => setCode('LACROIX-2026')}>LACROIX-2026</code>
            <code onClick={() => setCode('ADO-7788')}>ADO-7788</code>
          </div>
        )}
      </div>

      {mode === 'join' && backendKind === 'mock' && (helene || lea) && (
        <div className={styles.demo}>
          <span className="overline">Aperçu rapide</span>
          <div className={styles.demoBtns}>
            {helene && (
              <button onClick={() => demoSignIn(helene.id)}>Entrer comme {helene.name} · responsable</button>
            )}
            {lea && <button onClick={() => demoSignIn(lea.id)}>Entrer comme {lea.name} · mineure</button>}
          </div>
        </div>
      )}
    </div>
  );
}
