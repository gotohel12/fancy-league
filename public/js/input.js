/* FANCY LEAGUE — input: Rocket-League style controls (RL default PC layout) for keyboard+mouse, Xbox / PlayStation pads, touch
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function () {
'use strict';
const D = window.NLD;
const ACTIONS = ['fwd', 'back', 'left', 'right', 'jump', 'boost', 'slide', 'rollL', 'rollR', 'cam', 'rear', 'score'];
const DEF_BINDS = {
  // Rocket League default PC layout: RMB jump, LMB boost, L-Shift powerslide/air roll, Space ball cam, Q/E directional air roll, Tab scoreboard
  solo: { fwd: ['KeyW'], back: ['KeyS'], left: ['KeyA'], right: ['KeyD'], jump: ['Mouse2'], boost: ['Mouse0'], slide: ['ShiftLeft'], rollL: ['KeyQ'], rollR: ['KeyE'], cam: ['Space'], rear: ['Mouse1'], score: ['Tab'] },
  p1: { fwd: ['KeyW'], back: ['KeyS'], left: ['KeyA'], right: ['KeyD'], jump: ['Space'], boost: ['ShiftLeft'], slide: ['ControlLeft'], rollL: ['KeyQ'], rollR: ['KeyE'], cam: ['KeyC'], rear: ['KeyV'], score: ['Tab'] },
  p2: { fwd: ['ArrowUp'], back: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['Numpad0', 'Enter'], boost: ['ShiftRight'], slide: ['ControlRight'], rollL: ['Comma'], rollR: ['Period'], cam: ['Slash'], rear: ['Numpad1'], score: ['Backslash'] }
};
const DEF_SET = { deadzone: 0.15, ddz: 0.5, steer: 1, air: 1, vib: true, touchSize: 1, touchOpacity: 0.9, touchSwap: false, invertY: false };
let binds = JSON.parse(JSON.stringify(DEF_BINDS)), set = Object.assign({}, DEF_SET);
function load() { const b = D.LS.get('binds4', null), s = D.LS.get('ctl4', null); if (b) for (const k in DEF_BINDS) binds[k] = Object.assign({}, DEF_BINDS[k], b[k]); if (s) set = Object.assign({}, DEF_SET, s); }
function save() { D.LS.set('binds4', binds); D.LS.set('ctl4', set); }
const keys = new Set();
let capture = null, lastDevice = 'kb', gameMode = false;
window.addEventListener('keydown', e => {
  if (capture) { e.preventDefault(); const f = capture; capture = null; f(e.code); return; }
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  keys.add(e.code); lastDevice = 'kb';
  if (gameMode && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'ControlLeft', 'ShiftLeft'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('mousedown', e => { if (capture) { e.preventDefault(); const f = capture; capture = null; f('Mouse' + e.button); return; } if (gameMode && e.target && e.target.id === 'gl') { keys.add('Mouse' + e.button); e.preventDefault(); } });
window.addEventListener('mouseup', e => keys.delete('Mouse' + e.button));
window.addEventListener('contextmenu', e => { if (gameMode) e.preventDefault(); });
const has = list => (list || []).some(c => keys.has(c));
/* touch state */
const touch = { t1: { x: 0, y: 0, j: 0, b: 0, h: 0, cam: 0 }, t2: { x: 0, y: 0, j: 0, b: 0, h: 0, cam: 0 } };
function pads() { try { return Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean); } catch (e) { return []; } }
const btn = (p, i) => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.35);
const bval = (p, i) => p.buttons[i] ? (p.buttons[i].value || (p.buttons[i].pressed ? 1 : 0)) : 0;
function dz(v) { const d = set.deadzone; return Math.abs(v) < d ? 0 : Math.sign(v) * (Math.abs(v) - d) / (1 - d); }
function padState(p) {
  const x = dz(p.axes[0] || 0), y = dz(p.axes[1] || 0);
  const thr = bval(p, 7) - bval(p, 6);
  const o = { t: thr, s: x * set.steer, p: (set.invertY ? 1 : -1) * y * set.air, y: x * set.air, r: 0, j: btn(p, 0) ? 1 : 0, b: btn(p, 1) ? 1 : 0, h: btn(p, 2) ? 1 : 0, cam: btn(p, 3) ? 1 : 0, rear: btn(p, 11) ? 1 : 0, score: btn(p, 8) ? 1 : 0, pause: btn(p, 9), up: btn(p, 12), down: btn(p, 13), l: btn(p, 14), r: btn(p, 15), a: btn(p, 0), back: btn(p, 1), rx: dz(p.axes[2] || 0), ry: dz(p.axes[3] || 0) };
  if (btn(p, 4)) o.r = -1; if (btn(p, 5)) o.r = 1;
  return o;
}
function fromKeys(B) {
  const o = { t: 0, s: 0, p: 0, y: 0, r: 0, j: 0, b: 0, h: 0, cam: 0, rear: 0, score: 0, rx: 0, ry: 0 };
  const f = has(B.fwd), bk = has(B.back), l = has(B.left), r = has(B.right);
  o.t = (f ? 1 : 0) - (bk ? 1 : 0); o.p = o.t * (set.invertY ? -1 : 1); o.s = ((r ? 1 : 0) - (l ? 1 : 0)) * set.steer; o.y = o.s;
  o.j = has(B.jump) ? 1 : 0; o.b = has(B.boost) ? 1 : 0; o.h = has(B.slide) ? 1 : 0; o.cam = has(B.cam) ? 1 : 0; o.rear = has(B.rear) ? 1 : 0; o.score = has(B.score) ? 1 : 0;
  if (has(B.rollL)) o.r = -1; if (has(B.rollR)) o.r = 1;
  return o;
}
function finish(o) { if (o.h && !o.r) { o.r = o.s; o.y = 0; } o.t = Math.max(-1, Math.min(1, o.t)); o.s = Math.max(-1, Math.min(1, o.s)); o.p = Math.max(-1, Math.min(1, o.p)); o.y = Math.max(-1, Math.min(1, o.y)); return o; }
function fromTouch(T) { return { t: T.y, s: T.x * set.steer, p: T.y * (set.invertY ? -1 : 1) * set.air, y: T.x * set.air, r: 0, j: T.j, b: T.b, h: T.h, cam: T.cam, rear: 0, score: 0, rx: 0, ry: 0 }; }
function read(src) {
  let o;
  if (src === 'any') {
    o = fromKeys(binds.solo);
    for (const p of pads()) { const s = padState(p); if (s.t || s.s || s.j || s.b || s.p) lastDevice = 'pad'; for (const k of ['t', 's', 'p', 'y', 'r', 'rx', 'ry']) if (Math.abs(s[k]) > Math.abs(o[k])) o[k] = s[k]; for (const k of ['j', 'b', 'h', 'cam', 'rear', 'score']) o[k] |= s[k]; }
    const T = touch.t1; if (T.x || T.y || T.j || T.b || T.h || T.cam) { const t = fromTouch(T); for (const k of ['t', 's', 'p', 'y']) if (Math.abs(t[k]) > Math.abs(o[k])) o[k] = t[k]; for (const k of ['j', 'b', 'h', 'cam']) o[k] |= t[k]; }
  } else if (src === 'kb1') o = fromKeys(binds.p1);
  else if (src === 'kb2') o = fromKeys(binds.p2);
  else if (src && src.startsWith('pad')) { const i = +src.slice(3), p = pads().find(q => q.index === i); o = p ? padState(p) : { t: 0, s: 0, p: 0, y: 0, r: 0, j: 0, b: 0, h: 0, cam: 0, rear: 0, score: 0, rx: 0, ry: 0 }; }
  else if (src === 't1' || src === 't2') o = fromTouch(touch[src]);
  else o = { t: 0, s: 0, p: 0, y: 0, r: 0, j: 0, b: 0, h: 0, cam: 0, rear: 0, score: 0, rx: 0, ry: 0 };
  return finish(o);
}
function dpad(src) { const list = src === 'any' ? pads() : src && src.startsWith('pad') ? pads().filter(p => p.index === +src.slice(3)) : []; for (const p of list) { if (btn(p, 12)) return 0; if (btn(p, 14)) return 1; if (btn(p, 15)) return 2; if (btn(p, 13)) return 3; } return -1; }
function pausePressed() { return keys.has('Escape') || pads().some(p => btn(p, 9)); }
function rumble(src, strength = 0.5, dur = 120) {
  if (!set.vib) return;
  const list = src === 'any' ? pads() : src && src.startsWith('pad') ? pads().filter(p => p.index === +src.slice(3)) : [];
  for (const p of list) { try { p.vibrationActuator && p.vibrationActuator.playEffect('dual-rumble', { duration: dur, strongMagnitude: strength, weakMagnitude: strength * 0.6 }); } catch (e) {} }
  if (isTouch() && navigator.vibrate) { try { navigator.vibrate(Math.min(60, dur / 2)); } catch (e) {} }
}
const isTouch = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
function padName(p) { const id = (p.id || '').toLowerCase(); if (/054c|playstation|dualsense|dualshock|wireless controller/.test(id)) return 'PlayStation'; if (/xbox|045e|xinput/.test(id)) return 'Xbox'; if (/nintendo|057e/.test(id)) return 'Nintendo'; return 'Gamepad'; }

/* ---------- touch controls: joystick + buttons ---------- */
const ICON = {
  jump: '<svg viewBox="0 0 48 48"><path d="M24 8 L38 26 H29 V40 H19 V26 H10 Z" fill="currentColor"/></svg>',
  boost: '<svg viewBox="0 0 48 48"><path d="M27 4 L11 28 H22 L19 44 L37 18 H26 Z" fill="currentColor"/></svg>',
  drift: '<svg viewBox="0 0 48 48"><path d="M10 30c6-14 22-14 28 0" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M33 22l6 9-10 1" fill="currentColor"/></svg>',
  cam: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="13" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="24" cy="24" r="4" fill="currentColor"/></svg>'
};
function buildTouch(root, dual) {
  root.innerHTML = '';
  root.style.setProperty('--tcs', set.touchSize); root.style.opacity = set.touchOpacity;
  const clusters = dual ? [['t1', 'l'], ['t2', 'r']] : [['t1', 'full']];
  for (const [id, side] of clusters) {
    const st = touch[id]; Object.assign(st, { x: 0, y: 0, j: 0, b: 0, h: 0, cam: 0 });
    const swap = set.touchSwap && side === 'full';
    const joy = document.createElement('div'); joy.className = `tc joy ${side} ${swap ? 'swap' : ''}`; joy.innerHTML = '<div class="jbase"><div class="jknob"></div></div>'; root.appendChild(joy);
    const act = document.createElement('div'); act.className = `tc act3 ${side} ${swap ? 'swap' : ''}`;
    act.innerHTML = `<div class="tb tcam" data-k="cam">${ICON.cam}<span>BALL</span></div><div class="tb tdrift" data-k="h">${ICON.drift}<span>DRIFT</span></div><div class="tb tboost" data-k="b">${ICON.boost}<span>BOOST</span></div><div class="tb tjump" data-k="j">${ICON.jump}<span>JUMP</span></div>`;
    root.appendChild(act);
    const base = joy.querySelector('.jbase'), knob = joy.querySelector('.jknob');
    let jid = null, cx = 0, cy = 0;
    const R = () => base.getBoundingClientRect().width / 2;
    joy.addEventListener('pointerdown', e => { e.preventDefault(); try { joy.setPointerCapture(e.pointerId); } catch (x) {} jid = e.pointerId; const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); });
    const move = e => { if (e.pointerId !== jid) return; let dx = e.clientX - cx, dy = e.clientY - cy; const r = R(), l = Math.hypot(dx, dy); if (l > r) { dx *= r / l; dy *= r / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; st.x = Math.abs(dx / r) < 0.12 ? 0 : dx / r; st.y = Math.abs(dy / r) < 0.12 ? 0 : -dy / r; };
    joy.addEventListener('pointermove', move);
    const end = e => { if (e.pointerId !== jid) return; jid = null; st.x = 0; st.y = 0; knob.style.transform = ''; };
    joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end); joy.addEventListener('lostpointercapture', end);
    const ptr = new Map();
    const upd = () => { st.j = st.b = st.h = st.cam = 0; for (const [, k] of ptr) st[k] = 1; act.querySelectorAll('.tb').forEach(el => el.classList.toggle('on', [...ptr.values()].includes(el.dataset.k))); };
    const which = (x, y) => { const t = document.elementFromPoint(x, y); const tb = t && t.closest('.tb'); return tb && act.contains(tb) ? tb.dataset.k : null; };
    act.addEventListener('pointerdown', e => { e.preventDefault(); try { act.setPointerCapture(e.pointerId); } catch (x) {} const k = which(e.clientX, e.clientY); if (k) { ptr.set(e.pointerId, k); upd(); } });
    act.addEventListener('pointermove', e => { if (!ptr.has(e.pointerId)) return; const k = which(e.clientX, e.clientY); if (k && k !== ptr.get(e.pointerId)) { ptr.set(e.pointerId, k); upd(); } });
    const aend = e => { if (ptr.delete(e.pointerId)) upd(); };
    act.addEventListener('pointerup', aend); act.addEventListener('pointercancel', aend); act.addEventListener('lostpointercapture', aend);
  }
}
function clearTouch() { for (const k of ['t1', 't2']) Object.assign(touch[k], { x: 0, y: 0, j: 0, b: 0, h: 0, cam: 0 }); }
/* ---------- gamepad menu navigation ---------- */
let navPrev = {}, navCb = null, navT = 0;
function navPoll() {
  if (!navCb) return; const nowT = performance.now();
  for (const p of pads()) {
    const s = padState(p), id = p.index, prev = navPrev[id] || {}, ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const dir = s.up || ay < -0.6 ? 'up' : s.down || ay > 0.6 ? 'down' : s.l || ax < -0.6 ? 'left' : s.r || ax > 0.6 ? 'right' : null;
    if (dir && (dir !== prev.dir || nowT - navT > 220)) { navCb(dir); navT = nowT; lastDevice = 'pad'; }
    if (s.a && !prev.a) navCb('ok'); if (s.back && !prev.back) navCb('back'); if (s.pause && !prev.pause) navCb('start');
    navPrev[id] = { dir, a: s.a, back: s.back, pause: s.pause };
  }
}
load();
window.NLI = {
  read, dpad, keys, binds, DEF_BINDS, DEF_SET, ACTIONS, get set() { return set; }, set set(v) { set = v; }, save, load, pads, padName, padState, rumble, buildTouch, clearTouch, isTouch, pausePressed,
  captureKey(cb) { capture = cb; }, cancelCapture() { capture = null; }, navPoll, onNav(cb) { navCb = cb; }, get lastDevice() { return lastDevice; }, touch,
  set game(v) { gameMode = v; },
  keyName(c) { if (!c) return '—'; const M = { Mouse0: 'LMB', Mouse1: 'MMB', Mouse2: 'RMB', Space: 'SPACE', ShiftLeft: 'L-SHIFT', ShiftRight: 'R-SHIFT', Tab: 'TAB', Backslash: '\\', ControlLeft: 'L-CTRL', ControlRight: 'R-CTRL', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Enter: 'ENTER', Numpad0: 'NUM 0', Comma: ',', Period: '.', Slash: '/' }; return M[c] || c.replace(/^Key/, '').replace(/^Digit/, ''); }
};
})();
