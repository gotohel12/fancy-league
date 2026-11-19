/* FANCY LEAGUE — 3D physics engine (Rocket-League style), shared by client & server
   Units: uu (like RL). x = goal axis, y = up, z = width.
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NL = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
const C = {
  LX: 5120, LZ: 4096, H: 2044, RC: 1150, RE: 256, GW: 893, GH: 642, GD: 880,
  DT: 1 / 120, G: 650,
  BALL_R: 92.75, BALL_MAX: 6000, BALL_E: 0.6, BALL_DRAG: 0.03, M_BALL: 30, M_CAR: 180,
  HX: 59, HY: 18, HZ: 42, WX: 37, WY: 32, WZ: 34,
  MAX_SPEED: 2300, SUPERSONIC: 2200, BOOST_ACC: 991.67, BRAKE: 3500, COAST: 525,
  JUMP: 291.67, JUMP_HOLD: 1458.33, JUMP_HOLD_T: 0.2, DODGE: 500, DODGE_T: 0.62, FLIP_W: 6.2,
  STICKY: 325, BOOST_USE: 33.3, BOOST_START: 33,
  KICKOFF: 3, GOAL_PAUSE: 3.5, DEMO_TIME: 3
};
const { LX, LZ, H, RC, RE, GW, GH, GD } = C;
const PHASES = ['countdown', 'play', 'goal', 'over'];

/* ---------------- vector helpers (arrays) ---------------- */
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = a => Math.hypot(a[0], a[1], a[2]);
const nrmz = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function rotV(v, axis, ang) { // Rodrigues, axis unit
  const c = Math.cos(ang), s = Math.sin(ang), k = axis, kv = cross(k, v), kd = dot(k, v) * (1 - c);
  return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd];
}
function ortho(c) { c.f = nrmz(c.f); let u = add(c.u, c.f, -dot(c.u, c.f)); c.u = nrmz(u); }
const right = c => cross(c.f, c.u);

/* ---------------- arena SDF (negative inside) ---------------- */
function sdBox(px, py, pz, hx, hy, hz) {
  const qx = Math.abs(px) - hx, qy = Math.abs(py) - hy, qz = Math.abs(pz) - hz;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}
function sdf(x, y, z) {
  const rx = LX - RE, rz = LZ - RE, rc = RC - RE;
  const qx = Math.abs(x) - rx + rc, qz = Math.abs(z) - rz + rc;
  const d2 = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - rc;
  const dy = Math.abs(y - H / 2) - (H / 2 - RE);
  const a = Math.hypot(Math.max(d2, 0), Math.max(dy, 0)) + Math.min(Math.max(d2, dy), 0) - RE;
  const g0 = LX - 260, gc = (g0 + LX + GD) / 2, gh = (LX + GD - g0) / 2;
  const g = sdBox(Math.abs(x) - gc, y - GH / 2, z, gh, GH / 2, GW);
  return a < g ? a : g;
}
function nrm(x, y, z) {
  const e = 2, dx = sdf(x + e, y, z) - sdf(x - e, y, z), dy = sdf(x, y + e, z) - sdf(x, y - e, z), dz = sdf(x, y, z + e) - sdf(x, y, z - e);
  const l = Math.hypot(dx, dy, dz) || 1; return [-dx / l, -dy / l, -dz / l];
}

/* ---------------- boost pads (RL layout) ---------------- */
const PADS = [];
for (const [x, z] of [[-4096, -3072], [-4096, 3072], [4096, -3072], [4096, 3072], [0, -3584], [0, 3584]]) PADS.push({ x, z, big: 1 });
for (const [rx, ry] of [[0, -4240], [-1792, -4184], [1792, -4184], [-940, -3308], [940, -3308], [0, -2816], [-3584, -2484], [3584, -2484], [-1788, -2300], [1788, -2300], [-2048, -1036], [0, -1024], [2048, -1036], [-1024, 0], [1024, 0], [-2048, 1036], [0, 1024], [2048, 1036], [-1788, 2300], [1788, 2300], [-3584, 2484], [3584, 2484], [0, 2816], [-940, 3310], [940, 3308], [-1792, 4184], [1792, 4184], [0, 4240]]) PADS.push({ x: ry, z: rx, big: 0 });

/* ---------------- game ---------------- */
function newGame(opt = {}) {
  return {
    tick: 0, cars: [], ball: { p: [0, C.BALL_R, 0], v: [0, 0, 0], f: [1, 0, 0], u: [0, 1, 0], w: [0, 0, 0] },
    score: [0, 0], time: opt.time || 300, total: opt.time || 300, phase: 'countdown', phaseT: C.KICKOFF, overtime: false, playT: 0,
    ev: [], authority: opt.authority !== false, lastTouch: -1, freeplay: !!opt.freeplay, touches: {}, stats: {},
    pads: PADS.map(() => 0), kseed: opt.seed || 7
  };
}
function newCar(id, team, info = {}) {
  return {
    id, team, name: info.name || 'Player', bot: info.bot || 0, sens: info.sens || 1,
    p: [0, 30, 0], v: [0, 0, 0], f: [1, 0, 0], u: [0, 1, 0], w: [0, 0, 0], g: true, n: [0, 1, 0],
    jumps: 2, jumpT: 0, holdT: 0, flipT: 0, flipW: [0, 0, 0], boost: C.BOOST_START, dead: 0, airT: 0, pj: 0, roofT: 0, bc: 0, bn: [0, 1, 0],
    ss: 0, boosting: 0, touchT: 0, wr: 0, inp: { t: 0, s: 0, p: 0, y: 0, r: 0, j: 0, b: 0, h: 0 }, botT: id * 977 + 13
  };
}
function addCar(G, info) {
  const c = newCar(G.cars.length, info.team, info); G.cars.push(c);
  G.stats[c.id] = { goals: 0, saves: 0, shots: 0, assists: 0, demos: 0, touches: 0 };
  return c;
}
const SPOTS = [[-2560, -2048], [-2560, 2048], [-3840, -256], [-3840, 256], [-4608, 0]];
function kickoff(G) {
  const b = G.ball; b.p = [0, C.BALL_R, 0]; b.v = [0, 0, 0]; b.w = [0, 0, 0];
  G.kseed = (G.kseed * 16807) % 2147483647;
  const pick = G.kseed % 2;
  for (const t of [0, 1]) {
    const team = G.cars.filter(c => c.team === t);
    const order = team.length === 1 ? [pick] : team.length === 2 ? [0, 1] : team.length === 3 ? [0, 1, 4] : [0, 1, 2, 3, 4];
    team.forEach((c, i) => {
      const s = SPOTS[order[i % order.length]] || SPOTS[4];
      const sg = t === 0 ? 1 : -1;
      c.p = [s[0] * sg, 17 + C.WY - 15, s[1] * sg]; c.p[1] = C.WY - 2;
      const to = nrmz([-c.p[0], 0, -c.p[2]]);
      c.f = to; c.u = [0, 1, 0]; c.v = [0, 0, 0]; c.w = [0, 0, 0]; c.g = true; c.n = [0, 1, 0];
      c.jumps = 2; c.jumpT = 0; c.holdT = 0; c.flipT = 0; c.boost = C.BOOST_START; c.dead = 0; c.airT = 0; c.roofT = 0; c.pj = 0;
      c.inp = { t: 0, s: 0, p: 0, y: 0, r: 0, j: 0, b: 0, h: 0 };
    });
  }
  G.pads = PADS.map(() => 0);
  G.lastTouch = -1; G.touches = {};
  if (G.freeplay) { G.phase = 'play'; G.phaseT = 0; } else { G.phase = 'countdown'; G.phaseT = C.KICKOFF; }
  G.ev.push({ t: 'kickoff' });
}
function respawn(G, c) {
  const sg = c.team === 0 ? -1 : 1;
  c.p = [sg * (LX - 600), C.WY - 2, (c.id % 2 ? 1 : -1) * 1500]; c.v = [0, 0, 0]; c.w = [0, 0, 0];
  c.f = [-sg, 0, 0]; c.u = [0, 1, 0]; c.dead = 0; c.boost = 33; c.jumps = 2; c.airT = 0; c.g = true; c.flipT = 0;
  G.ev.push({ t: 'spawn', id: c.id });
}
const throttleAcc = sp => sp < 1400 ? 1600 - 1440 * sp / 1400 : sp < 1410 ? 160 * (1410 - sp) / 10 : 0;
const CURV = [[0, 0.0069], [500, 0.00398], [1000, 0.00235], [1500, 0.001375], [1750, 0.0011], [2300, 0.00088]];
function curvature(sp) { sp = clamp(sp, 0, 2300); for (let i = 1; i < CURV.length; i++) if (sp <= CURV[i][0]) { const a = CURV[i - 1], b = CURV[i], t = (sp - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return 0.00088; }
function wheelPts(c) { const r = right(c), out = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(add(add(add(c.p, c.f, sx * C.WX), c.u, -C.WY), r, sz * C.WZ)); return out; }

/* ---------------- car step ---------------- */
function stepCar(G, c, dt) {
  if (c.dead > 0) { c.dead -= dt; if (c.dead <= 0) respawn(G, c); return; }
  const I = c.inp, frozen = G.phase === 'countdown';
  const jp = I.j && !c.pj; c.pj = I.j ? 1 : 0;
  c.touchT = Math.max(0, c.touchT - dt);
  let cn = 0, n = [0, 0, 0];
  const reach = c.g && c.jumpT <= 0 ? -18 : -5;
  for (const w of wheelPts(c)) if (sdf(w[0], w[1], w[2]) > reach) { n = add(n, nrm(w[0], w[1], w[2])); cn++; }
  if (cn) n = nrmz(n);
  const upDot = cn ? dot(c.u, n) : 0;
  c.jumpT = Math.max(0, c.jumpT - dt);
  const wasG = c.g;
  c.g = cn >= 2 && upDot > 0.55 && c.jumpT <= 0;
  if (c.g) {
    if (!wasG && c.airT > 0.2) G.ev.push({ t: 'land', id: c.id, p: Math.abs(dot(c.v, n)) });
    c.n = n;
    // align up vector to surface normal
    const ax = cross(c.u, n), sa = len(ax);
    if (sa > 1e-5) { const ang = Math.atan2(sa, dot(c.u, n)) * Math.min(1, 16 * dt); const k = scl(ax, 1 / sa); c.u = rotV(c.u, k, ang); c.f = rotV(c.f, k, ang); }
    c.f = nrmz(add(c.f, n, -dot(c.f, n))); c.u = n.slice(); ortho(c);
    let r = right(c);
    let vf = dot(c.v, c.f), vr = dot(c.v, r), vn = dot(c.v, n);
    const t = frozen ? 0 : clamp(+I.t || 0, -1, 1), s = frozen ? 0 : clamp(+I.s || 0, -1, 1);
    if (Math.abs(t) > 0.02) {
      if (vf * t < -1) { const nv = vf + Math.sign(t) * C.BRAKE * dt; vf = Math.sign(nv) !== Math.sign(vf) ? 0 : nv; }
      else vf += Math.sign(t) * throttleAcc(Math.abs(vf)) * Math.abs(t) * dt;
    } else { const d = C.COAST * dt; vf = Math.abs(vf) <= d ? 0 : vf - Math.sign(vf) * d; }
    c.boosting = I.b && c.boost > 0 && !frozen ? 1 : 0;
    if (c.boosting) vf += C.BOOST_ACC * dt;
    vr *= Math.exp(-(I.h ? 1.6 : 15) * dt);
    const yr = curvature(Math.abs(vf)) * vf * s * (I.h ? 1.4 : 1);
    if (yr) { c.f = rotV(c.f, n, -yr * dt); ortho(c); r = right(c); }
    const gv = [0, -C.G, 0], gn = dot(gv, n);
    vf += dot(gv, c.f) * dt; vr += dot(gv, r) * dt;
    vn += (gn - C.STICKY) * dt;
    vf = clamp(vf, -C.MAX_SPEED, C.MAX_SPEED);
    c.v = add(add(scl(c.f, vf), r, vr), n, vn);
    c.w = scl(n, -yr);
    c.jumps = 2; c.airT = 0; c.flipT = 0; c.roofT = 0;
    c.wr += vf / 15 * dt;
    if (jp && !frozen) { c.v = add(c.v, c.u, C.JUMP); c.holdT = C.JUMP_HOLD_T; c.jumpT = 0.1; c.jumps = 1; c.g = false; c.w = [0, 0, 0]; G.ev.push({ t: 'jump', id: c.id }); }
  } else {
    c.airT += dt; if (c.jumps === 2) c.jumps = 1;
    if (c.holdT > 0) { if (I.j) { c.v = add(c.v, c.u, C.JUMP_HOLD * dt); c.holdT -= dt; } else c.holdT = 0; }
    c.v[1] -= C.G * dt;
    const r = right(c);
    if (c.flipT > 0) { c.flipT -= dt; c.w = c.flipW.slice(); if (c.flipT <= 0) c.w = scl(c.w, 0.3); }
    else {
      let wr = dot(c.w, c.f), wp = dot(c.w, r), wy = dot(c.w, c.u);
      const sens = c.sens || 1, P = clamp(+I.p || 0, -1, 1) * sens, Y = clamp(+I.y || 0, -1, 1) * sens, R = clamp(+I.r || 0, -1, 1) * sens;
      wr += (R * 36.08 - 4.47 * wr) * dt;
      wp += (-P * 12.14 - 2.8 * wp * (1 - Math.min(1, Math.abs(P)))) * dt;
      wy += (-Y * 8.92 - 1.89 * wy * (1 - Math.min(1, Math.abs(Y)))) * dt;
      c.w = add(add(scl(c.f, wr), r, wp), c.u, wy);
      const wl = len(c.w); if (wl > 5.5) c.w = scl(c.w, 5.5 / wl);
    }
    if (jp && !frozen && c.bc && dot(c.u, c.bn) < 0.3) { // turtle -> self right
      const ax = nrmz(cross(c.u, c.bn)); c.w = scl(ax, 7); c.flipW = c.w.slice(); c.flipT = 0.35; c.v = add(c.v, c.bn, 300);
    } else if (jp && !frozen && c.jumps > 0 && c.airT < 1.45) {
      c.jumps = 0;
      const sx = clamp(+I.s || 0, -1, 1), sy = clamp(+I.p || 0, -1, 1), mag = Math.hypot(sx, sy);
      if (mag > 0.5) {
        const ff = nrmz([c.f[0], 0, c.f[2]]), rr = nrmz([r[0], 0, r[2]]), dx = sy / mag, dz = sx / mag;
        const fs = dot(c.v, ff), boostF = 1 + 0.9 * clamp(fs / 2300, 0, 1) * Math.max(0, dx);
        c.v = add(add(c.v, ff, dx * C.DODGE * boostF), rr, dz * C.DODGE);
        c.v[1] = Math.max(c.v[1] * 0.25, -50);
        c.flipW = scl(add(scl(r, -dx), c.f, dz), C.FLIP_W); c.w = c.flipW.slice(); c.flipT = C.DODGE_T; c.holdT = 0;
        G.ev.push({ t: 'flip', id: c.id });
      } else { c.v = add(c.v, c.u, C.JUMP); G.ev.push({ t: 'jump', id: c.id }); }
    }
    c.boosting = I.b && c.boost > 0 && !frozen ? 1 : 0;
    if (c.boosting) c.v = add(c.v, c.f, C.BOOST_ACC * dt);
    const wl = len(c.w);
    if (wl > 1e-6) { const k = scl(c.w, 1 / wl); c.f = rotV(c.f, k, wl * dt); c.u = rotV(c.u, k, wl * dt); ortho(c); }
    if (c.bc && dot(c.u, c.bn) > -0.25 && dot(c.u, c.bn) < 0.6 && c.flipT <= 0) { const ax = cross(c.u, c.bn), sa = len(ax); if (sa > 1e-4) { const k = scl(ax, 1 / sa), a = 7 * dt; c.u = rotV(c.u, k, a); c.f = rotV(c.f, k, a); ortho(c); } }
    if (c.bc && dot(c.u, c.bn) < 0.3) { c.roofT += dt; if (c.roofT > 0.9) { c.roofT = 0; const ax = nrmz(cross(c.u, c.bn)); c.w = scl(ax, 7); c.flipW = c.w.slice(); c.flipT = 0.35; c.v = add(c.v, c.bn, 300); } } else c.roofT = 0;
    c.wr += dot(c.v, c.f) / 15 * dt * 0.5;
  }
  if (c.boosting) c.boost = Math.max(0, c.boost - C.BOOST_USE * dt);
  const sp = len(c.v);
  if (sp > C.MAX_SPEED) c.v = scl(c.v, C.MAX_SPEED / sp);
  if (sp > C.SUPERSONIC) c.ss = 1; else if (sp < 2100) c.ss = 0;
  c.p = add(c.p, c.v, dt);
  carArena(c);
}
const BODY = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) BODY.push([sx * C.HX, sy * C.HY, sz * C.HZ]);
BODY.push([0, C.HY + 4, 0]);
function carArena(c) {
  c.bc = 0; const r = right(c);
  const pts = BODY.map(b => [b, 1]).concat([[C.WX, -C.WY, C.WZ], [C.WX, -C.WY, -C.WZ], [-C.WX, -C.WY, C.WZ], [-C.WX, -C.WY, -C.WZ]].map(b => [b, 0]));
  for (const [l, body] of pts) {
    const rp = add(add(scl(c.f, l[0]), c.u, l[1]), r, l[2]), wp = add(c.p, rp), d = sdf(wp[0], wp[1], wp[2]);
    if (d > 0) {
      const n = nrm(wp[0], wp[1], wp[2]); c.p = add(c.p, n, d);
      const pv = add(c.v, cross(c.w, rp)), vn = dot(pv, n);
      if (vn < 0) {
        c.v = add(c.v, n, -vn * (body ? 1.15 : 1.0));
        if (!c.g && body) { const J = scl(n, -vn); c.w = add(c.w, cross(rp, J), 0.00009); }
      }
      if (body && l[1] > 0) { c.bc = 1; c.bn = n; }
    }
  }
}

/* ---------------- ball ---------------- */
function stepBall(G, dt) {
  const b = G.ball;
  b.v[1] -= C.G * dt;
  b.v = scl(b.v, 1 - C.BALL_DRAG * dt);
  b.p = add(b.p, b.v, dt);
  const d = sdf(b.p[0], b.p[1], b.p[2]);
  if (d > -C.BALL_R) {
    const n = nrm(b.p[0], b.p[1], b.p[2]); b.p = add(b.p, n, d + C.BALL_R);
    const vn = dot(b.v, n);
    if (vn < 0) {
      const e = -vn > 80 ? C.BALL_E : 0;
      b.v = add(b.v, n, -vn * (1 + e));
      const vt = add(b.v, n, -dot(b.v, n));
      b.v = add(b.v, vt, e ? -0.2 : -0.6 * dt);
      if (-vn > 500) G.ev.push({ t: 'bounce', p3: b.p.slice(), n, p: -vn });
    }
    const vt = add(b.v, n, -dot(b.v, n)); b.w = scl(cross(n, vt), 1 / C.BALL_R);
  }
  const wl = len(b.w); if (wl > 1e-6) { const k = scl(b.w, 1 / wl); b.f = rotV(b.f, k, wl * dt); b.u = rotV(b.u, k, wl * dt); b.f = nrmz(b.f); b.u = nrmz(add(b.u, b.f, -dot(b.u, b.f))); }
  const sp = len(b.v); if (sp > C.BALL_MAX) b.v = scl(b.v, C.BALL_MAX / sp);
}
function carBall(G, c) {
  if (c.dead > 0) return;
  const b = G.ball, d = [b.p[0] - c.p[0], b.p[1] - c.p[1], b.p[2] - c.p[2]];
  if (Math.abs(d[0]) > 260 || Math.abs(d[1]) > 260 || Math.abs(d[2]) > 260) return;
  const r = right(c), lx = dot(d, c.f), ly = dot(d, c.u), lz = dot(d, r);
  const qx = clamp(lx, -C.HX, C.HX), qy = clamp(ly, -C.HY, C.HY), qz = clamp(lz, -C.HZ, C.HZ);
  let ex = lx - qx, ey = ly - qy, ez = lz - qz, dist = Math.hypot(ex, ey, ez);
  let nl; if (dist < 1e-6) { nl = [0, 1, 0]; dist = 0; } else nl = [ex / dist, ey / dist, ez / dist];
  if (dist >= C.BALL_R) return;
  const n = add(add(scl(c.f, nl[0]), c.u, nl[1]), r, nl[2]);
  const pen = C.BALL_R - dist, tm = C.M_BALL + C.M_CAR;
  b.p = add(b.p, n, pen * C.M_CAR / tm); c.p = add(c.p, n, -pen * C.M_BALL / tm);
  const rp = add(add(scl(c.f, qx), c.u, qy), r, qz), cpv = add(c.v, cross(c.w, rp));
  const vrel = [b.v[0] - cpv[0], b.v[1] - cpv[1], b.v[2] - cpv[2]], vn = dot(vrel, n);
  if (vn >= 0) return;
  const j = -(1 + 0.3) * vn / (1 / C.M_BALL + 1 / C.M_CAR);
  b.v = add(b.v, n, j / C.M_BALL); c.v = add(c.v, n, -j / C.M_CAR);
  if (c.touchT <= 0) {
    let n2 = [d[0], d[1] * 0.35, d[2]]; n2 = nrmz(n2); n2 = nrmz(add(n2, c.f, -0.35 * dot(n2, c.f)));
    const rs = Math.min(len(vrel), 4600), k = rs <= 500 ? 0.65 : rs <= 2300 ? 0.65 - 0.1 * (rs - 500) / 1800 : 0.55 - 0.25 * (rs - 2300) / 2300;
    b.v = add(b.v, n2, rs * k);
    c.touchT = 0.1;
    if (G.authority) {
      const st = G.stats[c.id]; st.touches++;
      if (G.touches[c.team] !== c.id) G.touches['a' + c.team] = G.touches[c.team]; G.touches[c.team] = c.id;
      const att = c.team === 0 ? 1 : -1;
      if (b.v[0] * att > 900 && Math.abs(att * LX - b.p[0]) < 3500 && Math.abs(b.p[2]) < GW * 2) st.shots++;
      const last = G.cars[G.lastTouch];
      if (last && last.team !== c.team && Math.abs(-att * LX - b.p[0]) < 1600 && -att * (b.v[0] - n2[0] * rs * k) > 900) { st.saves++; G.ev.push({ t: 'save', id: c.id }); }
    }
    G.lastTouch = c.id;
    G.ev.push({ t: 'hit', id: c.id, p3: add(b.p, n, -C.BALL_R), p: -vn });
  }
  const sp = len(b.v); if (sp > C.BALL_MAX) b.v = scl(b.v, C.BALL_MAX / sp);
}
function carCar(G, a, b) {
  if (a.dead > 0 || b.dead > 0) return;
  const d = [b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]], dist = len(d), R2 = 110;
  if (dist >= R2 || dist < 1e-6) return;
  const n = scl(d, 1 / dist), pen = R2 - dist;
  a.p = add(a.p, n, -pen / 2); b.p = add(b.p, n, pen / 2);
  const rv = dot(b.v, n) - dot(a.v, n);
  if (rv >= 0) return;
  if (G.authority && a.team !== b.team && G.playT > 1.2) {
    if (a.ss && dot(a.v, n) > 1400 && dot(a.f, n) > 0.5) return demo(G, a, b);
    if (b.ss && -dot(b.v, n) > 1400 && -dot(b.f, n) > 0.5) return demo(G, b, a);
  }
  const j = -1.5 * rv / 2;
  a.v = add(a.v, n, -j); b.v = add(b.v, n, j);
  const up = [0, 1, 0]; if (-rv > 600) { a.v = add(a.v, up, -rv * 0.08); b.v = add(b.v, up, -rv * 0.08); G.ev.push({ t: 'bump', p3: scl(add(a.p, b.p), 0.5), p: -rv }); }
}
function demo(G, k, v) {
  v.dead = C.DEMO_TIME; if (G.stats[k.id]) G.stats[k.id].demos++;
  G.ev.push({ t: 'demo', p3: v.p.slice(), id: v.id, by: k.id, team: v.team });
  v.p = [0, -5000, 0]; v.v = [0, 0, 0];
}
function pads(G, dt) {
  for (let i = 0; i < PADS.length; i++) {
    if (G.pads[i] > 0) { G.pads[i] = Math.max(0, G.pads[i] - dt); continue; }
    const pd = PADS[i], rr = pd.big ? 208 : 144;
    for (const c of G.cars) {
      if (c.dead > 0 || c.boost >= 100 || c.p[1] > (pd.big ? 220 : 190)) continue;
      const dx = c.p[0] - pd.x, dz = c.p[2] - pd.z;
      if (dx * dx + dz * dz < rr * rr) { c.boost = Math.min(100, c.boost + (pd.big ? 100 : 12)); G.pads[i] = pd.big ? 10 : 4; G.ev.push({ t: 'pad', id: c.id, big: pd.big, i }); break; }
    }
  }
}

/* ---------------- main step ---------------- */
function step(G) {
  const dt = C.DT; G.tick++;
  if (G.phase === 'over') return;
  if (G.phase === 'countdown') {
    for (const c of G.cars) c.pj = c.inp.j ? 1 : 0;
    if (G.authority) { G.phaseT -= dt; if (G.phaseT <= 0) { G.phase = 'play'; G.phaseT = 0; G.ev.push({ t: 'go' }); } }
    return;
  }
  if (G.phase === 'play' && G.authority && !G.overtime && !G.freeplay) {
    G.time -= dt;
    if (G.time <= 0) G.endT = (G.endT || 0) + dt;
    if (G.time <= 0 && (G.ball.p[1] < C.BALL_R + 30 || G.endT > 4)) {
      G.endT = 0;
      G.time = 0;
      if (G.score[0] === G.score[1]) { G.overtime = true; G.ev.push({ t: 'overtime' }); kickoff(G); return; }
      G.phase = 'over'; G.ev.push({ t: 'over' }); return;
    }
    if (G.time < 0) G.time = 0;
  }
  if (G.phase === 'goal' && G.authority) {
    G.phaseT -= dt;
    if (G.phaseT <= 0) { if (!G.freeplay && (G.overtime || G.time <= 0)) { G.phase = 'over'; G.ev.push({ t: 'over' }); return; } kickoff(G); return; }
  }
  G.playT = G.phase === 'play' ? G.playT + dt : 0;
  for (const c of G.cars) stepCar(G, c, dt);
  stepBall(G, dt);
  for (const c of G.cars) carBall(G, c);
  for (let i = 0; i < G.cars.length; i++) for (let j = i + 1; j < G.cars.length; j++) carCar(G, G.cars[i], G.cars[j]);
  pads(G, dt);
  if (G.authority && G.phase === 'play') {
    const x = G.ball.p[0]; let team = -1;
    if (x > LX + C.BALL_R) team = 0; else if (x < -LX - C.BALL_R) team = 1;
    if (team >= 0) {
      G.score[team]++;
      const sc = G.touches[team] != null ? G.touches[team] : -1; if (sc >= 0 && G.stats[sc]) G.stats[sc].goals++;
      let as = G.touches['a' + team]; if (as == null || as === sc || !G.cars[as] || G.cars[as].team !== team) as = -1; else G.stats[as].assists++;
      G.ev.push({ t: 'goal', team, scorer: sc, assist: as, p3: G.ball.p.slice(), sp: Math.round(len(G.ball.v)) });
      G.phase = 'goal'; G.phaseT = G.freeplay ? 2 : C.GOAL_PAUSE;
    }
  }
}

/* ---------------- bots ---------------- */
const BOT = [{ every: 24, boost: 0.25, aim: 400, jump: 0.4, flip: 0.4 }, { every: 12, boost: 0.65, aim: 180, jump: 0.7, flip: 0.7 }, { every: 5, boost: 0.95, aim: 50, jump: 0.9, flip: 0.9 }];
function rnd(c) { c.botT = (c.botT * 1103515245 + 12345) % 2147483648; return c.botT / 2147483648; }
function bot(G, c, lvl) {
  const P = BOT[clamp(lvl | 0, 0, 2)], b = G.ball, I = { t: 0, s: 0, p: 0, y: 0, r: 0, j: 0, b: 0, h: 0 };
  if (c.dead > 0) { c.inp = I; return; }
  const att = c.team === 0 ? 1 : -1, ownX = -att * LX;
  if (!c.bk || G.tick - c.bk.t >= P.every || G.tick < c.bk.t) {
    const tt = 0.25, bp = [b.p[0] + b.v[0] * tt, Math.max(C.BALL_R, b.p[1] + b.v[1] * tt), b.p[2] + b.v[2] * tt];
    const goal = [att * (LX + 200), 0, 0], toG = nrmz([goal[0] - bp[0], 0, goal[2] - bp[2]]);
    const ahead = (c.p[0] - bp[0]) * att > 150;
    const mates = G.cars.filter(o => o.team === c.team && o !== c && o.dead <= 0);
    const md = o => Math.hypot(o.p[0] - bp[0], o.p[2] - bp[2]) + ((o.p[0] - bp[0]) * att > 0 ? 1500 : 0);
    const support = mates.some(o => md(o) < md(c) - 200);
    let tgt;
    if (support) tgt = [bp[0] - att * 2400, 0, bp[2] * 0.4];
    else if (ahead) tgt = Math.abs(bp[0] - ownX) < 3000 ? [ownX + att * 400, 0, clamp(bp[2], -600, 600) * 0.5] : [bp[0] - att * 1200, 0, bp[2] * 0.6];
    else { const off = 120 + Math.min(600, Math.hypot(c.p[0] - bp[0], c.p[2] - bp[2]) * 0.25); tgt = [bp[0] - toG[0] * off, 0, bp[2] - toG[2] * off]; }
    if (G.phase !== 'play' || G.playT < 0.8) tgt = [b.p[0], 0, b.p[2]];
    else { tgt[0] += (rnd(c) - 0.5) * P.aim; tgt[2] += (rnd(c) - 0.5) * P.aim; }
    tgt[0] = clamp(tgt[0], -LX + 200, LX - 200); tgt[2] = clamp(tgt[2], -LZ + 200, LZ - 200);
    c.bk = { t: G.tick, tgt, boost: rnd(c) < P.boost, jump: rnd(c) < P.jump, flip: rnd(c) < P.flip };
  }
  const K = c.bk, r = right(c);
  if (c.g) {
    if (c.n[1] < 0.7) { // on wall/ceiling: drive down
      const down = nrmz(add([0, -1, 0], c.n, -dot([0, -1, 0], c.n)));
      const a = Math.atan2(dot(down, r), dot(down, c.f)); I.s = clamp(a * 2.5, -1, 1); I.t = 1;
    } else {
      const to = [K.tgt[0] - c.p[0], 0, K.tgt[2] - c.p[2]], dist = Math.hypot(to[0], to[2]);
      const a = Math.atan2(dot(to, r), dot(to, c.f));
      I.s = clamp(a * 3, -1, 1); I.t = 1;
      if (Math.abs(a) > 1.9 && dist < 700) { I.t = -1; I.s = -I.s; }
      if (Math.abs(a) > 1.2 && len(c.v) > 700) I.h = 1;
      if (Math.abs(a) < 0.25 && dist > 900 && c.boost > 5 && K.boost) I.b = 1;
      if (G.phase === 'play' && G.playT < 2.5 && Math.abs(a) < 0.3) I.b = 1;
      const bd = [b.p[0] - c.p[0], b.p[1] - c.p[1], b.p[2] - c.p[2]], bh = Math.hypot(bd[0], bd[2]);
      const fwd = dot([bd[0], 0, bd[2]], c.f) / (bh || 1);
      if (bh < 220 + len(c.v) * 0.12 && fwd > 0.6 && ((bd[1] > 110 && bd[1] < 420 && K.jump) || (bd[1] < 110 && len(c.v) > 600 && K.flip))) I.j = 1;
    }
  } else {
    const bd = [b.p[0] - c.p[0], b.p[1] - c.p[1], b.p[2] - c.p[2]], dd = len(bd);
    if (c.jumps > 0 && c.airT > 0.12 && dd < 260 && K.flip) { I.j = 1; const fw = dot(bd, c.f), rt = dot(bd, r); const m = Math.hypot(fw, rt) || 1; I.p = fw / m; I.s = rt / m; }
    else {
      // recover: keep wheels down & level
      const upw = [0, 1, 0];
      const pitchErr = dot(c.f, upw), rollErr = dot(r, upw);
      const wp = dot(c.w, r), wr = dot(c.w, c.f);
      I.p = clamp(pitchErr * 3 - wp * 0.4, -1, 1); I.r = clamp(rollErr * 3 + wr * 0.25, -1, 1);
      if (c.u[1] < -0.2) I.r = 1;
    }
  }
  I.y = I.s;
  if (I.j && c.inp.j) I.j = 0;
  c.inp = I;
}

/* ---------------- serialization ---------------- */
const r1 = v => Math.round(v * 100) / 100, r3 = v => Math.round(v * 100000) / 100000;
function pack(G) {
  const b = G.ball;
  return [G.tick, PHASES.indexOf(G.phase), r3(G.phaseT), r3(G.time), G.score[0], G.score[1], G.overtime ? 1 : 0, G.lastTouch,
    [b.p.map(r1), b.v.map(r1)], G.cars.map(c => [c.p.map(r1), c.v.map(r1), c.f.map(r3), c.u.map(r3), c.w.map(r3), c.g ? 1 : 0, c.n.map(r3), c.jumps, r3(c.jumpT), r3(c.holdT), r3(c.flipT), c.flipW.map(r3), r1(c.boost), r3(c.dead), r3(c.airT), c.pj, r3(c.roofT), c.bc, c.bn.map(r3), r3(c.touchT), c.ss, [r3(c.inp.t), r3(c.inp.s), r3(c.inp.p), r3(c.inp.y), r3(c.inp.r), c.inp.j, c.inp.b, c.inp.h]]),
    G.pads.map(r1), r3(G.playT)];
}
function unpack(G, s) {
  G.tick = s[0]; G.phase = PHASES[s[1]]; G.phaseT = s[2]; G.time = s[3]; G.score[0] = s[4]; G.score[1] = s[5]; G.overtime = !!s[6]; G.lastTouch = s[7];
  const b = G.ball; b.p = s[8][0].slice(); b.v = s[8][1].slice();
  s[9].forEach((a, i) => {
    const c = G.cars[i]; if (!c) return;
    c.p = a[0].slice(); c.v = a[1].slice(); c.f = a[2].slice(); c.u = a[3].slice(); c.w = a[4].slice(); c.g = !!a[5]; c.n = a[6].slice(); c.jumps = a[7]; c.jumpT = a[8]; c.holdT = a[9]; c.flipT = a[10]; c.flipW = a[11].slice();
    c.boost = a[12]; c.dead = a[13]; c.airT = a[14]; c.pj = a[15]; c.roofT = a[16]; c.bc = a[17]; c.bn = a[18].slice(); c.touchT = a[19]; c.ss = a[20];
    const q = a[21]; c.inp = { t: q[0], s: q[1], p: q[2], y: q[3], r: q[4], j: q[5], b: q[6], h: q[7] };
    c.boosting = c.inp.b && c.boost > 0 ? 1 : 0;
  });
  if (s[10]) G.pads = s[10].slice(); G.playT = s[11] || 0;
}
return { C, PADS, sdf, nrm, newGame, addCar, kickoff, step, bot, pack, unpack, BOT, v: { dot, cross, len, nrmz, add, scl, rotV, right }, clamp };
});
