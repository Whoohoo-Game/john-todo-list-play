// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-13
// art.js: every picture in the game, painted in code in the brief's look: French old style,
// hand-inked outlines, sepia and rust, faded teal, paper grain. Each painter takes a 2D context g.
'use strict';

const INK = '#22160e';
const PAL = {
  umber: '#2b1d14', sepia: '#6b4a2f', rust: '#8a4b2a', ochre: '#b8894a', paleOchre: '#d9b779',
  teal: '#4f6f6a', fadedTeal: '#7f9a92', night: '#1b2231', cold: '#3a4a5a', cream: '#e8d8b0',
  lamp: '#ffcf7a', brass: '#b58a3c', brassHi: '#e6c071', skin: '#c99a76', skinDark: '#9c6f52',
  coat: '#352b26', shirt: '#cdbb94', white: '#e9e4d4', paper: '#e6d6ad', ash: '#8e8a83',
};
const SERIF = 'Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif';
const HAND = '"Snell Roundhand", "Segoe Script", "Bradley Hand", "Apple Chancery", "Brush Script MT", cursive';

// ---- Deterministic noise for wobble and texture (never gameplay) --------------------------
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
let _shapeSeed = 1;
function nextSeed() { _shapeSeed = (_shapeSeed * 1.37 + 7.13) % 9973; return _shapeSeed; }

// A smooth wobbly path through points (hand-drawn ink). closed: loop it.
function pathOf(g, pts, closed = true, amp = 1.3, smooth = true) {
  const s = nextSeed();
  const p = pts.map(([x, y], i) => [x + (hash(s + i * 1.7) - 0.5) * amp * 2, y + (hash(s + i * 3.1) - 0.5) * amp * 2]);
  g.beginPath();
  if (!smooth || p.length < 3) {
    p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  } else if (closed) {
    const n = p.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(p[n - 1], p[0]); g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const m = mid(p[i], p[(i + 1) % n]); g.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]); }
  } else {
    g.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) { const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2; g.quadraticCurveTo(p[i][0], p[i][1], mx, my); }
    const l = p[p.length - 1]; g.lineTo(l[0], l[1]);
  }
  if (closed) g.closePath();
}
// Fill and ink a shape. fill may be a colour or a gradient.
function shape(g, pts, fill, o = {}) {
  pathOf(g, pts, o.closed !== false, o.amp ?? 1.3, o.smooth !== false);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (o.stroke !== false) { g.strokeStyle = o.stroke || INK; g.lineWidth = o.lw || 2.4; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
}
function poly(g, pts, fill, o = {}) { shape(g, pts, fill, { ...o, smooth: false }); }
function rectPts(x, y, w, h) { return [[x, y], [x + w / 2, y], [x + w, y], [x + w, y + h / 2], [x + w, y + h], [x + w / 2, y + h], [x, y + h], [x, y + h / 2]]; }
function irect(g, x, y, w, h, fill, o = {}) { poly(g, rectPts(x, y, w, h), fill, o); }
function ellPts(cx, cy, rx, ry, n = 22, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return pts;
}
function iell(g, cx, cy, rx, ry, fill, o = {}) { shape(g, ellPts(cx, cy, rx, ry, o.n || 22, o.rot || 0), fill, o); }
function line(g, pts, color = INK, lw = 2.4, amp = 1) {
  pathOf(g, pts, false, amp, pts.length > 2); g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
}
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function rad(g, x, y, r0, r1, stops) { const gr = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
function txt(g, s, x, y, size, color, o = {}) {
  g.save(); g.fillStyle = color; g.font = `${o.italic ? 'italic ' : ''}${o.bold ? 'bold ' : ''}${size}px ${o.font || SERIF}`;
  g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
  if (o.rot) { g.translate(x, y); g.rotate(o.rot); g.fillText(s, 0, 0); } else g.fillText(s, x, y);
  g.restore();
}
// Painterly strokes over an area: short dabs of a colour, for texture on walls and wood.
function dabs(g, x, y, w, h, color, count, len = 18, alpha = 0.18, vertical = false) {
  g.save(); g.strokeStyle = color; g.globalAlpha = alpha; g.lineCap = 'round';
  const s = nextSeed();
  for (let i = 0; i < count; i++) {
    const px = x + hash(s + i * 2.3) * w, py = y + hash(s + i * 5.9) * h, l = len * (0.5 + hash(s + i * 1.1));
    g.lineWidth = 1 + hash(s + i * 7.7) * 3;
    g.beginPath(); g.moveTo(px, py);
    if (vertical) g.lineTo(px + (hash(s + i) - 0.5) * 3, py + l); else g.lineTo(px + l, py + (hash(s + i) - 0.5) * 4);
    g.stroke();
  }
  g.restore();
}
function woodGrain(g, x, y, w, h, color = '#000', alpha = 0.18) {
  g.save(); g.strokeStyle = color; g.globalAlpha = alpha; g.lineWidth = 1.2;
  const s = nextSeed();
  for (let i = 0; i < h / 7; i++) {
    const yy = y + 4 + i * 7 + hash(s + i) * 3;
    g.beginPath(); g.moveTo(x, yy);
    for (let k = 1; k <= 8; k++) g.lineTo(x + (w * k) / 8, yy + Math.sin(k * 1.3 + i) * 1.6);
    g.stroke();
  }
  g.restore();
}

// ---- Shared overlays ---------------------------------------------------------------------
let _grain = null;
function grainCanvas() {
  if (_grain) return _grain;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 120 + hash(i * 0.731) * 135, f = hash(i * 1.913) > 0.985 ? 0.6 : 1;
    img.data[i * 4] = v * f; img.data[i * 4 + 1] = v * 0.93 * f; img.data[i * 4 + 2] = v * 0.8 * f; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  _grain = c; return c;
}
function drawGrain(g, w, h, strength) {
  if (strength <= 0) return;
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = strength;
  g.fillStyle = g.createPattern(grainCanvas(), 'repeat'); g.fillRect(0, 0, w, h); g.restore();
}
function drawVignette(g, w, h, strength) {
  if (strength <= 0) return;
  g.save(); g.fillStyle = rad(g, w / 2, h / 2, h * 0.35, w * 0.72, [[0, 'rgba(10,6,3,0)'], [1, `rgba(10,6,3,${strength})`]]);
  g.fillRect(0, 0, w, h); g.restore();
}
// Smoke rising from (x, y). Stateless: every puff's place comes from the time.
function drawSmoke(g, x, y, t, count, spread = 1) {
  g.save();
  for (let i = 0; i < count; i++) {
    const life = 4.5, age = ((t + (i / count) * life) % life) / life;
    const k = Math.floor((t + (i / count) * life) / life) * 31 + i;
    const sx = x + Math.sin(age * 5 + hash(k) * 6) * 18 * age * spread + (hash(k + 3) - 0.5) * 10 * age;
    const sy = y - age * 170 * spread;
    const r = 4 + age * 26;
    g.globalAlpha = (1 - age) * 0.22 * Math.min(1, age * 6);
    g.fillStyle = rad(g, sx, sy, 0, r, [[0, 'rgba(210,205,195,0.9)'], [1, 'rgba(210,205,195,0)']]);
    g.beginPath(); g.ellipse(sx, sy, r, r * 0.8, age * 2, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
// Rain on a window pane: streaks and running drops.
function drawRain(g, x, y, w, h, t, count, color = 'rgba(190,205,220,0.35)') {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = color; g.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const sp = 380 + hash(i * 3.3) * 260, px = x + hash(i * 1.7) * w;
    const py = y + ((hash(i * 9.1) * h + t * sp) % (h + 40)) - 20;
    g.beginPath(); g.moveTo(px, py); g.lineTo(px - 3, py + 14); g.stroke();
  }
  g.fillStyle = 'rgba(200,215,230,0.35)';
  for (let i = 0; i < 9; i++) {
    const px = x + hash(i * 4.4 + 1) * w, py = y + ((hash(i * 2.2) * h + t * (12 + hash(i) * 20)) % h);
    g.beginPath(); g.ellipse(px, py, 1.8, 2.6, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
// A soft glow behind a hotspot (Space shows what you can touch).
function drawGlow(g, x, y, w, h, a) {
  g.save(); g.globalAlpha = a; g.strokeStyle = 'rgba(255,214,140,0.9)'; g.lineWidth = 3; g.setLineDash([6, 6]);
  g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2 + 8, h / 2 + 8, 0, 0, Math.PI * 2); g.stroke();
  g.globalAlpha = a * 0.25; g.fillStyle = 'rgba(255,214,140,0.6)'; g.fill(); g.restore();
}

// ---- Small props, reused in rooms and as inventory icons ----------------------------------
// Every icon is drawn centred on (x, y) at scale s (1 = about 50 px tall).
function iconKey(g, x, y, s = 1) { // a winding key: butterfly head, short shaft
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.5);
  shape(g, [[-4, -2], [-20, -16], [-24, -4], [-20, 10], [-4, 2]], PAL.brass, { lw: 2 });
  shape(g, [[4, -2], [20, -16], [24, -4], [20, 10], [4, 2]], PAL.brass, { lw: 2 });
  irect(g, -4, -3, 8, 30, PAL.brassHi, { lw: 2 });
  irect(g, -6, 24, 12, 6, PAL.brass, { lw: 2 });
  g.restore();
}
function gearPts(r, teeth, depth = 0.18) {
  const pts = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2, out = i % 4 === 1 || i % 4 === 2;
    const rr = out ? r : r * (1 - depth); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return pts;
}
function drawGear(g, x, y, r, teeth, rot, fill = PAL.brass) {
  g.save(); g.translate(x, y); g.rotate(rot);
  poly(g, gearPts(r, teeth), fill, { lw: Math.max(1.5, r / 18), amp: 0.4 });
  iell(g, 0, 0, r * 0.5, r * 0.5, 'rgba(0,0,0,0.12)', { lw: 1.2 });
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; iell(g, Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, r * 0.11, r * 0.11, '#3a2a18', { lw: 1 }); }
  iell(g, 0, 0, r * 0.14, r * 0.14, '#2a1d12', { lw: 1 });
  g.restore();
}
function iconGear(g, x, y, s = 1) { drawGear(g, x, y, 20 * s, 10, 0.2); }
function iconWatch(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  irect(g, -9, -28, 18, 14, '#4a3222', { lw: 2 }); irect(g, -9, 14, 18, 14, '#4a3222', { lw: 2 });
  iell(g, 0, 0, 17, 17, PAL.brass, { lw: 2 }); iell(g, 0, 0, 13, 13, PAL.cream, { lw: 1.5 });
  line(g, [[0, 0], [-6, -5]], INK, 2); line(g, [[0, 0], [0, -11]], INK, 1.5);
  line(g, [[-8, -9], [-1, -1], [4, -6], [9, 5]], 'rgba(40,30,20,0.7)', 1, 0.3); // the crack
  g.restore();
}
function iconWallet(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shape(g, [[-24, -15], [24, -16], [25, 15], [-23, 16]], '#5a3a24', { lw: 2.2 });
  line(g, [[-22, -4], [23, -5]], '#2e1e12', 1.5);
  irect(g, -14, -20, 22, 8, PAL.paper, { lw: 1.4 });
  g.restore();
}
function iconHouseKeys(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  iell(g, -6, -10, 11, 11, null, { lw: 3, stroke: '#7c6b4e' });
  [[-12, 0, 0.3], [2, 0, -0.2]].forEach(([kx, ky, r]) => {
    g.save(); g.translate(kx, ky); g.rotate(r);
    iell(g, 0, 0, 6, 6, '#9b8b6a', { lw: 1.6 }); irect(g, -2, 4, 4, 22, '#9b8b6a', { lw: 1.6 });
    irect(g, 1, 18, 6, 3, '#9b8b6a', { lw: 1.2 }); irect(g, 1, 23, 5, 3, '#9b8b6a', { lw: 1.2 });
    g.restore();
  });
  g.restore();
}
function iconFlask(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shape(g, [[-16, -12], [16, -12], [18, 20], [-18, 20]], lin(g, -18, 0, 18, 0, [[0, '#8f8f88'], [0.5, '#d9d6c8'], [1, '#7a7a72']]), { lw: 2 });
  irect(g, -5, -22, 10, 10, '#6c6a60', { lw: 1.8 });
  irect(g, -10, -2, 20, 12, '#5a3a24', { lw: 1.4 });
  g.restore();
}
function iconHanky(g, x, y, s = 1, damp = false) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shape(g, [[-20, -14], [0, -18], [18, -12], [16, 6], [20, 18], [-2, 14], [-18, 18], [-14, 2]], damp ? '#b9c1bd' : PAL.white, { lw: 2 });
  line(g, [[-16, -10], [14, -9]], damp ? '#6f8a8a' : '#a64b3b', 1.4); line(g, [[-14, 12], [16, 13]], damp ? '#6f8a8a' : '#a64b3b', 1.4);
  if (damp) { g.fillStyle = 'rgba(80,110,120,0.35)'; g.beginPath(); g.ellipse(2, 2, 10, 7, 0.3, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
function iconCoat(g, x, y, s = 1) { // for thought bubbles
  g.save(); g.translate(x, y); g.scale(s, s);
  shape(g, [[-6, -24], [6, -24], [20, -16], [22, 24], [-22, 24], [-20, -16]], PAL.coat, { lw: 2 });
  line(g, [[0, -22], [0, 22]], '#1a120d', 1.6); line(g, [[-6, -24], [0, -8], [6, -24]], '#1a120d', 1.6);
  g.restore();
}
function iconWave(g, x, y, s = 1) { // the sea, for thoughts
  g.save(); g.translate(x, y); g.scale(s, s);
  line(g, [[-24, 4], [-16, -6], [-8, 4], [0, -6], [8, 4], [16, -6], [24, 4]], PAL.teal, 3);
  line(g, [[-24, 14], [-16, 6], [-8, 14], [0, 6], [8, 14], [16, 6], [24, 14]], PAL.fadedTeal, 2.4);
  g.restore();
}
function iconCross(g, x, y, s = 1) { // "no" in a thought
  g.save(); g.translate(x, y); g.scale(s, s);
  line(g, [[-14, -14], [14, 14]], '#7a2a1c', 4); line(g, [[14, -14], [-14, 14]], '#7a2a1c', 4); g.restore();
}
function iconDoor(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  irect(g, -14, -24, 28, 48, '#5a3a24', { lw: 2 }); iell(g, 8, 2, 2.5, 2.5, PAL.brass, { lw: 1 }); g.restore();
}
function iconClock(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  iell(g, 0, 0, 20, 20, PAL.cream, { lw: 2.4 }); line(g, [[0, 0], [0, -14]], INK, 2); line(g, [[0, 0], [10, 4]], INK, 2); g.restore();
}
function iconBox(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  poly(g, [[-22, -6], [22, -6], [22, 16], [-22, 16]], '#6b3e2a', { lw: 2 });
  poly(g, [[-24, -14], [24, -14], [22, -6], [-22, -6]], '#7d4a32', { lw: 2 });
  irect(g, -6, 2, 12, 8, PAL.brass, { lw: 1.4 }); g.restore();
}
const ICONS = { key: iconKey, gear: iconGear, watch: iconWatch, wallet: iconWallet, houseKeys: iconHouseKeys, flask: iconFlask, hanky: iconHanky, damp: (g, x, y, s) => iconHanky(g, x, y, s, true), coat: iconCoat, wave: iconWave, cross: iconCross, door: iconDoor, clock: iconClock, box: iconBox };

// ---- Figures -----------------------------------------------------------------------------
// John, seated at the bench in profile, facing right. (x, y) is the seat of the stool.
function drawJohnSeated(g, x, y, t, o = {}) {
  g.save(); g.translate(x, y);
  const breathe = Math.sin(t * 1.3) * 1.5, cough = o.cough || 0;
  // stool
  line(g, [[-40, 0], [-52, 168]], '#3b2718', 7); line(g, [[40, 0], [52, 168]], '#3b2718', 7); line(g, [[-46, 90], [46, 90]], '#3b2718', 5);
  iell(g, 0, 0, 56, 11, '#5a3b24', { lw: 2.2 });
  // legs: thigh forward, shin down
  shape(g, [[-20, -10], [96, -16], [104, 8], [-10, 16]], '#3a3029', { lw: 2.2 });
  shape(g, [[84, -6], [108, -2], [112, 132], [88, 134]], '#3a3029', { lw: 2.2 });
  shape(g, [[82, 128], [114, 126], [140, 136], [140, 146], [82, 146]], '#1c1410', { lw: 2.2 });
  g.translate(0, cough * 4);
  // body: hunched back in a worn waistcoat over a shirt
  shape(g, [[-46, 4], [-58, -60], [-50, -128 + breathe], [-20, -168 + breathe], [26, -176 + breathe], [64, -150 + breathe], [80, -100], [86, -40], [76, 6]], '#3b3029', { lw: 2.6 });
  dabs(g, -50, -160, 120, 160, '#000', 26, 16, 0.18, true);
  shape(g, [[40, -150 + breathe], [64, -150 + breathe], [80, -100], [72, -60], [50, -100]], PAL.shirt, { lw: 2 });
  // arm reaching to the bench
  line(g, [[44, -140 + breathe], [104, -86], [168, -52]], PAL.shirt, 24, 0.5);
  line(g, [[44, -140 + breathe], [104, -86], [168, -52]], INK, 1.5, 0.5);
  line(g, [[132, -66], [174, -50]], PAL.skin, 15, 0.3);
  iell(g, 180, -48, 13, 9, PAL.skin, { lw: 2 });
  // head
  g.save(); g.translate(44, -196 + breathe); g.rotate(0.08 + cough * 0.1);
  iell(g, 0, 0, 34, 38, PAL.skin, { lw: 2.4 });
  dabs(g, -20, 6, 46, 28, '#6b5a4c', 30, 3, 0.5); // grey stubble
  shape(g, [[22, -8], [52, 14], [48, 22], [24, 20]], PAL.skinDark, { lw: 2.2 }); // the big nose
  shape(g, [[16, 18], [44, 22], [40, 32], [26, 30], [14, 28]], '#9b958a', { lw: 1.8 }); // moustache
  line(g, [[12, -2], [22, -4]], INK, 2.4); // a squinting eye under the cap
  line(g, [[10, -10], [26, -12]], '#5a4a40', 3); // heavy brow
  iell(g, -18, 4, 7, 10, PAL.skinDark, { lw: 1.6 }); // ear
  // flat cap
  if (o.noCap) shape(g, [[-34, -14], [-26, -36], [0, -42], [26, -34], [34, -18], [10, -26], [-14, -26]], "#8f8a80", { lw: 1.6 }); // thin grey hair
  if (!o.noCap) shape(g, [[-38, -10], [-34, -36], [-6, -50], [28, -44], [40, -26], [62, -20], [58, -12], [20, -14]], '#4a4038', { lw: 2.4 });
  if (!o.noCap) dabs(g, -30, -44, 70, 26, '#000', 14, 10, 0.2);
  // cigarette
  if (!o.noCig) { line(g, [[40, 30], [70, 34]], PAL.white, 4.5, 0.2); iell(g, 71, 34, 3, 2.6, '#ff7a2a', { lw: 0.8, stroke: '#7a2a10' }); }
  g.restore();
  g.restore();
}
// John lying in a hospital bed: head on the pillow at (x, y), facing up and right.
function drawJohnInBed(g, x, y, t, o = {}) {
  g.save(); g.translate(x, y);
  const b = Math.sin(t * 1.1) * 2;
  iell(g, 0, 0, 30, 34, PAL.skin, { lw: 2.4, rot: -1.2 });
  dabs(g, -10, -8, 34, 24, '#6b5a4c', 26, 3, 0.45);
  shape(g, [[14, -22], [40, -26], [36, -14], [16, -10]], PAL.skinDark, { lw: 2 }); // nose to the ceiling
  shape(g, [[10, -6], [32, -4], [30, 4], [12, 6]], '#9b958a', { lw: 1.6 });
  line(g, [[-2, -26], [10, -30]], INK, 2.2); // eye, half closed
  shape(g, [[-34, -14], [-20, -38], [4, -42], [-10, -20]], '#8f8a80', { lw: 1.6 }); // thin grey hair
  // the blanket rising over his chest
  if (!o.noBody) shape(g, [[30, 20], [120, 0 + b], [260, 10], [380, 6], [380, 60], [30, 60]], lin(g, 0, 0, 0, 60, o.blanket || [[0, '#9fb3ad'], [1, '#6f8783']]), { lw: 2.4 });
  if (!o.noBody) line(g, [[110, 40], [180, 30 + b]], PAL.skin, 12, 0.3); // an arm on the blanket
  g.restore();
}
// John standing, stooped, in his long coat and cap. (x, y) is where his feet touch the floor.
function drawJohnStanding(g, x, y, t, o = {}) {
  g.save(); g.translate(x, y);
  const b = Math.sin(t * 1.2) * 1.2;
  shape(g, [[-34, 0], [-6, 0], [-4, -12], [-30, -12]], '#1c1410', { lw: 2 });
  shape(g, [[6, 0], [36, 0], [30, -12], [6, -12]], '#1c1410', { lw: 2 });
  shape(g, [[-26, -10], [-20, -60], [16, -60], [26, -10]], '#2c2620', { lw: 2 });
  // the long coat
  shape(g, [[-48, -50], [-44, -170], [-30, -232 + b], [10, -248 + b], [42, -224 + b], [50, -160], [46, -50]], PAL.coat, { lw: 2.6 });
  dabs(g, -44, -230, 90, 170, '#000', 30, 20, 0.16, true);
  line(g, [[2, -236 + b], [4, -60]], '#16100b', 1.8);
  line(g, [[-30, -232 + b], [-10, -200], [10, -244 + b]], '#16100b', 2);
  iell(g, -10, -140, 6, 4, PAL.brass, { lw: 1 }); iell(g, -10, -110, 6, 4, PAL.brass, { lw: 1 });
  // arm, hand in pocket
  shape(g, [[26, -224 + b], [48, -170], [40, -128], [24, -132], [28, -180]], '#2e2520', { lw: 2.2 });
  // head, bowed
  g.save(); g.translate(16, -272 + b); g.rotate(0.22);
  iell(g, 0, 0, 30, 34, PAL.skin, { lw: 2.4 });
  dabs(g, -16, 6, 40, 24, '#6b5a4c', 26, 3, 0.5);
  shape(g, [[18, -6], [44, 14], [40, 22], [20, 18]], PAL.skinDark, { lw: 2.2 });
  shape(g, [[14, 18], [38, 22], [34, 30], [12, 26]], '#9b958a', { lw: 1.8 });
  line(g, [[10, -2], [20, -3]], INK, 2.4); line(g, [[8, -10], [24, -12]], '#5a4a40', 3);
  shape(g, [[-34, -8], [-30, -32], [-4, -46], [26, -40], [36, -22], [56, -16], [52, -9], [18, -12]], '#4a4038', { lw: 2.4 });
  if (!o.noCig) { line(g, [[36, 28], [62, 34]], PAL.white, 4.5, 0.2); iell(g, 63, 34, 3, 2.6, '#ff7a2a', { lw: 0.8, stroke: '#7a2a10' }); }
  g.restore();
  g.restore();
}
// The doctor: tall, thin, white coat, round spectacles. (x, y) is his feet; point lifts an arm.
function drawDoctor(g, x, y, t, o = {}) {
  g.save(); g.translate(x, y); if (o.flip) g.scale(-1, 1);
  const step = o.walk ? Math.sin(t * 6) * 10 : 0;
  shape(g, [[-18 + step, 0], [4 + step, 0], [2 + step, -10], [-16 + step, -10]], '#151515', { lw: 2 });
  shape(g, [[8 - step, 0], [30 - step, 0], [26 - step, -10], [8 - step, -10]], '#151515', { lw: 2 });
  shape(g, [[-14 + step, -8], [-10, -120], [16, -120], [24 - step, -8]], '#2d3238', { lw: 2 });
  shape(g, [[-34, -90], [-30, -300], [-12, -340], [24, -344], [40, -300], [44, -90]], lin(g, 0, -340, 0, -90, [[0, '#f0ece0'], [1, '#c9c6ba']]), { lw: 2.6 });
  line(g, [[4, -336], [6, -92]], '#9a978c', 1.6);
  irect(g, 14, -280, 18, 20, '#e2ddce', { lw: 1.4 }); line(g, [[18, -278], [18, -264]], '#3b5a8a', 2); // pocket, pen
  line(g, [[-14, -336], [4, -300], [20, -338]], '#7d7a70', 2);
  if (o.point) { line(g, [[-24, -320], [-70, -350], [-110, -380]], '#ebe6d8', 18, 0.4); line(g, [[-24, -320], [-70, -350], [-110, -380]], INK, 1.4, 0.4); iell(g, -116, -384, 9, 7, PAL.skin, { lw: 1.8 }); }
  else { line(g, [[-30, -320], [-40, -240], [-34, -180]], '#ebe6d8', 18, 0.4); line(g, [[-30, -320], [-40, -240], [-34, -180]], INK, 1.4, 0.4); irect(g, -50, -200, 34, 44, '#b89a6a', { lw: 1.8 }); }
  // long head, bald with side hair, round glasses
  g.save(); g.translate(6, -380);
  shape(g, [[-22, -30], [0, -46], [24, -36], [28, 0], [16, 34], [-10, 36], [-24, 8]], '#d8b896', { lw: 2.4 });
  shape(g, [[-26, -10], [-20, -26], [-16, 6]], '#5a5a58', { lw: 1.4 }); shape(g, [[26, -14], [30, 4], [22, 2]], '#5a5a58', { lw: 1.4 });
  iell(g, -8, -6, 8, 8, 'rgba(220,235,240,0.5)', { lw: 1.8 }); iell(g, 12, -6, 8, 8, 'rgba(220,235,240,0.5)', { lw: 1.8 });
  line(g, [[0, -6], [4, -6]], INK, 1.5); shape(g, [[0, 0], [8, 14], [2, 16]], '#c29f7e', { lw: 1.5 });
  line(g, [[-6, 24], [10, 24]], INK, 1.8);
  g.restore();
  g.restore();
}
// The wind-up tin soldier John is mending. (x, y) is his feet. step animates the march.
function drawSoldier(g, x, y, s = 1, step = 0, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const a = Math.sin(step) * 6;
  shape(g, [[-12, 0], [-2, 0], [-2, -26 + a * 0.3], [-10, -26]], '#1e2a3a', { lw: 1.8 });
  shape(g, [[2, 0], [12, 0], [10, -26], [2, -26 - a * 0.3]], '#1e2a3a', { lw: 1.8 });
  shape(g, [[-14, -24], [14, -24], [12, -62], [-12, -62]], '#9a2c22', { lw: 2 });
  line(g, [[-12, -50], [12, -58]], PAL.paleOchre, 2.6); line(g, [[-12, -36], [12, -36]], '#1e2a3a', 3);
  iell(g, 0, -46, 2, 2, PAL.brassHi, { lw: 0.8 }); iell(g, 0, -40, 2, 2, PAL.brassHi, { lw: 0.8 });
  line(g, [[-12, -58], [-18, -40 + a]], '#9a2c22', 6); line(g, [[12, -58], [18, -38 - a]], '#9a2c22', 6);
  line(g, [[20, -40 - a], [24, -88 - a]], '#6b5a44', 3); // the rifle on his shoulder
  iell(g, 0, -70, 9, 9, '#e3c4a0', { lw: 1.8 });
  iell(g, -3, -71, 1.2, 1.2, INK, { lw: 0.5 }); iell(g, 3, -71, 1.2, 1.2, INK, { lw: 0.5 });
  iell(g, -4, -66, 2, 1.4, '#d0716a', { lw: 0, stroke: false }); iell(g, 4, -66, 2, 1.4, '#d0716a', { lw: 0, stroke: false });
  shape(g, [[-9, -76], [-8, -100], [8, -100], [9, -76]], '#1b1b1b', { lw: 1.8 }); // tall shako
  line(g, [[-9, -78], [9, -78]], PAL.brassHi, 2);
  if (o.key !== false) { g.save(); g.translate(-16, -44); g.rotate(o.keyRot || 0); line(g, [[0, 0], [-8, 0]], PAL.brass, 2.5); shape(g, [[-8, -1], [-16, -8], [-18, 0], [-16, 8], [-8, 1]], PAL.brass, { lw: 1.4 }); g.restore(); }
  g.restore();
}
// A little ballerina on the music box spindle.
function drawDancer(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.scale(s * Math.cos(rot) || 0.05, s);
  line(g, [[0, 0], [0, -14]], '#e9d6c8', 3);
  line(g, [[0, -14], [12, -30]], '#e9d6c8', 2.4);
  shape(g, [[-20, -30], [20, -30], [8, -38], [-8, -38]], '#e8c9cf', { lw: 1.4 });
  shape(g, [[-6, -38], [6, -38], [4, -56], [-4, -56]], '#e8c9cf', { lw: 1.4 });
  line(g, [[-3, -54], [-16, -66], [-4, -76]], '#e9d6c8', 2); line(g, [[3, -54], [16, -66], [4, -76]], '#e9d6c8', 2);
  iell(g, 0, -63, 5, 6, '#efd9c6', { lw: 1.2 });
  iell(g, 0, -69, 4, 2.4, '#3a2a1e', { lw: 0.8 });
  g.restore();
}
// The photographs: Margaret by the sea, and the boy with his tin soldier.
function drawMargaretPhoto(g, x, y, w, h) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = lin(g, 0, y, 0, y + h, [[0, '#d8c9a6'], [0.55, '#b8a888'], [0.56, '#8e8a78'], [1, '#6f6a5a']]); g.fillRect(x, y, w, h);
  line(g, [[x, y + h * 0.56], [x + w * 0.3, y + h * 0.54], [x + w, y + h * 0.57]], 'rgba(60,50,40,0.5)', 1.5);
  const cx = x + w * 0.5, cy = y + h * 0.42, k = w / 200;
  shape(g, [[cx - 60 * k, y + h], [cx - 50 * k, cy + 50 * k], [cx, cy + 34 * k], [cx + 50 * k, cy + 50 * k], [cx + 64 * k, y + h]], '#5d4a3a', { lw: 2 });
  shape(g, [[cx - 40 * k, cy - 40 * k], [cx - 60 * k, cy + 10 * k], [cx - 80 * k, cy + 40 * k], [cx - 30 * k, cy + 20 * k]], '#3a2a1e', { lw: 1.6 }); // hair in the wind
  iell(g, cx, cy, 30 * k, 36 * k, '#d9c0a0', { lw: 2 });
  shape(g, [[cx - 30 * k, cy - 10 * k], [cx - 24 * k, cy - 40 * k], [cx + 10 * k, cy - 46 * k], [cx + 32 * k, cy - 20 * k], [cx + 10 * k, cy - 30 * k]], '#3a2a1e', { lw: 1.6 });
  line(g, [[cx - 12 * k, cy - 4 * k], [cx - 6 * k, cy - 6 * k]], INK, 1.6); line(g, [[cx + 6 * k, cy - 6 * k], [cx + 12 * k, cy - 4 * k]], INK, 1.6);
  line(g, [[cx - 10 * k, cy + 14 * k], [cx, cy + 20 * k], [cx + 10 * k, cy + 14 * k]], '#6a3a2a', 2); // laughing
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(160,120,60,0.35)'; g.fillRect(x, y, w, h); g.restore();
}
function drawBoyPhoto(g, x, y, w, h) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = lin(g, 0, y, 0, y + h, [[0, '#cbbd9c'], [1, '#8f846c']]); g.fillRect(x, y, w, h);
  const cx = x + w * 0.45, cy = y + h * 0.42, k = w / 200;
  shape(g, [[cx - 50 * k, y + h], [cx - 46 * k, cy + 36 * k], [cx, cy + 26 * k], [cx + 46 * k, cy + 36 * k], [cx + 54 * k, y + h]], '#6a7b86', { lw: 2 });
  iell(g, cx, cy, 34 * k, 34 * k, '#e2c9a8', { lw: 2 });
  shape(g, [[cx - 30 * k, cy - 14 * k], [cx - 10 * k, cy - 36 * k], [cx + 20 * k, cy - 34 * k], [cx + 32 * k, cy - 12 * k], [cx, cy - 24 * k]], '#a07a4a', { lw: 1.4 });
  iell(g, cx - 10 * k, cy, 2.4 * k, 2.4 * k, INK, { lw: 0.5 }); iell(g, cx + 10 * k, cy, 2.4 * k, 2.4 * k, INK, { lw: 0.5 });
  line(g, [[cx - 9 * k, cy + 14 * k], [cx, cy + 19 * k], [cx + 9 * k, cy + 14 * k]], '#7a3a2a', 2);
  drawSoldier(g, x + w * 0.78, y + h * 0.95, 0.9 * k, 0, { key: true });
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(150,115,60,0.4)'; g.fillRect(x, y, w, h); g.restore();
}

