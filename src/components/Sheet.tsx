import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import styles from './Sheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Feuille modale ancrée au bas du cadre téléphone. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sheet = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  // Monte la feuille au niveau du cadre (hors du contexte d'empilement des
  // écrans) pour qu'elle recouvre la barre d'onglets. Repli : rendu en place.
  const root = typeof document !== 'undefined' && document.getElementById('app-sheet-root');
  return root ? createPortal(sheet, root) : sheet;
}
