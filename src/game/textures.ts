import * as THREE from 'three';
import { CatBreed } from '../types/game';
import { CAT_BREEDS } from '../i18n/translations';

const textureCache = new Map<string, THREE.CanvasTexture>();

export function getNasaLogoTexture(): THREE.CanvasTexture {
  const key = 'nasa_logo';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.fillStyle = '#0b3d91';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  const stars = [
    [68, 76, 2.5], [95, 58, 2], [164, 64, 3], [190, 92, 2],
    [76, 174, 2.2], [116, 195, 2], [174, 176, 2.5], [148, 192, 1.8],
  ];
  stars.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.save();
  ctx.translate(128, 128);
  ctx.rotate(-0.35);
  ctx.beginPath();
  ctx.ellipse(0, 0, 114, 34, 0, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(42, 166);
  ctx.lineTo(132, 72);
  ctx.lineTo(220, 148);
  ctx.lineTo(136, 98);
  ctx.closePath();
  ctx.fillStyle = '#fc3d21';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px "Chakra Petch", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NASA', 128, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function getCatFaceTexture(breed: CatBreed): THREE.CanvasTexture {
  const key = `cat_face_${breed}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const info = CAT_BREEDS.find((b) => b.id === breed) || CAT_BREEDS[0];
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = info.fur;
  ctx.fillRect(0, 0, 256, 256);

  if (breed === 'tabby') {
    ctx.fillStyle = info.patch;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(108 + i * 16, 28, 8, 36);
      ctx.fillRect(42, 112 + i * 16, 28, 6);
      ctx.fillRect(186, 112 + i * 16, 28, 6);
    }
  } else if (breed === 'calico_bw') {
    ctx.fillStyle = info.patch;
    ctx.beginPath();
    ctx.arc(178, 72, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(72, 62, 32, 0, Math.PI * 2);
    ctx.fill();
  } else if (breed === 'cream_patch') {
    ctx.fillStyle = info.patch;
    ctx.beginPath();
    ctx.ellipse(90, 96, 48, 42, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(174, 86, 36, 32, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (breed === 'ginger_white') {
    ctx.fillStyle = info.patch;
    ctx.beginPath();
    ctx.arc(172, 74, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(82, 76, 38, 0, Math.PI * 2);
    ctx.fill();
  } else if (breed === 'tuxedo') {
    ctx.fillStyle = info.patch;
    ctx.beginPath();
    ctx.ellipse(128, 165, 58, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(106, 98);
    ctx.lineTo(150, 98);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(92, 126, 12, 0, Math.PI * 2);
  ctx.arc(164, 126, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(88, 122, 4, 0, Math.PI * 2);
  ctx.arc(160, 122, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(244, 114, 182, 0.38)';
  ctx.beginPath();
  ctx.ellipse(68, 146, 14, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(188, 146, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(128, 148);
  ctx.lineTo(118, 136);
  ctx.lineTo(138, 136);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(118, 152, 10, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(138, 152, 10, 0.1, Math.PI - 0.1);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.strokeStyle = breed === 'tuxedo' ? '#94a3b8' : '#334155';
  [136, 148, 160].forEach((y, idx) => {
    const tilt = (idx - 1) * 5;
    ctx.beginPath();
    ctx.moveTo(58, y);
    ctx.lineTo(20, y + tilt);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(198, y);
    ctx.lineTo(236, y + tilt);
    ctx.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

// Sleek Metallic Sci-Fi Deck Tiles (No ugly red grid!)
export function getSciFiFloorTexture(theme: 'lab_dark' | 'lab_lit' | 'academy' | 'launchpad' | 'spacecraft'): THREE.CanvasTexture {
  const key = `scifi_floor_${theme}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const palettes = {
    lab_dark: { bg: '#161b26', tile: '#1e2636', seam: '#0b0e14', accent: '#f59e0b' },
    lab_lit: { bg: '#1f293a', tile: '#273347', seam: '#0f172a', accent: '#38bdf8' },
    academy: { bg: '#222b3a', tile: '#2c374b', seam: '#111827', accent: '#38bdf8' },
    launchpad: { bg: '#282f3c', tile: '#333d4f', seam: '#141922', accent: '#f59e0b' },
    spacecraft: { bg: '#171f2e', tile: '#1e2a3d', seam: '#090e17', accent: '#06b6d4' },
  };
  const pal = palettes[theme];

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, 512, 512);

  // 2x2 beveled metallic panels with bolts & recessed glowing trim
  const size = 256;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const x = col * size;
      const y = row * size;

      // Panel plate
      ctx.fillStyle = pal.tile;
      ctx.fillRect(x + 6, y + 6, size - 12, size - 12);

      // Subtle brushed diagonal sheen
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      grad.addColorStop(0, 'rgba(255,255,255,0.06)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 8, y + 8, size - 16, size - 16);

      // Recessed inner seam
      ctx.strokeStyle = pal.seam;
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 22, y + 22, size - 44, size - 44);

      // Corner hex rivets
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      [
        [x + 14, y + 14],
        [x + size - 14, y + 14],
        [x + 14, y + size - 14],
        [x + size - 14, y + size - 14],
      ].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle glowing deck light strip
      ctx.fillStyle = pal.accent;
      ctx.globalAlpha = theme === 'lab_dark' ? 0.35 : 0.45;
      ctx.fillRect(x + size / 2 - 28, y + 10, 56, 4);
      ctx.globalAlpha = 1;
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export type StationIconKind =
  | 'power'
  | 'water'
  | 'fan'
  | 'fuel'
  | 'card'
  | 'radar'
  | 'course'
  | 'shield'
  | 'code'
  | 'download'
  | 'rocket'
  | 'nasa';

// High-Contrast Realistic Canvas Icons for 3D Machine Screens & Floating Signs
export function getStationIconTexture(kind: StationIconKind, accentHex = '#38bdf8'): THREE.CanvasTexture {
  const key = `station_icon_${kind}_${accentHex}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark glass monitor backdrop
  const bgGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 140);
  bgGrad.addColorStop(0, '#0f1c30');
  bgGrad.addColorStop(1, '#060a14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 256, 256);

  // Tech frame border
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  for (let i = 40; i < 256; i += 40) {
    ctx.beginPath();
    ctx.moveTo(14, i);
    ctx.lineTo(242, i);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(128, 128);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'power') {
    // Lightning bolt + voltage ring
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 74, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(12, -52);
    ctx.lineTo(-28, 6);
    ctx.lineTo(2, 6);
    ctx.lineTo(-14, 54);
    ctx.lineTo(32, -8);
    ctx.lineTo(2, -8);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'water') {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -64);
    ctx.bezierCurveTo(46, -6, 54, 42, 0, 66);
    ctx.bezierCurveTo(-54, 42, -46, -6, 0, -64);
    ctx.fill();
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(-14, 20, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'fan') {
    ctx.fillStyle = '#22d3ee';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 2);
      ctx.beginPath();
      ctx.ellipse(0, -36, 18, 34, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'fuel') {
    // Fuel canister icon
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 9;
    ctx.strokeRect(-42, -32, 84, 96);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(-32, 8, 64, 46);
    ctx.beginPath();
    ctx.moveTo(-42, -32);
    ctx.lineTo(-64, -54);
    ctx.stroke();
  } else if (kind === 'card') {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-62, -40, 124, 80);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-62, -22, 124, 18);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(24, 12, 26, 16);
  } else if (kind === 'radar') {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 68, 0, Math.PI * 2);
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-76, 0);
    ctx.lineTo(76, 0);
    ctx.moveTo(0, -76);
    ctx.lineTo(0, 76);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(24, -22, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'course') {
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 6;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(-66, 40);
    ctx.lineTo(-20, -34);
    ctx.lineTo(26, 20);
    ctx.lineTo(66, -42);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f8fafc';
    [[-66, 40], [-20, -34], [26, 20], [66, -42]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (kind === 'shield') {
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, -64);
    ctx.lineTo(54, -40);
    ctx.lineTo(44, 24);
    ctx.lineTo(0, 68);
    ctx.lineTo(-44, 24);
    ctx.lineTo(-54, -40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'code') {
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-28, -32);
    ctx.lineTo(-64, 0);
    ctx.lineTo(-28, 32);
    ctx.moveTo(28, -32);
    ctx.lineTo(64, 0);
    ctx.lineTo(28, 32);
    ctx.moveTo(12, -44);
    ctx.lineTo(-12, 44);
    ctx.stroke();
  } else if (kind === 'download') {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-14, -58, 28, 56);
    ctx.beginPath();
    ctx.moveTo(-42, -4);
    ctx.lineTo(42, -4);
    ctx.lineTo(0, 42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-56, 52, 112, 14);
  } else {
    // rocket
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(0, -6, 22, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-14, 46);
    ctx.lineTo(14, 46);
    ctx.lineTo(0, 74);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function getSolarCellTexture(): THREE.CanvasTexture {
  const key = 'solar_cell';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#1e3a8a';
  for (let y = 6; y < 256; y += 32) {
    for (let x = 6; x < 256; x += 32) {
      ctx.fillRect(x, y, 26, 26);
    }
  }
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

export function getTerrainTexture(kind: 'moon' | 'mars'): THREE.CanvasTexture {
  const key = `terrain_${kind}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = kind === 'moon' ? '#6b7280' : '#a84f2c';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 1 + Math.random() * 3.8;
    ctx.fillStyle =
      kind === 'moon'
        ? Math.random() > 0.5
          ? 'rgba(241,245,249,0.16)'
          : 'rgba(15,23,42,0.22)'
        : Math.random() > 0.5
          ? 'rgba(251,146,60,0.18)'
          : 'rgba(67,20,7,0.25)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft crater rings
  for (let c = 0; c < 14; c++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    const cr = 14 + Math.random() * 28;
    ctx.strokeStyle = kind === 'moon' ? 'rgba(226,232,240,0.15)' : 'rgba(253,186,116,0.14)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}
