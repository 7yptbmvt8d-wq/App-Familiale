import { useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { resizeImage } from '../../lib/image';
import { useApp } from '../../store/AppContext';
import styles from './Composer.module.css';

type Kind = 'photo' | 'text';

export function Composer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createPost } = useApp();
  const [kind, setKind] = useState<Kind>('photo');
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [memoryDate, setMemoryDate] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setKind('photo');
    setText('');
    setCaption('');
    setImage(undefined);
    setMemoryDate('');
  };
  const close = () => {
    reset();
    onClose();
  };

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setImage(await resizeImage(f));
    } catch {
      /* fichier illisible : on ignore */
    }
  };

  const canSubmit = kind === 'photo' ? !!(image || caption.trim() || text.trim()) : text.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await createPost({
        type: kind,
        text: text.trim() || undefined,
        caption: kind === 'photo' ? caption.trim() || undefined : undefined,
        imageUrl: kind === 'photo' ? image : undefined,
        memoryDate: memoryDate ? new Date(memoryDate).getTime() : undefined,
      });
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title="Partager un souvenir">
      <div className={styles.segment}>
        <button className={`${styles.seg} ${kind === 'photo' ? styles.segOn : ''}`} onClick={() => setKind('photo')}>
          Photo
        </button>
        <button className={`${styles.seg} ${kind === 'text' ? styles.segOn : ''}`} onClick={() => setKind('text')}>
          Récit
        </button>
      </div>

      {kind === 'photo' && (
        <>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
          <button
            type="button"
            className={styles.photoBox}
            onClick={() => fileRef.current?.click()}
            style={image ? { backgroundImage: `url(${image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {!image && (
              <span className={styles.photoHint}>
                <Icon name="camera" size={20} /> Ajouter une photo
              </span>
            )}
          </button>
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

      <label className={styles.label}>Quand c'était (optionnel)</label>
      <input className={styles.input} type="date" value={memoryDate} onChange={(e) => setMemoryDate(e.target.value)} />

      <button className={styles.submit} disabled={!canSubmit || busy} onClick={submit}>
        {busy ? 'Publication…' : 'Ajouter au fil'}
      </button>
    </Sheet>
  );
}
