/* FANCY LEAGUE — app shell: intro, login, menus, garage, shop, profile, settings, online lobby
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function () {
'use strict';
const D = window.NLD, A = window.NLA, I = window.NLI, R = window.NLGL, E = window.NL, M = window.NLM, N = window.NLN;
const VERSION = '3.0.0', DEVS = 'Mohsen ~ Danial';
const $ = s => document.querySelector(s), ui = $('#ui');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toLocaleString('en-US');

/* ---------------- settings ---------------- */
// camera defaults = Rocket League defaults (FOV 110, distance 270, height 110, angle -3, stiffness 0.45, swivel 5, transition 1.2)
const CAMDEF = { camFov: 110, camDist: 270, camHeight: 110, camAngle: -3, camStiff: 0.45, camSwivel: 5, camTrans: 1.2, ballcam: true, ballMode: 'toggle', shake: true, invSwivel: false };
const CAMPRO = { camFov: 110, camDist: 270, camHeight: 100, camAngle: -4, camStiff: 0.45, camSwivel: 5, camTrans: 1.2, ballcam: true, ballMode: 'toggle', shake: false, invSwivel: false };
const SDEF = Object.assign({ quality: 'auto', fps: 60, showFps: false, camera: 'auto', particles: 1, master: 0.85, sfx: 0.9, music: 0.45, crowd: 0.55, server: '', lowBw: false, replays: true, plates: true }, CAMDEF);
let S = Object.assign({}, SDEF, D.LS.get('settings', {}));
if (!S._v3) { Object.assign(S, CAMDEF); S._v3 = 1; }
function saveS() { D.LS.set('settings', S); A.setVol({ master: S.master, sfx: S.sfx, music: S.music, crowd: S.crowd }); }
function camOpts() { return { fov: S.camFov, dist: S.camDist, height: S.camHeight, angle: S.camAngle, stiff: S.camStiff, swivel: S.camSwivel, trans: S.camTrans, ballcam: S.ballcam, ballMode: S.ballMode, shake: S.shake, invSwivel: S.invSwivel }; }
function quality() { if (S.quality !== 'auto') return S.quality; const small = Math.min(screen.width, screen.height) < 500; return I.isTouch() && small ? 'medium' : 'high'; }

/* ---------------- icons ---------------- */
const IC = {
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  car: '<svg viewBox="0 0 24 24"><path d="M3 14l2-5c.4-1 1.2-1.5 2.2-1.5h7.6c1 0 1.8.5 2.2 1.5l2 5v4h-2a2 2 0 01-4 0H9a2 2 0 01-4 0H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6.5 12h11" stroke="currentColor" stroke-width="2"/></svg>',
  shop: '<svg viewBox="0 0 24 24"><path d="M4 8h16l-1.5 11a2 2 0 01-2 1.7h-9a2 2 0 01-2-1.7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 8V6.5a3.5 3.5 0 017 0V8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 01-2 1.2L14.8 21h-4l-.3-2.4a7.6 7.6 0 01-2-1.2l-1.9.7-2-3.4 1.6-1.2a7.7 7.7 0 010-2.3L4.6 10l2-3.4 1.9.7a7.6 7.6 0 012-1.2L10.8 3.6h4l.3 2.5a7.6 7.6 0 012 1.2l1.9-.7 2 3.4-1.6 1.2a7.7 7.7 0 010 2.3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  coin: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#f5b81c"/><circle cx="12" cy="12" r="6.6" fill="#ffd968" stroke="#c98a08" stroke-width="1.2"/><path d="M13.6 7.5l-4 5h3l-1.6 4 4-5.2h-3z" fill="#9a6400"/></svg>',
  globe: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="3"/><path d="M5 24h38M24 5c6 6 6 32 0 38M24 5c-6 6-6 32 0 38" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
  bot: '<svg viewBox="0 0 48 48"><rect x="9" y="15" width="30" height="24" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="18" cy="27" r="3" fill="currentColor"/><circle cx="30" cy="27" r="3" fill="currentColor"/><path d="M24 15V8M20 34h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  pads: '<svg viewBox="0 0 48 48"><path d="M10 16h28c4 0 6 3 7 7l2 9c1 4-3 7-6 4l-5-5H12l-5 5c-3 3-7 0-6-4l2-9c1-4 3-7 7-7z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M14 22v6M11 25h6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="33" cy="23" r="2" fill="currentColor"/><circle cx="37" cy="27" r="2" fill="currentColor"/></svg>',
  ball: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 14l8 6-3 9h-10l-3-9z" fill="currentColor"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  crown: '<svg viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
};
const avColor = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return `linear-gradient(135deg,hsl(${h},70%,50%),hsl(${(h + 40) % 360},70%,40%))`; };

/* ---------------- ui helpers ---------------- */
let acts = {}, screen = '', backFn = null;
function show(name, html, a = {}, back = null) {
  screen = name; acts = a; backFn = back; ui.innerHTML = html; focusIdx = -1;
  ui.classList.toggle('dim', !['home', 'garage', 'login'].includes(name));
  ui.querySelectorAll('.scroll').forEach(s => s.scrollTop = 0);
}
ui.addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
  const f = acts[b.dataset.a] || GLOBAL[b.dataset.a];
  if (f) { if (!b.dataset.silent) A.SFX.click(); f(b.dataset.v, b, e); }
});
let hoverT = 0;
ui.addEventListener('pointerover', e => { const b = e.target.closest('.btn,.mbtn,.tile,.item,.acct'); if (b && performance.now() - hoverT > 60) { hoverT = performance.now(); A.SFX.hover(); } });
const GLOBAL = { back: () => { A.SFX.back(); backFn && backFn(); } };
function toast(m, ms = 2600) { const t = $('#toast'); t.innerHTML = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), ms); }
function modal({ title, text = '', html = '', buttons = [{ label: 'تمام', cls: 'pri' }], dismiss = true, onOpen }) {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="box panel"><h3>${title}</h3>${text ? `<p>${text}</p>` : ''}${html}<div class="row" style="justify-content:flex-end"></div></div>`;
  const row = m.querySelector('.row:last-child');
  const close = () => { m.remove(); if (modalStack[modalStack.length - 1] === m) modalStack.pop(); };
  buttons.forEach(b => { const el = document.createElement('button'); el.className = 'btn ' + (b.cls || ''); el.innerHTML = b.label; el.onclick = () => { A.SFX.click(); if (b.keep) { b.fn && b.fn(m); return; } close(); b.fn && b.fn(m); }; row.appendChild(el); });
  if (dismiss) m.addEventListener('click', e => { if (e.target === m) close(); });
  m._close = close; document.body.appendChild(m); modalStack.push(m); if (onOpen) onOpen(m); return m;
}
const modalStack = [];
const top = (title, en, extra = '') => `<div class="topbar"><button class="ibtn back" data-a="back" aria-label="رجوع">${IC.back}</button><div class="title"><div><div class="h1">${title}</div>${en ? `<div class="en mut" style="font-size:11px;letter-spacing:.3em">${en}</div>` : ''}</div></div>${extra}<span class="chip coin">${IC.coin}<b class="coins">${P ? fmt(P.coins) : 0}</b></span></div>`;

/* ---------------- gamepad / keyboard menu navigation ---------------- */
let focusIdx = -1;
function focusables() {
  const root = modalStack.length ? modalStack[modalStack.length - 1] : ui;
  return [...root.querySelectorAll('[data-a]:not([disabled]), .seg button, .modal .btn, input, select, .tog, .kbd')].filter(el => el.offsetParent !== null && !el.closest('.hidden'));
}
function navigate(dir) {
  if (scene === 'match' && match && !match.paused && !modalStack.length) return;
  if (dir === 'back') { if (modalStack.length) { modalStack[modalStack.length - 1]._close(); return; } GLOBAL.back(); return; }
  const els = focusables(); if (!els.length) return;
  let cur = document.querySelector('.focus'); if (cur && !els.includes(cur)) cur = null;
  if (dir === 'ok') { if (cur) { if (cur.tagName === 'INPUT') cur.focus(); else cur.click(); } return; }
  if (dir === 'start') return;
  if (!cur) { setFocus(els[0]); return; }
  const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  let best = null, bd = 1e9;
  for (const el of els) {
    if (el === cur) continue; const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, dx = x - cx, dy = y - cy;
    const ok = dir === 'up' ? dy < -4 : dir === 'down' ? dy > 4 : dir === 'left' ? dx < -4 : dx > 4; if (!ok) continue;
    const d = (dir === 'up' || dir === 'down') ? Math.abs(dy) + Math.abs(dx) * 2.2 : Math.abs(dx) + Math.abs(dy) * 2.2;
    if (d < bd) { bd = d; best = el; }
  }
  if (best) setFocus(best);
}
function setFocus(el) { document.querySelectorAll('.focus').forEach(e => e.classList.remove('focus')); el.classList.add('focus'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); A.SFX.hover(); }
I.onNav(navigate);
window.addEventListener('keydown', e => {
  if (capturing) return;
  if (e.key === 'Escape' && scene !== 'match') { e.preventDefault(); navigate('back'); }
  else if (scene !== 'match' && ['ArrowUp', 'ArrowDown'].includes(e.key) && !(e.target && e.target.tagName === 'INPUT')) { e.preventDefault(); navigate(e.key === 'ArrowUp' ? 'up' : 'down'); }
  else if (scene !== 'match' && e.key === 'Enter' && document.querySelector('.focus') && !(e.target && e.target.tagName === 'INPUT')) { e.preventDefault(); navigate('ok'); }
});
let capturing = false;

/* ---------------- profile ---------------- */
let P = null;
function saveP() { if (P) D.Accounts.save(P); document.querySelectorAll('.coins').forEach(e => e.textContent = fmt(P.coins)); }
function myLook() { return Object.assign({}, D.DEFAULT_EQ, P ? P.eq : {}); }

/* ---------------- showroom (3D menu background) ---------------- */
const show3d = { yaw: 0.6, look: null, spin: true };
function renderShowroom(dt) {
  show3d.yaw += dt * (show3d.spin ? 0.45 : 0);
  const [w, h] = R.size, asp = w / h, portrait = asp < 1;
  const look = show3d.look || myLook();
  const off = portrait ? 0 : (screen === 'garage' ? -175 : screen === 'home' ? 175 : 0);
  const ballVisible = screen === 'home' || screen === 'login';
  const y = show3d.yaw;
  R.render({
    views: [{ rect: [0, 0, 1, 1], eye: [off, portrait ? 170 : 125, portrait ? 640 : 430], target: [off, portrait ? 40 : 35, 0], fov: portrait ? 1.1 : 0.95 }],
    cars: [{ p: [0, 31, 0], f: [Math.cos(y), 0, Math.sin(y)], u: [0, 1, 0], look, team: 0, wr: 0 }],
    ball: { p: [-220, C.BALL_R, -260], f: [1, 0, 0], u: [0, 1, 0], hide: !ballVisible }, pads: null, wallAlpha: 0.2,
    fxCb(fx) { fx.floorRing(0, 3, 0, 150, [0.25, 0.55, 1], 0.7); fx.floorGlow(0, 2, 0, 190, [0.2, 0.45, 1], 0.35); fx.shadow(0, 2.5, 0, 80, 80, 0.6); if (ballVisible) fx.shadow(-220, 2.5, -260, 80, 80, 0.5); }
  });
}
const C = E.C;

/* ---------------- main loop ---------------- */
let scene = 'intro', match = null, net = null, last = performance.now(), lastRender = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const minDt = S.fps === 30 ? 1000 / 31 : 0;
  if (t - lastRender < minDt) return;
  const dt = Math.min(0.1, (t - last) / 1000); last = t; lastRender = t;
  I.navPoll();
  if (scene === 'match' && match) match.frame(dt);
  else if (R.ok) renderShowroom(dt);
}

/* ======================================================================
   INTRO
   ====================================================================== */
function intro() {
  scene = 'intro';
  const el = $('#intro'); el.classList.remove('hidden');
  el.innerHTML = `<div class="stage"><div class="sweep"></div>
    <div class="p1" style="position:absolute;inset:0;display:grid;place-items:center">
      <div class="studio"><span class="m">MOHSEN</span><span class="t">~</span><span class="d">DANIAL</span></div>
      <div class="pres">PRESENT</div><div class="ar">لعبة من صنع محسن ودانيال</div>
    </div>
    <div class="ring"></div><img class="logo2" src="assets/logo.png" alt="FANCY LEAGUE"><div class="flash"></div></div>
    <div class="press">اضغط أي زر للمتابعة • PRESS ANY KEY</div><div class="skip en">SKIP ▸</div>`;
  let audioOn = false, phase = 1, done = false;
  const audio = () => { if (audioOn) return; audioOn = true; A.init(); saveS(); if (phase === 1) A.SFX.intro(); };
  const t2 = setTimeout(() => { phase = 2; el.classList.add('phase2'); if (audioOn) A.SFX.slam(); }, 3000);
  const t3 = setTimeout(() => { phase = 3; el.classList.add('phase3'); }, 4100);
  const go = () => {
    if (done) return;
    if (!audioOn) { audio(); }
    if (phase < 3) { clearTimeout(t2); clearTimeout(t3); phase = 3; el.classList.add('phase2', 'phase3'); if (audioOn) A.SFX.slam(); setTimeout(finish, 650); return; }
    finish();
  };
  const finish = () => {
    if (done) return; done = true; A.init(); A.musicStart('menu');
    el.style.transition = 'opacity .6s'; el.style.opacity = '0';
    setTimeout(() => { el.classList.add('hidden'); el.innerHTML = ''; el.style.opacity = ''; }, 650);
    window.removeEventListener('keydown', go); window.removeEventListener('pointerdown', go); clearInterval(padT);
    scene = 'menu'; const cur = D.Accounts.current(); if (cur) { P = cur; home(); toast(`أهلًا بعودتك <b>${esc(P.name)}</b>`); } else login();
  };
  window.addEventListener('keydown', go); window.addEventListener('pointerdown', go);
  const padT = setInterval(() => { for (const p of I.pads()) if (p.buttons.some(b => b.pressed)) go(); }, 100);
}

/* ======================================================================
   LOGIN (email account chooser + special code + guest)
   ====================================================================== */
function login(sel) {
  const list = D.Accounts.list();
  let chosen = sel || list[0] || null;
  const render = () => show('login', `<div class="login"><div class="card panel">
      <img class="lg" src="assets/logo.png" alt="">
      <div class="center" style="position:static;transform:none"><div class="h2">تسجيل الدخول</div><div class="mut" style="font-size:13px">اختر حسابك واضغط موافق</div></div>
      ${list.length ? `<div class="col scroll" style="max-height:34vh">${list.map(e => { const p = D.Accounts.load(e) || { name: e }; return `<button class="acct ${e === chosen ? 'sel' : ''}" data-a="pick" data-v="${esc(e)}"><span class="av" style="background:${avColor(e)}">${esc((p.name || e)[0].toUpperCase())}</span><span class="grow"><b>${esc(p.name)}</b>${p.vip ? ' <span class="tag" style="background:#ff2bd6">VIP</span>' : ''}<div class="em">${esc(e)}</div></span></button>`; }).join('')}</div>
      <button class="btn pri lg" data-a="ok" ${chosen ? '' : 'disabled'}>موافق</button>` : ''}
      <button class="btn ghost" data-a="add">${list.length ? 'استخدام إيميل آخر' : 'الدخول بالإيميل'}</button>
      <div class="or">أو</div>
      <div class="row"><button class="btn gold grow" data-a="code">${IC.crown && '<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor"/></svg>'} الدخول بكود</button><button class="btn grow" data-a="guest">ضيف</button></div>
      <div class="mut center" style="position:static;transform:none;font-size:11px">© 2026 ${DEVS}</div>
    </div></div>`, {
    pick: v => { chosen = v; render(); },
    ok: () => { if (!chosen) return; P = D.Accounts.login(chosen); A.SFX.buy(); home(); toast(`أهلًا <b>${esc(P.name)}</b>`); },
    add: () => addEmail(), code: () => codeLogin(),
    guest: () => { P = D.Accounts.login('guest@nitro.local', 'Guest'); home(); }
  });
  render();
}
function addEmail() {
  modal({
    title: 'الدخول بالإيميل', html: `<div class="col"><input class="inp" id="em" type="email" placeholder="example@gmail.com" autocomplete="email" dir="ltr"><input class="inp" id="nm" maxlength="16" placeholder="اسمك في اللعبة"></div>`,
    buttons: [{ label: 'إلغاء', cls: 'ghost' }, { label: 'موافق', cls: 'pri', keep: true, fn: m => {
      const e = m.querySelector('#em').value.trim(), n = m.querySelector('#nm').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) { A.SFX.error(); toast('اكتب إيميل صحيح'); return; }
      m._close(); P = D.Accounts.login(e, n || undefined); if (n) { P.name = n.slice(0, 16); saveP(); } A.SFX.buy(); home(); toast(`أهلًا <b>${esc(P.name)}</b> 👋`);
    } }],
    onOpen: m => setTimeout(() => m.querySelector('#em').focus(), 50)
  });
}
function codeLogin() {
  modal({
    title: 'الدخول بكود خاص', html: `<input class="inp en" id="cd" maxlength="20" placeholder="CODE" style="text-align:center;letter-spacing:.4em;font-size:22px" dir="ltr">`,
    buttons: [{ label: 'إلغاء', cls: 'ghost' }, { label: 'دخول', cls: 'gold', keep: true, fn: m => {
      const code = m.querySelector('#cd').value.trim().toUpperCase();
      if (code !== 'MDR') { A.SFX.error(); toast('الكود غير صحيح'); return; }
      m._close(); P = D.Accounts.login('mdr@nitro.vip', 'MDR'); const r = D.applyCode(P, code); saveP(); A.SFX.rankup(); home(); toast(r.msg, 4200);
    } }],
    onOpen: m => setTimeout(() => m.querySelector('#cd').focus(), 50)
  });
}

/* ======================================================================
   HOME
   ====================================================================== */
function home() {
  scene = 'menu'; show3d.look = null; show3d.spin = true;
  A.musicStart('menu');
  const r = D.rankOf(Math.max(P.mmr[1], P.mmr[2], P.mmr[3])), lv = D.level(P), xp = P.xp % 1000;
  const title = D.ITEM[P.eq.title] || D.ITEM.n_rookie;
  show('home', `<div class="scr"><div class="home">
    <div class="htb">
      <button class="prof" data-a="profile"><span class="av" style="background:${avColor(P.email)}">${esc(P.name[0].toUpperCase())}</span><span style="text-align:start"><b>${esc(P.name)}</b> ${P.vip ? '<span class="tag" style="background:#ff2bd6;color:#fff">VIP</span>' : ''}<div class="lv">LVL ${lv}</div><div class="xpbar"><i style="width:${xp / 10}%"></i></div></span>${D.rankSVG(r, 34)}</button>
      <div class="grow"></div>
      <span class="chip coin">${IC.coin}<b class="coins">${fmt(P.coins)}</b></span>
      <button class="ibtn" data-a="settings" aria-label="settings">${IC.gear}</button>
    </div>
    <div class="menu">
      <img class="homelogo" src="assets/logo.png" alt="FANCY LEAGUE" style="align-self:flex-start;margin-bottom:6px">
      <button class="mbtn play" data-a="play">${IC.play}<span><b>العب</b><small>PLAY</small></span></button>
      <button class="mbtn" data-a="garage">${IC.car}<span><b>الكراج</b><small>GARAGE</small></span></button>
      <button class="mbtn" data-a="pass">${IC.crown}<span><b>فانسي باس <span class="en" style="font-size:12px;color:var(--gold)">TIER ${D.passTier(P)}</span></b><small>FANCY PASS</small></span></button>
      <button class="mbtn" data-a="shop">${IC.shop}<span><b>المتجر</b><small>ITEM SHOP</small></span></button>
      <button class="mbtn" data-a="profile">${IC.user}<span><b>الملف والرانك</b><small>PROFILE</small></span></button>
      <button class="mbtn" data-a="settings">${IC.gear}<span><b>الإعدادات</b><small>SETTINGS</small></span></button>
    </div>
    <div class="stage"><div class="plate"><div class="nm">${esc(P.name)}</div><div class="ttl en" style="color:${D.RAR[title.rar].c}">${esc(title.name)}</div></div></div>
    <div class="foot"><span>v${VERSION} • <a href="#" data-a="credits" style="color:inherit">عن اللعبة</a></span><b>© 2026 MOHSEN ~ DANIAL</b></div>
  </div></div>`, { play, garage: () => garage(), shop, profile, settings: () => settings(), credits, pass: passScreen }, null);
}

/* ======================================================================
   PLAY
   ====================================================================== */
function play() {
  show('play', `<div class="scr">${top('اختر طور اللعب', 'PLAY')}
    <div class="scroll grow" style="margin-top:12px"><div class="tiles">
      <button class="tile" data-a="online" style="--g:linear-gradient(135deg,#2f7dff,transparent)"><span class="ico">${IC.globe}</span><span class="en">ONLINE</span><b>أونلاين</b><small>العب مع خويك برمز غرفة أو ادخل مباراة سريعة</small></button>
      <button class="tile" data-a="bots" style="--g:linear-gradient(135deg,#ff7a1a,transparent)"><span class="ico">${IC.bot}</span><span class="en">VS BOTS</span><b>ضد البوتات</b><small>1v1 • 2v2 • 3v3 بثلاث مستويات صعوبة — يحسب رانك</small></button>
      <button class="tile" data-a="local" style="--g:linear-gradient(135deg,#a14dff,transparent)"><span class="ico">${IC.pads}</span><span class="en">LOCAL</span><b>محلي</b><small>لين 4 لاعبين على نفس الجهاز: كيبورد ويدات</small></button>
      <button class="tile" data-a="train" style="--g:linear-gradient(135deg,#2fd27a,transparent)"><span class="ico">${IC.ball}</span><span class="en">TRAINING</span><b>تدريب حر</b><small>تمرّن على النطّات والطيران والتسديد بدون وقت</small></button>
    </div></div></div>`, { online: onlineMenu, bots: botsSetup, local: localSetup, train: () => startLocal({ mode: 'training', size: 0, players: [{ name: P.name, look: myLook(), team: 0, src: 'any' }] }) }, home);
}
let botOpt = D.LS.get('botOpt', { size: 1, lvl: 1, time: 300 });
function seg(name, opts, val) { return `<div class="seg">${opts.map(([v, l]) => `<button data-a="${name}" data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('')}</div>`; }
function botsSetup() {
  const render = () => show('bots', `<div class="scr">${top('ضد البوتات', 'VS BOTS')}
    <div class="scroll grow" style="margin-top:12px"><div class="panel" style="padding:16px;max-width:640px">
      <div class="opt"><div class="l"><b>حجم الفريق</b><small>تلعب مع الفريق الأزرق</small></div>${seg('size', [[1, '1v1'], [2, '2v2'], [3, '3v3']], botOpt.size)}</div>
      <div class="opt"><div class="l"><b>الصعوبة</b><small>كل ما زادت الصعوبة زاد الرانك اللي تكسبه</small></div>${seg('lvl', [[0, 'مبتدئ'], [1, 'محترف'], [2, 'أسطوري']], botOpt.lvl)}</div>
      <div class="opt"><div class="l"><b>وقت المباراة</b></div>${seg('time', [[180, '3 د'], [300, '5 د'], [420, '7 د']], botOpt.time)}</div>
      <div class="opt"><div class="l"><b>الرانك الحالي (${botOpt.size}v${botOpt.size})</b><small>${D.rankOf(P.mmr[botOpt.size]).ar} • ${P.mmr[botOpt.size]} MMR</small></div>${D.rankSVG(D.rankOf(P.mmr[botOpt.size]), 44)}</div>
      <button class="btn pri lg" data-a="go" style="width:100%;margin-top:12px">${IC.play} ابدأ المباراة</button>
    </div></div></div>`, {
    size: v => { botOpt.size = +v; render(); }, lvl: v => { botOpt.lvl = +v; render(); }, time: v => { botOpt.time = +v; render(); },
    go: () => { D.LS.set('botOpt', botOpt); startLocal({ mode: 'bots', size: botOpt.size, botLvl: botOpt.lvl, time: botOpt.time, players: [{ name: P.name, look: myLook(), team: 0, src: 'any' }] }); }
  }, play);
  render();
}
let localPlayers = null;
function localSetup() {
  const srcs = () => { const o = [['kb1', 'كيبورد WASD'], ['kb2', 'كيبورد الأسهم']]; I.pads().forEach(p => o.push(['pad' + p.index, `يد ${I.padName(p)} ${p.index + 1}`])); for (let i = 0; i < 4; i++) if (!o.some(x => x[0] === 'pad' + i)) o.push(['pad' + i, `يد تحكم ${i + 1} (غير متصلة)`]); if (I.isTouch()) { o.push(['t1', 'لمس — يسار الشاشة'], ['t2', 'لمس — يمين الشاشة']); } return o; };
  if (!localPlayers) { const touch = I.isTouch(); localPlayers = [{ name: P.name, team: 0, src: touch ? 't1' : 'kb1' }, { name: 'Player 2', team: 1, src: touch ? 't2' : (I.pads()[0] ? 'pad' + I.pads()[0].index : 'kb2') }]; }
  let fill = D.LS.get('localFill', 0);
  const render = () => show('local', `<div class="scr">${top('لعب محلي', 'LOCAL MULTIPLAYER')}
    <div class="scroll grow" style="margin-top:12px"><div class="panel col" style="padding:16px;max-width:760px">
      ${localPlayers.map((p, i) => `<div class="lp"><span class="n" style="background:${p.team ? 'var(--orange)' : 'var(--blue)'}">P${i + 1}</span>
        <input class="inp" style="max-width:170px;padding:9px" data-i="${i}" value="${esc(p.name)}" maxlength="14">
        <select data-src="${i}">${srcs().map(([v, l]) => `<option value="${v}" ${p.src === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn sm ${p.team ? 'orange' : 'blue'}" data-a="team" data-v="${i}">${p.team ? 'البرتقالي' : 'الأزرق'}</button>
        ${i > 1 ? `<button class="btn sm red" data-a="rm" data-v="${i}">✕</button>` : ''}</div>`).join('')}
      <div class="row">${localPlayers.length < 4 ? '<button class="btn sm" data-a="add">+ لاعب</button>' : ''}<span class="mut" style="font-size:12px">وصّل يد اكسبوكس أو بلايستيشن واضغط أي زر فيها عشان تظهر</span></div>
      <div class="opt"><div class="l"><b>تكملة الفرق ببوتات</b><small>حجم كل فريق</small></div>${seg('fill', [[0, 'بدون'], [2, '2v2'], [3, '3v3']], fill)}</div>
      <button class="btn pri lg" data-a="go">${IC.play} ابدأ</button>
    </div></div></div>`, {
    team: v => { keep(); localPlayers[+v].team ^= 1; render(); }, rm: v => { keep(); localPlayers.splice(+v, 1); render(); },
    add: () => { keep(); const used = localPlayers.map(p => p.src); const free = srcs().map(s => s[0]).find(s => !used.includes(s)) || 'kb2'; localPlayers.push({ name: 'Player ' + (localPlayers.length + 1), team: localPlayers.length % 2, src: free }); render(); },
    fill: v => { keep(); fill = +v; D.LS.set('localFill', fill); render(); },
    go: () => { keep(); const pl = localPlayers.map((p, i) => ({ name: p.name || 'P' + (i + 1), team: p.team, src: p.src, look: i === 0 ? myLook() : { body: ['b_titan', 'b_breaker', 'b_comet'][i % 3], paint: ['p_crimson', 'p_lime', 'p_sky'][i % 3], wheel: 'w_std', boost: 't_flame', goal: 'g_fireworks' } })); startLocal({ mode: 'local', size: Math.max(1, fill), botLvl: 1, time: 300, players: pl }); }
  }, play);
  const keep = () => { ui.querySelectorAll('input[data-i]').forEach(el => localPlayers[+el.dataset.i].name = el.value.trim()); ui.querySelectorAll('select[data-src]').forEach(el => localPlayers[+el.dataset.src].src = el.value); };
  render();
  ui.addEventListener('change', keep, { once: true });
}

/* ======================================================================
   MATCH
   ====================================================================== */
let lastMatchOpts = null;
function enterMatch() {
  scene = 'match'; screen = 'match'; ui.innerHTML = ''; ui.classList.remove('dim'); document.body.classList.add('ingame'); A.musicStop();
  try { if (I.isTouch() && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {}); } catch (e) {}
  try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => wakeLock = w).catch(() => {}); } catch (e) {}
}
let wakeLock = null;
function leaveMatchScene() { document.body.classList.remove('ingame'); try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; scene = 'menu'; match = null; }
function startLocal(o) {
  lastMatchOpts = o;
  const sens = I.set.air;
  o.players.forEach(p => p.sens = sens);
  enterMatch();
  match = new M.Match(Object.assign({}, o, { cam: camOpts(), replays: S.replays, plates: S.plates, shake: S.shake, particles: S.particles, showFps: S.showFps, onPause: pauseMenu, onEnd: res => postMatch(res) }));
}
function pauseMenu() {
  if (!match || modalStack.length) return;
  if (!match.online) match.paused = true;
  modal({
    title: 'إيقاف مؤقت', dismiss: false,
    html: `<div class="col"><div class="opt"><div class="l"><b>الصوت</b></div><input type="range" min="0" max="1" step="0.05" value="${S.master}" id="pv"></div>
      <div class="mut" style="font-size:12px;line-height:1.9">${controlsText()}</div></div>`,
    buttons: [{ label: 'خروج من المباراة', cls: 'red', fn: () => ask('تطلع من المباراة؟', match.online ? 'بيتحكم بوت بسيارتك.' : 'ما بتنحسب لك النتيجة.', () => { match.quit(); leaveMatchScene(); home(); }, () => pauseMenu()) },
      { label: 'كمّل', cls: 'pri', fn: () => { if (match) match.paused = false; } }],
    onOpen: m => { const pv = m.querySelector('#pv'); pv.oninput = () => { S.master = +pv.value; saveS(); }; }
  });
}
function controlsText() {
  const k = a => (I.binds.solo[a] || []).map(I.keyName).join(' / ') || '—';
  return `<b>كيبورد وماوس (نفس روكيت ليق):</b> ${k('fwd')}/${k('back')} تسارع ورجوع • ${k('left')}/${k('right')} لف • ${k('jump')} نط • ${k('boost')} بوست • ${k('slide')} دريفت ولف جوي • ${k('rollL')}/${k('rollR')} لف جوي • ${k('cam')} كاميرا الكورة • ${k('rear')} نظرة لورا • ${k('score')} النتائج • 1-4 رسائل سريعة<br><b>يد:</b> RT تسارع • LT رجوع • A/✕ نط • B/◯ بوست • X/▢ دريفت ولف جوي • Y/△ كاميرا الكورة • LB/RB لف جوي • العصا اليمين تلف الكاميرا • R3 نظرة لورا • View/Share النتائج • الأسهم رسائل سريعة`;
}
function ask(title, text, yes, no) { modal({ title, text, buttons: [{ label: 'لا', cls: 'ghost', fn: no }, { label: 'إيه', cls: 'red', fn: yes }] }); }

/* rewards */
function applyRewards(res) {
  if (res.mode === 'training') return null;
  const me = res.rows.find(r => r.slot === res.locals[0]); if (!me) return null;
  const win = res.winTeam === res.myTeam, draw = res.winTeam === -1, mvp = res.mvp === me.slot;
  let coins = (win ? 100 : draw ? 60 : 40) + me.goals * 15 + me.saves * 10 + me.assists * 10 + (mvp ? 25 : 0);
  if (res.mode === 'local') coins = Math.round(coins * 0.4);
  const xp = (win ? 450 : 220) + me.score;
  const oldLv = D.level(P);
  let mmrD = 0, oldR = null, newR = null;
  if (res.ranked && res.size >= 1) {
    const key = Math.min(3, res.size), k = res.mode === 'online' ? 1.2 : [0.45, 0.75, 1][res.botLvl] || 0.75;
    const old = P.mmr[key]; oldR = D.rankOf(old);
    mmrD = Math.round((win ? 20 : draw ? 2 : -15) * k + (win && me.goals ? 2 : 0));
    if (P.vip && P.mmr[key] >= 2200 && mmrD < 0) mmrD = 0;
    P.mmr[key] = Math.max(0, old + mmrD); P.peak = Math.max(P.peak || 0, P.mmr[key]); newR = D.rankOf(P.mmr[key]);
  }
  P.coins += coins; P.xp += xp; P.pass = P.pass || { xp: 0, premium: false, claimed: {} }; const oldTier = D.passTier(P); P.pass.xp += xp;
  const s = P.stats; s.matches++; if (win) s.wins++; s.goals += me.goals; s.saves += me.saves; s.assists += me.assists; s.demos += me.demos; s.shots += me.shots; if (mvp) s.mvps++;
  saveP();
  return { coins, xp, mmrD, oldR, newR, levelUp: D.level(P) > oldLv, win, draw, tierUp: D.passTier(P) > oldTier, tier: D.passTier(P) };
}
function postMatch(res) {
  const mode = res.mode, rw = applyRewards(res);
  leaveMatchScene();
  const resTxt = res.winTeam === -1 ? 'DRAW' : res.winTeam === res.myTeam ? 'VICTORY' : 'DEFEAT';
  if (resTxt === 'VICTORY') A.SFX.win(); else A.SFX.lose();
  const rows = res.rows.slice().sort((a, b) => a.team - b.team || b.score - a.score);
  A.musicStart('menu');
  show('post', `<div class="scr"><div class="post scroll">
    <div class="result en ${resTxt === 'VICTORY' ? 'win' : 'lose'}">${resTxt}</div>
    <div class="center" style="position:static;transform:none;display:flex;justify-content:center;gap:14px;align-items:center;direction:ltr"><span class="chip" style="background:var(--blue);font-family:var(--fd);font-size:28px;padding:6px 18px">${res.score[0]}</span><span class="mut en">FINAL</span><span class="chip" style="background:var(--orange);font-family:var(--fd);font-size:28px;padding:6px 18px">${res.score[1]}</span></div>
    <div class="panel" style="padding:10px;overflow-x:auto"><table class="tbl"><tr><th>PLAYER</th><th>SCORE</th><th>GOALS</th><th>ASSISTS</th><th>SAVES</th><th>SHOTS</th><th>DEMOS</th></tr>
      ${rows.map(r => `<tr class="t${r.team} ${res.locals.includes(r.slot) ? 'me' : ''}"><td>${r.slot === res.mvp ? '<span style="color:var(--gold)">★ MVP</span> ' : ''}${esc(r.name)}${r.bot ? ' <span class="mut" style="font-size:10px">BOT</span>' : ''}</td><td>${r.score}</td><td>${r.goals}</td><td>${r.assists}</td><td>${r.saves}</td><td>${r.shots}</td><td>${r.demos}</td></tr>`).join('')}</table></div>
    ${rw ? `<div class="rewards">
      <div class="rw"><b class="coin" style="display:flex;gap:6px;justify-content:center;align-items:center">${IC.coin.replace('<svg', '<svg width="22" height="22"')}+${rw.coins}</b><small>كوينز</small></div>
      <div class="rw"><b>+${rw.xp}</b><small>XP${rw.levelUp ? ' • LEVEL UP!' : ''}</small></div><div class="rw"><b class="en" style="color:var(--gold)">TIER ${rw.tier}</b><small>فانسي باس${rw.tierUp ? ' — مستوى جديد!' : ''}</small></div>
      ${rw.newR ? `<div class="rw" style="display:flex;align-items:center;gap:10px">${D.rankSVG(rw.newR, 48)}<div><b style="color:${rw.mmrD >= 0 ? 'var(--ok)' : 'var(--bad)'}">${rw.mmrD >= 0 ? '+' : ''}${rw.mmrD}</b><small>${esc(rw.newR.ar)}${rw.oldR && rw.newR.min !== rw.oldR.min ? (rw.newR.min > rw.oldR.min ? ' — ترقية!' : ' — نزول') : ''}</small></div></div>` : ''}
    </div>` : ''}
    <div class="row" style="justify-content:center"><button class="btn pri lg" data-a="again">${IC.play} مباراة ثانية</button><button class="btn lg" data-a="home">القائمة الرئيسية</button></div>
  </div></div>`, {
    again: () => { if (mode === 'online') onlineMenu(); else if (lastMatchOpts) startLocal(lastMatchOpts); },
    home
  }, home);
  if (rw && rw.newR && rw.oldR && rw.newR.min > rw.oldR.min) setTimeout(() => { A.SFX.rankup(); toast(`ترقية! صرت <b>${esc(rw.newR.ar)}</b>`); }, 900);
}

/* ======================================================================
   ONLINE
   ====================================================================== */
let room = null, myPid = null, onlineState = '';
function ensureNet() {
  return new Promise(async (res, rej) => {
    if (net && net.open) return res(net);
    const url = N.serverURL(); if (!url) return rej(new Error('noserver'));
    if (net) net.close();
    net = new N.Net(url);
    try { await net.connect(); } catch (e) { return rej(e); }
    if (S.lowBw) net.send({ t: 'rate', r: 2 });
    net.on('room', m => { room = m; if (screen === 'lobby' && scene !== 'match') lobby(); });
    net.on('joined', m => { myPid = m.you; });
    net.on('err', m => { A.SFX.error(); toast(esc(m.m)); });
    net.on('start', m => { if (m.resume != null && match) return; room && (room.state = 'playing'); startOnline(m); });
    res(net);
  });
}
function onlineMenu() {
  let st = { size: D.LS.get('onSize', 1), csize: 1, bots: 1, time: 300 };
  const render = (status) => show('online', `<div class="scr">${top('أونلاين', 'ONLINE')}
    <div class="scroll grow" style="margin-top:12px"><div class="col" style="max-width:820px">
      <div class="panel row" style="padding:12px 16px" id="nst">${status || '<span class="mut">يتصل بالسيرفر…</span>'}</div>
      <div class="panel" style="padding:16px">
        <div class="h2">مباراة سريعة (رانكد)</div><div class="mut" style="font-size:13px;margin:4px 0 10px">نلقى لك لاعبين، ولو ما فيه أحد نكمل الفريق ببوتات</div>
        <div class="row">${seg('qsize', [[1, '1v1'], [2, '2v2'], [3, '3v3']], st.size)}<button class="btn pri" data-a="quick">${IC.play} ابحث عن مباراة</button></div>
      </div>
      <div class="panel" style="padding:16px">
        <div class="h2">العب مع خويك</div><div class="mut" style="font-size:13px;margin:4px 0 10px">سوّ غرفة خاصة وأرسل الكود لخويك، أو اكتب كوده وادخل</div>
        <div class="row"><input class="inp en" id="jc" maxlength="5" placeholder="CODE" style="max-width:190px;text-align:center;letter-spacing:.3em;text-transform:uppercase" dir="ltr"><button class="btn blue" data-a="join">دخول الغرفة</button></div>
        <div class="row" style="margin-top:12px">${seg('csize', [[1, '1v1'], [2, '2v2'], [3, '3v3']], st.csize)}<button class="btn orange" data-a="create">+ إنشاء غرفة</button></div>
      </div>
    </div></div></div>`, {
    qsize: v => { st.size = +v; D.LS.set('onSize', st.size); render(statusHtml()); },
    csize: v => { st.csize = +v; render(statusHtml()); },
    quick: () => withNet(n => { n.send({ t: 'quick', size: st.size, name: P.name, look: myLook(), mmr: P.mmr[st.size], sens: I.set.air }); onlineState = 'quick'; lobby(); }),
    create: () => withNet(n => { n.send({ t: 'create', size: st.csize, bots: 1, time: 300, name: P.name, look: myLook(), mmr: P.mmr[st.csize], sens: I.set.air }); onlineState = 'private'; lobby(); }),
    join: () => { const c = ($('#jc').value || '').trim().toUpperCase(); if (c.length < 4) { toast('اكتب كود الغرفة'); return; } withNet(n => { n.send({ t: 'join', code: c, name: P.name, look: myLook(), mmr: P.mmr[1], sens: I.set.air }); onlineState = 'private'; lobby(); }); }
  }, () => { if (net) { net.send({ t: 'leave' }); } play(); });
  const statusHtml = () => net && net.open ? `<span class="tag" style="background:var(--ok);color:#000">ONLINE</span><span>متصل بالسيرفر</span><span class="grow"></span><span class="ping en">${Math.round(net.rtt)} ms</span><span class="mut en" style="font-size:12px">${net.online || 1} PLAYERS</span>` :
    `<span class="tag" style="background:var(--bad)">OFFLINE</span><span>ما قدرنا نتصل بالسيرفر.</span><span class="grow"></span><button class="btn sm" data-a="srv">إعدادات السيرفر</button>`;
  acts.srv = () => settings('net');
  render();
  ensureNet().then(() => { if (screen === 'online') { render(statusHtml()); acts.srv = () => settings('net'); } }).catch(() => { if (screen === 'online') { render(statusHtml()); acts.srv = () => settings('net'); } });
  const withNet = f => ensureNet().then(f).catch(() => { A.SFX.error(); modal({ title: 'ما فيه اتصال', text: 'ما قدرنا نوصل لسيرفر الأونلاين. تأكد من النت، أو حط رابط السيرفر من الإعدادات ← الشبكة.', buttons: [{ label: 'إعدادات الشبكة', cls: 'pri', fn: () => settings('net') }, { label: 'تمام', cls: 'ghost' }] }); });
}
function lobby() {
  const r = room;
  const waitT = lobby._t0 || (lobby._t0 = Date.now());
  if (!r) { show('lobby', `<div class="scr">${top(onlineState === 'quick' ? 'نبحث عن مباراة…' : 'الغرفة', 'LOBBY')}<div class="grow" style="display:grid;place-items:center"><div class="h2">جاري الاتصال…</div></div></div>`, {}, leaveLobby); return; }
  const me = r.players.find(p => p.id === myPid), host = r.host === myPid;
  const col = t => { const ps = r.players.filter(p => p.team === t); const rows = ps.map(p => `<div class="pl">${D.rankSVG(D.rankOf(p.rank || 0), 26)}<span class="grow">${esc(p.name)}${p.id === myPid ? ' <span class="mut">(أنت)</span>' : ''}</span>${p.id === r.host ? '<span class="tag" style="background:var(--gold);color:#000">HOST</span>' : ''}${p.bot ? '<span class="tag" style="background:#333">BOT</span>' : ''}</div>`); for (let i = ps.length; i < r.size; i++) rows.push(`<div class="pl empty">${r.priv ? 'مكان فاضي — بيتكمّل ببوت' : 'نبحث…'}</div>`); return rows.join(''); };
  show('lobby', `<div class="scr">${top(r.priv ? 'غرفة خاصة' : 'مباراة سريعة', 'LOBBY')}
    <div class="scroll grow" style="margin-top:12px"><div class="col" style="max-width:900px">
      ${r.priv ? `<div class="panel row" style="padding:14px 18px;justify-content:space-between"><div><div class="mut" style="font-size:12px">كود الغرفة — أرسله لخويك</div><div class="code">${esc(r.code)}</div></div><button class="btn" data-a="copy">${IC.copy.replace('<svg', '<svg width="20" height="20"')} نسخ الكود</button></div>` :
      `<div class="panel" style="padding:14px 18px"><div class="h2">نبحث عن لاعبين… <span class="en mut" id="wt">0s</span></div><div class="mut" style="font-size:13px">لو ما اكتمل العدد خلال ثواني، نكمل ببوتات ونبدأ</div></div>`}
      <div class="teams"><div class="teamcol t0"><div class="en" style="font-size:12px;letter-spacing:.3em">BLUE</div>${col(0)}</div><div class="teamcol t1"><div class="en" style="font-size:12px;letter-spacing:.3em">ORANGE</div>${col(1)}</div></div>
      <div class="row">
        ${r.priv ? `<button class="btn" data-a="swap">تبديل الفريق</button>` : ''}
        ${r.priv && host ? `${seg('rsize', [[1, '1v1'], [2, '2v2'], [3, '3v3']], r.size)}<button class="btn pri lg" data-a="start">${IC.play} ابدأ المباراة</button>` : r.priv ? '<span class="mut">ننتظر صاحب الغرفة يبدأ…</span>' : ''}
      </div>
    </div></div></div>`, {
    copy: () => { try { navigator.clipboard.writeText(r.code).then(() => toast('تم نسخ الكود ✔'), () => toast('الكود: ' + r.code)); } catch (e) { toast('الكود: ' + r.code); } },
    swap: () => net.send({ t: 'team', team: me ? 1 - me.team : 0 }),
    start: () => net.send({ t: 'start' }),
    rsize: v => net.send({ t: 'settings', size: +v })
  }, leaveLobby);
  if (!r.priv) { clearInterval(lobby._iv); lobby._iv = setInterval(() => { const el = $('#wt'); if (!el || screen !== 'lobby') { clearInterval(lobby._iv); return; } el.textContent = Math.round((Date.now() - waitT) / 1000) + 's'; }, 500); }
}
function leaveLobby() { if (net) net.send({ t: 'leave' }); room = null; lobby._t0 = 0; onlineMenu(); }
function startOnline(m) {
  lobby._t0 = 0;
  enterMatch();
  match = new M.Match({ mode: 'online', net, start: m, size: m.size, ranked: m.ranked, sens: I.set.air, cam: camOpts(), plates: S.plates, shake: S.shake, particles: S.particles, showFps: S.showFps, onPause: pauseMenu, onEnd: res => { room = null; postMatch(res); } });
}

/* ======================================================================
   GARAGE
   ====================================================================== */
function garage(cat = 'body') {
  show3d.spin = true;
  const items = D.ITEMS.filter(i => i.type === cat && (!i.code || P.owned.includes(i.id)));
  const swatch = it => {
    if (it.col) return `<div class="sw" style="background:linear-gradient(135deg,${it.col},${D.shade(it.col, -0.4)})"></div>`;
    if (it.type === 'boost') return `<div class="sw" style="background:linear-gradient(90deg,transparent,${it.c1 === 'team' ? '#4d94ff' : it.c1 === 'rainbow' ? 'red' : it.c1},${it.c1 === 'rainbow' ? 'lime,blue,violet' : it.c2})"></div>`;
    if (it.type === 'goal') return `<div class="sw" style="background:radial-gradient(circle,${D.RAR[it.rar].c},transparent 70%)"></div>`;
    if (it.type === 'title') return `<div class="sw en" style="display:grid;place-items:center;font-size:11px;letter-spacing:.15em;color:${D.RAR[it.rar].c};background:rgba(0,0,0,.3)">${esc(it.name)}</div>`;
    return `<div class="sw" style="display:grid;place-items:center;background:rgba(0,0,0,.25)">${IC.car.replace('<svg', '<svg width="34" height="34" style="color:' + D.RAR[it.rar].c + '"')}</div>`;
  };
  show('garage', `<div class="scr">${top('الكراج', 'GARAGE')}
    <div class="gar" style="margin-top:10px;min-height:0;flex:1">
      <div class="stage" style="display:flex;align-items:flex-end;justify-content:center;pointer-events:none"><div class="plate"><div class="nm en">${esc((D.ITEM[P.eq.body] || {}).name || '')}</div><div class="mut" style="font-size:12px">اسحب لتدوير السيارة</div></div></div>
      <div class="side panel" style="padding:12px">
        <div class="cats">${D.TYPES.map(t => `<button data-a="cat" data-v="${t.id}" class="${t.id === cat ? 'on' : ''}">${t.ar}</button>`).join('')}</div>
        <div class="items scroll grow">${items.map(it => { const own = P.owned.includes(it.id), eq = P.eq[cat] === it.id, rc = D.RAR[it.rar].c; return `<button class="item ${eq ? 'eq' : ''}" style="--rc:${rc}" data-a="item" data-v="${it.id}">${swatch(it)}<div><b>${esc(it.ar)}</b><div class="rr">${D.RAR[it.rar].en}</div></div>${own ? (eq ? '<span class="badge">✔ مركّب</span>' : '') : `<span class="lock" style="color:${rc}">${IC.lock}</span>${it.pass ? '<span class="pr en" style="color:#ff2bd6;font-size:10px">FANCY PASS</span>' : `<span class="pr">${IC.coin.replace('<svg', '<svg width="14" height="14"')}${fmt(it.price)}</span>`}`}</button>`; }).join('')}</div>
      </div>
    </div></div>`, {
    cat: v => garage(v),
    item: id => {
      const it = D.ITEM[id];
      if (P.owned.includes(id)) { P.eq[it.type] = id; saveP(); show3d.look = null; A.SFX.buy(); garage(cat); return; }
      show3d.look = Object.assign(myLook(), { [it.type]: id });
      if (it.pass) { toast('هذا الغرض من <b>فانسي باس</b> — افتحه من الباس'); return; }
      buyModal(it, () => garage(cat), () => { show3d.look = null; });
    }
  }, () => { show3d.look = null; home(); });
}
function buyModal(it, after, cancel) {
  const can = P.coins >= it.price;
  modal({
    title: esc(it.ar), html: `<div class="row"><span class="tag" style="background:${D.RAR[it.rar].c};color:#000">${D.RAR[it.rar].en}</span><span class="en">${esc(it.name)}</span></div><p>السعر: <b class="coin">${fmt(it.price)}</b> كوينز • رصيدك: <b>${fmt(P.coins)}</b></p>${can ? '' : '<p style="color:var(--bad)">رصيدك ما يكفي — العب مباريات تجمع كوينز، أو استلم مكافأتك اليومية من المتجر.</p>'}`,
    buttons: [{ label: 'إلغاء', cls: 'ghost', fn: cancel }, { label: `شراء وتركيب`, cls: 'gold', fn: () => { if (!can) { A.SFX.error(); cancel && cancel(); return; } P.coins -= it.price; P.owned.push(it.id); P.eq[it.type] = it.id; saveP(); A.SFX.buy(); toast(`اشتريت <b>${esc(it.ar)}</b> ✔`); show3d.look = null; after && after(); } }]
  });
}

/* ======================================================================
   SHOP
   ====================================================================== */
function shop() {
  const sh = D.shopToday(), day = Math.floor(Date.now() / 86400000), canDaily = P.daily !== day;
  const left = () => { const ms = sh.ends - Date.now(), h = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60e3); return `${h}h ${m}m`; };
  show('shop', `<div class="scr">${top('المتجر', 'ITEM SHOP')}
    <div class="scroll grow" style="margin-top:12px"><div class="col">
      <div class="row">
        <div class="panel row grow" style="padding:14px"><div class="grow"><div class="h2">المكافأة اليومية</div><div class="mut" style="font-size:13px">+250 كوينز كل يوم</div></div><button class="btn gold" data-a="daily" ${canDaily ? '' : 'disabled'}>${canDaily ? 'استلم' : 'استلمتها اليوم ✔'}</button></div>
        <div class="panel row grow" style="padding:14px"><input class="inp en" id="rc" placeholder="CODE" maxlength="20" style="max-width:170px;text-align:center;letter-spacing:.3em" dir="ltr"><button class="btn" data-a="redeem">استرداد كود</button></div>
      </div>
      <div class="row"><div class="h2 grow">العروض المميزة اليوم</div><span class="chip en" style="font-size:12px">NEW ITEMS IN ${left()}</span></div>
      <div class="shopgrid">${sh.items.map(it => card(it)).join('')}</div>
      <div class="h2" style="margin-top:6px">كل الأغراض</div>
      <div class="shopgrid">${D.ITEMS.filter(i => i.price > 0 && !i.code).map(it => card(it)).join('')}</div>
    </div></div></div>`, {
    daily: () => { if (P.daily === day) return; P.daily = day; P.coins += 250; saveP(); A.SFX.coin(); toast('+250 كوينز 🪙'); shop(); },
    redeem: () => { const r = D.applyCode(P, $('#rc').value); saveP(); if (r.ok) { A.SFX.rankup(); toast(r.msg, 4000); shop(); } else { A.SFX.error(); toast(r.msg); } },
    buy: id => { const it = D.ITEM[id]; if (P.owned.includes(id)) { P.eq[it.type] = id; saveP(); toast('تم التركيب ✔'); A.SFX.buy(); return; } show3d.look = Object.assign(myLook(), { [it.type]: id }); buyModal(it, shop, () => { show3d.look = null; }); }
  }, home);
  function card(it) {
    const own = P.owned.includes(it.id), rc = D.RAR[it.rar].c, t = D.TYPES.find(x => x.id === it.type);
    return `<button class="item" style="--rc:${rc};background:linear-gradient(180deg,${rc}22,rgba(255,255,255,.02))" data-a="buy" data-v="${it.id}"><div class="rr">${D.RAR[it.rar].en} • ${t.en}</div><b style="font-size:16px">${esc(it.ar)}</b><div class="en mut" style="font-size:11px">${esc(it.name)}</div>${own ? '<span class="badge" style="position:static">✔ تملكه</span>' : `<span class="pr">${IC.coin.replace('<svg', '<svg width="16" height="16"')}${fmt(it.price)}</span>`}</button>`;
  }
}

/* ======================================================================
   PROFILE
   ====================================================================== */
function profile() {
  const lv = D.level(P), s = P.stats;
  const rk = n => { const r = D.rankOf(P.mmr[n]), nx = D.nextRank(P.mmr[n]); const pc = nx ? Math.round((P.mmr[n] - r.min) / (nx.min - r.min) * 100) : 100; return `<div class="rk">${D.rankSVG(r, 72)}<div class="en" style="font-size:12px;letter-spacing:.2em">${n}V${n}</div><b>${esc(r.ar)}</b><div class="en mut" style="font-size:11px">${esc(r.en)} • ${P.mmr[n]} MMR</div><div class="pb"><i style="width:${pc}%;background:${r.c}"></i></div><small class="mut">${nx ? 'الرانك الجاي: ' + esc(nx.ar) : 'أعلى رانك!'}</small></div>`; };
  show('profile', `<div class="scr">${top('الملف الشخصي', 'PROFILE')}
    <div class="scroll grow" style="margin-top:12px"><div class="col" style="max-width:980px">
      <div class="panel row" style="padding:16px">
        <span class="av" style="width:64px;height:64px;font-size:28px;background:${avColor(P.email)}">${esc(P.name[0].toUpperCase())}</span>
        <div class="grow"><div class="h2">${esc(P.name)} ${P.vip ? '<span class="tag" style="background:#ff2bd6">VIP</span>' : ''}</div><div class="mut en" style="font-size:13px;letter-spacing:0;text-transform:none">${esc(P.email)}</div>
          <div class="row" style="margin-top:6px"><span class="chip">LVL ${lv}</span><div class="xpbar" style="width:160px"><i style="width:${(P.xp % 1000) / 10}%"></i></div><span class="chip coin">${IC.coin}${fmt(P.coins)}</span></div></div>
        <button class="btn sm" data-a="rename">تغيير الاسم</button>
      </div>
      <div class="ranks">${rk(1)}${rk(2)}${rk(3)}</div>
      <div class="panel" style="padding:14px"><div class="h2" style="margin-bottom:10px">الإحصائيات</div><div class="stats">
        ${[['المباريات', s.matches], ['الفوز', s.wins], ['نسبة الفوز', s.matches ? Math.round(s.wins / s.matches * 100) + '%' : '—'], ['الأهداف', s.goals], ['الصدّات', s.saves], ['التمريرات', s.assists], ['التسديدات', s.shots], ['التدمير', s.demos], ['أفضل لاعب', s.mvps]].map(([k, v]) => `<div class="st"><b>${v}</b><small>${k}</small></div>`).join('')}
      </div></div>
      <div class="row"><button class="btn" data-a="switch">تبديل الحساب</button><button class="btn red" data-a="logout">تسجيل الخروج</button></div>
    </div></div></div>`, {
    rename: () => modal({ title: 'تغيير الاسم', html: `<input class="inp" id="nn" maxlength="16" value="${esc(P.name)}">`, buttons: [{ label: 'إلغاء', cls: 'ghost' }, { label: 'حفظ', cls: 'pri', fn: m => { const v = m.querySelector('#nn').value.trim(); if (v) { P.name = v.slice(0, 16); saveP(); profile(); } } }] }),
    switch: () => { D.Accounts.logout(); P = null; login(); },
    logout: () => ask('تسجيل الخروج؟', 'بياناتك محفوظة على هذا الجهاز وتقدر ترجع لها بأي وقت.', () => { D.Accounts.logout(); P = null; login(); })
  }, home);
}

/* ======================================================================
   FANCY PASS
   ====================================================================== */
function passScreen() {
  const PS = D.PASS, tier = D.passTier(P), pp = P.pass, inT = (pp.xp % PS.per) / PS.per;
  const cell = (t, track) => {
    const r = track === 'free' ? PS.free[t] : PS.prem[t]; if (!r) return '<div class="pcell empty"></div>';
    const L = D.rewardLabel(r), key = track + t, got = !!pp.claimed[key], reach = tier >= t, lock = track === 'prem' && !pp.premium;
    const rc = L.item ? D.RAR[L.item.rar].c : '#ffcf4a';
    return `<button class="pcell ${got ? 'got' : ''} ${reach && !got && !lock ? 'ready' : ''} ${lock ? 'locked' : ''}" style="--rc:${rc}" data-a="claim" data-v="${key}" ${!reach || got || lock ? 'disabled' : ''}>
      ${L.coins ? `<div class="pi">${IC.coin.replace('<svg', '<svg width="34" height="34"')}</div>` : `<div class="pi" style="color:${rc}">${L.item.type === 'body' ? IC.car.replace('<svg', '<svg width="36" height="36"') : L.item.type === 'topper' ? IC.crown.replace('<svg', '<svg width="32" height="32"') : '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="currentColor"/></svg>'}</div>`}
      <b>${esc(L.ar)}</b>${L.item ? `<small class="en" style="color:${rc}">${D.RAR[L.item.rar].en}</small>` : ''}${got ? '<span class="ok">✔</span>' : lock ? `<span class="lk">${IC.lock}</span>` : ''}</button>`;
  };
  let cols = ''; for (let t = 1; t <= PS.tiers; t++) cols += `<div class="pcol ${tier >= t ? 'done' : ''}"><div class="pt en">${t}</div>${cell(t, 'prem')}${cell(t, 'free')}</div>`;
  show('pass', `<div class="scr">${top('فانسي باس', 'FANCY PASS • ' + PS.name)}
    <div class="panel row" style="padding:14px;margin-top:10px">
      <div style="text-align:center;min-width:90px"><div class="en mut" style="font-size:11px;letter-spacing:.2em">TIER</div><div class="code" style="font-size:44px;letter-spacing:0">${tier}</div></div>
      <div class="grow"><div class="row" style="justify-content:space-between"><b>${pp.premium ? '<span style="color:#ff2bd6">✦ PREMIUM</span>' : 'المسار المجاني'}</b><span class="en mut" style="font-size:12px">${tier >= PS.tiers ? 'MAX' : Math.round(pp.xp % PS.per) + ' / ' + PS.per + ' XP'}</span></div>
        <div class="xpbar" style="width:100%;height:10px;margin-top:8px"><i style="width:${tier >= PS.tiers ? 100 : inT * 100}%"></i></div>
        <div class="mut" style="font-size:12px;margin-top:6px">العب مباريات واكسب XP عشان تفتح مستويات وجوائز</div></div>
      ${pp.premium ? '' : `<button class="btn gold" data-a="buy">فتح البريميوم • ${IC.coin.replace('<svg', '<svg width="16" height="16"')} ${fmt(PS.price)}</button>`}
      <button class="btn pri" data-a="all">استلام الكل</button>
    </div>
    <div class="ptracks"><div class="plabels"><div></div><div class="en" style="color:#ff2bd6">PREMIUM</div><div class="en">FREE</div></div><div class="pscroll scroll">${cols}</div></div>
  </div>`, {
    claim: k => claim(k) && passScreen(),
    all: () => { let n = 0; for (let t = 1; t <= tier; t++) for (const tr of ['free', 'prem']) if (claim(tr + t, true)) n++; if (n) { A.SFX.buy(); toast(`استلمت ${n} جائزة ✔`); } else toast('ما فيه جوائز جديدة'); passScreen(); },
    buy: () => { if (P.coins < PS.price) { A.SFX.error(); toast('رصيدك ما يكفي'); return; } modal({ title: 'فانسي باس بريميوم', text: `تفتح كل جوائز المسار المميز (سيارات حصرية، توبرز، بوست، انفجار هدف) مقابل ${fmt(PS.price)} كوينز.`, buttons: [{ label: 'إلغاء', cls: 'ghost' }, { label: 'فتح', cls: 'gold', fn: () => { P.coins -= PS.price; P.pass.premium = true; saveP(); A.SFX.rankup(); toast('صار عندك فانسي باس بريميوم ✦'); passScreen(); } }] }); }
  }, home);
  const sc = ui.querySelector('.pscroll'); if (sc) sc.scrollLeft = 0, setTimeout(() => { const el = ui.querySelectorAll('.pcol')[Math.max(0, tier - 2)]; el && el.scrollIntoView({ inline: 'start', block: 'nearest' }); }, 30);
  function claim(key, silent) {
    const track = key.startsWith('free') ? 'free' : 'prem', t = +key.replace(/\D/g, ''), r = track === 'free' ? PS.free[t] : PS.prem[t];
    if (!r || pp.claimed[key] || t > tier || (track === 'prem' && !pp.premium)) return false;
    const L = D.rewardLabel(r); pp.claimed[key] = 1;
    if (L.coins) P.coins += L.coins; else if (!P.owned.includes(L.item.id)) P.owned.push(L.item.id);
    saveP(); if (!silent) { A.SFX.buy(); toast(`حصلت على <b>${esc(L.ar)}</b>`); } return true;
  }
}

/* ======================================================================
   SETTINGS
   ====================================================================== */
function settings(tab = 'controls') {
  const tabs = [['controls', 'التحكم'], ['camera', 'الكاميرا'], ['gameplay', 'اللعب'], ['audio', 'الصوت'], ['graphics', 'الجرافيكس'], ['net', 'الشبكة'], ['account', 'الأكواد'], ['about', 'عن اللعبة']];
  const tg = (k, l, d, obj = 'S') => `<div class="set"><div class="l"><b>${l}</b>${d ? `<small>${d}</small>` : ''}</div><button class="tog ${(obj === 'S' ? S : I.set)[k] ? 'on' : ''}" data-a="tog" data-v="${obj}:${k}"></button></div>`;
  const sl = (k, l, min, max, step, obj = 'S', d = '') => `<div class="set"><div class="l"><b>${l}</b>${d ? `<small>${d}</small>` : ''}</div><input type="range" min="${min}" max="${max}" step="${step}" value="${(obj === 'S' ? S : I.set)[k]}" data-k="${obj}:${k}"><span class="en" style="width:46px;text-align:center;font-size:12px" data-o="${obj}:${k}">${(obj === 'S' ? S : I.set)[k]}</span></div>`;
  const sel = (k, l, opts, d = '') => `<div class="set"><div class="l"><b>${l}</b>${d ? `<small>${d}</small>` : ''}</div><select data-s="${k}">${opts.map(([v, t]) => `<option value="${v}" ${String(S[k]) === String(v) ? 'selected' : ''}>${t}</option>`).join('')}</select></div>`;
  const AL = { fwd: 'تسارع / أنف لتحت', back: 'رجوع / فرامل', left: 'لف يسار', right: 'لف يمين', jump: 'نط / فليب', boost: 'بوست', slide: 'دريفت / لف جوي', rollL: 'لف جوي يسار', rollR: 'لف جوي يمين', cam: 'كاميرا الكورة (Ball Cam)', rear: 'نظرة لورا', score: 'جدول النتائج' };
  const bindRow = (who, act) => `<div class="set"><div class="l"><b>${AL[act]}</b></div>${[0, 1].map(i => `<button class="kbd" data-a="bind" data-v="${who}:${act}:${i}">${I.keyName((I.binds[who][act] || [])[i])}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'controls') {
    const pads = I.pads();
    body = `<div class="h2">كيبورد وماوس — نفس إعدادات روكيت ليق الافتراضية</div>${I.ACTIONS.map(a => bindRow('solo', a)).join('')}
      <div class="h2" style="margin-top:14px">لاعب 1 محلي</div>${['fwd', 'back', 'left', 'right', 'jump', 'boost', 'slide', 'cam', 'rear'].map(a => bindRow('p1', a)).join('')}
      <div class="h2" style="margin-top:14px">لاعب 2 محلي</div>${['fwd', 'back', 'left', 'right', 'jump', 'boost', 'slide', 'cam', 'rear'].map(a => bindRow('p2', a)).join('')}
      <div class="h2" style="margin-top:14px">الحساسية</div>${sl('steer', 'حساسية الستيرنق Steering Sensitivity', 0.5, 3, 0.05, 'I')}${sl('air', 'حساسية الجو Aerial Sensitivity', 0.5, 3, 0.05, 'I', 'سرعة دوران السيارة بالهوا')}${sl('deadzone', 'المنطقة الميتة Controller Deadzone', 0, 0.5, 0.01, 'I')}${sl('ddz', 'منطقة الفليب Dodge Deadzone', 0.1, 0.9, 0.01, 'I', 'كم لازم تحرك العصا عشان النطة الثانية تصير فليب')}${tg('invertY', 'عكس المحور العمودي', 'للتحكم بالجو', 'I')}${tg('vib', 'الاهتزاز', 'يد التحكم والجوال', 'I')}
      <div class="h2" style="margin-top:14px">أيادي التحكم</div><div class="mut" style="font-size:13px;line-height:1.9">${pads.length ? pads.map(p => `✔ ${I.padName(p)} — <span class="en" style="font-size:11px;text-transform:none;letter-spacing:0">${esc(p.id.slice(0, 40))}</span>`).join('<br>') : 'ما فيه يد متصلة. وصّل يد اكسبوكس أو بلايستيشن واضغط أي زر.'}<br><b>نفس تحكم روكيت ليق:</b> RT/R2 تسارع • LT/L2 رجوع • العصا اليسار لف وتحكم بالجو • A/✕ نط • B/◯ بوست • X/▢ دريفت ولف جوي • Y/△ كاميرا الكورة • LB/RB لف جوي • العصا اليمين تلف الكاميرا • R3 نظرة لورا • View النتائج • الأسهم رسائل سريعة • Start إيقاف</div>
      <div class="h2" style="margin-top:14px">أزرار اللمس</div>${sl('touchSize', 'حجم الأزرار', 0.7, 1.5, 0.05, 'I')}${sl('touchOpacity', 'شفافية الأزرار', 0.3, 1, 0.05, 'I')}${tg('touchSwap', 'عكس الجهات', 'الأزرار يسار والعصا يمين', 'I')}
      <button class="btn sm" data-a="resetb" style="margin-top:10px">إرجاع الافتراضي</button>`;
  } else if (tab === 'camera') body = `<div class="row" style="margin-bottom:8px"><button class="btn sm" data-a="campreset">افتراضي روكيت ليق</button><button class="btn sm gold" data-a="campro">إعدادات المحترفين</button></div>`
    + tg('shake', 'اهتزاز الكاميرا Camera Shake', 'عند الأهداف والتصادمات') + sl('camFov', 'مجال الرؤية Field of View', 60, 110, 1) + sl('camDist', 'المسافة Distance', 100, 400, 10) + sl('camHeight', 'الارتفاع Height', 40, 200, 10) + sl('camAngle', 'الزاوية Angle', -15, 0, 1)
    + sl('camStiff', 'الصلابة Stiffness', 0, 1, 0.05, 'S', '1 = الكاميرا ثابتة على السيارة • 0 = تبعد شوي مع السرعة') + sl('camSwivel', 'سرعة اللف Swivel Speed', 1, 10, 0.1, 'S', 'العصا اليمين بيد التحكم') + sl('camTrans', 'سرعة التحويل Transition Speed', 1, 2, 0.1, 'S', 'بين كاميرا الكورة وكاميرا السيارة') + tg('invSwivel', 'عكس اللف Invert Swivel')
    + `<div class="h2" style="margin-top:14px">كاميرا الكورة Ball Camera</div>` + tg('ballcam', 'كاميرا الكورة شغالة بالبداية', 'تبدّلها باللعب بزر Space أو Y/△') + sel('ballMode', 'طريقة الزر Ball Camera Mode', [['toggle', 'Toggle — ضغطة تبدّل'], ['hold', 'Hold — اضغط مطوّل']]);
  else if (tab === 'gameplay') body = tg('replays', 'إعادة الأهداف Goal Replays', 'بعد كل هدف بالمباريات المحلية والبوتات — تقدر تتخطاها بزر النط') + tg('plates', 'أسماء اللاعبين فوق السيارات');
  else if (tab === 'audio') body = sl('master', 'الصوت العام', 0, 1, 0.05) + sl('sfx', 'المؤثرات', 0, 1, 0.05) + sl('music', 'الموسيقى', 0, 1, 0.05) + sl('crowd', 'الجمهور', 0, 1, 0.05);
  else if (tab === 'graphics') body = sel('quality', 'جودة الرسوم', [['auto', 'تلقائي'], ['low', 'منخفضة (أسرع — سيارات خفيفة)'], ['medium', 'متوسطة'], ['high', 'عالية (موديلات Blender)']], 'لو الجهاز يعلّق خلّها منخفضة') + sel('fps', 'حد الفريمات', [[60, '60 / بدون حد'], [30, '30 (توفير بطارية)']]) + sl('particles', 'كمية المؤثرات', 0.3, 1.5, 0.1) + tg('showFps', 'إظهار الفريمات FPS');
  else if (tab === 'net') body = `<div class="set"><div class="l"><b>رابط سيرفر الأونلاين</b><small>بعد ما ترفع السيرفر (Render) حط الرابط هنا. لو اللعبة مفتوحة من رابط السيرفر نفسه اتركه فاضي.</small></div></div><div class="row"><input class="inp en" id="srv" placeholder="https://fancy-league.onrender.com" value="${esc(S.server)}" dir="ltr" style="flex:1;min-width:220px;text-transform:none;letter-spacing:0;font-family:var(--f)"><button class="btn" data-a="srvsave">حفظ واختبار</button></div><div class="mut" id="srvres" style="margin-top:10px;font-size:13px"></div>
    ${tg('lowBw', 'وضع النت الضعيف', 'يقلل البيانات اللي توصلك للنص — فعّله لو نتك بطيء أو باقة')}
    <div class="set"><div class="l"><b>نظام الشبكة</b><small>سيرفر رسمي 120Hz + توقّع حركتك محليًا (Prediction) + تصحيح ناعم + إرسال الأوامر مكرر — عشان اللعب يكون سلس حتى لو نت خويك ضعيف</small></div></div>`;
  else if (tab === 'account') body = `<div class="set"><div class="l"><b>استرداد كود</b><small>عندك كود خاص؟ اكتبه هنا</small></div></div><div class="row"><input class="inp en" id="rc2" maxlength="20" placeholder="CODE" style="max-width:220px;text-align:center;letter-spacing:.3em" dir="ltr"><button class="btn gold" data-a="redeem">استرداد</button></div>
    <div class="set" style="margin-top:12px"><div class="l"><b>الحساب الحالي</b><small class="en" style="letter-spacing:0;text-transform:none">${esc(P ? P.email : '')}</small></div><button class="btn sm" data-a="switchacc">تبديل الحساب</button></div>`;
  else if (tab === 'about') body = creditsHtml();
  show('settings', `<div class="scr">${top('الإعدادات', 'SETTINGS')}
    <div class="setwrap" style="margin-top:12px"><div class="tabs">${tabs.map(([id, l]) => `<button data-a="tab" data-v="${id}" class="${id === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="panel scroll" style="padding:14px 18px">${body}</div></div></div>`, {
    tab: v => settings(v),
    tog: (v, el) => { const [o, k] = v.split(':'); const obj = o === 'S' ? S : I.set; obj[k] = !obj[k]; el.classList.toggle('on', obj[k]); o === 'S' ? saveS() : I.save(); },
    bind: (v, el) => { const [who, act, i] = v.split(':'); el.classList.add('wait'); el.textContent = 'اضغط زر…'; capturing = true; setTimeout(() => I.captureKey(code => { capturing = false; if (code !== 'Escape') { const arr = (I.binds[who][act] || []).slice(); arr[+i] = code; I.binds[who][act] = arr.filter(Boolean); I.save(); } settings('controls'); }), 120); },
    campreset: () => { Object.assign(S, CAMDEF); saveS(); toast('رجعت إعدادات الكاميرا الافتراضية ✔'); settings('camera'); },
    campro: () => { Object.assign(S, CAMPRO); saveS(); toast('إعدادات المحترفين ✔'); settings('camera'); },
    resetb: () => { for (const k in I.DEF_BINDS) I.binds[k] = JSON.parse(JSON.stringify(I.DEF_BINDS[k])); I.set = Object.assign({}, I.DEF_SET); I.save(); toast('تم ✔'); settings('controls'); },
    srvsave: async () => {
      S.server = $('#srv').value.trim(); saveS(); const out = $('#srvres'); out.textContent = 'نختبر الاتصال…';
      if (net) { net.close(); net = null; }
      const url = N.serverURL(); if (!url) { out.textContent = 'حط رابط السيرفر أول.'; return; }
      const t = new N.Net(url); try { await t.connect(); out.innerHTML = '<span style="color:var(--ok)">✔ متصل! تقدر تلعب أونلاين الحين</span>'; t.close(); } catch (e) { out.innerHTML = '<span style="color:var(--bad)">✖ ما قدرنا نتصل — تأكد من الرابط وإن السيرفر شغال (أول مرة ممكن ياخذ دقيقة يصحى)</span>'; }
    },
    redeem: () => { const r = D.applyCode(P, $('#rc2').value); saveP(); if (r.ok) { A.SFX.rankup(); toast(r.msg, 4000); } else { A.SFX.error(); toast(r.msg); } },
    switchacc: () => { D.Accounts.logout(); P = null; login(); }
  }, home);
  ui.querySelectorAll('input[type=range]').forEach(r => r.oninput = () => { const [o, k] = r.dataset.k.split(':'); const obj = o === 'S' ? S : I.set; obj[k] = +r.value; const lab = ui.querySelector(`[data-o="${r.dataset.k}"]`); if (lab) lab.textContent = r.value; o === 'S' ? saveS() : I.save(); });
  ui.querySelectorAll('select[data-s]').forEach(s => s.onchange = () => { const k = s.dataset.s; S[k] = k === 'fps' ? +s.value : s.value; saveS(); if (k === 'quality') { R.setQuality(quality()); if (S.quality !== 'low' && !R.hasModels) loadModels(); else if (S.quality === 'low') toast('الجودة المنخفضة تستخدم سيارات أخف — أعد فتح اللعبة'); } A.SFX.click(); });
}
function creditsHtml() {
  return `<div class="col" style="align-items:center;text-align:center;gap:14px;padding:10px">
    <img src="assets/logo.png" style="width:min(420px,80%)" alt="">
    <div class="mut">فكرة • تطوير • تصميم • برمجة</div>
    <div class="code" style="font-size:clamp(28px,5vw,46px);letter-spacing:.08em">MOHSEN ~ DANIAL</div>
    <div class="row" style="justify-content:center"><div class="panel" style="padding:12px 20px"><b class="en">MOHSEN</b><div class="mut" style="font-size:12px">مطوّر</div></div><div class="panel" style="padding:12px 20px"><b class="en">DANIAL</b><div class="mut" style="font-size:12px">مطوّر</div></div></div>
    <div class="mut" style="font-size:13px;line-height:1.9">FANCY LEAGUE v${VERSION}<br>© 2026 Mohsen ~ Danial — جميع الحقوق محفوظة.<br>يُمنع نسخ اللعبة أو إعادة نشرها بدون إذن المطورين.</div>
    <div class="mut" style="font-size:11px">Fonts: Archivo Black & Montserrat (SIL Open Font License)</div></div>`;
}
function credits() { show('credits', `<div class="scr">${top('عن اللعبة', 'CREDITS')}<div class="scroll grow">${creditsHtml()}</div></div>`, {}, home); }

/* ======================================================================
   BOOT
   ====================================================================== */
function b64ab(b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function loadModels() {
  if (quality() === 'low') return; // weak devices keep the light classic cars
  const go = (ab, meta) => { if (R.loadModels(ab, meta)) console.log('Blender models loaded'); };
  if (window.FL_MODELS_B64) { try { go(b64ab(window.FL_MODELS_B64), window.FL_META); } catch (e) {} return; }
  Promise.all([fetch('assets/fl_models.bin').then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)), fetch('assets/fl_meta.json').then(r => r.json()).catch(() => ({}))])
    .then(([ab, meta]) => go(ab, meta)).catch(e => console.warn('models', e));
}
function boot() {
  const ok = R.init($('#gl'), { quality: quality() });
  if (!ok) { document.body.innerHTML = '<div style="display:grid;place-items:center;height:100vh;color:#fff;font-family:sans-serif;text-align:center;padding:20px">جهازك أو المتصفح ما يدعم WebGL.<br>جرّب Chrome أو Edge أو Safari محدث.</div>'; return; }
  R.loadTex('logo', 'assets/logo.png');
  loadModels();
  window.addEventListener('resize', () => R.resize());
  requestAnimationFrame(loop);
  intro();
  try { if ('serviceWorker' in navigator && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  if (/^127\.0\.0\.1$/.test(location.hostname) && location.port === '47323') { const ping = () => fetch('/__ping', { cache: 'no-store' }).catch(() => {}); ping(); setInterval(ping, 2000); }
  document.addEventListener('visibilitychange', () => { if (document.hidden && match && !match.online && !match.paused && scene === 'match') pauseMenu(); });
  console.log('%cFANCY LEAGUE %cby ' + DEVS, 'font:900 20px sans-serif;color:#ff7a1a', 'color:#7fb2ff');
}
window.NLAPP = { get match() { return match; }, get P() { return P; }, home, play, startLocal, onlineMenu, settings, garage, shop, profile, login };
boot();
})();
