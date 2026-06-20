import { useEffect, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import type { Invitation, Role, SharingMode } from '../../backend/types';
import { ROLE_LABELS, SHARING_LABELS } from '../../lib/labels';
import { useApp } from '../../store/AppContext';
import styles from './SettingsSheet.module.css';

const ADULT_MODES: SharingMode[] = ['optin', 'temporary', 'off'];

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, backendKind, setSharing, signOut, listInvitations, createInvitation, revokeInvitation } = useApp();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteRole, setInviteRole] = useState<Role>('adult');
  const [error, setError] = useState('');

  const isAdmin = me?.role === 'admin';
  const isMinor = me?.role === 'minor';

  useEffect(() => {
    if (open && isAdmin) listInvitations().then(setInvites).catch(() => {});
  }, [open, isAdmin, listInvitations]);

  if (!me) return null;

  const changeSharing = async (mode: SharingMode) => {
    setError('');
    try {
      await setSharing(mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const generate = async () => {
    const inv = await createInvitation({ role: inviteRole, label: ROLE_LABELS[inviteRole] });
    setInvites((prev) => [inv, ...prev]);
  };

  const revoke = async (id: string) => {
    await revokeInvitation(id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <Sheet open={open} onClose={onClose} title="Réglages">
      {/* Profil */}
      <div className={styles.profile}>
        <Avatar initials={me.initials} color={me.color} size={58} status={isMinor ? undefined : undefined} auto={isMinor} />
        <div>
          <h3 className={styles.name}>{me.name}</h3>
          <p className={styles.sub}>
            {ROLE_LABELS[me.role]}
            {me.relation ? ` · ${me.relation}` : ''}
          </p>
        </div>
      </div>

      {/* Partage de localisation */}
      <p className="overline" style={{ marginBottom: 8 }}>
        Partage de localisation
      </p>
      {isMinor ? (
        <div className={styles.locked}>
          <Icon name="lock" size={18} />
          <div>
            <strong>Automatique</strong>
            <p>Obligatoire et non désactivable pour un compte mineur.</p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.segment}>
            {ADULT_MODES.map((mode) => (
              <button
                key={mode}
                className={`${styles.seg} ${me.sharing === mode ? styles.segOn : ''}`}
                onClick={() => changeSharing(mode)}
              >
                {SHARING_LABELS[mode]}
              </button>
            ))}
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </>
      )}

      {/* Invitations (admin) */}
      {isAdmin && (
        <div className={styles.block}>
          <p className="overline" style={{ marginBottom: 8 }}>
            Inviter un membre
          </p>
          <div className={styles.inviteRow}>
            <div className={styles.segment} style={{ flex: 1 }}>
              <button
                className={`${styles.seg} ${inviteRole === 'adult' ? styles.segOn : ''}`}
                onClick={() => setInviteRole('adult')}
              >
                Adulte
              </button>
              <button
                className={`${styles.seg} ${inviteRole === 'minor' ? styles.segOn : ''}`}
                onClick={() => setInviteRole('minor')}
              >
                Mineur
              </button>
            </div>
            <button className={styles.gen} onClick={generate}>
              <Icon name="plus" size={16} /> Générer
            </button>
          </div>

          <ul className={styles.invites}>
            {invites.map((i) => (
              <li key={i.id} className={styles.invite}>
                <div>
                  <code>{i.code}</code>
                  <span className={styles.inviteMeta}>
                    {ROLE_LABELS[i.role]} · {i.status === 'pending' ? 'en attente' : 'utilisée'}
                  </span>
                </div>
                {i.status === 'pending' && (
                  <button className={styles.revoke} onClick={() => revoke(i.id)} aria-label="Révoquer">
                    <Icon name="close" size={15} />
                  </button>
                )}
              </li>
            ))}
            {invites.length === 0 && <li className={styles.empty}>Aucune invitation en attente.</li>}
          </ul>
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.backend}>
          Backend : {backendKind === 'firebase' ? 'Firebase' : 'Mock (démo locale)'}
        </span>
        <button className={styles.signout} onClick={signOut}>
          <Icon name="logout" size={18} /> Se déconnecter
        </button>
      </div>
    </Sheet>
  );
}
