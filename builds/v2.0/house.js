// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-18
// house.js: John's house (bedroom, parlour and piano, the tulip garden, the study), Mary's grave and
// the spiral path to it, the cemetery at night, Mary's strongbox with its key and two-ring dial, the
// three memories found at home, and the hints for all of it. Adds to ROOMS, LIVE, SHOTS and ICONS.
'use strict';

// ---- Sounds --------------------------------------------------------------------------------------
Object.assign(SFX, {
  ting: () => bell(1760, 0.8, 0.1),
  clunk: () => { noiseHit(0.25, 300, 1.2, 0.4); tone(90, 0.2, 'sine', 0.3); },
  snip: () => { [0, 0.25, 0.5].forEach(w => noiseHit(0.06, 4200, 4, 0.25, 'bandpass', w)); },
  scrub: () => noiseHit(0.5, 2600, 0.7, 0.12),
  weed: () => { noiseHit(0.2, 700, 0.8, 0.25); noiseHit(0.1, 1800, 2, 0.1, 'bandpass', 0.15); },
  scratch: () => { for (let i = 0; i < 6; i++) noiseHit(0.07, 5200, 2, 0.12, 'bandpass', i * 0.11); },
  water: () => { for (let i = 0; i < 16; i++) noiseHit(0.14, 1200 + (i % 4) * 400, 2, 0.08, 'bandpass', i * 0.12); },
});
function meowAt(vol, pan = 0) { // the cat, somewhere in the dark: nearer is louder
  if (!audio || muted) return;
  const ac = audio.ac, t = ac.currentTime, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
  o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(760, t + 0.15); o.frequency.linearRampToValueAtTime(430, t + 0.5);
  f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  if (p) { p.pan.value = pan; o.connect(f).connect(g).connect(p).connect(audio.out); } else o.connect(f).connect(g).connect(audio.out);
  o.start(t); o.stop(t + 0.6);
}

// ---- Her music: Liebestraum No. 3, as the page of letters writes it ------------------------------
const SHEET = [
  { u: ['C', 'A', 'A', 'A', 'A', 'B♭', 'A', 'A'], l: ['F', 'E', 'D', 'D'] },
  { u: ['D', 'D', 'D', 'E', 'F', 'A', 'G', 'G', 'F', 'D', 'C'], l: ['B', 'C', 'F'] },
  { u: ['C', 'A', 'A', 'A', 'A', 'B♭', 'A', 'D'], l: ['F', 'E', 'D', 'D'] },
  { u: ['D', 'D', 'D', 'E', 'F', 'A', 'G', 'F'], l: ['B', 'C', 'F'] },
  { u: ['F', 'F', 'E', 'F', 'G', 'A', 'G', 'E', 'F'], l: ['F', 'C', 'F'] },
];
// What they play in the memory: his notes on the top line, then hers, on the fourth line below.
const DUET = [...[0, 1, 2, 3, 5, 6, 7].map(c => [0, 'u', c, 'john']), ...[0, 1, 3, 4, 5, 6].map(c => [1, 'u', c, 'john']), [3, 'l', 0, 'mary'], [3, 'l', 1, 'mary'], [3, 'l', 2, 'mary']];
const DUET_T = i => 0.3 + i * 0.27;
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, 'B♭': 10, B: 11 };
function noteFreq(letter, line) { const base = line === 'u' ? 523.25 : 261.63; let n = SEMI[letter]; if (line === 'l' && letter === 'B') n -= 12; return base * Math.pow(2, n / 12); }
function playDuetNote(i, when = 0, quiet = false) { const [r, ln, c] = DUET[i]; bell(noteFreq(SHEET[r][ln][c], ln), 1.8, (quiet ? 0.08 : 0.14) * tune.musicVolume * 2, when); }
function playGapped() { // the music box: his notes only; hers are missing
  DUET.forEach((d, i) => { if (d[3] === 'john') playDuetNote(i, DUET_T(i) * 1.3, true); });
}
function drawSheet(g, x, y, w, lit) { // the page "Notes with Letters"; lit: [row, line, col] -> 'john' | 'mary' | 'now'
  const h = w * 0.72;
  g.save(); g.translate(x, y);
  poly(g, [[0, 0], [w, -4], [w + 4, h], [2, h + 4]], lin(g, 0, 0, 0, h, [[0, '#efe4c4'], [1, '#dccb9e']]), { lw: 2 });
  txt(g, 'Notes with Letters', w / 2, w * 0.05, w * 0.04, '#3a2a1a', { italic: true });
  const bw = w * 0.07, rowH = h * 0.17;
  SHEET.forEach((row, r) => {
    const ry = h * 0.12 + r * rowH;
    txt(g, String(r + 1), w * 0.03, ry + bw * 0.4, w * 0.022, '#8a7a5a');
    ['u', 'l'].forEach((ln, k) => row[ln].forEach((L, c) => {
      const bx = w * 0.06 + c * bw * (ln === 'u' ? 1.18 : 2.6), by = ry + k * bw * 0.95, key = `${r}${ln}${c}`, on = lit && lit[key];
      line(g, [[bx, by - 2], [bx + bw * 0.9, by - 2]], ['#c84a3a', '#d8a030', '#3a8a5a', '#3a6a9a', '#8a5aa0'][(r + c) % 5], 2, 0);
      if (on) { g.fillStyle = on === 'mary' ? 'rgba(220,110,130,0.75)' : 'rgba(240,200,90,0.75)'; g.fillRect(bx, by, bw * 0.9, bw * 0.8); }
      txt(g, L, bx + bw * 0.45, by + bw * 0.42, bw * (ln === 'u' ? 0.5 : 0.4), '#1e1a2a', { bold: ln === 'u' });
    }));
  });
  g.restore();
}

// ---- Things in the house ---------------------------------------------------------------------------
function drawStrongbox(g, x, y, s = 1) { // Mary's strongbox: black iron, riveted, a crest on the dial
  g.save(); g.translate(x, y); g.scale(s, s);
  irect(g, -90, -56, 180, 112, lin(g, 0, -56, 0, 56, [[0, '#3a3634'], [1, '#161412']]), { lw: 2.6 });
  for (let i = 0; i < 9; i++) { iell(g, -80 + i * 20, -48, 3, 3, '#8a8478', { lw: 0.6 }); iell(g, -80 + i * 20, 48, 3, 3, '#8a8478', { lw: 0.6 }); }
  iell(g, 0, 0, 22, 22, '#8a8070', { lw: 1.6 }); iell(g, 0, 0, 12, 12, '#5a5246', { lw: 1 });
  iell(g, -54, 0, 10, 12, '#6a6458', { lw: 1.2 }); iell(g, 54, 0, 12, 12, '#4a4640', { lw: 1.2 });
  g.restore();
}
function drawCarton(g, x, y, s = 1) { // a pasteboard box, folded shut
  g.save(); g.translate(x, y); g.scale(s, s);
  poly(g, [[-70, 0], [50, 0], [50, -60], [-70, -60]], '#b8915a', { lw: 2 }); poly(g, [[50, 0], [80, -20], [80, -80], [50, -60]], '#9a7444', { lw: 2 });
  poly(g, [[-70, -60], [50, -60], [80, -80], [-40, -80]], '#c8a068', { lw: 2 }); line(g, [[-55, -70], [65, -70]], 'rgba(200,190,170,0.7)', 6);
  txt(g, 'VI', -30, -28, 18, '#2a1e14', { bold: true }); txt(g, 'I', 10, -28, 18, '#2a1e14', { bold: true });
  g.restore();
}
function drawTulip(g, x, y, h, bloom, color, t, i) {
  const sway = Math.sin(t * 1.1 + i) * 2, droop = (1 - bloom) * 0.6;
  line(g, [[x, y], [x + sway, y - h * 0.5], [x + sway + droop * 14, y - h]], '#4a6a2a', 3, 0.3);
  shape(g, [[x - 2, y - 6], [x - 14, y - h * 0.5], [x - 4, y - h * 0.4]], '#5a7a34', { lw: 1 });
  const hx = x + sway + droop * 14, hy = y - h;
  if (bloom < 0.05) { iell(g, hx, hy, 5, 9, '#7a8a3a', { lw: 1.2, rot: droop }); return; }
  const w = 6 + bloom * 9, c = lerpColor('#8a9a4a', color, bloom);
  shape(g, [[hx - w, hy - 4], [hx - w * 0.9, hy - 14 - bloom * 6], [hx - w * 0.3, hy - 8], [hx, hy - 18 - bloom * 8], [hx + w * 0.3, hy - 8], [hx + w * 0.9, hy - 14 - bloom * 6], [hx + w, hy - 4], [hx, hy + 6]], c, { lw: 1.2 });
}
function lerpColor(a, b, k) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; }
function drawBouquet(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let i = 0; i < 7; i++) { const a = -0.6 + i * 0.2; line(g, [[0, 30], [Math.sin(a) * 50, -40]], '#4a6a2a', 3); shape(g, [[Math.sin(a) * 50 - 9, -42], [Math.sin(a) * 50 - 8, -58], [Math.sin(a) * 50, -50], [Math.sin(a) * 50 + 8, -58], [Math.sin(a) * 50 + 9, -42], [Math.sin(a) * 50, -34]], i % 2 ? '#e0b830' : '#c83a2a', { lw: 1.2 }); }
  poly(g, [[-26, -10], [26, -10], [12, 50], [-12, 50]], '#e6dcc4', { lw: 1.6 }); line(g, [[-16, 14], [16, 14]], '#8a2a3a', 3);
  g.restore();
}
function iconCan(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); irect(g, -16, -12, 30, 28, '#7a8a8a', { lw: 1.6 }); line(g, [[14, -2], [30, -20]], '#7a8a8a', 5); iell(g, 32, -22, 5, 3, '#5a6a6a', { lw: 1 }); shape(g, [[-16, -10], [-24, -20], [-14, -30], [0, -26]], null, { lw: 3, stroke: '#5a6a6a' }); g.restore(); }
function iconShears(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.5); line(g, [[-4, 0], [30, -6]], '#9a9a90', 5); line(g, [[-4, 0], [30, 6]], '#8a8a80', 5); iell(g, -14, -8, 8, 6, '#5a3a24', { lw: 1.4 }); iell(g, -14, 8, 8, 6, '#5a3a24', { lw: 1.4 }); g.restore(); }
function iconPage(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.06); poly(g, [[-20, -24], [20, -26], [22, 24], [-18, 26]], '#efe4c4', { lw: 1.4 }); for (let i = 0; i < 5; i++) line(g, [[-14, -14 + i * 8], [14, -15 + i * 8]], ['#c84a3a', '#d8a030', '#3a8a5a', '#3a6a9a', '#8a5aa0'][i], 2, 0); g.restore(); }
Object.assign(ICONS, {
  bouquet: (g, x, y, s) => drawBouquet(g, x, y + 6 * s, 0.5 * s), can: iconCan, shears: iconShears,
  safe: (g, x, y, s) => drawStrongbox(g, x, y, 0.32 * s), carton: (g, x, y, s) => drawCarton(g, x - 4 * s, y + 24 * s, 0.4 * s), notesPage: iconPage,
});

// ---- Painted rooms ----------------------------------------------------------------------------------
Object.assign(PAINTERS, {
  parlour(g) {
    wallpaper(g, 0, 0, 1280, 470, '#6a2a26', '#3e1614');
    floorBoards(g, 470, 720, '#5a3a22', '#2e1c10', 16);
    irect(g, 0, 456, 1280, 22, '#3a2014', { lw: 2 });
    irect(g, 70, 60, 220, 330, '#3a2614', { lw: 3 }); g.fillStyle = lin(g, 0, 60, 0, 390, [[0, '#a8b0aa'], [1, '#d8c8a0']]); g.fillRect(82, 72, 196, 306);
    line(g, [[180, 72], [180, 378]], '#3a2614', 5); for (let i = 1; i < 4; i++) line(g, [[82, 72 + i * 76], [278, 72 + i * 76]], '#3a2614', 4);
    shape(g, [[50, 40], [100, 40], [96, 420], [44, 430]], '#7a1e1e', { lw: 2 }); shape(g, [[260, 40], [310, 40], [316, 430], [264, 420]], '#7a1e1e', { lw: 2 });
    // the fireplace, the mirror over it
    iell(g, 640, 130, 100, 74, '#9a7a3a', { lw: 3 }); iell(g, 640, 130, 86, 60, lin(g, 0, 70, 0, 190, [[0, '#9aa7a8'], [1, '#5a6668']]), { lw: 1.4 });
    irect(g, 500, 250, 280, 220, '#d8cbb0', { lw: 2.6 }); irect(g, 560, 320, 160, 150, '#140c08', { lw: 2 }); irect(g, 478, 236, 324, 22, '#c8b898', { lw: 2 });
    // the sofa, the little table
    poly(g, [[150, 600], [150, 480], [170, 466], [450, 466], [470, 480], [470, 600]], '#6a3a2a', { lw: 2.6 }); irect(g, 170, 530, 280, 40, '#7a4a34', { lw: 2 });
    poly(g, [[140, 600], [140, 520], [176, 520], [176, 600]], '#5a2e22', { lw: 2 }); poly(g, [[444, 600], [444, 520], [480, 520], [480, 600]], '#5a2e22', { lw: 2 });
    line(g, [[170, 600], [170, 640]], '#2a160e', 6); line(g, [[450, 600], [450, 640]], '#2a160e', 6);
    iell(g, 520, 600, 50, 14, '#5a3a24', { lw: 2 }); line(g, [[520, 610], [520, 680]], '#3a2414', 6);
    // the upright piano, on the right
    irect(g, 900, 270, 300, 300, lin(g, 0, 270, 0, 570, [[0, '#3a2014'], [1, '#1e0e08']]), { lw: 3 });
    woodGrain(g, 904, 274, 292, 292, '#000', 0.25); irect(g, 930, 420, 240, 30, '#2a160e', { lw: 2 });
    irect(g, 960, 300, 180, 70, '#e6dcc4', { lw: 1.6 }); for (let i = 0; i < 6; i++) line(g, [[970, 312 + i * 10], [1130, 312 + i * 10]], 'rgba(40,30,20,0.4)', 1, 0);
    irect(g, 960, 600, 180, 40, '#3a2014', { lw: 2 }); // the stool
    // the rug
    shape(g, [[240, 690], [360, 600], [920, 600], [1060, 690]], '#7a2a2a', { lw: 2.4 });
  },
  garden(g) {
    g.fillStyle = lin(g, 0, 0, 0, 300, [[0, '#9aa4a0'], [1, '#c8c0a4']]); g.fillRect(0, 0, 1280, 300);
    // the walls, stone and ivy
    for (let r = 0; r < 8; r++) for (let c = 0; c < 18; c++) irect(g, c * 76 - (r % 2) * 38 - 8, 104 + r * 34, 72 + hash(r * 18 + c) * 8, 30, ['#8a8270', '#7a7462', '#857d6a'][(r + c) % 3], { lw: 1, stroke: '#4a443a' });
    dabs(g, 0, 100, 1280, 280, '#3a5a2a', 220, 20, 0.35);
    // the back of the house, with its door, on the right
    poly(g, [[1000, 30], [1280, 30], [1280, 520], [1000, 520]], '#a89878', { lw: 2.6 }); irect(g, 1060, 300, 120, 220, '#4a2e1a', { lw: 2.4 }); irect(g, 1050, 90, 150, 140, '#3a2614', { lw: 2.4 });
    // the cobbles
    g.fillStyle = lin(g, 0, 380, 0, 720, [[0, '#7a7466'], [1, '#5a5448']]); g.fillRect(0, 380, 1280, 340);
    for (let i = 0; i < 160; i++) { const x = hash(i * 2.3) * 1280, y = 390 + hash(i * 5.9) * 330; iell(g, x, y, 18, 9, i % 3 ? '#8a8474' : '#6e685a', { lw: 0.8 }); }
    // the round bed, edged with brick
    iell(g, 640, 530, 250, 96, '#6a3a24', { lw: 3 }); iell(g, 640, 524, 226, 80, '#3a2416', { lw: 2 });
    // the bench, with its pots
    irect(g, 150, 440, 260, 20, '#6a4a2a', { lw: 2 }); line(g, [[170, 460], [170, 520]], '#4a2e1a', 6); line(g, [[390, 460], [390, 520]], '#4a2e1a', 6);
    [[1100, 560], [1160, 570], [80, 560]].forEach(([x, y]) => { poly(g, [[x - 22, y - 30], [x + 22, y - 30], [x + 16, y], [x - 16, y]], '#a85a3a', { lw: 1.6 }); dabs(g, x - 20, y - 50, 40, 22, '#4a6a2a', 10, 8, 0.6); });
  },
  study(g) {
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 10; i++) irect(g, i * 130, 260, 124, 200, '#4a2e1a', { lw: 1.6 }); // the panelling
    // shelves of ledgers and toys
    for (let s = 0; s < 3; s++) { irect(g, 40, 60 + s * 66, 420, 10, '#2a160e', { lw: 1.6 }); for (let i = 0; i < 16; i++) irect(g, 50 + i * 25, 18 + s * 66, 20, 42, ['#6a2a22', '#3a4a3a', '#7a5a2a', '#2a2a3a'][i % 4], { lw: 1 }); }
    shelfOfToys(g, 880, 150, 340);
    // the window
    irect(g, 560, 50, 220, 200, '#2a160e', { lw: 3 }); g.fillStyle = lin(g, 0, 50, 0, 250, [[0, '#a8b0aa'], [1, '#d8c8a0']]); g.fillRect(572, 62, 196, 176); line(g, [[670, 62], [670, 238]], '#2a160e', 5); line(g, [[572, 150], [768, 150]], '#2a160e', 5);
    floorBoards(g, 520, 720, '#4a301c', '#24160c', 14);
    // the desk: top, drawers, legs
    irect(g, 600, 380, 520, 30, '#5a341e', { lw: 2.6 }); irect(g, 620, 410, 480, 130, '#4a2a16', { lw: 2.4 });
    irect(g, 760, 440, 200, 70, '#5a341e', { lw: 2 });
    irect(g, 300, 600, 140, 20, '#3a2014', { lw: 1.6 }); // a footstool
  },
});

// ---- The places ------------------------------------------------------------------------------------
const NIGHT_ROUTE = ['right', 'ahead', 'left', 'right'];
const SPIRAL_U = 10, SPIRAL_X = 195, SPIRAL_Y = 95;
const FIB = (() => { // the squares of the path to her grave: each the sum of the two before
  const sq = [{ x: 0, y: 0, s: 1, cx: 0, cy: 1, a0: 0 }]; let B = { x: 0, y: 0, w: 1, h: 1 };
  [1, 2, 3, 5, 8, 13, 21, 34, 55].forEach((s, i) => {
    const d = ['left', 'bottom', 'right', 'top'][i % 4]; let q;
    if (d === 'left') { q = { x: B.x - s, y: B.y, s }; B = { x: B.x - s, y: B.y, w: B.w + s, h: B.h }; q.cx = q.x + s; q.cy = q.y + s; q.a0 = -Math.PI / 2; }
    if (d === 'bottom') { q = { x: B.x, y: B.y + B.h, s }; B = { ...B, h: B.h + s }; q.cx = q.x + s; q.cy = q.y; q.a0 = Math.PI; }
    if (d === 'right') { q = { x: B.x + B.w, y: B.y, s }; B = { ...B, w: B.w + s }; q.cx = q.x; q.cy = q.y; q.a0 = Math.PI / 2; }
    if (d === 'top') { q = { x: B.x, y: B.y - s, s }; B = { x: B.x, y: B.y - s, w: B.w, h: B.h + s }; q.cx = q.x; q.cy = q.y + s; q.a0 = 0; }
    sq.push(q);
  });
  return sq.map(q => ({ ...q, r: [SPIRAL_X + (q.x + 64) * SPIRAL_U, SPIRAL_Y + (q.y + 39) * SPIRAL_U, q.s * SPIRAL_U, q.s * SPIRAL_U], c: [SPIRAL_X + (q.cx + 64) * SPIRAL_U, SPIRAL_Y + (q.cy + 39) * SPIRAL_U] }));
})();
const SPIRAL_DOT = [FIB[0].r[0] + 5, FIB[0].r[1] + 5], SPIRAL_END = [SPIRAL_X, SPIRAL_Y + 55 * SPIRAL_U];
function spiralSquareAt(st, x, y) {
  const nx = FIB[st.spiral + 1];
  if (nx) { const m = Math.max(7, nx.s * SPIRAL_U * 0.12); if (inRect(x, y, [nx.r[0] - m, nx.r[1] - m, nx.r[2] + 2 * m, nx.r[3] + 2 * m])) return st.spiral + 1; }
  for (let i = 0; i < FIB.length; i++) if (inRect(x, y, FIB[i].r)) return i;
  return -1;
}
function spiralPath(st, x, y, phase) {
  if (st.f.spiralDone) return;
  if (phase === 'down') {
    const cur = FIB[st.spiral], m = 10;
    st.f.spiralDrag = inRect(x, y, [cur.r[0] - m, cur.r[1] - m, cur.r[2] + 2 * m, cur.r[3] + 2 * m]);
    if (!st.f.spiralDrag) note(st, st.spiral ? 'Carry on from where the path stops.' : 'Start from John: the red dot.');
    return;
  }
  if (phase === 'up') { st.f.spiralDrag = false; return; }
  if (!st.f.spiralDrag) return;
  const j = spiralSquareAt(st, x, y);
  if (j === st.spiral + 1) {
    st.spiral = j; bell(392 * Math.pow(2, j / 12), 1.2, 0.08);
    if (j === FIB.length - 1) { st.f.spiralDone = true; st.f.spiralDrag = false; tut(st, null); run(st, [0.4, () => sfx('solve'), 1.8, () => go(st, 'maryGrave', { clear: true })]); }
  } else if (j > st.spiral + 1) { st.spiral = 0; st.f.spiralDrag = false; sfx('wrong'); say(st, 'No... not that way. From the start.'); }
}
function catComesIn(st) {
  tut(st, null);
  run(st, [() => { st.f.catJump = st.t; sfx('meow'); }, 2.2, () => { sfx('creak'); st.f.turned = st.t; }, 1.0,
    say_(null, 'John turns over. He does not wake.'), 0.8, () => sfx('door'),
    say_('Paul, outside', "John! Hey, John! It's Paul. I've brought your things!"),
    () => { st.f.awake = st.t; sfx('cough'); }, 1.4, say_('John', 'Hmph. That boy again.'),
    () => { st.rooms.parlour = true; tut(st, 'Swipe down, press M, or use the Map, to go downstairs', null, [[640, 570], [640, 690]]); }]);
}
function playKey(st, i) {
  const semis = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
  bell(261.63 * Math.pow(2, semis[i] / 12), 1.8, 0.14 * tune.musicVolume * 2); st.keyDown = { i, t0: st.t };
  if (st.f.pianoSealed) return;
  st.notes++;
  if (st.notes >= 4) { st.f.pianoSealed = true; sealMemory(st, 'piano', 'pianoClose'); }
}
function waterTulips(st) {
  if (st.f.watered) { say(st, 'Enough.'); return; }
  st.f.watered = true; drop(st, 'can'); tut(st, null);
  run(st, [() => { st.f.waterT = st.t; sfx('water'); }, 2.2, () => { st.f.bloomT = st.t; bell(659, 2, 0.08); }, 3.0, () => sealMemory(st, 'tulips', 'garden')]);
}
function cutTulips(st) {
  if (!st.f.bloomT) { say(st, 'Not while they are closed.'); return; }
  if (!st.mems.tulips || !st.mems.tulips.seen) { say(st, 'Not yet.'); return; }
  drop(st, 'shears'); tut(st, null);
  run(st, [() => { st.f.cutT = st.t; sfx('snip'); }, 1.6, shot('bouquetHand'), 0.8, say_('John', "Come on, then. Let's go and see her."), shot(null),
    () => { st.f.bouquetReady = true; tut(st, 'Take the flowers', [1010, 500, 56]); }]);
}
function graveCheck(st) {
  if (st.f.graveDone || (st.f.wipes || 0) < 3 || ![0, 1, 2, 3].every(i => st.f['weed' + i])) return;
  st.f.graveDone = true; tut(st, null);
  run(st, [0.8, say_('John', "There. That's better, Mary."), 0.6, () => { st.stage = 'homeward'; tut(st, 'Go home: open the map'); }]);
}
function turnWheel(st, i, d) { if (st.f.drawerOpen) return; st.wheels[i] = (st.wheels[i] + d + 10) % 10; sfx('dial'); if (st.wheels.join('') === '161803') { st.f.drawerOpen = st.t; sfx('locker'); sfx('solve'); } }
// The dial: an outer ring of numbers 1 to 12, an inner ring of letters A to G.
const DIAL = { cx: 680, cy: 370, outer: { n: 12, code: [4, 5, 1, 4], r0: 140, r1: 214 }, inner: { n: 7, code: ['B', 'C', 'F'], r0: 64, r1: 138 } };
const dialSym = (k, i) => k === 'outer' ? i + 1 : 'ABCDEFG'[i];
function dialAt(st, k) { const R = DIAL[k], step = Math.PI * 2 / R.n; return ((Math.round(-(st.dial[k + 'A'] || 0) / step) % R.n) + R.n) % R.n; }
function musicScene(st) {
  run(st, [0.3, () => { st.f.musicHeard = true; playGapped(); }, 0.6,
    say_(null, 'Downstairs, the cat knocks against the music box he made for her. It begins to play.'),
    say_('John', "Her tune... but notes are missing. Her part. She always played that part."), () => tut(st, null)]);
}
function catSteal(st) {
  run(st, [() => { st.f.catStole = st.t; sfx('meow'); }, 1.2, () => { st.f.keyInLock = false; st.f.safeUnlocked = false; sfx('click'); }, 1.0,
    say_('John', 'Damn it! Where has that cat gone?'),
    () => { st.stage = 'night'; st.trail = { ...TRAILS.cemetery, t0: st.t }; tut(st, 'Step back, open the map, and follow the paw prints'); }]);
}
function dialRelease(st, k, acc) {
  const R = DIAL[k], step = Math.PI * 2 / R.n;
  st.dial[k + 'A'] = Math.round((st.dial[k + 'A'] || 0) / step) * step;
  if (acc < step * 0.5) return;
  const list = st.dial[k + 'In']; list.push(dialSym(k, dialAt(st, k))); sfx('ting');
  if (list.length < R.code.length) return;
  if (list.every((v, i) => v === R.code[i])) {
    st.dial[k + 'Open'] = true; st.dial[k + 'In'] = []; sfx('clunk');
    if (st.dial.outerOpen && st.dial.innerOpen) run(st, [0.5, () => { st.f.safeOpen = true; sfx('locker'); sfx('solve'); }, 1.4, () => { drop(st, 'safe'); go(st, 'safeOpen', { anchor: [680, 370] }); }]);
  } else { st.dial[k + 'In'] = []; st.f.spin = { k, t0: st.t, from: st.dial[k + 'A'] }; st.dial[k + 'A'] = 0; sfx('wrong'); }
}
function nightChoose(st, dir) {
  sfx('step');
  if (dir === NIGHT_ROUTE[st.night.step]) {
    st.night.step++; st.night.wrongT = -9;
    if (st.night.step >= NIGHT_ROUTE.length) { go(st, 'statue', { clear: true }); return; }
  } else { st.night.wrongT = st.t; }
  go(st, 'nightYard');
}

Object.assign(ROOMS, {
  bedroom: {
    bg: 'bedMain', amb: 'home', mapOk: st => !!st.f.awake,
    enter(st) { st.days = 30; run(st, [1.2, () => tut(st, 'Something waits behind the curtain', null, [[900, 230], [1060, 230]])]); },
    spots: [
      { id: 'curtain', r: [826, 56, 290, 344], show: st => !st.f.curtainOpen, drag: { dir: [1, 0], dist: 180, done: st => { st.f.curtainOpen = true; sfx('rug'); tut(st, 'Open the window', null, [[965, 300], [965, 170]]); } } },
      { id: 'window', r: [852, 82, 226, 266], show: st => st.f.curtainOpen && !st.f.windowOpen, drag: { dir: [0, -1], dist: 110, done: st => { st.f.windowOpen = true; sfx('creak'); catComesIn(st); } } },
      { id: 'sleeper', r: [100, 330, 620, 150], show: st => !st.f.awake, tap: st => note(st, 'Fast asleep.') },
      { id: 'johnUp', r: [500, 290, 240, 190], show: st => st.f.awake && st.stage !== 'final', tap: st => say(st, 'Thirty days. Hmph.') },
      { id: 'underBed', r: [120, 500, 600, 70], show: st => st.stage === 'final' && !st.f.safeTaken, focus: ['underBedClose', [420, 530]] },
      { id: 'bottle', r: [760, 310, 40, 90], tap: st => say(st, 'Not now.') },
      { id: 'door', r: [1150, 120, 130, 360], show: st => st.f.awake, tap: st => say(st, 'Downstairs. The map, then.') },
    ],
  },
  underBedClose: {
    close: true, amb: 'home',
    spots: [{ id: 'box', r: [480, 330, 320, 200], show: st => !st.f.safeTaken, tap: st => { st.f.safeTaken = true; give(st, 'safe'); say(st, 'Her strongbox. Still here.'); } }],
  },
  parlour: {
    bg: 'parlour', amb: 'home', mapOk: st => !!st.f.paulGone,
    enter(st) {
      st.f.paulT = st.t;
      run(st, [0.8, say_('Paul', 'Are you alright, John? I told you to see a doctor weeks ago. What did he say? Is it bad?'),
        say_('John', 'Hmph.'),
        () => { st.f.bagOut = st.t; }, say_('Paul', 'The toy-making things you asked me for. I found them all. Here.'),
        () => { st.f.bagTaken = st.t; sfx('paper'); }, 0.8,
        say_('Paul', 'But... could I ask you a favour in return?'),
        say_('John', 'What do you want?'),
        say_('Paul', 'My daughter has a piano competition at school soon. Could she come here and practise on your piano?'),
        say_('John', '...Hmph.'),
        say_('Paul', "I'll take that as a yes, then. Thank you, John! Thank you!"),
        () => { st.f.paulOut = st.t; sfx('step'); }, 1.6, () => { sfx('door'); st.f.paulGone = true; }, 0.6,
        () => tut(st, 'Only one thing in this room still calls to him', [1050, 420, 100])]);
    },
    spots: [
      { id: 'piano', r: [900, 270, 300, 300], show: st => st.f.paulGone, focus: ['pianoClose', [1050, 420]] },
      { id: 'musicBox', r: [660, 196, 80, 46], show: st => st.f.musicHeard, tap: st => { playGapped(); say(st, 'Her part is missing.'); } },
    ],
  },
  pianoClose: {
    close: true, amb: 'home',
    every(st) {
      if (!st.f.lidOpen) tut(st, 'Lift the lid', null, [[640, 470], [640, 380]]);
      if (st.f.after_piano && !st.f.catRub) {
        tut(st, null);
        run(st, [0.6, () => { st.f.catRub = st.t; sfx('meow'); }, 3.4, say_('John', 'You again.'),
          () => { st.rooms.garden = true; st.trail = { ...TRAILS.garden, t0: st.t }; tut(st, 'Follow the cat: step back, then open the map'); }]);
      }
    },
    spots: [
      { id: 'lid', r: [200, 380, 880, 100], show: st => !st.f.lidOpen, drag: { dir: [0, -1], dist: 100, done: st => { st.f.lidOpen = true; sfx('creak'); tut(st, 'Play a few notes'); } } },
      ...Array.from({ length: 15 }, (_, i) => ({ id: 'key' + i, r: [205 + i * 58, 420, 58, 220], show: st => st.f.lidOpen, tap: st => playKey(st, i) })),
    ],
  },
  garden: {
    bg: 'garden', amb: 'home', mapOk: true,
    enter(st) { st.trail = null; plaque(st, 'The Tulip Garden'); run(st, [1.0, () => tut(st, 'The tulips are closed tight. Help them.')]); },
    every(st) { if (st.f.after_tulips && !st.f.shearsTold && !st.f.cutT) { st.f.shearsTold = true; tut(st, 'Cut some for her'); } },
    spots: [
      { id: 'can', r: [170, 390, 100, 60], show: st => !st.f.canTaken, tap: st => { st.f.canTaken = true; give(st, 'can'); tut(st, 'Drag the can onto the tulips'); } },
      { id: 'shears', r: [290, 410, 100, 40], show: st => !st.f.shearsTaken, tap: st => { st.f.shearsTaken = true; give(st, 'shears'); } },
      { id: 'tulips', r: [420, 430, 440, 190], tap: st => say(st, st.f.bloomT ? 'Her colours.' : 'Closed tight. Thirsty.'), use: { can: waterTulips, shears: cutTulips } },
      { id: 'cat', r: [250, 600, 160, 70], tap: st => { sfx('meow'); note(st, 'The cat has found the only warm stone.'); } },
      { id: 'flowers', r: [950, 440, 130, 120], show: st => st.f.bouquetReady && !st.f.bouquetTaken, tap: st => {
        st.f.bouquetTaken = true; give(st, 'bouquet'); tut(st, null);
        run(st, [1.0, shot('black'), 1.6, shot(null), () => { st.stage = 'cemetery'; openMap(st, 'town', 'cemetery', GOAL_TUT.cemetery); }]);
      } },
    ],
  },
  spiral: {
    amb: 'rain',
    enter(st) { plaque(st, 'The Cemetery'); run(st, [1.2, () => tut(st, 'Draw his way to her grave, from the red dot', [...SPIRAL_DOT, 26])]); },
    spots: [{ id: 'plan', r: [SPIRAL_X - 20, SPIRAL_Y - 20, 89 * SPIRAL_U + 40, 55 * SPIRAL_U + 40], path: spiralPath }],
  },
  maryGrave: {
    amb: 'rain', mapOk: st => !!st.f.graveDone,
    enter(st) {
      run(st, [0.8, () => { st.f.laidT = st.t; sfx('paper'); }, 1.6, say_('John', "I'll be with you soon, my love."), 0.4,
        () => tut(st, 'Clean her stone, and clear the weeds', null, [[500, 330], [780, 330]])]);
    },
    spots: [
      { id: 'stone', r: [460, 170, 360, 330], show: st => (st.f.wipes || 0) < 3, drag: { dir: [1, 0], dist: 160, done: st => { st.f.wipes = (st.f.wipes || 0) + 1; st.dragP.stone = 0; sfx('scrub'); graveCheck(st); } } },
      ...[[380, 560], [560, 600], [760, 590], [900, 560]].map(([x, y], i) => ({ id: 'weed' + i, r: [x - 40, y - 50, 80, 70], show: st => !st.f['weed' + i], tap: st => { st.f['weed' + i] = true; sfx('weed'); graveCheck(st); } })),
    ],
  },
  study: {
    bg: 'study', amb: 'home', mapOk: true,
    spots: [
      { id: 'cat', r: [220, 520, 220, 120], show: st => st.f.catInBox, tap: st => { sfx('meow'); st.f.catLeave = st.t; st.f.catInBox = false; say(st, 'Out. Go on.'); } },
      { id: 'carton', r: [220, 540, 220, 110], show: st => !st.f.catInBox && !st.f.cartonTaken, tap: st => { st.f.cartonTaken = true; give(st, 'carton'); say(st, 'An old box. Marked all over.'); } },
      { id: 'drawer', r: [760, 440, 200, 70], focus: ['drawerClose', [860, 475]] },
      { id: 'books', r: [40, 20, 420, 200], tap: st => say(st, 'Ledgers. Thirty years of toys.') },
    ],
  },
  drawerClose: {
    close: true, amb: 'home',
    every(st) { if (!st.f.drawerOpen) tut(st, 'A lock of six numbers'); },
    spots: [
      ...[0, 1, 2, 3, 4, 5].flatMap(i => [
        { id: 'up' + i, r: [372 + i * 96, 250, 72, 50], show: st => !st.f.drawerOpen, tap: st => turnWheel(st, i, 1) },
        { id: 'dn' + i, r: [372 + i * 96, 420, 72, 50], show: st => !st.f.drawerOpen, tap: st => turnWheel(st, i, -1) },
      ]),
      { id: 'key', r: [560, 470, 160, 100], show: st => st.f.drawerOpen && !st.f.keyTaken, tap: st => { st.f.keyTaken = true; give(st, 'safeKey'); tut(st, null); say(st, 'Her key.'); } },
    ],
  },
  cartonClose: {
    close: true, amb: 'home',
    every(st) { if (!st.f.cartonFlat) tut(st, 'Open it out flat', null, [[560, 380], [820, 380]]); },
    spots: [{ id: 'unfold', r: [300, 160, 680, 420], show: st => !st.f.cartonFlat, drag: { dir: [1, 0], dist: 260, done: st => { st.f.cartonFlat = true; sfx('paper'); tut(st, null); } } }],
  },
  notesClose: { close: true, amb: 'home', spots: [] },
  safeClose: {
    close: true, amb: 'home',
    every(st) { if (!st.f.safeUnlocked && !hasItem(st, 'safeKey')) tut(st, null); },
    spots: [
      { id: 'keyhole', r: [250, 290, 150, 160], show: st => !st.f.keyInLock, tap: st => say(st, 'Locked. The dial will not turn.'),
        use: { safeKey: st => { drop(st, 'safeKey'); st.f.keyInLock = true; st.f.safeUnlocked = true; sfx('locker'); say(st, 'The dial turns now.'); } } },
      { id: 'dial', r: [DIAL.cx - 220, DIAL.cy - 220, 440, 440], ring: {
        cx: DIAL.cx, cy: DIAL.cy,
        pick(st, x, y) {
          if (!st.f.safeUnlocked) { say(st, 'Locked. The dial will not turn.'); sfx('wrong'); return null; }
          const r = Math.hypot(x - DIAL.cx, y - DIAL.cy);
          if (r > DIAL.outer.r0 && r < DIAL.outer.r1 + 10) return st.dial.outerOpen ? null : 'outer';
          if (r > DIAL.inner.r0 && r < DIAL.inner.r1) return st.dial.innerOpen ? null : 'inner';
          return null;
        },
        start(st, k) { if (k === 'inner' && !st.f.musicHeard) musicScene(st); if (k === 'outer' && !st.f.catStole) catSteal(st); },
        turn(st, k, da) { st.dial[k + 'A'] = (st.dial[k + 'A'] || 0) + da; if (Math.floor(Math.abs(st.dial[k + 'A']) * 6) !== Math.floor(Math.abs(st.dial[k + 'A'] - da) * 6)) sfx('tickSoft'); },
        release: dialRelease,
      } },
    ],
  },
  safeOpen: {
    close: true, amb: 'home',
    enter(st) { st.task = null; run(st, [0.8, () => tut(st, "Her keepsakes. Look through them.")]); },
    spots: [
      { id: 'letters', r: [300, 380, 220, 160], tap: st => say(st, 'Their letters. Every one she ever wrote him.') },
      { id: 'diary', r: [800, 360, 200, 180], tap: st => say(st, 'Her diary. Not yet. He cannot, not yet.') },
      { id: 'list', r: [540, 300, 220, 160], show: st => !st.f.listSealed, tap: st => { st.f.listSealed = true; tut(st, null); sealMemory(st, 'list', 'safeOpen'); } },
    ],
  },
  nightYard: {
    amb: 'none', mapOk: true,
    enter(st) { st.trail = null; plaque(st, 'The Cemetery, at night'); st.night.lastMeow = st.t; run(st, [0.8, say_(null, 'Night has fallen. He can barely see the path. Somewhere ahead, the cat.'), () => tut(st, 'Listen. Take the path where the cat sounds nearer.')]); },
    spots: [
      { id: 'left', r: [120, 270, 320, 230], tap: st => nightChoose(st, 'left') },
      { id: 'ahead', r: [520, 220, 240, 240], tap: st => nightChoose(st, 'ahead') },
      { id: 'right', r: [840, 270, 320, 230], tap: st => nightChoose(st, 'right') },
    ],
  },
  statue: {
    amb: 'none', mapOk: st => hasItem(st, 'safeKey'),
    enter(st) { run(st, [0.6, () => { st.f.scratchT = st.t; sfx('scratch'); }, 1.2, () => sfx('scratch'), 1.0, say_(null, 'The cat scratches at one word on the stone.'), () => tut(st, 'Take back the key', [880, 560, 50])]); },
    spots: [
      { id: 'cat', r: [800, 470, 170, 130], show: st => !st.f.keyBack, tap: st => { st.f.keyBack = true; st.stage = 'final'; give(st, 'safeKey'); tut(st, null); say(st, 'Got you, thief.'); run(st, [1.6, () => tut(st, 'Back to her strongbox')]); } },
      { id: 'words', r: [460, 470, 340, 130], tap: st => note(st, '"Till the DEAD do us part." The cat has scratched one word: DEAD.') },
    ],
  },
});

// ---- Drawing the house, the grave, the night -------------------------------------------------------
function churchyard(g, t, night) {
  g.fillStyle = lin(g, 0, 0, 0, 420, night ? [[0, '#0c1018'], [1, '#1a2230']] : [[0, '#7a7e7c'], [1, '#a8a496']]); g.fillRect(0, 0, 1280, 720);
  poly(g, [[980, 330], [980, 170], [1000, 110], [1020, 170], [1020, 330]], night ? '#141a22' : '#5e625e', { lw: 1.6 });
  [[90, 330, 70], [240, 300, 90], [1180, 320, 80]].forEach(([x, y, r]) => shape(g, [[x - r * 0.6, y + 40], [x - r * 0.5, y - r], [x, y - r * 1.8], [x + r * 0.5, y - r], [x + r * 0.6, y + 40]], night ? '#10161a' : '#3e4a3c', { lw: 1.8 }));
  g.fillStyle = lin(g, 0, 330, 0, 720, night ? [[0, '#141a16'], [1, '#0c100c']] : [[0, '#5e6a46'], [1, '#3a4228']]); g.fillRect(0, 340, 1280, 380);
}
Object.assign(LIVE, {
  bedroom(g, st, t) {
    // the window: open or shut; the cat behind the curtain, then on the sill
    const wp = st.f.windowOpen ? 1 : (st.dragP.window || 0);
    if (wp > 0) { g.fillStyle = 'rgba(230,236,230,0.6)'; g.fillRect(852, 214, 226, 134 * wp); irect(g, 852, 214 - wp * 110, 226, 134, null, { lw: 5, stroke: '#3a2614' }); }
    const jump = st.f.catJump ? Math.min(1, (t - st.f.catJump) / 2.0) : 0;
    if (!st.f.catJump && st.f.curtainOpen) drawCat(g, 1000, 346, t, 'sit');
    // the bed and John
    const quilt = [[0, '#8a5a4a'], [1, '#5a3a30']];
    if (!st.f.awake) {
      const tn = st.f.turned ? Math.min(1, (t - st.f.turned) / 0.8) : 0;
      shape(g, [[250, 404 - tn * 6], [420, 384], [560, 396 + tn * 8], [720, 392], [730, 470], [240, 476]], lin(g, 0, 384, 0, 476, quilt), { lw: 2.4 });
      dabs(g, 260, 396, 460, 70, '#000', 20, 30, 0.12); drawJohnInBed(g, 210 + tn * 8, 392, t, { noBody: true });
    } else if (st.stage !== 'final') {
      shape(g, [[260, 410], [700, 404], [710, 470], [250, 476]], lin(g, 0, 404, 0, 476, quilt), { lw: 2.4 });
      g.save(); g.translate(560, 470); g.scale(0.9, 0.9); drawJohnSeated(g, 0, 0, t, { noCap: true }); g.restore();
      drawSmoke(g, 560 + 115 * 0.9, 470 - 162 * 0.9, t, tune.smokeAmount * 0.7);
    } else shape(g, [[260, 410], [700, 404], [710, 470], [250, 476]], lin(g, 0, 404, 0, 476, quilt), { lw: 2.4 });
    if (jump > 0 && jump < 1) { const x = 1000 - jump * 1150, y = 346 + jump * 300 - Math.sin(jump * Math.PI) * 220; drawCat(g, x, y, t, 'run', { flip: true }); }
    // the heavy curtains, drawn aside to the right
    const cp = st.f.curtainOpen ? 1 : (st.dragP.curtain || 0);
    const lw = 140 * (1 - cp) + 26, rw = 146 * (1 - cp) + 30;
    line(g, [[810, 52], [1130, 52]], '#3a2614', 6); // the rail
    poly(g, [[826, 56], [826 + lw, 56], [826 + lw - 6, 404], [822, 410]], lin(g, 826, 0, 826 + lw, 0, [[0, '#6a4a2a'], [1, '#8a6a3a']]), { lw: 2.4 });
    poly(g, [[1112 - rw, 56], [1112, 56], [1116, 410], [1108 - rw, 404]], lin(g, 1112 - rw, 0, 1112, 0, [[0, '#8a6a3a'], [1, '#6a4a2a']]), { lw: 2.4 });
    for (let i = 1; i < 4; i++) { line(g, [[826 + lw * i / 4, 60], [826 + lw * i / 4 - 4, 400]], 'rgba(40,24,10,0.35)', 2); line(g, [[1112 - rw * i / 4, 60], [1112 - rw * i / 4 + 4, 400]], 'rgba(40,24,10,0.35)', 2); }
    if (cp < 0.35) { g.save(); g.globalAlpha = 0.5 * (1 - cp / 0.35); g.filter = 'blur(3px)'; drawCat(g, 1000, 346, t, 'sit'); g.restore(); }
    // under the bed, at the end: a dark shape
    if (st.stage === 'final' && !st.f.safeTaken) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(140, 520, 560, 30); irect(g, 380, 520, 120, 26, '#1a1816', { lw: 1.4 }); }
    lamp(g, 965, 215, 700, 0.35);
  },
  underBedClose(g, st, t) {
    closeBack(g, '#120c08');
    for (let i = 0; i < 6; i++) irect(g, 0, 60 + i * 50, 1280, 18, '#2a1a10', { lw: 1.6 }); // the slats overhead
    floorBoards(g, 520, 720, '#3a2616', '#1e140a', 12);
    dabs(g, 0, 300, 1280, 400, '#8a8478', 80, 4, 0.2); // dust
    if (!st.f.safeTaken) drawStrongbox(g, 640, 440, 1.6);
    lamp(g, 640, 440, 400, 0.3);
  },
  parlour(g, st, t) {
    const k = 0.6 + 0.4 * Math.sin(t * 7) * Math.sin(t * 3.1); lamp(g, 640, 420, 300, 0.4 * k); // the fire
    for (let i = 0; i < 5; i++) shape(g, [[600 + i * 18, 470], [608 + i * 18, 420 - 20 * hash(Math.floor(t * 8) + i)], [616 + i * 18, 470]], 'rgba(255,150,60,0.7)', { lw: 0 });
    // the mantel clock and the music box he made her
    irect(g, 560, 196, 60, 44, '#5a3a24', { lw: 1.6 }); iell(g, 590, 214, 14, 14, '#efe6d0', { lw: 1 });
    irect(g, 666, 214, 70, 26, '#7a4a2a', { lw: 1.6 }); poly(g, [[666, 214], [736, 214], [730, 200], [672, 200]], '#8a5634', { lw: 1.4 }); iell(g, 701, 207, 6, 3, PAL.brassHi, { lw: 0.6 });
    // Paul and John, at first
    if (st.f.paulT && !st.f.paulGone) {
      const out = st.f.paulOut ? Math.min(1, (t - st.f.paulOut) / 1.6) : 0;
      drawPaul(g, 760 + out * 600, 680, t, { flip: !out, walk: out > 0 && out < 1, s: 1.3 });
      drawJohnStanding(g, 470, 680, t, {});
      const bag = st.f.bagTaken ? 1 : 0, bx = bag ? 540 : 700 + out * 600, by = 560;
      if (st.f.bagOut || bag) { shape(g, [[bx - 26, by + 40], [bx - 22, by - 10], [bx - 8, by - 26], [bx + 8, by - 26], [bx + 22, by - 10], [bx + 26, by + 40]], '#9a8a6a', { lw: 1.8 }); line(g, [[bx - 6, by - 26], [bx + 6, by - 26]], '#5a3a24', 3); }
    } else if (st.f.paulGone && !st.f.seen_pianoClose) drawJohnStanding(g, 820, 680, t, {});
  },
  pianoClose(g, st, t) {
    closeBack(g, '#1c120c');
    irect(g, 160, 40, 960, 680, lin(g, 0, 40, 0, 720, [[0, '#3a2014'], [1, '#1a0c06']]), { lw: 3 }); woodGrain(g, 164, 44, 952, 672, '#000', 0.25);
    // the music stand, her music on it
    irect(g, 420, 80, 440, 260, '#2a160e', { lw: 2 });
    g.save(); g.translate(460, 100); poly(g, [[0, 0], [360, -4], [364, 220], [4, 224]], '#efe4c4', { lw: 1.6 });
    txt(g, 'Liebestraum No. 3', 182, 30, 24, '#2a1e14', { italic: true }); txt(g, 'F. Liszt', 182, 58, 14, '#5a4a3a', { italic: true });
    for (let r = 0; r < 4; r++) for (let l = 0; l < 5; l++) line(g, [[20, 90 + r * 32 + l * 4], [340, 90 + r * 32 + l * 4]], 'rgba(40,30,20,0.4)', 0.8, 0);
    for (let i = 0; i < 40; i++) iell(g, 26 + hash(i * 3.1) * 310, 92 + Math.floor(i / 10) * 32 + hash(i) * 16, 3, 2.4, '#2a1e14', { lw: 0 });
    g.restore();
    // the keys
    for (let i = 0; i < 15; i++) { const down = st.keyDown && st.keyDown.i === i && t - st.keyDown.t0 < 0.25; irect(g, 205 + i * 58, 420 + (down ? 4 : 0), 56, 220, down ? '#d8ccb0' : '#efe8d8', { lw: 1.6 }); }
    for (let i = 0; i < 14; i++) if (![2, 6, 9, 13].includes(i)) irect(g, 245 + i * 58, 420, 34, 130, '#14100c', { lw: 1.4 });
    // the lid, lifting
    const lp = st.f.lidOpen ? 1 : (st.dragP.lid || 0);
    poly(g, [[200, 380 - lp * 60], [1080, 380 - lp * 60], [1080, 470 - lp * 120], [200, 470 - lp * 120]], lin(g, 0, 380, 0, 470, [[0, '#4a2a18'], [1, '#2a160e']]), { lw: 2.4 });
    // the cat, winding round his legs and away
    if (st.f.catRub) { const k = (t - st.f.catRub) / 3.2; if (k < 1) { const x = k < 0.35 ? -100 + k / 0.35 * 740 : k < 0.65 ? 640 : 640 + (k - 0.65) / 0.35 * 800; drawCat(g, x, 712, t, k >= 0.35 && k < 0.65 ? 'sit' : 'run'); } }
    lamp(g, 640, 300, 640, 0.4);
  },
  garden(g, st, t) {
    const bloom = st.f.bloomT ? Math.min(1, (t - st.f.bloomT) / 2.4) : 0;
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, rr = 0.35 + 0.6 * hash(i * 7.7), x = 640 + Math.cos(a) * 200 * rr, y = 526 + Math.sin(a) * 66 * rr;
      if (st.f.cutT && i % 3 === 0) { line(g, [[x, y], [x, y - 20]], '#4a6a2a', 3); continue; }
      drawTulip(g, x, y, 60 + hash(i * 3.3) * 34, bloom, i % 2 ? '#e0b830' : '#c83a2a', t, i);
    }
    if (st.f.waterT && t - st.f.waterT < 2.4) { g.save(); g.translate(560, 380); g.rotate(0.5); iconCan(g, 0, 0, 3); g.restore(); for (let i = 0; i < 8; i++) { const k = ((t * 3 + i / 8) % 1); line(g, [[640 + i * 6, 340 + k * 120], [644 + i * 6, 356 + k * 120]], 'rgba(190,210,230,0.8)', 2); } }
    if (!st.f.canTaken) { g.save(); g.translate(220, 420); iconCan(g, 0, 0, 1.6); g.restore(); }
    if (!st.f.shearsTaken) { g.save(); g.translate(340, 432); iconShears(g, 0, 0, 1.4); g.restore(); }
    drawCat(g, 330, 650, t, 'sleep');
    // John, by the back door
    drawJohnStanding(g, 1040, 660, t, { noCig: !!st.f.bouquetReady });
    if (st.f.bouquetReady && !st.f.bouquetTaken) drawBouquet(g, 1010, 500, 1);
  },
  spiral(g, st, t) {
    // the cemetery from above: plots of graves, gravel paths, each plot with its number stone
    g.fillStyle = '#2e3426'; g.fillRect(0, 0, 1280, 720); dabs(g, 0, 0, 1280, 720, '#1a2014', 200, 12, 0.3);
    FIB.forEach((q, i) => {
      const [x, y, w, h] = q.r;
      g.fillStyle = i % 2 ? '#4a5636' : '#52603c'; g.fillRect(x, y, w, h);
      for (let k = 0; k < Math.floor(q.s * q.s / 40); k++) { const gx = x + 8 + hash(i * 13 + k * 1.7) * (w - 16), gy = y + 8 + hash(i * 7 + k * 3.1) * (h - 16); g.fillStyle = '#9a968a'; g.fillRect(gx, gy, 8, 4); }
      if (q.s >= 21) for (let k = 0; k < q.s / 7; k++) iell(g, x + 14 + hash(i + k * 5.5) * (w - 28), y + 14 + hash(i * 2 + k * 2.2) * (h - 28), 12, 10, '#2a3a22', { lw: 1 });
      g.strokeStyle = '#b8ac90'; g.lineWidth = 3; g.strokeRect(x, y, w, h);
      const fs = Math.max(10, Math.min(64, q.s * SPIRAL_U * 0.4));
      txt(g, String([1, 1, 2, 3, 5, 8, 13, 21, 34, 55][i]), x + w / 2, y + h / 2, fs, i <= st.spiral ? '#f0dca0' : '#e6dcc4', { bold: true });
    });
    // the path he has walked so far: the spiral appears
    g.save(); g.strokeStyle = '#e6c071'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i <= st.spiral; i++) { const q = FIB[i]; g.beginPath(); g.arc(q.c[0], q.c[1], q.s * SPIRAL_U, q.a0, q.a0 - Math.PI / 2, true); g.stroke(); }
    g.restore();
    // her grave, at the far corner; John, at the start
    g.save(); g.translate(SPIRAL_END[0] - 6, SPIRAL_END[1] - 8); shape(g, [[-22, 20], [-22, -14], [-12, -24], [12, -24], [22, -14], [22, 20]], '#4a4a4c', { lw: 2 }); txt(g, 'M', 0, 0, 16, '#c8c8c4', { bold: true }); g.restore();
    txt(g, 'Mary', SPIRAL_END[0] + 40, SPIRAL_END[1] - 8, 18, '#e6dcc4', { italic: true });
    const k = 0.5 + 0.5 * Math.sin(t * 5); iell(g, SPIRAL_DOT[0], SPIRAL_DOT[1], 5 + k * 2, 5 + k * 2, '#d02a1a', { lw: 1.4 });
  },
  maryGrave(g, st, t) {
    churchyard(g, t, false);
    shape(g, [[460, 520], [470, 230], [520, 180], [760, 180], [810, 230], [820, 520]], lin(g, 0, 180, 0, 520, [[0, '#5a5a5c'], [1, '#3a3a3c']]), { lw: 3 });
    irect(g, 430, 516, 420, 40, '#4a4a48', { lw: 2.4 });
    txt(g, 'IN LOVING MEMORY', 640, 250, 22, '#b8b8b4', { bold: true }); txt(g, 'MARY SMITH', 640, 320, 50, '#d8d8d4', { bold: true }); txt(g, '1827 – 1851', 640, 380, 30, '#b8b8b4'); txt(g, 'Beloved wife', 640, 430, 22, '#a8a8a4', { italic: true });
    const dirt = 1 - Math.min(1, ((st.f.wipes || 0) + (st.dragP.stone || 0)) / 3);
    if (dirt > 0) { g.save(); g.globalAlpha = dirt; dabs(g, 470, 190, 340, 320, '#3a4a22', 70, 30, 0.7); dabs(g, 470, 190, 340, 320, '#2a2016', 50, 20, 0.6); g.restore(); }
    [[380, 560], [560, 600], [760, 590], [900, 560]].forEach(([x, y], i) => { if (!st.f['weed' + i]) for (let k = 0; k < 7; k++) line(g, [[x, y], [x - 30 + k * 10, y - 30 - hash(i * 9 + k) * 30]], '#4a6a2a', 3, 0.6); });
    if (st.f.laidT) { const k = Math.min(1, (t - st.f.laidT) / 1.2); g.save(); g.translate(640, 530 - (1 - k) * 80); g.rotate(1.2); drawBouquet(g, 0, 0, 1.1); g.restore(); }
    drawJohnStanding(g, 230, 690, t, { noCig: true });
    drawRain(g, 0, 0, 1280, 720, t, tune.rainAmount, 'rgba(210,220,225,0.18)');
  },
  study(g, st, t) {
    // the box on the floor, the cat in it, the drawer and its lock
    if (!st.f.cartonTaken) drawCarton(g, 330, 640, 1.4);
    if (st.f.catInBox) drawCat(g, 330, 560, t, 'sleep');
    else if (st.f.catLeave && t - st.f.catLeave < 1.6) drawCat(g, 330 - (t - st.f.catLeave) * 400, 640, t, 'run', { flip: true });
    irect(g, 820, 456, 80, 30, PAL.brass, { lw: 1.4 }); for (let i = 0; i < 6; i++) irect(g, 826 + i * 12, 462, 10, 18, '#efe6d0', { lw: 0.6 });
    if (st.f.drawerOpen) { irect(g, 760, 500, 200, 40, '#3a2010', { lw: 2 }); }
    lamp(g, 670, 150, 600, 0.45);
  },
  drawerClose(g, st, t) {
    closeBack(g, '#2a1a10'); woodGrain(g, 0, 0, 1280, 720, '#000', 0.25);
    const op = st.f.drawerOpen ? Math.min(1, (t - st.f.drawerOpen) / 0.8) : 0;
    if (op > 0) { irect(g, 300, 420 + op * 60, 680, 200, '#24140a', { lw: 2.4 }); if (!st.f.keyTaken) { g.save(); g.translate(640, 520 + op * 20); g.rotate(1.3); iconSafeKey(g, 0, 0, 3); g.restore(); } }
    irect(g, 300, 200 + op * 60, 680, 280, lin(g, 0, 200, 0, 480, [[0, '#6a3e24'], [1, '#4a2a16']]), { lw: 3 });
    if (op < 1) {
      g.save(); g.globalAlpha = 1 - op;
      irect(g, 350, 300, 580, 100, lin(g, 0, 300, 0, 400, [[0, '#8a6a2a'], [0.5, '#e6c071'], [1, '#8a6a2a']]), { lw: 2.4 });
      st.wheels.forEach((d, i) => { const x = 408 + i * 96; irect(g, x - 34, 312, 68, 76, '#efe6d0', { lw: 1.6 }); txt(g, String(d), x, 351, 46, INK, { bold: true }); poly(g, [[x - 20, 296], [x + 20, 296], [x, 262]], PAL.brassHi, { lw: 1.6 }); poly(g, [[x - 20, 424], [x + 20, 424], [x, 458]], PAL.brassHi, { lw: 1.6 }); });
      g.restore();
    }
    lamp(g, 640, 300, 600, 0.4);
  },
  cartonClose(g, st, t) {
    closeBack(g, '#2a1a10'); floorBoards(g, 0, 720, '#4a301c', '#24160c', 14);
    const p = ease(st.f.cartonFlat ? 1 : (st.dragP.unfold || 0));
    const mark = (s, x, y, a = 1) => { g.save(); g.globalAlpha = a; txt(g, s, x, y, 38, '#1e1610', { bold: true }); g.restore(); };
    if (p < 0.5) {
      g.save(); g.translate(640, 520); g.scale(2.6 + p, 2.6 + p); drawCarton(g, 0, 0, 1); g.restore();
    } else {
      const k = (p - 0.5) * 2, cx = 640, cy = 380;
      const panel = (x, y, w, h, c) => poly(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c, { lw: 2 });
      panel(cx - 170, cy - 110, 340, 220, '#c8a068');
      g.save(); g.globalAlpha = k;
      panel(cx - 170 - 170 * k, cy - 110, 170 * k, 220, '#b8915a'); panel(cx + 170, cy - 110, 170 * k, 220, '#b8915a');
      panel(cx - 170, cy - 110 - 130 * k, 340, 130 * k, '#c09858'); panel(cx - 170, cy + 110, 340, 130 * k, '#c09858');
      line(g, [[cx - 160, cy - 110 - 60 * k], [cx + 160, cy - 110 - 60 * k]], 'rgba(220,210,190,0.7)', 14);
      txt(g, 'ST. AUBIN TOY WORKS  ·  WITH CARE', cx, cy - 110 - 100 * k, 18, '#5a2a1a', { bold: true });
      mark('I', cx - 255, cy - 20, k);
      g.restore();
      mark('VI', cx - 110, cy - 40); mark('I', cx - 20, cy + 30); mark('VIII', cx + 90, cy - 30);
      g.save(); g.globalAlpha = k; mark('0', cx + 215, cy + 40, k); mark('III', cx + 290, cy - 40, k); g.restore();
    }
    lamp(g, 640, 360, 600, 0.35);
  },
  notesClose(g, st, t) { closeBack(g, '#2a1a10'); drawSheet(g, 240, 70, 800, null); },
  safeClose(g, st, t) {
    closeBack(g, '#14100c');
    irect(g, 120, 90, 1040, 560, lin(g, 0, 90, 0, 650, [[0, '#3a3634'], [1, '#141210']]), { lw: 3 });
    for (let i = 0; i < 26; i++) { iell(g, 140 + i * 40, 110, 6, 6, '#7a746a', { lw: 0.8 }); iell(g, 140 + i * 40, 630, 6, 6, '#7a746a', { lw: 0.8 }); }
    // the keyhole, behind its little cover
    iell(g, 325, 370, 64, 64, '#8a8070', { lw: 2.4 }); iell(g, 325, 370, 50, 50, '#5a5246', { lw: 1.6 });
    shape(g, [[318, 340], [332, 340], [336, 380], [330, 404], [320, 404], [314, 380]], '#0c0a08', { lw: 1 });
    if (st.f.keyInLock) { g.save(); g.translate(325, 330); iconSafeKey(g, 0, 0, 2.6); g.restore(); }
    // the plate on the right
    iell(g, 1030, 370, 70, 70, '#4a4640', { lw: 2.4 }); iell(g, 1030, 370, 40, 40, '#3a3632', { lw: 1.6 });
    // the dial: numbers outside, letters inside
    ['outer', 'inner'].forEach(k => {
      const R = DIAL[k], step = Math.PI * 2 / R.n, sp = st.f.spin && st.f.spin.k === k ? Math.max(0, 1 - (t - st.f.spin.t0) / 0.8) : 0;
      const A = (st.dial[k + 'A'] || 0) + (st.f.spin && st.f.spin.k === k ? st.f.spin.from * sp : 0), open = st.dial[k + 'Open'];
      iell(g, DIAL.cx, DIAL.cy, R.r1, R.r1, open ? '#7a8a6a' : (k === 'outer' ? '#8a8070' : '#a89a80'), { lw: 2.4, n: 40 });
      for (let i = 0; i < R.n; i++) {
        const a = -Math.PI / 2 + i * step + A, rr = (R.r0 + R.r1) / 2;
        txt(g, String(dialSym(k, i)), DIAL.cx + Math.cos(a) * rr, DIAL.cy + Math.sin(a) * rr, k === 'outer' ? 30 : 32, '#1e1a16', { bold: true });
        line(g, [[DIAL.cx + Math.cos(a + step / 2) * R.r0, DIAL.cy + Math.sin(a + step / 2) * R.r0], [DIAL.cx + Math.cos(a + step / 2) * R.r1, DIAL.cy + Math.sin(a + step / 2) * R.r1]], 'rgba(30,26,22,0.4)', 1.4);
      }
      // the tings so far, as little brass pips by the ring
      st.dial[k + 'In'].forEach((_, i) => iell(g, DIAL.cx + 240 + i * 22, DIAL.cy + (k === 'outer' ? -190 : -150), 7, 7, PAL.brassHi, { lw: 1 }));
    });
    iell(g, DIAL.cx, DIAL.cy, DIAL.inner.r0, DIAL.inner.r0, '#5a5246', { lw: 2 }); txt(g, 'J  &  M', DIAL.cx, DIAL.cy, 20, PAL.brassHi, { italic: true });
    poly(g, [[DIAL.cx - 16, DIAL.cy - DIAL.outer.r1 - 30], [DIAL.cx + 16, DIAL.cy - DIAL.outer.r1 - 30], [DIAL.cx, DIAL.cy - DIAL.outer.r1 - 4]], PAL.brassHi, { lw: 1.6 }); // the mark
    // the cat, snatching the key
    if (st.f.catStole && t - st.f.catStole < 2.2) { const k = (t - st.f.catStole) / 2.2, x = 1300 - k * 1500; drawCat(g, x, 420 - Math.sin(k * Math.PI) * 140, t, 'run', { flip: true }); if (k > 0.55) { g.save(); g.translate(x + 40, 380 - Math.sin(k * Math.PI) * 140); iconSafeKey(g, 0, 0, 1.4); g.restore(); } }
    lamp(g, 640, 300, 700, 0.35);
  },
  safeOpen(g, st, t) {
    closeBack(g, '#0e0a08');
    irect(g, 200, 100, 880, 520, '#1a1612', { lw: 3 }); irect(g, 240, 140, 800, 440, '#0a0806', { lw: 2 });
    for (let i = 0; i < 3; i++) irect(g, 310 + i * 6, 420 - i * 10, 190, 110, '#e6dcc4', { lw: 1.6 }); line(g, [[310, 470], [500, 460]], '#8a2a3a', 3); line(g, [[400, 410], [410, 530]], '#8a2a3a', 3);
    irect(g, 820, 380, 170, 150, '#5a2a1a', { lw: 2 }); irect(g, 832, 392, 146, 126, null, { lw: 1.4, stroke: PAL.brassHi }); txt(g, 'M. S.', 905, 455, 22, PAL.brassHi, { italic: true });
    if (!st.f.listSealed || st.shot) { g.save(); g.translate(650, 380); g.rotate(-0.08); irect(g, -100, -70, 200, 140, PAL.paper, { lw: 2 }); txt(g, 'Things I want to do', 0, -44, 18, '#2a2a5a', { font: HAND }); for (let i = 0; i < 4; i++) line(g, [[-80, -14 + i * 22], [70, -16 + i * 22]], '#2a2a5a', 1.2); g.restore(); }
    drawTulip(g, 540, 560, 50, 1, '#a83a3a', 0, 1); line(g, [[560, 300], [600, 260], [640, 300]], '#8a2a3a', 6); // a pressed tulip, a ribbon
    lamp(g, 640, 300, 600, 0.45);
  },
  nightYard(g, st, t) {
    churchyard(g, t, true);
    const s = st.night.step;
    // three ways on from the fork, into the dark
    poly(g, [[560, 720], [720, 720], [700, 520], [580, 520]], '#3a3a34', { lw: 0, stroke: false });
    poly(g, [[580, 520], [700, 520], [690, 300], [610, 300]], '#2a2a26', { lw: 0, stroke: false });
    poly(g, [[580, 540], [600, 500], [260, 380], [200, 410]], '#2a2a26', { lw: 0, stroke: false });
    poly(g, [[700, 540], [680, 500], [1020, 380], [1080, 410]], '#2a2a26', { lw: 0, stroke: false });
    for (let i = 0; i < 18; i++) { const x = 40 + hash(i * 3.3 + s * 11) * 1200, y = 330 + hash(i * 5.1 + s * 7) * 280; if (Math.abs(x - 640) < 90 && y > 300) continue; g.save(); g.translate(x, y); const sc = 0.4 + (y - 330) / 400; g.scale(sc, sc); shape(g, [[-40, 60], [-40, -30], [-24, -60], [24, -60], [40, -30], [40, 60]], '#1e2226', { lw: 1.6 }); if (i % 3 === 0) { line(g, [[0, -60], [0, -110]], '#1e2226', 8); line(g, [[-20, -94], [20, -94]], '#1e2226', 8); } g.restore(); }
    for (let i = 0; i < 5; i++) { g.save(); g.globalAlpha = 0.18; g.fillStyle = '#9aa4b0'; g.beginPath(); g.ellipse(((i * 300 + t * 20) % 1600) - 160, 470 + i * 30, 300, 30, 0, 0, 6.3); g.fill(); g.restore(); }
    // his lantern: the only light
    g.save(); g.fillStyle = rad(g, 640, 640, 40, 520, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.75)']]); g.fillRect(0, 0, 1280, 720); g.restore();
    lamp(g, 640, 640, 300, 0.6);
    const wrong = t - st.night.wrongT < 4;
    txt(g, '·'.repeat(s + 1), 640, 690, 30, wrong ? '#6a6a64' : PAL.paleOchre);
  },
  statue(g, st, t) {
    churchyard(g, t, true);
    // the figure of Death, his scythe; the plinth and its words
    irect(g, 470, 450, 340, 190, '#4a4a48', { lw: 3 }); irect(g, 440, 630, 400, 30, '#3a3a38', { lw: 2 });
    // a robed, hooded figure carved in stone, its scythe in one hand
    line(g, [[742, 452], [706, 96]], '#3a3a38', 8); poly(g, [[706, 96], [612, 70], [540, 100], [616, 88]], '#6a6a68', { lw: 2 });
    poly(g, [[548, 450], [566, 300], [586, 236], [606, 176], [640, 150], [674, 176], [694, 236], [714, 300], [732, 450]], '#5e5e5a', { lw: 3 });
    for (let i = 0; i < 5; i++) line(g, [[590 + i * 24, 300], [578 + i * 30, 448]], 'rgba(20,20,20,0.35)', 2); // the folds of the robe
    poly(g, [[612, 236], [610, 196], [640, 168], [670, 196], [668, 236], [640, 246]], '#1e1e1e', { lw: 2 }); // the hood's shadow, no face
    poly(g, [[694, 262], [720, 300], [716, 330], [700, 336], [690, 300]], '#5e5e5a', { lw: 2 }); iell(g, 712, 322, 12, 10, '#6a6a66', { lw: 1.6 }); // the arm on the scythe
    txt(g, 'TILL THE', 640, 500, 30, '#c8c8c0', { bold: true }); txt(g, 'DEAD DO US PART', 640, 548, 30, '#c8c8c0', { bold: true });
    if (st.f.scratchT) { const k = Math.min(1, (t - st.f.scratchT) / 2); g.save(); g.globalAlpha = k; for (let i = 0; i < 5; i++) line(g, [[534 + i * 16, 528], [548 + i * 16, 568]], '#e6dcc4', 2); g.restore(); }
    if (!st.f.keyBack) { drawCat(g, 880, 610, t, 'sit'); g.save(); g.translate(860, 600); iconSafeKey(g, 0, 0, 1.4); g.restore(); }
    lamp(g, 640, 400, 500, 0.35);
    g.save(); g.fillStyle = rad(g, 640, 450, 120, 700, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.7)']]); g.fillRect(0, 0, 1280, 720); g.restore();
  },
});

// ---- Shots ---------------------------------------------------------------------------------------
Object.assign(SHOTS, {
  houseFront(g, st, t) { // the house gone to ruin; one bed of tulips cared for like nothing else
    const k = ease(t / 5.5), s = 1.08 - k * 0.08;
    g.save(); g.translate(640, 360); g.scale(s, s); g.translate(-640, -360);
    g.fillStyle = lin(g, 0, 0, 0, 400, [[0, '#9aa4a6'], [1, '#c8c0a8']]); g.fillRect(0, 0, 1280, 720);
    poly(g, [[380, 560], [380, 280], [900, 280], [900, 560]], '#b8a888', { lw: 3 });
    for (let i = 0; i < 40; i++) iell(g, 390 + hash(i * 3.1) * 500, 290 + hash(i * 5.3) * 260, 22, 12, 'rgba(120,108,90,0.3)', { lw: 0.6 });
    shape(g, [[340, 290], [500, 150], [780, 150], [940, 290]], '#6a5a40', { lw: 3 }); dabs(g, 360, 160, 560, 130, '#3a2e1e', 40, 16, 0.4);
    irect(g, 800, 100, 40, 80, '#6a4a3a', { lw: 2 });
    irect(g, 600, 400, 90, 160, '#4a2e1a', { lw: 2.4 }); [[430, 340], [740, 340], [430, 440], [760, 440]].forEach(([x, y]) => { irect(g, x, y, 90, 70, '#3a3a40', { lw: 2.4 }); line(g, [[x + 45, y], [x + 45, y + 70]], '#2a2016', 3); });
    line(g, [[440, 352], [520, 404]], 'rgba(30,20,10,0.6)', 2); // a cracked pane
    g.fillStyle = lin(g, 0, 560, 0, 720, [[0, '#6a6040'], [1, '#4a4430']]); g.fillRect(0, 556, 1280, 164);
    for (let i = 0; i < 30; i++) { const x = hash(i * 2.7) * 1280, y = 520 + hash(i * 9.1) * 120; if (x > 940 && x < 1200) continue; shape(g, ellPts(x, y, 40, 30, 10), i % 2 ? '#8a6a3a' : '#7a5a2a', { lw: 1.4 }); } // dead shrubs
    dabs(g, 380, 280, 120, 280, '#5a4a2a', 40, 20, 0.6); // dry ivy
    iell(g, 1070, 620, 110, 34, '#4a2e1e', { lw: 2.4 });
    for (let i = 0; i < 16; i++) drawTulip(g, 980 + (i % 8) * 24, 610 + Math.floor(i / 8) * 18, 40, 1, i % 2 ? '#e0b830' : '#c83a2a', t, i);
    drawRain(g, 0, 0, 1280, 720, t, tune.rainAmount * 0.6, 'rgba(210,220,225,0.18)');
    g.restore();
    letterbox(g);
  },
  bouquetHand(g, st, t) { // the flowers in his hands; the cat looking up
    g.fillStyle = '#4a4a40'; g.fillRect(0, 0, 1280, 720); dabs(g, 0, 0, 1280, 720, '#2a2a20', 80, 30, 0.3);
    shape(g, [[300, 800], [360, 420], [520, 340], [760, 340], [920, 420], [980, 800]], PAL.coat, { lw: 3 });
    drawBouquet(g, 640, 420, 4);
    iell(g, 560, 520, 50, 36, PAL.skin, { lw: 2.4 }); iell(g, 720, 520, 50, 36, PAL.skin, { lw: 2.4 });
    drawCat(g, 1080, 720, t, 'sit');
    letterbox(g);
  },
});

// ---- The memories found at home -----------------------------------------------------------------------
function brighten(g) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,220,160,0.25)'; g.fillRect(0, 0, 1280, 720); g.restore(); }
const MEMS = {
  piano: {
    thumb(g, x, y, w, h) { g.fillStyle = '#3a2014'; g.fillRect(x, y, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = '#efe8d8'; g.fillRect(x + 6 + i * 15, y + h * 0.6, 13, h * 0.35); } g.fillStyle = '#e6dcc4'; g.fillRect(x + w * 0.3, y + 6, w * 0.4, h * 0.35); },
    update(st, m) {
      const F = tune.memFrame;
      if (m.t < F || m.t >= F * 2) return;
      while (m.note + 1 < DUET.length && m.t - F >= DUET_T(m.note + 1)) { m.note++; playDuetNote(m.note); }
    },
    draw(g, st, part, pt, t) {
      if (part === 0) { // the parlour, young: the two of them at the piano
        g.drawImage(roomBg('parlour', BG_SCALE), 0, 0, 1280, 720); brighten(g);
        g.save(); g.translate(990, 690); g.scale(0.95, 0.95); drawMary(g, 0, 0, t, { kneel: true, laugh: pt > 0.6 }); g.restore();
        drawYoungJohn(g, 1140, 470, 0.7, { noBand: true, look: -10 });
      } else if (part === 1) { // her page of letters; what each plays lights up
        g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 1280, 720);
        const lit = {}, now = st.mem ? st.mem.t - tune.memFrame : pt * tune.memFrame;
        DUET.forEach((d, i) => { if (now >= DUET_T(i)) lit[`${d[0]}${d[1]}${d[2]}`] = d[3]; });
        drawSheet(g, 260, 80, 760, lit);
      } else {
        g.drawImage(roomBg('parlour', BG_SCALE), 0, 0, 1280, 720); brighten(g);
        g.save(); g.translate(560, 1000); g.scale(1.4, 1.4); drawMary(g, 0, 0, t, { kneel: true, laugh: true }); g.restore();
        if (pt > 0.3) memLine(g, 'Mary', "Slower, John! Wait for my part.");
      }
    },
  },
  tulips: {
    thumb(g, x, y, w, h) { g.fillStyle = '#7a7466'; g.fillRect(x, y, w, h); for (let i = 0; i < 10; i++) iell(g, x + 14 + (i % 5) * 24, y + h * 0.5 + Math.floor(i / 5) * 18, 6, 6, i % 2 ? '#e0b830' : '#c83a2a', { lw: 0.6 }); },
    draw(g, st, part, pt, t) {
      g.drawImage(roomBg('garden', BG_SCALE), 0, 0, 1280, 720); brighten(g);
      if (part === 0) { // he lays the bricks of the bed; she watches
        drawYoungJohn(g, 520, 560, 0.9, { noBand: true, look: 14 });
        drawMary(g, 900, 690, t, {});
        if (pt > 0.3) memLine(g, 'Mary', 'I do love tulips, John.');
      } else if (part === 1) {
        for (let i = 0; i < 12; i++) drawTulip(g, 480 + i * 28, 540 + (i % 2) * 14, 30 + pt * 30, pt, i % 2 ? '#e0b830' : '#c83a2a', t, i);
        drawYoungJohn(g, 300, 520, 0.9, { noBand: true, look: 14 });
        if (pt > 0.2) memLine(g, 'John', "I know. That's why I'm making you a garden of them.");
      } else {
        g.save(); g.translate(760, 1030); g.scale(1.5, 1.5); drawMary(g, 0, 0, t, { laugh: true }); g.restore();
        if (pt > 0.2) memLine(g, 'Mary', 'Imagine a whole field of them!');
      }
    },
  },
  list: {
    thumb(g, x, y, w, h) { g.fillStyle = '#4a3a2a'; g.fillRect(x, y, w, h); g.fillStyle = PAL.paper; g.fillRect(x + w * 0.25, y + 8, w * 0.5, h - 16); for (let i = 0; i < 5; i++) { g.fillStyle = '#2a2a5a'; g.fillRect(x + w * 0.3, y + 18 + i * 12, w * 0.38, 1.5); } },
    draw(g, st, part, pt, t) {
      if (part === 0) { // she writes by the candle, happy
        g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, 1280, 720); lamp(g, 760, 420, 500, 0.7);
        irect(g, 300, 520, 760, 40, '#5a3a24', { lw: 2.4 });
        g.save(); g.translate(640, 700); g.scale(1.2, 1.2); drawMary(g, 0, 0, t, { kneel: true, laugh: true, reach: 0.6 }); g.restore();
        g.save(); g.translate(820, 510); g.rotate(-0.06); irect(g, -70, -16, 140, 32, PAL.paper, { lw: 1.4 }); g.restore();
        iell(g, 960, 470, 8, 30, '#efe6d0', { lw: 1.4 }); iell(g, 960, 434, 5, 10, 'rgba(255,200,110,0.9)', { lw: 0.6 });
        if (pt > 0.25) memLine(g, 'Mary', 'Life is so beautiful, John. There are so many things I want to do.');
      } else if (part === 1) { // the list, line by line
        g.fillStyle = '#120d08'; g.fillRect(0, 0, 1280, 720);
        g.save(); g.translate(640, 370); g.rotate(-0.02);
        poly(g, [[-330, -330], [330, -336], [336, 330], [-326, 336]], lin(g, 0, -330, 0, 330, [[0, '#ead9b0'], [1, '#d4bf8f']]), { lw: 2.4 });
        txt(g, 'Things I want to do', -280, -280, 38, '#2a2a5a', { align: 'left', font: HAND });
        LIST.forEach((s, i) => { if (pt * (LIST.length + 1) < i + 0.5) return; irect(g, -282, -214 + i * 62, 22, 22, null, { lw: 1.6, stroke: '#2a2a5a' }); txt(g, s, -244, -203 + i * 62, 27, '#2a2a5a', { align: 'left', font: HAND }); });
        g.restore();
      } else { // he smiles at her
        g.fillStyle = '#3a2a1c'; g.fillRect(0, 0, 1280, 720); lamp(g, 640, 360, 600, 0.6);
        drawYoungJohn(g, 640, 440, 2, { noBand: true });
        if (pt > 0.2) memLine(g, 'John', "Then we'll do them together. Every one of them.");
      }
    },
  },
};
Object.assign(MEM_AFTER, {
  piano(st) { return false; },     // the cat comes by the piano (pianoClose)
  tulips(st) { return false; },    // the shears (garden)
  list(st) { run(st, [shot('black'), 2.0, () => { st.done = true; }]); return true; }, // the end of the demo
});

// ---- Each step ------------------------------------------------------------------------------------
function worldUpdate(st, dt) {
  if (st.room === 'nightYard' && !st.fade && !st.script && !st.map && st.t - (st.night.lastMeow || 0) > 2.6) {
    st.night.lastMeow = st.t;
    const wrong = st.t - st.night.wrongT < 4, dir = NIGHT_ROUTE[st.night.step];
    meowAt(wrong ? 0.015 : 0.03 + 0.025 * st.night.step, { left: -0.5, ahead: 0, right: 0.5 }[dir] || 0);
  }
}

// ---- Hints at home, at her grave, and at night -----------------------------------------------------
function hintHouse(st) {
  const r = st.room, f = st.f, has = id => hasItem(st, id), album = ['al', ['A memory has woken.', 'Open the album.', 'Click Album at the bottom right, then double-click the glowing photograph.']];
  for (const id of ['piano', 'tulips', 'list']) if (st.mems[id] && !st.mems[id].seen) return album;
  if (r === 'bedroom' && !f.awake) return !f.curtainOpen ? ['b0', ['Something moves behind the curtain.', 'Draw the curtain aside.', 'Drag the curtain to the right.']] : ['b1', ['Let it in.', 'Open the window.', 'Drag the window upwards.']];
  if (st.stage === 'home') {
    if (!f.seen_parlour) return ['b2', ['Someone is calling from downstairs.', 'Open the map.', 'Press M (or swipe down), then click the Parlour.']];
    if (r === 'parlour') return ['p0', ['Only one thing here matters to him.', 'The piano.', 'Double-click the piano on the right.']];
    if (r === 'pianoClose') { if (!f.lidOpen) return ['p1', ['The lid is closed.', 'Lift it.', 'Drag the lid upwards.']]; if (!f.pianoSealed) return ['p2', ['Play something. Anything.', 'Click a few keys.', 'Click four keys.']]; }
    if (st.rooms.garden && r !== 'garden') return ['p3', ['The cat went somewhere.', 'Follow its paw prints on the map.', 'Step back, press M, then click the Tulip Garden.']];
    if (r === 'garden') {
      if (!f.watered) return has('can') ? ['t1', ['They are thirsty.', 'Use the can on them.', 'Drag the can from the bar onto the tulips.']] : ['t0', ['The tulips are closed tight, thirsty.', 'The watering can, on the bench.', 'Click the can, then drag it onto the tulips.']];
      if (!f.cutT) return ['t2', ['Cut some for her.', 'The shears, on the bench.', 'Take the shears and drag them onto the tulips.']];
      return ['t3', ['Take the flowers.', 'In his hands.', 'Click the flowers John is holding.']];
    }
  }
  if (r === 'spiral') return ['c0', ['Each square has a number. Each number is the two before it added together.', '1, 1, 2, 3, 5, 8...: walk the squares in that order, smallest first.', 'Hold and drag from the red dot through 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.']];
  if (r === 'maryGrave') return f.graveDone ? ['c2', ['Home.', 'Open the map.', "Press M, then click John's House."]] : ['c1', ['Her stone needs care.', 'Wipe the stone, pull the weeds.', 'Drag across the stone three times, and click each weed.']];
  if (st.stage === 'homeward' || st.stage === 'homebound') return ['c3', ['Home.', 'Open the map.', "Press M, then click John's House."]];
  if (st.stage === 'night' && !has('safeKey') && !f.keyInLock) {
    if (r === 'nightYard') return ['n0', ['Listen to the cat.', 'Nearer is louder. Fainter means the wrong way.', `Take the ${NIGHT_ROUTE[st.night.step] === 'ahead' ? 'middle' : NIGHT_ROUTE[st.night.step]} path.`]];
    if (r === 'statue') return ['n1', ['The cat has the key.', 'Take it back.', 'Click the cat.']];
    return ['n2', ['The cat ran off with the key.', 'Follow its paw prints on the map.', 'Step back, press M, click The Town, then the cemetery.']];
  }
  if (st.stage === 'final' || st.stage === 'night') {
    if (!f.safeTaken) return r === 'underBedClose' ? ['f0b', ['Take it.', 'The strongbox.', 'Click the strongbox.']] : r === 'bedroom' ? ['f0', ['Look under the bed.', 'Something heavy, under the bed.', 'Double-click the dark space under the bed.']] : ['f1', ['Where would he keep her things?', 'Near him. The bedroom.', 'Open the map, click the Bedroom, then look under the bed.']];
    if (!f.cartonTaken) return r === 'study' ? (f.catInBox ? ['f2', ['The cat has found a box to sleep in.', 'Shoo it out.', 'Click the cat, then click the box.']] : ['f2b', ['The box.', '', 'Click the box on the floor.']]) : ['f2c', ['The cat went to the study.', 'Follow it.', 'Open the map and click the Study.']];
    if (!f.cartonFlat) return ['f3', ['The box is marked all over.', 'Open it out flat.', 'Double-click the box in the bar, then drag it open.']];
    if (!f.drawerOpen) return ['f4', ['The desk drawer has a lock of six numbers.', 'The marks on the box, read left to right, are numbers.', 'I VI I VIII 0 III: set 1 6 1 8 0 3 on the drawer in the study.']];
    if (!f.keyTaken) return ['f5', ['The drawer is open.', 'The key inside.', 'Click the key in the drawer.']];
    if (r === 'safeOpen') return ['fc', ['Her keepsakes.', 'The list.', 'Click the folded list in the middle.']];
    if (!f.safeUnlocked) return ['f6', ['Her strongbox.', 'Open it with the key.', 'Double-click the strongbox in the bar, then drag the key onto the keyhole.']];
    if (!st.dial.innerOpen) {
      if (!f.musicHeard) return ['f7', ['The dial has two rings.', 'Try the inner ring, the letters.', 'Drag round the inner ring of the dial.']];
      if (!f.gotPage) return ['f8', ['Her part is missing from the music box.', 'The memory of the two of them at the piano.', 'Open the album, play the piano memory, pause on the page of letters and click it.']];
      return ['f9', ['Which notes did she play?', 'The notes that lit up rose when she played: the fourth row, below.', 'Turn the inner ring to B, let go; then C, let go; then F, let go.']];
    }
    if (!f.catStole) return ['fa', ['Now the outer ring, the numbers.', 'Turn it.', 'Drag round the outer ring.']];
    return ['fb', ['The cat scratched one word: DEAD.', 'Letters can be numbers: A is 1, B is 2...', 'D E A D: turn the outer ring to 4, let go; 5; 1; 4.']];
  }
  return null;
}
