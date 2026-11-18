// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-13
// paint.js: the chapter's places and its new people, painted in code in the brief's look
// (French old style: inked outlines, sepia and rust, faded teal, paper grain).
// Backgrounds are painted once into an offscreen canvas (roomBg); live parts are in story.js.
'use strict';

// ---- Backgrounds -------------------------------------------------------------------------
const ROOM_W = 1280, ROOM_H = 720;
const _bgCache = {};
function roomBg(name, scale) {
  const k = name + '@' + scale;
  if (_bgCache[k]) return _bgCache[k];
  const c = document.createElement('canvas'); c.width = Math.round(ROOM_W * scale); c.height = Math.round(ROOM_H * scale);
  const g = c.getContext('2d'); g.scale(scale, scale); _shapeSeed = 11;
  PAINTERS[name](g);
  _bgCache[k] = c; return c;
}
function wallpaper(g, x, y, w, h, base, stripe) {
  g.fillStyle = base; g.fillRect(x, y, w, h);
  g.save(); g.globalAlpha = 0.3; g.strokeStyle = stripe; g.lineWidth = 2;
  for (let sx = x + 20; sx < x + w; sx += 46) {
    g.beginPath(); g.moveTo(sx, y); g.lineTo(sx, y + h); g.stroke();
    for (let sy = y + 30; sy < y + h; sy += 70) { g.beginPath(); g.ellipse(sx + 23, sy, 6, 10, 0, 0, Math.PI * 2); g.stroke(); }
  }
  g.restore();
  dabs(g, x, y, w, h, '#000', 120, 30, 0.08, true);
}
function floorBoards(g, y0, y1, c0, c1, n = 14) {
  g.fillStyle = lin(g, 0, y0, 0, y1, [[0, c0], [1, c1]]); g.fillRect(0, y0, 1280, y1 - y0);
  for (let i = 0; i <= n; i++) { const x = (i / n) * 1280; line(g, [[640 + (x - 640) * 0.55, y0], [x * 1.25 - 160, y1]], 'rgba(20,12,6,0.45)', 1.6, 0.6); }
  woodGrain(g, 0, y0, 1280, y1 - y0, '#000', 0.12);
}
function archWindow(g, x, y, w, h, sky = ['#8f9a9a', '#5d6a6c']) {
  shape(g, [[x, y + h], [x, y + w / 2], [x + w * 0.15, y + w * 0.15], [x + w / 2, y], [x + w * 0.85, y + w * 0.15], [x + w, y + w / 2], [x + w, y + h]], lin(g, 0, y, 0, y + h, [[0, sky[0]], [1, sky[1]]]), { lw: 3 });
  line(g, [[x + w / 2, y + 6], [x + w / 2, y + h]], '#2a2622', 4); line(g, [[x + 4, y + h * 0.55], [x + w - 4, y + h * 0.55]], '#2a2622', 4);
}
function shelfOfToys(g, x, y, w) {
  irect(g, x, y, w, 10, '#4a3020', { lw: 2 });
  for (let i = 0; i < w / 44; i++) {
    const tx = x + 20 + i * 44, k = i % 4;
    if (k === 0) { shape(g, [[tx - 14, y], [tx + 14, y], [tx + 16, y - 18], [tx + 8, y - 30], [tx - 12, y - 22]], '#8a4b2a', { lw: 1.4 }); } // a rocking horse
    else if (k === 1) { irect(g, tx - 8, y - 30, 16, 30, '#9a2c22', { lw: 1.4 }); iell(g, tx, y - 36, 6, 6, '#e3c4a0', { lw: 1.2 }); } // a soldier
    else if (k === 2) { shape(g, [[tx - 10, y], [tx + 10, y], [tx + 6, y - 24], [tx - 6, y - 24]], '#7f9a92', { lw: 1.4 }); iell(g, tx, y - 30, 7, 7, '#e8d0b8', { lw: 1.2 }); } // a doll
    else { iell(g, tx, y - 12, 12, 12, '#b58a3c', { lw: 1.4 }); } // a ball
  }
}

const PAINTERS = {
  // The toy factory: a long brick hall, grey light from tall windows, belts overhead.
  factory(g) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#2e2620'], [0.6, '#4a3a2c'], [1, '#2a1f16']]); g.fillRect(0, 0, 1280, 720);
    for (let r = 0; r < 28; r++) for (let c = 0; c < 34; c++) { if (hash(r * 31 + c) > 0.55) irect(g, c * 40 + (r % 2) * 20 - 20, r * 18, 36, 14, `rgba(${110 + hash(r + c) * 40},${60 + hash(c) * 20},40,0.18)`, { lw: 0.6, stroke: 'rgba(0,0,0,0.25)' }); }
    [80, 330, 580, 830].forEach(x => { // tall rectangular factory windows of many small panes
      irect(g, x - 8, 32, 166, 278, '#8a7a62', { lw: 2.4 });
      g.fillStyle = lin(g, 0, 40, 0, 300, [[0, '#8f9a9a'], [1, '#5d6a6c']]); g.fillRect(x, 40, 150, 262);
      for (let q = 1; q < 5; q++) line(g, [[x + q * 30, 40], [x + q * 30, 302]], '#2a2622', 2.4, 0.2);
      for (let q = 1; q < 7; q++) line(g, [[x, 40 + q * 37.4], [x + 150, 40 + q * 37.4]], '#2a2622', 2.4, 0.2);
      irect(g, x - 12, 302, 174, 12, '#9a8a70', { lw: 2 }); // the sill
    });
    g.save(); g.globalCompositeOperation = 'screen';
    [80, 330, 580, 830].forEach(x => { g.fillStyle = lin(g, x, 300, x + 200, 640, [[0, 'rgba(190,200,190,0.18)'], [1, 'rgba(190,200,190,0)']]); g.beginPath(); g.moveTo(x, 300); g.lineTo(x + 150, 300); g.lineTo(x + 330, 640); g.lineTo(x + 120, 640); g.closePath(); g.fill(); });
    g.restore();
    // the shaft and belts overhead
    line(g, [[0, 340], [1280, 330]], '#1a1410', 9);
    [140, 400, 660, 920].forEach(x => { iell(g, x, 336, 18, 18, '#3a302a', { lw: 2 }); line(g, [[x - 14, 340], [x - 30, 520]], '#2a2016', 3); line(g, [[x + 14, 340], [x + 30, 520]], '#2a2016', 3); });
    floorBoards(g, 560, 720, '#4a3524', '#251a10', 18);
    // rows of benches, workers' places
    [[60, 520], [320, 520], [580, 520]].forEach(([x, y]) => {
      irect(g, x, y, 220, 22, '#5a3a24', { lw: 2.2 }); line(g, [[x + 10, y + 22], [x + 6, y + 110]], '#3a2616', 6); line(g, [[x + 210, y + 22], [x + 214, y + 110]], '#3a2616', 6);
      for (let i = 0; i < 4; i++) iell(g, x + 30 + i * 52, y - 6, 12, 6, ['#8a4b2a', '#b58a3c', '#7f9a92', '#9a2c22'][i], { lw: 1.4 });
    });
    shelfOfToys(g, 40, 420, 470); shelfOfToys(g, 560, 420, 300);
    // John's corner: a smaller bench by the far wall, a lamp, a calendar
    irect(g, 900, 100, 380, 460, 'rgba(30,22,16,0.55)', { lw: 0, stroke: false });
    irect(g, 1090, 450, 190, 24, '#5a3a24', { lw: 2.4 }); line(g, [[1100, 474], [1096, 600]], '#3a2616', 7); line(g, [[1270, 474], [1274, 600]], '#3a2616', 7);
    shelfOfToys(g, 1100, 300, 170);
    irect(g, 960, 170, 70, 90, PAL.paper, { lw: 1.6 }); irect(g, 960, 170, 70, 18, '#8a3a2a', { lw: 1.2 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) line(g, [[966 + c * 13, 196 + r * 15], [974 + c * 13, 204 + r * 15]], '#7a2a1a', 1.2, 0.3);
    txt(g, 'MARCH', 995, 179, 10, PAL.cream, { bold: true });
    dabs(g, 0, 0, 1280, 720, '#d8a868', 120, 40, 0.04, true);
  },

  // The hospital corridor: cold teal walls, doors in a row, one gas lamp.
  corridor(g) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#2f3d3c'], [0.62, '#566a66'], [1, '#2a2a26']]); g.fillRect(0, 0, 1280, 720);
    // perspective: the far end of the corridor
    poly(g, [[520, 230], [760, 230], [760, 470], [520, 470]], '#1e2826', { lw: 2 });
    poly(g, [[0, 0], [520, 230], [520, 470], [0, 720]], '#3e504c', { lw: 2.4 });
    poly(g, [[1280, 0], [760, 230], [760, 470], [1280, 720]], '#45574f', { lw: 2.4 });
    poly(g, [[0, 720], [520, 470], [760, 470], [1280, 720]], lin(g, 0, 470, 0, 720, [[0, '#3a2e22'], [1, '#5a4430']]), { lw: 2.4 });
    for (let i = 0; i < 8; i++) { const x = 520 + i * 34; line(g, [[x, 470], [(x - 640) * 5.3 + 640, 720]], 'rgba(0,0,0,0.3)', 1.4, 0.4); }
    poly(g, [[0, 0], [1280, 0], [760, 230], [520, 230]], '#26302e', { lw: 2.4 });
    // wainscot line
    line(g, [[0, 470], [520, 380]], '#2a3432', 4); line(g, [[1280, 470], [760, 380]], '#2a3432', 4);
    // doors on the left wall, the near one is ours (live: drawn in story.js)
    poly(g, [[300, 190], [400, 232], [400, 470], [300, 520]], '#4a3a2a', { lw: 2.2 });
    poly(g, [[450, 250], [495, 264], [495, 455], [450, 470]], '#3a2e22', { lw: 2 });
    // a bench and a stretcher on the right
    poly(g, [[900, 560], [1120, 610], [1120, 630], [900, 580]], '#5a4430', { lw: 2 });
    poly(g, [[820, 500], [960, 520], [960, 536], [820, 514]], '#c9c4b2', { lw: 1.8 });
    // the gas lamp
    line(g, [[640, 0], [640, 90]], '#1a1a1a', 3); iell(g, 640, 108, 16, 22, 'rgba(255,220,150,0.85)', { lw: 1.6 });
    txt(g, 'WARD  III', 640, 300, 22, '#a8b8b0', { bold: true });
    dabs(g, 0, 0, 1280, 720, '#ffffff', 80, 30, 0.04, true);
  },

  // The ward: John's bed, the drip stand, a rainy window.
  ward(g) {
    wallpaper(g, 0, 0, 1280, 520, '#5d716c', '#3a4a46');
    floorBoards(g, 520, 720, '#4a3a2a', '#2a2016');
    irect(g, 0, 500, 1280, 22, '#3a2a1e', { lw: 2 });
    irect(g, 760, 70, 280, 300, '#2a2622', { lw: 3 });
    g.fillStyle = lin(g, 0, 80, 0, 360, [[0, '#7d8a8c'], [1, '#4a5658']]); g.fillRect(774, 84, 252, 272);
    line(g, [[900, 84], [900, 356]], '#2a2622', 5); line(g, [[774, 220], [1026, 220]], '#2a2622', 5);
    // the iron bed
    line(g, [[200, 300], [200, 640]], '#2a2a2a', 7); line(g, [[250, 300], [250, 640]], '#2a2a2a', 5);
    line(g, [[196, 310], [254, 310]], '#2a2a2a', 5); line(g, [[196, 380], [254, 380]], '#2a2a2a', 4);
    line(g, [[770, 400], [770, 640]], '#2a2a2a', 7); line(g, [[766, 410], [800, 410]], '#2a2a2a', 4); line(g, [[800, 400], [800, 640]], '#2a2a2a', 5);
    irect(g, 200, 470, 600, 70, '#d9d6c8', { lw: 2.4 }); // the mattress edge
    iell(g, 320, 450, 80, 34, '#ece8da', { lw: 2.2 }); // the pillow
    // a chair, a small cabinet with a jug
    irect(g, 1080, 420, 120, 120, '#5a4430', { lw: 2.2 });
    shape(g, [[1110, 420], [1116, 380], [1140, 372], [1160, 380], [1166, 420]], '#c9c4b2', { lw: 1.8 });
    txt(g, 'Ward III · Bed 7', 160, 110, 18, '#cdd8d0', { italic: true });
  },

  // The doctor's office: desk, lamp, shelves of files, a window with blinds.
  office(g) {
    wallpaper(g, 0, 0, 1280, 500, '#6a5a44', '#4a3e2e');
    floorBoards(g, 500, 720, '#5a3e28', '#2a1c12');
    irect(g, 60, 80, 250, 380, '#3a2a1e', { lw: 2.6 });
    for (let s = 0; s < 4; s++) { line(g, [[66, 160 + s * 90], [304, 160 + s * 90]], '#2a1c12', 5); for (let b = 0; b < 9; b++) irect(g, 74 + b * 25, 110 + s * 90, 20, 48, ['#7a3a2a', '#4a5a4a', '#8a6a3a', '#3a3a4a'][b % 4], { lw: 1 }); }
    irect(g, 900, 70, 260, 240, '#2a2622', { lw: 3 });
    for (let i = 0; i < 12; i++) irect(g, 912, 82 + i * 19, 236, 12, 'rgba(200,190,160,0.75)', { lw: 0.8 });
    irect(g, 560, 90, 120, 90, '#c9b88f', { lw: 2 }); txt(g, 'Dr. A. Hale', 620, 120, 14, '#3a2a1e', { italic: true }); txt(g, 'Physician', 620, 145, 12, '#3a2a1e', { italic: true });
    // the desk
    poly(g, [[300, 450], [980, 450], [1040, 520], [240, 520]], lin(g, 0, 450, 0, 520, [[0, '#7a4a2e'], [1, '#5a341e']]), { lw: 2.6 });
    irect(g, 260, 520, 760, 150, '#4a2c1a', { lw: 2.6 }); woodGrain(g, 262, 522, 756, 146, '#1a0e06', 0.25);
    irect(g, 560, 560, 160, 70, '#3a2214', { lw: 2 }); iell(g, 640, 595, 8, 6, PAL.brass, { lw: 1.2 });
    // the lamp on the desk
    line(g, [[880, 450], [880, 380]], '#2a2a2a', 4); shape(g, [[850, 380], [910, 380], [896, 350], [864, 350]], '#3a5a3a', { lw: 2 });
  },

  // The treasury of memories: a dark room, its walls covered with pinned photographs.
  treasury(g) {
    g.fillStyle = rad(g, 640, 360, 60, 800, [[0, '#3a2a1c'], [1, '#0e0906']]); g.fillRect(0, 0, 1280, 720);
    dabs(g, 0, 0, 1280, 720, '#d8a868', 160, 30, 0.04, true);
    for (let i = 0; i < 46; i++) {
      const x = 60 + hash(i * 3.1) * 1160, y = 50 + hash(i * 7.3) * 560, w = 60 + hash(i) * 50, h = w * (0.8 + hash(i * 2) * 0.4), r = (hash(i * 5) - 0.5) * 0.4;
      if (Math.hypot(x - 640, y - 330) < 140 || Math.hypot(x - 960, y - 260) < 110) continue; // the places the live photos hang
      g.save(); g.translate(x, y); g.rotate(r);
      irect(g, -w / 2, -h / 2, w, h, '#d9ccb0', { lw: 1.4 });
      g.fillStyle = lin(g, 0, -h / 2, 0, h / 2, [[0, '#8a7a5e'], [1, '#4a3e2e']]); g.fillRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 18);
      iell(g, (hash(i * 9) - 0.5) * w * 0.3, -2, w * 0.12, w * 0.14, 'rgba(40,30,20,0.6)', { lw: 0, stroke: false });
      iell(g, 0, -h / 2 + 3, 3, 3, '#8a2a1a', { lw: 0.6 });
      g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 1280, 720);
  },

  // John's bedroom, three walls and the ceiling. The main view: the bed, the window, the rug.
  bedMain(g) {
    wallpaper(g, 0, 0, 1280, 480, '#6b5a3e', '#4a3c28');
    floorBoards(g, 480, 720, '#5a3e26', '#2e1e10', 16);
    irect(g, 0, 466, 1280, 20, '#3a2614', { lw: 2 });
    // window, dawn behind rain
    irect(g, 840, 70, 250, 290, '#3a2614', { lw: 3 });
    g.fillStyle = lin(g, 0, 80, 0, 350, [[0, '#9aa4a0'], [1, '#c9b58f']]); g.fillRect(852, 82, 226, 266);
    line(g, [[965, 82], [965, 348]], '#3a2614', 6); line(g, [[852, 214], [1078, 214]], '#3a2614', 6);
    shape(g, [[820, 60], [860, 60], [870, 380], [826, 400]], '#6a3a2a', { lw: 2 }); shape(g, [[1070, 60], [1110, 60], [1104, 400], [1062, 380]], '#6a3a2a', { lw: 2 });
    // the door and the coat hook on the far right
    irect(g, 1150, 120, 130, 360, '#4a2e1a', { lw: 2.6 }); iell(g, 1165, 310, 6, 6, PAL.brass, { lw: 1.2 });
    // the bed: carved wooden head, a heavy quilt
    shape(g, [[90, 470], [90, 210], [140, 180], [280, 170], [330, 200], [330, 470]], '#5a341e', { lw: 2.6 });
    woodGrain(g, 96, 200, 230, 260, '#1a0e06', 0.25);
    irect(g, 90, 400, 640, 120, '#4a2c1a', { lw: 2.4 });
    line(g, [[710, 400], [714, 560]], '#3a2214', 8);
    // the nightstand: a bottle, a glass
    irect(g, 740, 400, 90, 110, '#4a2e1a', { lw: 2.2 }); irect(g, 734, 392, 102, 12, '#5a3a24', { lw: 2 });
    shape(g, [[770, 392], [790, 392], [790, 350], [784, 336], [784, 318], [776, 318], [776, 336], [770, 350]], 'rgba(70,90,60,0.9)', { lw: 1.6 });
    // a mirror
    iell(g, 520, 170, 70, 90, '#3a2614', { lw: 2.6 }); iell(g, 520, 170, 58, 78, lin(g, 0, 90, 0, 250, [[0, '#9aa7a8'], [1, '#5a6668']]), { lw: 1.6 });
  },
  bedLeft(g) {
    wallpaper(g, 0, 0, 1280, 480, '#665537', '#463822');
    floorBoards(g, 480, 720, '#5a3e26', '#2e1e10', 16);
    irect(g, 0, 466, 1280, 20, '#3a2614', { lw: 2 });
    // the tall bookcase
    irect(g, 120, 60, 420, 420, '#4a2c1a', { lw: 2.8 }); woodGrain(g, 124, 64, 412, 412, '#1a0e06', 0.2);
    [180, 300].forEach(y => irect(g, 130, y, 400, 12, '#3a2214', { lw: 2 }));
    for (let b = 0; b < 15; b++) irect(g, 140 + b * 25, 100, 21, 80, ['#6a2a22', '#3a4a3a', '#7a5a2a', '#2a2a3a', '#5a4a3a'][b % 5], { lw: 1.2 });
    for (let b = 0; b < 6; b++) irect(g, 380 + b * 24, 382, 20, 92, ['#6a2a22', '#3a4a3a', '#7a5a2a'][b % 3], { lw: 1.2 });
    // the workbench he keeps at home
    irect(g, 640, 360, 520, 24, '#5a3a24', { lw: 2.4 }); line(g, [[660, 384], [656, 560]], '#3a2616', 8); line(g, [[1140, 384], [1144, 560]], '#3a2616', 8);
    line(g, [[700, 240], [1100, 240]], '#3a2616', 4);
    [[730, 'saw'], [800, 'plane'], [880, 'chisel'], [940, 'chisel'], [1010, 'pliers']].forEach(([x, k]) => {
      line(g, [[x, 240], [x, 252]], '#8a8a80', 2);
      if (k === 'saw') shape(g, [[x - 30, 252], [x + 30, 252], [x + 30, 290], [x - 30, 274]], '#9a9a90', { lw: 1.6 });
      else if (k === 'plane') irect(g, x - 26, 252, 52, 22, '#7a5a3a', { lw: 1.6 });
      else if (k === 'chisel') { line(g, [[x, 252], [x, 300]], '#9a9a90', 4); irect(g, x - 5, 252, 10, 22, '#7a5a3a', { lw: 1.2 }); }
      else { line(g, [[x - 6, 252], [x - 2, 300]], '#5a5a5a', 3); line(g, [[x + 6, 252], [x + 2, 300]], '#5a5a5a', 3); }
    });
    // a lamp on the bench
    line(g, [[1090, 360], [1090, 300]], '#2a2a2a', 4); shape(g, [[1060, 300], [1120, 300], [1106, 270], [1074, 270]], '#3a4a3a', { lw: 2 });
  },
  bedRight(g) {
    wallpaper(g, 0, 0, 1280, 480, '#6b5a3e', '#4a3c28');
    floorBoards(g, 480, 720, '#5a3e26', '#2e1e10', 16);
    irect(g, 0, 466, 1280, 20, '#3a2614', { lw: 2 });
    // the fireplace
    irect(g, 120, 250, 360, 230, '#5a4a3a', { lw: 2.8 }); irect(g, 100, 236, 400, 22, '#4a3a2a', { lw: 2.4 });
    irect(g, 190, 320, 220, 160, '#1a120c', { lw: 2.4 });
    for (let i = 0; i < 5; i++) iell(g, 250 + i * 25, 470, 16, 6, '#3a2a1e', { lw: 1 });
    // an armchair
    shape(g, [[560, 560], [560, 400], [600, 360], [720, 360], [760, 400], [760, 560]], '#5a3a3a', { lw: 2.6 });
    irect(g, 540, 470, 240, 90, '#6a4444', { lw: 2.4 });
    // the stand the safe sits on
    irect(g, 900, 470, 260, 80, '#3a2614', { lw: 2.4 });
    // two small pictures
    irect(g, 560, 150, 90, 110, '#3a2614', { lw: 2.2 }); g.fillStyle = '#9a8a6a'; g.fillRect(570, 160, 70, 90);
    shape(g, [[575, 240], [600, 200], [615, 222], [635, 190], [635, 245]], '#5a6a5a', { lw: 1 });
  },
  bedUp(g) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#5a4a36'], [1, '#3a2c1e']]); g.fillRect(0, 0, 1280, 720);
    dabs(g, 0, 0, 1280, 720, '#e6d6ad', 140, 50, 0.07);
    for (let i = 0; i < 5; i++) { const y = 60 + i * 150; irect(g, -10, y, 1300, 40, '#3a2414', { lw: 2.4 }); woodGrain(g, 0, y + 2, 1280, 36, '#000', 0.3); }
    line(g, [[300, 300], [380, 360], [360, 420], [460, 470]], 'rgba(30,20,10,0.6)', 1.6, 1.2); // a crack in the plaster
    line(g, [[640, 360], [640, 420]], '#2a2a2a', 3); // the lamp's chain
  },

  // The map: the village and the country around it, drawn on old paper.
  map(g) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#e6d6ad'], [1, '#cdb88a']]); g.fillRect(0, 0, 1280, 720);
    dabs(g, 0, 0, 1280, 720, '#8a6a3a', 200, 60, 0.08);
    // the sea on the right edge
    shape(g, [[1080, 0], [1280, 0], [1280, 720], [1010, 720], [1060, 520], [1020, 360], [1090, 180]], '#9fb3ad', { lw: 2 });
    for (let i = 0; i < 10; i++) line(g, [[1110 + (i % 3) * 40, 60 + i * 66], [1140 + (i % 3) * 40, 54 + i * 66], [1170 + (i % 3) * 40, 60 + i * 66]], '#5a7a74', 1.4);
    // the river and the road
    line(g, [[0, 420], [200, 380], [420, 440], [640, 400], [860, 460], [1030, 430]], '#7f9a92', 9, 2);
    line(g, [[100, 700], [260, 560], [420, 520], [600, 300], [820, 240], [980, 120]], '#a07a4a', 4, 2);
    // hills and trees
    for (let i = 0; i < 26; i++) { const x = 60 + hash(i * 4.1) * 900, y = 60 + hash(i * 6.7) * 600; if (Math.hypot(x - 600, y - 300) < 120) continue; iell(g, x, y, 12, 10, '#7a8a5a', { lw: 1.2 }); line(g, [[x, y + 10], [x, y + 18]], '#4a3a2a', 1.6); }
    txt(g, 'The Country of St. Aubin', 640, 46, 30, '#4a3220', { italic: true });
    // a compass rose
    g.save(); g.translate(1180, 640); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); poly(g, [[0, -40], [8, 0], [0, 8], [-8, 0]], i % 2 ? '#8a3a2a' : '#4a3220', { lw: 1.2 }); } g.restore();
  },
};

// ---- New people ---------------------------------------------------------------------------
// A factory worker in apron and cap. (x, y) is the feet. o.run makes the legs go; o.flip faces left.
function drawWorker(g, x, y, t, o = {}) {
  g.save(); g.translate(x, y); g.scale((o.flip ? -1 : 1) * (o.s || 1), o.s || 1);
  const run = o.run ? Math.sin(t * 12 + (o.ph || 0)) * 16 : 0, bob = o.run ? Math.abs(Math.sin(t * 12)) * 4 : Math.sin(t * 2 + (o.ph || 0)) * 1.5;
  line(g, [[-6, -70], [-10 + run, 0]], '#2a2420', 11); line(g, [[6, -70], [10 - run, 0]], '#2a2420', 11);
  g.translate(0, -bob);
  shape(g, [[-26, -70], [-24, -150], [-10, -178], [16, -178], [28, -150], [26, -70]], o.coat || '#4a4a52', { lw: 2.2 });
  shape(g, [[-18, -140], [18, -140], [20, -66], [-20, -66]], o.apron || '#b8a888', { lw: 1.8 });
  const arm = o.alarm ? -60 : o.run ? -run : 0;
  line(g, [[18, -168], [34, -120 + arm * 0.5], [30 + (o.alarm ? 10 : 0), -96 + arm]], o.coat || '#4a4a52', 10, 0.4);
  iell(g, 2, -198, 16, 19, PAL.skin, { lw: 2 });
  line(g, [[8, -200], [14, -200]], INK, 2);
  if (o.alarm) iell(g, 10, -188, 4, 5, '#3a1a10', { lw: 0.8 }); else line(g, [[4, -188], [12, -188]], INK, 1.6);
  shape(g, [[-18, -206], [-14, -222], [12, -224], [22, -208], [32, -204], [20, -202]], o.cap || '#3a3430', { lw: 2 });
  g.restore();
}
// The nurse: long dark dress, white apron and cap. (x, y) is the feet.
function drawNurse(g, x, y, t, o = {}) {
  g.save(); g.translate(x, y); if (o.flip) g.scale(-1, 1);
  const step = o.walk ? Math.sin(t * 6) * 8 : 0;
  shape(g, [[-40, 0], [-30, -150], [-18, -230], [18, -230], [30, -150], [44, 0]], '#2e3644', { lw: 2.4 });
  shape(g, [[-22, -200], [22, -200], [30, -40], [-26, -40]], '#e9e4d4', { lw: 2 });
  line(g, [[18, -222], [40, -170 + step], [30, -120]], '#2e3644', 12, 0.3);
  iell(g, 0, -256, 22, 26, '#dcb896', { lw: 2.2 });
  shape(g, [[-22, -266], [-12, -284], [14, -284], [22, -266], [12, -274], [-12, -274]], '#5a3a2a', { lw: 1.6 });
  shape(g, [[-18, -280], [18, -280], [14, -300], [-14, -300]], '#f0ece0', { lw: 1.6 });
  line(g, [[-8, -258], [-2, -258]], INK, 1.6); line(g, [[6, -258], [12, -258]], INK, 1.6);
  line(g, [[-4, -244], [6, -246]], '#7a3a2a', 1.8);
  g.restore();
}
// The registry officer behind his counter, head and shoulders. (x, y) is the counter top.
function drawOfficer(g, x, y, t) {
  g.save(); g.translate(x, y);
  shape(g, [[-70, 0], [-60, -90], [-20, -120], [20, -120], [60, -90], [70, 0]], '#2a2e36', { lw: 2.4 });
  shape(g, [[-14, -120], [14, -120], [10, -96], [-10, -96]], '#e9e4d4', { lw: 1.6 });
  iell(g, 0, -150, 30, 36, '#d8b896', { lw: 2.2 });
  shape(g, [[-24, -138], [0, -132], [24, -138], [16, -128], [0, -124], [-16, -128]], '#5a4a3a', { lw: 1.6 }); // moustache
  iell(g, -10, -158, 7, 7, 'rgba(220,235,240,0.5)', { lw: 1.4 }); iell(g, 10, -158, 7, 7, 'rgba(220,235,240,0.5)', { lw: 1.4 });
  shape(g, [[-30, -170], [-26, -186], [26, -186], [30, -170]], '#3a3a3a', { lw: 1.6 });
  g.restore();
}
// Young John at 25: the same nose, dark hair, no beard yet, a black armband. Head and chest.
function drawYoungJohn(g, x, y, s = 1, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  shape(g, [[-110, 160], [-96, 40], [-40, 10], [40, 10], [96, 40], [110, 160]], '#2a2420', { lw: 2.6 });
  shape(g, [[-20, 12], [20, 12], [10, 60], [-10, 60]], '#e9e4d4', { lw: 1.8 }); line(g, [[-6, 20], [0, 56], [6, 20]], '#1a1a1a', 4);
  shape(g, [[-104, 80], [-60, 76], [-58, 100], [-102, 104]], '#111', { lw: 1.6 }); // the black band
  iell(g, 0, -50, 56, 66, PAL.skin, { lw: 2.6 });
  shape(g, [[-56, -60], [-50, -110], [0, -126], [50, -110], [58, -60], [40, -90], [0, -100], [-40, -90]], '#2a1e16', { lw: 2.2 });
  shape(g, [[6, -54], [30, -16], [22, -8], [4, -14]], PAL.skinDark, { lw: 2 });
  const look = o.look || 0;
  iell(g, -20 + look, -52, 8, 5, '#f0ece0', { lw: 1.4 }); iell(g, 24 + look, -52, 8, 5, '#f0ece0', { lw: 1.4 });
  iell(g, -20 + look, -52, 3, 3, INK, { lw: 0.5 }); iell(g, 24 + look, -52, 3, 3, INK, { lw: 0.5 });
  line(g, [[-32, -66], [-10, -64]], '#2a1e16', 3); line(g, [[12, -64], [36, -66]], '#2a1e16', 3);
  line(g, [[-14, 2], [14, 2]], '#6a3a2a', 2);
  if (o.tear) iell(g, -24, -36 + o.tear * 30, 3, 4, 'rgba(200,220,235,0.85)', { lw: 0.8 });
  g.restore();
}
// Mary, young, in a long skirt and shawl. (x, y) is the floor. o.kneel lowers her to the boards.
function drawMary(g, x, y, t, o = {}) {
  g.save(); g.translate(x, y); g.scale(o.s || 1, o.s || 1); if (o.flip) g.scale(-1, 1);
  const k = o.kneel ? 1 : 0, by = k ? 70 : 0;
  if (!k) shape(g, [[-50, 0], [-30, -150], [30, -150], [54, 0]], '#5a6a7a', { lw: 2.4 });
  else shape(g, [[-70, 0], [-40, -80], [30, -80], [70, 0]], '#5a6a7a', { lw: 2.4 });
  g.translate(0, by);
  shape(g, [[-26, -150], [-30, -220], [-10, -244], [12, -244], [30, -220], [26, -150]], '#e6dcc4', { lw: 2 });
  shape(g, [[-34, -230], [34, -230], [40, -180], [-40, -180]], '#8a4a4a', { lw: 2 }); // the shawl
  const reach = o.reach ?? 0;
  line(g, [[26, -224], [50 + reach * 20, -170 + reach * 80], [56 + reach * 30, -130 + reach * 110]], '#8a4a4a', 11, 0.3);
  iell(g, 58 + reach * 30, -124 + reach * 110, 7, 6, '#e3c4a0', { lw: 1.4 });
  iell(g, 0, -272, 24, 28, '#e8ccaa', { lw: 2.2 });
  shape(g, [[-26, -270], [-22, -300], [0, -306], [22, -298], [26, -268], [16, -286], [-16, -286]], '#4a2e1a', { lw: 1.8 });
  iell(g, -4, -306, 14, 10, '#4a2e1a', { lw: 1.6 }); // the bun
  line(g, [[-10, -274], [-4, -274]], INK, 1.6); line(g, [[6, -274], [12, -274]], INK, 1.6);
  if (o.laugh) line(g, [[-8, -260], [0, -254], [8, -260]], '#8a3a2a', 2.2); else line(g, [[-6, -258], [6, -258]], '#8a3a2a', 1.8);
  g.restore();
}
// The cat. pose: sleep (a curl), sit, run.
function drawCat(g, x, y, t, pose = 'sleep', o = {}) {
  g.save(); g.translate(x, y); if (o.flip) g.scale(-1, 1);
  const c = '#3a3632';
  if (pose === 'sleep') {
    const b = Math.sin(t * 1.6) * 1.5;
    iell(g, 0, -18 - b * 0.5, 54, 24 + b, c, { lw: 2.2 });
    iell(g, 40, -20, 20, 16, c, { lw: 2 }); poly(g, [[30, -34], [36, -46], [42, -34]], c, { lw: 1.6 }); poly(g, [[44, -34], [52, -44], [54, -30]], c, { lw: 1.6 });
    line(g, [[34, -20], [40, -20]], '#e8d070', 1.4); line(g, [[-50, -10], [-20, 0], [30, -2]], c, 7, 0.4);
  } else if (pose === 'sit') {
    iell(g, 0, -34, 28, 34, c, { lw: 2.2 }); iell(g, 6, -78, 20, 18, c, { lw: 2 });
    poly(g, [[-6, -90], [-2, -106], [6, -92]], c, { lw: 1.6 }); poly(g, [[10, -92], [18, -106], [22, -88]], c, { lw: 1.6 });
    iell(g, 0, -80, 3, 4, '#e8d070', { lw: 0.6 }); iell(g, 14, -80, 3, 4, '#e8d070', { lw: 0.6 });
    line(g, [[-26, -6], [-50, -10], [-56, -30]], c, 6, 0.4);
  } else {
    const s = Math.sin(t * 20) * 12;
    iell(g, 0, -30, 46, 16, c, { lw: 2.2 }); iell(g, 46, -40, 18, 15, c, { lw: 2 });
    poly(g, [[40, -52], [46, -64], [52, -52]], c, { lw: 1.6 }); poly(g, [[54, -50], [62, -60], [62, -46]], c, { lw: 1.6 });
    line(g, [[30, -22], [40 + s, 0]], c, 6); line(g, [[-30, -22], [-40 - s, 0]], c, 6);
    line(g, [[-44, -34], [-70, -50 - s * 0.5]], c, 6, 0.4);
  }
  g.restore();
}
// John's wind-up mouse: grey felt, a brass key, and a tail or not.
function drawWindMouse(g, x, y, s = 1, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s); if (o.flip) g.scale(-1, 1);
  shape(g, [[-30, 0], [-26, -18], [0, -26], [24, -16], [36, 0]], '#8e8a83', { lw: 2 });
  iell(g, 8, -24, 8, 8, '#c9b8a8', { lw: 1.4 });
  iell(g, 32, -6, 2, 2, INK, { lw: 0.4 });
  line(g, [[-10, -24], [-14, -36]], PAL.brass, 3); shape(g, [[-14, -36], [-24, -42], [-6, -44]], PAL.brass, { lw: 1.4 }); // the key
  if (o.tail) line(g, [[-30, -4], [-50, -10], [-62, 0], [-74, -6]], '#6a5a4a', 2.4, 0.5);
  if (o.run) { const w = Math.sin(o.run * 30) * 3; iell(g, -14, 2 + w, 4, 4, '#2a2a2a', { lw: 0.6 }); iell(g, 18, 2 - w, 4, 4, '#2a2a2a', { lw: 0.6 }); }
  g.restore();
}
// The safe: black iron, studs, a keyhole and a brass dial. (x, y) top left, s scale.
function drawSafe(g, x, y, s = 1, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  irect(g, 0, 0, 220, 190, lin(g, 0, 0, 0, 190, [[0, '#3a3a3a'], [1, '#1a1a1a']]), { lw: 3 });
  for (let i = 0; i < 9; i++) { iell(g, 12 + i * 24.5, 10, 3, 3, '#7a6a4a', { lw: 0.6 }); iell(g, 12 + i * 24.5, 180, 3, 3, '#7a6a4a', { lw: 0.6 }); }
  irect(g, 18, 22, 184, 146, o.open ? '#0e0a08' : '#2a2a2a', { lw: 2 });
  if (!o.open) { iell(g, 70, 95, 22, 30, PAL.brass, { lw: 2 }); irect(g, 66, 86, 8, 22, '#111', { lw: 0.8 }); iell(g, 150, 95, 32, 32, PAL.brassHi, { lw: 2 }); iell(g, 150, 95, 12, 12, PAL.brass, { lw: 1.4 }); }
  g.restore();
}
// The wooden toy box John carved for Mary, closed: a bird on the lid, four figures.
function drawToyBox(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  poly(g, [[-60, 0], [60, 0], [70, -20], [-50, -20]], '#8a5a34', { lw: 1.8 });
  irect(g, -60, 0, 120, 50, '#7a4a2a', { lw: 2 }); woodGrain(g, -58, 2, 116, 46, '#1a0e06', 0.3);
  poly(g, [[-4, -24], [10, -32], [20, -26], [8, -20]], '#c9a35a', { lw: 1.2 });
  g.restore();
}
// The location plaque and tutorial plates: a dark plate with a brass rim and old lettering.
function drawPlate(g, cx, cy, w, h, a = 1) {
  g.save(); g.globalAlpha = a;
  irect(g, cx - w / 2, cy - h / 2, w, h, lin(g, 0, cy - h / 2, 0, cy + h / 2, [[0, '#6a4e1e'], [1, '#3e2c10']]), { lw: 2.2, stroke: '#e6c071' });
  irect(g, cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12, null, { lw: 1, stroke: 'rgba(230,192,113,0.5)' });
  g.restore();
}
// Icons for the new items, centred on (x, y) at scale s.
function iconSafeKey(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.6);
  iell(g, 0, -16, 10, 10, PAL.brass, { lw: 2 }); iell(g, 0, -16, 4, 4, '#1a1a1a', { lw: 0.8 });
  irect(g, -2.5, -6, 5, 30, PAL.brassHi, { lw: 1.6 }); irect(g, 2, 14, 8, 4, PAL.brass, { lw: 1.2 }); irect(g, 2, 20, 6, 4, PAL.brass, { lw: 1.2 });
  g.restore();
}
function iconNail(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  line(g, [[-18, 10], [0, 4], [12, -6], [16, -18]], '#8a8a80', 3, 0.3); line(g, [[-20, 6], [-16, 14]], '#5a5a50', 4);
  g.restore();
}
function iconPoker(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(0.7);
  line(g, [[0, -26], [0, 22]], '#3a3a3a', 4); line(g, [[0, 22], [6, 28]], '#3a3a3a', 4); iell(g, 0, -28, 6, 4, PAL.brass, { lw: 1.2 });
  g.restore();
}
function iconMouse(g, x, y, s = 1) { drawWindMouse(g, x + 6 * s, y + 10 * s, 0.6 * s, {}); }
function iconMouseTail(g, x, y, s = 1) { drawWindMouse(g, x + 12 * s, y + 10 * s, 0.55 * s, { tail: true }); }
function iconNote(g, x, y, s = 1, mark = 'date') {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.08);
  poly(g, [[-22, -16], [22, -18], [24, 16], [-20, 18]], PAL.paper, { lw: 1.6 });
  if (mark === 'date') { txt(g, '14·III', 0, -4, 11, '#3a2410', { font: HAND }); txt(g, '1851', 0, 9, 11, '#3a2410', { font: HAND }); }
  else { const hp = [[0, 10], [-12, -2], [-8, -12], [0, -6], [8, -12], [12, -2]]; shape(g, hp, '#8a5a3a', { lw: 1.2 }); }
  g.restore();
}
Object.assign(ICONS, {
  safeKey: iconSafeKey, nail: iconNail, poker: iconPoker, mouse: iconMouse, mouseTail: iconMouseTail,
  dateNote: (g, x, y, s) => iconNote(g, x, y, s, 'date'), heartNote: (g, x, y, s) => iconNote(g, x, y, s, 'heart'),
});
