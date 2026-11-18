// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-18
// town.js: the grave that opens the chapter, the map (the town and the house, places opened by
// dropping a keepsake on them, the cat's paw prints), and the Toy Works: the sorting line, the back
// yard with Paul, the letter and the collapse. Adds to ROOMS, LIVE, SHOTS and ICONS from story.js.
'use strict';

// ---- The map ---------------------------------------------------------------------------------
const TOWN = [
  { id: 'factory', name: 'The Toy Works', x: 300, y: 470, key: 'soldier' },
  { id: 'hospital', name: 'The Hospital', x: 600, y: 190, key: 'cigs' },
  { id: 'house', name: "John's House", x: 900, y: 320, key: 'register' },
  { id: 'cemetery', name: 'The Cemetery', x: 1050, y: 560, key: 'bouquet' },
  { id: 'church', name: "St. Aubin's Church", x: 760, y: 470 },
  { id: 'market', name: 'The Market', x: 450, y: 320 },
  { id: 'mill', name: 'The Mill', x: 160, y: 220 },
  { id: 'quay', name: 'The Quay', x: 560, y: 600 },
];
const HOUSE = [ // the floor plan, from above
  { id: 'parlour', name: 'Parlour', r: [330, 140, 340, 280] },
  { id: 'bedroom', name: 'Bedroom', r: [670, 140, 270, 230] },
  { id: 'study', name: 'Study', r: [940, 140, 200, 230] },
  { id: 'kitchen', name: 'Kitchen', r: [330, 420, 220, 170] },
  { id: 'hall', name: 'Hall', r: [550, 420, 120, 170] },
  { id: 'wash', name: 'Washroom', r: [670, 370, 170, 120] },
  { id: 'garden', name: 'Tulip Garden', r: [860, 400, 280, 200] },
];
const MAP_TOGGLE = [1060, 66, 200, 44];
const GOAL_TUT = {
  factory: 'Drag the soldier onto the Toy Works',
  hospital: 'Drag the cigarettes onto the hospital',
  house: "Drag the death register onto John's House",
  cemetery: 'Drag the tulips onto the cemetery',
};
const TRAILS = {
  garden: { view: 'house', pts: [[520, 300], [600, 460], [700, 520], [850, 500], [960, 500]] },
  cemetery: { view: 'town', pts: [[900, 320], [930, 400], [990, 470], [1050, 560]] },
  study: { view: 'house', pts: [[800, 70], [800, 140], [800, 250], [940, 260], [1040, 280]] },
};
function placeOf(room) {
  if (['grave', 'spiral', 'maryGrave', 'nightYard', 'statue'].includes(room)) return 'cemetery';
  if (['factory', 'sortLine', 'yard', 'benchLetter', 'letterClose'].includes(room)) return 'factory';
  if (['corridor', 'wardDoor', 'ward', 'armClose', 'office', 'formClose'].includes(room)) return 'hospital';
  return HOUSE_ROOMS[room] ? 'house' : null;
}
const HOUSE_ROOMS = { bedroom: 'bedroom', underBedClose: 'bedroom', parlour: 'parlour', pianoClose: 'parlour', garden: 'garden', study: 'study', drawerClose: 'study' };
function showMap(st) {
  if (st.map) return;
  st.map = true; sfx('paper'); st.sel = null; st.drag = null;
  st.mapView = st.mapGoal || placeOf(st.room) !== 'house' ? 'town' : 'house';
  if (st.trail) st.mapView = st.trail.view;
  tut(st, st.mapGoal ? GOAL_TUT[st.mapGoal] : null);
}
function openMap(st, view, goal, text) { // the story opens the map and waits for a keepsake
  st.map = true; st.mapView = view; st.mapGoal = goal; st.mapLock = !!goal; st.invOpen = true; st.sel = null; sfx('paper');
  tut(st, text || null);
}
function closeMap(st) {
  if (!st.map) return;
  if (st.mapLock) { say(st, 'Not yet.'); return; }
  st.map = false; st.sel = null; sfx('paper');
  if (st.tut && Object.values(GOAL_TUT).includes(st.tut.text)) tut(st, null);
}
function mapInput(st, ev) {
  const { type, x, y } = ev;
  if (type === 'down') {
    const slot = st.invOpen ? st.inv.findIndex((_, i) => inRect(x, y, slotRect(i))) : -1;
    st.drag = slot >= 0 ? { kind: 'item', id: st.inv[slot], x0: x, y0: y, moved: false } : { kind: 'swipe', x0: x, y0: y };
    return;
  }
  if (type === 'move') { const d = st.drag; if (d && d.kind === 'item' && !d.moved && Math.hypot(x - d.x0, y - d.y0) > 14) { d.moved = true; st.sel = d.id; } return; }
  if (type === 'cancel') { st.drag = null; return; }
  if (type === 'up') {
    const d = st.drag; st.drag = null; if (!d) return;
    if (d.kind === 'item' && d.moved) { mapTap(st, x, y); st.sel = null; return; }
    if (d.kind === 'swipe' && d.y0 - y > tune.swipeDist) closeMap(st);
    return;
  }
  if (type === 'tap') {
    if (inRect(x, y, UI.hint)) { askHint(st); return; }
    if (st.inv.length && inRect(x, y, st.invOpen ? [110, 98, 28, 48] : UI.invTab)) { st.invOpen = !st.invOpen; sfx('click'); return; }
    if (st.invOpen) { const i = st.inv.findIndex((_, k) => inRect(x, y, slotRect(k))); if (i >= 0) { st.sel = st.sel === st.inv[i] ? null : st.inv[i]; sfx('click'); return; } }
    mapTap(st, x, y);
  }
}
function mapTap(st, x, y) {
  if (st.places.house && inRect(x, y, MAP_TOGGLE)) { st.mapView = st.mapView === 'town' ? 'house' : 'town'; sfx('paper'); st.sel = null; return; }
  if (st.mapView === 'town') {
    const p = TOWN.find(p => Math.hypot(p.x - x, p.y - y) < 62);
    if (!p) { st.sel = null; return; }
    if (st.sel) { const id = st.sel; st.sel = null; mapUse(st, p, id); return; }
    townGo(st, p);
  } else {
    const r = HOUSE.find(r => inRect(x, y, r.r));
    if (!r) { st.sel = null; return; }
    if (st.sel) { st.sel = null; wrong(st); return; }
    houseGo(st, r);
  }
}
function mapUse(st, p, id) {
  if (p.key === id && !st.places[p.id]) {
    drop(st, id); st.places[p.id] = true; st.mapGoal = null; st.mapLock = false; tut(st, null);
    st.unlockFx = { id: p.id, t0: st.t }; sfx('solve');
    run(st, [1.4, () => { st.map = false; }, () => PLACE_OPEN[p.id](st)]);
  } else wrong(st);
}
const PLACE_OPEN = {
  factory: st => { st.stage = 'factory'; go(st, 'factory', { clear: true }); },
  hospital: st => { st.stage = 'hospital'; go(st, 'corridor', { clear: true }); },
  house: st => run(st, [shot('houseFront'), () => { setAmbience('home'); plaque(st, "John's House"); sfx('ringFar'); }, 5.5, shot(null), () => go(st, 'bedroom', { clear: true })]),
  cemetery: st => { st.stage = 'cemetery'; go(st, 'spiral', { clear: true }); },
};
function townGo(st, p) {
  if (!p.key) { say(st, 'Not today.'); return; }
  if (!st.places[p.id]) { say(st, st.mapGoal === p.id ? 'Something he carries belongs there.' : 'Grey. No reason to go there. Not yet.'); return; }
  if (p.id === 'house') {
    st.mapView = 'house'; sfx('paper');
    if (st.stage === 'homeward') homecoming(st);
    return;
  }
  if (p.id === 'cemetery') {
    if (st.stage === 'night' && !hasItem(st, 'safeKey')) { st.trail = null; st.map = false; go(st, 'nightYard', { clear: true }); return; }
    if (placeOf(st.room) === 'cemetery') { closeMap(st); return; }
    say(st, st.f.graveDone ? 'She has her flowers.' : 'Not yet.'); return;
  }
  say(st, p.id === 'factory' ? 'Not there. Never again.' : 'No more doctors.');
}
function houseGo(st, r) {
  if (st.stage === 'homeward') { homecoming(st); return; }
  if (!st.rooms[r.id]) { say(st, r.id === 'kitchen' || r.id === 'wash' || r.id === 'hall' ? 'Nothing for him there.' : 'Not now.'); return; }
  if (st.stage === 'night' && !hasItem(st, 'safeKey')) { say(st, 'The cat. Where did it go?'); return; }
  if (HOUSE_ROOMS[st.room] === r.id && !ROOMS[st.room].close) { closeMap(st); return; }
  st.map = false; st.trail = st.trail && st.trail.view === 'house' && r.id === 'garden' ? null : st.trail;
  sfx('step'); go(st, r.id, { clear: true });
}
function homecoming(st) { // back from her grave: the cat goes ahead of him, into the house
  st.stage = 'homebound'; st.mapView = 'house'; st.mapLock = true;
  run(st, [0.4, () => { st.trail = { ...TRAILS.study, t0: st.t }; sfx('meow'); }, 3.8,
    () => { st.stage = 'final'; st.mapLock = false; st.task = "Find Mary's keepsakes"; st.rooms.study = true; st.f.catInBox = true; plaque(st, "Find Mary's keepsakes"); sfx('memory'); },
    2.6, () => tut(st, 'Search the rooms. Click a room to go there.')]);
}

// ---- Drawing the map -------------------------------------------------------------------------
Object.assign(PAINTERS, {
  townMap(g) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#e9d9b0'], [1, '#d4bf90']]); g.fillRect(0, 0, 1280, 720);
    dabs(g, 0, 0, 1280, 720, '#8a6a3a', 220, 60, 0.07);
    // the river Severn, curling through the town
    shape(g, [[-20, 380], [160, 350], [300, 400], [430, 520], [470, 640], [520, 740], [640, 740], [600, 620], [560, 500], [640, 430], [780, 400], [900, 430], [1000, 380], [1120, 300], [1300, 270], [1300, 320], [1130, 350], [1020, 430], [900, 480], [780, 450], [660, 470], [610, 520], [640, 640], [700, 740], [460, 740], [400, 560], [280, 440], [150, 400], [-20, 430]], '#a9bdb5', { lw: 2 });
    for (let i = 0; i < 16; i++) line(g, [[80 + i * 70, 395 + Math.sin(i) * 20], [104 + i * 70, 390 + Math.sin(i) * 20]], 'rgba(70,100,96,0.5)', 1.2);
    // roads
    [[[120, 700], [300, 480], [450, 330], [600, 200], [760, 120]], [[450, 330], [700, 330], [900, 320], [1100, 230]], [[900, 320], [960, 450], [1050, 560], [1160, 700]], [[160, 220], [450, 330]], [[300, 480], [560, 600], [760, 470], [900, 320]]].forEach(r => line(g, r, '#a07a4a', 5, 1.5));
    // fields and woods
    for (let i = 0; i < 9; i++) { const x = 60 + hash(i * 3.3) * 1100, y = 70 + hash(i * 5.1) * 560; poly(g, [[x, y], [x + 90, y - 10], [x + 100, y + 60], [x + 4, y + 66]], 'rgba(150,160,100,0.35)', { lw: 1 }); for (let k = 0; k < 4; k++) line(g, [[x + 10, y + 12 + k * 14], [x + 90, y + 4 + k * 14]], 'rgba(110,120,70,0.4)', 1); }
    for (let i = 0; i < 40; i++) { const x = 30 + hash(i * 4.1) * 1220, y = 60 + hash(i * 6.7) * 620; if (TOWN.some(p => Math.hypot(p.x - x, p.y - y) < 90)) continue; iell(g, x, y, 11, 9, '#7a8a5a', { lw: 1.1 }); line(g, [[x, y + 9], [x, y + 16]], '#5a4a2a', 1.6); }
    // the old town: rows of roofs along the river
    for (let i = 0; i < 46; i++) { const x = 380 + hash(i * 2.9) * 560, y = 260 + hash(i * 8.3) * 300; if (TOWN.some(p => Math.hypot(p.x - x, p.y - y) < 70)) continue; poly(g, [[x - 12, y + 8], [x - 12, y - 4], [x, y - 14], [x + 12, y - 4], [x + 12, y + 8]], '#b8946a', { lw: 1 }); }
    txt(g, 'A General Plan of St. Aubin-upon-Severn', 104, 40, 22, '#4a3220', { italic: true, align: 'left' });
    g.save(); g.translate(1200, 640); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); poly(g, [[0, -40], [8, 0], [0, 8], [-8, 0]], i % 2 ? '#8a3a2a' : '#4a3220', { lw: 1.2 }); } g.restore();
  },
});
function placeIcon(g, id, x, y) { // each place drawn as a little engraving
  if (id === 'factory') { poly(g, [[x - 50, y + 20], [x - 50, y - 16], [x - 30, y - 30], [x - 10, y - 16], [x + 10, y - 30], [x + 30, y - 16], [x + 50, y - 30], [x + 50, y + 20]], '#9a5a3a', { lw: 1.6 }); irect(g, x + 30, y - 66, 12, 40, '#7a3a2a', { lw: 1.4 }); for (let i = 0; i < 4; i++) irect(g, x - 40 + i * 22, y - 4, 10, 14, '#3a3a40', { lw: 0.8 }); }
  else if (id === 'hospital') { irect(g, x - 56, y - 20, 112, 40, '#d8cbb0', { lw: 1.6 }); poly(g, [[x - 20, y - 20], [x, y - 44], [x + 20, y - 20]], '#a08a6a', { lw: 1.4 }); for (let i = 0; i < 6; i++) irect(g, x - 48 + i * 17, y - 10, 8, 12, '#4a4a50', { lw: 0.8 }); line(g, [[x, y - 40], [x, y - 58]], '#5a3a2a', 2); line(g, [[x - 6, y - 52], [x + 6, y - 52]], '#5a3a2a', 2); }
  else if (id === 'house') { poly(g, [[x - 30, y + 20], [x - 30, y - 6], [x, y - 32], [x + 30, y - 6], [x + 30, y + 20]], '#c8a878', { lw: 1.6 }); shape(g, [[x - 36, y - 4], [x, y - 38], [x + 36, y - 4]], '#7a6a4a', { lw: 1.4 }); irect(g, x - 6, y + 2, 12, 18, '#4a2e1a', { lw: 1 }); for (let i = 0; i < 5; i++) iell(g, x + 40 + (i % 3) * 8, y + 16 - Math.floor(i / 3) * 8, 3, 3, '#b83a2a', { lw: 0.6 }); }
  else if (id === 'cemetery') { for (let i = 0; i < 7; i++) { const gx = x - 44 + (i % 4) * 28, gy = y - 6 + Math.floor(i / 4) * 26; shape(g, [[gx - 7, gy + 8], [gx - 7, gy - 6], [gx, gy - 12], [gx + 7, gy - 6], [gx + 7, gy + 8]], '#a8a49a', { lw: 1 }); } line(g, [[x + 40, y - 40], [x + 40, y - 10]], '#5a5a5a', 2.4); line(g, [[x + 32, y - 32], [x + 48, y - 32]], '#5a5a5a', 2.4); line(g, [[x - 60, y + 30], [x + 60, y + 30]], '#5a5a50', 1.6); }
  else if (id === 'church') { irect(g, x - 30, y - 14, 60, 34, '#c8b898', { lw: 1.4 }); poly(g, [[x - 10, y - 14], [x - 10, y - 40], [x, y - 70], [x + 10, y - 40], [x + 10, y - 14]], '#a89878', { lw: 1.4 }); }
  else if (id === 'market') { for (let i = 0; i < 3; i++) { poly(g, [[x - 40 + i * 28, y + 10], [x - 40 + i * 28, y - 6], [x - 28 + i * 28, y - 18], [x - 16 + i * 28, y - 6], [x - 16 + i * 28, y + 10]], '#c09a6a', { lw: 1.2 }); } }
  else if (id === 'mill') { irect(g, x - 16, y - 20, 32, 40, '#b89a70', { lw: 1.4 }); g.save(); g.translate(x, y - 20); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); poly(g, [[-3, 0], [3, 0], [4, -34], [-4, -34]], '#8a7a5a', { lw: 1 }); } g.restore(); }
  else { line(g, [[x - 50, y + 10], [x + 50, y + 10]], '#6a5030', 4); for (let i = 0; i < 3; i++) poly(g, [[x - 40 + i * 30, y - 2], [x - 20 + i * 30, y - 2], [x - 30 + i * 30, y - 26]], '#d8cbb0', { lw: 1 }); }
}
function drawMap(g, st) {
  const t = st.t;
  if (st.mapView === 'town') {
    g.drawImage(roomBg('townMap', BG_SCALE), 0, 0, 1280, 720);
    const here = placeOf(st.room);
    TOWN.forEach(p => {
      const open = !!st.places[p.id], goal = st.mapGoal === p.id;
      g.save();
      if (!open) { g.filter = 'grayscale(1)'; g.globalAlpha = goal ? 0.55 + 0.25 * (0.5 + 0.5 * Math.sin(t * 3)) : 0.38; }
      placeIcon(g, p.id, p.x, p.y);
      g.restore();
      if (goal) { const k = 0.5 + 0.5 * Math.sin(t * 3); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rad(g, p.x, p.y, 0, 90, [[0, `rgba(255,236,190,${0.35 + 0.2 * k})`], [1, 'rgba(255,236,190,0)']]); g.fillRect(p.x - 100, p.y - 100, 200, 200); g.restore(); }
      txt(g, p.name, p.x, p.y + 46, 19, open ? '#3a2410' : '#77736a', { italic: true });
      if (here === p.id && open) { const k = 0.5 + 0.5 * Math.sin(t * 4); iell(g, p.x, p.y, 62 + k * 6, 48 + k * 6, null, { lw: 3, stroke: '#a02a1a' }); }
      if (st.unlockFx && st.unlockFx.id === p.id && t - st.unlockFx.t0 < 1.4) { const k = (t - st.unlockFx.t0) / 1.4; g.save(); g.globalAlpha = 1 - k; iell(g, p.x, p.y, 40 + k * 120, 30 + k * 90, null, { lw: 4, stroke: '#e6c071' }); g.restore(); }
    });
  } else {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#e9d9b0'], [1, '#d4bf90']]); g.fillRect(0, 0, 1280, 720);
    dabs(g, 0, 0, 1280, 720, '#8a6a3a', 120, 60, 0.06);
    txt(g, "John's House", 104, 40, 26, '#4a3220', { italic: true, align: 'left' });
    const cur = HOUSE_ROOMS[st.room];
    HOUSE.forEach(r => {
      const [x, y, w, h] = r.r, open = !!st.rooms[r.id];
      g.save(); if (!open) g.globalAlpha = 0.45;
      irect(g, x, y, w, h, r.id === 'garden' ? (open ? '#a8b07a' : '#b8b4a4') : (open ? '#d8c09a' : '#c4beb0'), { lw: 3, stroke: '#4a3220' });
      houseFurniture(g, r.id, x, y, w, h, open);
      txt(g, r.name, x + w / 2, y + h - 18, 20, open ? '#3a2410' : '#6a6a64', { italic: true });
      g.restore();
      if (cur === r.id) { const k = 0.5 + 0.5 * Math.sin(t * 4); irect(g, x + 6, y + 6, w - 12, h - 12, null, { lw: 3 + k * 2, stroke: '#a02a1a' }); }
    });
    if (st.rooms.parlour && !st.f.seen_parlour) { const r = HOUSE[0].r, k = 0.5 + 0.5 * Math.sin(t * 4); g.save(); g.globalAlpha = k; drawGlow(g, r[0], r[1], r[2], r[3], 1); g.restore(); }
  }
  if (st.trail && st.trail.view === st.mapView) drawTrail(g, st.trail, t);
  if (st.places.house) { const [x, y, w, h] = MAP_TOGGLE; irect(g, x, y, w, h, 'rgba(60,40,20,0.85)', { lw: 1.8, stroke: PAL.ochre }); txt(g, st.mapView === 'town' ? "John's House  ▸" : '◂  The Town', x + w / 2, y + h / 2 + 1, 19, PAL.paleOchre, { italic: true }); }
  if (!st.mapLock) txt(g, 'Swipe up, right-click or Esc to close', 640, 700, 16, '#5a4028', { italic: true });
}
function houseFurniture(g, id, x, y, w, h) { // the plan's furniture, small and flat
  const c = '#8a6a4a';
  if (id === 'parlour') { irect(g, x + 20, y + 30, 50, 120, c, { lw: 1 }); irect(g, x + w - 80, y + 20, 60, 36, '#3a2a1a', { lw: 1 }); irect(g, x + 120, y + 20, 80, 18, '#7a3a2a', { lw: 1 }); iell(g, x + 170, y + 150, 60, 40, '#9a5a4a', { lw: 1 }); }
  else if (id === 'bedroom') { irect(g, x + 30, y + 30, 120, 90, '#e6dcc4', { lw: 1 }); irect(g, x + 30, y + 30, 120, 26, c, { lw: 1 }); irect(g, x + 170, y + 30, 40, 40, c, { lw: 1 }); line(g, [[x + 110, y], [x + 190, y]], '#7f9a92', 6); }
  else if (id === 'study') { irect(g, x + 30, y + 40, 100, 50, c, { lw: 1 }); irect(g, x + 10, y + 10, w - 20, 16, '#5a3a24', { lw: 1 }); }
  else if (id === 'kitchen') { irect(g, x + 10, y + 10, w - 20, 26, '#7a6a5a', { lw: 1 }); iell(g, x + 110, y + 90, 40, 26, c, { lw: 1 }); }
  else if (id === 'wash') { iell(g, x + 60, y + 50, 40, 22, '#e6e2d8', { lw: 1 }); }
  else if (id === 'garden') { iell(g, x + 140, y + 80, 70, 44, '#7a5a3a', { lw: 1 }); for (let i = 0; i < 12; i++) iell(g, x + 90 + (i % 6) * 20, y + 64 + Math.floor(i / 6) * 26, 5, 5, i % 2 ? '#c83a2a' : '#e0b830', { lw: 0.6 }); }
}
function drawTrail(g, tr, t) { // a cat's paw prints, appearing one after another
  const pts = tr.pts, segs = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(l); total += l; }
  const shown = Math.min(1, (t - tr.t0) / 3.2) * total;
  for (let d = 10, k = 0; d < shown; d += 26, k++) {
    let acc = 0, i = 0; while (i < segs.length - 1 && acc + segs[i] < d) acc += segs[i++];
    const u = (d - acc) / segs[i], [a, b] = [pts[i], pts[i + 1]], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), side = k % 2 ? 7 : -7;
    const px = a[0] + (b[0] - a[0]) * u - Math.sin(ang) * side, py = a[1] + (b[1] - a[1]) * u + Math.cos(ang) * side;
    g.save(); g.translate(px, py); g.rotate(ang + Math.PI / 2);
    iell(g, 0, 3, 5, 4, '#1a1410', { lw: 0, stroke: false }); [[-5, -4], [-2, -7], [2, -7], [5, -4]].forEach(([tx, ty]) => iell(g, tx, ty, 1.8, 2.2, '#1a1410', { lw: 0, stroke: false }));
    g.restore();
  }
}

// ---- Toys, people and things of the Works --------------------------------------------------------
function drawBurntSoldier(g, x, y, s = 1) { // the wooden soldier, his chest burnt black
  drawSoldier(g, x, y, s, 0, { key: false });
  g.save(); g.translate(x, y); g.scale(s, s);
  shape(g, [[-12, -58], [6, -60], [13, -48], [8, -36], [-6, -34], [-13, -44]], 'rgba(24,14,10,0.9)', { lw: 0.8 });
  dabs(g, -10, -60, 22, 24, '#000', 8, 4, 0.6);
  g.restore();
}
function drawToyHorse(g, x, y, s = 1) { // a painted wooden horse on wheels
  g.save(); g.translate(x, y); g.scale(s, s);
  irect(g, -46, -14, 92, 10, '#6a4428', { lw: 1.6 });
  [-30, 30].forEach(wx => { iell(g, wx, -2, 10, 10, '#8a2a22', { lw: 1.6 }); iell(g, wx, -2, 3, 3, PAL.brass, { lw: 0.6 }); });
  line(g, [[-26, -14], [-26, -40]], '#d8b088', 7); line(g, [[24, -14], [24, -40]], '#d8b088', 7);
  shape(g, [[-36, -40], [26, -44], [44, -72], [58, -66], [50, -46], [34, -36], [-36, -34]], '#e0c090', { lw: 2 });
  line(g, [[30, -58], [42, -76], [54, -80]], '#3a2414', 3); iell(g, 50, -64, 2, 2, INK, { lw: 0 });
  line(g, [[-36, -38], [-50, -26]], '#3a2414', 4);
  g.restore();
}
function drawToyTrain(g, x, y, s = 1) { // a painted wooden engine
  g.save(); g.translate(x, y); g.scale(s, s);
  irect(g, -50, -36, 70, 26, '#2a5a4a', { lw: 1.8 }); irect(g, 14, -60, 32, 50, '#8a2a22', { lw: 1.8 }); irect(g, -40, -58, 14, 22, '#2a2a2a', { lw: 1.4 });
  irect(g, 18, -54, 22, 16, '#e6d6ad', { lw: 1 });
  [-36, -6, 30].forEach(wx => { iell(g, wx, -6, 10, 10, '#1a1a1a', { lw: 1.6 }); iell(g, wx, -6, 3, 3, PAL.brass, { lw: 0.6 }); });
  line(g, [[-50, -14], [46, -14]], PAL.brassHi, 2);
  g.restore();
}
const TOYS = [{ id: 'horse', good: true, draw: drawToyHorse }, { id: 'train', good: true, draw: drawToyTrain }, { id: 'soldier', good: false, draw: (g, x, y, s) => drawBurntSoldier(g, x, y + 6, s * 1.25) }];
const CRATE = [80, 430, 300, 230], BIN = [920, 420, 260, 250];
function drawPaul(g, x, y, t, o = {}) { // small and nervous, a name sewn on his apron
  const s = o.s || 0.9;
  drawWorker(g, x, y, t, { s, flip: o.flip, run: o.walk, coat: '#5a5a62', apron: '#c8b898', cap: '#4a4a52' });
  g.save(); g.translate(x, y); g.scale(o.flip ? -s : s, s);
  irect(g, -14, -130, 26, 12, '#efe6cc', { lw: 1 }); g.scale(o.flip ? -1 : 1, 1); txt(g, 'PAUL', 0, -124, 7, '#3a2a1a', { bold: true });
  g.restore();
}
function iconCigs(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.15); poly(g, [[-22, -14], [22, -16], [24, 14], [-20, 16]], '#d8cbb0', { lw: 1.6 }); irect(g, -20, -6, 42, 10, '#8a2a22', { lw: 1 }); line(g, [[14, -16], [20, -24]], PAL.white, 4); g.restore(); }
function iconRegister(g, x, y, s = 1) { g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.08); irect(g, -24, -18, 48, 36, '#5a3424', { lw: 1.6 }); irect(g, -20, -14, 40, 28, '#e6dcc4', { lw: 1 }); line(g, [[0, -14], [0, 14]], '#5a3424', 2); for (let i = 0; i < 3; i++) { line(g, [[-16, -6 + i * 7], [-4, -6 + i * 7]], 'rgba(40,40,60,0.5)', 1); line(g, [[4, -6 + i * 7], [16, -6 + i * 7]], 'rgba(40,40,60,0.5)', 1); } g.restore(); }
Object.assign(ICONS, {
  soldier: (g, x, y, s) => drawBurntSoldier(g, x, y + 30 * s, 0.6 * s),
  cigs: iconCigs, register: iconRegister,
});

// ---- The places --------------------------------------------------------------------------------
Object.assign(ROOMS, {
  // The chapter opens on John's own grave: no dates yet.
  grave: {
    amb: 'none', mapOk: st => hasItem(st, 'soldier') || st.places.factory,
    enter(st) {
      run(st, [shot('quote'), tune.quoteTime, shot(null), () => setAmbience('rain'), 1.4, () => tut(st, 'Click or tap what lies at the foot of the stone', [726, 560, 56])]);
    },
    spots: [
      { id: 'soldier', r: [680, 470, 100, 120], show: st => !st.f.soldierTaken, tap: st => {
        st.f.soldierTaken = true; give(st, 'soldier'); tut(st, null); st.mapGoal = 'factory';
        run(st, [0.6, say_(null, 'A wooden soldier, burnt black at the chest. Someone left it here for him.'), () => tut(st, 'Open the map: the Map button, M, or swipe down', [996, 684, 54])]);
      } },
      { id: 'stone', r: [470, 180, 340, 330], tap: st => note(st, 'John Smith. No years. Not yet.') },
    ],
  },
  // The sorting line: John checks each toy that comes off the belt.
  sortLine: {
    close: true, amb: 'factory',
    enter(st) {
      st.sort = { i: 0, t0: 9e9 };
      run(st, [0.5, shot('inspector'), () => sub(st, 'Every toy that leaves the line passes through his hands.', 5), 5, shot(null),
        () => { st.sort.t0 = st.t; tut(st, 'Good toys go in the crate, faulty ones in the bin. Drag each one.', null, [[640, 330], [240, 520]]); }]);
    },
    onBack(st) { if (st.sort.i < 3) { say(st, 'The line does not stop.'); return true; } return false; },
    spots: [
      { id: 'toy', r: [560, 240, 160, 130], show: st => st.sort.i < 3 && st.t - st.sort.t0 > 1.6,
        carry: { drop(st, x, y) {
          const toy = TOYS[st.sort.i], inC = inRect(x, y, CRATE), inB = inRect(x, y, BIN);
          if ((inC && toy.good) || (inB && !toy.good)) {
            sfx(toy.good ? 'pick' : 'thud'); st.sort.i++; st.sort.t0 = st.t; tut(st, null);
            if (st.sort.i === 3) run(st, [0.5, shot('binSoldier'), 3.4, shot(null), () => sfx('whistle'), 1.0, () => go(st, 'yard', { clear: true })]);
          } else if (inC || inB) { sfx('wrong'); say(st, toy.good ? 'Nothing wrong with that one.' : 'Burnt. Nobody buys a burnt soldier.'); }
        } } },
      { id: 'crate', r: CRATE, tap: st => say(st, 'For the shops.') },
      { id: 'bin', r: BIN, tap: st => say(st, 'For the stove.') },
    ],
  },
  // The back yard at the break: Paul, and the cigarettes.
  yard: {
    amb: 'rain',
    enter(st) {
      run(st, [1.0, () => { st.f.paulIn = st.t; sfx('step'); }, 1.8,
        say_('Paul', "Hey, John... you ought to stop smoking. You look thinner every week. Have you been to see a doctor?"),
        say_('John', "Kid, get out! It's none of your business."),
        () => { st.f.paulOut = st.t; sfx('step'); }, 1.8, () => { sfx('match'); st.f.cig2 = st.t; }, 2.6,
        () => { sfx('stub'); st.f.stubbed = st.t; }, 1.0, () => { st.f.johnOut = st.t; sfx('door'); }, 1.6,
        () => tut(st, 'Look at the ground', [830, 640, 50])]);
    },
    spots: [
      { id: 'pack', r: [770, 600, 120, 80], show: st => st.f.johnOut && !st.f.packTaken, tap: st => {
        st.f.packTaken = true; give(st, 'cigs'); tut(st, null); run(st, [1.0, () => go(st, 'benchLetter', { clear: true })]);
      } },
      { id: 'butts', r: [200, 600, 520, 110], show: st => st.f.johnOut, tap: st => note(st, 'Dozens of them. All his.') },
    ],
  },
  // Back at the line: the manager brings a letter.
  benchLetter: {
    amb: 'factory',
    enter(st) {
      run(st, [0.8, () => { st.f.mgrIn = st.t; sfx('step'); }, 2.0, say_('Manager', 'Smith. A letter for you, from the office.'),
        () => { st.f.letterGiven = true; sfx('paper'); }, 0.6, () => tut(st, 'Double-click or double-tap the letter', [640, 540, 60])]);
    },
    spots: [{ id: 'letter', r: [560, 490, 160, 90], show: st => st.f.letterGiven, focus: ['letterClose', [640, 540]] }],
  },
  letterClose: {
    close: true, amb: 'factory',
    every(st) { if (!st.f.letterOpen) tut(st, 'Break the seal', null, [[640, 300], [640, 420]]); },
    onBack(st) { if (!st.f.letterOpen) { say(st, 'Open it.'); return true; } rage(st); return true; },
    spots: [
      { id: 'seal', r: [570, 250, 140, 120], show: st => !st.f.letterOpen, drag: { dir: [0, 1], dist: 120, done: st => { st.f.letterOpen = st.t; sfx('paper'); sfx('click'); tut(st, null); run(st, [3.5, () => tut(st, 'Read it, then click')]); } } },
      { id: 'read', r: [300, 40, 680, 640], show: st => st.f.letterOpen && st.t - st.f.letterOpen > 2, tap: st => rage(st) },
    ],
  },
});
function rage(st) { // his anger, and what it costs him
  if (st.script || st.f.raged) return;
  st.f.raged = true; tut(st, null);
  const len = id => OPENING.find(o => o.id === id).len;
  run(st, [shot('letterRage'), 0.9, () => { sfx('slam'); sfx('paper'); }, 0.5,
    say_('John', "Are you machines? Have you no hearts? I've given this place more than thirty years. You can't throw me out!"),
    shot('breath'), 2.4, () => sfx('cough'), len('breath') - 2.4,
    shot('hand'), () => sfx('cough'), len('hand'),
    shot('tilt'), () => sfx('heart'), len('tilt'),
    shot('collapse'), () => { sfx('thud'); }, 3.2,
    shot('pov'), () => sfx('heart'), len('pov'),
    shot('white'), () => sfx('siren'), len('white'),
    shot('black'), 1.4, shot(null), () => { st.stage = 'hospital'; st.stack = []; openMap(st, 'town', 'hospital', GOAL_TUT.hospital); }]);
}

Object.assign(LIVE, {
  grave(g, st, t) {
    g.fillStyle = lin(g, 0, 0, 0, 420, [[0, '#7a7e7c'], [1, '#a8a496']]); g.fillRect(0, 0, 1280, 720);
    // the church far off, yews, other stones
    poly(g, [[980, 330], [980, 170], [1000, 110], [1020, 170], [1020, 330]], '#5e625e', { lw: 1.6 }); irect(g, 900, 250, 200, 90, '#666a66', { lw: 1.6 });
    [[90, 330, 70], [240, 300, 90], [1180, 320, 80], [1090, 350, 60]].forEach(([x, y, r]) => shape(g, [[x - r * 0.6, y + 40], [x - r * 0.5, y - r], [x, y - r * 1.8], [x + r * 0.5, y - r], [x + r * 0.6, y + 40]], '#3e4a3c', { lw: 1.8 }));
    g.fillStyle = lin(g, 0, 330, 0, 720, [[0, '#5e6a46'], [1, '#3a4228']]); g.fillRect(0, 340, 1280, 380);
    dabs(g, 0, 340, 1280, 380, '#1e2412', 160, 14, 0.25);
    [[140, 400, 0.6], [330, 380, 0.5], [960, 390, 0.55], [1140, 410, 0.65]].forEach(([x, y, s]) => { g.save(); g.translate(x, y); g.scale(s, s); shape(g, [[-60, 100], [-60, -40], [-40, -80], [40, -80], [60, -40], [60, 100]], '#6a6a66', { lw: 2 }); g.restore(); });
    // his stone, dark and new
    shape(g, [[460, 560], [470, 230], [520, 190], [760, 190], [810, 230], [820, 560]], lin(g, 0, 190, 0, 560, [[0, '#4a4a4c'], [1, '#2a2a2c']]), { lw: 3 });
    dabs(g, 480, 210, 320, 340, '#000', 50, 6, 0.2);
    irect(g, 430, 556, 420, 40, '#3a3a3a', { lw: 2.4 });
    txt(g, 'IN LOVING MEMORY', 640, 270, 24, '#a8a8a4', { bold: true });
    txt(g, 'JOHN SMITH', 640, 350, 56, '#c8c8c4', { bold: true });
    line(g, [[560, 410], [720, 410]], 'rgba(200,200,196,0.4)', 2);
    if (!st.f.soldierTaken) { g.save(); g.translate(726, 590); g.rotate(-0.12); drawBurntSoldier(g, 0, 0, 1.25); g.restore(); }
    for (let i = 0; i < 26; i++) { const x = 300 + hash(i * 3.7) * 700, y = 590 + hash(i * 5.3) * 110; iell(g, x, y, 9, 5, i % 3 ? '#8a5a2a' : '#a8742a', { lw: 0.8, rot: hash(i) * 3 }); }
    drawRain(g, 0, 0, 1280, 720, t, tune.rainAmount * 1.5, 'rgba(210,220,225,0.22)');
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(160,150,130,0.25)'; g.fillRect(0, 0, 1280, 720); g.restore();
  },
  sortLine(g, st, t) {
    // the inspection end of the line: brick, a tall window of small panes, the line shaft overhead
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#4a3022'], [1, '#2e1e14']]); g.fillRect(0, 0, 1280, 720);
    for (let r = 0; r < 14; r++) for (let c = 0; c < 22; c++) irect(g, c * 62 - (r % 2) * 31, r * 26, 60, 24, r % 3 ? '#5a3424' : '#62392a', { lw: 0.6, stroke: 'rgba(20,10,6,0.5)' });
    irect(g, 120, 30, 300, 220, '#2a2622', { lw: 3 }); g.fillStyle = lin(g, 0, 30, 0, 250, [[0, '#8f9a9a'], [1, '#c9b58f']]); g.fillRect(132, 42, 276, 196);
    for (let i = 1; i < 6; i++) line(g, [[132 + i * 46, 42], [132 + i * 46, 238]], '#2a2622', 3); for (let i = 1; i < 4; i++) line(g, [[132, 42 + i * 49], [408, 42 + i * 49]], '#2a2622', 3);
    line(g, [[0, 60], [1280, 60]], '#1a1410', 10); iell(g, 760, 60, 26, 26, '#3a3530', { lw: 2 });
    const spin = t * 4; line(g, [[740, 66], [80, 290]], '#2a1a10', 6); line(g, [[780, 66], [120, 290]], '#2a1a10', 6); // the belt down to the drive
    g.save(); g.translate(100, 300); g.rotate(spin); iell(g, 0, 0, 38, 38, '#5a4a3a', { lw: 2 }); line(g, [[-38, 0], [38, 0]], '#2a1a10', 3); line(g, [[0, -38], [0, 38]], '#2a1a10', 3); g.restore();
    floorBoards(g, 400, 720, '#4a3020', '#24160c', 14);
    // John at the end of the line, behind it
    drawJohnStanding(g, 940, 520, t, { noCig: true });
    // the belt: a long table, the canvas moving over rollers
    poly(g, [[-20, 300], [1300, 300], [1300, 400], [-20, 400]], '#4a2e1a', { lw: 3 });
    g.fillStyle = '#b8a888'; g.fillRect(-20, 290, 1320, 26);
    for (let i = 0; i < 30; i++) { const x = ((i * 60 + t * (st.t - st.sort.t0 < 1.6 ? 480 : 0)) % 1320) - 20; line(g, [[x, 292], [x + 8, 314]], 'rgba(90,70,40,0.5)', 2); }
    for (let i = 0; i < 12; i++) iell(g, 40 + i * 110, 400, 16, 16, '#3a2a1a', { lw: 1.6 });
    // the crate and the bin
    poly(g, [[CRATE[0], CRATE[1] + 40], [CRATE[0] + CRATE[2], CRATE[1] + 40], [CRATE[0] + CRATE[2] - 16, CRATE[1] + CRATE[3]], [CRATE[0] + 16, CRATE[1] + CRATE[3]]], '#9a7a4a', { lw: 2.6 });
    for (let i = 0; i < 4; i++) line(g, [[CRATE[0] + 10, CRATE[1] + 80 + i * 40], [CRATE[0] + CRATE[2] - 10, CRATE[1] + 80 + i * 40]], 'rgba(60,40,20,0.5)', 1.6);
    txt(g, 'FOR DISPATCH', CRATE[0] + CRATE[2] / 2, CRATE[1] + 120, 20, '#3a2410', { bold: true });
    if (st.sort.i > 0) drawToyHorse(g, CRATE[0] + 100, CRATE[1] + 52, 0.9); if (st.sort.i > 1) drawToyTrain(g, CRATE[0] + 210, CRATE[1] + 54, 0.8);
    shape(g, [[BIN[0] + 20, BIN[1] + 30], [BIN[0] + BIN[2] - 20, BIN[1] + 30], [BIN[0] + BIN[2] - 40, BIN[1] + BIN[3]], [BIN[0] + 40, BIN[1] + BIN[3]]], '#4a4a48', { lw: 2.6 });
    iell(g, BIN[0] + BIN[2] / 2, BIN[1] + 30, BIN[2] / 2 - 20, 22, '#1e1a16', { lw: 2.4 });
    for (let i = 0; i < 3; i++) line(g, [[BIN[0] + 30 + i * 4, BIN[1] + 80 + i * 60], [BIN[0] + BIN[2] - 30 - i * 4, BIN[1] + 80 + i * 60]], '#2a2a28', 4);
    if (st.sort.i > 2) { g.save(); g.translate(BIN[0] + 130, BIN[1] + 36); g.rotate(1.2); drawBurntSoldier(g, 0, 0, 0.9); g.restore(); }
    // the toy on the belt, or in his hand
    if (st.sort.i < 3) {
      const toy = TOYS[st.sort.i], d = st.drag && st.drag.kind === 'carry' ? st.drag : null;
      const x = d ? d.x : -120 + ease((t - st.sort.t0) / 1.6) * 760, y = d ? d.y + 40 : 300;
      if (x > -100) toy.draw(g, x, y, 1.3);
    }
    lamp(g, 640, 300, 640, 0.45);
  },
  yard(g, st, t) {
    // a narrow yard behind the Works: brick walls in perspective, a gas lamp, wet cobbles
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#3a3c40'], [1, '#22201e']]); g.fillRect(0, 0, 1280, 720);
    poly(g, [[0, 0], [470, 160], [470, 470], [0, 720]], '#5a3424', { lw: 3 }); poly(g, [[1280, 0], [810, 160], [810, 470], [1280, 720]], '#4e2e20', { lw: 3 });
    for (let i = 0; i < 12; i++) { line(g, [[0, i * 60], [470, 160 + i * 26]], 'rgba(20,10,6,0.4)', 1.2); line(g, [[1280, i * 60], [810, 160 + i * 26]], 'rgba(20,10,6,0.4)', 1.2); }
    irect(g, 470, 160, 340, 310, '#2a2a2e', { lw: 2 }); g.fillStyle = 'rgba(200,190,160,0.25)'; g.fillRect(560, 170, 160, 120);
    poly(g, [[0, 720], [470, 470], [810, 470], [1280, 720]], lin(g, 0, 470, 0, 720, [[0, '#3a3836'], [1, '#55524c']]), { lw: 2 });
    for (let i = 0; i < 60; i++) { const v = hash(i * 1.7), u = hash(i * 9.1), y = 480 + v * v * 240, w = 20 + v * 40; iell(g, 640 + (u - 0.5) * (340 + v * 900), y, w, w * 0.35, 'rgba(90,86,80,0.6)', { lw: 0.8 }); }
    // the door into the Works
    poly(g, [[120, 640], [120, 280], [260, 250], [260, 560]], '#3a2616', { lw: 2.4 });
    // the gas lamp
    line(g, [[1000, 640], [1000, 200]], '#1a1a1a', 8); poly(g, [[976, 200], [1024, 200], [1016, 160], [984, 160]], 'rgba(255,214,140,0.9)', { lw: 1.6 }); lamp(g, 1000, 190, 420, 0.5);
    // the butts and the empty packets on the ground
    for (let i = 0; i < 40; i++) { const x = 220 + hash(i * 4.4) * 640, y = 600 + hash(i * 7.7) * 100; line(g, [[x, y], [x + 14, y - 3]], '#e9e4d4', 4, 0.2); iell(g, x, y + 1, 2, 2, '#8a6a4a', { lw: 0 }); }
    for (let i = 0; i < 4; i++) { g.save(); g.translate(300 + i * 140, 650 + (i % 2) * 30); g.rotate(i); iconCigs(g, 0, 0, 1); shade(g, 0); g.restore(); }
    // the people
    const out = st.f.johnOut ? Math.min(1, (t - st.f.johnOut) / 1.4) : 0;
    if (out < 1) { g.save(); g.globalAlpha = 1 - out; drawJohnStanding(g, 460 - out * 200, 640, t, { noCig: !!st.f.stubbed }); g.restore(); if (!st.f.stubbed) drawSmoke(g, 460 + 60, 640 - 300, t, tune.smokeAmount); }
    if (st.f.paulIn) {
      const inK = Math.min(1, (t - st.f.paulIn) / 1.6), outK = st.f.paulOut ? Math.min(1, (t - st.f.paulOut) / 1.6) : 0;
      const x = 1340 - inK * 560 + outK * 600;
      if (x < 1340) drawPaul(g, x, 650, t, { flip: !outK, walk: inK < 1 || (outK > 0 && outK < 1), s: 1.3 });
    }
    if (!st.f.packTaken) { g.save(); g.translate(830, 640); g.rotate(-0.3); iconCigs(g, 0, 0, 1.6); g.restore(); }
    drawRain(g, 470, 0, 340, 470, t, tune.rainAmount, 'rgba(200,210,220,0.25)');
  },
  benchLetter(g, st, t) {
    g.drawImage(roomBg('factory', BG_SCALE), 860 * BG_SCALE, 160 * BG_SCALE, 420 * BG_SCALE, 236 * BG_SCALE, 0, 0, 1280, 720);
    shade(g, 0.35);
    g.save(); g.translate(330, 620); g.scale(1.4, 1.4); drawJohnSeated(g, 0, 0, t, { noCig: true }); g.restore();
    irect(g, 420, 520, 880, 50, '#6a4428', { lw: 3 }); irect(g, 420, 570, 880, 160, '#4a2e1a', { lw: 3 });
    drawToyHorse(g, 1000, 520, 1); drawToyTrain(g, 1160, 520, 0.9);
    if (st.f.mgrIn) { const k = Math.min(1, (t - st.f.mgrIn) / 1.8); drawForeman(g, 1380 - k * 420, 780, t, { s: 1.6 }); }
    if (st.f.letterGiven) { g.save(); g.translate(640, 540); g.rotate(-0.06); irect(g, -70, -36, 140, 72, '#e6dcc4', { lw: 2 }); poly(g, [[-70, -36], [0, 6], [70, -36]], null, { lw: 1.4, stroke: '#8a7a5a' }); iell(g, 0, 4, 14, 14, '#9a1a14', { lw: 1.6 }); g.restore(); }
    lamp(g, 640, 400, 600, 0.4);
  },
  letterClose(g, st, t) {
    closeBack(g, '#2a1a10'); woodGrain(g, 0, 0, 1280, 720, '#000', 0.2);
    const open = st.f.letterOpen ? Math.min(1, (t - st.f.letterOpen) / 0.8) : 0;
    if (open < 1) {
      g.save(); g.globalAlpha = 1 - open;
      irect(g, 300, 160, 680, 420, '#e6dcc4', { lw: 2.6 }); poly(g, [[300, 160], [640, 380], [980, 160]], '#ddd0b0', { lw: 2 });
      const p = st.dragP.seal || 0;
      g.save(); g.translate(640, 330 + p * 60); g.rotate(p * 0.6); shape(g, ellPts(0, 0, 44, 40, 14), '#9a1a14', { lw: 2 }); iell(g, 0, 0, 28, 26, '#7a1410', { lw: 1.4 }); txt(g, 'T', 0, 2, 26, '#c84a3a', { bold: true }); g.restore();
      txt(g, 'Mr. J. Smith, Inspection', 640, 520, 24, '#24305a', { font: HAND });
      g.restore();
    }
    if (open > 0) {
      g.save(); g.globalAlpha = open; g.translate(640, 360); g.rotate(-0.02);
      irect(g, -330, -320, 660, 640, lin(g, 0, -320, 0, 320, [[0, '#ece0bc'], [1, '#d8c69c']]), { lw: 2.4 });
      txt(g, 'THE ST. AUBIN TOY WORKS', 0, -270, 24, '#3a3a50', { bold: true });
      line(g, [[-200, -246], [200, -246]], '#3a3a50', 1.2);
      ['Dear Mr. Smith,', '', 'The Company thanks you for a lifetime of faithful work.', 'Owing to the present state of trade, the Works must', 'reduce its hands and replace hand work with machinery.', '', 'Your employment ends on Saturday next.', '', 'Yours faithfully,', 'H. Whitcombe, Manager'].forEach((s, i) =>
        txt(g, s, -280, -200 + i * 40, 24, '#24305a', { align: 'left', font: HAND }));
      g.restore();
    }
    lamp(g, 640, 360, 600, 0.35);
  },
});

// ---- Shots ----------------------------------------------------------------------------------------
Object.assign(SHOTS, {
  inspector(g, st, t) { // John at the end of the line: the faded uniform, the name, the red eyes
    g.fillStyle = '#2a1c12'; g.fillRect(0, 0, 1280, 720);
    soft(g, 10, () => { for (let i = 0; i < 6; i++) { const x = ((i * 260 + t * 120) % 1500) - 200; drawToyHorse(g, x, 640, 1.4); } });
    shape(g, [[260, 800], [300, 560], [470, 480], [810, 480], [980, 560], [1020, 800]], '#5e5a52', { lw: 3 }); // the faded uniform
    shape(g, [[560, 480], [720, 480], [690, 620], [590, 620]], PAL.shirt, { lw: 2.2 });
    irect(g, 760, 560, 110, 40, '#efe6cc', { lw: 1.6 }); txt(g, 'JOHN', 815, 581, 22, '#3a2410', { bold: true }); // the name sewn on
    drawOldFace(g, 640, 330, 2.8, 0);
    [[-20, -16], [20, -16]].forEach(([ex, ey]) => iell(g, 640 + ex * 2.8, 330 + ey * 2.8, 22, 12, 'rgba(180,60,40,0.35)', { lw: 0, stroke: false })); // red-rimmed eyes
    lamp(g, 900, 200, 700, 0.4);
    letterbox(g);
  },
  binSoldier(g, st, t) { // the burnt soldier, thrown away
    g.fillStyle = '#1a1612'; g.fillRect(0, 0, 1280, 720);
    iell(g, 640, 420, 520, 300, '#2a2622', { lw: 4 }); iell(g, 640, 420, 480, 270, '#14100c', { lw: 2 });
    for (let i = 0; i < 30; i++) { const x = 260 + hash(i * 2.2) * 760, y = 260 + hash(i * 4.9) * 300; line(g, [[x, y], [x + 40 * hash(i), y + 10]], i % 2 ? '#5a4a3a' : '#6a5a40', 6); }
    const k = ease(t / 1.2);
    g.save(); g.translate(640, 300 + k * 120); g.rotate(1.3 - k * 0.2); drawBurntSoldier(g, 0, 0, 3.4); g.restore();
    lamp(g, 640, 300, 600, 0.35);
    letterbox(g);
  },
  letterRage(g, st, t) { // he slams the letter on the bench
    const flash = Math.max(0, 1 - Math.abs(t - 0.9) * 1.5), shake = Math.sin(t * 50) * flash * 8;
    cornerBg(g); shade(g, 0.45);
    drawForeman(g, 1060, 900, t, { s: 2.2 });
    g.save(); g.translate(shake, 0);
    shape(g, [[100, 800], [140, 560], [300, 470], [560, 470], [700, 560], [740, 800]], '#3b3029', { lw: 3 });
    drawAngryFace(g, 420, 330, 2.6, 1, t);
    const down = ease((t - 0.4) / 0.5);
    poly(g, [[0, 760], [0, 620], [1280, 600], [1280, 760]], '#5a3a24', { lw: 3 });
    g.save(); g.translate(760, 630); g.rotate(-0.08); irect(g, -110, -40, 220, 80, '#ece0bc', { lw: 2 }); for (let i = 0; i < 4; i++) line(g, [[-90, -20 + i * 14], [80, -22 + i * 14]], 'rgba(36,48,90,0.5)', 1.4); g.restore();
    iell(g, 760, 420 + down * 190, 54, 42, PAL.skin, { lw: 2.6 }); line(g, [[700, 800], [740, 440 + down * 190]], PAL.shirt, 40, 0.4);
    g.restore();
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(220,90,60,${0.2 + flash * 0.3})`; g.fillRect(0, 0, 1280, 720); g.restore();
    letterbox(g);
  },
});

// ---- Hints for the opening, the Works and the map --------------------------------------------------
function hintTown(st) {
  const r = st.room, f = st.f;
  if (st.map) {
    if (st.mapGoal) { const [item, place] = { factory: ['soldier', 'the Toy Works'], hospital: ['cigs', 'the hospital'], house: ['register', "John's House"], cemetery: ['bouquet', 'the cemetery'] }[st.mapGoal]; return ['map' + st.mapGoal, ['Something he carries belongs somewhere on the map.', `The place that glows a little: ${place}.`, `Drag ${ITEMS[item].name.toLowerCase()} from the bar on the left onto ${place}.`]]; }
    if (st.trail && st.trail.view === 'house' && st.stage !== 'final') return ['mapTrail', ['Follow the paw prints.', 'They lead to the garden.', 'Click the Tulip Garden.']];
    if (st.stage === 'night' && !hasItem(st, 'safeKey')) return ['mapNight', ['Where do the paw prints go?', 'Out of the house, to the cemetery.', "Click The Town if you see the house, then click the cemetery."]];
    return null;
  }
  if (r === 'grave') return f.soldierTaken ? ['g1', ['The soldier came from somewhere.', 'Open the map.', 'Press M (or the Map button), then drag the soldier onto the Toy Works.']] : ['g0', ['Something lies at the foot of the stone.', 'Bottom right of the stone.', 'Click the little wooden soldier.']];
  if (r === 'sortLine') return st.sort.i < 2 ? ['s0', ['Look at the toy: is it well made?', 'Good toys go to the crate on the left.', 'Drag the toy from the belt into the crate on the left.']] : ['s1', ['Look at this one closely.', 'It is burnt. It cannot be sold.', 'Drag it into the bin on the right.']];
  if (r === 'yard') return ['y', ['He left something behind.', 'On the ground, by the lamp.', 'Click the crushed packet on the ground.']];
  if (r === 'benchLetter' || r === 'letterClose') return f.letterOpen ? ['l1', ['Read it.', 'Click the letter when you have read it.', 'Click anywhere on the letter.']] : r === 'benchLetter' ? ['l0', ['A letter for him.', 'Look closer at it.', 'Double-click the letter on the bench.']] : ['l2', ['It is sealed.', 'Break the red wax.', 'Drag the seal downwards.']];
  return null;
}
