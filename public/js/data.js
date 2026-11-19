/* FANCY LEAGUE — catalog, ranks, profile
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function () {
'use strict';
const RAR = {
  common: { n: 'عادي', en: 'COMMON', c: '#9aa4b2' },
  rare: { n: 'نادر', en: 'RARE', c: '#4f8cff' },
  vrare: { n: 'نادر جدًا', en: 'VERY RARE', c: '#a35bff' },
  import: { n: 'مستورد', en: 'IMPORT', c: '#ff4d6d' },
  exotic: { n: 'أسطوري', en: 'EXOTIC', c: '#ffc53d' },
  black: { n: 'السوق السوداء', en: 'BLACK MARKET', c: '#ff2bd6' }
};
const ITEMS = [
  // bodies
  { id: 'b_falcon', type: 'body', name: 'FALCON', ar: 'فالكون', rar: 'common', price: 0 },
  { id: 'b_titan', type: 'body', name: 'TITAN', ar: 'تايتن', rar: 'rare', price: 1200 },
  { id: 'b_breaker', type: 'body', name: 'BREAKER', ar: 'بريكر', rar: 'vrare', price: 2200 },
  { id: 'b_rhino', type: 'body', name: 'RHINO', ar: 'راينو', rar: 'import', price: 3500 },
  { id: 'b_comet', type: 'body', name: 'COMET', ar: 'كوميت', rar: 'exotic', price: 5200 },
  { id: 'b_phantom', type: 'body', name: 'PHANTOM', ar: 'فانتوم', rar: 'black', price: 9000 },
  { id: 'b_mamba', type: 'body', name: 'MAMBA', ar: 'مامبا', rar: 'rare', price: 1500 },
  { id: 'b_zephyr', type: 'body', name: 'ZEPHYR', ar: 'زيفر', rar: 'vrare', price: 2600 },
  { id: 'b_bulldog', type: 'body', name: 'BULLDOG', ar: 'بولدوق', rar: 'import', price: 3800 },
  { id: 'b_typhoon', type: 'body', name: 'TYPHOON', ar: 'تايفون', rar: 'exotic', price: 6000 },
  { id: 'b_stinger', type: 'body', name: 'STINGER', ar: 'ستينقر', rar: 'import', price: 0, pass: 1 },
  { id: 'b_wraith', type: 'body', name: 'WRAITH', ar: 'ريث', rar: 'black', price: 0, pass: 1 },
  // paints (accent)
  { id: 'p_white', type: 'paint', name: 'TITANIUM', ar: 'تيتانيوم', rar: 'common', price: 0, col: '#e9edf5' },
  { id: 'p_black', type: 'paint', name: 'CARBON', ar: 'كاربون', rar: 'common', price: 300, col: '#1a1d24' },
  { id: 'p_crimson', type: 'paint', name: 'CRIMSON', ar: 'قرمزي', rar: 'rare', price: 600, col: '#e0263b' },
  { id: 'p_lime', type: 'paint', name: 'LIME', ar: 'ليموني', rar: 'rare', price: 600, col: '#7ed321' },
  { id: 'p_purple', type: 'paint', name: 'PURPLE', ar: 'بنفسجي', rar: 'rare', price: 600, col: '#8a3ffc' },
  { id: 'p_pink', type: 'paint', name: 'PINK', ar: 'وردي', rar: 'vrare', price: 900, col: '#ff4fa3' },
  { id: 'p_sky', type: 'paint', name: 'SKY', ar: 'سماوي', rar: 'vrare', price: 900, col: '#3fd0ff' },
  { id: 'p_saffron', type: 'paint', name: 'SAFFRON', ar: 'زعفراني', rar: 'vrare', price: 900, col: '#ffb000' },
  { id: 'p_gold', type: 'paint', name: 'GOLD', ar: 'ذهبي', rar: 'exotic', price: 2400, col: '#f6c945' },
  { id: 'p_chrome', type: 'paint', name: 'CHROME', ar: 'كروم', rar: 'import', price: 1800, col: '#c8d3e6' },
  { id: 'p_forest', type: 'paint', name: 'FOREST', ar: 'زيتي', rar: 'rare', price: 600, col: '#1f7a4d' },
  { id: 'p_mdr', type: 'paint', name: 'MDR ROYAL', ar: 'ملكي MDR', rar: 'black', price: 7500, col: '#6b2bff' },
  // wheels
  { id: 'w_std', type: 'wheel', name: 'OEM', ar: 'أصلية', rar: 'common', price: 0, col: '#b8c0cc' },
  { id: 'w_black', type: 'wheel', name: 'STEALTH', ar: 'ستيلث', rar: 'rare', price: 500, col: '#2a2e36' },
  { id: 'w_red', type: 'wheel', name: 'RED LINE', ar: 'ريد لاين', rar: 'rare', price: 650, col: '#e53935' },
  { id: 'w_neon', type: 'wheel', name: 'NEON', ar: 'نيون', rar: 'vrare', price: 1200, col: '#39ff88', glow: 1 },
  { id: 'w_gold', type: 'wheel', name: 'GOLDSTONE', ar: 'جولدستون', rar: 'exotic', price: 3200, col: '#f6c945' },
  { id: 'w_plasma', type: 'wheel', name: 'PLASMA', ar: 'بلازما', rar: 'black', price: 6000, col: '#ff2bd6', glow: 1 },
  // boosts
  { id: 't_std', type: 'boost', name: 'STANDARD', ar: 'عادي', rar: 'common', price: 0, c1: 'team', c2: '#ffffff' },
  { id: 't_flame', type: 'boost', name: 'INFERNO', ar: 'جحيم', rar: 'rare', price: 800, c1: '#ff5a00', c2: '#ffd000' },
  { id: 't_plasma', type: 'boost', name: 'PLASMA', ar: 'بلازما', rar: 'vrare', price: 1500, c1: '#00e5ff', c2: '#ff2bd6' },
  { id: 't_toxic', type: 'boost', name: 'TOXIC', ar: 'سام', rar: 'vrare', price: 1500, c1: '#5dff3a', c2: '#a100ff' },
  { id: 't_gold', type: 'boost', name: 'GOLD RUSH', ar: 'حمى الذهب', rar: 'exotic', price: 4000, c1: '#ffd34d', c2: '#fff6c2' },
  { id: 't_shadow', type: 'boost', name: 'SHADOW', ar: 'الظل', rar: 'import', price: 2600, c1: '#7b2cff', c2: '#11001f' },
  { id: 't_rainbow', type: 'boost', name: 'PRISM', ar: 'قوس قزح', rar: 'black', price: 8000, c1: 'rainbow', c2: '#ffffff' },
  // goal explosions
  { id: 'g_classic', type: 'goal', name: 'CLASSIC', ar: 'كلاسيك', rar: 'common', price: 0 },
  { id: 'g_fireworks', type: 'goal', name: 'FIREWORKS', ar: 'ألعاب نارية', rar: 'vrare', price: 1800 },
  { id: 'g_shock', type: 'goal', name: 'SHOCKWAVE', ar: 'موجة صدمة', rar: 'import', price: 3000 },
  { id: 'g_gold', type: 'goal', name: 'GOLD RAIN', ar: 'مطر ذهب', rar: 'exotic', price: 5000 },
  { id: 'g_galaxy', type: 'goal', name: 'GALAXY', ar: 'مجرة', rar: 'black', price: 9000 },
  { id: 'g_dragon', type: 'goal', name: 'DRAGON FIRE', ar: 'نار التنين', rar: 'black', price: 0, pass: 1 },
  // toppers
  { id: 'h_none', type: 'topper', name: 'NONE', ar: 'بدون', rar: 'common', price: 0 },
  { id: 'h_cap', type: 'topper', name: 'CAP', ar: 'كاب', rar: 'rare', price: 500 },
  { id: 'h_cone', type: 'topper', name: 'TRAFFIC CONE', ar: 'قمع', rar: 'rare', price: 600 },
  { id: 'h_tophat', type: 'topper', name: 'TOP HAT', ar: 'قبعة رسمية', rar: 'vrare', price: 1400 },
  { id: 'h_horns', type: 'topper', name: 'HORNS', ar: 'قرون', rar: 'import', price: 0, pass: 1 },
  { id: 'h_halo', type: 'topper', name: 'HALO', ar: 'هالة', rar: 'exotic', price: 0, pass: 1 },
  { id: 'h_crown', type: 'topper', name: 'CROWN', ar: 'تاج', rar: 'black', price: 0, pass: 1 },
  { id: 't_aurora', type: 'boost', name: 'AURORA', ar: 'شفق', rar: 'exotic', price: 0, pass: 1, c1: '#36ffd2', c2: '#9b6bff' },
  { id: 'n_pass', type: 'title', name: 'SEASON 1 VETERAN', ar: 'محارب الموسم 1', rar: 'exotic', price: 0, pass: 1 },
  // titles
  { id: 'n_rookie', type: 'title', name: 'ROOKIE', ar: 'مبتدئ', rar: 'common', price: 0 },
  { id: 'n_striker', type: 'title', name: 'STRIKER', ar: 'هداف', rar: 'rare', price: 700 },
  { id: 'n_wall', type: 'title', name: 'THE WALL', ar: 'الجدار', rar: 'vrare', price: 1200 },
  { id: 'n_aerial', type: 'title', name: 'SKY KING', ar: 'ملك الجو', rar: 'import', price: 2500 },
  { id: 'n_legend', type: 'title', name: 'FANCY LEGEND', ar: 'أسطورة فانسي', rar: 'exotic', price: 6000 },
  { id: 'n_dev', type: 'title', name: 'MDR', ar: 'MDR', rar: 'black', price: 0, code: true }
];
const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const TYPES = [
  { id: 'body', ar: 'السيارة', en: 'BODY' }, { id: 'paint', ar: 'اللون', en: 'PAINT' }, { id: 'wheel', ar: 'الجنوط', en: 'WHEELS' }, { id: 'topper', ar: 'فوق السيارة', en: 'TOPPER' },
  { id: 'boost', ar: 'البوست', en: 'BOOST' }, { id: 'goal', ar: 'انفجار الهدف', en: 'GOAL EXPLOSION' }, { id: 'title', ar: 'اللقب', en: 'TITLE' }
];
const TEAM = [
  { name: 'BLUE', ar: 'الأزرق', c: '#2f7dff', c2: '#7fb2ff', glow: [0.2, 0.55, 1] },
  { name: 'ORANGE', ar: 'البرتقالي', c: '#ff7a1a', c2: '#ffb36b', glow: [1, 0.5, 0.1] }
];
/* ranks */
const TIERS = [
  ['BRONZE', 'برونز', '#b4703f'], ['SILVER', 'فضي', '#b9c4d6'], ['GOLD', 'ذهبي', '#f2c037'], ['PLATINUM', 'بلاتيني', '#37d0c8'],
  ['DIAMOND', 'ألماسي', '#3f8cff'], ['CHAMPION', 'بطل', '#a14dff'], ['GRAND CHAMPION', 'البطل الكبير', '#ff3b5c']
];
const RANKS = [];
TIERS.forEach((t, i) => { for (let d = 0; d < 3; d++) RANKS.push({ tier: i, div: d, en: t[0] + ' ' + ['I', 'II', 'III'][d], ar: t[1] + ' ' + ['1', '2', '3'][d], c: t[2], min: i * 270 + d * 90 }); });
RANKS.push({ tier: 7, div: 0, en: 'FANCY LEGEND', ar: 'أسطورة فانسي', c: '#ffffff', min: 1900, legend: 1 });
function rankOf(mmr) { let r = RANKS[0]; for (const k of RANKS) if (mmr >= k.min) r = k; return r; }
function nextRank(mmr) { return RANKS.find(k => k.min > mmr) || null; }
function rankSVG(r, size = 64) {
  const c = r.c, n = r.legend ? 0 : r.div + 1, t = r.tier;
  const shapes = [
    'M32 4 L56 16 L56 40 L32 60 L8 40 L8 16 Z', 'M32 4 L58 20 L50 54 L14 54 L6 20 Z', 'M32 3 L60 32 L32 61 L4 32 Z',
    'M32 3 L54 12 L60 34 L44 58 L20 58 L4 34 L10 12 Z', 'M32 2 L48 16 L62 22 L52 44 L32 62 L12 44 L2 22 L16 16 Z',
    'M32 2 L40 18 L60 14 L50 32 L60 50 L40 46 L32 62 L24 46 L4 50 L14 32 L4 14 L24 18 Z', 'M32 2 L44 12 L60 10 L56 28 L62 44 L46 50 L32 62 L18 50 L2 44 L8 28 L4 10 L20 12 Z', 'M32 1 L42 20 L63 24 L48 39 L52 61 L32 51 L12 61 L16 39 L1 24 L22 20 Z'
  ];
  const id = 'rg' + Math.random().toString(36).slice(2, 7);
  const bars = r.legend ? '<circle cx="32" cy="33" r="7" fill="#fff"/><circle cx="32" cy="33" r="12" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>' :
    Array.from({ length: n }, (_, i) => `<path d="M${20} ${40 - i * 9} L32 ${33 - i * 9} L44 ${40 - i * 9}" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.45)}"/></linearGradient></defs><path d="${shapes[Math.min(t, 7)]}" fill="url(#${id})" stroke="${shade(c, 0.35)}" stroke-width="2.5" stroke-linejoin="round"/><path d="${shapes[Math.min(t, 7)]}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1" transform="translate(32 32) scale(.78) translate(-32 -32)"/>${bars}</svg>`;
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f); r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

/* ---------- accounts & profile ---------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('nl_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('nl_' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('nl_' + k); } catch (e) {} }
};
const DEFAULT_EQ = { body: 'b_falcon', paint: 'p_white', wheel: 'w_std', boost: 't_std', goal: 'g_classic', title: 'n_rookie', topper: 'h_none' };
function newProfile(email, name) {
  return {
    email, name: (name || email.split('@')[0] || 'Player').slice(0, 16), coins: 500, xp: 0, created: Date.now(),
    owned: ITEMS.filter(i => i.price === 0 && !i.code && !i.pass).map(i => i.id), eq: Object.assign({}, DEFAULT_EQ),
    mmr: { 1: 420, 2: 420, 3: 420 }, peak: 420, stats: { matches: 0, wins: 0, goals: 0, saves: 0, assists: 0, demos: 0, mvps: 0, shots: 0 },
    daily: 0, vip: false, codes: [], pass: { xp: 0, premium: false, claimed: {} }
  };
}
function level(p) { return 1 + Math.floor(p.xp / 1000); }
function applyCode(p, code) {
  code = String(code || '').trim().toUpperCase();
  if (code === 'MDR') {
    p.owned = ITEMS.map(i => i.id); p.coins = Math.max(p.coins, 999999); p.mmr = { 1: 2200, 2: 2200, 3: 2200 }; p.peak = 2200;
    p.xp = Math.max(p.xp, 99 * 1000); p.vip = true; p.eq.title = 'n_dev'; if (!p.codes.includes('MDR')) p.codes.push('MDR');
    p.pass = p.pass || { xp: 0, premium: false, claimed: {} }; p.pass.premium = true; p.pass.xp = Math.max(p.pass.xp, PASS.tiers * PASS.per);
    return { ok: true, msg: 'تم فتح كل شيء! 👑 أعلى رانك، كل السيارات والأغراض، و 999,999 كوينز' };
  }
  if (code === 'MOHSEN' || code === 'DANIAL') {
    if (p.codes.includes(code)) return { ok: false, msg: 'الكود مستخدم من قبل' };
    p.codes.push(code); p.coins += 5000; return { ok: true, msg: 'مبروك! +5,000 كوينز' };
  }
  return { ok: false, msg: 'الكود غير صحيح' };
}
const Accounts = {
  list() { return LS.get('accounts', []); },
  current() { const e = LS.get('current', null); return e ? this.load(e) : null; },
  load(email) { const p = LS.get('p_' + email, null); if (p) { p.eq = Object.assign({}, DEFAULT_EQ, p.eq); p.stats = Object.assign(newProfile(email).stats, p.stats); p.pass = p.pass || { xp: 0, premium: false, claimed: {} }; if (!p.owned.includes('h_none')) p.owned.push('h_none'); for (const i of ITEMS) if (i.price === 0 && !i.code && !i.pass && !p.owned.includes(i.id)) p.owned.push(i.id); } return p; },
  save(p) { LS.set('p_' + p.email, p); },
  login(email, name) {
    email = String(email).trim().toLowerCase();
    let p = this.load(email); if (!p) { p = newProfile(email, name); this.save(p); }
    const l = this.list().filter(e => e !== email); l.unshift(email); LS.set('accounts', l.slice(0, 8)); LS.set('current', email); return p;
  },
  logout() { LS.del('current'); },
  forget(email) { LS.set('accounts', this.list().filter(e => e !== email)); }
};
/* FANCY PASS (season pass) */
const PASS = { season: 1, name: 'SEASON 1', tiers: 50, per: 1000, price: 1500, free: {}, prem: {} };
(function () {
  const fr = { 2: 'c100', 4: 'h_cap', 6: 'c150', 8: 'p_forest', 10: 'c200', 12: 'w_black', 14: 'c200', 16: 'h_cone', 18: 'c250', 20: 'p_purple', 24: 'c300', 28: 't_flame', 32: 'c300', 36: 'b_mamba', 40: 'c400', 45: 'c500', 50: 'n_pass' };
  const pr = { 1: 'b_stinger', 5: 'h_horns', 10: 't_aurora', 15: 'h_halo', 20: 'g_dragon', 25: 'w_neon', 30: 'p_mdr', 35: 'b_typhoon', 40: 'h_crown', 45: 'g_galaxy', 50: 'b_wraith' };
  for (let t = 1; t <= PASS.tiers; t++) { if (fr[t]) PASS.free[t] = fr[t]; PASS.prem[t] = pr[t] || ('c' + (100 + (t % 5) * 50)); }
})();
function passTier(p) { return Math.min(PASS.tiers, Math.floor(((p.pass && p.pass.xp) || 0) / PASS.per)); }
function rewardLabel(r) { if (!r) return null; if (r[0] === 'c') return { coins: +r.slice(1), ar: '+' + r.slice(1) + ' كوينز' }; const it = ITEM[r]; return it ? { item: it, ar: it.ar } : null; }
/* daily shop rotation */
function shopToday() {
  const day = Math.floor(Date.now() / 86400000); let s = day * 9301 + 49297;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pool = ITEMS.filter(i => i.price > 0 && !i.code && !i.pass);
  const out = []; while (out.length < 6 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return { day, items: out, ends: (day + 1) * 86400000 };
}
window.NLD = { PASS, passTier, rewardLabel, RAR, ITEMS, ITEM, TYPES, TEAM, RANKS, rankOf, nextRank, rankSVG, shade, hex2rgb, LS, Accounts, newProfile, level, applyCode, shopToday, DEFAULT_EQ };
})();
