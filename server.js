/* FANCY LEAGUE — authoritative game server (rooms, matchmaking, 120Hz simulation, lag-tolerant netcode)
   © 2026 Mohsen ~ Danial. All rights reserved.
   Run: npm install && npm start   (PORT env supported) */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const { WebSocketServer } = require('ws');
const NL = require('./public/js/engine.js');
const C = NL.C;
const PORT = +process.env.PORT || 8080;
const LAG = +process.env.SIM_LAG || 0, JIT = +process.env.SIM_JITTER || 0; // testing only: simulate a bad connection
const later = f => LAG || JIT ? setTimeout(f, LAG + Math.random() * JIT) : f();
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

/* ---------------- static files ---------------- */
const cache = new Map();
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || '/').split('?')[0]);
  if (u === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: true, rooms: rooms.size, players: wss.clients.size, up: process.uptime() | 0 })); }
  if (u === '/') u = '/index.html';
  const fp = path.normalize(path.join(PUB, u));
  if (!fp.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.stat(fp, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(fp), type = MIME[ext] || 'application/octet-stream';
    const gz = /gzip/.test(req.headers['accept-encoding'] || '') && /text|javascript|json|svg|manifest/.test(type);
    const key = fp + (gz ? '.gz' : '') + st.mtimeMs;
    const send = buf => { res.writeHead(200, { 'content-type': type, 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600', ...(gz ? { 'content-encoding': 'gzip' } : {}), 'x-developers': 'Mohsen ~ Danial' }); res.end(buf); };
    if (cache.has(key)) return send(cache.get(key));
    fs.readFile(fp, (e, buf) => { if (e) { res.writeHead(500); return res.end(); } if (gz) buf = zlib.gzipSync(buf); if (buf.length < 4e6) cache.set(key, buf); send(buf); });
  });
});

/* ---------------- rooms ---------------- */
const wss = new WebSocketServer({ server, perMessageDeflate: false, maxPayload: 64 * 1024 });
const rooms = new Map();
const sessions = new Map(); // token -> {room, slot}
const rid = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s; do { s = ''; for (let i = 0; i < 5; i++) s += A[Math.random() * A.length | 0]; } while (rooms.has(s)); return s; };
const tok = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const clampName = n => String(n || 'Player').replace(/[<>&"]/g, '').slice(0, 16) || 'Player';
function send(ws, o) { if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(o)); } catch (e) {} } }

function newRoom(size, priv, ranked) {
  const r = { code: rid(), size: Math.max(1, Math.min(3, size | 0)), priv: !!priv, ranked: !!ranked, state: 'lobby', players: [], host: null, G: null, created: Date.now(), acc: 0, last: 0, snapEvery: 3, ev: [], botLvl: 1, time: 300 };
  rooms.set(r.code, r); return r;
}
function roomInfo(r) {
  return { t: 'room', code: r.code, size: r.size, priv: r.priv, ranked: r.ranked, state: r.state, host: r.host, players: r.players.map(p => ({ id: p.pid, name: p.name, team: p.team, look: p.look, bot: !!p.bot, on: p.bot ? 1 : p.ws ? 1 : 0, rank: p.mmr || 0 })) };
}
function broadcast(r, o) { const s = JSON.stringify(o); for (const p of r.players) if (p.ws && p.ws.readyState === 1) { try { p.ws.send(s); } catch (e) {} } }
function teamCount(r, t) { return r.players.filter(p => p.team === t).length; }
function joinRoom(r, ws, info) {
  if (r.state !== 'lobby') return send(ws, { t: 'err', m: 'المباراة بدأت' });
  const humans = r.players.filter(p => !p.bot);
  if (humans.length >= r.size * 2) return send(ws, { t: 'err', m: 'الغرفة ممتلئة' });
  // remove a bot if needed
  if (r.players.length >= r.size * 2) { const bi = r.players.findIndex(p => p.bot); if (bi >= 0) r.players.splice(bi, 1); }
  const team = teamCount(r, 0) <= teamCount(r, 1) ? 0 : 1;
  const p = { pid: tok().slice(0, 8), ws, name: clampName(info.name), look: info.look || {}, team, token: tok(), inputs: [], lastSeq: 0, ackSeq: 0, slot: -1, mmr: +info.mmr || 0, sens: Math.max(0.5, Math.min(2, +info.sens || 1)), lastIn: Date.now() };
  r.players.push(p); ws.room = r; ws.player = p; if (!r.host) r.host = p.pid;
  sessions.set(p.token, { code: r.code, pid: p.pid });
  send(ws, { t: 'joined', code: r.code, you: p.pid, token: p.token });
  broadcast(r, roomInfo(r));
  if (!r.priv && r.players.filter(q => !q.bot).length >= r.size * 2) startMatch(r);
}
function leaveRoom(ws, hard) {
  const r = ws.room, p = ws.player; if (!r || !p) return;
  ws.room = null; ws.player = null;
  if (r.state === 'playing') {
    p.ws = null; p.bot = hard ? 1 : 2; p.goneAt = Date.now(); // AI takes over (until reconnect if dropped)
    if (hard) sessions.delete(p.token);
  } else r.players = r.players.filter(q => q !== p);
  if (r.host === p.pid) { const h = r.players.find(q => !q.bot && q.ws); r.host = h ? h.pid : null; }
  if (!r.players.some(q => !q.bot && q.ws) && !r.players.some(q => q.bot === 2)) { rooms.delete(r.code); return; }
  broadcast(r, roomInfo(r));
}
function fillBots(r) {
  const names = ['Falcon', 'Viper', 'Blaze', 'Nova', 'Storm', 'Echo', 'Rex', 'Zed'];
  let i = 0;
  for (const t of [0, 1]) while (teamCount(r, t) < r.size) r.players.push({ pid: 'bot' + i, name: names[(i++ + r.code.charCodeAt(0)) % names.length] + ' (BOT)', team: t, bot: 1, look: { body: ['b_falcon', 'b_titan', 'b_breaker', 'b_comet'][i % 4], paint: ['p_white', 'p_black', 'p_crimson', 'p_sky'][i % 4], wheel: 'w_std', boost: 't_std', goal: 'g_classic' }, inputs: [], lastSeq: 0 });
}
function startMatch(r) {
  if (r.state !== 'lobby') return;
  fillBots(r);
  r.G = NL.newGame({ time: r.time, seed: (Math.random() * 1e6) | 0 });
  r.players.sort((a, b) => a.team - b.team);
  r.players.forEach(p => { const c = NL.addCar(r.G, { team: p.team, name: p.name, bot: p.bot ? 1 : 0, sens: p.sens || 1 }); p.slot = c.id; p.inputs = []; p.lastSeq = 0; p.ackSeq = 0; });
  NL.kickoff(r.G);
  r.state = 'playing'; r.acc = 0; r.last = process.hrtime.bigint(); r.ev = []; r.tickN = 0;
  const meta = r.players.map(p => ({ slot: p.slot, id: p.pid, name: p.name, team: p.team, look: p.look, bot: !!p.bot }));
  for (const p of r.players) if (p.ws) send(p.ws, { t: 'start', you: p.slot, cars: meta, size: r.size, ranked: r.ranked, code: r.code, st: NL.pack(r.G) });
  broadcast(r, roomInfo(r));
}
function endMatch(r) {
  r.state = 'ended';
  const G = r.G;
  broadcast(r, { t: 'end', score: G.score, stats: r.players.map(p => ({ slot: p.slot, name: p.name, team: p.team, bot: !!p.bot, ...G.stats[p.slot] })) });
  setTimeout(() => {
    if (!rooms.has(r.code)) return;
    r.players = r.players.filter(p => !p.bot && p.ws);
    if (!r.players.length) { rooms.delete(r.code); return; }
    r.state = 'lobby'; r.G = null; r.host = r.players[0].pid; broadcast(r, roomInfo(r));
  }, 4000);
}
/* ---------------- simulation loop ---------------- */
const DT = C.DT;
function stepRoom(r) {
  const G = r.G;
  for (const p of r.players) {
    const c = G.cars[p.slot]; if (!c) continue;
    if (p.bot) { NL.bot(G, c, p.bot === 2 ? 1 : r.botLvl); continue; }
    // consume one input per tick; keep queue short to bound latency
    if (p.inputs.length > 30) p.inputs.splice(0, p.inputs.length - 12);
    const inp = p.inputs.shift();
    if (inp) { c.inp = { t: inp[1], s: inp[2], p: inp[3], y: inp[4], r: inp[5], j: inp[6], b: inp[7], h: inp[8] }; p.ackSeq = inp[0]; }
  }
  NL.step(G);
  for (const e of G.ev) if (e.t !== 'bounce' && e.t !== 'land') r.ev.push(e);
  G.ev.length = 0;
}
setInterval(() => {
  const t = process.hrtime.bigint();
  for (const r of rooms.values()) {
    if (r.state !== 'playing') continue;
    r.acc += Number(t - r.last) / 1e9; r.last = t;
    if (r.acc > 0.25) r.acc = 0.25;
    let steps = 0;
    while (r.acc >= DT) { r.acc -= DT; stepRoom(r); steps++; r.tickN++; if (r.tickN % r.snapEvery === 0) snapshot(r); if (r.G.phase === 'over') break; }
    if (r.G.phase === 'over' && r.state === 'playing') { snapshot(r); endMatch(r); }
  }
}, 4);
function snapshot(r) {
  const st = NL.pack(r.G), ev = r.ev.length ? r.ev : undefined; r.ev = [];
  const sc = r.tickN % 120 === 0 ? r.players.map(p => [p.slot, ...['goals', 'assists', 'saves', 'shots', 'demos', 'touches'].map(k => (r.G.stats[p.slot] || {})[k] || 0)]) : undefined;
  for (const p of r.players) if (p.ws && p.ws.readyState === 1) {
    if (p.ws.bufferedAmount > 64 * 1024) continue; // congested client: skip a frame
    if (p.rate > 1 && (r.tickN / r.snapEvery) % p.rate) continue;
    const msg = JSON.stringify({ t: 's', st, a: p.ackSeq, ev, sc }), w = p.ws; later(() => { try { w.send(msg); } catch (e) {} });
  }
}
/* reap */
setInterval(() => {
  const n = Date.now();
  for (const r of rooms.values()) {
    for (const p of r.players) if (p.bot === 2 && n - p.goneAt > 90000 && r.state !== 'playing') r.players = r.players.filter(q => q !== p);
    if (!r.players.some(p => !p.bot && p.ws) && (r.state !== 'playing' || n - r.created > 3600e3)) rooms.delete(r.code);
    else if (!r.players.some(p => !p.bot && p.ws) && r.players.every(p => p.bot !== 2 || n - p.goneAt > 60000)) rooms.delete(r.code);
  }
  // quick-match: fill with bots after waiting
  for (const r of rooms.values()) if (!r.priv && r.state === 'lobby' && r.players.some(p => !p.bot) && n - r.created > 12000) startMatch(r);
}, 1000);

/* ---------------- connections ---------------- */
wss.on('connection', (ws, req) => {
  ws.alive = true; ws.on('pong', () => ws.alive = true);
  ws.on('message', raw => later(() => onMsg(ws, raw)));
  ws.on('close', () => leaveRoom(ws, false));
  ws.on('error', () => {});
});
function onMsg(ws, raw) {
  {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    const p = ws.player, r = ws.room;
    switch (m.t) {
      case 'in': { // inputs: [[seq,s,j,b],...] (redundant)
        if (!p || !r || r.state !== 'playing' || !Array.isArray(m.q)) return;
        const cl = v => Math.max(-1, Math.min(1, +v || 0));
        for (const q of m.q) { if (!Array.isArray(q) || q[0] <= p.lastSeq) continue; p.lastSeq = q[0]; p.inputs.push([q[0], cl(q[1]), cl(q[2]), cl(q[3]), cl(q[4]), cl(q[5]), q[6] ? 1 : 0, q[7] ? 1 : 0, q[8] ? 1 : 0]); }
        p.lastIn = Date.now(); return;
      }
      case 'ping': return send(ws, { t: 'pong', c: m.c, n: wss.clients.size });
      case 'create': { if (r) leaveRoom(ws, true); const nr = newRoom(m.size, true, false); nr.botLvl = Math.max(0, Math.min(2, m.bots | 0)); nr.time = [180, 300, 420].includes(+m.time) ? +m.time : 300; return joinRoom(nr, ws, m); }
      case 'join': {
        if (r) leaveRoom(ws, true);
        const t = rooms.get(String(m.code || '').toUpperCase().trim());
        if (!t) return send(ws, { t: 'err', m: 'ما لقينا الغرفة — تأكد من الكود' });
        return joinRoom(t, ws, m);
      }
      case 'quick': {
        if (r) leaveRoom(ws, true);
        const size = Math.max(1, Math.min(3, m.size | 0));
        let t = [...rooms.values()].find(x => !x.priv && x.state === 'lobby' && x.size === size && x.players.filter(q => !q.bot).length < size * 2);
        if (!t) { t = newRoom(size, false, true); t.botLvl = 1; }
        return joinRoom(t, ws, m);
      }
      case 'rejoin': {
        const s = sessions.get(m.token); if (!s) return send(ws, { t: 'err', m: 'انتهت الجلسة' });
        const t = rooms.get(s.code); if (!t) return send(ws, { t: 'err', m: 'الغرفة انتهت' });
        const q = t.players.find(x => x.pid === s.pid); if (!q) return send(ws, { t: 'err', m: 'انتهت الجلسة' });
        q.ws = ws; q.bot = 0; q.inputs = []; ws.room = t; ws.player = q;
        send(ws, { t: 'joined', code: t.code, you: q.pid, token: q.token });
        if (t.state === 'playing') send(ws, { t: 'start', you: q.slot, cars: t.players.map(p => ({ slot: p.slot, id: p.pid, name: p.name, team: p.team, look: p.look, bot: !!p.bot })), size: t.size, ranked: t.ranked, code: t.code, st: NL.pack(t.G), resume: q.lastSeq });
        return broadcast(t, roomInfo(t));
      }
      case 'team': { if (!p || !r || r.state !== 'lobby') return; const nt = m.team ? 1 : 0; if (teamCount(r, nt) >= r.size) return; p.team = nt; return broadcast(r, roomInfo(r)); }
      case 'look': { if (!p) return; p.look = m.look || p.look; if (r) broadcast(r, roomInfo(r)); return; }
      case 'start': { if (!p || !r || r.host !== p.pid) return; return startMatch(r); }
      case 'settings': { if (!p || !r || r.host !== p.pid || r.state !== 'lobby') return; if (m.size) r.size = Math.max(1, Math.min(3, m.size | 0)); if (m.bots != null) r.botLvl = Math.max(0, Math.min(2, m.bots | 0)); if (m.time) r.time = [180, 300, 420].includes(+m.time) ? +m.time : 300; r.players.forEach((q, i) => { if (teamCount(r, q.team) > r.size) q.team = 1 - q.team; }); return broadcast(r, roomInfo(r)); }
      case 'leave': return leaveRoom(ws, true);
      case 'chat': { if (!p || !r) return; const msg = String(m.m || '').slice(0, 60); return broadcast(r, { t: 'chat', from: p.name, team: p.team, m: msg, q: m.q | 0 }); }
      case 'rate': { if (p) p.rate = m.r === 2 ? 2 : 1; return; }
    }
  }
}
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { try { ws.terminate(); } catch (e) {} continue; } ws.alive = false; try { ws.ping(); } catch (e) {} } }, 15000);
server.listen(PORT, () => console.log(`FANCY LEAGUE server on :${PORT}  — by Mohsen ~ Danial`));
