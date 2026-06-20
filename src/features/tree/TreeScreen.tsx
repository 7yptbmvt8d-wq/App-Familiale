import { useMemo } from 'react';
import { Avatar } from '../../components/Avatar';
import type { Member } from '../../backend/types';
import { useApp } from '../../store/AppContext';
import styles from './TreeScreen.module.css';

function birthYear(m: Member): string {
  return m.birthDate ? new Date(m.birthDate).getFullYear().toString() : '';
}

export function TreeScreen() {
  const { members } = useApp();

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
        <h1 className={styles.title}>Arbre</h1>
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
              {g.list.map((m) => (
                <figure key={m.id} className={styles.fiche}>
                  <Avatar initials={m.initials} color={m.color} size={56} />
                  <figcaption>
                    <strong>{m.name}</strong>
                    <span>{m.relation}</span>
                    {birthYear(m) && <small>{birthYear(m)}</small>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
