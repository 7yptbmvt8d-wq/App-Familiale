import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useApp } from '../../store/AppContext';
import styles from './AuthScreen.module.css';

export function AuthScreen() {
  const { join, demoSignIn, members, backendKind } = useApp();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await join(code, { name, relation: relation || undefined });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const helene = members.find((m) => m.id === 'm-helene') ?? members.find((m) => m.role === 'admin');
  const jeanne = members.find((m) => m.id === 'm-jeanne') ?? members.find((m) => m.role === 'member');

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
        <label className={styles.label}>Code d'invitation</label>
        <input
          className={styles.input}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="LACROIX-2026"
          autoCapitalize="characters"
        />
        <label className={styles.label}>Votre prénom</label>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Camille"
        />
        <label className={styles.label}>Lien de parenté (optionnel)</label>
        <input
          className={styles.input}
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
          placeholder="Tante, Cousin…"
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.join} onClick={submit} disabled={busy || !code || !name}>
          {busy ? 'Connexion…' : 'Rejoindre la famille'}
        </button>

        {backendKind === 'mock' && (
          <div className={styles.codes}>
            <span>Codes de démo :</span>
            <code onClick={() => setCode('LACROIX-2026')}>LACROIX-2026</code>
            <code onClick={() => setCode('LACROIX-7788')}>LACROIX-7788</code>
          </div>
        )}
      </div>

      {backendKind === 'mock' && (helene || jeanne) && (
        <div className={styles.demo}>
          <span className="overline">Aperçu rapide</span>
          <div className={styles.demoBtns}>
            {helene && (
              <button onClick={() => demoSignIn(helene.id)}>
                Entrer comme {helene.name} · responsable
              </button>
            )}
            {jeanne && (
              <button onClick={() => demoSignIn(jeanne.id)}>Entrer comme {jeanne.name} · membre</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
