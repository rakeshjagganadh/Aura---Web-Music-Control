import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Base SVG with precise AURA Home Screen brand mark
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Solid Background canvas -->
  <rect width="512" height="512" rx="112" fill="#090a0f" />
  
  <!-- Outer Architectural Precision Chassis -->
  <rect
    x="32"
    y="32"
    width="448"
    height="448"
    rx="100"
    fill="#13151d"
    stroke="rgba(255, 255, 255, 0.16)"
    stroke-width="14"
  />

  <!-- Minimalist Acoustic Sine Aperture (dashed circle) -->
  <circle
    cx="256"
    cy="256"
    r="140"
    stroke="rgba(255, 255, 255, 0.14)"
    stroke-width="12"
    stroke-dasharray="36 36"
    fill="none"
  />

  <!-- Core Monogram / Soundwave Sculpture -->
  <!-- Scaled from viewBox 32: (x*16, y*16) -->
  <path
    d="M256 112 L360 376 H304 L256 256 L208 376 H152 L256 112 Z"
    fill="#ffffff"
  />

  <!-- Precision Crossbar -->
  <line
    x1="200"
    y1="312"
    x2="312"
    y2="312"
    stroke="#090a0f"
    stroke-width="20"
    stroke-linecap="round"
  />

  <!-- Active Audio Signal Dot -->
  <circle
    cx="256"
    cy="192"
    r="18"
    fill="#10b981"
  />
</svg>
`;

// Maskable SVG with safe-zone padding (scaled down inside 80% circle, solid bleed background #090a0f)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Full bleed background for Android dynamic masking (circle / squircle / teardrop) -->
  <rect width="512" height="512" fill="#090a0f" />
  
  <!-- Centered within 72% inner safe zone to prevent edge clipping -->
  <g transform="translate(71.68, 71.68) scale(0.72)">
    <!-- Outer Architectural Precision Chassis -->
    <rect
      x="32"
      y="32"
      width="448"
      height="448"
      rx="100"
      fill="#13151d"
      stroke="rgba(255, 255, 255, 0.16)"
      stroke-width="14"
    />

    <!-- Minimalist Acoustic Sine Aperture -->
    <circle
      cx="256"
      cy="256"
      r="140"
      stroke="rgba(255, 255, 255, 0.14)"
      stroke-width="12"
      stroke-dasharray="36 36"
      fill="none"
    />

    <!-- Core Monogram / Soundwave Sculpture -->
    <path
      d="M256 112 L360 376 H304 L256 256 L208 376 H152 L256 112 Z"
      fill="#ffffff"
    />

    <!-- Precision Crossbar -->
    <line
      x1="200"
      y1="312"
      x2="312"
      y2="312"
      stroke="#090a0f"
      stroke-width="20"
      stroke-linecap="round"
    />

    <!-- Active Audio Signal Dot -->
    <circle
      cx="256"
      cy="192"
      r="18"
      fill="#10b981"
    />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');

  // 1. icon-512.png
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 2. icon-192.png
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 3. icon-maskable-512.png
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('Created icon-maskable-512.png');

  // 4. icon-maskable-192.png
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('Created icon-maskable-192.png');

  // 5. apple-touch-icon.png (192x192 solid canvas)
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
