import { useEffect, useState } from 'react';
import { Sheet } from '../../components/Sheet';
import type { Post } from '../../backend/types';
import { useApp } from '../../store/AppContext';
import styles from './Composer.module.css';

const pad = (n: number) => String(n).padStart(2, '0');
const toDateValue = (ts?: number) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toDateTimeValue = (ts?: number) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Feuille d'édition d'une publication existante (réservée à son auteur). */
export function EditPostSheet({ post, open, onClose }: { post: Post; open: boolean; onClose: () => void }) {
  const { updatePost } = useApp();
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setText(post.text ?? '');
    setCaption(post.caption ?? '');
    setMemoryDate(toDateValue(post.memoryDate));
    setEventDate(toDateTimeValue(post.eventDate));
    setEventLocation(post.eventLocation ?? '');
    setError('');
  }, [open, post]);

  const isEvent = post.type === 'event';
  const hasCaption = post.type === 'photo' || post.type === 'memory';

  const save = async () => {
    if (busy) return;
    if ((isEvent || post.type === 'text') && !text.trim()) {
      setError(isEvent ? 'Le titre est requis.' : 'Le récit ne peut pas être vide.');
      return;
    }
    setBusy(true);
    try {
      await updatePost(post.id, {
        text,
        caption: hasCaption ? caption : undefined,
        memoryDate: !isEvent && memoryDate ? new Date(memoryDate).getTime() : undefined,
        eventDate: isEvent && eventDate ? new Date(eventDate).getTime() : undefined,
        eventLocation: isEvent ? eventLocation : undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Modification impossible.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Modifier la publication">
      {isEvent ? (
        <>
          <label className={styles.label}>Titre</label>
          <input className={styles.input} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          <label className={styles.label}>Date & heure</label>
          <input className={styles.input} type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <label className={styles.label}>Lieu</label>
          <input className={styles.input} value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Maison · 19h00" />
        </>
      ) : (
        <>
          {hasCaption && (
            <>
              <label className={styles.label}>Légende</label>
              <input className={styles.input} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="étretat · falaise d'aval" />
            </>
          )}
          <label className={styles.label}>{post.type === 'photo' ? 'Le récit (optionnel)' : 'Le récit'}</label>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={post.type === 'text' ? 5 : 3}
          />
          <label className={styles.label}>Quand c'était (optionnel)</label>
          <input className={styles.input} type="date" value={memoryDate} onChange={(e) => setMemoryDate(e.target.value)} />
        </>
      )}
      {error && <p style={{ color: 'var(--terracotta-deep)', fontSize: 13, marginTop: 8 }}>{error}</p>}
      <button className={styles.submit} disabled={busy} onClick={save}>
        {busy ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </Sheet>
  );
}
