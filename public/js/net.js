/* FANCY LEAGUE — network client
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function () {
'use strict';
const sleep = ms => new Promise(r => setTimeout(r, ms));
function serverURL() {
  const D = window.NLD, s = (D.LS.get('settings', {}) || {}).server || (window.NL_CONFIG && window.NL_CONFIG.server) || '';
  if (s) { let u = s.trim().replace(/\/+$/, ''); if (/^https?:/.test(u)) u = u.replace(/^http/, 'ws'); else if (!/^wss?:/.test(u)) u = 'wss://' + u; return u; }
  if (/^https?:$/.test(location.protocol) && !/^(127\.0\.0\.1|localhost)$/.test(location.hostname) && !/claude|anthropic|usercontent/.test(location.hostname)) return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname) && location.port && location.port !== '47323') return 'ws://' + location.host;
  return 'wss://fancy-league.onrender.com'; // official server
}
class Net {
  constructor(url) { this.url = url; this.h = {}; this.ws = null; this.rtt = 0; this.jit = 0; this.open = false; this.token = null; this.online = 0; this.manual = false; }
  on(t, f) { (this.h[t] = this.h[t] || []).push(f); return () => { this.h[t] = (this.h[t] || []).filter(x => x !== f); }; }
  clear(t) { if (t) delete this.h[t]; else this.h = {}; }
  emit(t, m) { (this.h[t] || []).slice().forEach(f => { try { f(m); } catch (e) { console.error(e); } }); }
  connect() {
    return new Promise((res, rej) => {
      let ws; try { ws = new WebSocket(this.url); } catch (e) { return rej(e); }
      this.ws = ws; this.manual = false;
      const to = setTimeout(() => { rej(new Error('timeout')); try { ws.close(); } catch (e) {} }, 8000);
      ws.onopen = () => { clearTimeout(to); this.open = true; clearInterval(this.pingT); this.pingT = setInterval(() => this.send({ t: 'ping', c: performance.now() }), 1000); this.send({ t: 'ping', c: performance.now() }); res(); };
      ws.onmessage = e => {
        let m; try { m = JSON.parse(e.data); } catch (x) { return; }
        if (m.t === 'pong') { const r = performance.now() - m.c; this.jit = this.jit * 0.8 + Math.abs(r - this.rtt) * 0.2; this.rtt = this.rtt ? this.rtt * 0.7 + r * 0.3 : r; this.online = m.n; }
        if (m.t === 'joined') this.token = m.token;
        this.emit(m.t, m);
      };
      ws.onclose = () => { clearTimeout(to); const was = this.open; this.open = false; clearInterval(this.pingT); if (was) this.emit('close', { manual: this.manual }); };
      ws.onerror = () => {};
    });
  }
  send(o) { if (this.ws && this.ws.readyState === 1) { try { this.ws.send(JSON.stringify(o)); } catch (e) {} } }
  close() { this.manual = true; clearInterval(this.pingT); try { this.ws && this.ws.close(); } catch (e) {} this.open = false; }
  async reconnect(tries = 12) {
    for (let i = 0; i < tries && !this.manual; i++) {
      try { await this.connect(); if (this.token) this.send({ t: 'rejoin', token: this.token }); this.emit('reconnected'); return true; }
      catch (e) { await sleep(800 * Math.min(4, i + 1)); }
    }
    return false;
  }
}
window.NLN = { Net, serverURL };
})();
