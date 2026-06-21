import { useMemo, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import type { Member } from '../../backend/types';
import { useApp } from '../../store/AppContext';
import styles from './FamilleScreen.module.css';

function birthYear(m: Member): string {
  return m.birthDate ? new Date(m.birthDate).getFullYear().toString() : '';
}

export function FamilleScreen() {
  const { members, me, updateMember } = useApp();
  const [editing, setEditing] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = me?.role === 'admin';
  const canEdit = (m: Member) => isAdmin || m.id === me?.id;

  const openEdit = (m: Member) => {
    setEditing(m);
    setName(m.name);
    setRelation(m.relation ?? '');
    setBirthDate(m.birthDate ?? '');
    setError('');
  };

  const save = async () => {
    if (!editing || busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Le nom ne peut pas être vide.');
      return;
    }
    setBusy(true);
    try {
      await updateMember(editing.id, {
        name: trimmed,
        relation: relation.trim() || undefined,
        birthDate: birthDate || undefined,
      });
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Modification impossible.');
    } finally {
      setBusy(false);
    }
  };

  const groups = useMemo(() => {
    const test = (re: RegExp) => (m: Member) => re.test(m.relation ?? '');
    const grandparents = members.filter(test(/grand/i));
    const parents = members.filter(test(/^(mère|père|mere|pere)$/i));
    const children = members.filter(test(/fils|fille/i));
    const used = new Set([...grandparents, ...parents, ...children].map((m) => m.id));
    const others = members.filter((m) => !used.has(m.id));
    return [
      { label: 'Grands-parents', list: grandparents },
      { label: 'Parents', list: parents },
      { label: 'Enfants', list: children },
      { label: 'Proches', list: others },
    ].filter((g) => g.list.length > 0);
  }, [members]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Famille</h1>
        <p className={styles.sub}>{members.length} membres · mémoire intergénérationnelle</p>
      </header>

      <div className={styles.tree}>
        {groups.map((g, gi) => (
          <section key={g.label} className={styles.gen}>
            <div className={styles.genLabel}>
              <span className="overline">{g.label}</span>
              {gi < groups.length - 1 && <span className={styles.connector} />}
            </div>
            <div className={styles.row}>
              {g.list.map((m) => {
                const editable = canEdit(m);
                return (
                  <figure
                    key={m.id}
                    className={`${styles.fiche} ${editable ? styles.editable : ''}`}
                    onClick={editable ? () => openEdit(m) : undefined}
                    role={editable ? 'button' : undefined}
                    aria-label={editable ? `Modifier la fiche de ${m.name}` : undefined}
                    tabIndex={editable ? 0 : undefined}
                    onKeyDown={editable ? (e) => (e.key === 'Enter' || e.key === ' ') && openEdit(m) : undefined}
                  >
                    {editable && (
                      <span className={styles.editBadge} aria-hidden>
                        <Icon name="pencil" size={11} stroke={2} />
                      </span>
                    )}
                    <Avatar initials={m.initials} color={m.color} size={56} />
                    <figcaption>
                      <strong>{m.name}</strong>
                      <span>{m.relation}</span>
                      {birthYear(m) && <small>{birthYear(m)}</small>}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Modifier la fiche">
        <div className={styles.form}>
          <label className={styles.field}>
            <span className="overline">Prénom</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom" autoFocus />
          </label>
          <label className={styles.field}>
            <span className="overline">Lien de parenté</span>
            <input
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Mère, Grand-père, Fille…"
            />
          </label>
          <label className={styles.field}>
            <span className="overline">Date de naissance · anniversaire</span>
            <input type="date" value={birthDate} max="2100-12-31" onChange={(e) => setBirthDate(e.target.value)} />
            {birthDate && (
              <button type="button" className={styles.clearBirth} onClick={() => setBirthDate('')}>
                Retirer l'anniversaire
              </button>
            )}
          </label>
          {error && <p className={styles.formError}>{error}</p>}
          <button className={styles.save} onClick={save} disabled={busy}>
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
