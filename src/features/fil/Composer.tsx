import { useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { resizeImage } from '../../lib/image';
import { useApp } from '../../store/AppContext';
import styles from './Composer.module.css';

type Kind = 'photo' | 'text' | 'event';

const KINDS: { id: Kind; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'text', label: 'Récit' },
  { id: 'event', label: 'Événement' },
];

const MAX_PHOTOS = 10;

export function Composer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createPost } = useApp();
  const [kind, setKind] = useState<Kind>('photo');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [memoryDate, setMemoryDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setKind('photo');
    setText('');
    setCaption('');
    setImages([]);
    setMemoryDate('');
    setEventDate('');
    setEventLocation('');
  };
  const close = () => {
    reset();
    onClose();
  };

  const pickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // permet de re-choisir les mêmes fichiers
    if (!files.length) return;
    const room = MAX_PHOTOS - images.length;
    if (room <= 0) return;
    setOptimizing(true);
    try {
      // Chaque photo est redimensionnée + compressée avant stockage.
      const resized = await Promise.all(files.slice(0, room).map((f) => resizeImage(f).catch(() => null)));
      setImages((prev) => [...prev, ...resized.filter((x): x is string => !!x)]);
    } finally {
      setOptimizing(false);
    }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const canSubmit =
    kind === 'photo' ? !!(images.length || caption.trim() || text.trim()) : text.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await createPost({
        type: kind,
        text: text.trim() || undefined,
        caption: kind === 'photo' ? caption.trim() || undefined : undefined,
        imageUrls: kind === 'photo' && images.length ? images : undefined,
        memoryDate: kind !== 'event' && memoryDate ? new Date(memoryDate).getTime() : undefined,
        eventDate: kind === 'event' && eventDate ? new Date(eventDate).getTime() : undefined,
        eventLocation: kind === 'event' ? eventLocation.trim() || undefined : undefined,
      });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title="Partager">
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
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickImages} />
          {images.length === 0 ? (
            <button type="button" className={styles.photoBox} onClick={() => fileRef.current?.click()}>
              <span className={styles.photoHint}>
                <Icon name="camera" size={20} /> {optimizing ? 'Optimisation…' : 'Ajouter des photos'}
              </span>
            </button>
          ) : (
            <div className={styles.thumbs}>
              {images.map((src, i) => (
                <div key={i} className={styles.thumb} style={{ backgroundImage: `url(${src})` }}>
                  <button
                    type="button"
                    className={styles.thumbDel}
                    onClick={() => removeImage(i)}
                    aria-label="Retirer la photo"
                  >
                    <Icon name="close" size={13} stroke={2.4} />
                  </button>
                </div>
              ))}
              {images.length < MAX_PHOTOS && (
                <button
                  type="button"
                  className={styles.addTile}
                  onClick={() => fileRef.current?.click()}
                  aria-label="Ajouter des photos"
                >
                  <Icon name="plus" size={20} />
                  <span>{optimizing ? '…' : 'Ajouter'}</span>
                </button>
              )}
            </div>
          )}
          {images.length > 0 && (
            <p className={styles.photoCount}>
              {images.length} photo{images.length > 1 ? 's' : ''} · optimisée{images.length > 1 ? 's' : ''} pour un envoi léger
            </p>
          )}
          <label className={styles.label}>Légende</label>
          <input className={styles.input} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="étretat · falaise d'aval" />
          <label className={styles.label}>Le récit (optionnel)</label>
          <textarea className={styles.textarea} value={text} onChange={(e) => setText(e.target.value)} placeholder="Raconte ce moment…" rows={2} />
        </>
      )}

      {kind === 'text' && (
        <>
          <label className={styles.label}>Le récit</label>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Une histoire, une anecdote à transmettre…"
            rows={5}
            autoFocus
          />
        </>
      )}

      {kind === 'event' && (
        <>
          <label className={styles.label}>Titre</label>
          <input className={styles.input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Anniversaire de Jeanne" autoFocus />
          <label className={styles.label}>Date & heure</label>
          <input className={styles.input} type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <label className={styles.label}>Lieu</label>
          <input className={styles.input} value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Maison · 19h00" />
        </>
      )}

      {kind !== 'event' && (
        <>
          <label className={styles.label}>Quand c'était (optionnel)</label>
          <input className={styles.input} type="date" value={memoryDate} onChange={(e) => setMemoryDate(e.target.value)} />
        </>
      )}

      <button className={styles.submit} disabled={!canSubmit || busy || optimizing} onClick={submit}>
        {busy ? 'Publication…' : 'Ajouter au fil'}
      </button>
    </Sheet>
  );
}
