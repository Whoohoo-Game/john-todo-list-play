// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-13
// story.js: the opening chapter. Places, hotspots, gestures, items, puzzles, memories, hints and
// the scripted moments. index.html calls newStory(), storyInput(), storyUpdate() and storyDraw().
'use strict';

// ---- Items and fixed answers ---------------------------------------------------------------
const ITEMS = {
  dateNote: { name: 'A date he cannot forget', look: ['From the register:', 'Mary Smith, died 14 March 1851.'] },
  heartNote: { name: 'The heart in the wood', look: ['The board with the heart-shaped knot,', 'by the foot of the bed.'] },
  mouse: { name: 'Wind-up mouse', look: ['One of his. Never finished.', 'It has no tail.'] },
  nail: { name: 'Bent nail', look: ['Bent. Thin as a tail.'] },
  mouseTail: { name: 'Wind-up mouse, with a tail', look: ['A nail for a tail.', 'It will do.'] },
  poker: { name: 'Fire poker', look: ['Iron. Heavy.'] },
  safeKey: { name: 'Small iron key', look: ['Her key.'] },
};
const COMBINE = { 'mouse+nail': ['mouseTail', 'A nail for a tail. It will do.'] };
const WRONG = ['No.', 'Hmph.', 'Not that.', 'Bah.', "Won't work."];
const SAFE_CODE = [14, 3, 51];
const FIGS = ['house', 'ship', 'tree', 'bell'];
const HEART_BOARD = 2;
const LIST = [
  'See the sea in winter',
  'Dance at the harvest fair',
  'Plant a cherry tree under the window',
  'Ride in a balloon, just once',
  'Make a toy together (you carve, I paint)',
  'Write to my sister. Forgive her.',
  'Make John laugh, once a day',
];
// The faint name on the form, as strokes of points; tracing visits SIGN_PTS.
const SIGN = [
  [[520, 452], [560, 448], [556, 480], [550, 510], [536, 526], [516, 520], [508, 506]],
  [[606, 488], [596, 476], [580, 480], [574, 498], [584, 512], [600, 508], [606, 492]],
  [[628, 444], [624, 476], [622, 512]], [[623, 490], [638, 476], [652, 482], [652, 512]],
  [[672, 480], [672, 512]], [[672, 492], [688, 478], [702, 484], [702, 512]],
];
const SIGN_PTS = [];
SIGN.forEach(s => { for (let i = 0; i < s.length - 1; i++) { const [a, b] = [s[i], s[i + 1]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9)); for (let k = 0; k < n; k++) SIGN_PTS.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } });

function newStory() {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return {
    room: 'factory', stack: [], inv: [], sel: null, f: {}, t: 0,
    talk: null, script: null, shot: null, plaque: null, tut: null, hint: null, hl: -1, fade: null,
    drag: null, dragP: {}, invOpen: true, look: null, map: false, days: 0, mem: null, memNew: false,
    dials: [1, 1, 40], boxSeq: order.slice(0, 3), boxStep: 0, boxBird: -1, crankA: 0, signed: new Set(),
    wrongIdx: 0, tapHint: null, enterT: 0, ptr: { x: -1, y: -1 }, done: false,
  };
}

// ---- Small actions -------------------------------------------------------------------------
function say(st, text) { st.talk = { who: 'John', text, t0: st.t, auto: tune.lineTime }; }
function talk(st, who, text) { st.talk = { who, text, t0: st.t }; }
function plaque(st, text) { st.plaque = { text, t0: st.t }; }
function sub(st, text, dur) { st.sub = { text, t0: st.t, dur }; } // narration over a shot, timed
function tut(st, text, ring = null, arrow = null) { st.tut = text ? { text, ring, arrow, t0: st.t } : null; }
function give(st, id) { if (!st.inv.includes(id)) st.inv.push(id); sfx('pick'); st.invOpen = true; }
function drop(st, id) { st.inv = st.inv.filter(i => i !== id); if (st.sel === id) st.sel = null; }
function wrong(st) { say(st, WRONG[st.wrongIdx++ % WRONG.length]); sfx('wrong'); }
const hasItem = (st, id) => st.inv.includes(id);
function run(st, steps) { st.script = { steps, i: 0, t: 0, started: false }; st.sel = null; st.drag = null; }
const say_ = (who, text) => ({ say: who, text });
const until = fn => ({ until: fn });
const shot = name => ({ shot: name });

// Go to a room. o.push: a close look, the way back returns here. o.anchor: zoom toward it.
function go(st, room, o = {}) {
  if (st.fade) return;
  if (o.push) st.stack.push({ room: st.room, anchor: o.anchor || [640, 360] });
  if (o.clear) st.stack = [];
  st.fade = { from: st.room, to: room, t: 0, dur: o.anchor ? tune.zoomTime : tune.fadeTime, anchor: o.anchor || null, dir: o.dir || (o.anchor ? 'in' : 'cut'), switched: false };
  st.sel = null; st.drag = null; st.tapHint = null;
}
function back(st) {
  if (st.look) { st.look = null; return; }
  if (st.map) { st.map = false; sfx('paper'); return; }
  if (st.sel) { st.sel = null; return; }
  const r = ROOMS[st.room];
  if (r.onBack && r.onBack(st)) return;
  if (!st.stack.length) return;
  const top = st.stack.pop();
  go(st, top.room, { anchor: top.anchor, dir: 'out' });
}
function enterRoom(st, name) {
  st.room = name; st.enterT = st.t;
  const r = ROOMS[name];
  if (r.amb) setAmbience(r.amb);
  if (r.enter && !st.f['seen_' + name]) { st.f['seen_' + name] = true; r.enter(st); }
  if (r.every) r.every(st);
}
function turn(st, dir) {
  const r = ROOMS[st.room];
  if (!r.turns || !r.turns[dir] || st.fade) return;
  sfx('step'); go(st, r.turns[dir]); st.fade.dur = tune.turnTime; st.fade.slide = dir;
}

// ---- The places ------------------------------------------------------------------------------
// A spot: { id, r: [x, y, w, h], show(st), tap(st), focus: [room, anchor], drag: { dir, dist, done },
// crank: { cx, cy }, use: { item: fn } }. A close look has close: true; the way back pops the stack.
const ROOMS = {
  factory: {
    amb: 'factory', // drawn live: the floor in three-quarter view, near John's corner
    enter(st) {
      const len = id => OPENING.find(o => o.id === id).len;
      run(st, [() => setAmbience('none'), shot('cold'), 1.6, () => sfx('match'), len('cold') - 1.6,
        shot('title'), () => sfx('exhale'), len('title'),
        shot('quote'), len('quote'),
        shot('outside'), () => { setAmbience('rain'); sfx('whistle'); plaque(st, 'The Toy Factory'); }, len('outside'),
        shot('rafters'), () => { setAmbience('factory'); sub(st, "Deep inside a toy factory, there's an old man who's been working here for over 30 years.", len('rafters')); }, len('rafters'),
        shot('floor'), () => sub(st, 'His name is John. There he is, quietly working away in the corner.', len('floor')), len('floor'),
        shot('shoulder'), () => sfx('chisel'), len('shoulder'),
        shot('eye'), len('eye'),
        shot(null), () => { st.barsOut = st.t; tut(st, 'Double-click or double-tap to focus', [900, 380, 90]); }]);
    },
    spots: [
      { id: 'john', r: [790, 240, 220, 280], focus: ['johnClose', [900, 380]] },
      { id: 'workers', r: [0, 260, 760, 460], tap: st => say(st, 'They never look up. Neither does he.') },
      { id: 'window', r: [0, 0, 1280, 150], tap: st => say(st, 'Grey again.') },
    ],
  },
  johnClose: {
    close: true, amb: 'factory',
    every(st) {
      if (!st.f.tut2) { st.f.tut2 = true; tut(st, 'Right-click, scroll down or pinch to step back'); return; }
      tut(st, null);
      const len = id => OPENING.find(o => o.id === id).len;
      run(st, [0.6, shot('apprentice'), () => sfx('step'), len('apprentice'),
        shot('verdict'), 1.9, () => sfx('thud'), len('verdict') - 1.9,
        shot('hurt'), len('hurt'),
        shot('foreman'), 1.6, () => sfx('wind'), len('foreman') - 1.6,
        shot('grip'), () => sfx('tinFeet'), len('grip'),
        shot('rage'), 0.9, () => { sfx('slam'); sfx('clatter'); }, len('rage') - 0.9,
        shot('silence'), () => { setAmbience('none'); sfx('tinFeet'); }, len('silence'),
        shot('breath'), 2.4, () => sfx('cough'), len('breath') - 2.4,
        shot('hand'), () => sfx('cough'), len('hand'),
        shot('tilt'), () => sfx('heart'), len('tilt'),
        shot('drop'), () => { sfx('thud'); sfx('clatter'); }, len('drop'),
        shot('pov'), () => sfx('heart'), len('pov'),
        shot('white'), () => sfx('siren'), len('white'),
        shot('black'), 1.2, shot(null), () => { st.stack = []; go(st, 'corridor', { clear: true }); }]);
    },
    onBack(st) { if (st.f.tut2 && !st.script) { tut(st, 'Double-click or double-tap to focus', [900, 380, 90]); } return false; },
    spots: [{ id: 'horse', r: [620, 380, 220, 120], tap: st => say(st, 'A leg short. Tomorrow.') }],
  },
  corridor: {
    bg: 'corridor', amb: 'hospital',
    enter(st) {
      run(st, [() => plaque(st, 'The Local Hospital'), shot('corridorPan'), tune.panTime, shot(null), () => go(st, 'wardDoor')]);
    },
    spots: [],
  },
  wardDoor: {
    amb: 'hospital',
    enter(st) { run(st, [0.6, say_(null, 'John is in this room.'), () => tut(st, 'Open the door', null, [[560, 380], [760, 380]])]); },
    spots: [
      { id: 'door', r: [440, 80, 400, 600], drag: { dir: [1, 0], dist: 220, done: st => { st.f.doorOpen = true; sfx('door'); tut(st, null); run(st, [0.9, () => go(st, 'ward', { anchor: [640, 380] })]); } } },
    ],
  },
  ward: {
    bg: 'ward', amb: 'hospital',
    enter(st) { run(st, [0.8, say_(null, 'John refuses treatment. He wants to go home.'), () => tut(st, 'Double-click or double-tap to focus', [470, 476, 50])]); },
    every(st) {
      if (st.f.needle && !st.f.nurse) {
        st.f.nurse = true; tut(st, null);
        const cl = id => CHAPTER_SHOTS.find(o => o.id === id).len;
        run(st, [0.4, shot('railGrip'), () => { st.f.tryT = st.t - 2.6; sfx('creak'); }, cl('railGrip'), shot('nurseDoor'), () => sfx('step'), cl('nurseDoor'),
          shot(null), () => { st.f.nurseT = st.t - 2.2; }, 0.4,
          say_('Nurse', "Please follow me. We need to complete a few medical tests as part of the hospital's procedures."),
          say_('John', "I don't need a health check. Just let me go home!"),
          () => { st.f.shake = st.t; }, 1.4, () => go(st, 'office', { clear: true })]);
      }
    },
    spots: [
      { id: 'arm', r: [410, 440, 120, 70], show: st => !st.f.needle, focus: ['armClose', [470, 476]] },
      { id: 'window', r: [774, 84, 252, 272], tap: st => say(st, 'Rain.') },
      { id: 'basin', r: [1080, 360, 120, 80], tap: st => say(st, 'They bled him. As if that would help.') },
    ],
  },
  armClose: {
    close: true, amb: 'hospital',
    every(st) { if (!st.f.needle) tut(st, "Take the dressing off John's arm.", null, st.f.tape ? [[760, 420], [420, 420]] : [[640, 420], [640, 300]]); },
    onBack(st) { if (!st.f.needle) { say(st, 'Not yet.'); return true; } tut(st, null); return false; },
    spots: [
      { id: 'tape', r: [580, 330, 140, 110], show: st => !st.f.tape, drag: { dir: [0, -1], dist: 110, done: st => { st.f.tape = true; sfx('tape'); tut(st, "Take the dressing off John's arm.", null, [[760, 420], [420, 420]]); } } }, // the knot
      { id: 'needle', r: [400, 360, 460, 120], show: st => st.f.tape && !st.f.needle, drag: { dir: [-1, 0], dist: 260, done: st => { st.f.needle = true; sfx('pull'); tut(st, 'Step back: right-click, scroll down or pinch'); } } }, // the bandage, unwound
    ],
  },
  office: {
    bg: 'office', amb: 'office',
    enter(st) {
      run(st, [0.8, shot('docTalk'), say_('Doctor', "John, you're very sick. Please, stop being so stubborn."),
        say_('Doctor', "I'm afraid you have advanced liver cancer. You have only 30 days left."), () => { st.days = 30; sfx('paper'); },
        shot('johnListen'), say_('John', "Thank you, Doctor, but I'd like to refuse treatment and go home."),
        shot('docTalk'), say_('Doctor', 'John, without treatment, you only have a few days left to live.'),
        shot('wallClock'), () => { st.f.silence = st.t; }, tune.silenceTime,
        shot('docTalk'), say_('Doctor', "Alright. If that's what you want, please sign this form stating that you refuse the hospital's treatment plan."),
        shot('smile'), tune.smileTime, shot(null), () => { st.f.smiled = true; tut(st, 'Double-click or double-tap the form', [560, 470, 60]); }]);
    },
    spots: [
      { id: 'form', r: [480, 430, 170, 70], show: st => st.f.smiled && !st.f.signed, focus: ['formClose', [560, 470]] },
      { id: 'doctor', r: [700, 160, 160, 300], tap: st => say(st, '...') },
      { id: 'files', r: [60, 80, 250, 380], tap: st => say(st, 'Names. All of them dying.') },
    ],
  },
  formClose: {
    close: true, amb: 'office',
    every(st) { if (!st.f.signed) tut(st, st.f.pen ? 'Trace his name' : 'Take the pen'); },
    onBack(st) { if (!st.f.signed) { say(st, 'Sign it.'); return true; } return false; },
    spots: [
      { id: 'pen', r: [860, 420, 200, 80], show: st => !st.f.pen, tap: st => { st.f.pen = true; sfx('pick'); tut(st, 'Trace his name'); } },
      { id: 'sign', r: [480, 420, 260, 130], show: st => st.f.pen && !st.f.signed, trace: true, tap: () => {} },
    ],
  },
  treasury: {
    bg: 'treasury', amb: 'memory', close: true,
    enter(st) { plaque(st, 'Treasury of memories'); },
    every(st) {
      const next = !st.f.mem1 ? 'mem1' : st.f.photo && !st.f.mem2 ? 'mem2' : null;
      tut(st, next ? 'Double-click the glowing photograph' : null, next === 'mem1' ? [640, 330, 110] : next === 'mem2' ? [960, 260, 100] : null);
    },
    onBack(st) {
      if (st.f.mem1 && !st.f.homeCard) { // leaving the treasury the first time: the chapter moves home
        st.f.homeCard = true; tut(st, null);
        const cl = id => CHAPTER_SHOTS.find(o => o.id === id).len;
        run(st, [shot('black'), 1.2, shot('card30'), tune.cardTime, shot('houseOutside'), () => { setAmbience('rain'); plaque(st, "John's House"); sfx('ringFar'); }, cl('houseOutside'),
          () => { st.shot = null; go(st, 'bedMain', { clear: true }); }]);
        return true;
      }
      return false;
    },
    spots: [
      { id: 'mem1', r: [565, 270, 150, 120], focus: ['memView', [640, 330]], before: st => { st.mem = { id: 1, t: 0, paused: false, done: false }; } },
      { id: 'mem2', r: [895, 205, 130, 110], show: st => st.f.photo, focus: ['memView', [960, 260]], before: st => { st.mem = { id: 2, t: 0, paused: false, done: false }; } },
    ],
  },
  memView: {
    close: true, amb: 'memory',
    every(st) { tut(st, null); },
    onBack(st) { if (st.mem) { st.f['mem' + st.mem.id] = true; st.mem = null; } return false; },
    spots: [
      { id: 'date', r: [560, 430, 360, 60], show: st => st.mem && st.mem.id === 1 && st.mem.paused && st.mem.t < tune.memFrame && !hasItem(st, 'dateNote'),
        tap: st => { give(st, 'dateNote'); sfx('solve'); tut(st, null); say(st, 'The fourteenth of March.'); } },
      { id: 'heart', r: [560, 470, 160, 130], show: st => st.mem && st.mem.id === 2 && st.mem.paused && st.mem.t >= tune.memFrame && st.mem.t < tune.memFrame * 2 && !hasItem(st, 'heartNote'),
        tap: st => { give(st, 'heartNote'); sfx('solve'); tut(st, null); say(st, 'A heart in the wood.'); } },
    ],
  },
  // John's bedroom: three walls and the ceiling. Turn with arrows, A / D / W / S, or a swipe.
  bedMain: {
    bg: 'bedMain', amb: 'home', turns: { left: 'bedLeft', right: 'bedRight', up: 'bedUp' }, mapOk: true,
    enter(st) {
      st.f.alarm = true; st.days = 30;
      run(st, [1.0, () => tut(st, 'Something is ringing. Look around: the arrows, A / D, or swipe.')]);
    },
    every(st) {
      if (st.f.alarmOff && !st.f.awake && !st.script) {
        tut(st, null);
        const cl = id => CHAPTER_SHOTS.find(o => o.id === id).len;
        run(st, [0.6, () => { st.f.paw = st.t; }, shot('catPaw'), () => sfx('meow'), cl('catPaw'), shot('eyeOpen'), cl('eyeOpen'), shot(null), () => { st.f.awake = st.t; sfx('cough'); }, 1.0,
          () => { st.f.catLeap = st.t; sfx('meow'); }, 1.2, () => { st.f.catRug = true; }]);
      }
    },
    spots: [
      { id: 'cat', r: [560, 590, 170, 90], show: st => st.f.catRug && !st.f.catGone, tap: st => { sfx('hiss'); say(st, 'Hss. Fine. Your rug.'); st.f.hissed = true; },
        use: { mouseTail: st => mouseRun(st), mouse: st => say(st, 'It spins in a circle. No tail to steer by.') } },
      { id: 'rug', r: [420, 580, 440, 120], show: st => !st.f.rug, tap: st => { if (st.f.catRug && !st.f.catGone) { sfx('hiss'); say(st, 'Not with her on it.'); } else say(st, 'Her rug. Something under it?'); },
        drag: { dir: [1, 0], dist: 260, ok: st => !st.f.catRug || st.f.catGone, no: st => { sfx('hiss'); say(st, 'Not with her on it.'); }, done: st => { st.f.rug = true; sfx('rug'); } },
        use: { mouseTail: st => mouseRun(st), mouse: st => say(st, 'It spins in a circle. No tail to steer by.') } },
      ...[0, 1, 2, 3, 4].map(i => ({ id: 'board' + i, r: [440 + i * 84, 590, 80, 100], show: st => st.f.rug && !(i === HEART_BOARD && st.f.board),
        tap: st => say(st, i === HEART_BOARD ? 'Loose. Needs prising.' : 'Solid.'),
        use: { poker: st => { if (i !== HEART_BOARD) { say(st, 'Solid.'); return; } st.f.board = true; drop(st, 'poker'); sfx('creak'); sfx('solve'); } } })),
      { id: 'key', r: [600, 600, 100, 80], show: st => st.f.board && !hasItem(st, 'safeKey') && !st.f.safeUnlocked, tap: st => { give(st, 'safeKey'); say(st, 'Her key.'); } },
      { id: 'john', r: [100, 330, 520, 160], show: st => !st.f.awake, tap: st => say(st, '...') },
      { id: 'johnUp', r: [540, 280, 200, 200], show: st => st.f.awake, tap: st => say(st, 'Thirty days. Hmph.') },
      { id: 'bottle', r: [760, 310, 40, 90], tap: st => say(st, 'Not now.') },
      { id: 'window', r: [852, 82, 226, 266], tap: st => say(st, 'Morning. Another one.') },
      { id: 'door', r: [1150, 120, 130, 360], tap: st => say(st, st.f.catGone ? 'She knows the way out.' : 'Not yet.') },
    ],
  },
  bedLeft: {
    bg: 'bedLeft', amb: 'home', turns: { right: 'bedMain', left: 'bedRight', up: 'bedUp' }, mapOk: true,
    spots: [
      { id: 'books', r: [240, 230, 150, 70], show: st => !st.f.books, tap: st => { st.f.books = true; sfx('books'); } },
      { id: 'clock', r: [250, 230, 90, 70], show: st => st.f.books, focus: ['clockClose', [295, 268]], tap: st => { if (!st.f.alarm) say(st, 'Quiet now.'); } },
      { id: 'mouse', r: [720, 300, 110, 60], show: st => !st.f.mouseTaken, tap: st => { st.f.mouseTaken = true; give(st, 'mouse'); say(st, 'Never finished it.'); } },
      { id: 'ashtray', r: [860, 320, 100, 40], tap: st => { if (!st.f.nailTaken) { st.f.nailTaken = true; give(st, 'nail'); } else say(st, 'Ash.'); } },
      { id: 'tools', r: [700, 240, 340, 70], tap: st => say(st, 'His tools. Hers, once. She painted.') },
    ],
  },
  bedRight: {
    bg: 'bedRight', amb: 'home', turns: { left: 'bedMain', right: 'bedLeft', up: 'bedUp' }, mapOk: true,
    spots: [
      { id: 'photo', r: [240, 90, 130, 110], tap: st => {
        if (!st.f.photo) { st.f.photo = true; st.memNew = true; sfx('paper'); bell(659, 2, 0.08); run(st, [0.8, () => tut(st, 'A memory has woken. Open the album.', [1108, 684, 60])]); }
        else say(st, '...'); } },
      { id: 'poker', r: [440, 300, 60, 180], show: st => !st.f.pokerTaken, tap: st => { st.f.pokerTaken = true; give(st, 'poker'); } },
      { id: 'safe', r: [920, 280, 220, 190], focus: ['safeClose', [1030, 375]] },
      { id: 'chair', r: [540, 360, 240, 200], tap: st => say(st, 'Her chair. Nobody sits in it.') },
      { id: 'fire', r: [190, 320, 220, 150], tap: st => say(st, 'Cold.') },
    ],
  },
  bedUp: {
    bg: 'bedUp', amb: 'home', turns: { down: 'bedMain' },
    spots: [
      { id: 'birds', r: [800, 200, 220, 220], tap: st => { say(st, 'She made those. Paper birds, to point the way.'); sfx('paper'); } },
      { id: 'lamp', r: [590, 400, 100, 90], tap: st => say(st, 'Should fix that.') },
    ],
  },
  clockClose: {
    close: true, amb: 'home',
    every(st) { if (st.f.alarm) tut(st, st.f.clockBack ? 'Stop it' : 'Turn it over', null, st.f.clockBack ? [[745, 290], [745, 400]] : [[760, 360], [520, 360]]); },
    spots: [
      { id: 'turnClock', r: [400, 120, 480, 440], show: st => !st.f.clockBack, drag: { dir: [-1, 0], dist: 220, done: st => { st.f.clockBack = true; sfx('click'); tut(st, 'Stop it', null, [[745, 290], [745, 400]]); } } },
      { id: 'lever', r: [700, 260, 90, 160], show: st => st.f.clockBack && st.f.alarm, drag: { dir: [0, 1], dist: 70, done: st => {
        st.f.alarm = false; st.f.alarmOff = true; sfx('click'); tut(st, null); run(st, [0.8, say_(null, '...John still does not stir.')]); } } },
    ],
  },
  safeClose: {
    close: true, amb: 'home',
    spots: [
      { id: 'keyhole', r: [490, 250, 90, 130], show: st => !st.f.safeUnlocked, tap: st => say(st, 'Locked. The dial will not turn.'),
        use: { safeKey: st => { st.f.safeUnlocked = true; drop(st, 'safeKey'); sfx('locker'); say(st, 'The dial is free.'); } } },
      ...[0, 1, 2].flatMap(i => [
        { id: 'up' + i, r: [520 + i * 120, 400, 80, 44], show: st => !st.f.safeOpen, tap: st => turnDial(st, i, 1) },
        { id: 'dn' + i, r: [520 + i * 120, 530, 80, 44], show: st => !st.f.safeOpen, tap: st => turnDial(st, i, -1) },
      ]),
      { id: 'ribbon', r: [440, 420, 120, 80], show: st => st.f.safeOpen, tap: st => say(st, 'Her ribbon.') },
      { id: 'letters', r: [740, 400, 160, 100], show: st => st.f.safeOpen, tap: st => say(st, 'Her letters. He never read them again.') },
      { id: 'box', r: [560, 300, 180, 160], show: st => st.f.safeOpen, tap: st => go(st, 'boxClose', { push: true, anchor: [650, 380] }) },
    ],
  },
  boxClose: {
    close: true, amb: 'home',
    every(st) { if (!st.f.boxOpen && !st.f.boxTold) { st.f.boxTold = true; say(st, 'Made it for her. A box with a secret.'); } },
    spots: [
      { id: 'panel', r: [920, 300, 80, 260], show: st => !st.f.panel, drag: { dir: [0, 1], dist: 90, done: st => { st.f.panel = true; sfx('slide'); } } },
      { id: 'crank', r: [900, 340, 120, 120], show: st => st.f.panel && !st.f.boxOpen, crank: { cx: 960, cy: 400 } },
      ...FIGS.map((name, k) => ({ id: 'fig' + k, r: [430 + k * 120, 420, 100, 100], show: st => !st.f.boxOpen, tap: st => pressFig(st, k) })),
      { id: 'list', r: [520, 180, 240, 120], show: st => st.f.boxOpen, tap: st => go(st, 'listClose', { push: true, anchor: [640, 240] }) },
      { id: 'bird', r: [580, 180, 120, 90], show: st => !st.f.boxOpen, tap: st => say(st, st.f.panel ? 'Turn it, and she shows you.' : 'Her bird. It wants turning.') },
    ],
  },
  listClose: {
    close: true, amb: 'home',
    every(st) { if (!st.f.listRead) { st.f.listRead = st.t; sfx('paper'); } },
    onBack(st) { startEnding(st); return true; },
    spots: [{ id: 'paper', r: [300, 40, 680, 640], tap: st => { if (st.t - st.f.listRead > tune.listMin) startEnding(st); } }],
  },
};

function turnDial(st, i, d) {
  if (!st.f.safeUnlocked) { say(st, 'Locked. The dial will not turn.'); sfx('wrong'); return; }
  const max = [31, 12, 99][i], min = [1, 1, 0][i];
  let v = st.dials[i] + d; if (v > max) v = min; if (v < min) v = max; st.dials[i] = v; sfx('dial');
  if (st.dials.every((x, k) => x === SAFE_CODE[k])) { st.f.safeOpen = true; sfx('locker'); sfx('solve'); }
}
function crankTurned(st) {
  if (st.boxBird >= 0) { sfx('click'); return; } // the bird already points
  st.boxBird = st.boxSeq[st.boxStep]; sfx('wind'); bell(784, 1.2, 0.06);
}
function pressFig(st, k) {
  if (!st.f.panel || st.boxBird < 0) { say(st, 'Carved fast. It will not press.'); sfx('wrong'); return; }
  if (k === st.boxBird) {
    st.boxStep++; st.boxBird = -1; sfx('click'); bell(523 + st.boxStep * 130, 1, 0.08);
    if (st.boxStep >= 3) { st.f.boxOpen = true; sfx('locker'); sfx('solve'); }
  } else { st.boxStep = 0; st.boxBird = -1; sfx('wrong'); say(st, 'Hm. Not like that. From the start.'); }
}
function mouseRun(st) {
  if (!st.f.catRug || st.f.catGone) { say(st, 'Not now.'); return; }
  drop(st, 'mouseTail');
  run(st, [() => { st.f.runT = st.t; sfx('wind'); }, 0.5, () => sfx('meow'), tune.runTime, () => { st.f.catGone = true; sfx('door'); }, 0.6, say_('John', 'Go on, then.')]);
}
function startEnding(st) {
  if (st.script || st.f.ending) return;
  st.f.ending = true; tut(st, null);
  run(st, [shot('endAsh'), () => sfx('stub'), tune.endShotTime, shot('endPour'), () => sfx('pour'), tune.endShotTime,
    shot('endPin'), () => sfx('pin'), tune.endShotTime, shot('endDoor'), () => sfx('door'), tune.endDoorTime, shot('endStreet'), () => setAmbience('none'), CHAPTER_SHOTS.find(o => o.id === 'endStreet').len,
    shot('black'), 1, shot('card30'), tune.cardTime, () => { st.done = true; }]);
}

// ---- Hints: three steps for whatever the player is on now ----------------------------------------
function hintFor(st) {
  const f = st.f, r = st.room;
  if (r === 'factory' || r === 'johnClose') return ['a', ['Look at the old man in the corner.', 'Look closer at him.', 'Double-click (or double-tap) John, by the bench on the right.']];
  if (r === 'wardDoor') return ['b', ['He is behind this door.', 'Push it.', 'Drag across the door, from left to right.']];
  if (r === 'ward' || r === 'armClose') {
    if (!f.needle && r === 'ward') return ['c', ['He wants the dressing off.', 'Look closer at his arm.', 'Double-click his arm on the blanket.']];
    if (!f.tape) return ['d', ['The knot first.', 'Pull it loose.', 'Drag the knot upwards.']];
    if (!f.needle) return ['e', ['Now the bandage.', 'Unwind it, towards the elbow.', 'Drag along the bandage to the left.']];
    return ['f', ['Step back.', 'Right-click, scroll down, Esc or pinch.', 'Press Esc.']];
  }
  if (r === 'office' || r === 'formClose') {
    if (!f.smiled) return ['g', ['Listen.', 'Click to read on.', 'Click anywhere to go on.']];
    if (r === 'office') return ['h', ['The form on the desk.', 'Look closer at it.', 'Double-click the paper on the desk.']];
    if (!f.pen) return ['i', ['He needs a pen.', 'On the right of the desk.', 'Click the pen.']];
    return ['j', ['His name is already there, faint.', 'Follow the faint letters with the pen.', 'Hold the button down and drag along the grey "John".']];
  }
  if (r === 'treasury' || r === 'memView') {
    if (r === 'memView' && st.mem && st.mem.id === 1 && !hasItem(st, 'dateNote')) return ['k', ['Something in the register stays with him.', 'Pause the memory while the page is shown.', 'Press Space (or the pause button) during the first moments, then click the date.']];
    if (r === 'memView' && st.mem && st.mem.id === 2 && !hasItem(st, 'heartNote')) return ['l', ['Where does she hide it?', 'Pause while she lifts the board.', 'Pause in the middle of the memory, then click the board with the heart.']];
    return ['m', ['A photograph glows.', 'Look closer at it.', 'Double-click the glowing photograph. Step back to leave.']];
  }
  if (!f.alarmOff) {
    if (!f.books) return ['n', ['The ringing comes from the left.', 'Turn left. Something hides behind the books.', 'Press A or the left arrow, then click the pile of books.']];
    if (!f.clockBack) return ['o', ['The alarm clock.', 'Look closer, then turn it over.', 'Double-click the clock, then drag it to the left.']];
    return ['p', ['On its back there is a lever.', 'Push the lever down.', 'Drag the lever downwards.']];
  }
  if (!f.awake) return ['q', ['Back to the bed.', 'Turn back to the middle.', 'Press D or the right arrow.']];
  if (!f.photo) return ['r', ['A picture on the right wall faces the wall.', 'Turn it round.', 'Turn right and click the frame above the fireplace.']];
  if (!f.mem2) return ['s', ['A memory has woken.', 'Open the album.', 'Click the album at the top right, then double-click the glowing photograph.']];
  if (!f.catGone) {
    if (!hasItem(st, 'mouseTail') && !(hasItem(st, 'mouse') && hasItem(st, 'nail'))) return ['t', ['The cat will not leave the rug. What do cats chase?', 'One of his toys, on the bench to the left. And the ashtray.', 'Take the wind-up mouse and the bent nail from the bench on the left.']];
    if (!hasItem(st, 'mouseTail')) return ['u', ['The mouse needs a tail.', 'Put the nail on the mouse.', 'Click the mouse in the bar, then click the nail.']];
    return ['v', ['Let the cat chase it.', 'Set the mouse down by her.', 'Click the mouse in the bar, then click the cat on the rug.']];
  }
  if (!f.rug) return ['w', ['Under the rug.', 'Roll it back.', 'Drag the rug to the right.']];
  if (!f.board) return ['x', ['Which board did she lift?', 'The one with the heart. It needs prising.', 'Take the poker by the fireplace, then use it on the middle board.']];
  if (!f.safeUnlocked) return ['y', ['The key.', 'The safe on the right wall.', 'Double-click the safe, then use the key on the keyhole.']];
  if (!f.safeOpen) return ['z', ['A day, a month, a year.', 'The date in the register: her date.', 'Set 14, 03, 51.']];
  if (!f.boxOpen) {
    if (!f.panel) return ['A', ['The box has a secret.', 'The side slides.', 'Drag the right side of the box down.']];
    return ['B', ['Turn the crank. Watch the bird.', 'Press the figure the bird points to. Three times.', 'Drag round the crank, press the figure under the beak, and again.']];
  }
  return ['C', ['Read it.', 'The paper in the box.', 'Click the folded paper.']];
}
function askHint(st) {
  const [key, lines] = hintFor(st);
  if (st.hint && st.hint.key === key) st.hint.level = Math.min(2, st.hint.level + 1);
  else st.hint = { key, level: 0, lines };
  st.hint.lines = lines; st.hint.t0 = st.t; sfx('paper');
}

// ---- Input: what index.html sends ----------------------------------------------------------------
// ev: { type: 'tap'|'dbl'|'down'|'move'|'up'|'cancel'|'back'|'turn'|'map'|'hint'|'space'|'skip', x, y, dir }
const UI = {
  hint: [1172, 662, 96, 44], album: [1060, 662, 96, 44], map: [948, 662, 96, 44],
  back: [604, 650, 72, 56], pause: [612, 652, 56, 52], invTab: [0, 300, 26, 120],
  arrowL: [8, 330, 44, 64], arrowR: [1228, 330, 44, 64], arrowU: [612, 74, 56, 40], arrowD: [612, 664, 56, 40],
};
const inRect = (x, y, r) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
function slotRect(i) { return [30, 120 + i * 82, 76, 74]; }
function uiArrow(st, k) { const r = ROOMS[st.room]; if (!r.turns || st.map) return null; const a = { arrowL: 'left', arrowR: 'right', arrowU: 'up', arrowD: 'down' }[k]; return r.turns[a] ? a : null; }
function busy(st) { return !!(st.fade || (st.script && !(st.talk && !st.talk.auto))); }
function spotsHere(st) { return ROOMS[st.room].spots.filter(s => !s.show || s.show(st)); }
function spotAt(st, x, y) {
  const list = spotsHere(st);
  for (let i = list.length - 1; i >= 0; i--) if (inRect(x, y, list[i].r)) return list[i];
  return null;
}
function showUI(st, k) {
  if (k === 'hint') return true;
  if (k === 'album') return !!st.f.album;
  if (k === 'map') return !!ROOMS[st.room].mapOk;
  if (k === 'back') return !!ROOMS[st.room].close && st.room !== 'memView';
  if (k === 'pause') return st.room === 'memView';
  return true;
}

function storyInput(st, ev) {
  if (ev.x !== undefined) { st.ptr.x = ev.x; st.ptr.y = ev.y; }
  if (st.done) return;
  if (st.talk && !st.talk.auto) { // a line on screen: a click or Enter reads on
    if ((ev.type === 'tap' || ev.type === 'skip' || ev.type === 'space') && st.t - st.talk.t0 > tune.talkMinTime) { st.talk = null; sfx('page'); }
    return;
  }
  if (busy(st)) return;
  const { type, x, y } = ev;
  if (type === 'back') { back(st); return; }
  if (type === 'hint') { askHint(st); return; }
  if (type === 'skip') return;
  if (type === 'space') {
    if (st.room === 'memView' && st.mem) togglePause(st);
    else st.hl = st.t + tune.highlightTime;
    return;
  }
  if (type === 'turn') { if (st.map && ev.dir === 'up') { st.map = false; return; } if (!st.map && !st.look) { const r = ROOMS[st.room]; if (ev.dir === 'down' && !(r.turns && r.turns.down) && r.mapOk) { st.map = true; sfx('paper'); } else turn(st, ev.dir); } return; }
  if (type === 'map') { if (ROOMS[st.room].mapOk) { st.map = !st.map; sfx('paper'); } return; }
  if (st.look) { if (type === 'tap') st.look = null; return; }
  if (st.map) {
    if (type === 'down') st.drag = { kind: 'swipe', x0: x, y0: y };
    else if (type === 'up') { if (st.drag && st.drag.y0 - y > tune.swipeDist) { st.map = false; sfx('paper'); } st.drag = null; }
    else if (type === 'tap') mapTap(st, x, y);
    return;
  }

  if (type === 'down') {
    const slot = st.invOpen ? st.inv.findIndex((_, i) => inRect(x, y, slotRect(i))) : -1;
    if (slot >= 0) { st.drag = { kind: 'item', id: st.inv[slot], x0: x, y0: y, moved: false }; return; }
    const s = spotAt(st, x, y);
    if (s && s.drag) { if (s.drag.ok && !s.drag.ok(st)) { s.drag.no(st); return; } st.drag = { kind: 'spot', spot: s, x0: x, y0: y }; return; }
    if (s && s.crank) { st.drag = { kind: 'crank', spot: s, a: Math.atan2(y - s.crank.cy, x - s.crank.cx), acc: 0 }; return; }
    if (s && s.trace) { st.drag = { kind: 'trace' }; traceAt(st, x, y); return; }
    st.drag = { kind: 'swipe', x0: x, y0: y };
    return;
  }
  if (type === 'move' && st.drag) {
    const d = st.drag;
    if (d.kind === 'item') { if (!d.moved && Math.hypot(x - d.x0, y - d.y0) > 14) { d.moved = true; st.sel = d.id; } }
    else if (d.kind === 'spot') {
      const sd = d.spot.drag, p = Math.max(0, Math.min(1, ((x - d.x0) * sd.dir[0] + (y - d.y0) * sd.dir[1]) / sd.dist));
      st.dragP[d.spot.id] = p;
      if (p >= 1) { st.drag = null; st.dragP[d.spot.id] = 1; sd.done(st); }
    } else if (d.kind === 'crank') {
      const a = Math.atan2(y - d.spot.crank.cy, x - d.spot.crank.cx);
      let da = a - d.a; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
      d.a = a; d.acc += Math.abs(da); st.crankA += da; if (Math.abs(da) > 0.05) sfx('tickSoft');
      if (d.acc >= Math.PI * 2 * tune.crankTurns) { d.acc = 0; crankTurned(st); }
    } else if (d.kind === 'trace') traceAt(st, x, y);
    return;
  }
  if (type === 'up' || type === 'cancel') {
    const d = st.drag; st.drag = null;
    if (!d || type === 'cancel') return;
    if (d.kind === 'item' && d.moved) { st.sel = d.id; useOn(st, x, y); st.f.dropped = true; return; }
    if (d.kind === 'trace') return;
    if (d.kind === 'swipe') {
      const dx = x - d.x0, dy = y - d.y0, D = tune.swipeDist;
      if (Math.abs(dx) > D && Math.abs(dx) > Math.abs(dy)) turn(st, dx < 0 ? 'left' : 'right');
      else if (dy > D && Math.abs(dy) > Math.abs(dx)) { if (ROOMS[st.room].turns && ROOMS[st.room].turns.down) turn(st, 'down'); else if (ROOMS[st.room].mapOk) { st.map = true; sfx('paper'); } }
      else if (-dy > D && Math.abs(dy) > Math.abs(dx)) turn(st, 'up');
    }
    return;
  }
  if (type === 'tap') { tap(st, x, y); return; }
  if (type === 'dbl') {
    const slot = st.invOpen ? st.inv.findIndex((_, i) => inRect(x, y, slotRect(i))) : -1;
    if (slot >= 0) { st.look = st.inv[slot]; st.sel = null; sfx('paper'); return; }
    const s = spotAt(st, x, y);
    if (s && s.focus) { st.tapHint = null; if (s.before) s.before(st); tut(st, null); go(st, s.focus[0], { push: true, anchor: s.focus[1] }); }
  }
}
function tap(st, x, y) {
  // the buttons first
  if (showUI(st, 'hint') && inRect(x, y, UI.hint)) { askHint(st); return; }
  if (showUI(st, 'album') && inRect(x, y, UI.album)) { if (st.room !== 'treasury' && st.room !== 'memView') { st.memNew = false; tut(st, null); go(st, 'treasury', { push: true, anchor: [1108, 684] }); } return; }
  if (showUI(st, 'map') && inRect(x, y, UI.map)) { st.map = true; sfx('paper'); return; }
  if (showUI(st, 'back') && inRect(x, y, UI.back)) { back(st); return; }
  if (showUI(st, 'pause') && inRect(x, y, UI.pause)) { togglePause(st); return; }
  if (st.inv.length && inRect(x, y, st.invOpen ? [110, 98, 28, 48] : UI.invTab)) { st.invOpen = !st.invOpen; sfx('click'); return; }
  for (const k of ['arrowL', 'arrowR', 'arrowU', 'arrowD']) { const a = uiArrow(st, k); if (a && inRect(x, y, arrowRect(st, k))) { turn(st, a); return; } }
  if (st.invOpen) {
    const i = st.inv.findIndex((_, k) => inRect(x, y, slotRect(k)));
    if (i >= 0) {
      const id = st.inv[i];
      if (st.sel && st.sel !== id) {
        const c = COMBINE[st.sel + '+' + id] || COMBINE[id + '+' + st.sel];
        if (c) { drop(st, st.sel); drop(st, id); give(st, c[0]); say(st, c[1]); } else wrong(st);
        st.sel = null; return;
      }
      st.sel = st.sel === id ? null : id; sfx('click'); return;
    }
    if (st.inv.length && x < 132) { st.sel = null; return; }
  }
  if (st.sel) { useOn(st, x, y); return; }
  const s = spotAt(st, x, y);
  if (!s) return;
  if (s.tap) s.tap(st);
  if (s.focus) st.tapHint = { x, y, t0: st.t, text: 'Double-click to look closer' };
  else if (s.drag) st.tapHint = { x, y, t0: st.t, text: 'Drag it' };
  else if (s.crank) st.tapHint = { x, y, t0: st.t, text: 'Drag round it' };
}
function useOn(st, x, y) {
  const s = spotAt(st, x, y), used = st.sel;
  if (!s) { st.sel = null; return; }
  const fn = s.use && s.use[used];
  if (fn) fn(st); else wrong(st);
  if (st.sel === used) st.sel = null;
}
function traceAt(st, x, y) {
  SIGN_PTS.forEach((p, i) => { if (Math.hypot(p[0] - x, p[1] - y) < tune.traceRadius) st.signed.add(i); });
  if (st.signed.size / SIGN_PTS.length >= tune.traceNeeded && !st.f.signed) {
    st.f.signed = true; st.drag = null; tut(st, null); sfx('pen');
    run(st, [0.8, shot('gold'), () => sfx('memory'), tune.goldTime, shot(null), () => { st.f.album = true; st.memNew = true; st.stack = []; st.room = 'office'; st.enterT = st.t; },
      () => tut(st, "His memories are kept in the album. Open it.", [1108, 684, 60])]);
  }
}
function togglePause(st) { if (!st.mem || st.mem.done) return; st.mem.paused = !st.mem.paused; sfx('click'); }
function arrowRect(st, k) { const r = UI[k]; return k === 'arrowL' && st.invOpen && st.inv.length ? [150, r[1], r[2], r[3]] : r; }
const MAP_PLACES = [
  { name: "John's House", x: 600, y: 300, open: true, line: 'Home.' },
  { name: 'The Toy Factory', x: 300, y: 520, open: true, line: 'Not today. Not again.' },
  { name: 'The Local Hospital', x: 430, y: 190, open: true, line: 'No.' },
  { name: 'The Church', x: 800, y: 360, open: false, line: 'Not yet.' },
  { name: 'The Market', x: 180, y: 260, open: false, line: 'Not yet.' },
  { name: 'The Sea', x: 1160, y: 380, open: false, line: 'Not yet.' },
];
function mapTap(st, x, y) {
  const p = MAP_PLACES.find(p => Math.hypot(p.x - x, p.y - y) < 60);
  if (p) say(st, p.line); else if (y > 660) { st.map = false; sfx('paper'); }
}

// ---- Update --------------------------------------------------------------------------------------
function storyUpdate(st, dt) {
  st.t += dt;
  if (st.fade) {
    st.fade.t += dt;
    if (!st.fade.switched && st.fade.t >= st.fade.dur / 2) { st.fade.switched = true; st.hint = null; enterRoom(st, st.fade.to); }
    if (st.fade.t >= st.fade.dur) st.fade = null;
  }
  scriptUpdate(st, dt);
  if (st.mem && !st.mem.paused && !st.fade) {
    st.mem.t += dt;
    const len = tune.memFrame * 3;
    if (st.mem.id === 1 && !hasItem(st, 'dateNote') && st.mem.t > 1.2 && st.mem.t < tune.memFrame && !st.f.pauseTold) { st.f.pauseTold = true; tut(st, 'Pause the memory to look closer: Space, or the pause button'); }
    if (st.mem.id === 2 && !hasItem(st, 'heartNote') && st.mem.t > tune.memFrame + 1 && st.mem.t < tune.memFrame * 2 && !st.f.pauseTold2) { st.f.pauseTold2 = true; tut(st, 'Pause the memory to look closer'); }
    if (st.mem.t >= len && !st.mem.done) { st.mem.done = true; st.mem.t = len; st.mem.paused = true; tut(st, 'Step back to leave the memory: right-click, scroll down, Esc or pinch'); }
    if (st.mem.id === 1 && Math.floor(st.mem.t * 2) !== Math.floor((st.mem.t - dt) * 2) && st.mem.t > tune.memFrame) sfx('rainDrop');
  }
  if (st.mem && st.mem.paused && st.tut && st.tut.text.startsWith('Pause')) tut(st, st.mem.id === 1 ? 'Something here stays with him. Click it.' : 'Where does she hide it? Click it.');
  // springs: an unfinished drag slides back
  for (const k in st.dragP) if (st.dragP[k] < 1 && !(st.drag && st.drag.spot && st.drag.spot.id === k)) st.dragP[k] = Math.max(0, st.dragP[k] - dt * tune.dragSpring);
  // the alarm rings until it is stopped; louder on the wall it is on
  if (st.f.alarm && !st.fade && Math.floor(st.t * 4) !== Math.floor((st.t - dt) * 4)) sfx(st.room === 'bedLeft' || st.room === 'clockClose' ? 'ringNear' : 'ringFar');
  if (!st.script && !st.fade) {
    const s0 = Math.floor(st.t - dt), s1 = Math.floor(st.t);
    if (s1 !== s0) { if (st.room === 'office') sfx(s1 % 2 ? 'tick' : 'tock'); if (st.room === 'ward' || st.room === 'armClose') sfx('beep'); }
  }
  if (st.talk && st.talk.auto && st.t - st.talk.t0 > st.talk.auto) st.talk = null;
  if (st.hint && st.t - st.hint.t0 > tune.hintShowTime) st.hint = null;
  if (st.plaque && st.t - st.plaque.t0 > tune.plaqueTime) st.plaque = null;
}
function scriptUpdate(st, dt) {
  const sc = st.script; if (!sc) return;
  sc.t += dt;
  while (st.script === sc && sc.i < sc.steps.length) {
    const s = sc.steps[sc.i];
    if (typeof s === 'function') { s(st); sc.i++; sc.t = 0; continue; }
    if (typeof s === 'number') { if (sc.t >= s) { sc.i++; sc.t = 0; continue; } break; }
    if (s.say !== undefined) {
      if (!sc.started) { talk(st, s.say, s.text); sc.started = true; }
      if (!st.talk) { sc.started = false; sc.i++; sc.t = 0; continue; }
      break;
    }
    if (s.until) { if (s.until(st)) { sc.i++; sc.t = 0; continue; } break; }
    if (s.shot !== undefined) { st.shot = s.shot ? { name: s.shot, t0: st.t } : null; sc.i++; sc.t = 0; continue; }
    sc.i++;
  }
  if (st.script === sc && sc.i >= sc.steps.length) st.script = null;
}

// ---- Drawing ------------------------------------------------------------------------------------
let BG_SCALE = 1.5;
function closeBack(g, c) { g.fillStyle = c; g.fillRect(0, 0, 1280, 720); dabs(g, 0, 0, 1280, 720, '#ffffff', 40, 60, 0.03); }
function drawRoom(g, st, name) {
  const room = ROOMS[name];
  if (room.bg) g.drawImage(roomBg(room.bg, BG_SCALE), 0, 0, 1280, 720);
  if (LIVE[name]) LIVE[name](g, st, st.t);
}
function lamp(g, x, y, r, a) { g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = rad(g, x, y, 0, r, [[0, `rgba(255,200,110,${a})`], [1, 'rgba(255,200,110,0)']]); g.fillRect(0, 0, 1280, 720); g.restore(); }
function shade(g, a, rgb = '10,6,4') { g.fillStyle = `rgba(${rgb},${a})`; g.fillRect(0, 0, 1280, 720); }
const ease = p => p < 0 ? 0 : p > 1 ? 1 : p * p * (3 - 2 * p);

const LIVE = {
  factory(g, st, t) {
    // the same floor as the opening's high shots, closer: John's corner in three-quarter view
    g.save(); g.translate(640, 360); g.scale(1.6, 1.6); g.translate(-878, -312); drawFloorHigh(g, t, false); g.restore();
    drawSmoke(g, 900 + 30, 300, t, tune.smokeAmount, 0.9);
  },
  johnClose(g, st, t) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#3a2a1e'], [1, '#1e140c']]); g.fillRect(0, 0, 1280, 720);
    woodGrain(g, 0, 0, 1280, 480, '#000', 0.15);
    irect(g, 380, 480, 960, 60, '#6a4428', { lw: 3 }); irect(g, 380, 540, 960, 200, '#4a2e1a', { lw: 3 });
    // the wooden horse he is carving, one leg short
    g.save(); g.translate(720, 480);
    shape(g, [[-80, -20], [60, -24], [90, -70], [110, -60], [96, -24], [80, 0], [-80, 0]], '#c08a5a', { lw: 2.2 });
    line(g, [[-70, 0], [-72, 40]], '#c08a5a', 9); line(g, [[-40, 0], [-38, 40]], '#c08a5a', 9); line(g, [[40, 0], [42, 40]], '#c08a5a', 9); line(g, [[66, 0], [66, 22]], '#c08a5a', 9);
    g.restore();
    for (let i = 0; i < 12; i++) shape(g, [[900 + i * 14, 478], [910 + i * 14, 470], [914 + i * 14, 478]], '#d8b088', { lw: 1 }); // shavings
    const c = st.f.cough ? Math.max(0, 1 - (t - st.f.cough) / 3) : 0;
    if (!st.f.fallen) { g.save(); g.translate(300, 620); g.scale(1.6, 1.6); drawJohnSeated(g, 0, 0, t, { cough: c * Math.abs(Math.sin(t * 9)) }); g.restore(); }
    if (st.f.blood && !st.f.fallen) { dabs(g, 570, 520, 40, 26, '#8a1010', 10, 6, 0.9); }
    if (!st.f.fallen) drawSmoke(g, 300 + 115 * 1.6, 620 - 162 * 1.6, t, tune.smokeAmount);
    lamp(g, 700, 300, 520, 0.6);
    if (st.f.fallen) shade(g, 0.35);
  },
  wardDoor(g, st, t) {
    g.fillStyle = lin(g, 0, 0, 0, 720, [[0, '#3e504c'], [1, '#2a3432']]); g.fillRect(0, 0, 1280, 720);
    dabs(g, 0, 0, 1280, 720, '#ffffff', 60, 40, 0.04, true);
    irect(g, 400, 50, 480, 640, '#2a2016', { lw: 3 }); // the frame
    const p = st.f.doorOpen ? 1 : (st.dragP.door || 0), w = 400 * (1 - p * 0.72);
    g.fillStyle = lin(g, 0, 80, 0, 680, [[0, '#6a5030'], [1, '#3a2a1a']]); g.fillRect(440, 80, 400, 600);
    lamp(g, 640, 380, 300, 0.4 * p);
    poly(g, [[440, 80], [440 + w, 80 + p * 30], [440 + w, 680 - p * 30], [440, 680]], lin(g, 440, 0, 840, 0, [[0, '#7a5a3a'], [1, '#5a3e24']]), { lw: 2.6 });
    if (p < 0.6) {
      const k = w / 400;
      irect(g, 440 + 70 * k, 140, 260 * k, 220, 'rgba(200,214,210,0.7)', { lw: 2 }); // frosted glass
      g.save(); g.globalAlpha = 0.35; iell(g, 440 + 150 * k, 270, 24 * k, 30, '#3a3a3a', { lw: 0, stroke: false }); g.restore();
      irect(g, 440 + 170 * k, 400, 60 * k, 40, PAL.brass, { lw: 1.6 }); txt(g, '7', 440 + 200 * k, 420, 26, INK, { bold: true });
      irect(g, 440 + 320 * k, 420, 24 * k, 80, PAL.brassHi, { lw: 1.6 }); // the push plate
    }
    line(g, [[640, 0], [640, 40]], '#1a1a1a', 3); iell(g, 640, 50, 12, 14, 'rgba(255,220,150,0.85)', { lw: 1.4 });
  },
  ward(g, st, t) {
    drawRain(g, 774, 84, 252, 272, t, tune.rainAmount, 'rgba(220,230,235,0.35)');
    const tryK = st.f.tryT ? Math.sin(Math.min(1, (t - st.f.tryT) / 2.4) * Math.PI) : 0;
    const shake = st.f.shake ? Math.sin((t - st.f.shake) * 18) * 6 * Math.max(0, 1 - (t - st.f.shake)) : 0;
    g.save(); g.translate(shake, -tryK * 40); drawJohnInBed(g, 320, 440, t); g.restore();
    // the dressing on his arm, where they bled him; the basin on the cabinet
    if (!st.f.needle) { irect(g, 446, 462, 44, 18, '#ece6d4', { lw: 1.4 }); line(g, [[456, 462], [452, 480]], 'rgba(120,100,80,0.5)', 1); line(g, [[470, 462], [466, 480]], 'rgba(120,100,80,0.5)', 1); iell(g, 468, 470, 4, 3, 'rgba(150,40,30,0.6)', { lw: 0, stroke: false }); }
    iell(g, 1140, 412, 46, 12, '#c9c4b2', { lw: 1.8 }); iell(g, 1140, 410, 36, 7, 'rgba(120,30,24,0.7)', { lw: 1 });
    if (st.f.nurseT) drawNurse(g, Math.max(900, 1360 - (t - st.f.nurseT) * 260), 690, t, { walk: t - st.f.nurseT < 1.8, flip: true });
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = rad(g, 900, 220, 0, 420, [[0, 'rgba(220,255,250,0.5)'], [1, 'rgba(220,255,250,0)']]); g.fillRect(0, 0, 1280, 720); g.restore();
  },
  armClose(g, st, t) {
    closeBack(g, '#2c3634');
    shape(g, [[0, 330], [1280, 280], [1280, 720], [0, 720]], lin(g, 0, 300, 0, 720, [[0, '#a9bdb7'], [1, '#6f8783']]), { lw: 3 }); // the blanket
    shape(g, [[-20, 360], [500, 350], [880, 380], [1000, 440], [1000, 500], [880, 520], [500, 490], [-20, 500]], lin(g, 0, 350, 0, 500, [[0, '#d8ae8a'], [1, '#a9785a']]), { lw: 3 });
    shape(g, [[990, 430], [1060, 420], [1130, 432], [1180, 452], [1176, 476], [1120, 470], [1150, 492], [1140, 512], [1060, 512], [990, 500]], '#c99a76', { lw: 2.4 }); // his hand, palm down, fingers loose
    for (let i = 0; i < 3; i++) line(g, [[1070 + i * 24, 440 + i * 4], [1110 + i * 20, 456 + i * 10]], 'rgba(90,60,40,0.55)', 1.6); // between the fingers
    shape(g, [[1000, 432], [1040, 410], [1080, 404], [1086, 416], [1046, 432]], '#c99a76', { lw: 2 }); // the thumb
    dabs(g, 100, 370, 800, 120, '#6a4a3a', 40, 10, 0.25);
    line(g, [[200, 420], [500, 410], [760, 430]], 'rgba(90,110,150,0.4)', 4); // a vein
    const tp = st.f.tape ? 1 : (st.dragP.tape || 0), np = st.f.needle ? 1 : (st.dragP.needle || 0);
    // under the bandage: the small cut where they bled him
    if (np > 0.5) { line(g, [[600, 418], [660, 410]], '#8a1a1a', 3); dabs(g, 590, 404, 80, 20, '#8a2a20', 8, 6, 0.5); }
    // the linen bandage, wound round the forearm; it unwinds towards the elbow
    const wraps = 7, left = Math.round(wraps * (1 - np));
    for (let i = 0; i < left; i++) { const x = 480 + i * 50; poly(g, [[x, 352], [x + 56, 348], [x + 50, 492], [x - 6, 496]], i % 2 ? '#e6dfcc' : '#efe9d8', { lw: 1.8 }); line(g, [[x + 8, 360], [x + 4, 486]], 'rgba(120,100,80,0.35)', 1.2); }
    if (np > 0 && np < 1) { line(g, [[480 + left * 50, 400], [480 + left * 50 - 120 * np, 470], [300 - 200 * np, 560]], '#e6dfcc', 22, 0.6); } // the loose end
    if (tp < 1) { g.save(); g.translate(650, 380 - tp * 80); g.rotate(-tp * 0.5); iell(g, 0, 0, 22, 16, '#e6dfcc', { lw: 2 }); poly(g, [[-6, 10], [-24, 50], [-12, 52]], '#e6dfcc', { lw: 1.6 }); poly(g, [[6, 10], [26, 46], [14, 50]], '#e6dfcc', { lw: 1.6 }); g.restore(); } // the knot
    lamp(g, 640, 400, 500, 0.3);
  },
  office(g, st, t) {
    const sil = st.f.silence && t - st.f.silence < tune.silenceTime;
    drawDoctor(g, 780, 560, t);
    // the desk front, over the doctor's legs
    poly(g, [[300, 450], [980, 450], [1040, 520], [240, 520]], lin(g, 0, 450, 0, 520, [[0, '#7a4a2e'], [1, '#5a341e']]), { lw: 2.6 });
    irect(g, 260, 520, 760, 150, '#4a2c1a', { lw: 2.6 });
    // the form and the pen
    if (!st.f.signed) { g.save(); g.translate(560, 470); g.rotate(-0.05); irect(g, -60, -24, 120, 48, PAL.paper, { lw: 1.6 }); for (let i = 0; i < 4; i++) line(g, [[-48, -12 + i * 9], [40, -12 + i * 9]], 'rgba(40,40,60,0.4)', 1, 0.3); g.restore(); }
    if (!st.f.pen) line(g, [[900, 480], [960, 470]], '#2a2a2a', 5);
    g.save(); g.translate(170, 610); g.scale(0.95, 0.95); drawJohnSeated(g, 0, 0, t, { noCap: true, noCig: true }); g.restore();
    lamp(g, 880, 380, 380, 0.6);
    if (sil) shade(g, 0.15 * Math.sin((t - st.f.silence) / tune.silenceTime * Math.PI));
  },
  formClose(g, st, t) {
    closeBack(g, '#2a1a10');
    woodGrain(g, 0, 0, 1280, 720, '#000', 0.2);
    g.save(); g.translate(640, 360); g.rotate(-0.02);
    irect(g, -300, -320, 600, 640, lin(g, 0, -320, 0, 320, [[0, '#ece0bc'], [1, '#d8c69c']]), { lw: 2.4 });
    txt(g, 'HOSPITAL OF ST. AUBIN', 0, -270, 22, '#3a3a50', { bold: true });
    txt(g, 'Declaration of Refusal of Treatment', 0, -232, 22, '#3a3a50', { italic: true });
    ['I, the undersigned, refuse the treatment', 'offered to me by the hospital, and take upon', 'myself all that follows from it.', '', 'Patient:  John Smith          Age:  64', 'Ward III, Bed 7'].forEach((s, i) => txt(g, s, -250, -170 + i * 34, 20, '#24305a', { align: 'left', font: i === 4 || i === 5 ? HAND : SERIF }));
    txt(g, 'Signed:', -250, 120, 20, '#3a3a50', { align: 'left' });
    line(g, [[-160, 160], [140, 160]], '#3a3a50', 1.4);
    g.restore();
    // the faint name, and what he has traced
    SIGN.forEach(s => line(g, s, 'rgba(60,60,80,0.22)', 6, 0));
    SIGN_PTS.forEach((p, i) => { if (st.signed.has(i)) iell(g, p[0], p[1], 3.4, 3.4, '#1e2650', { lw: 0, stroke: false }); });
    if (!st.f.pen) { g.save(); g.translate(950, 460); g.rotate(-0.3); line(g, [[-80, 0], [70, 0]], '#2a2a2a', 9); line(g, [[70, 0], [96, 0]], '#9a8a5a', 4); g.restore(); }
    else if (!st.f.signed && st.ptr.x >= 0) { g.save(); g.translate(st.ptr.x, st.ptr.y); g.rotate(-0.8); line(g, [[0, 0], [10, -4]], '#9a8a5a', 3); line(g, [[10, -4], [120, -4]], '#2a2a2a', 8); g.restore(); }
    lamp(g, 640, 360, 600, 0.35);
  },
  treasury(g, st, t) {
    const glow = (x, y, on) => { if (!on) return; const k = 0.5 + 0.5 * Math.sin(t * 3); g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rad(g, x, y, 10, 150, [[0, `rgba(255,214,140,${0.55 * k})`], [1, 'rgba(255,214,140,0)']]); g.fillRect(x - 160, y - 160, 320, 320); g.restore(); };
    glow(640, 330, !st.f.mem1);
    g.save(); g.translate(640, 330); g.rotate(-0.04); irect(g, -75, -60, 150, 120, '#e6dcc4', { lw: 2 }); drawRegisterMini(g, -64, -50, 128, 92); g.restore();
    if (st.f.photo) { glow(960, 260, !st.f.mem2); g.save(); g.translate(960, 260); g.rotate(0.05); irect(g, -64, -54, 128, 108, '#e6dcc4', { lw: 2 }); drawWeddingPhoto(g, -56, -46, 112, 88); g.restore(); }
  },
  memView(g, st, t) { if (st.mem) drawMemory(g, st, st.mem); },
  bedMain(g, st, t) {
    drawRain(g, 852, 82, 226, 266, t, tune.rainAmount * 0.4, 'rgba(230,230,230,0.25)');
    // the coat and cap on the hook, until he takes them
    if (!st.f.ending) { shape(g, [[1196, 150], [1240, 150], [1256, 330], [1180, 330]], PAL.coat, { lw: 2 }); shape(g, [[1196, 140], [1240, 140], [1236, 126], [1200, 126]], '#4a4038', { lw: 1.6 }); }
    iell(g, 200, 398, 80, 30, '#ece8da', { lw: 2.2 });
    const quilt = [[0, '#8a5a4a'], [1, '#5a3a30']];
    if (!st.f.awake) { shape(g, [[250, 404], [420, 384], [560, 396], [720, 392], [730, 470], [240, 476]], lin(g, 0, 384, 0, 476, quilt), { lw: 2.4 }); dabs(g, 260, 396, 460, 70, '#000', 20, 30, 0.12); drawJohnInBed(g, 210, 392, t, { noBody: true }); }
    else { shape(g, [[260, 410], [700, 404], [710, 470], [250, 476]], lin(g, 0, 404, 0, 476, quilt), { lw: 2.4 }); g.save(); g.translate(560, 470); g.scale(0.9, 0.9); drawJohnSeated(g, 0, 0, t, { noCap: true }); g.restore(); drawSmoke(g, 560 + 115 * 0.9, 470 - 162 * 0.9, t, tune.smokeAmount * 0.7); }
    // the cat: on his chest, pawing him, leaping, on the rug, then chasing
    const leap = st.f.catLeap ? Math.min(1, (t - st.f.catLeap) / 1.1) : 0;
    if (st.f.runT) {
      const k = t - st.f.runT, mx = Math.min(1300, 520 + k * tune.mouseSpeed), cx = Math.min(1300, 640 + Math.max(0, k - 0.5) * tune.catSpeed);
      if (!st.f.catGone) { drawWindMouse(g, mx, 690 - Math.max(0, mx - 900) * 0.25, 1, { tail: true, run: k }); drawCat(g, cx, 680 - Math.max(0, cx - 900) * 0.25, t, k > 0.5 ? 'run' : 'sit'); }
    } else if (st.f.catRug) { /* asleep on the rug: drawn with the rug */ }
    else if (leap > 0) drawCat(g, 430 + leap * 210, 400 + leap * 270 - Math.sin(leap * Math.PI) * 120, t, 'run');
    else drawCat(g, 430, 410, t, st.f.paw ? 'sit' : 'sleep');
    // the rug, rolling back; the boards under it
    const rp = st.f.rug ? 1 : (st.dragP.rug || 0);
    if (rp > 0) {
      for (let i = 0; i < 5; i++) {
        const x = 440 + i * 84;
        if (i === HEART_BOARD && st.f.board) { irect(g, x, 594, 80, 96, '#140c06', { lw: 2 }); poly(g, [[x, 594], [x + 80, 594], [x + 90, 560], [x + 10, 556]], '#6a4a2e', { lw: 2 }); if (!hasItem(st, 'safeKey') && !st.f.safeUnlocked) { g.save(); g.translate(x + 40, 642); iconSafeKey(g, 0, 0, 1); g.restore(); } }
        else { irect(g, x, 594, 80, 96, i % 2 ? '#6a4a2e' : '#5e4028', { lw: 2 }); woodGrain(g, x + 2, 596, 76, 92, '#000', 0.25); }
        if (i === HEART_BOARD && !st.f.board) shape(g, [[x + 40, 660], [x + 28, 646], [x + 32, 636], [x + 40, 642], [x + 48, 636], [x + 52, 646]], '#3a2414', { lw: 1 });
      }
    }
    const rw = 440 * (1 - rp);
    if (rw > 4) {
      irect(g, 420 + 440 - rw, 580, rw, 120, '#7a2a2a', { lw: 2.6 });
      irect(g, 436 + 440 - rw, 594, Math.max(0, rw - 32), 92, null, { lw: 2, stroke: '#c9a35a' });
      if (rp > 0) iell(g, 420 + 440 - rw, 640, 18, 62, '#6a2222', { lw: 2.2 });
      if (st.f.catRug && !st.f.catGone && !st.f.runT) drawCat(g, 640, 670, t, 'sleep');
    }
    if (st.f.alarm) { const k = (t * 4) % 1; g.save(); g.globalAlpha = 1 - k; txt(g, '~ ~', 60 + k * 30, 300, 40, PAL.paleOchre); g.restore(); }
    lamp(g, 965, 215, 700, 0.35);
  },
  bedLeft(g, st, t) {
    // the alarm clock behind the books
    const shakeX = st.f.alarm ? Math.sin(t * 60) * 2 : 0;
    drawAlarmClock(g, 295 + shakeX, 268, 0.42, st.f.alarm, t);
    if (!st.f.books) { for (let i = 0; i < 4; i++) irect(g, 246 - i * 2, 280 - i * 13, 140 + i * 4, 13, ['#6a2a22', '#3a4a3a', '#7a5a2a', '#2a2a3a'][i], { lw: 1.4 }); }
    else for (let i = 0; i < 4; i++) irect(g, 360 + i * 3, 280 - i * 13, 120, 13, ['#6a2a22', '#3a4a3a', '#7a5a2a', '#2a2a3a'][i], { lw: 1.4 });
    if (!st.f.mouseTaken) drawWindMouse(g, 780, 356, 0.9, {});
    iell(g, 910, 354, 40, 10, '#5a5a56', { lw: 2 }); iell(g, 910, 350, 32, 6, '#3a3a38', { lw: 1.2 });
    if (!st.f.nailTaken) iconNail(g, 914, 344, 0.7);
    if (st.f.alarm) { const k = (t * 4) % 1; g.save(); g.globalAlpha = 1 - k; txt(g, '~', 300, 210 - k * 30, 40, PAL.paleOchre); g.restore(); }
    lamp(g, 1090, 300, 500, 0.55);
  },
  bedRight(g, st, t) {
    g.save(); g.translate(305, 145);
    if (!st.f.photo) { irect(g, -62, -52, 124, 104, '#5a3a24', { lw: 2.4 }); line(g, [[-40, -40], [0, -60], [40, -40]], '#8a8a80', 1.4); txt(g, '', 0, 0, 10, INK); }
    else { irect(g, -62, -52, 124, 104, '#3a2614', { lw: 2.6 }); drawWeddingPhoto(g, -52, -42, 104, 84); }
    g.restore();
    if (!st.f.pokerTaken) { line(g, [[470, 470], [460, 310]], '#2a2a2a', 5); iell(g, 459, 304, 7, 5, PAL.brass, { lw: 1.2 }); }
    drawSafe(g, 920, 280, 1, { open: st.f.safeOpen });
    lamp(g, 300, 150, 300, 0.4);
  },
  bedUp(g, st, t) {
    // the paper birds she made, turning on their threads
    [[840, 220, 0], [920, 300, 1], [990, 240, 2]].forEach(([x, y, i]) => {
      line(g, [[x, 0], [x, y - 20]], 'rgba(230,220,200,0.7)', 1);
      g.save(); g.translate(x, y); g.scale(Math.cos(t * 0.6 + i * 2), 1);
      poly(g, [[-30, 0], [0, -14], [30, 0], [0, 6]], '#e6dcc4', { lw: 1.4 }); poly(g, [[0, -14], [10, -30], [6, -8]], '#d8ccb0', { lw: 1.2 });
      g.restore();
    });
    iell(g, 640, 440, 40, 26, '#5a4a2a', { lw: 2 }); iell(g, 640, 452, 26, 10, 'rgba(255,230,170,0.4)', { lw: 1 });
  },
  clockClose(g, st, t) {
    closeBack(g, '#2a1c12');
    const p = st.f.clockBack ? 1 : (st.dragP.turnClock || 0);
    const sx = Math.abs(Math.cos(p * Math.PI)), backSide = p > 0.5;
    g.save(); g.translate(640, 360); g.scale(Math.max(0.04, sx), 1);
    drawAlarmClock(g, 0, 0, 1.6, st.f.alarm && !backSide, t, backSide);
    g.restore();
    if (backSide) {
      const lp = !st.f.alarm ? 1 : (st.dragP.lever || 0);
      irect(g, 728, 270 + lp * 70, 34, 60, PAL.brassHi, { lw: 2 }); txt(g, 'STOP', 745, 250, 18, PAL.cream, { bold: true });
      line(g, [[745, 270], [745, 400]], 'rgba(0,0,0,0.4)', 4);
    }
    lamp(g, 640, 300, 600, 0.4);
  },
  safeClose(g, st, t) {
    closeBack(g, '#1c140e');
    g.save(); g.translate(352, 60); g.scale(2.6, 2.6); drawSafe(g, 0, 0, 1, { open: st.f.safeOpen }); g.restore();
    if (!st.f.safeOpen) {
      g.fillStyle = '#2a2a2a'; g.fillRect(400, 160, 480, 80);
      txt(g, 'J. & M.  1849', 640, 200, 30, PAL.brassHi, { italic: true });
      irect(g, 500, 450, 360, 80, '#3a2a14', { lw: 2.2 });
      st.dials.forEach((d, i) => {
        const x = 560 + i * 120;
        irect(g, x - 34, 460, 68, 60, lin(g, 0, 460, 0, 520, [[0, '#6a5a3a'], [0.5, '#ead8a8'], [1, '#6a5a3a']]), { lw: 2 });
        txt(g, String(d).padStart(2, '0'), x, 490, 34, INK, { bold: true });
        const c = st.f.safeUnlocked ? PAL.brassHi : '#6a5a3a';
        poly(g, [[x - 20, 440], [x + 20, 440], [x, 410]], c, { lw: 1.6 }); poly(g, [[x - 20, 534], [x + 20, 534], [x, 564]], c, { lw: 1.6 });
        txt(g, ['DAY', 'MONTH', 'YEAR'][i], x, 590, 14, PAL.paleOchre);
      });
    } else {
      // inside: her ribbon, her letters, the toy box
      line(g, [[450, 470], [490, 430], [520, 470], [550, 440]], '#8a2a3a', 7);
      for (let i = 0; i < 3; i++) irect(g, 750 + i * 6, 420 - i * 10, 140, 70, '#e6dcc4', { lw: 1.6 }); line(g, [[750, 450], [900, 440]], '#7a3a2a', 2);
      drawToyBox(g, 650, 400, 1.4);
    }
    lamp(g, 640, 300, 600, 0.4);
  },
  boxClose(g, st, t) {
    closeBack(g, '#1c140e');
    g.fillStyle = rad(g, 640, 360, 0, 560, [[0, 'rgba(255,220,160,0.22)'], [1, 'rgba(255,220,160,0)']]); g.fillRect(0, 0, 1280, 720);
    // body, front with four carved figures
    poly(g, [[360, 360], [920, 360], [920, 600], [360, 600]], lin(g, 0, 360, 0, 600, [[0, '#8a5634'], [1, '#5a341e']]), { lw: 3 });
    woodGrain(g, 362, 362, 556, 236, '#1a0e06', 0.3);
    FIGS.forEach((name, k) => {
      const x = 480 + k * 120, y = 470, pressed = k === st.boxBird ? 0 : st.boxStep > 0 && st.boxSeq.slice(0, st.boxStep).includes(k) ? 6 : 0;
      irect(g, x - 48, y - 48 + pressed, 96, 96, '#6a4024', { lw: 2 });
      drawFigure(g, name, x, y + pressed);
    });
    // the side panel and its crank
    const pp = st.f.panel ? 1 : (st.dragP.panel || 0);
    poly(g, [[920, 360], [980, 330], [980, 570], [920, 600]], '#4a2a1a', { lw: 2.6 });
    if (pp > 0) { iell(g, 960, 400, 10, 10, '#1a0e06', { lw: 1 }); g.save(); g.translate(960, 400); g.rotate(st.crankA); line(g, [[0, 0], [40, 0]], PAL.brass, 6); iell(g, 44, 0, 8, 8, '#8a5634', { lw: 1.6 }); g.restore(); }
    poly(g, [[920, 360 + pp * 120], [980, 330 + pp * 120], [980, 470 + pp * 100], [920, 500 + pp * 100]], '#6a4024', { lw: 2.2 });
    if (!st.f.boxOpen) {
      poly(g, [[340, 200], [940, 200], [920, 360], [360, 360]], lin(g, 0, 200, 0, 360, [[0, '#9a6640'], [1, '#6a3e28']]), { lw: 3 });
      woodGrain(g, 350, 204, 580, 150, '#1a0e06', 0.3);
      // the bird on the lid: it rises and points when the crank turns
      const up = st.boxBird >= 0 ? 1 : 0, ang = st.boxBird >= 0 ? Math.atan2(470 - 260, (480 + st.boxBird * 120) - 640) : -0.3;
      g.save(); g.translate(640, 270 - up * 30);
      line(g, [[0, 0], [0, 30]], PAL.brass, 4);
      g.rotate(ang);
      shape(g, [[-30, -10], [10, -16], [38, 0], [10, 10], [-30, 8], [-44, -6]], '#c9a35a', { lw: 2 }); poly(g, [[36, -3], [56, 0], [36, 4]], '#8a6a2a', { lw: 1.4 });
      g.restore();
    } else {
      poly(g, [[360, 360], [920, 360], [940, 120], [340, 120]], '#5a3424', { lw: 3 });
      irect(g, 380, 330, 520, 30, '#8a2a3a', { lw: 2 });
      g.save(); g.translate(640, 240); g.rotate(-0.05); irect(g, -110, -50, 220, 100, PAL.paper, { lw: 2 }); line(g, [[-90, -20], [60, -22]], '#24305a', 1.4); line(g, [[-90, 2], [70, 0]], '#24305a', 1.4); line(g, [[-90, 24], [20, 22]], '#24305a', 1.4); g.restore();
    }
  },
  listClose(g, st, t) {
    g.fillStyle = '#120d08'; g.fillRect(0, 0, 1280, 720);
    g.save(); g.translate(640, 370); g.rotate(-0.02);
    poly(g, [[-330, -330], [330, -336], [336, 330], [-326, 336]], lin(g, 0, -330, 0, 330, [[0, '#ead9b0'], [1, '#d4bf8f']]), { lw: 2.4 });
    line(g, [[-330, -60], [334, -64]], 'rgba(120,90,50,0.3)', 1.4); line(g, [[-2, -332], [2, 334]], 'rgba(120,90,50,0.25)', 1.4);
    txt(g, 'Things I never got to do', -280, -280, 38, '#2a2a5a', { align: 'left', font: HAND });
    line(g, [[-280, -252], [150, -254]], '#2a2a5a', 1.6);
    const age = t - (st.f.listRead || t);
    LIST.forEach((s, i) => {
      const show = age - (0.5 + i * tune.listLineGap); if (show <= 0) return;
      g.save(); g.globalAlpha = Math.min(1, show / 0.8);
      irect(g, -282, -214 + i * 62, 22, 22, null, { lw: 1.6, stroke: '#2a2a5a' });
      txt(g, s, -244, -203 + i * 62, 27, '#2a2a5a', { align: 'left', font: HAND });
      g.restore();
    });
    if (age > 0.5 + LIST.length * tune.listLineGap) txt(g, '— M.', 230, 280, 30, '#2a2a5a', { font: HAND });
    g.restore();
  },
};

// Small pictures used in several places.
function drawRegisterMini(g, x, y, w, h) {
  g.fillStyle = '#e6dcc4'; g.fillRect(x, y, w, h);
  for (let i = 0; i < 6; i++) line(g, [[x + 6, y + 14 + i * 13], [x + w - 6, y + 14 + i * 13]], 'rgba(40,40,60,0.35)', 1, 0.2);
  txt(g, 'John Smith', x + w * 0.66, y + h - 12, 11, '#24305a', { font: HAND });
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(150,115,60,0.35)'; g.fillRect(x, y, w, h); g.restore();
}
function drawWeddingPhoto(g, x, y, w, h) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = lin(g, 0, y, 0, y + h, [[0, '#cbbd9c'], [1, '#8f846c']]); g.fillRect(x, y, w, h);
  const k = w / 120;
  g.save(); g.translate(x + w * 0.36, y + h); g.scale(k * 0.3, k * 0.3); drawMary(g, 0, 0, 0, { laugh: true }); g.restore();
  g.save(); g.translate(x + w * 0.66, y + h * 0.62); g.scale(k * 0.22, k * 0.22); drawYoungJohn(g, 0, 0, 1, {}); g.restore();
  g.restore();
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(150,115,60,0.4)'; g.fillRect(x, y, w, h); g.restore();
}
function drawAlarmClock(g, x, y, s, ringing, t, backSide = false) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const hit = ringing ? Math.sin(t * 60) * 0.3 : 0;
  line(g, [[-50, 80], [-70, 120]], '#3a2a1a', 8); line(g, [[50, 80], [70, 120]], '#3a2a1a', 8);
  [-1, 1].forEach(sd => { g.save(); g.translate(sd * 60, -88); g.rotate(sd * (0.4 + hit * sd)); iell(g, 0, 0, 34, 24, PAL.brassHi, { lw: 2.2 }); g.restore(); });
  iell(g, 0, 0, 100, 100, PAL.brass, { lw: 3 });
  if (!backSide) {
    iell(g, 0, 0, 84, 84, '#efe6d0', { lw: 2 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; txt(g, String(i || 12), Math.cos(a) * 66, Math.sin(a) * 66, 18, INK); }
    line(g, [[0, 0], [0, -50]], INK, 4); line(g, [[0, 0], [34, 6]], INK, 5);
  } else {
    iell(g, 0, 0, 84, 84, '#9a7a3a', { lw: 2 });
    iconKey(g, -36, -10, 1); iconKey(g, 20, 30, 0.8);
  }
  g.restore();
}
function drawFigure(g, name, x, y) {
  g.save(); g.translate(x, y);
  const c = '#d8a878';
  if (name === 'house') { poly(g, [[-26, 26], [-26, -4], [0, -28], [26, -4], [26, 26]], c, { lw: 2 }); irect(g, -8, 6, 16, 20, '#8a5634', { lw: 1.4 }); }
  else if (name === 'ship') { poly(g, [[-30, 10], [30, 10], [20, 26], [-20, 26]], c, { lw: 2 }); line(g, [[0, 10], [0, -30]], '#8a5634', 3); poly(g, [[2, -28], [24, 4], [2, 4]], c, { lw: 1.6 }); }
  else if (name === 'tree') { iell(g, 0, -8, 28, 24, c, { lw: 2 }); irect(g, -5, 14, 10, 16, '#8a5634', { lw: 1.4 }); }
  else { shape(g, [[-22, 18], [-18, -10], [-8, -24], [8, -24], [18, -10], [22, 18]], c, { lw: 2 }); iell(g, 0, 24, 6, 6, '#8a5634', { lw: 1.2 }); }
  g.restore();
}

// The memories: three moments each, played like old film. Pause to look closer.
function drawMemory(g, st, m) {
  const F = tune.memFrame, t = m.t, part = Math.min(2, Math.floor(t / F)), pt = (t - part * F) / F;
  g.save();
  if (m.id === 1) {
    if (part === 0) { // the register page, the camera drifting over it
      g.fillStyle = '#2a1e14'; g.fillRect(0, 0, 1280, 720);
      g.save(); g.translate(640, 380 - pt * 30); g.scale(1.1 + pt * 0.1, 1.1 + pt * 0.1); g.translate(-640, -360);
      irect(g, 200, 60, 880, 620, '#e6dcc4', { lw: 2.4 });
      txt(g, 'REGISTER OF DEATHS · PARISH OF ST. AUBIN', 640, 110, 24, '#3a2a1a', { bold: true });
      ['No.      Name                     Age     Cause', '141      Thomas Bell               71      old age', '142      Mary Smith                24      in childbed'].forEach((s, i) => txt(g, s, 260, 180 + i * 46, i ? 22 : 18, i === 2 ? '#24305a' : '#3a3a50', { align: 'left', font: i === 2 ? HAND : SERIF }));
      line(g, [[240, 200], [1040, 200]], 'rgba(40,40,60,0.4)', 1.4);
      txt(g, 'Date of death:', 300, 460, 22, '#3a3a50', { align: 'left' });
      txt(g, '14th March 1851', 580, 460, 32, '#24305a', { align: 'left', font: HAND });
      txt(g, 'Informant:', 300, 560, 22, '#3a3a50', { align: 'left' });
      txt(g, 'John Smith', 580, 560, 36, '#24305a', { align: 'left', font: HAND });
      g.restore();
    } else if (part === 1) { // young John, the rain behind him
      g.fillStyle = '#3a4448'; g.fillRect(0, 0, 1280, 720);
      irect(g, 760, 60, 360, 420, '#2a2622', { lw: 3 }); drawRain(g, 772, 72, 336, 396, t, 160, 'rgba(220,230,235,0.5)');
      drawYoungJohn(g, 520, 470 - pt * 60, 2.2, { tear: pt });
    } else { // the officer at his counter
      g.fillStyle = '#4a3c2c'; g.fillRect(0, 0, 1280, 720);
      irect(g, 0, 460, 1280, 260, '#5a3a24', { lw: 3 });
      drawOfficer(g, 760, 470, t);
      g.save(); g.translate(260, 760); g.scale(1, 1); drawYoungJohn(g, 0, -170, 1.4, { look: 12 }); g.restore();
      if (pt > 0.15) memLine(g, 'Officer', "Are you feeling alright, sir? You're all done here. You may go home now.");
    }
  } else {
    if (part === 0) { // the bedroom, young and bright; she comes in and kneels
      g.drawImage(roomBg('bedMain', BG_SCALE), 0, 0, 1280, 720);
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,220,160,0.25)'; g.fillRect(0, 0, 1280, 720); g.restore();
      irect(g, 420, 580, 440, 120, '#a03a3a', { lw: 2.6 });
      drawMary(g, 300 + ease(pt * 1.4) * 300, 690, t, { kneel: pt > 0.7 });
    } else if (part === 1) { // the boards: the heart knot, the key going under
      g.fillStyle = '#3a2614'; g.fillRect(0, 0, 1280, 720);
      for (let i = 0; i < 5; i++) { const x = 200 + i * 180; irect(g, x, 300, 170, 420, i % 2 ? '#7a5a3a' : '#6e4e30', { lw: 2.4 }); woodGrain(g, x + 4, 304, 162, 412, '#000', 0.25); }
      const lift = Math.sin(Math.min(1, pt * 1.3) * Math.PI) * 60;
      irect(g, 560, 300, 170, 420, '#140c06', { lw: 2 });
      poly(g, [[560, 300 - lift], [730, 300 - lift], [730, 720 - lift * 0.3], [560, 720 - lift * 0.3]], '#7a5a3a', { lw: 2.4 });
      shape(g, [[645, 560 - lift * 0.6], [615, 528 - lift * 0.6], [622, 500 - lift * 0.6], [645, 516 - lift * 0.6], [668, 500 - lift * 0.6], [675, 528 - lift * 0.6]], '#3a2414', { lw: 1.6 });
      if (pt > 0.3 && pt < 0.75) { g.save(); g.translate(640, 380 + (pt - 0.3) * 200); iconSafeKey(g, 0, 0, 2); g.restore(); }
      shape(g, [[900 - pt * 200, 0], [1000 - pt * 200, 0], [940 - pt * 260, 300], [860 - pt * 260, 330]], '#e3c4a0', { lw: 2.2 }); // her hand
    } else { // the rug rolls back over it; she looks up and laughs
      g.drawImage(roomBg('bedMain', BG_SCALE), 0, 0, 1280, 720);
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,220,160,0.25)'; g.fillRect(0, 0, 1280, 720); g.restore();
      irect(g, 420, 580, 440, 120, '#a03a3a', { lw: 2.6 });
      g.save(); g.translate(640, 1040); g.scale(1.6, 1.6); drawMary(g, 0, 0, t, { kneel: true, laugh: pt > 0.3, reach: 0 }); g.restore();
      if (pt > 0.4) memLine(g, 'Mary', "Don't look, John! It's a secret.");
    }
  }
  g.restore();
  // old film: sepia, grain, flicker, a frame
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(190,150,90,0.55)'; g.fillRect(0, 0, 1280, 720); g.restore();
  g.fillStyle = `rgba(255,240,200,${0.04 + 0.04 * hash(Math.floor(t * 12))})`; g.fillRect(0, 0, 1280, 720);
  drawVignette(g, 1280, 720, 0.9);
  // the progress line and the paused mark
  const len = F * 3;
  line(g, [[340, 636], [940, 636]], 'rgba(230,200,140,0.35)', 3, 0); line(g, [[340, 636], [340 + 600 * Math.min(1, t / len), 636]], PAL.paleOchre, 3, 0);
  if (m.paused && !m.done) txt(g, 'paused', 640, 610, 18, PAL.paleOchre, { italic: true });
}
function memLine(g, who, s) {
  g.save(); g.font = `italic 26px ${SERIF}`; const w = Math.min(1180, g.measureText(`${who}: ${s}`).width + 60);
  g.fillStyle = 'rgba(10,6,3,0.6)'; g.fillRect(640 - w / 2, 540, w, 50); txt(g, `${who}:  ${s}`, 640, 566, 26, PAL.cream, { italic: true }); g.restore();
}

// The shots: full-frame moments the scripts cut to.
const SHOTS = {
  black(g) { g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720); },
  quote(g, st, t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720);
    const a = Math.min(1, t / 0.8, (tune.quoteTime - t) / 0.6);
    g.save(); g.globalAlpha = Math.max(0, a);
    drawPlate(g, 640, 360, 820, 200);
    txt(g, '"Memento Mori."', 640, 320, 40, PAL.cream, { italic: true });
    txt(g, '"Remember that you must die."', 640, 370, 30, PAL.paleOchre, { italic: true });
    txt(g, '— Ancient Roman philosophical tradition', 900, 430, 16, '#cdbb94', { align: 'right', italic: true });
    g.restore();
  },
  collapse(g, st, t) {
    g.drawImage(roomBg('factory', BG_SCALE), 0, 0, 1280, 720);
    // John on the floor by his bench, the stool on its side
    g.save(); g.translate(1060, 650); g.rotate(-Math.PI / 2 + 0.1); g.scale(0.62, 0.62); drawJohnStanding(g, 0, 0, 0, { noCig: true }); g.restore();
    poly(g, [[1150, 640], [1210, 600], [1220, 616], [1160, 656]], '#5a3b24', { lw: 2 });
    [[0, '#4a4a52', -40], [0.3, '#5a4a3a', 10], [0.6, '#3a4a4a', 60]].forEach(([d, c, off], i) => {
      const k = Math.min(1, Math.max(0, (t - d) / 1.6)), x = 120 + i * 120 + k * (760 - i * 60 + off);
      drawWorker(g, x, 680, t, { run: k < 1, alarm: true, coat: c, s: 0.9 });
    });
    lamp(g, 1060, 560, 400, 0.4);
  },
  corridorPan(g, st, t) {
    const k = ease(t / tune.panTime), s = 1 + k * 0.5;
    g.save(); g.translate(640, 360); g.scale(s, s); g.translate(-640 + k * 230, -360 + k * 10);
    g.drawImage(roomBg('corridor', BG_SCALE), 0, 0, 1280, 720);
    g.restore();
  },
  smile(g, st, t) {
    g.fillStyle = '#2a1e14'; g.fillRect(0, 0, 1280, 720);
    lamp(g, 900, 200, 700, 0.5);
    drawOldFace(g, 640, 400, 3.2, ease(t / tune.smileTime));
  },
  gold(g, st, t) {
    const L = tune.goldTime, k = Math.min(1, t / (L * 0.45)), fly = Math.max(0, (t - L * 0.55) / (L * 0.45));
    if (fly <= 0) {
      LIVE.formClose(g, st, st.t);
      g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = rad(g, 610, 480, 0, 60 + k * 1100, [[0, 'rgba(255,205,110,0.95)'], [0.7, 'rgba(230,170,70,0.75)'], [1, 'rgba(230,170,70,0)']]); g.fillRect(0, 0, 1280, 720); g.restore();
    } else {
      g.fillStyle = '#e8b860'; g.fillRect(0, 0, 1280, 720); shade(g, ease(fly) * 0.9);
      const e = ease(fly), cx = 640 + (1108 - 640) * e, cy = 360 + (684 - 360) * e, s = 1 - e * 0.88;
      g.save(); g.translate(cx, cy); g.rotate(-0.08 * e); g.scale(s, s);
      irect(g, -260, -200, 520, 400, '#f0e6cc', { lw: 3 });
      g.fillStyle = '#c9a060'; g.fillRect(-240, -180, 480, 330);
      g.save(); g.translate(-240, -180); g.scale(480 / 1280, 330 / 720); drawRoom(g, st, 'office'); g.restore();
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(200,150,70,0.5)'; g.fillRect(-240, -180, 480, 330); g.restore();
      g.restore();
    }
  },
  card30(g, st, t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1280, 720);
    const a = Math.min(1, t / 1, (tune.cardTime - t) / 0.8);
    g.save(); g.globalAlpha = Math.max(0, a); txt(g, '30 days left...', 640, 360, 56, PAL.paleOchre, { italic: true }); g.restore();
  },
  endAsh(g, st, t) {
    g.fillStyle = '#2a1c12'; g.fillRect(0, 0, 1280, 720); woodGrain(g, 0, 380, 1280, 340, '#000', 0.2);
    iell(g, 640, 470, 220, 60, '#5a5a56', { lw: 3 }); iell(g, 640, 456, 180, 40, '#3a3a38', { lw: 2 });
    const k = ease(t / (tune.endShotTime * 0.6));
    g.save(); g.translate(760 - k * 80, 300 + k * 140); g.rotate(0.4);
    line(g, [[-90, 0], [0, 0]], PAL.white, 16, 0.2); iell(g, 2, 0, 9, 8, k < 1 ? '#ff7a2a' : '#5a5a5a', { lw: 1 });
    shape(g, [[-260, -40], [-90, -24], [-80, 24], [-260, 40]], PAL.skin, { lw: 2.4 });
    g.restore();
    if (k < 1) drawSmoke(g, 700 - k * 60, 420, st.t, tune.smokeAmount, 1.6);
    lamp(g, 640, 300, 600, 0.5);
  },
  endPour(g, st, t) {
    g.fillStyle = '#3a3026'; g.fillRect(0, 0, 1280, 720);
    iell(g, 640, 600, 280, 90, '#c9c4b2', { lw: 3 }); iell(g, 640, 590, 240, 70, '#8a8a80', { lw: 2 });
    const k = ease(t / (tune.endShotTime * 0.4));
    g.save(); g.translate(560, 260); g.rotate(k * 2.0);
    shape(g, [[-30, 60], [30, 60], [30, -40], [12, -70], [12, -110], [-12, -110], [-12, -70], [-30, -40]], 'rgba(70,90,60,0.95)', { lw: 2.4 });
    g.restore();
    if (k > 0.8) { const w = 6 + Math.sin(st.t * 30); line(g, [[690, 290], [700, 420], [690, 580]], 'rgba(180,150,80,0.7)', w, 1.5); }
    lamp(g, 640, 200, 600, 0.4);
  },
  endPin(g, st, t) {
    wallpaper(g, 0, 0, 1280, 720, '#6b5a3e', '#4a3c28');
    const k = ease(t / (tune.endShotTime * 0.5));
    g.save(); g.translate(640, 380 - (1 - k) * 40); g.rotate(-0.04);
    poly(g, [[-200, -240], [200, -244], [204, 240], [-196, 244]], lin(g, 0, -240, 0, 240, [[0, '#ead9b0'], [1, '#d4bf8f']]), { lw: 2.4 });
    txt(g, 'Things I never got to do', -170, -190, 26, '#2a2a5a', { align: 'left', font: HAND });
    LIST.forEach((s, i) => { irect(g, -172, -146 + i * 44, 16, 16, null, { lw: 1.4, stroke: '#2a2a5a' }); txt(g, s, -146, -138 + i * 44, 18, '#2a2a5a', { align: 'left', font: HAND }); });
    iell(g, 0, -226, 9, 9, '#8a2a1a', { lw: 1.4 });
    g.restore();
    if (k < 1) { g.save(); g.translate(660, 130 - (1 - k) * 60); shape(g, [[-40, -80], [20, -60], [24, 10], [-40, 30]], PAL.skin, { lw: 2.4 }); g.restore(); }
  },
  endDoor(g, st, t) {
    g.drawImage(roomBg('bedMain', BG_SCALE), 0, 0, 1280, 720);
    const k = ease(t / (tune.endDoorTime * 0.5)), walk = ease((t - tune.endDoorTime * 0.4) / (tune.endDoorTime * 0.5));
    g.fillStyle = `rgba(255,236,190,${0.9 * k})`; g.fillRect(1150, 120, 130 * k, 360);
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = lin(g, 1280, 300, 700, 600, [[0, `rgba(255,230,180,${0.5 * k})`], [1, 'rgba(255,230,180,0)']]); g.beginPath(); g.moveTo(1150, 120); g.lineTo(1280, 120); g.lineTo(1280, 720); g.lineTo(700, 720); g.closePath(); g.fill(); g.restore();
    poly(g, [[1150, 120], [1150 - 80 * k, 100], [1150 - 80 * k, 500], [1150, 480]], '#4a2e1a', { lw: 2.4 });
    g.save(); g.globalAlpha = 1 - Math.max(0, walk - 0.7) / 0.3; drawJohnStanding(g, 980 + walk * 220, 560, st.t, { noCig: true }); g.restore();
    g.save(); g.translate(330, 160); g.rotate(-0.04); irect(g, -40, -50, 80, 100, '#ead9b0', { lw: 1.6 }); iell(g, 0, -46, 4, 4, '#8a2a1a', { lw: 0.8 }); g.restore(); // the list, pinned
  },
};
// Old John's face, close: the smile comes slowly (s from 0 to 1).
function drawOldFace(g, x, y, k, s) {
  g.save(); g.translate(x, y); g.scale(k, k);
  shape(g, [[-90, 120], [-70, 60], [-20, 46], [30, 46], [76, 60], [96, 120]], '#3b3029', { lw: 2 });
  iell(g, 0, -10, 52, 62, PAL.skin, { lw: 2.4 });
  dabs(g, -36, 10, 72, 40, '#6b5a4c', 50, 3, 0.5);
  shape(g, [[-48, -30], [-40, -66], [0, -78], [40, -66], [50, -30], [30, -50], [-30, -50]], '#8f8a80', { lw: 1.6 });
  shape(g, [[-4, -18], [16, 16], [8, 24], [-8, 20]], PAL.skinDark, { lw: 2 });
  const lift = s * 6;
  shape(g, [[-30, 28 - lift], [-14, 22], [0, 26], [14, 22], [30, 28 - lift], [20, 34 - lift * 0.5], [0, 32], [-20, 34 - lift * 0.5]], '#7d776c', { lw: 1.6 });
  line(g, [[-16, 44 - s * 4], [0, 46 + s * 2], [16, 44 - s * 4]], '#6a3a2a', 2.2, 0.3); // the mouth, turning up
  // eyes soften, the lines at their corners deepen
  line(g, [[-30, -16 + s * 2], [-12, -16 - s * 2], [-6, -14]], INK, 2.2); line(g, [[8, -14], [14, -16 - s * 2], [32, -16 + s * 2]], INK, 2.2);
  if (s > 0.3) { line(g, [[-40, -12], [-34, -6]], 'rgba(60,40,30,0.6)', 1.2); line(g, [[-40, -6], [-34, -2]], 'rgba(60,40,30,0.6)', 1.2); line(g, [[42, -12], [36, -6]], 'rgba(60,40,30,0.6)', 1.2); line(g, [[42, -6], [36, -2]], 'rgba(60,40,30,0.6)', 1.2); }
  line(g, [[-34, -30], [-10, -32]], '#5a4a40', 3); line(g, [[10, -32], [34, -30]], '#5a4a40', 3);
  iell(g, -54, -6, 8, 13, PAL.skinDark, { lw: 1.4 }); iell(g, 54, -6, 8, 13, PAL.skinDark, { lw: 1.4 });
  g.restore();
}

// ---- The frame: room or shot, the transition, the HUD -------------------------------------------
function storyDraw(g, st, mouse) {
  const t = st.t;
  if (st.shot && SHOTS[st.shot.name]) SHOTS[st.shot.name](g, st, t - st.shot.t0);
  else if (st.shot && typeof SHOT_DRAW !== 'undefined' && SHOT_DRAW[st.shot.name]) SHOT_DRAW[st.shot.name](g, t - st.shot.t0);
  else if (st.fade) drawFade(g, st);
  else {
    const pan = Math.min(1, (t - st.enterT) / tune.settleTime);
    g.save();
    if (pan < 1 && !ROOMS[st.room].close) { const e = 1 - Math.pow(1 - pan, 3); g.translate(640, 360); g.scale(1.03 - 0.03 * e, 1.03 - 0.03 * e); g.translate(-640, -360); }
    drawRoom(g, st, st.room);
    g.restore();
  }
  if (st.barsOut !== undefined && t - st.barsOut < tune.barsTime && !st.shot) letterbox(g, 1 - (t - st.barsOut) / tune.barsTime);
  if (st.sub && st.shot && t - st.sub.t0 < st.sub.dur) { const a = Math.min(1, (t - st.sub.t0) * 2, (st.sub.dur - (t - st.sub.t0)) * 2); g.save(); g.globalAlpha = Math.max(0, a); g.font = `italic 24px ${SERIF}`; wrapLines(g, st.sub.text, 1000).forEach((ln, i, all) => txt(g, ln, 640, 600 - (all.length - 1 - i) * 30, 24, PAL.paleOchre, { italic: true })); g.restore(); }
  if (st.map) drawMap(g, st);
  drawGrain(g, 1280, 720, tune.grain);
  if (!(st.room === 'memView' && !st.shot)) drawVignette(g, 1280, 720, tune.vignette);
  const play = !st.shot && !st.fade && !st.done;
  if (play && !st.script && st.hl > t) { const a = Math.min(1, (st.hl - t) / 0.4); spotsHere(st).forEach(s => drawGlow(g, s.r[0], s.r[1], s.r[2], s.r[3], a)); }
  if (play) drawHud(g, st, mouse);
  if (st.plaque) { const a = Math.min(1, (t - st.plaque.t0) * 3, (tune.plaqueTime - (t - st.plaque.t0)) * 2); g.save(); g.globalAlpha = Math.max(0, a); drawPlate(g, 640, 40, 360, 52); txt(g, st.plaque.text, 640, 41, 26, PAL.cream, { italic: true }); g.restore(); }
  else if (st.tut && play && !st.talk) drawTut(g, st);
  if (st.talk) drawTalk(g, st);
  if (st.hint && play) drawHint(g, st);
  if (st.look) drawLook(g, st);
  if (play) drawCursor(g, st, mouse);
}
function drawFade(g, st) {
  const f = st.fade, p = f.t / f.dur, first = p < 0.5, q = first ? p * 2 : (1 - p) * 2; // q: 0 clear → 1 black
  const name = first ? f.from : f.to;
  g.save();
  if (f.slide) { const d = { left: 1, right: -1 }[f.slide] || 0, v = { up: 1, down: -1 }[f.slide] || 0, off = first ? p * 2 : (p - 1) * 2; g.translate(d * off * 160, v * off * 120); }
  else if (f.anchor) {
    const [ax, ay] = f.anchor, inward = f.dir === 'in';
    const s = inward ? (first ? 1 + p * 2 * 0.8 : 1.15 - (p - 0.5) * 2 * 0.15) : (first ? 1 - p * 2 * 0.1 : 1.8 - (p - 0.5) * 2 * 0.8);
    const fx = (inward ? first : !first) ? ax : 640, fy = (inward ? first : !first) ? ay : 360;
    g.translate(fx, fy); g.scale(s, s); g.translate(-fx, -fy);
  }
  if (st.room === 'memView' && name === 'memView' && st.mem) drawMemory(g, st, st.mem); else drawRoom(g, st, name);
  g.restore();
  g.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(1, q * (f.slide ? 0.7 : 1)))})`; g.fillRect(0, 0, 1280, 720);
}
function drawHud(g, st, mouse) {
  const t = st.t, ui = k => showUI(st, k);
  const button = (k, label, icon) => {
    const r = UI[k], hov = inRect(mouse.x, mouse.y, r);
    irect(g, r[0], r[1], r[2], r[3], hov ? 'rgba(90,64,40,0.85)' : 'rgba(40,28,18,0.75)', { lw: 1.8, stroke: PAL.ochre });
    if (icon) icon(r[0] + 24, r[1] + r[3] / 2);
    txt(g, label, r[0] + (icon ? 60 : r[2] / 2), r[1] + r[3] / 2 + 1, 19, PAL.paleOchre, { italic: true });
  };
  if (st.days) { poly(g, [[16, 12], [86, 10], [88, 72], [18, 74]], PAL.paper, { lw: 1.8 }); irect(g, 16, 10, 72, 14, '#8a3a2a', { lw: 1.2 }); txt(g, String(st.days), 52, 50, 28, '#3a2410', { bold: true }); txt(g, 'days', 52, 86, 14, PAL.paleOchre, { italic: true }); }
  if (ui('hint')) button('hint', 'Hint');
  if (ui('album')) {
    button('album', 'Album', (x, y) => { irect(g, x - 12, y - 14, 24, 28, '#6a3a2a', { lw: 1.4 }); irect(g, x - 8, y - 9, 16, 12, '#e6dcc4', { lw: 0.8 }); });
    if (st.memNew) { const k = 0.5 + 0.5 * Math.sin(t * 5); g.save(); g.globalAlpha = k; drawGlow(g, UI.album[0], UI.album[1], UI.album[2], UI.album[3], 1); g.restore(); }
  }
  if (ui('map')) button('map', 'Map');
  if (ui('back')) { const r = UI.back, hov = inRect(mouse.x, mouse.y, r); poly(g, [[r[0] + 10, r[1] + 30], [r[0] + 36, r[1] + 8], [r[0] + 62, r[1] + 30], [r[0] + 48, r[1] + 30], [r[0] + 48, r[1] + 50], [r[0] + 24, r[1] + 50], [r[0] + 24, r[1] + 30]], hov ? PAL.paleOchre : 'rgba(217,183,121,0.6)', { lw: 1.8 }); }
  if (ui('pause') && st.mem && !st.mem.done) { const r = UI.pause; irect(g, r[0], r[1], r[2], r[3], 'rgba(40,28,18,0.75)', { lw: 1.6, stroke: PAL.ochre }); if (st.mem.paused) poly(g, [[r[0] + 20, r[1] + 14], [r[0] + 40, r[1] + 26], [r[0] + 20, r[1] + 38]], PAL.paleOchre, { lw: 1.2 }); else { irect(g, r[0] + 18, r[1] + 14, 7, 24, PAL.paleOchre, { lw: 1 }); irect(g, r[0] + 31, r[1] + 14, 7, 24, PAL.paleOchre, { lw: 1 }); } }
  // turning arrows
  ['arrowL', 'arrowR', 'arrowU', 'arrowD'].forEach(k => {
    if (!uiArrow(st, k) || st.script) return;
    const [x, y, w, h] = arrowRect(st, k), hov = inRect(mouse.x, mouse.y, [x, y, w, h]), c = hov ? PAL.paleOchre : 'rgba(217,183,121,0.55)';
    const P = { arrowL: [[x + w, y], [x, y + h / 2], [x + w, y + h]], arrowR: [[x, y], [x + w, y + h / 2], [x, y + h]], arrowU: [[x, y + h], [x + w / 2, y], [x + w, y + h]], arrowD: [[x, y], [x + w / 2, y + h], [x + w, y]] }[k];
    poly(g, P, c, { lw: 1.8 });
  });
  // the inventory tab on the left, with its arrow
  if (st.inv.length) {
    if (st.invOpen) {
      irect(g, 0, 100, 112, Math.max(120, st.inv.length * 82 + 30), 'rgba(30,20,12,0.82)', { lw: 1.8, stroke: '#5a4028' });
      st.inv.forEach((id, i) => {
        const [x, y, w, h] = slotRect(i);
        irect(g, x, y, w, h, st.sel === id ? 'rgba(217,183,121,0.35)' : 'rgba(0,0,0,0.25)', { lw: 1.4, stroke: '#5a4028' });
        g.save(); if (st.sel === id) g.globalAlpha = 0.4; ICONS[id](g, x + w / 2, y + h / 2, 0.9); g.restore();
      });
      irect(g, 112, 100, 24, 44, 'rgba(30,20,12,0.82)', { lw: 1.4, stroke: '#5a4028' }); poly(g, [[130, 110], [118, 122], [130, 134]], 'rgba(217,183,121,0.8)', { lw: 1.2 });
      const i = st.inv.findIndex((_, k) => inRect(mouse.x, mouse.y, slotRect(k)));
      if (i >= 0) { const [x, y, w, h] = slotRect(i); txt(g, ITEMS[st.inv[i]].name, x + w + 40, y + h / 2, 17, PAL.cream, { italic: true, align: 'left' }); }
    } else { irect(g, 0, 300, 26, 120, 'rgba(30,20,12,0.82)', { lw: 1.6, stroke: '#5a4028' }); poly(g, [[6, 330], [22, 360], [6, 390]], 'rgba(217,183,121,0.7)', { lw: 1.2 }); }
  }
  // a touch on something that wants another gesture
  if (st.tapHint && t - st.tapHint.t0 < 1.6) { const a = 1 - (t - st.tapHint.t0) / 1.6; g.save(); g.globalAlpha = a; iell(g, st.tapHint.x, st.tapHint.y, 30 + (1 - a) * 20, 30 + (1 - a) * 20, null, { lw: 2, stroke: PAL.paleOchre }); txt(g, st.tapHint.text, st.tapHint.x, st.tapHint.y - 52, 18, PAL.cream, { italic: true }); g.restore(); }
}
function drawTut(g, st) {
  const tt = st.tut, a = Math.min(1, (st.t - tt.t0) * 2);
  g.save(); g.globalAlpha = a;
  g.font = `italic 22px ${SERIF}`; const w = Math.min(1100, g.measureText(tt.text).width + 70);
  drawPlate(g, 640, 40, w, 48); txt(g, tt.text, 640, 41, 22, PAL.cream, { italic: true });
  if (tt.ring) { const k = 0.5 + 0.5 * Math.sin(st.t * 4), [x, y, r] = tt.ring; g.globalAlpha = a * (0.4 + 0.4 * k); g.fillStyle = rad(g, x, y, 0, r * (1 + 0.15 * k), [[0, 'rgba(255,230,180,0.5)'], [0.7, 'rgba(255,230,180,0.25)'], [1, 'rgba(255,230,180,0)']]); g.beginPath(); g.arc(x, y, r * 1.2, 0, 6.3); g.fill(); iell(g, x, y, r * (0.9 + 0.1 * k), r * (0.9 + 0.1 * k), null, { lw: 2, stroke: 'rgba(255,230,180,0.8)' }); }
  if (tt.arrow) { const [[x0, y0], [x1, y1]] = tt.arrow, k = (st.t * 0.8) % 1, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k, ang = Math.atan2(y1 - y0, x1 - x0); g.globalAlpha = a * (1 - k * 0.6); g.save(); g.translate(x, y); g.rotate(ang); poly(g, [[-40, -12], [10, -12], [10, -26], [44, 0], [10, 26], [10, 12], [-40, 12]], 'rgba(240,200,90,0.9)', { lw: 2 }); g.restore(); }
  g.restore();
}
function drawTalk(g, st) {
  const l = st.talk, age = st.t - l.t0, a = Math.max(0, Math.min(1, age * 4));
  g.save(); g.globalAlpha = a;
  const s = l.who ? `${l.who}:  ${l.text}` : l.text;
  g.font = `italic 25px ${SERIF}`;
  const lines = wrapLines(g, s, 1040), h = 30 + lines.length * 34;
  irect(g, 100, 700 - h - 14, 1080, h, 'rgba(14,9,5,0.82)', { lw: 1.6, stroke: '#7a5a30' });
  lines.forEach((ln, i) => txt(g, ln, 640, 700 - h - 14 + 32 + i * 34, 25, l.who ? (l.who === 'John' ? PAL.cream : '#e6d6ad') : PAL.paleOchre, { italic: true }));
  if (!l.auto && age > tune.talkMinTime) { const k = 0.5 + 0.5 * Math.sin(st.t * 5); g.globalAlpha = a * k; poly(g, [[1150, 676], [1166, 676], [1158, 688]], PAL.paleOchre, { lw: 1 }); }
  g.restore();
}
function wrapLines(g, s, maxW) {
  const words = s.split(' '), out = []; let cur = '';
  words.forEach(w => { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > maxW && cur) { out.push(cur); cur = w; } else cur = test; });
  if (cur) out.push(cur); return out;
}
function drawHint(g, st) {
  const h = st.hint, age = st.t - h.t0, a = Math.max(0, Math.min(1, age * 4, (tune.hintShowTime - age) * 2));
  g.save(); g.globalAlpha = a; g.translate(960, 150); g.rotate(-0.02);
  poly(g, [[-250, -60], [250, -64], [256, 64], [-246, 68]], PAL.paper, { lw: 2 });
  txt(g, `Hint ${h.level + 1} of 3`, -226, -40, 16, '#8a5a3a', { align: 'left', italic: true });
  g.font = `20px ${SERIF}`; wrapLines(g, h.lines[h.level], 452).forEach((ln, i) => txt(g, ln, -226, -12 + i * 24, 20, '#2a1d14', { align: 'left' }));
  g.restore();
}
function drawLook(g, st) {
  shade(g, 0.7, '0,0,0');
  g.save(); g.translate(640, 330); g.rotate(-0.02); poly(g, [[-300, -200], [300, -204], [304, 200], [-296, 204]], PAL.paper, { lw: 2.4 }); g.restore();
  ICONS[st.look](g, 640, 250, 3);
  ITEMS[st.look].look.forEach((s, i) => txt(g, s, 640, 420 + i * 36, 26, '#2a1d14', { font: i ? HAND : SERIF, italic: !i }));
  txt(g, 'click to put it away', 640, 560, 16, '#cdbb94', { italic: true });
}
function drawMap(g, st) {
  g.drawImage(roomBg('map', BG_SCALE), 0, 0, 1280, 720);
  MAP_PLACES.forEach(p => {
    g.save(); if (!p.open) g.globalAlpha = 0.45;
    iell(g, p.x, p.y, 26, 20, p.open ? '#a07a4a' : '#9a9a90', { lw: 1.8 });
    poly(g, [[p.x - 16, p.y + 6], [p.x - 16, p.y - 6], [p.x, p.y - 18], [p.x + 16, p.y - 6], [p.x + 16, p.y + 6]], p.open ? '#6a3a2a' : '#7a7a74', { lw: 1.4 });
    txt(g, p.name, p.x, p.y + 38, 20, p.open ? '#3a2410' : '#6a6a64', { italic: true });
    g.restore();
  });
  const k = 0.5 + 0.5 * Math.sin(st.t * 4); iell(g, 600, 300, 40 + k * 6, 34 + k * 6, null, { lw: 3, stroke: '#a02a1a' });
  txt(g, 'You are here', 600, 236, 16, '#a02a1a', { italic: true });
  txt(g, 'Swipe up, right-click or Esc to close', 640, 690, 16, '#5a4028', { italic: true });
}
function drawCursor(g, st, m) {
  if (m.x < 0 || m.touch) return;
  if (st.f.pen && !st.f.signed && st.room === 'formClose') return;
  const over = !st.script && !st.talk && (spotAt(st, m.x, m.y) || Object.keys(UI).some(k => showUI(st, k) && inRect(m.x, m.y, UI[k])));
  if (st.sel) { g.save(); g.globalAlpha = 0.9; ICONS[st.sel](g, m.x + 8, m.y + 8, 0.8); g.restore(); }
  g.save(); g.translate(m.x, m.y);
  if (over && !st.sel) shape(g, [[0, 0], [6, 0], [7, 14], [16, 12], [22, 16], [22, 30], [14, 38], [4, 38], [-4, 26], [-6, 16], [0, 18]], PAL.cream, { lw: 1.8 });
  else if (!st.sel) poly(g, [[0, 0], [0, 24], [7, 18], [12, 28], [16, 26], [11, 16], [19, 16]], PAL.cream, { lw: 1.8 });
  g.restore();
}
