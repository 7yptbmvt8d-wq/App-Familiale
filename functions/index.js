/**
 * Cloud Functions — notifications push de la famille (Firebase Cloud Messaging).
 *
 * Déclencheurs :
 *   onPostCreate   → nouvelle publication / événement   → toute la famille (sauf l'auteur)
 *   onPostUpdate   → nouveau j'aime ou commentaire       → l'auteur de la publication
 *   eventReminders → rappel quotidien (9h Europe/Paris)   → événements dans les 24 h
 *
 * Les jetons d'appareil sont stockés dans users/{uid}.fcmTokens (écrits par le client).
 * Les messages sont « data-only » : firebase-messaging-sw.js construit la notification.
 *
 * Déploiement (forfait Blaze requis) :
 *   cd functions && npm install
 *   firebase deploy --only functions,firestore:indexes --project <ton-projet>
 */
const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

async function memberName(familyId, uid) {
  try {
    const snap = await db.doc(`families/${familyId}/members/${uid}`).get();
    return (snap.exists && snap.get('name')) || 'Quelqu’un';
  } catch (e) {
    return 'Quelqu’un';
  }
}

function uniq(arr) {
  return [...new Set(arr)];
}

async function familyTokens(familyId, exceptUid) {
  const snap = await db.collection('users').where('familyId', '==', familyId).get();
  const tokens = [];
  snap.forEach((d) => {
    if (exceptUid && d.id === exceptUid) return;
    const t = d.get('fcmTokens');
    if (Array.isArray(t)) tokens.push(...t);
  });
  return uniq(tokens);
}

async function userTokens(uid) {
  const snap = await db.doc(`users/${uid}`).get();
  const t = snap.exists ? snap.get('fcmTokens') : null;
  return Array.isArray(t) ? uniq(t) : [];
}

async function removeStaleTokens(tokens) {
  if (!tokens.length) return;
  const snap = await db.collection('users').get();
  const batch = db.batch();
  let touched = 0;
  snap.forEach((d) => {
    const t = d.get('fcmTokens');
    if (Array.isArray(t) && t.some((x) => tokens.includes(x))) {
      batch.update(d.ref, { fcmTokens: t.filter((x) => !tokens.includes(x)) });
      touched += 1;
    }
  });
  if (touched) await batch.commit();
}

async function send(tokens, title, body, url) {
  if (!tokens || tokens.length === 0) return;
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    data: { title, body: body || '', url: url || './' },
  });
  const stale = [];
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error && r.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        stale.push(tokens[i]);
      }
    }
  });
  await removeStaleTokens(stale);
}

exports.onPostCreate = onDocumentCreated('families/{fid}/posts/{pid}', async (event) => {
  const post = event.data && event.data.data();
  if (!post) return;
  const fid = event.params.fid;
  const name = await memberName(fid, post.authorId);
  const tokens = await familyTokens(fid, post.authorId);
  const isEvent = post.type === 'event';
  const title = isEvent ? `${name} a ajouté un événement` : `${name} a partagé un souvenir`;
  const body = isEvent ? post.text || '' : post.text || post.caption || '';
  await send(tokens, title, body);
});

exports.onPostUpdate = onDocumentUpdated('families/{fid}/posts/{pid}', async (event) => {
  const before = (event.data.before && event.data.before.data()) || {};
  const after = (event.data.after && event.data.after.data()) || {};
  const fid = event.params.fid;
  const authorId = after.authorId;
  if (!authorId) return;
  const tokens = await userTokens(authorId);
  if (!tokens.length) return;

  const beforeFav = before.favorites || [];
  const afterFav = after.favorites || [];
  const newFav = afterFav.filter((x) => !beforeFav.includes(x) && x !== authorId);
  for (const uid of newFav) {
    const name = await memberName(fid, uid);
    await send(tokens, `${name} a aimé votre publication`, after.text || after.caption || '');
  }

  const beforeC = before.comments || [];
  const afterC = after.comments || [];
  const newComments = afterC.slice(beforeC.length).filter((c) => c && c.authorId !== authorId);
  for (const c of newComments) {
    const name = await memberName(fid, c.authorId);
    await send(tokens, `${name} a commenté votre publication`, c.text || '');
  }
});

exports.eventReminders = onSchedule({ schedule: '0 9 * * *', timeZone: 'Europe/Paris' }, async () => {
  const now = Date.now();
  const horizon = now + 24 * 3600 * 1000;
  const snap = await db
    .collectionGroup('posts')
    .where('type', '==', 'event')
    .where('eventDate', '>=', now)
    .where('eventDate', '<=', horizon)
    .get();
  for (const d of snap.docs) {
    if (d.get('reminded')) continue;
    const post = d.data();
    const parent = d.ref.parent.parent;
    if (!parent) continue;
    const tokens = await familyTokens(parent.id, null);
    await send(tokens, `Événement bientôt : ${post.text || ''}`, post.eventLocation || '');
    await d.ref.update({ reminded: true });
  }
});
