import { useState } from 'react';
import { Sheet } from '../../components/Sheet';
import type { PostType, Room } from '../../backend/types';
import { ROOMS, ROOM_LABELS } from '../../lib/labels';
import { useApp } from '../../store/AppContext';
import styles from './Composer.module.css';

type Kind = 'text' | 'photo' | 'event';

const KINDS: { id: Kind; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'text', label: 'Note' },
  { id: 'event', label: 'Événement' },
];

export function Composer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createPost } = useApp();
  const [kind, setKind] = useState<Kind>('photo');
  const [room, setRoom] = useState<Room>('general');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setText('');
    setCaption('');
    setEventDate('');
    setEventLocation('');
    setKind('photo');
    setRoom('general');
  };
  const close = () => {
    reset();
    onClose();
  };

  const canSubmit =
    kind === 'event' ? text.trim().length > 0 : kind === 'photo' ? !!(caption.trim() || text.trim()) : text.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await createPost({
        type: kind as PostType,
        room,
        text: text.trim() || undefined,
        caption: kind === 'photo' ? caption.trim() || undefined : undefined,
        eventDate: kind === 'event' && eventDate ? new Date(eventDate).getTime() : undefined,
        eventLocation: kind === 'event' ? eventLocation.trim() || undefined : undefined,
      });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title="Partager un moment">
      <div className={styles.segment}>
        {KINDS.map((k) => (
          <button
            key={k.id}
            className={`${styles.seg} ${kind === k.id ? styles.segOn : ''}`}
            onClick={() => setKind(k.id)}
          >
            {k.label}
          </button>
        ))}
      </div>

      {kind === 'photo' && (
        <>
          <div className={styles.photoBox}>
            <span className={styles.photoHint}>Aperçu photo · ajoutée depuis la pellicule</span>
          </div>
          <label className={styles.label}>Légende</label>
          <input
            className={styles.input}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="étretat · falaise d'aval"
          />
          <label className={styles.label}>Un mot (optionnel)</label>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Raconte ce moment…"
            rows={2}
          />
        </>
      )}

      {kind === 'text' && (
        <>
          <label className={styles.label}>Note</label>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Partage une nouvelle, une question…"
            rows={4}
            autoFocus
          />
        </>
      )}

      {kind === 'event' && (
        <>
          <label className={styles.label}>Titre</label>
          <input
            className={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Anniversaire de Jeanne"
            autoFocus
          />
          <label className={styles.label}>Date</label>
          <input
            className={styles.input}
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <label className={styles.label}>Lieu</label>
          <input
            className={styles.input}
            value={eventLocation}
            onChange={(e) => setEventLocation(e.target.value)}
            placeholder="Maison · 19h00"
          />
        </>
      )}

      <label className={styles.label}>Salon</label>
      <div className={styles.rooms}>
        {ROOMS.map((r) => (
          <button
            key={r}
            className={`${styles.chip} ${room === r ? styles.chipOn : ''}`}
            onClick={() => setRoom(r)}
          >
            {ROOM_LABELS[r]}
          </button>
        ))}
      </div>

      <button className={styles.submit} disabled={!canSubmit || busy} onClick={submit}>
        {busy ? 'Publication…' : 'Publier dans le fil'}
      </button>
    </Sheet>
  );
}
