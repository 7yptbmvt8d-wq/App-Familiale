/** Génère en mémoire un petit PNG uni valide, pour les tests d'upload de photos. */
import zlib from 'node:zlib';

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** PNG RGB uni (terracotta par défaut), taille w×h. */
export function makePixelPng(w = 16, h = 16, [r, g, b] = [196, 98, 63]) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 2; // type couleur RGB
  const row = Buffer.concat([Buffer.from([0]), ...Array.from({ length: w }, () => Buffer.from([r, g, b]))]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Trois « fichiers » photo prêts pour Playwright setInputFiles. */
export function pixelFiles(n = 3) {
  const buffer = makePixelPng();
  return Array.from({ length: n }, (_, i) => ({ name: `photo-${i + 1}.png`, mimeType: 'image/png', buffer }));
}
