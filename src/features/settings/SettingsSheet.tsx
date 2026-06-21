import { useEffect, useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import type { Invitation, Role } from '../../backend/types';
import { ROLE_LABELS } from '../../lib/labels';
import { useApp } from '../../store/AppContext';
import styles from './SettingsSheet.module.css';

type NotifState = 'default' | 'granted' | 'denied' | 'unsupported';

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, backendKind, signOut, listInvitations, createInvitation, revokeInvitation, enableNotifications } = useApp();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteRole, setInviteRole] = useState<Role>('adult');
  const [notif, setNotif] = useState<NotifState>('default');
  const [notifBusy, setNotifBusy] = useState(false);

  const isAdmin = me?.role === 'admin';

  useEffect(() => {
    if (open && isAdmin) listInvitations().then(setInvites).catch(() => {});
  }, [open, isAdmin, listInvitations]);

  useEffect(() => {
    if (!open) return;
    if (backendKind !== 'firebase' || typeof Notification === 'undefined') {
      setNotif('unsupported');
      return;
    }
    setNotif(Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'default');
  }, [open, backendKind]);

  if (!me) return null;

  const enableNotif = async () => {
    setNotifBusy(true);
    setNotif(await enableNotifications());
    setNotifBusy(false);
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
        <Avatar initials={me.initials} color={me.color} size={58} />
        <div>
          <h3 className={styles.name}>{me.name}</h3>
          <p className={styles.sub}>
            {ROLE_LABELS[me.role]}
            {me.relation ? ` · ${me.relation}` : ''}
          </p>
        </div>
      </div>

      {/* Notifications push */}
      {notif !== 'unsupported' && (
        <div className={styles.block}>
          <p className="overline" style={{ marginBottom: 8 }}>
            Notifications
          </p>
          <div className={styles.notifRow}>
            <div className={styles.notifInfo}>
              <Icon name="bell" size={18} />
              <div>
                <strong>Push de la famille</strong>
                <span>Publications, j'aime, commentaires et événements.</span>
              </div>
            </div>
            {notif === 'granted' ? (
              <span className={styles.notifOn}>
                <Icon name="check" size={15} /> Activées
              </span>
            ) : notif === 'denied' ? (
              <span className={styles.notifBlocked}>Bloquées</span>
            ) : (
              <button className={styles.gen} disabled={notifBusy} onClick={enableNotif}>
                {notifBusy ? '…' : 'Activer'}
              </button>
            )}
          </div>
          {notif === 'denied' && (
            <p className={styles.notifHint}>Réautorise les notifications dans les réglages du navigateur.</p>
          )}
        </div>
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
