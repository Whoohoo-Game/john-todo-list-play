// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-14
// shots.js: the opening's camera shots, each a painted frame from its own camera angle (high,
// low, over the shoulder, close, Dutch tilt, John's point of view), with depth layers and soft
// foregrounds. Each draws a 1280x720 frame for a time t in seconds since the shot began.
// storyboard.html shows them for review; the game cuts to them in its opening.
'use strict';

// A soft, out-of-focus layer: drawn through a blur where the browser has one.
function soft(g, px, fn) { g.save(); if ('filter' in g) g.filter = `blur(${px}px)`; fn(); g.restore(); }
function dark(g, a, holes = [], rgb = '6,4,3') { // darkness over the frame, with soft holes of light
  g.save(); g.fillStyle = `rgba(${rgb},${a})`;
  g.beginPath(); g.rect(0, 0, 1280, 720); g.fill(); g.restore();
  holes.forEach(([x, y, r, s, c = '255,200,120']) => { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(g, x, y, 0, r, [[0, `rgba(${c},${s})`], [1, `rgba(${c},0)`]]); g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); });
}
function letterbox(g, k = 1) { const h = 84 * k; g.fillStyle = '#000'; g.fillRect(0, 0, 1280, h); g.fillRect(0, 720 - h, 1280, h); }
function shotText(g, s, y = 668, size = 24) { txt(g, s, 640, y, size, PAL.paleOchre, { italic: true }); }

const OPENING = [
  { id: 'cold', len: 6, angle: 'Extreme close-up, from below', sound: 'A clock ticks in the dark. A match strikes.', screen: '—',
    note: 'Cold open. Black, then a match lights half of John\'s face from below: an eye, the stubble, the cigarette. He does not look at us.' },
  { id: 'title', len: 5, angle: 'Insert: smoke, very close', sound: 'He breathes out. The clock.', screen: 'John Todo List',
    note: 'The smoke from his first draw fills the frame; the title forms in it and drifts apart.' },
  { id: 'quote', len: 5, angle: 'Title plate', sound: 'Silence, then rain begins.', screen: '"Memento Mori." / "Remember that you must die."',
    note: 'The Canva quote plate, unchanged.' },
  { id: 'outside', len: 7, angle: 'Extreme wide, high, two-point perspective', sound: 'Rain. The factory whistle, far off.', screen: 'Plate: The Toy Factory',
    note: 'Dawn in the rain. The factory looms over a muddy road; a chimney smokes; small figures with umbrellas file through the gate. One lit window, high in the corner.' },
  { id: 'rafters', len: 7, angle: 'High angle, from the rafters, looking down', sound: 'Machines start, a steady rhythm.', screen: 'Narration: "Deep inside a toy factory, there\'s an old man who\'s been working here for over 30 years."',
    note: 'Beams pass close in the foreground, soft. Below, rows of benches and workers, small as toys. In the far corner, one pool of lamplight.' },
  { id: 'floor', len: 7, angle: 'Low angle, at floor level, slow push in', sound: 'Boots on boards, close. The rhythm continues.', screen: 'Narration: "His name is John. There he is, quietly working away in the corner."',
    note: 'A worker\'s boots cross the lens, soft. A wooden horse lies in the foreground. Far down the aisle, John\'s hunched shape in the lamplight.' },
  { id: 'shoulder', len: 6, angle: 'Over the shoulder', sound: 'The scrape of a chisel. A cough, held in.', screen: '—',
    note: 'His shoulder and cap fill the left, out of focus. His hands shake as he carves the horse. Behind: a calendar of crossed-out days, a bottle, a photograph laid face down.' },
  { id: 'eye', len: 5, angle: 'Extreme close-up, profile', sound: 'The chisel stops. The clock, louder.', screen: '—',
    note: 'One eye under the cap\'s brim, tired. Smoke drifts across the frame. Then control returns: tutorials 1 and 2 as before.' },
  { id: 'apprentice', len: 5, angle: 'Medium two-shot, side on', sound: 'Machines. Eager footsteps.', screen: 'Apprentice: "Mr. Smith? I made one. Like yours."', collapse: true,
    note: 'After the second focus. A young apprentice holds out a wooden horse he carved himself. John keeps carving. He does not look up.' },
  { id: 'verdict', len: 4, angle: 'Over John\'s shoulder', sound: 'Wood dropped into a bin.', screen: 'John: "Legs are uneven. Firewood."', collapse: true,
    note: 'John takes the horse, gives it one look, and drops it in the shavings bin. The boy stays soft behind it.' },
  { id: 'hurt', len: 4, angle: 'Close-up, the boy', sound: 'Somebody snickers, then stops.', screen: '—', collapse: true,
    note: 'The boy\'s face falls. Behind him, out of focus, two workers trade a look: this is John, every day.' },
  { id: 'foreman', len: 5, angle: 'Low angle, from the bench top', sound: 'A key winds. Tin feet tick on wood.', screen: 'Foreman: "Orders from the owner, John. Tin from now on. No more wooden horses."', collapse: true,
    note: 'The foreman looms in. He sets a wind-up tin soldier on John\'s bench and winds it; it marches past the half-carved horse.' },
  { id: 'grip', len: 3, angle: 'Extreme close-up, his hand', sound: 'The tin feet, louder. The clock.', screen: '—', collapse: true,
    note: 'His knuckles whiten on the chisel. The tin soldier marches into frame and bumps his hand.' },
  { id: 'rage', len: 4, angle: 'Very low angle, looking up, tilted', sound: 'A fist on the bench. Tin clattering away.', screen: 'John: "Thirty years! Thirty years I carved for this place!"', collapse: true,
    note: 'John stands over the camera, slams the bench and sweeps the tin soldier off it. The frame flushes red.' },
  { id: 'silence', len: 4, angle: 'High angle, wide', sound: 'Every machine stops. Only the tin soldier\'s feet, on the floor.', screen: '—', collapse: true,
    note: 'The whole floor has frozen and is looking at him. The tin soldier lies on its back, legs still marching.' },
  { id: 'breath', len: 4, angle: 'Close-up, John', sound: 'His breath, ragged. The first cough.', screen: '—', collapse: true,
    note: 'The anger drains into something worse. Red in the face, a hand to his chest, he starts to cough.' },
  { id: 'hand', len: 4, angle: 'Insert: his hand', sound: 'Coughing. Everything else drops away.', screen: '—', collapse: true,
    note: 'He takes the handkerchief from his mouth. Blood on the white cloth. The hand trembles.' },
  { id: 'tilt', len: 4, angle: 'Medium, Dutch tilt, slow motion', sound: 'A muffled heartbeat. Sound slurs.', screen: '—', collapse: true,
    note: 'The frame leans. John tips off his stool; the half-carved horse leaves his fingers and hangs in the air.' },
  { id: 'drop', len: 4, angle: 'Floor level, extreme close-up', sound: 'The horse hits the boards. The chisel rings.', screen: '—', collapse: true,
    note: 'The horse lands on its side in sharp focus. Behind it, out of focus, his open hand falls to the floor.' },
  { id: 'pov', len: 6, angle: 'John\'s point of view, from the floor', sound: 'Voices, muffled and far: "John? John!" "Fetch the doctor!"', screen: 'Subtitles of the voices', collapse: true,
    note: 'The ceiling beams turn above him. Faces lean in from the edges of the frame, doubled and blurred. The dark closes in from the edges.' },
  { id: 'white', len: 3, angle: 'Fade to white', sound: 'The heartbeat stops. The ambulance bell.', screen: '—', collapse: true,
    note: 'Not black: white. Then the hospital.' },
];

// ---- Helpers for the factory shots --------------------------------------------------------------
function facePt(F, u, v) { const top = [F.tl[0] + (F.tr[0] - F.tl[0]) * u, F.tl[1] + (F.tr[1] - F.tl[1]) * u], bot = [F.bl[0] + (F.br[0] - F.bl[0]) * u, F.bl[1] + (F.br[1] - F.bl[1]) * u]; return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v]; }
function face(g, F, c) { poly(g, [F.tl, F.tr, F.br, F.bl], c, { lw: 3 }); }
function brickLines(g, F, n) { g.save(); g.globalAlpha = 0.18; for (let i = 1; i < n; i++) { const v = i / n; line(g, [facePt(F, 0, v), facePt(F, 1, v)], '#2a120a', 1, 0.2); } g.restore(); }
function faceWindow(g, F, u0, u1, v0, v1, lit) { // a tall rectangular window of small panes, on a wall in perspective
  const P = (u, v) => facePt(F, u, v);
  poly(g, [P(u0 - 0.008, v0 - 0.015), P(u1 + 0.008, v0 - 0.015), P(u1 + 0.008, v1 + 0.02), P(u0 - 0.008, v1 + 0.02)], '#c9b89a', { lw: 1.2 }); // stone surround
  poly(g, [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], lit ? '#e8b860' : '#3a4448', { lw: 1.4 });
  for (let i = 1; i < 3; i++) line(g, [P(u0 + (u1 - u0) * i / 3, v0), P(u0 + (u1 - u0) * i / 3, v1)], '#2a2622', 1.2, 0.1);
  for (let i = 1; i < 4; i++) line(g, [P(u0, v0 + (v1 - v0) * i / 4), P(u1, v0 + (v1 - v0) * i / 4)], '#2a2622', 1.2, 0.1);
  line(g, [P(u0 - 0.01, v1 + 0.025), P(u1 + 0.01, v1 + 0.025)], '#b8a888', 2.4, 0.1); // the sill
}
function cityRow(g, base, s, c, n, seed) { // a row of town houses and warehouses: pitched roofs, chimneys
  let x = -40;
  for (let i = 0; i < n * 3; i++) {
    const w = (60 + hash(i * 3.1 + seed) * 90) * s, h = (70 + hash(i * 5.7 + seed) * 120) * s, roof = hash(i * 1.9 + seed) > 0.4;
    poly(g, [[x, base], [x, base - h], ...(roof ? [[x + w / 2, base - h - 34 * s]] : []), [x + w, base - h], [x + w, base]], c, { lw: 1.2 });
    if (hash(i * 7.3 + seed) > 0.4) irect(g, x + w * 0.7, base - h - 30 * s, 10 * s, 26 * s, c, { lw: 1 });
    for (let r = 0; r < Math.floor(h / (34 * s)); r++) for (let q = 0; q < Math.floor(w / (26 * s)); q++) if (hash(i * 13 + r * 3 + q) > 0.3) irect(g, x + 8 * s + q * 26 * s, base - h + 14 * s + r * 34 * s, 10 * s, 16 * s, hash(i + r + q) > 0.92 ? 'rgba(232,184,96,0.8)' : 'rgba(40,44,48,0.5)', { lw: 0, stroke: false });
    x += w + 2; if (x > 1320) break;
  }
}
function benchBox(g, cx, cy, w, s, top = '#7a4e2e', front = '#5a341e') { // a workbench in high-angle view: top, front, legs
  const hw = w / 2 * s, d = 34 * s, h = 46 * s;
  line(g, [[cx - hw + 6 * s, cy + h], [cx - hw + 6 * s, cy + h + 30 * s]], '#2a1a10', 6 * s); line(g, [[cx + hw - 6 * s, cy + h], [cx + hw - 6 * s, cy + h + 30 * s]], '#2a1a10', 6 * s);
  poly(g, [[cx - hw, cy], [cx + hw, cy], [cx + hw - 6 * s, cy - d], [cx - hw + 6 * s, cy - d]], top, { lw: 1.6 });
  poly(g, [[cx - hw, cy], [cx + hw, cy], [cx + hw, cy + h], [cx - hw, cy + h]], front, { lw: 1.6 });
  line(g, [[cx - hw + 10 * s, cy + h * 0.5], [cx + hw - 10 * s, cy + h * 0.5]], 'rgba(0,0,0,0.3)', 1.2 * s);
}
function benchToys(g, cx, cy, w, s, i) { // what lies on a bench: toys half made, tools
  for (let q = 0; q < 4; q++) {
    const x = cx - w / 2 * s + (24 + q * (w - 48) / 3) * s, y = cy - 16 * s, kind = (i + q) % 4;
    if (kind === 0) { g.save(); g.translate(x, y); g.scale(0.32 * s, 0.32 * s); shape(g, [[-80, -20], [60, -24], [90, -70], [110, -60], [96, -24], [80, 0], [-80, 0]], '#c08a5a', { lw: 3 }); g.restore(); }
    else if (kind === 1) drawSoldier(g, x, y + 6 * s, 0.45 * s, 0);
    else if (kind === 2) { irect(g, x - 12 * s, y - 8 * s, 24 * s, 14 * s, '#7f9a92', { lw: 1 }); iell(g, x - 7 * s, y + 7 * s, 4 * s, 4 * s, '#2a2a2a', { lw: 0.6 }); iell(g, x + 7 * s, y + 7 * s, 4 * s, 4 * s, '#2a2a2a', { lw: 0.6 }); }
    else { line(g, [[x - 14 * s, y + 4 * s], [x + 14 * s, y - 2 * s]], '#9a9a90', 3 * s); }
  }
}
function crate(g, x, y, s) { poly(g, [[x, y], [x + 70 * s, y], [x + 70 * s, y - 50 * s], [x, y - 50 * s]], '#8a6a44', { lw: 1.6 }); poly(g, [[x, y - 50 * s], [x + 70 * s, y - 50 * s], [x + 60 * s, y - 64 * s], [x + 10 * s, y - 64 * s]], '#a07a50', { lw: 1.4 }); line(g, [[x, y - 25 * s], [x + 70 * s, y - 25 * s]], '#5a4028', 2 * s); txt(g, 'TIN', x + 35 * s, y - 12 * s, 10 * s, '#3a2410', { bold: true }); }

// The factory floor from high in the rafters, three-quarter view: the back wall with its windows
// and shelves, rows of benches with toys on them, crates, shafts and belts, lamps, the workers.
// frozen: everyone has stopped and turned to John, who stands at his bench; the tin soldier on the floor.
function drawFloorHigh(g, t, frozen) {
  g.fillStyle = '#4a3a2c'; g.fillRect(0, 0, 1280, 720);
  // the back wall: brick, tall rectangular windows, shelves of finished toys
  g.fillStyle = lin(g, 0, 0, 0, 230, [[0, '#5a3426'], [1, '#6e4232']]); g.fillRect(0, 0, 1280, 230);
  for (let r = 0; r < 12; r++) line(g, [[0, r * 19], [1280, r * 19]], 'rgba(30,14,8,0.25)', 1, 0.2);
  for (let i = 0; i < 5; i++) { const x = 60 + i * 250; irect(g, x, 20, 110, 130, '#9aa4a0', { lw: 2.4 }); for (let q = 1; q < 3; q++) line(g, [[x + q * 36.7, 20], [x + q * 36.7, 150]], '#2a2622', 2); for (let q = 1; q < 4; q++) line(g, [[x, 20 + q * 32.5], [x + 110, 20 + q * 32.5]], '#2a2622', 2); }
  shelfOfToys(g, 190, 200, 160); shelfOfToys(g, 690, 200, 160);
  // the floor
  poly(g, [[-40, 230], [1320, 230], [1320, 760], [-40, 760]], lin(g, 0, 230, 0, 720, [[0, '#5a4430'], [1, '#7a5a3a']]), { lw: 0, stroke: false });
  for (let i = 0; i <= 18; i++) line(g, [[640 + (i - 9) * 70, 230], [640 + (i - 9) * 170, 760]], 'rgba(20,12,6,0.35)', 1.4, 0.3);
  // the line shaft and belts down to the lathes
  line(g, [[0, 250], [1280, 236]], '#1a1410', 8);
  const jx = 1050, jy = 300;
  const rows = [[300, 0.55], [410, 0.72], [540, 0.92], [690, 1.15]];
  rows.forEach(([y, s], r) => {
    [[-1, 330], [1, 330]].forEach(([side, w], b) => {
      const cx = 640 + side * (190 + r * 40) * (s + 0.3); if (r === 0 && side === 1) return; // John's corner stands there
      // two workers behind each bench
      [-0.28, 0.28].forEach((o, wi) => {
        const wx = cx + o * w * s, wy = y - 4 * s, id = r * 4 + b * 2 + wi, flip = frozen ? wx > jx : (id % 2 === 1);
        drawWorker(g, wx, wy, t, { s: s * 0.95, flip, ph: id, coat: ['#4a4a52', '#5a4a3a', '#3a4a4a', '#4a3e36'][id % 4], apron: '#b8a888', alarm: frozen });
      });
      benchBox(g, cx, y, w, s); benchToys(g, cx, y, w, s, r + b);
    });
    if (r === 1) { crate(g, 40, y + 40, s); crate(g, 70, y + 4, s); crate(g, 1180, y + 44, s); }
    if (r < 3) { const lx = 640 + (r - 1) * 380; line(g, [[lx, 0], [lx, y - 220 * s]], '#1a1a1a', 2); poly(g, [[lx - 22 * s, y - 220 * s], [lx + 22 * s, y - 220 * s], [lx + 30 * s, y - 196 * s], [lx - 30 * s, y - 196 * s]], '#3a4a3a', { lw: 1.4 }); }
  });
  // John's corner: his bench, his lamp, and John, standing now if frozen
  benchBox(g, jx + 40, jy, 200, 0.6, '#6a4428', '#4a2e1a'); benchToys(g, jx + 40, jy, 200, 0.6, 0);
  if (frozen) { g.save(); g.translate(jx - 70, jy + 40); g.scale(0.62, 0.62); drawJohnStanding(g, 0, 0, t, { noCig: true }); g.restore(); poly(g, [[jx - 20, jy + 40], [jx + 10, jy + 18], [jx + 18, jy + 26], [jx - 12, jy + 48]], '#5a3b24', { lw: 1.4 }); }
  else { g.save(); g.translate(jx - 40, jy + 30); g.scale(0.4, 0.4); drawJohnSeated(g, 0, 0, t); g.restore(); }
  dark(g, frozen ? 0.28 : 0.22, [[jx, jy - 40, 200, 0.55], [640, 360, 700, 0.08, '200,200,190']]);
  if (frozen) { g.save(); g.translate(560, 650); g.rotate(-1.4); drawSoldier(g, 0, 0, 1.4, t * 9); g.restore(); }
  else for (let i = 0; i < 3; i++) { g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(190,200,190,0.08)'; g.beginPath(); const x = 60 + i * 500; g.moveTo(x, 150); g.lineTo(x + 110, 150); g.lineTo(x + 330, 720); g.lineTo(x + 120, 720); g.closePath(); g.fill(); g.restore(); }
}
// A man from the chest up, leaning in from the frame's edge: (x, y) is where his body leaves the
// frame, rot leans him in. The face is drawn upright for him (drawLeaningFace turned over).
function bust(g, x, y, rot, skin, cap, coat, i) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1.25, 1.25);
  shape(g, [[-170, 40], [-150, -120], [-70, -200], [70, -200], [150, -120], [170, 40]], coat, { lw: 3 }); // shoulders
  shape(g, [[-40, -200], [40, -200], [30, -150], [-30, -150]], '#e2d8c0', { lw: 2 }); // the collar
  g.translate(0, -340); g.rotate(Math.PI); drawLeaningFace(g, skin, cap, i);
  g.restore();
}
// A worker's face leaning down into John's view from the floor: brows, eyes, nose, mouth calling.
function drawLeaningFace(g, skin, cap, i) {
  iell(g, -104, 6, 18, 30, skin, { lw: 2.4 }); iell(g, 104, 6, 18, 30, skin, { lw: 2.4 }); // ears
  iell(g, 0, 0, 104, 132, skin, { lw: 3 });
  g.save(); g.globalAlpha = 0.25; iell(g, -60, -30, 30, 40, '#a06a4a', { lw: 0, stroke: false }); iell(g, 60, -30, 30, 40, '#a06a4a', { lw: 0, stroke: false }); g.restore(); // flushed cheeks
  if (i % 2 === 0) dabs(g, -70, -120, 140, 70, '#5a4a3a', 60, 4, 0.45); // stubble
  shape(g, [[-100, 40], [-96, 90], [-80, 60]], '#4a3a2a', { lw: 1.6 }); shape(g, [[100, 40], [96, 90], [80, 60]], '#4a3a2a', { lw: 1.6 }); // hair under the cap
  shape(g, [[-128, 50], [-110, 126], [110, 126], [128, 50], [60, 70], [-60, 70]], cap, { lw: 3 }); // the cap, seen from below its brim
  line(g, [[-70, 30], [-24, 22]], '#4a3a2a', 7); line(g, [[24, 22], [70, 30]], '#4a3a2a', 7); // brows, worried
  iell(g, -44, 0, 15, 10, '#f0ece0', { lw: 2 }); iell(g, 44, 0, 15, 10, '#f0ece0', { lw: 2 }); iell(g, -44, 0, 6, 6, INK, { lw: 0 }); iell(g, 44, 0, 6, 6, INK, { lw: 0 });
  shape(g, [[-10, -10], [12, -10], [18, -50], [-16, -50]], PAL.skinDark, { lw: 2 }); // the nose, from below
  if (i % 2) shape(g, [[-40, -64], [0, -56], [40, -64], [24, -74], [-24, -74]], '#5a4a3a', { lw: 2 }); // a moustache
  iell(g, 0, -84, 24, 14, '#5a2a1a', { lw: 2 }); // a mouth, calling his name
}

const SHOT_DRAW = {
  cold(g, t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720);
    const strike = Math.max(0, t - 1.6), flare = strike > 0 ? Math.min(1, strike * 6) * (1 - Math.min(0.5, strike * 0.2)) : 0;
    if (flare <= 0) return;
    const flick = 1 + Math.sin(t * 23) * 0.05 + Math.sin(t * 7) * 0.04, mx = 800, my = 600;
    g.save(); g.globalAlpha = Math.min(1, strike * 2.5);
    // his head in profile, facing the match: cap, brow, the big nose, moustache, stubble
    shape(g, [[300, 720], [330, 560], [300, 420], [320, 300], [400, 230], [520, 220], [600, 250], [612, 280], [700, 372], [690, 392], [640, 396], [660, 420], [612, 440], [626, 470], [606, 540], [520, 580], [470, 720]], PAL.skin, { lw: 3 });
    dabs(g, 470, 430, 160, 130, '#6b5a4c', 120, 5, 0.6);
    shape(g, [[600, 404], [668, 414], [652, 440], [596, 436]], '#9b958a', { lw: 2 }); // moustache
    iell(g, 430, 360, 30, 48, PAL.skinDark, { lw: 2.4 }); // ear
    line(g, [[560, 300], [590, 296]], INK, 4); line(g, [[548, 280], [600, 268]], '#5a4a40', 7); // eye, brow
    for (let i = 0; i < 3; i++) line(g, [[600, 310 + i * 10], [570, 318 + i * 12]], 'rgba(90,60,40,0.6)', 2);
    shape(g, [[280, 300], [300, 160], [420, 100], [560, 110], [620, 170], [720, 196], [700, 220], [600, 236], [420, 240], [300, 320]], '#2e2722', { lw: 3 }); // the cap
    line(g, [[640, 452], [760, 486]], PAL.white, 12, 0.2); // the cigarette
    g.restore();
    // only what the match lights stays: the rest falls back into the dark
    g.save(); g.fillStyle = rad(g, mx, my, 60, 560 * flick, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0.97)']]); g.fillRect(0, 0, 1280, 720); g.restore();
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = rad(g, mx, my, 0, 520, [[0, `rgba(255,160,70,${0.9 * flare})`], [1, 'rgba(255,160,70,0)']]); g.fillRect(0, 0, 1280, 720); g.restore();
    line(g, [[860, 720], [mx + 6, my + 30]], '#c9a87a', 6, 0.2); // the match
    iell(g, mx, my, 11 * flick, 20 * flick, `rgba(255,220,140,${0.9 * flare})`, { lw: 0, stroke: false });
    iell(g, mx, my - 4, 4, 9, `rgba(255,255,230,${flare})`, { lw: 0, stroke: false });
    if (strike > 0.8) iell(g, 762, 487, 6, 5, '#ff7a2a', { lw: 0.8, stroke: '#7a2a10' });
    if (strike > 1.2) drawSmoke(g, 770, 470, t, 14, 2.2);
    letterbox(g);
  },
  title(g, t) {
    g.fillStyle = '#0a0806'; g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 5; i++) drawSmoke(g, 300 + i * 170, 900, t + i * 1.3, 18, 3.4);
    const a = Math.min(1, Math.max(0, (t - 0.8) / 1.2)) * Math.min(1, Math.max(0, (5 - t) / 1));
    g.save(); g.globalAlpha = a; soft(g, (1 - a) * 8, () => txt(g, 'John Todo List', 640, 340, 92, PAL.paleOchre)); txt(g, 'Chapter One: The List', 640, 420, 28, '#a89878', { italic: true }); g.restore();
    letterbox(g);
  },
  quote(g, t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720);
    const a = Math.min(1, t / 0.8, (5 - t) / 0.6);
    g.save(); g.globalAlpha = Math.max(0, a); drawPlate(g, 640, 360, 820, 200);
    txt(g, '"Memento Mori."', 640, 320, 40, PAL.cream, { italic: true }); txt(g, '"Remember that you must die."', 640, 370, 30, PAL.paleOchre, { italic: true });
    txt(g, '— Ancient Roman philosophical tradition', 900, 430, 16, '#cdbb94', { align: 'right', italic: true }); g.restore();
  },
  outside(g, t) {
    const k = t / 7;
    g.save(); g.translate(640, 360); g.scale(1.08 - k * 0.06, 1.08 - k * 0.06); g.translate(-640, -360 - k * 20 + 50);
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#6e7472'], [0.55, '#a8a290'], [1, '#4a4034']]); g.fillRect(-40, -100, 1360, 860);
    // the town behind: far rooftops, chimneys, a church spire, a clock tower
    cityRow(g, 300, 0.55, '#8a8c86', 11, 1.0);
    g.save(); g.translate(1010, 300); poly(g, [[-26, 0], [-26, -120], [0, -190], [26, -120], [26, 0]], '#7e807a', { lw: 1.4 }); iell(g, 0, -100, 9, 9, '#b8b6a8', { lw: 1 }); g.restore(); // the spire
    g.save(); g.translate(120, 300); irect(g, -22, -150, 44, 150, '#7e807a', { lw: 1.4 }); iell(g, 0, -120, 14, 14, '#d8d2b8', { lw: 1.2 }); poly(g, [[-26, -150], [0, -176], [26, -150]], '#6e706a', { lw: 1.2 }); g.restore(); // the clock tower
    cityRow(g, 360, 0.8, '#6a645a', 7, 2.0);
    poly(g, [[-40, 360], [1320, 360], [1320, 760], [-40, 760]], lin(g, 0, 360, 0, 720, [[0, '#6a6258'], [1, '#4a4238']]), { lw: 0, stroke: false }); // the yard and the pavements
    // the factory: three storeys of brick, two-point perspective, rectangular many-paned windows
    const F = { tl: [180, 220], tr: [700, 160], br: [700, 560], bl: [180, 520] }, S = { tl: [700, 160], tr: [1120, 240], br: [1120, 500], bl: [700, 560] };
    face(g, F, '#7a3e2a'); face(g, S, '#5a2c1e');
    brickLines(g, F, 22); brickLines(g, S, 16);
    for (let f = 0; f < 3; f++) for (let c = 0; c < 6; c++) if (!(f === 2 && (c === 1 || c === 2))) faceWindow(g, F, (c + 0.18) / 6, (c + 0.82) / 6, 0.1 + f * 0.27, 0.3 + f * 0.27, (f === 1 && c === 5));
    for (let f = 0; f < 3; f++) for (let c = 0; c < 5; c++) faceWindow(g, S, (c + 0.2) / 5, (c + 0.8) / 5, 0.1 + f * 0.27, 0.3 + f * 0.27, false);
    // string courses between storeys
    for (let f = 1; f < 3; f++) { const v = 0.05 + f * 0.27; line(g, [facePt(F, 0, v), facePt(F, 1, v)], '#5a2a1c', 4, 0.2); line(g, [facePt(S, 0, v), facePt(S, 1, v)], '#401e14', 3, 0.2); }
    // the roof: a low pitched slate roof, and the square brick chimney
    poly(g, [[880, 200], [880, 40], [930, 36], [930, 200]], '#6a3424', { lw: 2.6 }); irect(g, 872, 30, 66, 14, '#4a2418', { lw: 2 });
    poly(g, [[170, 222], [700, 160], [1130, 240], [960, 196], [700, 128], [330, 170]], '#3a3a40', { lw: 2.4 });
    drawSmoke(g, 905, 34, t, 22, 3);
    // the gate and its sign
    poly(g, [[320, 512], [320, 420], [430, 412], [430, 520]], '#2e241c', { lw: 2.4 }); line(g, [[375, 416], [375, 516]], '#1a140e', 2);
    poly(g, [[300, 404], [450, 394], [450, 370], [300, 380]], '#e6d6ad', { lw: 2 }); txt(g, 'ST. AUBIN TOY WORKS', 375, 388, 11, '#3a2410', { bold: true, rot: -0.07 });
    // the street: cobbles, a gas lamp, puddles, workers going in under umbrellas
    poly(g, [[-40, 760], [280, 540], [480, 548], [980, 760]], '#4a4036', { lw: 2 });
    for (let i = 0; i < 70; i++) { const u = hash(i * 1.3), v = hash(i * 2.7), y = 560 + v * 200, x = 280 - (y - 540) * 1.45 + u * (200 + (y - 540) * 2.6); iell(g, x, y, 6 + v * 8, 3 + v * 3, 'rgba(30,26,22,0.35)', { lw: 0, stroke: false }); }
    for (let i = 0; i < 4; i++) iell(g, 200 + i * 130, 650 + (i % 2) * 40, 50, 9, 'rgba(190,200,200,0.35)', { lw: 1 });
    line(g, [[880, 720], [880, 470]], '#1e1a18', 6); poly(g, [[862, 470], [898, 470], [892, 440], [868, 440]], 'rgba(255,214,140,0.85)', { lw: 1.6 });
    for (let i = 0; i < 6; i++) {
      const p = ((t * 0.08 + i * 0.17) % 1), x = 120 + p * 250 + i * 10, y = 720 - p * 190, sc = 1.2 - p * 0.75;
      g.save(); g.translate(x, y); g.scale(sc, sc);
      line(g, [[-6, -50], [-8, 0]], '#1e1a18', 6); line(g, [[6, -50], [8, 0]], '#1e1a18', 6);
      shape(g, [[-14, -50], [-12, -112], [12, -112], [14, -50]], '#2a2420', { lw: 1.4 });
      iell(g, 0, -122, 9, 11, '#c99a76', { lw: 1.2 });
      shape(g, [[-40, -128], [0, -156], [40, -128], [20, -132], [0, -130], [-20, -132]], '#14100e', { lw: 1.4 }); line(g, [[0, -156], [4, -100]], '#14100e', 2);
      g.restore();
    }
    g.restore();
    drawRain(g, 0, 0, 1280, 720, t, 260, 'rgba(210,220,225,0.35)');
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(120,130,140,0.3)'; g.fillRect(0, 0, 1280, 720); g.restore();
    letterbox(g);
  },
  rafters(g, t) {
    const k = t / 7;
    g.save(); g.translate(640, 380); g.scale(1.04 + k * 0.05, 1.04 + k * 0.05); g.translate(-640, -380);
    drawFloorHigh(g, t, false);
    g.restore();
    // beams passing close above the camera, soft
    soft(g, 5, () => { const off = -k * 200; poly(g, [[-100, 120 + off * 0.2], [1400, -40 + off * 0.2], [1400, 40 + off * 0.2], [-100, 210 + off * 0.2]], '#140c06', { lw: 0, stroke: false }); });
    letterbox(g);
  },
  floor(g, t) {
    const k = t / 7;
    g.save(); g.translate(640, 520); g.scale(1 + k * 0.12, 1 + k * 0.12); g.translate(-640, -520);
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#2a1e16'], [0.7, '#3a2a1e'], [1, '#2a1c12']]); g.fillRect(0, 0, 1280, 720);
    // the ceiling, seen from low: beams converging high
    for (let i = 0; i < 6; i++) line(g, [[-200 + i * 340, 0], [600 + i * 16, 380]], 'rgba(10,6,3,0.7)', 18 - i, 0.4);
    // the floor: boards rushing to a low horizon
    poly(g, [[-300, 720], [580, 470], [700, 470], [1580, 720]], lin(g, 0, 470, 0, 720, [[0, '#3a2a1c'], [1, '#6a4a2e']]), { lw: 0, stroke: false });
    for (let i = 0; i <= 16; i++) line(g, [[580 + i * 7.5, 470], [-300 + i * 117, 720]], 'rgba(20,12,6,0.5)', 1.4, 0.3);
    // bench legs down the aisle
    for (let i = 0; i < 5; i++) { const s = 1 - i * 0.18, x = 400 - i * 40, x2 = 880 + i * 40; [x, x2].forEach(xx => { line(g, [[xx, 470 - 120 * s], [xx, 470 + 60 * s]], '#2a1a10', 12 * s); }); line(g, [[x - 20, 470 - 120 * s], [x + 60, 470 - 124 * s]], '#4a2e1a', 16 * s); line(g, [[x2 - 60, 470 - 124 * s], [x2 + 20, 470 - 120 * s]], '#4a2e1a', 16 * s); }
    // John, far away, hunched in his light
    g.save(); g.translate(660, 470); g.scale(0.22, 0.22); drawJohnSeated(g, 0, 0, t); g.restore();
    g.restore();
    dark(g, 0.25, [[680, 420, 160, 0.6]]);
    // the horse in the foreground, soft; boots crossing the lens
    soft(g, 6, () => { g.save(); g.translate(1060, 640); g.scale(2.2, 2.2); shape(g, [[-80, -20], [60, -24], [90, -70], [110, -60], [96, -24], [80, 0], [-80, 0]], '#b07a4a', { lw: 2 }); line(g, [[-70, 0], [-72, 40]], '#b07a4a', 9); line(g, [[40, 0], [42, 40]], '#b07a4a', 9); g.restore(); });
    const bx = -300 + ((t * 300) % 2200);
    soft(g, 10, () => { shape(g, [[bx, 720], [bx + 40, 420], [bx + 150, 400], [bx + 170, 720]], '#1a1410', { lw: 0, stroke: false }); shape(g, [[bx - 30, 720], [bx + 200, 720], [bx + 210, 660], [bx - 20, 650]], '#0e0a08', { lw: 0, stroke: false }); });
    letterbox(g);
  },
  shoulder(g, t) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#3a2a1e'], [1, '#22160e']]); g.fillRect(0, 0, 1280, 720);
    // the wall behind, a little soft: calendar, bottle, a photo face down
    soft(g, 2, () => {
      woodGrain(g, 0, 0, 1280, 460, '#000', 0.15);
      irect(g, 760, 90, 170, 210, PAL.paper, { lw: 2 }); irect(g, 760, 90, 170, 36, '#8a3a2a', { lw: 1.6 }); txt(g, 'MARCH', 845, 108, 20, PAL.cream, { bold: true });
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { const x = 772 + c * 26, y = 140 + r * 30; line(g, [[x, y], [x + 16, y + 18]], '#8a2a1a', 2, 0.3); line(g, [[x + 16, y], [x, y + 18]], '#8a2a1a', 2, 0.3); }
      shape(g, [[1040, 400], [1080, 400], [1080, 300], [1068, 270], [1068, 230], [1052, 230], [1052, 270], [1040, 300]], 'rgba(70,90,60,0.9)', { lw: 2 });
      irect(g, 960, 380, 70, 20, '#3a2414', { lw: 1.6 }); // the photograph, face down
    });
    // the bench and his hands, sharp
    poly(g, [[0, 460], [1280, 430], [1280, 720], [0, 720]], lin(g, 0, 430, 0, 720, [[0, '#7a4e2e'], [1, '#4a2e1a']]), { lw: 2.6 });
    woodGrain(g, 0, 440, 1280, 280, '#000', 0.2);
    const sh = Math.sin(t * 31) * 2 + Math.sin(t * 17) * 1.5;
    g.save(); g.translate(720 + sh, 470);
    shape(g, [[-90, -10], [70, -16], [110, -80], [134, -70], [116, -20], [100, 10], [-90, 10]], '#c08a5a', { lw: 2.4 }); // the horse
    line(g, [[-70, 10], [-72, 60]], '#c08a5a', 12); line(g, [[60, 10], [62, 40]], '#c08a5a', 12);
    g.restore();
    g.save(); g.translate(sh, sh * 0.5);
    shape(g, [[460, 720], [520, 560], [600, 500], [660, 500], [680, 540], [620, 600], [600, 720]], PAL.skin, { lw: 2.6 }); // left hand holding
    shape(g, [[880, 720], [860, 560], [820, 480], [780, 470], [770, 500], [800, 560], [780, 720]], PAL.skin, { lw: 2.6 }); // right hand, the chisel
    line(g, [[800, 480], [760, 420]], '#9a9a90', 7); line(g, [[830, 520], [800, 480]], '#6a4a2a', 14);
    dabs(g, 470, 520, 400, 200, '#6a4a3a', 30, 8, 0.3);
    g.restore();
    for (let i = 0; i < 10; i++) shape(g, [[740 + i * 14, 470], [750 + i * 14, 462], [754 + i * 14, 470]], '#d8b088', { lw: 1 });
    dark(g, 0.18, [[760, 420, 520, 0.35]]);
    // his shoulder and cap, close and soft
    soft(g, 12, () => { shape(g, [[-60, 720], [-40, 300], [120, 160], [300, 160], [380, 300], [400, 720]], '#2a221c', { lw: 0, stroke: false }); shape(g, [[60, 220], [90, 100], [250, 60], [380, 110], [420, 200], [300, 180]], '#3a322c', { lw: 0, stroke: false }); });
    drawSmoke(g, 360, 200, t, 10, 1.6);
    letterbox(g);
  },
  eye(g, t) {
    g.fillStyle = '#1a120c'; g.fillRect(0, 0, 1280, 720);
    g.save(); g.translate(0, Math.sin(t * 0.6) * 6);
    shape(g, [[-40, 760], [-40, 120], [400, 60], [900, 120], [1180, 300], [1240, 520], [1100, 760]], PAL.skin, { lw: 3 });
    dabs(g, 100, 420, 900, 300, '#6b5a4c', 260, 6, 0.55); // grey stubble
    for (let i = 0; i < 4; i++) line(g, [[880 + i * 8, 300 + i * 22], [980 + i * 18, 330 + i * 26]], 'rgba(90,60,40,0.55)', 2, 0.6); // crow's feet
    line(g, [[400, 250], [520, 228], [680, 250]], '#5a4a40', 18, 1); // the brow
    const blink = (t % 3.6) < 0.18 ? 0.15 : 1;
    shape(g, [[440, 320], [520, 300 + (1 - blink) * 20], [620, 318], [560, 340], [480, 340]], '#efe6d0', { lw: 2.4 });
    if (blink > 0.5) { iell(g, 528, 322, 22, 18, '#4a3a2a', { lw: 1.6 }); iell(g, 528, 322, 9, 9, INK, { lw: 0.6 }); iell(g, 520, 316, 4, 4, '#fff', { lw: 0, stroke: false }); }
    line(g, [[430, 318], [520, 296 + (1 - blink) * 22], [630, 316]], INK, 4, 0.6);
    for (let i = 0; i < 3; i++) line(g, [[460, 360 + i * 16], [600, 366 + i * 16]], 'rgba(90,60,40,0.4)', 1.6, 0.6); // the bags under it
    g.restore();
    shape(g, [[-40, -40], [1320, -40], [1320, 150], [900, 190], [300, 200], [-40, 170]], '#3a322c', { lw: 3 }); // the cap's brim
    dark(g, 0.35, [[700, 300, 600, 0.3]]);
    drawSmoke(g, 1100 - t * 60, 520, t, 16, 2.6);
    letterbox(g);
  },
  hand(g, t) {
    g.fillStyle = '#140e0a'; g.fillRect(0, 0, 1280, 720);
    const sh = Math.sin(t * 40) * 3, down = Math.min(1, t / 1.2) * 60;
    g.save(); g.translate(sh, down);
    shape(g, [[300, 760], [380, 460], [460, 380], [760, 360], [880, 420], [900, 520], [760, 600], [700, 760]], '#ece8da', { lw: 2.6 }); // the handkerchief
    dabs(g, 560, 420, 160, 90, '#8a1010', 18, 10, 0.85);
    iell(g, 610, 452, 26, 16, '#7a0e0e', { lw: 0, stroke: false });
    shape(g, [[700, 760], [760, 560], [860, 470], [960, 470], [1000, 520], [920, 600], [900, 760]], PAL.skin, { lw: 2.6 }); // his fingers over it
    for (let i = 0; i < 3; i++) line(g, [[880 + i * 30, 500], [930 + i * 26, 470]], 'rgba(90,60,40,0.5)', 2);
    g.restore();
    dark(g, 0.4, [[640, 440, 500, 0.3]]);
    letterbox(g);
  },
  tilt(g, t) {
    const slow = t / 4, ang = -0.16 - slow * 0.08;
    g.fillStyle = '#22160e'; g.fillRect(0, 0, 1280, 720);
    g.save(); g.translate(640, 360); g.rotate(ang); g.translate(-640, -360);
    g.drawImage(roomBg('factory', BG_SCALE), -200, -100, 1680, 945);
    const fall = Math.min(1, slow * 1.1);
    g.save(); g.translate(520, 900); g.rotate(fall * 0.5); g.scale(2.6, 2.6); drawJohnSeated(g, 0, 0, t, { noCig: true, cough: 0.4 }); g.restore();
    g.save(); g.translate(960, 300 + slow * 60); g.rotate(slow * 1.2); g.scale(1.3, 1.3);
    shape(g, [[-80, -20], [60, -24], [90, -70], [110, -60], [96, -24], [80, 0], [-80, 0]], '#c08a5a', { lw: 2.4 }); line(g, [[-70, 0], [-72, 40]], '#c08a5a', 9); line(g, [[40, 0], [42, 40]], '#c08a5a', 9);
    g.restore();
    g.restore();
    g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${0.3 + slow * 0.5})`; g.fillRect(0, 0, 1280, 720); g.restore();
    dark(g, 0.3 + slow * 0.2, [[600, 360, 500, 0.2]]);
    letterbox(g);
  },
  drop(g, t) {
    g.fillStyle = '#1e140c'; g.fillRect(0, 0, 1280, 720);
    poly(g, [[-300, 720], [560, 250], [720, 250], [1580, 720]], lin(g, 0, 250, 0, 720, [[0, '#4a3420'], [1, '#8a6440']]), { lw: 0, stroke: false });
    for (let i = 0; i <= 14; i++) line(g, [[560 + i * 11.4, 250], [-300 + i * 134, 720]], 'rgba(20,12,6,0.5)', 1.6, 0.3);
    // his hand falls to the boards behind, out of focus
    const hf = Math.min(1, Math.max(0, (t - 1.2) / 0.8));
    soft(g, 9, () => shape(g, [[640, 250 + hf * 120], [740, 240 + hf * 120], [800, 300 + hf * 120], [720, 340 + hf * 120], [630, 320 + hf * 120]], PAL.skin, { lw: 0, stroke: false }));
    // the horse lands, sharp
    const land = Math.min(1, t / 0.6), bounce = land < 1 ? (1 - land) * 160 : Math.abs(Math.sin((t - 0.6) * 9)) * 14 * Math.max(0, 1 - (t - 0.6) * 1.5);
    g.save(); g.translate(560, 560 - bounce); g.rotate(Math.PI * 0.9 + (1 - land) * 0.6); g.scale(1.8, 1.8);
    shape(g, [[-80, -20], [60, -24], [90, -70], [110, -60], [96, -24], [80, 0], [-80, 0]], '#c08a5a', { lw: 2.2 }); line(g, [[-70, 0], [-72, 40]], '#c08a5a', 9); line(g, [[40, 0], [42, 40]], '#c08a5a', 9);
    g.restore();
    line(g, [[820, 640], [1040, 600]], '#9a9a90', 8); line(g, [[1040, 600], [1120, 586]], '#6a4a2a', 16);
    for (let i = 0; i < 18; i++) { const a = hash(i) * 6.28, r = Math.min(1, t * 1.5) * (40 + hash(i * 3) * 120); iell(g, 560 + Math.cos(a) * r, 600 + Math.sin(a) * r * 0.3 - r * 0.2, 2, 2, 'rgba(220,200,170,0.5)', { lw: 0, stroke: false }); }
    g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,0.5)'; g.fillRect(0, 0, 1280, 720); g.restore();
    dark(g, 0.15, [[560, 560, 400, 0.3]]);
    letterbox(g);
  },
  pov(g, t) {
    const k = t / 6, sway = Math.sin(t * 0.8) * 0.04;
    const frame = (dx, dy, alpha) => {
      g.save(); g.globalAlpha = alpha; g.translate(640 + dx, 360 + dy); g.rotate(0.12 + sway + k * 0.08); g.translate(-640, -360);
      // the ceiling above him: planks, two beams, a hanging lamp
      g.fillStyle = '#4a3a2a'; g.fillRect(-300, -300, 1880, 1320);
      for (let i = -6; i < 16; i++) line(g, [[-300, i * 60], [1580, i * 60 - 80]], 'rgba(20,12,6,0.35)', 2, 0.3);
      line(g, [[-300, 180], [1580, 100]], '#22160e', 44, 0.3); line(g, [[-300, 560], [1580, 480]], '#22160e', 44, 0.3);
      line(g, [[640, 130], [640, 300]], '#1a1a1a', 3); poly(g, [[600, 300], [680, 300], [700, 340], [580, 340]], '#3a4a3a', { lw: 2 }); iell(g, 640, 342, 36, 10, 'rgba(255,230,170,0.85)', { lw: 1 });
      // the men leaning over him from either side
      const lean = i => Math.min(1, Math.max(0, (t - i * 0.4) / 1.4));
      bust(g, 20, 760, 0.8 - (1 - lean(0)) * 0.5, '#d8b896', '#3a3430', '#4a4a52', 0);
      bust(g, 1260, 760, -0.8 + (1 - lean(1)) * 0.5, '#c99a76', '#4a4038', '#5a4a3a', 1);
      g.restore();
    };
    soft(g, 1 + k * 2.5, () => { frame(0, 0, 1); frame(14, 6, 0.25); });
    g.save(); g.fillStyle = rad(g, 640, 360, 380 - k * 200, 900 - k * 280, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]); g.fillRect(0, 0, 1280, 720); g.restore();
    g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,0.3)'; g.fillRect(0, 0, 1280, 720); g.restore();
    if (t > 1 && t < 3) shotText(g, 'A worker:  John? John!', 600); else if (t > 3.2 && t < 5.4) shotText(g, 'A worker:  Fetch the doctor! Quick!', 600);
    letterbox(g);
  },
  white(g, t) {
    const k = Math.min(1, t / 1.6);
    SHOT_DRAW.pov(g, 6);
    g.fillStyle = `rgba(245,240,230,${k})`; g.fillRect(0, 0, 1280, 720);
  },
};

// ---- The quarrel's people ------------------------------------------------------------------
function drawForeman(g, x, y, t, o = {}) { // waistcoat, watch chain, bowler hat. (x, y) the feet
  g.save(); g.translate(x, y); g.scale(o.s || 1, o.s || 1); if (o.flip) g.scale(-1, 1);
  line(g, [[-14, -90], [-18, 0]], '#2a2622', 16); line(g, [[14, -90], [18, 0]], '#2a2622', 16);
  shape(g, [[-44, -90], [-40, -220], [-20, -250], [24, -250], [44, -220], [48, -90]], '#4a4038', { lw: 2.4 });
  shape(g, [[-26, -230], [26, -230], [30, -110], [-30, -110]], '#6a3a2a', { lw: 2 }); // the waistcoat
  line(g, [[-20, -170], [0, -160], [20, -170]], PAL.brassHi, 2); // the watch chain
  line(g, [[40, -236], [70, -170], [60, -120]], '#4a4038', 16, 0.3);
  iell(g, 0, -278, 28, 32, '#d8a886', { lw: 2.2 });
  shape(g, [[-26, -264], [0, -256], [26, -264], [18, -252], [0, -248], [-18, -252]], '#3a2a1e', { lw: 1.6 }); // moustache
  line(g, [[-14, -284], [-6, -284]], INK, 2); line(g, [[6, -284], [14, -284]], INK, 2);
  shape(g, [[-40, -300], [40, -300], [30, -306], [24, -330], [-24, -330], [-30, -306]], '#1e1a18', { lw: 2 }); // bowler
  g.restore();
}
function drawCrookedHorse(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  shape(g, [[-60, -14], [40, -22], [62, -54], [80, -40], [70, -16], [56, 2], [-60, 2]], '#d8b088', { lw: 2 });
  line(g, [[-50, 2], [-56, 34]], '#d8b088', 8); line(g, [[-28, 2], [-24, 22]], '#d8b088', 8); line(g, [[30, 2], [34, 38]], '#d8b088', 8); line(g, [[48, 2], [44, 26]], '#d8b088', 8);
  g.restore();
}
function drawBoyFace(g, x, y, k, down) { // the apprentice, close: freckles, a cap too big for him
  g.save(); g.translate(x, y); g.scale(k, k);
  shape(g, [[-80, 130], [-60, 70], [-20, 56], [24, 56], [66, 70], [86, 130]], '#5a5a62', { lw: 2 });
  iell(g, 0, 0, 46, 54, '#e8c4a0', { lw: 2.4 });
  for (let i = 0; i < 12; i++) iell(g, -24 + hash(i) * 48, 4 + hash(i * 3) * 18, 1.6, 1.6, '#b0704a', { lw: 0, stroke: false });
  const ey = -6 + down * 8;
  iell(g, -18, ey, 6, 4 + (1 - down) * 2, '#fff', { lw: 1.2 }); iell(g, 18, ey, 6, 4 + (1 - down) * 2, '#fff', { lw: 1.2 });
  iell(g, -18, ey + down * 2, 3, 3, INK, { lw: 0 }); iell(g, 18, ey + down * 2, 3, 3, INK, { lw: 0 });
  line(g, [[-28, -20 + down * 2], [-10, -24 + down * 6]], '#6a4a2a', 3); line(g, [[10, -24 + down * 6], [28, -20 + down * 2]], '#6a4a2a', 3);
  line(g, [[-12, 32], [0, 30 - down * 4], [12, 32]], '#8a3a2a', 2.2);
  shape(g, [[-56, -16], [-50, -46], [-10, -62], [40, -54], [62, -26], [80, -18], [40, -24], [-30, -24]], '#4a4a52', { lw: 2 });
  g.restore();
}
function drawAngryFace(g, x, y, k, heat, t, calm = false) { // old John, close, in a rage: brows down, mouth open
  g.save(); g.translate(x, y); g.scale(k, k);
  shape(g, [[-90, 120], [-70, 60], [-20, 46], [30, 46], [76, 60], [96, 120]], '#3b3029', { lw: 2 });
  iell(g, 0, -10, 52, 62, PAL.skin, { lw: 2.4 });
  g.save(); g.globalAlpha = 0.5 * heat; iell(g, 0, -10, 50, 60, '#c0402a', { lw: 0, stroke: false }); g.restore();
  dabs(g, -36, 10, 72, 40, '#6b5a4c', 50, 3, 0.5);
  shape(g, [[-48, -30], [-40, -66], [0, -78], [40, -66], [50, -30], [30, -50], [-30, -50]], '#4a4038', { lw: 1.6 });
  line(g, [[-36, -36], [-8, -24]], '#3a2a20', 5); line(g, [[8, -24], [36, -36]], '#3a2a20', 5); // brows, down
  iell(g, -20, -16, 7, 4, '#fff', { lw: 1.2 }); iell(g, 20, -16, 7, 4, '#fff', { lw: 1.2 }); iell(g, -20, -16, 3, 3, INK, { lw: 0 }); iell(g, 20, -16, 3, 3, INK, { lw: 0 });
  shape(g, [[-4, -18], [16, 16], [8, 24], [-8, 20]], PAL.skinDark, { lw: 2 });
  const open = 6 + Math.abs(Math.sin(t * 5)) * 8 * heat;
  if (calm) line(g, [[-14, 44], [0, 46], [14, 44]], '#6a3a2a', 2.4, 0.2); else iell(g, 0, 44, 16, open, '#3a1410', { lw: 2 });
  shape(g, [[-30, 30], [-14, 24], [0, 28], [14, 24], [30, 30], [20, 34], [0, 32], [-20, 34]], '#7d776c', { lw: 1.6 });
  if (!calm) for (let i = 0; i < 3; i++) iell(g, 36 + i * 6, -40 + i * 18 + (t * 20 % 30), 3, 5, 'rgba(220,235,240,0.7)', { lw: 0.6 }); // sweat
  g.restore();
}
function cornerBg(g) { g.drawImage(roomBg('factory', BG_SCALE), 860 * BG_SCALE, 160 * BG_SCALE, 420 * BG_SCALE, 236 * BG_SCALE, 0, 0, 1280, 720); }

Object.assign(SHOT_DRAW, {
  apprentice(g, t) {
    cornerBg(g); dark(g, 0.3, [[500, 300, 600, 0.35]]);
    g.save(); g.translate(300, 700); g.scale(1.3, 1.3); drawJohnSeated(g, 0, 0, t); g.restore();
    irect(g, 470, 600, 300, 30, '#6a4428', { lw: 3 }); irect(g, 480, 630, 280, 120, '#4a2e1a', { lw: 2.4 }); // his bench
    const step = Math.min(1, t / 1.2);
    drawWorker(g, 1180 - step * 160, 740, t, { s: 2.4, flip: true, run: step < 1, coat: '#5a5a62', apron: '#c8b898', cap: '#4a4a52' });
    drawCrookedHorse(g, 1080 - step * 160 - 120, 500, 1.2, Math.sin(t * 2) * 0.05);
    drawSmoke(g, 300 + 115 * 1.3, 700 - 162 * 1.3, t, 12);
    if (t > 1.4) shotText(g, 'Apprentice:  Mr. Smith? I made one. Like yours.', 600);
    letterbox(g);
  },
  verdict(g, t) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#3a2a1e'], [1, '#22160e']]); g.fillRect(0, 0, 1280, 720);
    soft(g, 6, () => { cornerBg(g); drawWorker(g, 900, 760, t, { s: 2, flip: true, coat: '#5a5a62', apron: '#c8b898' }); });
    poly(g, [[0, 520], [1280, 500], [1280, 720], [0, 720]], '#6a4428', { lw: 2.6 });
    irect(g, 980, 560, 220, 160, '#4a3020', { lw: 2.4 }); for (let i = 0; i < 14; i++) shape(g, [[990 + i * 14, 566], [1000 + i * 14, 556], [1004 + i * 14, 566]], '#d8b088', { lw: 1 }); // the shavings bin
    const drop = Math.max(0, (t - 1.8) / 0.7), x = 640 + drop * 440, y = 380 + drop * drop * 260;
    if (drop < 1.2) drawCrookedHorse(g, x, y, 2.2, drop * 1.4);
    if (drop < 0.3) { shape(g, [[500, 720], [540, 470], [600, 420], [660, 430], [640, 480], [600, 520], [580, 720]], PAL.skin, { lw: 2.4 }); }
    soft(g, 12, () => { shape(g, [[-60, 720], [-40, 300], [120, 160], [300, 160], [380, 300], [400, 720]], '#2a221c', { lw: 0, stroke: false }); shape(g, [[60, 220], [90, 100], [250, 60], [380, 110], [420, 200], [300, 180]], '#3a322c', { lw: 0, stroke: false }); });
    if (t > 1) shotText(g, 'John:  Legs are uneven. Firewood.', 600);
    letterbox(g);
  },
  hurt(g, t) {
    g.fillStyle = '#2a2018'; g.fillRect(0, 0, 1280, 720);
    soft(g, 8, () => { cornerBg(g); drawWorker(g, 230, 800, t, { s: 2.2, coat: '#3a4a4a' }); drawWorker(g, 400, 820, t, { s: 2.2, coat: '#5a4a3a', flip: true }); });
    dark(g, 0.3, []);
    drawBoyFace(g, 760, 420, 3.6, Math.min(1, t / 2));
    letterbox(g);
  },
  foreman(g, t) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#1e1610'], [1, '#3a2a1e']]); g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 6; i++) line(g, [[-200 + i * 340, 0], [600 + i * 16, 300]], 'rgba(10,6,3,0.7)', 18 - i, 0.4);
    drawForeman(g, 470, 1010, t, { s: 2.55 });
    // the bench top at the bottom of the frame, the tin soldier marching along it
    poly(g, [[560, 720], [700, 520], [1280, 520], [1280, 720]], lin(g, 0, 520, 0, 720, [[0, '#7a4e2e'], [1, '#4a2e1a']]), { lw: 3 });
    g.save(); g.translate(1000, 540); g.scale(1.6, 1.6); shape(g, [[-80, -20], [60, -24], [90, -70], [110, -60], [96, -24], [80, 0], [-80, 0]], '#c08a5a', { lw: 2 }); line(g, [[-70, 0], [-72, 40]], '#c08a5a', 9); g.restore();
    const wound = t > 1.6, sx = wound ? 820 + (t - 1.6) * 40 : 820;
    drawSoldier(g, sx, 600, 3, wound ? t * 9 : 0, { keyRot: wound ? -t * 6 : 0 });
    dark(g, 0.2, [[700, 300, 600, 0.25]]);
    if (t > 0.8) shotText(g, 'Foreman:  Orders from the owner, John. Tin from now on. No more wooden horses.', 600, 22);
    letterbox(g);
  },
  grip(g, t) {
    g.fillStyle = '#22160e'; g.fillRect(0, 0, 1280, 720);
    poly(g, [[0, 420], [1280, 400], [1280, 720], [0, 720]], lin(g, 0, 400, 0, 720, [[0, '#7a4e2e'], [1, '#4a2e1a']]), { lw: 2.6 });
    const sq = Math.min(1, t / 1.5), sh = Math.sin(t * 50) * sq * 3;
    g.save(); g.translate(sh, 0);
    line(g, [[200, 620], [700, 470]], '#9a9a90', 22); line(g, [[700, 470], [760, 452]], '#c9c9c0', 10); // the chisel
    shape(g, [[160, 720], [180, 520], [300, 460], [480, 470], [520, 540], [440, 620], [360, 720]], PAL.skin, { lw: 3 });
    for (let i = 0; i < 4; i++) { const kx = 320 + i * 44; iell(g, kx, 480 + i * 6, 22, 16, `rgba(240,225,205,${0.3 + sq * 0.6})`, { lw: 2 }); } // the knuckles whiten
    g.restore();
    const sx = 1300 - Math.min(1, t / 2.2) * 760;
    drawSoldier(g, sx, 560, 4, t * 9, { keyRot: -t * 6 });
    letterbox(g);
  },
  rage(g, t) {
    const flash = Math.max(0, 1 - Math.abs(t - 1) * 1.5), sw = Math.min(1, Math.max(0, (t - 0.9) / 0.4));
    g.fillStyle = '#1e140c'; g.fillRect(0, 0, 1280, 720);
    g.save(); g.translate(640, 360); g.rotate(-0.1 + Math.sin(t * 3) * 0.015); g.translate(-640, -360);
    for (let i = 0; i < 7; i++) line(g, [[-200 + i * 300, -40], [640, 160]], 'rgba(10,6,3,0.8)', 22, 0.4); // the beams, far above
    // John from below: chest and shoulders in his waistcoat, the right arm sweeping out
    shape(g, [[260, 800], [300, 560], [420, 470], [700, 470], [820, 560], [860, 800]], '#3b3029', { lw: 3 });
    shape(g, [[470, 470], [650, 470], [630, 800], [490, 800]], PAL.shirt, { lw: 2.4 });
    shape(g, [[420, 520], [480, 480], [500, 800], [380, 800]], '#4a3a30', { lw: 2 }); shape(g, [[700, 520], [640, 480], [620, 800], [740, 800]], '#4a3a30', { lw: 2 });
    const hx = 840 + sw * 300, hy = 600 - sw * 180;
    shape(g, [[760, 530], [820, 500], [hx, hy - 30], [hx + 10, hy + 30], [800, 620]], PAL.shirt, { lw: 2.6 }); // the sleeve
    iell(g, hx + 30, hy, 34, 28, PAL.skin, { lw: 2.4 }); // the fist
    drawAngryFace(g, 560, 330, 2.6, 1, t);
    g.restore();
    if (sw > 0) { const f = (t - 0.9) * 1.6; g.save(); g.translate(1040 + f * 380, 440 - f * 260 + f * f * 240); g.rotate(f * 8); drawSoldier(g, 0, 0, 2.2, 0); g.restore(); }
    poly(g, [[-40, 760], [-40, 640], [1320, 590], [1320, 760]], '#5a3a24', { lw: 3 }); // the bench edge, close
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(220,90,60,${0.2 + flash * 0.3})`; g.fillRect(0, 0, 1280, 720); g.restore();
    g.save(); g.translate(Math.sin(t * 60) * flash * 8, 0); if (t > 0.3) shotText(g, 'John:  Thirty years! Thirty years I carved for this place!', 600, 26); g.restore();
    letterbox(g);
  },
  silence(g, t) {
    drawFloorHigh(g, t, true);
    letterbox(g);
  },
  breath(g, t) {
    g.fillStyle = '#2a1c12'; g.fillRect(0, 0, 1280, 720);
    soft(g, 8, () => cornerBg(g)); dark(g, 0.35, []);
    const heave = Math.sin(t * 4) * 10, cough = t > 2.4 ? Math.sin(t * 30) * 6 : 0;
    g.save(); g.translate(cough, heave * 0.4); drawAngryFace(g, 640, 360, 4, Math.max(0.2, 1 - t / 5), t); g.restore();
    shape(g, [[560, 760], [600, 640], [700, 600], [760, 640], [720, 760]], PAL.skin, { lw: 2.6 }); // a hand to his chest
    letterbox(g);
  },
});

// ---- The rest of the chapter, in shots ------------------------------------------------------------
const CHAPTER_SHOTS = [
  { id: 'railGrip', len: 2.6, angle: 'Close-up, his hand on the bed rail', sound: 'Iron creaks. A held breath.', screen: '—', part: 'The hospital',
    note: 'With the dressing off, John grips the iron rail and tries to pull himself up. The arm shakes. It is not enough.' },
  { id: 'nurseDoor', len: 2.4, angle: 'Low angle, from the bed, towards the door', sound: 'Footsteps on boards. The door.', screen: '—', part: 'The hospital',
    note: 'The nurse in the doorway, the corridor\'s light behind her, already coming in.' },
  { id: 'docTalk', len: 0, angle: 'Over John\'s shoulder, towards the doctor', sound: 'The rain on the window. The doctor\'s voice.', screen: 'The doctor\'s lines', part: 'The doctor\'s office',
    note: 'The doctor across the desk under the lamp, John\'s grey head soft in the foreground. Holds while the doctor speaks.' },
  { id: 'johnListen', len: 0, angle: 'Close-up, John', sound: 'The rain.', screen: 'John\'s line', part: 'The doctor\'s office',
    note: 'John hears it without moving: brows down, jaw set, the old man who will not be told.' },
  { id: 'wallClock', len: 3, angle: 'Insert: the wall clock', sound: 'The clock, loud in the silence.', screen: '—', part: 'The doctor\'s office',
    note: 'The silence after "a few days left to live". The pendulum swings.' },
  { id: 'houseOutside', len: 5, angle: 'Wide, slightly high, across the street', sound: 'Rain on cobbles. A cart passes, far off.', screen: 'Plate: John\'s House', part: 'Home',
    note: 'Dawn. A narrow brick house in a row of houses, a gas lamp still burning, one upstairs window lit: his. Somewhere inside an alarm clock is ringing.' },
  { id: 'catPaw', len: 2.4, angle: 'Close-up, the pillow', sound: 'A meow. A paw on a cheek.', screen: '—', part: 'Home',
    note: 'The cat pats the sleeping man\'s face with one paw, patiently.' },
  { id: 'eyeOpen', len: 2, angle: 'Extreme close-up, his eye', sound: 'A long breath in. A cough.', screen: '—', part: 'Home',
    note: 'His eye opens to the grey morning. Another day. Twenty-nine left.' },
  { id: 'endStreet', len: 6, angle: 'High, wide, the street in morning light', sound: 'The rain has stopped. Birds. His footsteps.', screen: '—', part: 'The ending',
    note: 'After the door: John walks down the wet, shining street in his coat and cap, small in the frame, towards the light at its end.' },
];

function houseRow(g, x0, y0, w, h, c, lit, seed) { // one narrow town house: brick, two storeys, sash windows, door
  poly(g, [[x0, y0 + h], [x0, y0], [x0 + w, y0], [x0 + w, y0 + h]], c, { lw: 2.4 });
  for (let r = 0; r < 14; r++) line(g, [[x0, y0 + r * h / 14], [x0 + w, y0 + r * h / 14]], 'rgba(30,14,8,0.18)', 1, 0.2);
  poly(g, [[x0 - 10, y0], [x0 + w / 2, y0 - 50], [x0 + w + 10, y0]], '#3a3a40', { lw: 2 }); irect(g, x0 + w * 0.7, y0 - 70, 22, 50, '#5a3424', { lw: 1.6 });
  [[0.18, 0.12], [0.6, 0.12], [0.18, 0.5]].forEach(([u, v], i) => { const x = x0 + w * u, y = y0 + h * v, ww = w * 0.24, hh = h * 0.26; irect(g, x - 4, y - 4, ww + 8, hh + 8, '#c9b89a', { lw: 1 }); irect(g, x, y, ww, hh, lit && i === 1 ? '#e8b860' : '#33404a', { lw: 1.4 }); line(g, [[x, y + hh / 2], [x + ww, y + hh / 2]], '#2a2622', 2); line(g, [[x + ww / 2, y], [x + ww / 2, y + hh]], '#2a2622', 1.4); });
  irect(g, x0 + w * 0.6, y0 + h * 0.5, w * 0.22, h * 0.5, '#2e2418', { lw: 2 }); iell(g, x0 + w * 0.66, y0 + h * 0.76, 3, 3, PAL.brass, { lw: 0.6 });
  irect(g, x0 + w * 0.56, y0 + h, w * 0.3, 10, '#8a8478', { lw: 1.4 });
}

Object.assign(SHOT_DRAW, {
  railGrip(g, t) {
    // closer on the bed: he pushes himself up on one arm, holds, and sinks back
    g.drawImage(roomBg('ward', BG_SCALE), 100 * BG_SCALE, 250 * BG_SCALE, 760 * BG_SCALE, 428 * BG_SCALE, 0, 0, 1280, 720);
    const up = Math.sin(Math.min(1, t / 2.4) * Math.PI), sh = Math.sin(t * 40) * 2 * up;
    g.save(); g.translate(-100 * 1.684, -250 * 1.684); g.scale(1.684, 1.684);
    g.save(); g.translate(sh, -up * 34); drawJohnInBed(g, 320, 440, t, { noBody: true }); g.restore();
    shape(g, [[350, 476 - up * 30], [520, 456], [700, 470], [700, 520], [350, 520]], lin(g, 0, 450, 0, 520, [[0, '#9fb3ad'], [1, '#6f8783']]), { lw: 2.4 }); // the blanket
    line(g, [[372 + sh, 470 - up * 30], [300, 500 - up * 4], [262, 470 - up * 10]], PAL.skin, 13, 0.3); // his arm, pushing on the mattress towards the rail
    g.restore();
    dark(g, 0.2, [[700, 300, 600, 0.2, '220,255,250']]);
    letterbox(g);
  },
  nurseDoor(g, t) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#3e504c'], [1, '#2a3432']]); g.fillRect(0, 0, 1280, 720);
    poly(g, [[440, 720], [460, 60], [860, 40], [880, 720]], '#d8d0b8', { lw: 3 }); // the open doorway, light beyond
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = lin(g, 660, 300, 660, 720, [[0, 'rgba(255,240,210,0.6)'], [1, 'rgba(255,240,210,0)']]); g.beginPath(); g.moveTo(440, 720); g.lineTo(880, 720); g.lineTo(1100, 720); g.lineTo(880, 300); g.closePath(); g.fill(); g.restore();
    poly(g, [[860, 40], [1040, 0], [1040, 720], [880, 720]], '#5a4430', { lw: 2.6 }); // the door, swung open
    const k = Math.min(1, t / 2);
    g.save(); g.translate(660, 740); g.scale(1.6 + k * 0.3, 1.6 + k * 0.3); drawNurse(g, 0, 0, t, { walk: true }); g.restore();
    poly(g, [[-40, 720], [-40, 600], [1320, 640], [1320, 720]], '#d9d6c8', { lw: 2 }); // the bed's edge, close
    letterbox(g);
  },
  docTalk(g, t) {
    wallpaper(g, 0, 0, 1280, 720, '#6a5a44', '#4a3e2e');
    irect(g, 80, 40, 300, 460, '#3a2a1e', { lw: 2.6 }); for (let sh = 0; sh < 4; sh++) { line(g, [[86, 140 + sh * 110], [374, 140 + sh * 110]], '#2a1c12', 6); for (let b = 0; b < 10; b++) irect(g, 94 + b * 28, 76 + sh * 110, 24, 62, ['#7a3a2a', '#4a5a4a', '#8a6a3a', '#3a3a4a'][b % 4], { lw: 1 }); }
    const talking = typeof state !== 'undefined' && state && state.talk && state.talk.who === 'Doctor';
    g.save(); g.translate(720, 860); g.scale(1.45, 1.45); drawDoctor(g, 0, 0, t); g.restore();
    if (talking) iell(g, 720 + 6 * 1.45, 860 - 356 * 1.45, 7, 3 + Math.abs(Math.sin(t * 12)) * 4, '#5a2a1a', { lw: 0.8 });
    poly(g, [[300, 560], [1180, 560], [1280, 640], [200, 640]], lin(g, 0, 560, 0, 640, [[0, '#7a4a2e'], [1, '#5a341e']]), { lw: 2.6 }); irect(g, 200, 640, 1080, 120, '#4a2c1a', { lw: 2.6 });
    irect(g, 600, 576, 160, 50, PAL.paper, { lw: 1.6 }); line(g, [[1000, 560], [1000, 470]], '#2a2a2a', 5); shape(g, [[960, 470], [1040, 470], [1024, 430], [976, 430]], '#3a5a3a', { lw: 2 });
    lamp(g, 1000, 470, 520, 0.6);
    soft(g, 10, () => { shape(g, [[-80, 760], [-60, 420], [80, 330], [260, 330], [340, 420], [360, 760]], '#3b3029', { lw: 0, stroke: false }); iell(g, 170, 250, 110, 120, '#8f8a80', { lw: 0, stroke: false }); }); // John's shoulder and grey head
    letterbox(g);
  },
  johnListen(g, t) {
    wallpaper(g, 0, 0, 1280, 720, '#6a5a44', '#4a3e2e'); soft(g, 8, () => { irect(g, 900, 80, 260, 240, '#2a2622', { lw: 0, stroke: false }); }); dark(g, 0.35, []);
    drawAngryFace(g, 640, 380, 4, 0, t * 0.1, true);
    lamp(g, 900, 200, 700, 0.4);
    letterbox(g);
  },
  wallClock(g, t) {
    wallpaper(g, 0, 0, 1280, 720, '#6a5a44', '#4a3e2e'); dark(g, 0.3, [[640, 300, 500, 0.2]]);
    irect(g, 520, 80, 240, 560, '#4a2c1a', { lw: 3 }); woodGrain(g, 524, 84, 232, 552, '#1a0e06', 0.25);
    iell(g, 640, 220, 100, 100, '#efe6d0', { lw: 3 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; txt(g, ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][i], 640 + Math.cos(a) * 78, 220 + Math.sin(a) * 78, 18, INK); }
    line(g, [[640, 220], [640 - 30, 220 - 40]], INK, 5); line(g, [[640, 220], [640 + 60, 220 - 20]], INK, 3.4);
    irect(g, 560, 340, 160, 280, 'rgba(200,210,200,0.25)', { lw: 2 });
    const sw = Math.sin(t * Math.PI) * 0.28;
    g.save(); g.translate(640, 340); g.rotate(sw); line(g, [[0, 0], [0, 220]], PAL.brass, 4); iell(g, 0, 236, 26, 26, PAL.brassHi, { lw: 2 }); g.restore();
    letterbox(g);
  },
  houseOutside(g, t) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#6e7472'], [0.6, '#b0a68e'], [1, '#4a4034']]); g.fillRect(0, 0, 1280, 720);
    cityRow(g, 300, 0.6, '#8a8c86', 9, 3.0);
    poly(g, [[-40, 600], [1320, 600], [1320, 760], [-40, 760]], '#4a4036', { lw: 2 }); // the street
    for (let i = 0; i < 90; i++) { const u = hash(i * 1.3 + 5), v = hash(i * 2.7 + 5); iell(g, u * 1280, 610 + v * 120, 8 + v * 8, 3 + v * 2, 'rgba(30,26,22,0.35)', { lw: 0, stroke: false }); }
    irect(g, -40, 580, 1360, 22, '#8a8478', { lw: 2 }); // the pavement
    houseRow(g, -60, 230, 300, 350, '#6a4030', false, 1);
    houseRow(g, 250, 210, 320, 370, '#7a4a34', false, 2);
    houseRow(g, 580, 200, 340, 380, '#6e3e2c', true, 3); // his
    houseRow(g, 930, 220, 300, 360, '#7a4a34', false, 4);
    houseRow(g, 1240, 230, 300, 350, '#6a4030', false, 5);
    line(g, [[520, 720], [520, 420]], '#1e1a18', 7); poly(g, [[500, 420], [540, 420], [534, 388], [506, 388]], 'rgba(255,214,140,0.9)', { lw: 1.6 });
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rad(g, 520, 404, 0, 140, [[0, 'rgba(255,214,140,0.35)'], [1, 'rgba(255,214,140,0)']]); g.fillRect(380, 260, 280, 300); g.restore();
    for (let i = 0; i < 5; i++) iell(g, 120 + i * 260, 660 + (i % 2) * 30, 60, 8, 'rgba(190,200,200,0.35)', { lw: 1 });
    drawRain(g, 0, 0, 1280, 720, t, 200, 'rgba(210,220,225,0.3)');
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(120,130,140,0.3)'; g.fillRect(0, 0, 1280, 720); g.restore();
    if ((t * 4) % 1 < 0.5) { g.save(); g.globalAlpha = 0.6; txt(g, '~', 735, 196, 26, PAL.paleOchre); g.restore(); } // the alarm, faint, from his window
    letterbox(g);
  },
  catPaw(g, t) {
    wallpaper(g, 0, 0, 1280, 720, '#6b5a3e', '#4a3c28'); dark(g, 0.3, [[900, 160, 700, 0.3, '200,210,220']]);
    irect(g, -40, 470, 1360, 260, '#4a2c1a', { lw: 2.4 }); // the bed
    iell(g, 330, 470, 210, 80, '#ece8da', { lw: 2.6 }); // the pillow
    g.save(); g.translate(330, 450); g.scale(2.6, 2.6); drawJohnInBed(g, 0, 0, t, { blanket: [[0, '#8a5a4a'], [1, '#5a3a30']] }); g.restore();
    const pat = Math.max(0, Math.sin(t * 4));
    g.save(); g.translate(600, 520); g.scale(1.8, 1.8); drawCat(g, 0, 0, t, 'sit', { flip: true }); g.restore();
    shape(g, [[580, 470], [520 - pat * 20, 420 - pat * 8], [500 - pat * 20, 428 - pat * 8], [560, 490]], '#3a3632', { lw: 2 }); iell(g, 500 - pat * 20, 424 - pat * 8, 12, 9, '#3a3632', { lw: 1.6 }); // a paw raised to his cheek
    letterbox(g);
  },
  eyeOpen(g, t) {
    wallpaper(g, 0, 0, 1280, 720, '#6b5a3e', '#4a3c28');
    iell(g, 600, 560, 420, 160, '#ece8da', { lw: 3 }); // the pillow
    const K = 3.4, hx = 560, hy = 520;
    g.save(); g.translate(hx, hy); g.scale(K, K); drawJohnInBed(g, 0, 0, t, { noBody: true }); g.restore();
    const open = Math.min(1, Math.max(0, (t - 0.5) / 1)), ex = hx + 4 * K, ey = hy - 28 * K;
    shape(g, [[ex - 26, ey + 4], [ex, ey - 4 - open * 12], [ex + 26, ey - 2], [ex + 6, ey + 8]], '#efe6d0', { lw: 1.8 });
    if (open > 0.3) { iell(g, ex + 2, ey - 1, 8 * open, 7 * open, '#4a3a2a', { lw: 1 }); iell(g, ex + 2, ey - 1, 3.4 * open, 3.4 * open, INK, { lw: 0.4 }); }
    line(g, [[ex - 28, ey + 4], [ex, ey - 6 - open * 13], [ex + 28, ey - 2]], INK, 2.6, 0.3);
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(160,175,190,0.3)'; g.fillRect(0, 0, 1280, 720); g.restore();
    letterbox(g);
  },
  endStreet(g, t) {
    const k = t / 6;
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#c9c0a0'], [0.5, '#f0dcb0'], [1, '#6a5a44']]); g.fillRect(0, 0, 1280, 720);
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rad(g, 640, 300, 0, 500, [[0, 'rgba(255,240,200,0.8)'], [1, 'rgba(255,240,200,0)']]); g.fillRect(0, 0, 1280, 720); g.restore();
    // the street running away from us between two rows of houses
    poly(g, [[-200, 760], [560, 330], [720, 330], [1480, 760]], lin(g, 0, 330, 0, 720, [[0, '#9a8a6a'], [1, '#5a4a36']]), { lw: 0, stroke: false });
    for (let i = 0; i < 120; i++) { const v = Math.pow(hash(i * 1.7), 1.6), y = 340 + v * 400, half = 80 + v * 720, x = 640 + (hash(i * 3.3) - 0.5) * 2 * half; iell(g, x, y, 2 + v * 12, 1 + v * 4, 'rgba(255,240,200,0.35)', { lw: 0, stroke: false }); } // wet stones shining
    poly(g, [[-40, 0], [560, 250], [560, 340], [-40, 760]], '#6a4434', { lw: 2.4 }); poly(g, [[1320, 0], [720, 250], [720, 340], [1320, 760]], '#5a3a2c', { lw: 2.4 });
    for (let i = 0; i < 7; i++) { const u = i / 7; [[-40 + u * 600, 0], [1320 - u * 600, 1]].forEach(([x, side]) => { const top = 60 + u * 200, h = 140 * (1 - u * 0.8), w = 40 * (1 - u * 0.75); irect(g, x + (side ? -w - 20 * (1 - u) : 20 * (1 - u)), top + 40 * (1 - u), w, h, (i + side) % 3 === 0 ? '#e8b860' : '#33404a', { lw: 1.2 }); }); }
    // John, small, walking away into the light
    const jx = 660, jy = 560 - k * 120, js = 0.55 - k * 0.25;
    g.save(); g.translate(jx, jy); g.scale(js, js); drawJohnStanding(g, 0, 0, t, { noCig: true }); g.restore();
    iell(g, jx, jy + 4, 30 * js, 6 * js, 'rgba(0,0,0,0.25)', { lw: 0, stroke: false });
    letterbox(g);
  },
});
