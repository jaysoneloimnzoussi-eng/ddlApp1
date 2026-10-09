import fs from 'node:fs';
import zlib from 'node:zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const bodyBuf = Buffer.concat([typeBuf, data]);
  const crc = crc32(bodyBuf);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, bodyBuf, crcBuf]);
}

function createPwaIconPng(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Raw scanlines: each row has 1 filter byte (0) + width * 4 (RGBA)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = (width * (isMaskable ? 0.38 : 0.44));
  const innerR = (width * (isMaskable ? 0.28 : 0.32));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: Deep sovereign dark emerald (#022c22 -> #064e3b)
      const gradT = (y / height);
      let r = Math.round(2 + gradT * 4);
      let g = Math.round(44 + gradT * 34);
      let b = Math.round(34 + gradT * 25);
      let a = 255;

      if (dist <= outerR + 2 && dist >= outerR - 6) {
        // Gold Outer Ring (#eab308)
        r = 234; g = 179; b = 8;
      } else if (dist < outerR - 6 && dist > innerR) {
        // Congo Tricolor Ring: Green, Yellow, Red
        const angle = Math.atan2(dy, dx);
        if (angle < -0.4) {
          // Green (#16a34a)
          r = 22; g = 163; b = 74;
        } else if (angle < 0.8) {
          // Yellow (#facc15)
          r = 250; g = 204; b = 21;
        } else {
          // Red (#dc2626)
          r = 220; g = 38; b = 38;
        }
      } else if (dist <= innerR && dist >= innerR - 4) {
        // Inner Gold Border
        r = 234; g = 179; b = 8;
      } else if (dist < innerR - 4) {
        // Core deep emerald center with gold star simulation
        const starDist = Math.max(Math.abs(dx), Math.abs(dy));
        if (dist < innerR * 0.45 || (starDist < innerR * 0.55 && (Math.abs(dx) < 6 || Math.abs(dy) < 6))) {
          // Gold Star Center
          r = 254; g = 240; b = 138;
        } else {
          r = 4; g = 47; b = 46;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Non-interlaced
  const ihdrChunk = makePngChunk('IHDR', ihdrData);

  // IDAT
  const idatChunk = makePngChunk('IDAT', compressedData);

  // IEND
  const iendChunk = makePngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
fs.writeFileSync('public/pwa-192x192.png', createPwaIconPng(192, false));
fs.writeFileSync('public/pwa-512x512.png', createPwaIconPng(512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPwaIconPng(512, true));
fs.writeFileSync('public/apple-touch-icon.png', createPwaIconPng(180, false));
fs.writeFileSync('public/favicon.ico', createPwaIconPng(64, false));

console.log('✅ PWA PNG icons generated successfully!');
