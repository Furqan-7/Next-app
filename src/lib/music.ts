/**
 * A small music-box waltz made with the Web Audio API, so the site needs no audio files.
 */

const BEAT = 0.5; // seconds per beat

// [midi note, beats]
const MELODY: [number, number][] = [
  [76, 1], [79, 1], [84, 1], [83, 2], [79, 1], [81, 2], [77, 1], [79, 3],
  [74, 1], [77, 1], [81, 1], [79, 2], [76, 1], [77, 2], [74, 1], [76, 3],
  [76, 1], [79, 1], [84, 1], [86, 2], [84, 1], [83, 2], [81, 1], [79, 3],
  [77, 1], [76, 1], [74, 1], [72, 2], [74, 1], [76, 2], [74, 1], [72, 3],
];
// One bass note per bar of three beats.
const BASS = [48, 43, 41, 48, 43, 45, 41, 48, 48, 52, 41, 43, 41, 43, 48, 48];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let nextTime = 0;
let step = 0;
let bassBeat = 0;
let melodyBeat = 0;

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function pluck(freq: number, at: number, dur: number, vol: number, type: OscillatorType) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(master);
  o.start(at);
  o.stop(at + dur + 0.05);
}

function schedule() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.5) {
    const [note, beats] = MELODY[step % MELODY.length];
    pluck(hz(note), nextTime, 1.6, 0.16, "triangle");
    pluck(hz(note + 12), nextTime, 0.8, 0.03, "sine");
    // Bass on each downbeat.
    while (bassBeat <= melodyBeat) {
      const bar = Math.floor(bassBeat / 3) % BASS.length;
      const at = nextTime + (bassBeat - melodyBeat) * BEAT;
      pluck(hz(BASS[bar]), at, 2.2, 0.1, "sine");
      pluck(hz(BASS[bar] + 7), at + BEAT, 1.0, 0.04, "sine");
      pluck(hz(BASS[bar] + 12), at + BEAT * 2, 1.0, 0.04, "sine");
      bassBeat += 3;
    }
    nextTime += beats * BEAT;
    melodyBeat += beats;
    step++;
  }
}

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    // A soft echo to make it feel like a music box in a big room.
    const delay = ctx.createDelay();
    delay.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.25;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    master.connect(lp).connect(ctx.destination);
    master.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(lp);
  }
  // Resuming inside the tap keeps mobile browsers from blocking the sound.
  void ctx.resume();
}

function startTune() {
  ensureContext();
  if (!ctx || timer != null) return;
  nextTime = ctx.currentTime + 0.1;
  step = 0;
  bassBeat = 0;
  melodyBeat = 0;
  timer = window.setInterval(schedule, 100);
}

/* ---------- Your own song ---------- */

let song: HTMLAudioElement | null = null;
let mode: "unknown" | "file" | "tune" = "unknown";

/**
 * Plays `songUrl` on a loop if that file exists, otherwise the built-in music-box tune.
 * Call it from a tap or click so the browser allows sound.
 */
export function startMusic(songUrl?: string) {
  if (typeof window === "undefined") return;
  ensureContext();
  if (mode === "tune" || !songUrl) {
    mode = "tune";
    startTune();
    return;
  }
  if (!song) {
    song = new Audio(songUrl);
    song.loop = true;
    song.preload = "auto";
    song.volume = 0.8;
  }
  song
    .play()
    .then(() => {
      mode = "file";
    })
    .catch(() => {
      // No song file (or it can't be played): fall back to the built-in tune.
      mode = "tune";
      song = null;
      startTune();
    });
}

export function stopMusic() {
  song?.pause();
  if (timer != null) window.clearInterval(timer);
  timer = null;
  void ctx?.suspend();
}
