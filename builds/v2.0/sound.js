// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-13
// sound.js: every sound made with Web Audio: ticking, rain, the hospital hum, a cough, the alarm,
// the cat, the memory chime and the rest. Nothing is loaded from disk.
'use strict';

let _noise = null, _amb = null;
function noiseBuf() {
  if (_noise) return _noise;
  const ac = audio.ac, b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = hash(i * 0.0137) * 2 - 1;
  _noise = b; return b;
}
// A short burst of filtered noise: clicks, strikes, coughs, rustles.
function noiseHit(dur, freq, q = 1, vol = 0.3, type = 'bandpass', when = 0) {
  if (!audio || muted) return;
  const ac = audio.ac, t = ac.currentTime + when, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(audio.out); s.start(t, hash(t) * 1.5); s.stop(t + dur + 0.05);
}
function bell(freq, dur, vol = 0.2, when = 0) { // a music-box tine
  if (!audio || muted) return;
  const ac = audio.ac, t = ac.currentTime + when;
  [[1, vol], [2.76, vol * 0.25], [5.4, vol * 0.08]].forEach(([m, v]) => {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = freq * m;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / m);
    o.connect(g).connect(audio.out); o.start(t); o.stop(t + dur + 0.05);
  });
}
function murmur(when = 0) { // one muffled syllable of the doctor's voice
  if (!audio || muted) return;
  const ac = audio.ac, t = ac.currentTime + when, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(105 + hash(t * 7) * 40, t); o.frequency.linearRampToValueAtTime(95 + hash(t * 3) * 30, t + 0.25);
  f.type = 'lowpass'; f.frequency.value = 380;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(f).connect(g).connect(audio.out); o.start(t); o.stop(t + 0.35);
}

const SFX = {
  tick: () => noiseHit(0.04, 3200, 8, 0.12 * tune.ambienceVolume * 3),
  tock: () => noiseHit(0.05, 2200, 8, 0.1 * tune.ambienceVolume * 3),
  match: () => { noiseHit(0.25, 2500, 0.6, 0.35); noiseHit(0.6, 900, 0.5, 0.12, 'bandpass', 0.1); },
  cough: () => { [0, 0.28, 0.5].forEach(w => noiseHit(0.22, 500, 0.8, 0.4, 'bandpass', w)); },
  gulp: () => { [0, 0.35].forEach(w => { noiseHit(0.12, 300, 4, 0.3, 'bandpass', w); tone(140, 0.12, 'sine', 0.15); }); },
  click: () => noiseHit(0.05, 1800, 3, 0.25),
  drawer: () => { noiseHit(0.4, 400, 0.6, 0.25); noiseHit(0.08, 1200, 2, 0.2, 'bandpass', 0.35); },
  pick: () => { noiseHit(0.06, 2600, 2, 0.2); bell(1320, 0.4, 0.06); },
  gear: () => { [0, 0.08, 0.16, 0.24].forEach(w => noiseHit(0.04, 2400, 6, 0.18, 'bandpass', w)); },
  wind: () => { for (let i = 0; i < 8; i++) noiseHit(0.03, 3000, 8, 0.2, 'bandpass', i * 0.09); },
  wrong: () => { tone(110, 0.25, 'triangle', 0.18); },
  solve: () => { bell(659, 1.6, 0.12); bell(988, 1.6, 0.08, 0.12); },
  lamp: () => { noiseHit(0.08, 900, 2, 0.25); },
  door: () => { noiseHit(0.9, 220, 0.7, 0.3); noiseHit(0.15, 700, 1.5, 0.2, 'bandpass', 0.8); },
  locker: () => { noiseHit(0.3, 1400, 1.2, 0.3); bell(220, 0.5, 0.05); },
  dial: () => noiseHit(0.03, 3600, 10, 0.2),
  paper: () => { noiseHit(0.3, 3000, 0.4, 0.15); noiseHit(0.2, 5000, 0.4, 0.1, 'highpass', 0.15); },
  heart: () => { tone(55, 0.18, 'sine', 0.4); setTimeout(() => tone(50, 0.18, 'sine', 0.3), 180); },
  beep: () => tone(1046, 0.12, 'sine', 0.06 * tune.ambienceVolume * 4),
  murmur: () => murmur(),
  thud: () => { noiseHit(0.5, 120, 0.7, 0.5); tone(60, 0.3, 'sine', 0.3); },
  siren: () => { for (let i = 0; i < 10; i++) bell(i % 2 ? 880 : 740, 0.5, 0.07, i * 0.28); for (let i = 0; i < 16; i++) noiseHit(0.06, 700, 2, 0.12, 'bandpass', 0.2 + i * 0.19 + (i % 2) * 0.05); }, // the horse ambulance: hand bell and hooves
  creak: () => { noiseHit(0.6, 300, 6, 0.18); tone(180, 0.5, 'sawtooth', 0.03); },
  step: () => { noiseHit(0.08, 500, 1, 0.12); },
  tape: () => { noiseHit(0.35, 4000, 0.5, 0.15, 'highpass'); },
  pull: () => { noiseHit(0.12, 2200, 3, 0.15); tone(330, 0.15, 'sine', 0.05); },
  page: () => { noiseHit(0.12, 3800, 0.6, 0.06, 'highpass'); },
  pen: () => { noiseHit(0.5, 5200, 0.4, 0.08, 'highpass'); },
  memory: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => bell(f, 2.6, 0.07, i * 0.18)); },
  meow: () => { if (!audio || muted) return; const ac = audio.ac, t = ac.currentTime, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(760, t + 0.15); o.frequency.linearRampToValueAtTime(430, t + 0.5);
    f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(f).connect(g).connect(audio.out); o.start(t); o.stop(t + 0.6); },
  hiss: () => { noiseHit(0.6, 5000, 0.8, 0.18, 'highpass'); },
  rug: () => { noiseHit(0.8, 600, 0.5, 0.2); },
  books: () => { [0, 0.1, 0.2].forEach(w => noiseHit(0.1, 700, 1.2, 0.2, 'bandpass', w)); },
  slide: () => { noiseHit(0.4, 1500, 2, 0.15); },
  tickSoft: () => noiseHit(0.02, 3600, 10, 0.06),
  stub: () => { noiseHit(0.3, 2500, 0.6, 0.12); noiseHit(0.5, 400, 0.6, 0.08, 'bandpass', 0.2); },
  pour: () => { for (let i = 0; i < 14; i++) noiseHit(0.18, 900 + (i % 3) * 300, 3, 0.12, 'bandpass', 0.6 + i * 0.12); },
  pin: () => { noiseHit(0.05, 3000, 4, 0.25); },
  ringNear: () => { for (let i = 0; i < 6; i++) bell(2100, 0.06, 0.05 * tune.alarmVolume * 2, i * 0.035); },
  ringFar: () => { for (let i = 0; i < 6; i++) bell(2100, 0.05, 0.018 * tune.alarmVolume * 2, i * 0.035); },
  rainDrop: () => noiseHit(0.05, 2600, 2, 0.03),
  exhale: () => noiseHit(1.4, 700, 0.4, 0.08),
  whistle: () => { if (!audio || muted) return; const ac = audio.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(560, t + 0.3); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.3); g.gain.setValueAtTime(0.05, t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); o.connect(g).connect(audio.out); o.start(t); o.stop(t + 2.5); }, // the factory whistle, far off
  chisel: () => { for (let i = 0; i < 6; i++) noiseHit(0.18, 3200, 1.5, 0.08, 'bandpass', i * 0.7); },
  tinFeet: () => { for (let i = 0; i < 12; i++) noiseHit(0.03, 4200, 8, 0.12, 'bandpass', i * 0.16); },
  slam: () => { noiseHit(0.4, 140, 0.8, 0.6); tone(70, 0.3, 'sine', 0.4); },
  clatter: () => { [0, 0.07, 0.15, 0.26, 0.4].forEach(w => noiseHit(0.08, 3000 + w * 2000, 3, 0.18, 'bandpass', w)); },
};
function sfx(name) { if (SFX[name]) SFX[name](); }

// An original little waltz in A minor for the music box.
const MELODY = [
  [76, 1], [81, 1], [84, 1], [83, 2], [81, 1], [76, 2], [77, 1], [81, 1], [86, 1], [84, 2], [83, 1], [79, 2],
  [76, 1], [81, 1], [84, 1], [88, 2], [86, 1], [84, 1], [83, 1], [81, 1], [80, 1], [81, 3],
];
function playMelody(beat = 0.42) {
  let w = 0;
  MELODY.forEach(([n, d]) => { bell(440 * Math.pow(2, (n - 69) / 12), 2.4, 0.16 * tune.musicVolume * 2, w); w += d * beat; });
  return w;
}

// Ambience: a looping noise bed whose colour and level follow the room.
const AMB = {
  factory: { freq: 320, q: 0.6, vol: 0.10 },   // machines and belts, far off
  hospital: { freq: 180, q: 1.5, vol: 0.10 },  // the hum
  office: { freq: 1400, q: 0.4, vol: 0.05 },   // rain on the window
  rain: { freq: 1600, q: 0.3, vol: 0.14 },     // rain on the street
  memory: { freq: 900, q: 0.3, vol: 0.06 },    // a film's hiss
  home: { freq: 1200, q: 0.4, vol: 0.05 },     // light rain at dawn
  none: { freq: 500, q: 1, vol: 0 },
};
function setAmbience(name) {
  if (!audio) return;
  const ac = audio.ac;
  if (!_amb) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf(); s.loop = true; f.type = 'bandpass'; g.gain.value = 0;
    s.connect(f).connect(g).connect(audio.out); s.start(); _amb = { f, g };
  }
  const a = AMB[name] || AMB.none, t = ac.currentTime;
  _amb.f.frequency.setTargetAtTime(a.freq, t, 0.5); _amb.f.Q.setTargetAtTime(a.q, t, 0.5);
  _amb.g.gain.setTargetAtTime(muted ? 0 : a.vol * tune.ambienceVolume * 4, t, 0.8);
}
