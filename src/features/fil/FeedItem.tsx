import { useState } from 'react';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icon';
import { PhotoPlaceholder } from '../../components/PhotoPlaceholder';
import type { Post } from '../../backend/types';
import { formatDateLong, relativeTime, souvenirLabel } from '../../lib/format';
import { useApp } from '../../store/AppContext';
import styles from './FeedItem.module.css';

export function FeedItem({ post }: { post: Post }) {
  const { memberById, me, toggleFavorite, addComment } = useApp();
  const [openComment, setOpenComment] = useState(false);
  const [draft, setDraft] = useState('');

  const author = memberById(post.authorId);
  const liked = me ? post.favorites.includes(me.id) : false;

  const submitComment = async () => {
    if (!draft.trim()) return;
    await addComment(post.id, draft);
    setDraft('');
    setOpenComment(false);
  };

  const header = author && (
    <div className={styles.author}>
      <Avatar initials={author.initials} color={author.color} size={34} />
      <div className={styles.byline}>
        <strong>{author.name}</strong>
        <span className={styles.meta}>
          {author.relation ? `${author.relation} · ` : ''}
          {relativeTime(post.createdAt)}
        </span>
      </div>
      {post.memoryDate && <span className={styles.when}>{souvenirLabel(post.memoryDate)}</span>}
    </div>
  );

  const actions = (
    <div className={styles.actions}>
      <button className={`${styles.act} ${liked ? styles.liked : ''}`} onClick={() => toggleFavorite(post.id)}>
        <Icon name="heart" size={17} filled={liked} stroke={1.7} />
        {post.favorites.length > 0 && <span>{post.favorites.length}</span>}
      </button>
      <button className={styles.act} onClick={() => setOpenComment((v) => !v)}>
        <Icon name="comment" size={17} stroke={1.7} />
        {post.comments.length > 0 && <span>{post.comments.length}</span>}
      </button>
    </div>
  );

  const comments = (post.comments.length > 0 || openComment) && (
    <div className={styles.comments}>
      {post.comments.map((c) => {
        const a = memberById(c.authorId);
        return (
          <p key={c.id} className={styles.comment}>
            <strong>{a?.name ?? 'Membre'}</strong> {c.text}
          </p>
        );
      })}
      {openComment && (
        <div className={styles.commentBox}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            placeholder="Écrire un mot…"
          />
          <button onClick={submitComment} aria-label="Envoyer">
            <Icon name="send" size={18} />
          </button>
        </div>
      )}
    </div>
  );

  /* ── Souvenir (mémoire) ─────────────────────────────────── */
  if (post.type === 'memory') {
    return (
      <article className={`${styles.card} ${styles.memory}`}>
        <div className={styles.memoryHead}>
          <Icon name="sparkle" size={15} />
          <span className="overline">{souvenirLabel(post.memoryDate ?? post.createdAt)}</span>
        </div>
        {(post.caption || post.imageUrl) && (
          <div className={styles.polaroid} style={{ transform: `rotate(${post.tilt ?? -2}deg)` }}>
            <span className={`${styles.tape} ${styles.tapeL}`} />
            <PhotoPlaceholder caption={post.caption} imageUrl={post.imageUrl} ratio={1.25} />
          </div>
        )}
        {post.text && <p className={styles.memoryText}>« {post.text} »</p>}
        <div className={styles.footerRow}>
          {header}
          {actions}
        </div>
        {comments}
      </article>
    );
  }

  /* ── Événement (ticket) ─────────────────────────────────── */
  if (post.type === 'event') {
    return (
      <article className={`${styles.card} ${styles.ticket}`}>
        <div className={styles.ticketBody}>
          <span className="overline" style={{ color: 'var(--ocre)' }}>
            Événement
          </span>
          <h3 className={styles.ticketTitle}>{post.text}</h3>
          <div className={styles.ticketMeta}>
            <span>
              <Icon name="calendar" size={15} /> {post.eventDate ? formatDateLong(post.eventDate) : '—'}
            </span>
            {post.eventLocation && (
              <span>
                <Icon name="pin" size={15} /> {post.eventLocation}
              </span>
            )}
          </div>
          {actions}
          {comments}
        </div>
        <div className={styles.stub}>
          <Icon name="ticket" size={20} />
        </div>
      </article>
    );
  }

  /* ── Photo (polaroïd) ───────────────────────────────────── */
  if (post.type === 'photo') {
    return (
      <article className={styles.card}>
        {header}
        <div className={styles.polaroid} style={{ transform: `rotate(${post.tilt ?? 2}deg)` }}>
          <span className={`${styles.tape} ${styles.tapeR}`} />
          <PhotoPlaceholder caption={post.caption} imageUrl={post.imageUrl} ratio={1.15} />
          {post.text && <p className={styles.handwritten}>{post.text}</p>}
        </div>
        {actions}
        {comments}
      </article>
    );
  }

  /* ── Récit (texte) ──────────────────────────────────────── */
  return (
    <article className={`${styles.card} ${styles.note}`}>
      {header}
      <p className={styles.noteText}>{post.text}</p>
      {actions}
      {comments}
    </article>
  );
}
