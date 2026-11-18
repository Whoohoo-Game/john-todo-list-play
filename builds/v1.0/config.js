// PROTOTYPE - NOT FOR PRODUCTION
// Question: Does a short, nearly wordless opening chapter make the player feel for John, and want to start the list with him?
// Date: 2026-11-13
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },

  // ---- Gestures ----
  doubleTapTime: { value: 0.4, min: 0.2, max: 0.8, step: 0.02 },   // two taps within this make a double tap, seconds
  tapMove: { value: 12, min: 4, max: 40, step: 1 },                  // a press that moves less than this is a tap, px
  swipeDist: { value: 120, min: 40, max: 300, step: 10 },            // a swipe turns the room after this far, px
  pinchRatio: { value: 0.75, min: 0.4, max: 0.95, step: 0.05 },      // two fingers closing to this share of their start step back
  dragSpring: { value: 4, min: 1, max: 12, step: 0.5 },              // how fast an unfinished drag slides back, per second
  crankTurns: { value: 1, min: 0.5, max: 3, step: 0.25 },            // turns of the crank before the bird points
  traceRadius: { value: 30, min: 12, max: 60, step: 2 },             // how near the pen must pass a point of the name, px
  traceNeeded: { value: 0.8, min: 0.4, max: 1, step: 0.05 },         // share of the name to trace

  // ---- Pacing (seconds) ----
  fadeTime: { value: 1.0, min: 0.2, max: 2.5, step: 0.05 },          // cut between places
  zoomTime: { value: 0.8, min: 0.2, max: 2, step: 0.05 },            // zoom into or out of a close look
  turnTime: { value: 0.5, min: 0.1, max: 1.5, step: 0.05 },          // turning to another wall
  settleTime: { value: 2.2, min: 0, max: 6, step: 0.1 },             // the slow push-in as a place settles
  lineTime: { value: 2.8, min: 1, max: 6, step: 0.1 },               // how long one of John's short lines stays
  talkMinTime: { value: 0.35, min: 0, max: 1.5, step: 0.05 },        // a line stays at least this before a click reads on
  plaqueTime: { value: 3.6, min: 1, max: 8, step: 0.1 },             // the place's name plate
  hintShowTime: { value: 7, min: 3, max: 15, step: 0.5 },
  highlightTime: { value: 1.6, min: 0.5, max: 4, step: 0.1 },        // Space: how long hotspots glow

  // ---- Cinematics (seconds) ----
  barsTime: { value: 0.9, min: 0, max: 3, step: 0.1 },                // the cinema bars lifting when the player takes over
  quoteTime: { value: 5, min: 2, max: 10, step: 0.5 },               // "Memento Mori."
  panTime: { value: 3.2, min: 1, max: 8, step: 0.1 },                // the corridor push-in
  silenceTime: { value: 3, min: 0.5, max: 8, step: 0.25 },           // the doctor's pause
  smileTime: { value: 4.5, min: 1.5, max: 10, step: 0.25 },          // John's smile, close
  goldTime: { value: 4.5, min: 2, max: 10, step: 0.25 },             // the moment becomes a photograph
  cardTime: { value: 4.5, min: 2, max: 10, step: 0.25 },             // "30 days left..."
  memFrame: { value: 5, min: 2, max: 10, step: 0.25 },               // each of a memory's three moments
  runTime: { value: 2.2, min: 1, max: 5, step: 0.1 },                // the cat chasing the mouse out
  mouseSpeed: { value: 420, min: 150, max: 900, step: 10 },          // px per second
  catSpeed: { value: 400, min: 150, max: 900, step: 10 },
  listLineGap: { value: 1.1, min: 0.3, max: 3, step: 0.1 },          // her list, line by line
  listMin: { value: 3, min: 0, max: 10, step: 0.5 },                 // reading time before a click ends the chapter
  endShotTime: { value: 3.6, min: 1.5, max: 8, step: 0.1 },          // each of the ending's close shots
  endDoorTime: { value: 6, min: 3, max: 12, step: 0.25 },            // John walks out into the morning

  // ---- Look and sound ----
  smokeAmount: { value: 16, min: 0, max: 40, step: 1 },              // smoke puffs alive at once
  rainAmount: { value: 70, min: 0, max: 200, step: 5 },              // streaks on a window
  grain: { value: 0.16, min: 0, max: 0.5, step: 0.01 },              // paper grain over everything
  vignette: { value: 0.7, min: 0, max: 1, step: 0.05 },
  musicVolume: { value: 0.35, min: 0, max: 1, step: 0.05 },
  ambienceVolume: { value: 0.25, min: 0, max: 1, step: 0.05 },       // machines, rain, the hum
  alarmVolume: { value: 0.5, min: 0, max: 1, step: 0.05 },           // the alarm clock
};
