import styles from './PhotoPlaceholder.module.css';

interface Props {
  caption?: string;
  imageUrl?: string;
  ratio?: number; // largeur / hauteur
  className?: string;
}

/** Placeholder rayé chaud + légende monospace, remplacé par la vraie photo si fournie. */
export function PhotoPlaceholder({ caption, imageUrl, ratio = 1, className }: Props) {
  return (
    <div
      className={`${styles.ph} ${className ?? ''}`}
      style={{
        aspectRatio: ratio,
        ...(imageUrl
          ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}),
      }}
    >
      {caption && <span className={styles.cap}>{caption}</span>}
    </div>
  );
}
