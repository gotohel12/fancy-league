/* FANCY LEAGUE — procedural audio engine (SFX, engines, crowd, music)
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function () {
'use strict';
let ctx = null, master, comp, bus = {}, NB = null, crowd = null, music = null;
const vol = { master: 0.85, sfx: 0.9, music: 0.45, crowd: 0.55 };
function init() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return ctx; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
  master = ctx.createGain(); master.gain.value = vol.master; master.connect(comp);
  for (const k of ['sfx', 'music', 'crowd']) { bus[k] = ctx.createGain(); bus[k].gain.value = vol[k]; bus[k].connect(master); }
  NB = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = NB.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
function setVol(o) { Object.assign(vol, o); if (!ctx) return; master.gain.value = vol.master; for (const k in bus) bus[k].gain.value = vol[k]; }
const now = () => ctx.currentTime;
function env(g, t, a, peak, d, sustain = 0.0001) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), t + a + d); }
function tone(f, dur, o = {}) {
  if (!ctx) return; const t = now() + (o.delay || 0), osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t); if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  if (o.detune) osc.detune.value = o.detune;
  let node = osc; if (o.lp) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); node = fl; }
  node.connect(g); g.connect(o.dest || bus.sfx); env(g, t, o.a || 0.005, o.g || 0.2, dur); osc.start(t); osc.stop(t + dur + 0.05);
}
function noise(dur, o = {}) {
  if (!ctx) return; const t = now() + (o.delay || 0), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = NB; s.loop = true; f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || 0.7;
  s.connect(f); f.connect(g); g.connect(o.dest || bus.sfx); env(g, t, o.a || 0.003, o.g || 0.2, dur); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
const SFX = {
  hit(p) { const k = Math.min(1, p / 1400); tone(110, 0.2, { to: 42, g: 0.35 + 0.45 * k }); noise(0.12, { f: 2400, to: 400, g: 0.18 + 0.4 * k }); tone(520 + k * 400, 0.09, { type: 'triangle', g: 0.05 + 0.08 * k }); },
  bounce(p) { const k = Math.min(1, p / 1200); tone(80, 0.14, { to: 40, g: 0.15 + 0.25 * k }); noise(0.07, { f: 900, g: 0.08 + 0.12 * k }); },
  jump() { noise(0.2, { type: 'bandpass', f: 700, to: 2600, q: 1.2, g: 0.12 }); },
  flip() { noise(0.32, { type: 'bandpass', f: 500, to: 3200, q: 2, g: 0.14 }); tone(300, 0.2, { type: 'triangle', to: 900, g: 0.03 }); },
  land(p) { noise(0.1, { f: 450, g: Math.min(0.25, 0.04 + p / 4000) }); },
  bump(p) { tone(90, 0.16, { to: 50, g: 0.3 }); noise(0.1, { f: 1500, g: 0.2 }); },
  demo() { noise(1.3, { f: 1800, to: 80, g: 0.7, a: 0.01 }); tone(70, 0.9, { to: 28, g: 0.6 }); tone(140, 0.4, { type: 'sawtooth', to: 40, g: 0.15, lp: 500 }); },
  goal() {
    const chord = [220, 277.18, 329.63, 440];
    chord.forEach((f, i) => { tone(f, 2.2, { type: 'sawtooth', g: 0.12, a: 0.08, lp: 1800, detune: (i - 1.5) * 6 }); tone(f * 1.005, 2.2, { type: 'sawtooth', g: 0.08, a: 0.1, lp: 1400 }); });
    noise(0.6, { f: 4000, to: 200, g: 0.4 }); tone(55, 1.4, { to: 35, g: 0.5 });
    cheer(1);
  },
  count() { tone(660, 0.14, { type: 'triangle', g: 0.22 }); },
  go() { tone(990, 0.5, { type: 'triangle', g: 0.25 }); tone(1980, 0.3, { type: 'sine', g: 0.08 }); },
  whistle() { for (let i = 0; i < 6; i++) tone(2950 + (i % 2) * 180, 0.07, { delay: i * 0.065, g: 0.08 }); },
  click() { tone(1400, 0.035, { type: 'square', g: 0.035, lp: 4000 }); },
  hover() { tone(900, 0.025, { type: 'sine', g: 0.025 }); },
  back() { tone(700, 0.05, { type: 'square', g: 0.03, to: 400, lp: 3000 }); },
  coin() { tone(1320, 0.09, { type: 'triangle', g: 0.12 }); tone(1760, 0.16, { type: 'triangle', g: 0.12, delay: 0.08 }); },
  buy() { [660, 880, 1320].forEach((f, i) => tone(f, 0.15, { type: 'triangle', g: 0.12, delay: i * 0.07 })); },
  error() { tone(200, 0.2, { type: 'square', g: 0.06, lp: 900 }); },
  win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.25, { type: 'triangle', g: 0.13, delay: i * 0.12 })); },
  lose() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.35, { type: 'triangle', g: 0.1, delay: i * 0.18 })); },
  rankup() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, { type: 'sawtooth', g: 0.07, lp: 2400, delay: i * 0.09 })); },
  intro() { noise(1.6, { type: 'bandpass', f: 200, to: 5000, q: 1.5, g: 0.18, a: 1.2 }); tone(55, 2.4, { g: 0.4, a: 1.4, to: 50 }); tone(110, 2.2, { type: 'sawtooth', g: 0.05, a: 1.3, lp: 700 }); },
  slam() { tone(60, 1.2, { to: 30, g: 0.8 }); noise(0.9, { f: 3000, to: 120, g: 0.5 }); tone(220, 1.6, { type: 'sawtooth', g: 0.08, lp: 1200 }); tone(330, 1.6, { type: 'sawtooth', g: 0.06, lp: 1200 }); },
  quick() { tone(1046, 0.08, { type: 'triangle', g: 0.08 }); tone(1318, 0.1, { type: 'triangle', g: 0.08, delay: 0.06 }); }
};
/* engines & boost (continuous, local players only) */
const engines = {};
function engine(id) {
  if (!ctx) return null; if (engines[id]) return engines[id];
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0;
  o1.connect(f); o2.connect(f); f.connect(g); g.connect(bus.sfx); o1.start(); o2.start();
  const bs = ctx.createBufferSource(), bf = ctx.createBiquadFilter(), bg = ctx.createGain();
  bs.buffer = NB; bs.loop = true; bf.type = 'bandpass'; bf.frequency.value = 1300; bf.Q.value = 0.6; bg.gain.value = 0;
  bs.connect(bf); bf.connect(bg); bg.connect(bus.sfx); bs.start();
  return engines[id] = { o1, o2, f, g, bf, bg, boosting: 0 };
}
function engineUpdate(id, speed, throttle, boosting, grounded, on = true) {
  const e = engine(id); if (!e) return; const t = now();
  const k = Math.min(1, speed / 1300);
  e.o1.frequency.setTargetAtTime(48 + k * 95 + (grounded ? 0 : 18), t, 0.06); e.o2.frequency.setTargetAtTime(24 + k * 48, t, 0.06);
  e.f.frequency.setTargetAtTime(300 + k * 1100 + throttle * 300, t, 0.08);
  e.g.gain.setTargetAtTime(on ? 0.025 + k * 0.05 + throttle * 0.02 : 0, t, 0.08);
  e.bg.gain.setTargetAtTime(on && boosting ? 0.16 : 0, t, 0.04); e.bf.frequency.setTargetAtTime(1100 + k * 900, t, 0.1);
  if (boosting && !e.boosting) noise(0.18, { type: 'highpass', f: 2000, g: 0.06 });
  e.boosting = boosting;
}
function stopEngines() { for (const id in engines) { const e = engines[id]; try { e.g.gain.setTargetAtTime(0, now(), 0.05); e.bg.gain.setTargetAtTime(0, now(), 0.05); } catch (x) {} } }
/* crowd */
function crowdOn(on) {
  if (!ctx) return;
  if (!crowd) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = NB; s.loop = true; f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 0.4; f2.type = 'lowpass'; f2.frequency.value = 2200;
    s.connect(f); f.connect(f2); f2.connect(g); g.connect(bus.crowd); g.gain.value = 0; s.start(); crowd = { g, f };
  }
  crowd.g.gain.setTargetAtTime(on ? 0.12 : 0, now(), 0.6);
}
function cheer(k = 1) { if (!crowd) return; const t = now(); crowd.g.gain.cancelScheduledValues(t); crowd.g.gain.setTargetAtTime(0.12 + 0.55 * k, t, 0.08); crowd.g.gain.setTargetAtTime(0.12, t + 1.6, 0.9); crowd.f.frequency.setTargetAtTime(900, t, 0.1); crowd.f.frequency.setTargetAtTime(650, t + 1.5, 1); }
function ooh() { if (!crowd) return; const t = now(); crowd.g.gain.setTargetAtTime(0.32, t, 0.15); crowd.g.gain.setTargetAtTime(0.12, t + 0.7, 0.5); }
/* music — procedural synthwave */
const N = n => 440 * Math.pow(2, (n - 69) / 12);
const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
function musicStart(style = 'menu') {
  if (!ctx) return; if (music) { music.style = style; return; }
  music = { style, step: 0, next: now() + 0.1, tempo: 112, timer: null, out: ctx.createGain() };
  music.out.gain.value = 0; music.out.connect(bus.music); music.out.gain.setTargetAtTime(1, now(), 1.2);
  const spb = () => 60 / music.tempo / 4;
  music.timer = setInterval(() => {
    while (music && music.next < now() + 0.15) { sched(music.step, music.next); music.next += spb(); music.step++; }
  }, 30);
}
function sched(st, t) {
  const bar = Math.floor(st / 16) % 4, s = st % 16, ch = PROG[bar], o = music.out, intense = music.style === 'match' ? 0.6 : 1;
  const v = (f, d, type, g, lp, at = 0.01) => { const os = ctx.createOscillator(), gg = ctx.createGain(), fl = ctx.createBiquadFilter(); os.type = type; os.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = lp; os.connect(fl); fl.connect(gg); gg.connect(o); gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(g, t + at); gg.gain.exponentialRampToValueAtTime(0.0001, t + d); os.start(t); os.stop(t + d + 0.05); };
  if (s === 0) ch.forEach((n, i) => { v(N(n), 1.9, 'sawtooth', 0.035 * intense, 1300, 0.25); v(N(n) * 1.006, 1.9, 'sawtooth', 0.025 * intense, 900, 0.3); });
  if (s % 2 === 0) v(N(ch[0] - 24), 0.22, 'sawtooth', 0.09, 420);
  const arp = [0, 1, 2, 1][s % 4]; v(N(ch[arp] + 12 + (s >= 8 ? 12 : 0)), 0.14, 'square', 0.022 * intense, 2600);
  if (s % 4 === 0) { const os = ctx.createOscillator(), g = ctx.createGain(); os.frequency.setValueAtTime(150, t); os.frequency.exponentialRampToValueAtTime(42, t + 0.28); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); os.connect(g); g.connect(o); os.start(t); os.stop(t + 0.32); }
  if (s % 8 === 4) { const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = NB; f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8; g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); n.connect(f); f.connect(g); g.connect(o); n.start(t, Math.random()); n.stop(t + 0.2); }
  if (s % 2 === 1) { const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); n.buffer = NB; f.type = 'highpass'; f.frequency.value = 7500; g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); n.connect(f); f.connect(g); g.connect(o); n.start(t, Math.random()); n.stop(t + 0.05); }
}
function musicStop() { if (!music) return; const m = music; music = null; m.out.gain.setTargetAtTime(0, now(), 0.4); setTimeout(() => { clearInterval(m.timer); try { m.out.disconnect(); } catch (e) {} }, 1500); }
window.NLA = { init, setVol, vol, SFX, engineUpdate, stopEngines, crowdOn, cheer, ooh, musicStart, musicStop, get ctx() { return ctx; } };
})();
