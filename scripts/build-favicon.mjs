// Génère public/favicon.ico (16/32/48) depuis le glyphe laiton Stela
// (public/images/glyphe-brass-{16,32,48}.png). Format ICO à PNG embarqués
// (supporté par tous les navigateurs modernes). À relancer si le glyphe change.
import { readFileSync, writeFileSync } from "node:fs";

const SIZES = [16, 32, 48];
const pngs = SIZES.map((s) => readFileSync(`public/images/glyphe-brass-${s}.png`));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = icon
header.writeUInt16LE(SIZES.length, 4); // count

const entries = [];
let offset = 6 + SIZES.length * 16;
SIZES.forEach((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size >= 256 ? 0 : size, 0); // width
  e.writeUInt8(size >= 256 ? 0 : size, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(pngs[i].length, 8); // size of image data
  e.writeUInt32LE(offset, 12); // offset
  offset += pngs[i].length;
  entries.push(e);
});

writeFileSync("public/favicon.ico", Buffer.concat([header, ...entries, ...pngs]));
console.log(`favicon.ico généré : ${SIZES.join("/")} px, ${Buffer.concat([header, ...entries, ...pngs]).length} octets.`);
