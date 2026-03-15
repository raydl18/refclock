// Run with: node generate-icons.js
const { createCanvas, registerFont } = require('canvas');
registerFont('/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf', { family: 'NotoEmoji' });
const fs = require('fs');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, r = size / 2;

  // Background circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  // Green ring
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = size * 0.06;
  ctx.stroke();

  // Soccer ball emoji
  const emojiSize = size * 0.48;
  ctx.font = `${emojiSize}px NotoEmoji`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚽', cx, cy - r * 0.08);

  // "RC" text below ball
  ctx.fillStyle = '#4ade80';
  ctx.font = `bold ${size * 0.14}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RefClock', cx, cy + r * 0.52);

  return canvas.toBuffer('image/png');
}

try {
  fs.writeFileSync('icons/icon-192.png', drawIcon(192));
  fs.writeFileSync('icons/icon-512.png', drawIcon(512));
  console.log('Icons generated: icons/icon-192.png, icons/icon-512.png');
} catch(e) {
  console.error('Install canvas first: npm install canvas');
  console.error('Or create icons manually at icons/icon-192.png and icons/icon-512.png');
}
