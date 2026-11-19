/* FANCY LEAGUE — 3D match runner: simulation, prediction & reconciliation, cameras (car/ball cam), split-screen, effects, HUD
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function () {
'use strict';
const E = window.NL, C = E.C, V = E.v, R = window.NLGL, A = window.NLA, I = window.NLI, D = window.NLD;
const DT = C.DT, hex = R.hex;
const TEAMC = [hex('#2f7dff'), hex('#ff7a1a')], TEAMC2 = [hex('#9cc4ff'), hex('#ffc08a')];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const QCHAT = ['صدّة خطيرة!', 'تسديدة نار!', 'مشكور!', 'محسوبة 😎'];
const QC = [['معلومات', ['أنا لها!', 'أحتاج بوست!', 'سدّد!', 'أنا بالدفاع…']], ['مدح', ['تسديدة حلوة!', 'تمريرة حلوة!', 'مشكور!', 'صدّة خطيرة!']], ['ردود', ['يا ساتر!', 'لااا!', 'وااو!', 'قريبة!']], ['اعتذار', ['أوبس…', 'غلطتي…', 'آسف!', 'معليش!']]];
const STATK = ['goals', 'assists', 'saves', 'shots', 'demos', 'touches'];
const rnd = (a, b) => a + Math.random() * (b - a);
const hsl = (h, s, l) => { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)]; };
const add = V.add, scl = V.scl, nz = V.nrmz;

class Particles {
  constructor() { this.p = []; this.mul = 1; }
  emit(o, n = 1) { n = Math.max(1, Math.round(n * this.mul)); for (let i = 0; i < n && this.p.length < 3000; i++) this.p.push(Object.assign({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 1, max: 1, s: 10, s2: 0, c: [1, 1, 1], a: 1, add: true, g: 0, drag: 0, k: 0 }, typeof o === 'function' ? o(i) : o)); }
  update(dt) { const P = this.p; for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.life -= dt; if (q.life <= 0) { P[i] = P[P.length - 1]; P.pop(); continue; } q.vy -= q.g * dt; const d = Math.max(0, 1 - q.drag * dt); q.vx *= d; q.vy *= d; q.vz *= d; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.floor && q.y < 4) { q.y = 4; q.vy = -q.vy * 0.4; } } }
  draw(fx) { for (const q of this.p) { const t = q.life / q.max, s = q.s2 ? q.s2 + (q.s - q.s2) * t : q.s; const c = q.c2 ? [q.c2[0] + (q.c[0] - q.c2[0]) * t, q.c2[1] + (q.c[1] - q.c2[1]) * t, q.c2[2] + (q.c[2] - q.c2[2]) * t] : q.c; if (q.k === 2) fx.ring(q.x, q.y, q.z, s, c, q.a * t); else if (q.k === 3) fx.disc(q.x, q.y, q.z, s, c, q.a * Math.min(1, t * 2), q.add); else fx.glow(q.x, q.y, q.z, s, c, q.a * Math.min(1, t * 1.6), q.add); } }
}

class Match {
  constructor(o) {
    this.o = o; this.mode = o.mode; this.online = o.mode === 'online';
    this.size = o.size || 1; this.botLvl = o.botLvl == null ? 1 : o.botLvl;
    this.P = new Particles(); this.P.mul = o.particles || 1;
    this.time = 0; this.slow = 0; this.paused = false; this.ended = false; this.acc = 0; this.evq = [];
    this.lastCount = -1; this.ballHide = false; this.ballTrail = []; this.meta = []; this.locals = []; this.bo = [0, 0, 0];
    this.camS = Object.assign({ fov: 110, dist: 270, height: 110, angle: -3, stiff: 0.45, swivel: 5, trans: 1.2, ballcam: true, ballMode: 'toggle', shake: true, invSwivel: false }, o.cam || {});
    this.rec = []; this.recT = 0; this.replay = null; this.replayAt = 0; this.qcCat = null; this.qcT = 0; this.netStats = null;
    if (this.online) this.setupOnline(o.net, o.start); else this.setupLocal(o);
    this.locals.forEach(m => { m.ballcam = this.camS.ballcam; m.cam = null; m.camPrev = 0; });
    this.buildHUD(); I.game = true;
    A.crowdOn(true); A.musicStop();
  }
  setupLocal(o) {
    const G = this.G = E.newGame({ time: o.time || 300, freeplay: this.mode === 'training', seed: (Math.random() * 1e6) | 0 });
    const players = o.players.slice(), per = [0, 1].map(t => players.filter(p => p.team === t).length);
    const size = this.mode === 'training' ? 0 : Math.max(this.size, per[0], per[1]);
    const names = ['FALCON', 'VIPER', 'BLAZE', 'NOVA', 'STORM', 'ECHO', 'REX', 'ZED', 'KAI', 'ORION'];
    const bodies = Object.keys(R.BODIES), paints = ['p_white', 'p_black', 'p_crimson', 'p_sky', 'p_lime', 'p_purple'];
    let bi = Math.floor(Math.random() * 10);
    for (const t of [0, 1]) {
      for (const p of players.filter(q => q.team === t)) this.addMeta(G, { name: p.name, team: t, look: p.look, src: p.src, local: true, sens: p.sens });
      for (let i = per[t]; i < size; i++) { bi++; this.addMeta(G, { name: names[bi % names.length], team: t, look: { body: bodies[bi % bodies.length], paint: paints[(bi * 7) % 6], wheel: 'w_std', boost: 't_std', goal: 'g_classic', topper: 'h_none' }, bot: true }); }
    }
    E.kickoff(G);
  }
  addMeta(G, m) {
    const c = E.addCar(G, { team: m.team, name: m.name, bot: m.bot ? 1 : 0, sens: m.sens || 1 });
    const meta = Object.assign({ slot: c.id, o: [0, 0, 0] }, m); meta.look = Object.assign({}, D.DEFAULT_EQ, m.look || {});
    this.meta[c.id] = meta; if (m.local) this.locals.push(meta); return meta;
  }
  /* ---------- online ---------- */
  setupOnline(net, st) {
    this.net = net; this.seq = 0; this.hist = []; this.lastAck = 0;
    const G = this.G = E.newGame({ authority: false, time: 300 });
    st.cars.sort((a, b) => a.slot - b.slot).forEach(m => this.addMeta(G, { name: m.name, team: m.team, look: m.look, bot: m.bot, src: m.slot === st.you ? 'any' : null, local: m.slot === st.you, sens: this.o.sens || 1 }));
    this.me = st.you; E.unpack(G, st.st); if (st.resume) this.seq = st.resume;
    this.offs = [net.on('s', m => this.onSnap(m)), net.on('end', m => this.finish(m)), net.on('chat', m => this.feed(`<b style="color:${m.team ? '#ffb36b' : '#9cc4ff'}">${esc(m.from)}:</b> ${esc(m.m)}`, m.team)),
      net.on('close', m => { if (!m.manual && !this.ended) { this.netWarn('انقطع الاتصال… نحاول نرجعك'); net.reconnect().then(ok => { if (!ok) this.netWarn('ما قدرنا نرجعك للمباراة'); }); } }),
      net.on('start', m => { if (m.resume != null) { E.unpack(this.G, m.st); this.hist = []; this.netWarn(''); } })];
  }
  onSnap(m) {
    const G = this.G, before = G.cars.map(c => c.p.slice()), bb = G.ball.p.slice(), prevPhase = G.phase;
    if (m.sc) { this.netStats = {}; for (const r of m.sc) { const o = {}; STATK.forEach((k, i) => o[k] = r[i + 1]); this.netStats[r[0]] = o; } }
    E.unpack(G, m.st);
    this.hist = this.hist.filter(h => h[0] > m.a); this.lastAck = m.a;
    const me = G.cars[this.me];
    if (G.phase === 'play' || G.phase === 'goal') for (const h of this.hist) { me.inp = { t: h[1], s: h[2], p: h[3], y: h[4], r: h[5], j: h[6], b: h[7], h: h[8] }; E.step(G); G.ev.length = 0; }
    G.cars.forEach((c, i) => { const mt = this.meta[i], b = before[i]; if (!b || !mt) return; const d = [b[0] - c.p[0], b[1] - c.p[1], b[2] - c.p[2]]; if (V.len(d) > 600 || c.dead > 0) mt.o = [0, 0, 0]; else mt.o = add(mt.o, d); });
    const bd = [bb[0] - G.ball.p[0], bb[1] - G.ball.p[1], bb[2] - G.ball.p[2]]; this.bo = V.len(bd) > 800 ? [0, 0, 0] : add(this.bo, bd);
    if (m.ev) for (const e of m.ev) { if (['hit', 'jump', 'flip', 'bump', 'pad'].includes(e.t) && e.id === this.me) continue; if (e.t === 'jump' || e.t === 'flip') continue; this.evq.push(e); }
    if (prevPhase !== G.phase && G.phase === 'play') this.evq.push({ t: 'go' });
  }
  netWarn(t) { const el = this.hud && this.hud.querySelector('.netwarn'); if (!el) return; el.textContent = t; el.classList.toggle('hidden', !t); }
  /* ---------- loop ---------- */
  frame(dt) {
    if (this.ended && this.endShown) return;
    const G = this.G; dt = Math.min(dt, 0.1); this.time += dt;
    if (I.pausePressed() && !this.pauseLatch) { this.pauseLatch = true; this.o.onPause && this.o.onPause(); } else if (!I.pausePressed()) this.pauseLatch = false;
    this.quickChatInput();
    if (this.mode === 'training') this.trainingKeys();
    // camera: ball cam (toggle / hold like RL), rear view, swivel, scoreboard
    let sb = false;
    for (const m of this.locals) {
      const inp = I.read(m.src);
      if (this.camS.ballMode === 'hold') m.ballcam = this.camS.ballcam ? !inp.cam : !!inp.cam;
      else if (inp.cam && !m.camPrev) m.ballcam = !m.ballcam;
      m.camPrev = inp.cam; m.rear = inp.rear; m.rs = [inp.rx || 0, inp.ry || 0]; if (inp.score) sb = true;
      if (this.replay && ((inp.j && !m.skipPrev) || (inp.b && !m.skipPrevB))) this.replay.skip = true;
      m.skipPrev = inp.j; m.skipPrevB = inp.b;
    }
    this.scoreboard(sb);
    if (this.replay) { this.replayFrame(dt); this.updateHUD(dt); return; }
    if (this.replayAt && this.time >= this.replayAt) { this.replayAt = 0; if (this.startReplay()) { this.updateHUD(dt); return; } }
    if (!this.paused || this.online) {
      const scale = this.slow > 0 ? 0.3 : 1; if (this.slow > 0) this.slow -= dt;
      this.acc += dt * scale; let n = 0;
      while (this.acc >= DT && n < 30) {
        this.acc -= DT; n++;
        if (this.online) {
          const me = G.cars[this.me], q = I.read('any'), r3 = v => Math.round(v * 1000) / 1000; this.dodgeDz(this.meta[this.me], me, q);
          this.seq++; const h = [this.seq, r3(q.t), r3(q.s), r3(q.p), r3(q.y), r3(q.r), q.j ? 1 : 0, q.b ? 1 : 0, q.h ? 1 : 0];
          this.hist.push(h); if (this.hist.length > 300) this.hist.shift();
          me.inp = { t: h[1], s: h[2], p: h[3], y: h[4], r: h[5], j: h[6], b: h[7], h: h[8] };
          E.step(G);
        } else {
          for (const m of this.meta) { const c = G.cars[m.slot]; if (m.local) { const q = I.read(m.src); this.dodgeDz(m, c, q); c.inp = { t: q.t, s: q.s, p: q.p, y: q.y, r: q.r, j: q.j, b: q.b, h: q.h }; } else if (m.bot) E.bot(G, c, this.botLvl); }
          E.step(G);
        }
        for (const e of G.ev) this.evq.push(e); G.ev.length = 0;
      }
      if (this.online) { const q = this.hist.slice(-12).filter(h => h[0] > this.lastAck); if (q.length) this.net.send({ t: 'in', q }); }
    }
    for (const e of this.evq) this.onEvent(e); this.evq.length = 0;
    const k = Math.exp(-dt * 10); for (const m of this.meta) m.o = scl(m.o, k); this.bo = scl(this.bo, k);
    this.effects(dt);
    this.record(dt);
    this.render(dt);
    this.updateHUD(dt);
    if (!this.online && G.phase === 'over' && !this.ended) { this.ended = true; setTimeout(() => this.finish(), 1800); A.SFX.whistle(); }
  }
  trainingKeys() {
    if (I.keys.has('KeyR') && !this.rl) { this.rl = 1; this.resetBall(); } else if (!I.keys.has('KeyR')) this.rl = 0;
    if (I.keys.has('KeyF') && !this.fl) { this.fl = 1; this.shot(); } else if (!I.keys.has('KeyF')) this.fl = 0;
  }
  resetBall() { const G = this.G, me = G.cars[this.locals[0].slot]; G.ball.p = [me.p[0] + me.f[0] * 700, 400, me.p[2] + me.f[2] * 700]; G.ball.v = [0, 0, 0]; this.ballHide = false; }
  shot() { const G = this.G, me = G.cars[this.locals[0].slot], from = [rnd(-2000, 2000), 300, rnd(-2000, 2000)]; G.ball.p = from; const d = [me.p[0] - from[0], 0, me.p[2] - from[2]], l = Math.hypot(d[0], d[2]) || 1; G.ball.v = [d[0] / l * 1400, 900, d[2] / l * 1400]; this.ballHide = false; }
  chat(i) { this.say(QCHAT[i]); }
  say(msg) { const me = this.locals[0]; if (this.online) this.net.send({ t: 'chat', m: msg }); else this.feed(`<b style="color:${me && me.team ? '#ffb36b' : '#9cc4ff'}">${esc(me ? me.name : '')}:</b> ${esc(msg)}`, me ? me.team : 0); A.SFX.quick(); }
  botSay(team, msg, delay = 0.6) { if (this.online) return; const bots = this.meta.filter(m => m.bot && (team == null || m.team === team)); if (!bots.length) return; const b = bots[Math.floor(Math.random() * bots.length)]; setTimeout(() => { if (!this.ended) this.feed(`<b style="color:${b.team ? '#ffb36b' : '#9cc4ff'}">${esc(b.name)}:</b> ${esc(msg)}`, b.team); }, delay * 1000); }
  /* RL quick chat: press 1-4 (or D-pad) for a category, then 1-4 for the message */
  quickChatInput() {
    let k = -1;
    for (let i = 0; i < 4; i++) { const code = 'Digit' + (i + 1), on = I.keys.has(code) || I.keys.has('Numpad' + (i + 1)); if (on && !this['qk' + i]) k = i; this['qk' + i] = on; }
    const dp = this.locals.length === 1 ? I.dpad(this.locals[0].src) : -1; if (dp >= 0 && this.qdPrev !== dp) k = dp; this.qdPrev = dp;
    if (k >= 0) {
      if (this.qcCat == null) { this.qcCat = k; this.qcT = this.time + 3; }
      else { this.say(QC[this.qcCat][1][k]); this.qcCat = null; this.qcLast = this.time; }
      this.drawQC();
    }
    if (this.qcCat != null && this.time > this.qcT) { this.qcCat = null; this.drawQC(); }
  }
  drawQC() {
    const el = this.el && this.el.qc; if (!el) return;
    if (this.qcCat == null) { el.classList.add('hidden'); return; }
    const [title, list] = QC[this.qcCat];
    el.innerHTML = `<div class="qh">${title}</div>${list.map((t, i) => `<div class="qi"><span class="en">${i + 1}</span>${esc(t)}</div>`).join('')}`;
    el.classList.remove('hidden');
  }
  dodgeDz(m, c, q) {
    const j = q.j ? 1 : 0;
    if (m && c && j && !m.pjD && !c.g && c.jumps > 0) { const mag = Math.hypot(q.s, q.p), d = I.set.ddz == null ? 0.5 : I.set.ddz; if (mag < d) { q.s = 0; q.p = 0; } else if (mag < 0.51) { const k = 0.51 / Math.max(mag, 1e-3); q.s *= k; q.p *= k; } }
    if (m) m.pjD = j;
  }
  /* scoreboard (Tab / View button) */
  scoreboard(on) {
    const el = this.el && this.el.sbd; if (!el) return;
    if (!on) { if (!el.classList.contains('hidden')) el.classList.add('hidden'); return; }
    this.sbT = (this.sbT || 0) - 1; if (!el.classList.contains('hidden') && this.sbT > 0) return; this.sbT = 12;
    const st = this.online ? (this.netStats || {}) : this.G.stats;
    const rows = this.meta.map(m => { const s = st[m.slot] || {}; const o = { m, s }; o.pts = (s.goals || 0) * 100 + (s.assists || 0) * 50 + (s.saves || 0) * 60 + (s.shots || 0) * 20 + (s.demos || 0) * 25 + (s.touches || 0) * 2; return o; });
    const tbl = t => `<div class="sbt t${t}"><div class="sbh"><b class="en">${t ? 'ORANGE' : 'BLUE'}</b><span class="en">${this.G.score[t]}</span></div><table><tr class="en"><th></th><th>SCORE</th><th>GOALS</th><th>ASSISTS</th><th>SAVES</th><th>SHOTS</th></tr>${rows.filter(r => r.m.team === t).sort((a, b) => b.pts - a.pts).map(r => `<tr class="${r.m.local ? 'me' : ''}"><td>${esc(r.m.name)}${r.m.bot ? ' <small>BOT</small>' : ''}</td><td>${r.pts}</td><td>${r.s.goals || 0}</td><td>${r.s.assists || 0}</td><td>${r.s.saves || 0}</td><td>${r.s.shots || 0}</td></tr>`).join('')}</table></div>`;
    el.innerHTML = tbl(0) + tbl(1); el.classList.remove('hidden');
  }
  /* ---------- goal replays (offline modes) ---------- */
  record(dt) {
    if (this.online || this.o.replays === false || this.mode === 'training') return;
    const G = this.G; if (G.phase !== 'play') return;
    this.recT += dt; if (this.recT < 1 / 40) return; this.recT = 0;
    this.rec.push({ t: this.time, c: this.meta.map(m => { const c = G.cars[m.slot]; return [c.p.slice(), c.f.slice(), c.u.slice(), c.boosting ? 1 : 0, c.dead > 0 ? 1 : 0, m.wr || 0]; }), b: [G.ball.p.slice(), G.ball.f.slice(), G.ball.u.slice()] });
    while (this.rec.length && this.rec[0].t < this.time - 6) this.rec.shift();
  }
  startReplay() {
    const buf = this.replayBuf; this.replayBuf = null; if (!buf || buf.length < 20) return false;
    this.replay = { buf, t: buf[0].t, end: buf[buf.length - 1].t, eye: null, tgt: null };
    this.P.p.length = 0;
    this.el.rep.classList.remove('hidden'); this.el.center.innerHTML = '';
    return true;
  }
  endReplay() { this.replay = null; this.el.rep.classList.add('hidden'); this.rec = []; }
  replayFrame(dt) {
    const rp = this.replay, buf = rp.buf;
    const slowZone = rp.t > rp.end - 0.9; rp.t += dt * (slowZone ? 0.45 : 1);
    if (rp.skip || rp.t >= rp.end) { this.endReplay(); return; }
    let i = 0; while (i < buf.length - 2 && buf[i + 1].t < rp.t) i++;
    const a = buf[i], b = buf[i + 1], k = Math.max(0, Math.min(1, (rp.t - a.t) / Math.max(1e-4, b.t - a.t)));
    const L = (x, y) => [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k];
    const bp = L(a.b[0], b.b[0]), bv = [(b.b[0][0] - a.b[0][0]), 0, (b.b[0][2] - a.b[0][2])];
    const hv = Math.hypot(bv[0], bv[2]) > 1 ? nz(bv) : (rp.dir || [1, 0, 0]); rp.dir = rp.dir ? nz(add(scl(rp.dir, 0.96), scl(hv, 0.04))) : hv;
    let eye = [bp[0] - rp.dir[0] * 1150 + rp.dir[2] * 420, Math.max(300, bp[1] + 380), bp[2] - rp.dir[2] * 1150 - rp.dir[0] * 420];
    for (let it = 0; it < 3; it++) { const sd = E.sdf(eye[0], eye[1], eye[2]); if (sd > -80) { const n = E.nrm(eye[0], eye[1], eye[2]); eye = add(eye, n, sd + 80); } }
    rp.eye = rp.eye ? add(rp.eye, [eye[0] - rp.eye[0], eye[1] - rp.eye[1], eye[2] - rp.eye[2]], Math.min(1, dt * 3)) : eye;
    rp.tgt = rp.tgt ? add(rp.tgt, [bp[0] - rp.tgt[0], bp[1] - rp.tgt[1], bp[2] - rp.tgt[2]], Math.min(1, dt * 8)) : bp;
    const cars = this.meta.map((m, j) => { const ca = a.c[j], cb = b.c[j]; return { p: L(ca[0], cb[0]), f: nz(L(ca[1], cb[1])), u: nz(L(ca[2], cb[2])), look: m.look, team: m.team, wr: ca[5] + (cb[5] - ca[5]) * k, dead: !!ca[4], boosting: ca[3] }; });
    const self = this;
    R.render({ views: [{ rect: [0, 0, 1, 1], eye: rp.eye, target: rp.tgt, fov: 1.0 }], cars, ball: { p: bp, f: L(a.b[1], b.b[1]), u: L(a.b[2], b.b[2]), hide: false }, pads: this.G.pads,
      fxCb(fx) {
        for (const c of cars) { if (c.dead) continue; fx.shadow(c.p[0], 3, c.p[2], 66, 66, Math.max(0, 0.55 - (c.p[1] - 30) / 1600)); if (c.boosting) { const e = add(c.p, c.f, -62); fx.beam(e[0] - c.f[0] * 120, e[1] - c.f[1] * 120, e[2] - c.f[2] * 120, e[0], e[1], e[2], 20, TEAMC2[c.team], 0.9); fx.glow(e[0], e[1], e[2], 50, [1, 1, 1], 0.8); } }
        fx.shadow(bp[0], 3, bp[2], 95, 95, Math.max(0.08, 0.6 - (bp[1] - C.BALL_R) / 2400)); fx.glow(bp[0], bp[1], bp[2], 230, [1, 1, 1], 0.12);
      } });
  }
  /* ---------- events ---------- */
  onEvent(e) {
    const isLocal = id => this.meta[id] && this.meta[id].local;
    switch (e.t) {
      case 'hit': {
        const [x, y, z] = e.p3, kk = Math.min(1, e.p / 2500), c = this.meta[e.id] ? TEAMC2[this.meta[e.id].team] : [1, 1, 1];
        this.P.emit(() => { const v = nz([rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]), s = rnd(300, 1400) * (0.4 + kk); return { x, y, z, vx: v[0] * s, vy: v[1] * s, vz: v[2] * s, life: rnd(0.2, 0.5), max: 0.5, s: rnd(8, 18), c, g: 900, drag: 3 }; }, 6 + kk * 22);
        this.P.emit({ x, y, z, life: 0.25, max: 0.25, s: 120 + 200 * kk, s2: 40, c: [1, 1, 1], a: 0.4 + 0.5 * kk });
        A.SFX.hit(e.p * 0.6); if (isLocal(e.id)) I.rumble(this.meta[e.id].src, 0.3 + 0.5 * kk, 90);
        if (kk > 0.6) { this.shake(10 * kk); A.ooh(); } break;
      }
      case 'bounce': { if (e.p > 900) A.SFX.bounce(e.p * 0.6); break; }
      case 'jump': if (isLocal(e.id)) A.SFX.jump(); this.dust(e.id, 6); break;
      case 'flip': if (isLocal(e.id)) A.SFX.flip(); break;
      case 'land': if (isLocal(e.id)) A.SFX.land(e.p * 0.5); if (e.p > 600) this.dust(e.id, 6); break;
      case 'bump': A.SFX.bump(e.p); this.shake(6); break;
      case 'pad': if (isLocal(e.id)) { A.SFX.coin(); } break;
      case 'demo': {
        const [x, y, z] = e.p3, tc = TEAMC[e.team];
        this.P.emit(() => { const v = nz([rnd(-1, 1), rnd(-0.2, 1), rnd(-1, 1)]), s = rnd(200, 1800); return { x, y, z, vx: v[0] * s, vy: v[1] * s, vz: v[2] * s, life: rnd(0.5, 1.2), max: 1.2, s: rnd(30, 70), s2: 6, c: [1, rnd(0.4, 0.8), 0.1], c2: [0.3, 0.05, 0.02], g: -100, drag: 2.5 }; }, 70);
        this.P.emit(() => ({ x: x + rnd(-60, 60), y: y + rnd(0, 80), z: z + rnd(-60, 60), vx: rnd(-100, 100), vy: rnd(80, 300), vz: rnd(-100, 100), life: rnd(1, 1.8), max: 1.8, s: rnd(60, 120), c: [0.12, 0.12, 0.14], a: 0.5, add: false, drag: 1 }), 18);
        this.P.emit({ x, y, z, life: 0.5, max: 0.5, s: 500, s2: 80, c: tc, a: 0.9, k: 2 });
        A.SFX.demo(); this.shake(18);
        const kn = this.meta[e.by], vn = this.meta[e.id];
        if (kn && vn) this.feed(`<b style="color:${kn.team ? '#ffb36b' : '#9cc4ff'}">${esc(kn.name)}</b> <span class="mut">دمّر</span> <b style="color:${vn.team ? '#ffb36b' : '#9cc4ff'}">${esc(vn.name)}</b>`, kn.team);
        if (isLocal(e.by)) this.banner('DEMOLITION!'); if (isLocal(e.id)) I.rumble(vn.src, 1, 400);
        break;
      }
      case 'goal': {
        const scorer = this.meta[e.scorer], team = e.team, look = scorer ? scorer.look : D.DEFAULT_EQ;
        this.explode(look.goal, e.p3, team); this.ballHide = true; A.SFX.goal(); this.shake(30); if (!this.online) this.slow = 1;
        const nm = scorer ? scorer.name : 'هدف عكسي', sp = Math.round(e.sp * 0.036);
        this.el.center.innerHTML = `<div class="goalb" style="--gc:${team ? '#ff8c3a' : '#4d94ff'}"><div class="g en">GOAL!</div><div class="who">${esc(nm)}${e.assist >= 0 && this.meta[e.assist] ? ` <span class="mut" style="font-size:.7em">بتمريرة ${esc(this.meta[e.assist].name)}</span>` : ''}</div><div class="spd">${sp} KM/H</div></div>`;
        this.feed(`<b style="color:${team ? '#ffb36b' : '#9cc4ff'}">${esc(nm)}</b> سجّل هدف ⚽`, team);
        for (const m of this.locals) I.rumble(m.src, m.team === team ? 0.8 : 0.4, 500);
        if (!this.online && this.mode !== 'training' && this.o.replays !== false && this.rec.length > 20) { const tg = this.time; this.replayBuf = this.rec.filter(f => f.t > tg - 4.6); this.replayAt = this.time + 1.9; }
        if (Math.random() < 0.55) this.botSay(1 - team, ['وااو!', 'يا ساتر!', 'لااا!', 'قريبة!'][Math.floor(Math.random() * 4)], 0.9);
        if (Math.random() < 0.45) this.botSay(team, ['تسديدة حلوة!', 'محسوبة 😎', 'وااو!'][Math.floor(Math.random() * 3)], 1.4);
        break;
      }
      case 'save': { const m = this.meta[e.id]; if (m) { this.feed(`<b>${esc(m.name)}</b> صدّة!`, m.team); if (m.local) { this.banner('SAVE!'); if (Math.random() < 0.6) this.botSay(m.team, 'صدّة خطيرة!', 0.7); } } A.ooh(); break; }
      case 'kickoff': this.ballHide = false; break;
      case 'go': A.SFX.go(); this.el.center.innerHTML = '<div class="count en" style="color:#ffcf4a">GO!</div>'; break;
      case 'overtime': this.banner('OVERTIME'); A.SFX.whistle(); break;
    }
  }
  dust(id, n) { const c = this.G.cars[id]; if (!c || c.dead > 0) return; this.P.emit(() => ({ x: c.p[0] + rnd(-50, 50), y: c.p[1] - 20, z: c.p[2] + rnd(-50, 50), vx: rnd(-150, 150), vy: rnd(30, 150), vz: rnd(-150, 150), life: 0.6, max: 0.6, s: rnd(25, 45), c: [0.55, 0.6, 0.7], a: 0.22, add: false, drag: 2 }), n); }
  explode(type, [x, y, z], team) {
    const tc = TEAMC[team], tc2 = TEAMC2[team], P = this.P, v3 = () => nz([rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]);
    P.emit({ x, y, z, life: 0.8, max: 0.8, s: 1800, s2: 150, c: tc2, a: 1, k: 2 }); P.emit({ x, y, z, life: 0.45, max: 0.45, s: 1200, s2: 200, c: [1, 1, 1], a: 0.8 });
    if (type === 'g_fireworks') { for (let r = 0; r < 7; r++) { const cx = x - (team ? 1 : -1) * rnd(200, 900), cy = rnd(500, 1500), cz = z + rnd(-900, 900), col = hsl(rnd(0, 360), 1, 0.6); P.emit(() => { const v = v3(), s = rnd(300, 800); return { x: cx, y: cy, z: cz, vx: v[0] * s, vy: v[1] * s, vz: v[2] * s, life: rnd(0.8, 1.7), max: 1.7, s: rnd(12, 22), c: col, g: 250, drag: 1.2 }; }, 60); } }
    else if (type === 'g_shock') { for (let i = 0; i < 4; i++) P.emit({ x, y, z, life: 0.6 + i * 0.25, max: 0.6 + i * 0.25, s: 900 + i * 700, s2: 50, c: i % 2 ? [1, 1, 1] : tc2, a: 0.9, k: 2 }); P.emit(() => { const v = v3(), s = rnd(1200, 3200); return { x, y, z, vx: v[0] * s, vy: v[1] * s, vz: v[2] * s, life: 0.5, max: 0.5, s: rnd(10, 22), c: [1, 1, 1], drag: 2 }; }, 110); }
    else if (type === 'g_gold') { P.emit(() => ({ x: x + rnd(-1200, 1200) * (team ? 0.4 : 0.4) - (team ? 1 : -1) * 600, y: rnd(800, 1800), z: z + rnd(-1200, 1200), vx: rnd(-80, 80), vy: rnd(-80, 80), vz: rnd(-80, 80), life: rnd(1.6, 2.8), max: 2.8, s: rnd(14, 26), c: [1, 0.82, 0.25], g: 650, drag: 0.4, k: 3, floor: 1 }), 200); }
    else if (type === 'g_galaxy') { P.emit(i => { const a = i / 150 * Math.PI * 6, r = 40 + i * 6; return { x: x + Math.cos(a) * r * 0.2, y: y + Math.sin(a) * r * 0.2, z, vx: Math.cos(a + 1.4) * r * 2, vy: Math.sin(a + 1.4) * r * 2, vz: rnd(-200, 200), life: rnd(1.2, 2.2), max: 2.2, s: rnd(10, 24), c: hsl(250 + rnd(-40, 60), 0.9, 0.65), drag: 1.4 }; }, 160); }
    else if (type === 'g_dragon') { P.emit(i => { const a = i / 90 * Math.PI * 4; return { x, y: y + i * 6, z, vx: Math.cos(a) * 700, vy: 500 + i * 4, vz: Math.sin(a) * 700, life: rnd(1, 2), max: 2, s: rnd(30, 70), s2: 6, c: [1, rnd(0.3, 0.7), 0.05], c2: [0.5, 0.05, 0.02], drag: 1 }; }, 120); }
    else { P.emit(() => { const v = v3(), s = rnd(400, 2400); return { x, y, z, vx: v[0] * s, vy: v[1] * s, vz: v[2] * s, life: rnd(0.6, 1.4), max: 1.4, s: rnd(18, 40), s2: 4, c: Math.random() < 0.3 ? [1, 1, 1] : tc2, g: 500, drag: 1.6 }; }, 140); P.emit(() => ({ x: x + rnd(-150, 150), y: y + rnd(-100, 150), z: z + rnd(-150, 150), vx: rnd(-200, 200), vy: rnd(100, 400), vz: rnd(-200, 200), life: rnd(1, 2), max: 2, s: rnd(90, 160), c: tc, a: 0.35, drag: 1 }), 22); }
  }
  shake(n) { if (this.camS.shake) for (const m of this.locals) m.shake = Math.min(40, (m.shake || 0) + n); }
  /* ---------- effects ---------- */
  effects(dt) {
    const G = this.G, P = this.P;
    for (const m of this.meta) {
      const c = G.cars[m.slot]; m.flame = null; if (!c || c.dead > 0) continue;
      const p = add(c.p, m.o), r = V.right(c), ex = add(add(p, c.f, -62), c.u, 2);
      if (c.boosting) {
        const it = D.ITEM[m.look.boost] || D.ITEM.t_std; const c1 = it.c1 === 'team' ? TEAMC2[m.team] : it.c1 === 'rainbow' ? hsl((this.time * 360) % 360, 1, 0.6) : hex(it.c1), c2 = hex(it.c2);
        P.emit(() => ({ x: ex[0] + rnd(-6, 6), y: ex[1] + rnd(-6, 6), z: ex[2] + rnd(-6, 6), vx: -c.f[0] * rnd(500, 900) + c.v[0] * 0.4, vy: -c.f[1] * rnd(500, 900) + c.v[1] * 0.4, vz: -c.f[2] * rnd(500, 900) + c.v[2] * 0.4, life: rnd(0.12, 0.3), max: 0.3, s: rnd(16, 30), s2: 4, c: c2, c2: c1, drag: 4 }), 3);
        if (it.id === 't_shadow') P.emit({ x: ex[0], y: ex[1], z: ex[2], vx: -c.f[0] * 200, vy: 30, vz: -c.f[2] * 200, life: 0.7, max: 0.7, s: rnd(30, 50), c: [0.08, 0.02, 0.15], a: 0.6, add: false, drag: 2 });
        if (it.id === 't_gold' && Math.random() < 0.5) P.emit({ x: ex[0], y: ex[1], z: ex[2], vx: -c.f[0] * 300 + rnd(-100, 100), vy: rnd(80, 300), vz: -c.f[2] * 300 + rnd(-100, 100), life: 1, max: 1, s: 10, c: [1, 0.85, 0.3], g: 650, k: 3 });
        m.flame = { ex, f: c.f, c1, c2 };
      }
      if (c.ss && Math.random() < 0.9) for (const sd of [-1, 1]) { const q = add(ex, r, sd * 30); P.emit({ x: q[0], y: q[1], z: q[2], vx: 0, vy: 0, vz: 0, life: 0.35, max: 0.35, s: 12, s2: 2, c: [1, 1, 1], a: 0.55 }); }
      m.wr = (m.wr || 0) + (c.g ? V.dot(c.v, c.f) / 15 : 0) * dt;
    }
    const b = G.ball, bp = add(b.p, this.bo);
    this.ballTrail.unshift(bp); if (this.ballTrail.length > 12) this.ballTrail.pop();
    this.ballSpeed = V.len(b.v);
    P.update(dt);
  }
  camFor(m, dt, rect) {
    const G = this.G, c = G.cars[m.slot], S = this.camS, b = G.ball;
    const [w, h] = R.size, asp = (rect[2] * w) / (rect[3] * h);
    const fovV = Math.max(0.6, Math.min(1.45, 2 * Math.atan(Math.tan(S.fov * Math.PI / 360) / asp)));
    let p = c.dead > 0 ? (m.lastP || [0, 200, 0]) : add(c.p, m.o); if (c.dead <= 0) m.lastP = p.slice();
    const bp = add(b.p, this.bo), ball = m.ballcam && !this.ballHide;
    let dir;
    if (ball) { dir = [bp[0] - p[0], 0, bp[2] - p[2]]; if (Math.hypot(dir[0], dir[2]) < 50) dir = [c.f[0], 0, c.f[2]]; }
    else { dir = c.g && c.n[1] < 0.7 ? [c.f[0], 0, c.f[2]] : [c.f[0] + c.v[0] * 0.0004, 0, c.f[2] + c.v[2] * 0.0004]; if (Math.hypot(dir[0], dir[2]) < 0.1) dir = m.camDir || [1, 0, 0]; }
    dir = nz(dir);
    const kk = 1 - Math.exp(-dt * (6 + S.stiff * 14) * ((S.trans || 1.2) / 1.2));
    m.camDir = m.camDir ? nz([m.camDir[0] + (dir[0] - m.camDir[0]) * kk, 0, m.camDir[2] + (dir[2] - m.camDir[2]) * kk]) : dir;
    // swivel (right stick) and rear view, like RL
    const rs = m.rs || [0, 0], mag = Math.hypot(rs[0], rs[1]);
    const want = mag > 0.35 ? Math.atan2(rs[0], -rs[1]) * (S.invSwivel ? -1 : 1) : 0;
    let dw = want - (m.swY || 0); if (dw > Math.PI) dw -= 2 * Math.PI; if (dw < -Math.PI) dw += 2 * Math.PI;
    m.swY = (m.swY || 0) + dw * (1 - Math.exp(-dt * (S.swivel || 5) * 2.2));
    const yaw = m.rear ? Math.PI : m.swY, cy = Math.cos(yaw), sy = Math.sin(yaw), d0 = m.camDir;
    const d = [d0[0] * cy - d0[2] * sy, 0, d0[2] * cy + d0[0] * sy];
    const spd = Math.min(1, V.len(c.v) / 2300), dist = S.dist * (1 + (1 - S.stiff) * 0.22 * spd);
    let eye = [p[0] - d[0] * dist, p[1] + S.height, p[2] - d[2] * dist];
    for (let i = 0; i < 3; i++) { const s = E.sdf(eye[0], eye[1], eye[2]); if (s > -60) { const n = E.nrm(eye[0], eye[1], eye[2]); eye = add(eye, n, s + 60); } }
    let target;
    const ang = (S.angle == null ? -3 : S.angle) * Math.PI / 180;
    if (ball && !m.rear && !(m.swY && Math.abs(m.swY) > 0.15)) { target = [bp[0], Math.min(bp[1], p[1] + 900), bp[2]]; target = add(scl(target, 0.82), scl(add(p, [0, 60 + (ang + 0.052) * 600, 0]), 0.18)); }
    else target = [eye[0] + d[0] * Math.cos(ang) * 1000, eye[1] + Math.sin(ang) * 1000 - S.height * 0.25, eye[2] + d[2] * Math.cos(ang) * 1000];
    const snap = m.rear !== m.rearPrev; m.rearPrev = m.rear;
    m.eyeS = m.eyeS && !snap ? add(m.eyeS, [eye[0] - m.eyeS[0], eye[1] - m.eyeS[1], eye[2] - m.eyeS[2]], Math.min(1, dt * 14)) : eye;
    m.tgtS = m.tgtS && !snap ? add(m.tgtS, [target[0] - m.tgtS[0], target[1] - m.tgtS[1], target[2] - m.tgtS[2]], Math.min(1, dt * 12)) : target;
    if (V.len([m.eyeS[0] - eye[0], m.eyeS[1] - eye[1], m.eyeS[2] - eye[2]]) > 1500) { m.eyeS = eye; m.tgtS = target; }
    m.shake = (m.shake || 0) * Math.exp(-dt * 6);
    return { rect, eye: m.eyeS, target: m.tgtS, fov: fovV, shake: m.shake };
  }
  layout() {
    const n = Math.max(1, this.locals.length);
    if (n === 1) return [[0, 0, 1, 1]]; if (n === 2) return [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]];
    return [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]].slice(0, n);
  }
  render(dt) {
    const G = this.G, self = this, rects = this.layout();
    const views = this.locals.length ? this.locals.map((m, i) => this.camFor(m, dt, rects[i])) : [{ rect: [0, 0, 1, 1], eye: [-6000, 2400, 0], target: [0, 0, 0], fov: 1 }];
    this.views = views;
    const cars = this.meta.map(m => { const c = G.cars[m.slot]; return { p: add(c.p, m.o), f: c.f, u: c.u, look: m.look, team: m.team, wr: m.wr, dead: c.dead > 0 }; });
    const b = G.ball, bp = add(b.p, this.bo);
    R.render({
      views, cars, ball: { p: bp, f: b.f, u: b.u, hide: this.ballHide }, pads: G.pads,
      fxCb(fx) {
        for (const c of cars) { if (c.dead) continue; const hgt = c.p[1] - 30; if (hgt < 1200 && Math.abs(c.p[0]) < C.LX && E.sdf(c.p[0], 5, c.p[2]) < 0) fx.shadow(c.p[0], 3, c.p[2], 70 - hgt * 0.02, 70 - hgt * 0.02, Math.max(0, 0.55 - hgt / 1600)); }
        if (!self.ballHide) {
          const bh = bp[1] - C.BALL_R; if (E.sdf(bp[0], 5, bp[2]) < 0) fx.shadow(bp[0], 3, bp[2], 95 - bh * 0.02, 95 - bh * 0.02, Math.max(0.08, 0.6 - bh / 2400));
          const last = G.lastTouch >= 0 && self.meta[G.lastTouch] ? TEAMC2[self.meta[G.lastTouch].team] : [1, 1, 1];
          fx.glow(bp[0], bp[1], bp[2], 230, last, 0.16);
          if (self.ballSpeed > 1800) { const k = Math.min(1, (self.ballSpeed - 1800) / 1500); for (let i = 1; i < self.ballTrail.length; i++) { const p0 = self.ballTrail[i - 1], p1 = self.ballTrail[i]; fx.beam(p1[0], p1[1], p1[2], p0[0], p0[1], p0[2], C.BALL_R * 0.8 * (1 - i / 12), last, 0.3 * (1 - i / 12) * k); } }
        }
        for (const m of self.meta) if (m.flame) { const f = m.flame, e = f.ex; fx.beam(e[0] - f.f[0] * 120, e[1] - f.f[1] * 120, e[2] - f.f[2] * 120, e[0], e[1], e[2], 20, f.c1, 0.9); fx.glow(e[0], e[1], e[2], 50, f.c2, 0.8); }
        self.P.draw(fx);
      }
    });
  }
  /* ---------- HUD ---------- */
  buildHUD() {
    const hud = this.hud = document.getElementById('hud'), rects = this.layout();
    hud.innerHTML = `<div class="vign"></div>
      <div class="sb"><div class="s0">0</div><div class="tm"><span>5:00</span><small>${this.mode === 'training' ? 'TRAINING' : this.online ? 'ONLINE' : this.mode === 'local' ? 'LOCAL' : 'VS BOTS'}</small></div><div class="s1">0</div></div>
      <div class="hudtl"><button class="ibtn" id="pauseBtn" aria-label="pause"><svg viewBox="0 0 24 24"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg></button>${this.online ? '<span class="ping">-- ms</span>' : ''}<span class="ping fps hidden"></span>
        ${this.mode === 'training' ? '<button class="btn sm" id="trR">كورة جديدة (R)</button><button class="btn sm" id="trF">تسديدة عليك (F)</button>' : ''}</div>
      <div class="feed"></div><div class="center"></div><div class="netwarn hidden"></div>
      <div class="qcbox hidden"></div><div class="sbd hidden"></div>
      <div class="reptag hidden"><b class="en">REPLAY</b><small>اضغط نط أو بوست للتخطي</small></div>
      ${this.locals.map((m, i) => { const r = rects[i]; return `<div class="boostm" style="left:calc(${(r[0] + r[2]) * 100}% - ${this.locals.length > 1 ? 110 : 150}px);top:calc(${(r[1] + r[3]) * 100}% - ${this.locals.length > 1 ? 110 : 150}px);width:${this.locals.length > 1 ? 96 : 130}px;height:${this.locals.length > 1 ? 96 : 130}px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="rgba(6,9,22,.7)" stroke="rgba(255,255,255,.1)" stroke-width="9" stroke-dasharray="198 264"/><circle class="arc" cx="50" cy="50" r="42" fill="none" stroke="${m.team ? '#ff8c3a' : '#4d94ff'}" stroke-width="9" stroke-linecap="round" stroke-dasharray="0 264"/></svg><div class="v">0</div><div class="lb">${this.locals.length > 1 ? esc(m.name).slice(0, 8).toUpperCase() : 'BOOST'}</div></div><div class="camtag" style="left:calc(${r[0] * 100}% + 12px);top:calc(${(r[1] + r[3]) * 100}% - 34px)"></div>`; }).join('')}
      ${this.locals.length === 2 ? '<div class="splitline"></div>' : ''}
      ${this.meta.map(m => `<div class="nplate hidden" data-s="${m.slot}" style="--c:${m.team ? '#ff8c3a' : '#4d94ff'}">${esc(m.name)}${m.bot ? ' <span class="mut" style="font-size:10px">BOT</span>' : ''}</div>`).join('')}`;
    this.el = { s0: hud.querySelector('.s0'), s1: hud.querySelector('.s1'), tm: hud.querySelector('.tm span'), tmb: hud.querySelector('.tm'), center: hud.querySelector('.center'), feed: hud.querySelector('.feed'), ping: hud.querySelector('.ping'), fps: hud.querySelector('.fps'), plates: [...hud.querySelectorAll('.nplate')], bm: [...hud.querySelectorAll('.boostm')], cams: [...hud.querySelectorAll('.camtag')], qc: hud.querySelector('.qcbox'), sbd: hud.querySelector('.sbd'), rep: hud.querySelector('.reptag') };
    hud.querySelector('#pauseBtn').onclick = () => this.o.onPause && this.o.onPause();
    const tr = hud.querySelector('#trR'), tf = hud.querySelector('#trF'); if (tr) { tr.onclick = () => this.resetBall(); tf.onclick = () => this.shot(); }
    this.fpsT = 0; this.fpsN = 0;
    this.touch = document.getElementById('touch');
    const useTouch = I.isTouch() && this.locals.some(m => m.src === 'any' || m.src === 't1' || m.src === 't2');
    if (useTouch) { I.buildTouch(this.touch, this.locals.length > 1 && this.locals.some(m => m.src === 't2')); document.body.classList.add('touchon'); document.body.classList.toggle('tsingle', this.locals.length === 1); } else { this.touch.innerHTML = ''; document.body.classList.remove('touchon', 'tsingle'); }
  }
  banner(t) { const d = document.createElement('div'); d.className = 'banner'; d.textContent = t; this.hud.appendChild(d); setTimeout(() => d.remove(), 2500); }
  feed(html, team) { const d = document.createElement('div'); d.style.setProperty('--c', team ? '#ff8c3a' : '#4d94ff'); d.innerHTML = html; this.el.feed.prepend(d); while (this.el.feed.children.length > 5) this.el.feed.lastChild.remove(); setTimeout(() => d.remove(), 4100); }
  updateHUD(dt) {
    const G = this.G, el = this.el;
    if (el.s0.textContent != G.score[0]) el.s0.textContent = G.score[0]; if (el.s1.textContent != G.score[1]) el.s1.textContent = G.score[1];
    const sec = Math.ceil(G.time), tt = this.mode === 'training' ? '--:--' : (G.overtime ? '+' : '') + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    if (el.tm.textContent !== tt) el.tm.textContent = tt; el.tmb.classList.toggle('ot', G.overtime);
    if (G.phase === 'countdown') { const n = Math.ceil(G.phaseT); if (n !== this.lastCount && n > 0 && n <= 3) { this.lastCount = n; A.SFX.count(); el.center.innerHTML = `<div class="count en">${n}</div>`; } } else this.lastCount = -1;
    this.locals.forEach((m, i) => { const c = G.cars[m.slot], b = el.bm[i]; if (b) { const v = Math.round(c.boost); if (b._v !== v) { b._v = v; b.querySelector('.v').textContent = v; b.querySelector('.arc').setAttribute('stroke-dasharray', `${(v / 100) * 198} 264`); } } const ct = el.cams[i]; const lab = m.ballcam ? 'BALL CAM' : 'CAR CAM'; if (ct && ct.textContent !== lab) ct.textContent = lab; });
    const one = this.locals.length <= 1 && this.o.plates !== false;
    for (const p of el.plates) {
      const s = +p.dataset.s, m = this.meta[s], c = G.cars[s];
      if (!one || !c || c.dead > 0 || m.local) { if (!p.classList.contains('hidden')) p.classList.add('hidden'); continue; }
      const q = add(c.p, m.o), pr = R.project(q[0], q[1] + 120, q[2]); if (!pr) { p.classList.add('hidden'); continue; }
      p.classList.remove('hidden'); p.style.left = pr[0] + 'px'; p.style.top = pr[1] + 'px';
    }
    if (this.online && el.ping) { this.pingT = (this.pingT || 0) + dt; if (this.pingT > 0.5) { this.pingT = 0; const r = Math.round(this.net.rtt); el.ping.textContent = r + ' ms'; el.ping.style.color = r < 80 ? '#2fd27a' : r < 160 ? '#ffcf4a' : '#ff4d5e'; } }
    if (this.o.showFps) { this.fpsN++; this.fpsT += dt; if (this.fpsT > 0.5) { el.fps.classList.remove('hidden'); el.fps.textContent = Math.round(this.fpsN / this.fpsT) + ' FPS'; this.fpsN = 0; this.fpsT = 0; } }
    this.locals.forEach(m => { const c = G.cars[m.slot]; A.engineUpdate('car' + m.slot, V.len(c.v) * 0.56, Math.abs(c.inp.t || 0), c.boosting && c.dead <= 0, c.g, c.dead <= 0 && !this.ended); });
  }
  finish(serverEnd) {
    if (this.endShown) return; this.endShown = true; this.ended = true;
    const G = this.G, score = serverEnd ? serverEnd.score : G.score.slice();
    const rows = this.meta.map(m => { const s = serverEnd ? (serverEnd.stats.find(x => x.slot === m.slot) || {}) : G.stats[m.slot]; return { slot: m.slot, name: m.name, team: m.team, bot: m.bot, local: m.local, goals: s.goals || 0, assists: s.assists || 0, saves: s.saves || 0, shots: s.shots || 0, demos: s.demos || 0, touches: s.touches || 0 }; });
    rows.forEach(r => r.score = r.goals * 100 + r.assists * 50 + r.saves * 60 + r.shots * 20 + r.demos * 25 + r.touches * 2);
    const myTeam = this.locals[0] ? this.locals[0].team : 0, winTeam = score[0] === score[1] ? -1 : score[0] > score[1] ? 0 : 1;
    const mvp = rows.filter(r => r.team === winTeam).sort((a, b) => b.score - a.score)[0];
    this.dispose();
    this.o.onEnd && this.o.onEnd({ mode: this.mode, size: this.size, botLvl: this.botLvl, score, rows, myTeam, winTeam, mvp: mvp ? mvp.slot : -1, ranked: this.online ? !!this.o.ranked : this.mode === 'bots', locals: this.locals.map(m => m.slot) });
  }
  dispose() { A.stopEngines(); A.crowdOn(false); I.game = false; if (this.online && this.offs) this.offs.forEach(f => f && f()); this.hud.innerHTML = ''; this.touch.innerHTML = ''; document.body.classList.remove('touchon', 'tsingle'); I.clearTouch(); }
  quit() { this.ended = true; this.endShown = true; this.dispose(); if (this.online) this.net.send({ t: 'leave' }); }
}
window.NLM = { Match, Particles, TEAMC, TEAMC2, QCHAT };
})();
