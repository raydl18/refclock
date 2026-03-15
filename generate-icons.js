// Run with: node generate-icons.js
const { createCanvas } = require('canvas');
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

  // Soccer ball
  const ballR = r * 0.42;
  const bx = cx, by = cy - r * 0.08;

  // White ball base
  ctx.beginPath();
  ctx.arc(bx, by, ballR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Subtle ball shading
  const grad = ctx.createRadialGradient(bx - ballR*0.3, by - ballR*0.3, ballR*0.05, bx, by, ballR);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(180,180,180,0.35)');
  ctx.beginPath();
  ctx.arc(bx, by, ballR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Soccer patches — center pentagon + 5 surrounding, clipped to ball
  ctx.save();
  ctx.beginPath();
  ctx.arc(bx, by, ballR - 1, 0, Math.PI * 2);
  ctx.clip();

  const patchR    = ballR * 0.288;
  const patchDist = ballR * 0.88; // patches 25% clipped by ball edge
  ctx.fillStyle = '#1a1a2e';

  // Center patch
  ctx.beginPath();
  ctx.arc(bx, by, patchR, 0, Math.PI * 2);
  ctx.fill();

  // 5 surrounding patches
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(bx + Math.cos(angle) * patchDist, by + Math.sin(angle) * patchDist, patchR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

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
