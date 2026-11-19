/* FANCY LEAGUE — WebGL 3D renderer (no libraries)
   © 2026 Mohsen ~ Danial. All rights reserved. */
(function () {
'use strict';
const NL = window.NL, C = NL.C, { LX, LZ, H, RC, RE, GW, GH, GD } = C;

/* ---------------- math ---------------- */
function mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; }
function persp(f, asp, n, fa) { const t = 1 / Math.tan(f / 2), o = new Float32Array(16); o[0] = t / asp; o[5] = t; o[10] = (fa + n) / (n - fa); o[11] = -1; o[14] = 2 * fa * n / (n - fa); return o; }
const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function lookAt(e, c, u) {
  const z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(u, z)), y = cross(z, x), o = new Float32Array(16);
  o[0] = x[0]; o[1] = y[0]; o[2] = z[0]; o[4] = x[1]; o[5] = y[1]; o[6] = z[1]; o[8] = x[2]; o[9] = y[2]; o[10] = z[2];
  o[12] = -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]); o[13] = -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]); o[14] = -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]); o[15] = 1; return o;
}
function basisM(p, f, u, s = 1) { const r = cross(f, u), o = new Float32Array(16); o[0] = f[0] * s; o[1] = f[1] * s; o[2] = f[2] * s; o[4] = u[0] * s; o[5] = u[1] * s; o[6] = u[2] * s; o[8] = r[0] * s; o[9] = r[1] * s; o[10] = r[2] * s; o[12] = p[0]; o[13] = p[1]; o[14] = p[2]; o[15] = 1; return o; }
function trs(tx, ty, tz, rz = 0, s = 1) { const c = Math.cos(rz), sn = Math.sin(rz), o = new Float32Array(16); o[0] = c * s; o[1] = sn * s; o[4] = -sn * s; o[5] = c * s; o[10] = s; o[12] = tx; o[13] = ty; o[14] = tz; o[15] = 1; return o; }
const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function earcut(pts) {
  const n = pts.length; let idx = [...Array(n).keys()], area = 0;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  if (area < 0) idx.reverse();
  const cr = (a, b, c) => (pts[b][0] - pts[a][0]) * (pts[c][1] - pts[a][1]) - (pts[b][1] - pts[a][1]) * (pts[c][0] - pts[a][0]);
  const cr2 = (p, a, b) => (pts[a][0] - p[0]) * (pts[b][1] - p[1]) - (pts[a][1] - p[1]) * (pts[b][0] - p[0]);
  const inT = (p, a, b, c) => { const d1 = cr2(p, a, b), d2 = cr2(p, b, c), d3 = cr2(p, c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  const tris = []; let guard = 0;
  while (idx.length > 3 && guard++ < 20000) {
    let ok = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
      if (cr(a, b, c) <= 1e-9) continue; let inside = false;
      for (const p of idx) { if (p === a || p === b || p === c) continue; if (inT(pts[p], a, b, c)) { inside = true; break; } }
      if (inside) continue; tris.push(a, b, c); idx.splice(i, 1); ok = true; break;
    }
    if (!ok) idx.splice(0, 1);
  }
  if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
  return tris;
}
class MB {
  constructor() { this.v = []; }
  vert(p, n, c, e = 0) { this.v.push(p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], e); }
  tri(a, b, c, col, e = 0, na, nb, nc) { if (!na) { na = nb = nc = norm(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]])); } this.vert(a, na, col, e); this.vert(b, nb, col, e); this.vert(c, nc, col, e); }
  quad(a, b, c, d, col, e = 0, n) { this.tri(a, b, c, col, e, n, n, n); this.tri(a, c, d, col, e, n, n, n); }
  box(cx, cy, cz, sx, sy, sz, col, e = 0) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, e); this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, e);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, e); this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, e);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, e); this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, e);
  }
  extrude(poly, z0, z1, colSide, colCap, e = 0) {
    const t = earcut(poly), n = poly.length; let area = 0;
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    for (let i = 0; i < t.length; i += 3) {
      const A = poly[t[i]], B = poly[t[i + 1]], Cc = poly[t[i + 2]];
      const s = ((B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0])) > 0, [p, q, r] = s ? [A, B, Cc] : [A, Cc, B];
      this.tri([p[0], p[1], z1], [q[0], q[1], z1], [r[0], r[1], z1], colCap, e); this.tri([p[0], p[1], z0], [r[0], r[1], z0], [q[0], q[1], z0], colCap, e);
    }
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; if (area > 0) this.quad([a[0], a[1], z1], [a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], colSide, e); else this.quad([b[0], b[1], z1], [b[0], b[1], z0], [a[0], a[1], z0], [a[0], a[1], z1], colSide, e); }
  }
  cyl(cx, cy, z0, z1, r, seg, colSide, colCap, e = 0) {
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, p0 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
      const n0 = [Math.cos(a0), Math.sin(a0), 0], n1 = [Math.cos(a1), Math.sin(a1), 0];
      this.tri([p0[0], p0[1], z1], [p0[0], p0[1], z0], [p1[0], p1[1], z0], colSide, e, n0, n0, n1); this.tri([p0[0], p0[1], z1], [p1[0], p1[1], z0], [p1[0], p1[1], z1], colSide, e, n0, n1, n1);
      if (colCap) { this.tri([cx, cy, z1], [p0[0], p0[1], z1], [p1[0], p1[1], z1], colCap, e); this.tri([cx, cy, z0], [p1[0], p1[1], z0], [p0[0], p0[1], z0], colCap, e); }
    }
  }
  cone(cx, cy, cz, r, h, seg, col, e = 0) { for (let i = 0; i < seg; i++) { const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2; this.tri([cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r], [cx, cy + h, cz], [cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r], col, e); } }
}

/* ---------------- GL core ---------------- */
let gl, cv, P = {}, meshes = {}, tex = {}, W = 1, Hh = 1, dpr = 1, quality = 'high';
const VS_MESH = `attribute vec3 p;attribute vec3 n;attribute vec4 c;uniform mat4 M,VP;varying vec3 vN,vW;varying vec4 vC;
void main(){vec4 w=M*vec4(p,1.);vW=w.xyz;vN=(M*vec4(n,0.)).xyz;vC=c;gl_Position=VP*w;}`;
const FS_MESH = `precision mediump float;uniform vec3 L,eye,fogC,tint;uniform vec2 fog;uniform float alpha,tintA,emit;varying vec3 vN,vW;varying vec4 vC;
void main(){vec3 N=normalize(vN);vec3 V=normalize(eye-vW);if(dot(N,V)<0.)N=-N;float em=max(vC.a,0.);float g=max(-vC.a,0.);float mt=step(1.,g);g=g-mt;
float d=max(dot(N,L),0.);vec3 Hh=normalize(L+V);float sp=pow(max(dot(N,Hh),0.),56.+g*260.)*(.6+g*1.6);
float hemi=.5+.5*N.y;vec3 base=mix(vC.rgb,tint,tintA);vec3 amb=mix(vec3(.10,.10,.15),vec3(.38,.42,.55),hemi);
vec3 col=base*(amb+d*vec3(1.,.96,.9)*.95)*(1.-mt*.75)+sp*mix(vec3(1.,.98,.95),base,mt*.6);float rim=pow(1.-max(dot(N,V),0.),3.)*.3;col+=rim*vec3(.35,.45,.9)*(1.-g);
if(g+mt>0.){vec3 R=reflect(-V,N);float ry=R.y;vec3 env=mix(vec3(.025,.035,.03),vec3(.07,.10,.2),smoothstep(-.25,.5,ry));
env+=vec3(1.,.97,.9)*smoothstep(.10,.17,ry)*smoothstep(.36,.22,ry)*1.1+vec3(.5,.6,.9)*pow(max(ry,0.),6.)*.5+vec3(1.)*pow(max(dot(R,L),0.),30.)*1.4;
float fr=.05+.95*pow(1.-max(dot(N,V),0.),5.);col=mix(col+env*fr*g*1.3,col*.35+env*(base*1.5+.15)*(.55+g*.6),mt);}
col=mix(col,base*1.75,clamp(em+emit,0.,1.));float f=clamp((length(eye-vW)-fog.x)/(fog.y-fog.x),0.,1.);col=mix(col,fogC,f);gl_FragColor=vec4(col,alpha);}`;
const VS_FX = `attribute vec3 p;attribute vec2 uv;attribute vec4 c;attribute float k;uniform mat4 VP;varying vec2 vU;varying vec4 vC;varying float vK;void main(){vU=uv;vC=c;vK=k;gl_Position=VP*vec4(p,1.);}`;
const FS_FX = `precision mediump float;varying vec2 vU;varying vec4 vC;varying float vK;
void main(){float a=vC.a;vec2 q=vU*2.-1.;if(vK<.5){float d=length(q);a*=pow(clamp(1.-d,0.,1.),1.6);}else if(vK<1.5){a*=clamp(1.-abs(q.y),0.,1.)*clamp(vU.x*4.,0.,1.);}
else if(vK<2.5){float d=length(q);a*=smoothstep(.12,0.,abs(d-.82))*step(d,1.);}else if(vK<3.5){float d=length(q);a*=smoothstep(1.,.85,d);}if(a<.003)discard;gl_FragColor=vec4(vC.rgb,a);}`;
const VS_TEX = `attribute vec3 p;attribute vec2 uv;uniform mat4 VP;varying vec2 vU;void main(){vU=uv;gl_Position=VP*vec4(p,1.);}`;
const FS_TEX = `precision mediump float;uniform sampler2D T;uniform float op;varying vec2 vU;void main(){vec4 t=texture2D(T,vU);gl_FragColor=vec4(t.rgb,t.a*op);}`;
function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function prog(vs, fs, attrs, unis) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; unis.forEach(n => u[n] = gl.getUniformLocation(p, n)); return { p, u }; }
function upload(mb) { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.v), gl.STATIC_DRAW); return { b, n: mb.v.length / 10 }; }
function init(canvas, opts = {}) {
  cv = canvas; quality = opts.quality || 'high';
  const attr = { antialias: quality !== 'low', alpha: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve };
  gl = cv.getContext('webgl', attr) || cv.getContext('experimental-webgl', attr); if (!gl) return false;
  P.mesh = prog(VS_MESH, FS_MESH, ['p', 'n', 'c'], ['M', 'VP', 'L', 'eye', 'fogC', 'fog', 'alpha', 'tint', 'tintA', 'emit']);
  P.fx = prog(VS_FX, FS_FX, ['p', 'uv', 'c', 'k'], ['VP']);
  P.tex = prog(VS_TEX, FS_TEX, ['p', 'uv'], ['VP', 'T', 'op']);
  FX.add.buf = gl.createBuffer(); FX.alpha.buf = gl.createBuffer(); TQ.buf = gl.createBuffer();
  gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
  meshes.toppers = {}; buildStatic(); resize();
  cv.addEventListener('webglcontextlost', e => e.preventDefault(), false);
  return true;
}
function setQuality(q) { quality = q; resize(); }
function resize() {
  const maxD = quality === 'low' ? 0.7 : quality === 'medium' ? 1 : Math.min(2, window.devicePixelRatio || 1);
  dpr = Math.min(window.devicePixelRatio || 1, maxD);
  W = Math.max(1, Math.round(cv.clientWidth * dpr)); Hh = Math.max(1, Math.round(cv.clientHeight * dpr));
  if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
}
function loadTex(name, url) {
  const t = gl.createTexture(), img = new Image();
  gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  img.onload = () => { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); tex[name].ok = true; };
  img.src = url; tex[name] = { t, ok: false };
}

/* ---------------- arena ---------------- */
const BLUE = hex('#2f7dff'), ORANGE = hex('#ff7a1a');
function rrPerim(hx, hz, r, step) { // rounded rect perimeter samples: [x,z,nx,nz] with outward normal
  const pts = [], seg = (x0, z0, x1, z1, nx, nz) => { const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(l / step)); for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n, nx, nz]); };
  const arc = (cx, cz, a0) => { const n = Math.max(2, Math.ceil(r * Math.PI / 2 / step)); for (let i = 0; i < n; i++) { const a = a0 + Math.PI / 2 * i / n; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r, Math.cos(a), Math.sin(a)]); } };
  seg(hx, -hz + r, hx, hz - r, 1, 0); arc(hx - r, hz - r, 0); seg(hx - r, hz, -hx + r, hz, 0, 1); arc(-hx + r, hz - r, Math.PI / 2);
  seg(-hx, hz - r, -hx, -hz + r, -1, 0); arc(-hx + r, -hz + r, Math.PI); seg(-hx + r, -hz, hx - r, -hz, 0, -1); arc(hx - r, -hz + r, Math.PI * 1.5);
  return pts;
}
function teamTint(x) { const t = Math.max(-1, Math.min(1, x / LX)); return t < 0 ? lerp3([0.5, 0.55, 0.7], BLUE, -t) : lerp3([0.5, 0.55, 0.7], ORANGE, t); }
function buildStatic() {
  const step = quality === 'low' ? 320 : 200;
  // ---- floor (turf grid)
  const F = new MB(), cell = 256, inFloor = (x, z) => NL.sdf(x, 1, z) < -1 && Math.abs(x) < LX;
  for (let x = -LX; x < LX; x += cell) for (let z = -LZ; z < LZ; z += cell) {
    const cx = x + cell / 2, cz = z + cell / 2; if (!(NL.sdf(cx, 2, cz) < 60)) continue;
    const stripe = Math.floor((x + LX) / 512) % 2, t = cx / LX;
    let col = stripe ? [0.12, 0.27, 0.14] : [0.1, 0.23, 0.12];
    col = lerp3(col, t < 0 ? BLUE : ORANGE, Math.abs(t) * 0.12);
    F.quad([x, 0, z], [x, 0, z + cell], [x + cell, 0, z + cell], [x + cell, 0, z], col, 0, [0, 1, 0]);
  }
  // goal floors
  for (const sg of [-1, 1]) { const x0 = sg * (LX - RE - 20), x1 = sg * (LX + GD); F.quad([x0, 0.3, -GW], [x0, 0.3, GW], [x1, 0.3, GW], [x1, 0.3, -GW], lerp3([0.08, 0.1, 0.16], sg < 0 ? BLUE : ORANGE, 0.25), 0, [0, 1, 0]); }
  // field lines
  const line = (x0, z0, x1, z1, w, col, e = 0.75) => { const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2; F.quad([x0 - nx, 1.5, z0 - nz], [x0 + nx, 1.5, z0 + nz], [x1 + nx, 1.5, z1 + nz], [x1 - nx, 1.5, z1 - nz], col, e, [0, 1, 0]); };
  const WHITE = [0.92, 0.95, 1];
  line(0, -LZ + RE, 0, LZ - RE, 22, WHITE);
  for (let i = 0; i < 64; i++) { const a0 = i / 64 * Math.PI * 2, a1 = (i + 1) / 64 * Math.PI * 2; line(Math.cos(a0) * 900, Math.sin(a0) * 900, Math.cos(a1) * 900, Math.sin(a1) * 900, 20, WHITE); }
  for (const sg of [-1, 1]) {
    const col = sg < 0 ? BLUE : ORANGE, gx = sg * (LX - RE);
    line(gx, -GW - 600, gx - sg * 1100, -GW - 600, 18, WHITE, 0.55); line(gx, GW + 600, gx - sg * 1100, GW + 600, 18, WHITE, 0.55); line(gx - sg * 1100, -GW - 600, gx - sg * 1100, GW + 600, 18, WHITE, 0.55);
    line(gx, -GW, gx, GW, 26, col, 1);
  }
  meshes.floor = upload(F);
  // ---- walls (transparent) + fillets
  const Wm = new MB(), O = new MB(), perim = rrPerim(LX, LZ, RC, step);
  const prof = []; const fs = 6;
  for (let i = 0; i <= fs; i++) { const a = i / fs * Math.PI / 2; prof.push([RE - RE * Math.sin(a), RE - RE * Math.cos(a), 'f']); }
  const wallN = 6; for (let i = 1; i <= wallN; i++) prof.push([0, RE + (H - 2 * RE) * i / wallN, 'w']);
  for (let i = 1; i <= fs; i++) { const a = i / fs * Math.PI / 2; prof.push([RE - RE * Math.cos(a), H - RE + RE * Math.sin(a), 'c']); }
  const P3 = (pt, h, y) => [pt[0] - pt[2] * h, y, pt[1] - pt[3] * h];
  const inGoal = (x, y, z) => Math.abs(x) > LX - RE - 30 && Math.abs(z) < GW && y < GH;
  for (let i = 0; i < perim.length; i++) {
    const a = perim[i], b = perim[(i + 1) % perim.length];
    for (let k = 0; k < prof.length - 1; k++) {
      const p0 = prof[k], p1 = prof[k + 1];
      const A = P3(a, p0[0], p0[1]), B = P3(b, p0[0], p0[1]), Cc = P3(b, p1[0], p1[1]), D = P3(a, p1[0], p1[1]);
      const mx = (A[0] + Cc[0]) / 2, my = (A[1] + Cc[1]) / 2, mz = (A[2] + Cc[2]) / 2;
      if (inGoal(mx, my, mz)) continue;
      const n = NL.nrm(mx, my, mz);
      const tint = teamTint(mx);
      if (p0[2] === 'f' && p1[1] <= RE + 1) O.quad(A, B, Cc, D, lerp3([0.1, 0.22, 0.12], tint, 0.15), 0, n);
      else Wm.quad(A, B, Cc, D, lerp3([0.25, 0.3, 0.45], tint, 0.5), 0, n);
    }
  }
  // ceiling
  const ceilP = rrPerim(LX - RE, LZ - RE, RC - RE, step * 2).map(p => [p[0], p[1]]), ct = earcut(ceilP);
  for (let i = 0; i < ct.length; i += 3) { const A = ceilP[ct[i]], B = ceilP[ct[i + 1]], Cc = ceilP[ct[i + 2]]; Wm.tri([A[0], H, A[1]], [B[0], H, B[1]], [Cc[0], H, Cc[1]], [0.2, 0.24, 0.36], 0, [0, -1, 0], [0, -1, 0], [0, -1, 0]); }
  // neon edge strips
  const strip = (y, w, inten) => { for (let i = 0; i < perim.length; i++) { const a = perim[i], b = perim[(i + 1) % perim.length]; const A = P3(a, 0, y), B = P3(b, 0, y); if (inGoal((A[0] + B[0]) / 2, y, (A[2] + B[2]) / 2)) continue; const col = teamTint((A[0] + B[0]) / 2); const c2 = Math.abs(A[0]) < 300 ? [0.85, 0.9, 1] : lerp3(col, [1, 1, 1], 0.1); O.quad([A[0], y, A[2]], [B[0], y, B[2]], [B[0], y + w, B[2]], [A[0], y + w, A[2]], c2, inten); } };
  strip(RE + 4, 14, 1); strip(H - RE - 20, 10, 0.9); strip(1100, 5, 0.35);
  for (let i = 0; i < perim.length; i += 3) { const a = perim[i], b = perim[(i + 1) % perim.length]; const A = P3(a, 0, RE + 18), B = P3(a, 0, H - RE - 20); if (inGoal(A[0], 300, A[2]) || (Math.abs(A[0]) > LX - 20 && Math.abs(A[2]) < GW + 100)) continue; const col = lerp3(teamTint(A[0]), [1, 1, 1], 0.1); const t = [b[0] - a[0], b[1] - a[1]], tl = Math.hypot(t[0], t[1]) || 1, w = 4; O.quad([A[0] - t[0] / tl * w, A[1], A[2] - t[1] / tl * w], [A[0] + t[0] / tl * w, A[1], A[2] + t[1] / tl * w], [B[0] + t[0] / tl * w, B[1], B[2] + t[1] / tl * w], [B[0] - t[0] / tl * w, B[1], B[2] - t[1] / tl * w], col, 0.4); }
  // goals
  for (const sg of [-1, 1]) {
    const col = sg < 0 ? BLUE : ORANGE, x0 = sg * LX, xb = sg * (LX + GD), dark = lerp3([0.05, 0.06, 0.1], col, 0.25);
    O.quad([xb, 0, -GW], [xb, 0, GW], [xb, GH, GW], [xb, GH, -GW], dark, 0, [-sg, 0, 0]);
    O.quad([x0, 0, -GW], [xb, 0, -GW], [xb, GH, -GW], [x0, GH, -GW], dark, 0, [0, 0, 1]);
    O.quad([x0, 0, GW], [xb, 0, GW], [xb, GH, GW], [x0, GH, GW], dark, 0, [0, 0, -1]);
    O.quad([x0, GH, -GW], [xb, GH, -GW], [xb, GH, GW], [x0, GH, GW], dark, 0, [0, -1, 0]);
    // frame
    O.box(x0, GH / 2, -GW, 40, GH, 40, col, 1); O.box(x0, GH / 2, GW, 40, GH, 40, col, 1); O.box(x0, GH + 10, 0, 40, 40, 2 * GW + 40, col, 1);
    // net
    for (let y = 70; y < GH; y += 70) O.box(xb - sg * 3, y, 0, 4, 4, 2 * GW, col, 0.45);
    for (let z = -GW + 80; z < GW; z += 80) O.box(xb - sg * 3, GH / 2, z, 4, GH, 4, col, 0.45);
    for (let x = 80; x < GD; x += 80) O.box(x0 + sg * x, GH - 3, 0, 4, 4, 2 * GW, col, 0.35);
    // wall above goal (opaque frame band)
    O.box(x0 + sg * 6, GH + 120, 0, 12, 200, 2 * GW + 400, lerp3([0.1, 0.12, 0.2], col, 0.4), 0.15);
  }
  // pads bases
  for (const pd of NL.PADS) { const r = pd.big ? 150 : 95; for (let i = 0; i < 20; i++) { const a0 = i / 20 * Math.PI * 2, a1 = (i + 1) / 20 * Math.PI * 2; O.tri([pd.x, 3, pd.z], [pd.x + Math.cos(a0) * r, 3, pd.z + Math.sin(a0) * r], [pd.x + Math.cos(a1) * r, 3, pd.z + Math.sin(a1) * r], [0.16, 0.17, 0.2], 0, [0, 1, 0], [0, 1, 0], [0, 1, 0]); } }
  meshes.walls = upload(Wm); meshes.arenaO = upload(O);
  buildStadium();
  meshes.ball = buildBall(); meshes.wheels = {}; meshes.cars = {}; meshes.toppers = {};
  meshes.orb = buildOrb();
}
function buildStadium() {
  const S = new MB(); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tiers = quality === 'low' ? 4 : 7, gap = quality === 'low' ? 140 : 90;
  S.quad([-30000, -6, -30000], [30000, -6, -30000], [30000, -6, 30000], [-30000, -6, 30000], [0.04, 0.045, 0.07], 0, [0, 1, 0]);
  for (let t = 0; t < tiers; t++) {
    const off = 700 + t * 420, y0 = 250 + t * 360, per = rrPerim(LX + off, LZ + off, RC + off, 400);
    for (let i = 0; i < per.length; i++) {
      const a = per[i], b = per[(i + 1) % per.length];
      S.quad([a[0], y0 - 360, a[1]], [b[0], y0 - 360, b[1]], [b[0], y0, b[1]], [a[0], y0, a[1]], [0.07, 0.075, 0.11], 0, [-a[2], 0, -a[3]]);
      const a2 = [a[0] + a[2] * 420, a[1] + a[3] * 420], b2 = [b[0] + b[2] * 420, b[1] + b[3] * 420];
      S.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b2[0], y0, b2[1]], [a2[0], y0, a2[1]], [0.1, 0.105, 0.15], 0, [0, 1, 0]);
    }
    const per2 = rrPerim(LX + off + 200, LZ + off + 200, RC + off + 200, gap);
    for (const q of per2) {
      const team = q[0] < 0 ? BLUE : ORANGE, r = rnd(); const col = (r < 0.5 ? lerp3(team, [1, 1, 1], rnd() * 0.3) : [0.3 + rnd() * 0.5, 0.25 + rnd() * 0.4, 0.3 + rnd() * 0.4]).map(v => v * 0.8);
      const x = q[0], z = q[1], h = 90 + rnd() * 40, tx = -q[3], tz = q[2], w = 28;
      S.quad([x - tx * w, y0, z - tz * w], [x + tx * w, y0, z + tz * w], [x + tx * w, y0 + h, z + tz * w], [x - tx * w, y0 + h, z - tz * w], col, r < 0.06 ? 0.6 : 0, [-q[2], 0, -q[3]]);
      S.box(x, y0 + h + 22, z, 34, 34, 34, col.map(v => v * 0.7));
    }
  }
  // light towers & screens
  for (const [x, z] of [[-LX - 2400, -LZ - 2400], [LX + 2400, -LZ - 2400], [-LX - 2400, LZ + 2400], [LX + 2400, LZ + 2400]]) {
    S.box(x, 2600, z, 120, 5200, 120, [0.08, 0.09, 0.13]); S.box(x, 5200, z, 900, 300, 120, [0.15, 0.16, 0.22]);
    for (let i = 0; i < 4; i++) S.box(x - 330 + i * 220, 5200, z + (z < 0 ? 70 : -70), 180, 200, 10, [1, 0.97, 0.88], 1);
  }
  for (const sg of [-1, 1]) { S.box(sg * (LX + 2600), 3400, 0, 120, 1500, 3000, [0.05, 0.055, 0.09]); }
  meshes.stadium = upload(S);
}
function buildBall() {
  const t = (1 + Math.sqrt(5)) / 2; let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  const ico = V.slice(); let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  for (let s = 0; s < 2; s++) { const cache = {}, F2 = []; const mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] != null) return cache[k]; V.push(norm([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2])); return cache[k] = V.length - 1; }; for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = F2; }
  const M = new MB();
  for (const [a, b, c] of F) { const cen = norm([(V[a][0] + V[b][0] + V[c][0]) / 3, (V[a][1] + V[b][1] + V[c][1]) / 3, (V[a][2] + V[b][2] + V[c][2]) / 3]); let best = -1; for (const v of ico) best = Math.max(best, v[0] * cen[0] + v[1] * cen[1] + v[2] * cen[2]); const col = best > 0.94 ? [0.12, 0.13, 0.17] : best > 0.9 ? [0.55, 0.6, 0.7] : [0.92, 0.93, 0.96]; M.tri(V[a], V[b], V[c], col, best > 0.9 && best <= 0.94 ? 0.3 : 0, V[a], V[b], V[c]); }
  return upload(M);
}
function buildOrb() { const M = new MB(); M.cyl(0, 0, -1, 1, 1, 12, [1, 0.8, 0.2], [1, 0.85, 0.3], 1); return upload(M); }

/* ---------------- cars ---------------- */
const BODIES = {
  b_falcon: { p: [[-46, -6], [44, -6], [49, 0], [47, 7], [30, 11], [12, 13], [1, 25], [-18, 27], [-35, 19], [-47, 14]], win: [[7, 14], [0, 23], [-17, 25], [-31, 18]], sp: [-44, 20, 12] },
  b_titan: { p: [[-50, -6], [47, -6], [51, 1], [46, 9], [16, 12], [3, 21], [-24, 23], [-42, 16], [-50, 11]], win: [[12, 13], [2, 20], [-22, 21], [-37, 15]], sp: [-46, 17, 14] },
  b_breaker: { p: [[-47, -6], [49, -6], [54, -2], [24, 9], [2, 20], [-26, 22], [-47, 17]], win: [[16, 11], [1, 19], [-22, 20]], sp: [-44, 22, 10] },
  b_rhino: { p: [[-45, -7], [45, -7], [47, 12], [24, 15], [17, 30], [-30, 31], [-45, 23]], win: [[15, 17], [10, 28], [-26, 29], [-26, 18]], sp: null },
  b_comet: { p: [[-48, -6], [46, -6], [52, -1], [42, 7], [18, 10], [4, 22], [-12, 24], [-40, 13], [-48, 9]], win: [[14, 12], [3, 21], [-11, 22], [-30, 14]], sp: [-46, 15, 16] },
  b_phantom: { p: [[-49, -7], [50, -7], [55, -3], [40, 5], [10, 8], [-2, 17], [-30, 18], [-44, 11], [-49, 8]], win: [[8, 9], [-2, 15], [-28, 16], [-38, 11]], sp: [-48, 14, 18] },
  b_mamba: { p: [[-48, -6], [48, -6], [53, -1], [44, 6], [20, 9], [6, 19], [-20, 21], [-42, 14], [-48, 10]], win: [[18, 10], [5, 18], [-19, 19], [-34, 13]], sp: [-46, 16, 14] },
  b_zephyr: { p: [[-47, -6], [50, -6], [55, -3], [30, 6], [8, 18], [-24, 21], [-47, 16]], win: [[25, 7], [7, 17], [-22, 19], [-30, 15]], sp: [-45, 20, 12] },
  b_bulldog: { p: [[-46, -7], [46, -7], [48, 10], [30, 13], [20, 26], [-34, 27], [-46, 20]], win: [[18, 14], [14, 24], [-30, 25], [-30, 15]], sp: null },
  b_stinger: { p: [[-50, -6], [50, -6], [56, -2], [36, 4], [10, 8], [0, 16], [-18, 17], [-40, 8], [-50, 6]], win: [[8, 9], [-1, 15], [-16, 16], [-28, 9]], sp: [-50, 26, 10] },
  b_typhoon: { p: [[-50, -6], [48, -6], [50, 6], [30, 10], [14, 12], [2, 23], [-26, 24], [-44, 15], [-50, 12]], win: [[12, 12], [2, 21], [-24, 22], [-38, 14]], sp: [-48, 18, 10] },
  b_wraith: { p: [[-48, -4], [50, -4], [56, 0], [38, 10], [12, 15], [-4, 22], [-36, 20], [-48, 12]], win: [[10, 15], [-4, 20], [-30, 19], [-38, 13]], sp: [-46, 24, 16] }
};
const SC = 1.25, YO = -4, HW = 36;
const sp2 = pts => pts.map(p => [p[0] * SC, p[1] * SC + YO]);
function buildCar(look, team) {
  const D = window.NLD, I = D.ITEM, b = BODIES[look.body] || BODIES.b_falcon;
  const teamC = hex(team === 0 ? '#2f7dff' : '#ff7a1a'), teamD = teamC.map(v => v * 0.5);
  const pi = I[look.paint] || I.p_white, paint = hex(pi.col), pe = pi.id === 'p_mdr' || pi.id === 'p_gold' ? 0.25 : 0;
  const M = new MB(), P = sp2(b.p);
  M.extrude(P, -HW, HW, teamC, teamC.map(v => v * 0.9));
  const xs = P.map(p => p[0]), minX = Math.min(...xs), maxX = Math.max(...xs), roofY = Math.max(...P.map(p => p[1]));
  M.extrude([[minX + 6, 4], [maxX - 10, 4], [maxX - 12, 9], [minX + 6, 9]], -HW - 0.8, HW + 0.8, paint, paint, pe);
  M.extrude(sp2(b.win), -HW - 1.2, HW + 1.2, [0.04, 0.06, 0.09], [0.05, 0.08, 0.13]);
  M.box(-8, roofY - 0.5, 0, 34, 3, 28, paint, pe);
  M.box(0, -9 + YO, 0, (maxX - minX) - 8, 5, HW * 2 - 2, [0.05, 0.05, 0.07]);
  M.box(maxX - 3, -4, 0, 8, 8, HW * 2 + 1, teamD);
  if (b.sp) { const s = b.sp; M.box(s[0] * SC + 4, s[1] * SC + YO + 4, 0, s[2] * SC, 4, HW * 2 + 6, paint, pe); M.box(s[0] * SC + 8, s[1] * SC + YO - 3, 16, 4, 10, 4, [0.1, 0.1, 0.12]); M.box(s[0] * SC + 8, s[1] * SC + YO - 3, -16, 4, 10, 4, [0.1, 0.1, 0.12]); }
  M.box(maxX - 1, 3, 20, 4, 5, 10, [1, 0.97, 0.85], 1); M.box(maxX - 1, 3, -20, 4, 5, 10, [1, 0.97, 0.85], 1);
  M.box(minX + 0.5, 6, 20, 3, 5, 11, [1, 0.12, 0.15], 1); M.box(minX + 0.5, 6, -20, 3, 5, 11, [1, 0.12, 0.15], 1);
  M.cyl(minX - 1, -2, -13, -5, 4, 10, [0.22, 0.22, 0.24], [0.02, 0.02, 0.02]); M.cyl(minX - 1, -2, 5, 13, 4, 10, [0.22, 0.22, 0.24], [0.02, 0.02, 0.02]);
  for (const wx of [-C.WX, C.WX]) M.box(wx, -4, 0, 38, 12, HW * 2 + 1.5, [0.04, 0.04, 0.05]);
  // topper
  const tp = look.topper && look.topper !== 'h_none' ? look.topper : null, ty = roofY + 1.5;
  if (tp === 'h_crown') { const g = [1, 0.8, 0.2]; M.cyl(-8, ty + 5, -9, 9, 0, 3, g, g); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; M.cone(-8 + Math.cos(a) * 9, ty, Math.sin(a) * 9, 4, 14, 5, g, 0.3); } M.box(-8, ty + 3, 0, 22, 6, 22, g, 0.2); }
  else if (tp === 'h_cap') { M.box(-8, ty + 5, 0, 22, 10, 22, [0.9, 0.1, 0.15]); M.box(4, ty + 1, 0, 14, 2, 20, [0.9, 0.1, 0.15]); }
  else if (tp === 'h_cone') { M.cone(-8, ty, 0, 11, 30, 10, [1, 0.45, 0.05]); M.box(-8, ty + 2, 0, 26, 4, 26, [1, 0.45, 0.05]); }
  else if (tp === 'h_halo') { for (let i = 0; i < 16; i++) { const a0 = i / 16 * Math.PI * 2; M.box(-8 + Math.cos(a0) * 14, ty + 22, Math.sin(a0) * 14, 6, 3, 6, [1, 0.95, 0.6], 1); } }
  else if (tp === 'h_horns') { M.cone(-6, ty, 12, 5, 22, 6, [0.92, 0.9, 0.85]); M.cone(-6, ty, -12, 5, 22, 6, [0.92, 0.9, 0.85]); }
  else if (tp === 'h_tophat') { M.box(-8, ty + 2, 0, 30, 3, 30, [0.08, 0.08, 0.1]); M.box(-8, ty + 14, 0, 18, 22, 18, [0.08, 0.08, 0.1]); M.box(-8, ty + 6, 0, 19, 4, 19, [0.8, 0.1, 0.15]); }
  return upload(M);
}
function buildWheel(id) {
  const D = window.NLD, it = D.ITEM[id] || D.ITEM.w_std, rc = hex(it.col), e = it.glow ? 0.9 : 0, M = new MB();
  M.cyl(0, 0, -6, 6, 15, 22, [0.06, 0.06, 0.07], [0.08, 0.08, 0.09]);
  M.cyl(0, 0, 5.6, 6.8, 10, 18, rc, rc, e); M.cyl(0, 0, -6.8, -5.6, 10, 18, rc, rc, e);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; M.box(Math.cos(a) * 6, Math.sin(a) * 6, 7, 2.6, 2.6, 1, rc.map(v => v * 0.55)); M.box(Math.cos(a) * 6, Math.sin(a) * 6, -7, 2.6, 2.6, 1, rc.map(v => v * 0.55)); }
  M.cyl(0, 0, -7.4, 7.4, 3, 8, [0.15, 0.15, 0.17], [0.3, 0.3, 0.33]);
  return upload(M);
}
/* ---------------- Blender models (assets/fl_models.bin) ---------------- */
let MODELS = null, MMETA = {};
function loadModels(ab, meta) {
  try {
    const u8 = new Uint8Array(ab, 0, 4); if (String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) !== 'FLM1') return false;
    const dv = new DataView(ab), jl = dv.getUint32(4, true), head = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 8, jl))), base = 8 + jl, M = {};
    for (const name in head.meshes) { const m = head.meshes[name]; M[name] = { P: new Int16Array(ab, base + m.po, m.v * 3), N: new Int8Array(ab, base + m.no, m.v * 4), I: new Uint16Array(ab, base + m.io, m.i), q: m.q, prims: m.prims }; }
    MODELS = M; MMETA = meta || {}; if (gl) { meshes.cars = {}; meshes.wheels = {}; meshes.toppers = {}; meshes.ballM = null; }
    return true;
  } catch (e) { console.warn('models', e); return false; }
}
function uploadArr(arr) { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); return { b, n: arr.length / 10 }; }
function modelArr(names, colorOf) {
  let tot = 0; for (const n of names) if (MODELS[n]) tot += MODELS[n].I.length;
  const out = new Float32Array(tot * 10); let o = 0;
  for (const n of names) {
    const m = MODELS[n]; if (!m) continue; const P = m.P, N = m.N, I = m.I, q = m.q;
    for (const [mat, first, cnt] of m.prims) {
      const c = colorOf(mat);
      for (let k = first, e = first + cnt; k < e; k++) { const vi = I[k], p3 = vi * 3, n4 = vi * 4; out[o++] = P[p3] * q; out[o++] = P[p3 + 1] * q; out[o++] = P[p3 + 2] * q; out[o++] = N[n4] / 127; out[o++] = N[n4 + 1] / 127; out[o++] = N[n4 + 2] / 127; out[o++] = c[0]; out[o++] = c[1]; out[o++] = c[2]; out[o++] = c[3]; }
    }
  }
  return out;
}
// c[3]: >=0 emissive, -1..0 glossy dielectric, -2..-1 metal (gloss = -c-1)
const TEAM_BODY = [hex('#1d5cf0'), hex('#f3640e')], TEAM_GLOW = [hex('#4fa0ff'), hex('#ffa040')];
const FIXED = { DARK: [0.035, 0.04, 0.05, -0.12], CARBON: [0.07, 0.075, 0.085, -0.5], GLASS: [0.025, 0.04, 0.065, -0.95], CHROME: [0.82, 0.85, 0.9, -2], LIGHT_F: [1, 0.97, 0.88, 1], LIGHT_R: [1, 0.08, 0.1, 1], TIRE: [0.045, 0.045, 0.05, -0.04], HUB: [0.2, 0.21, 0.23, -1.45], BRAKE: [0.85, 0.12, 0.1, -0.4], BALL_A: [0.74, 0.76, 0.81, -0.32], BALL_B: [0.13, 0.14, 0.18, -0.55], SEAM: [0.45, 0.8, 1, 0.75] };
const RIMSTYLE = { w_std: 'rim_r5', w_black: 'rim_r10', w_red: 'rim_ry', w_neon: 'rim_turbine', w_gold: 'rim_ry', w_plasma: 'rim_turbine', w_chrome: 'rim_r10', w_turbine: 'rim_turbine' };
function paintCol(pi) { const c = hex(pi.col); if (pi.id === 'p_chrome' || pi.id === 'p_gold') return [c[0], c[1], c[2], -1.9]; if (pi.id === 'p_mdr') return [c[0], c[1], c[2], 0.35]; return [c[0], c[1], c[2], -0.7]; }
function buildCarModel(look, team) {
  const D = window.NLD, I = D.ITEM, key = 'car_' + String(look.body || 'b_falcon').slice(2);
  if (!MODELS[key]) return null;
  const pi = I[look.paint] || I.p_white, body = TEAM_BODY[team ? 1 : 0], acc = paintCol(pi), glow = TEAM_GLOW[team ? 1 : 0];
  return uploadArr(modelArr([key], mat => mat === 'PAINT' ? [body[0], body[1], body[2], -0.72] : mat === 'ACCENT' ? acc : mat === 'GLOW' ? [glow[0], glow[1], glow[2], 1] : FIXED[mat] || [0.5, 0.5, 0.5, 0]));
}
function buildWheelModel(id) {
  const D = window.NLD, it = D.ITEM[id] || D.ITEM.w_std, rc = hex(it.col), rim = RIMSTYLE[id] || (it.style ? 'rim_' + it.style : 'rim_r5');
  if (!MODELS.tire || !MODELS[rim]) return null;
  return uploadArr(modelArr(['tire', rim], mat => mat === 'RIM' ? [rc[0], rc[1], rc[2], it.glow ? 0.85 : -1.85] : FIXED[mat] || [0.5, 0.5, 0.5, 0]));
}
function buildTopper(tp) {
  const M = new MB(), ty = 0, X = 0;
  if (tp === 'h_crown') { const g = [1, 0.8, 0.2]; M.cyl(X, ty + 5, -9, 9, 0, 3, g, g); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; M.cone(X + Math.cos(a) * 9, ty, Math.sin(a) * 9, 4, 14, 5, g, 0.3); } M.box(X, ty + 3, 0, 22, 6, 22, g, 0.2); }
  else if (tp === 'h_cap') { M.box(X, ty + 5, 0, 22, 10, 22, [0.9, 0.1, 0.15]); M.box(X + 12, ty + 1, 0, 14, 2, 20, [0.9, 0.1, 0.15]); }
  else if (tp === 'h_cone') { M.cone(X, ty, 0, 11, 30, 10, [1, 0.45, 0.05]); M.box(X, ty + 2, 0, 26, 4, 26, [1, 0.45, 0.05]); }
  else if (tp === 'h_halo') { for (let i = 0; i < 16; i++) { const a0 = i / 16 * Math.PI * 2; M.box(X + Math.cos(a0) * 14, ty + 22, Math.sin(a0) * 14, 6, 3, 6, [1, 0.95, 0.6], 1); } }
  else if (tp === 'h_horns') { M.cone(X + 2, ty, 12, 5, 22, 6, [0.92, 0.9, 0.85]); M.cone(X + 2, ty, -12, 5, 22, 6, [0.92, 0.9, 0.85]); }
  else if (tp === 'h_tophat') { M.box(X, ty + 2, 0, 30, 3, 30, [0.08, 0.08, 0.1]); M.box(X, ty + 14, 0, 18, 22, 18, [0.08, 0.08, 0.1]); M.box(X, ty + 6, 0, 19, 4, 19, [0.8, 0.1, 0.15]); }
  else return null;
  return upload(M);
}
function ballMesh() {
  if (MODELS && MODELS.ball) { if (!meshes.ballM) meshes.ballM = uploadArr(modelArr(['ball'], mat => FIXED[mat] || [0.8, 0.8, 0.8, 0])); return { m: meshes.ballM, s: 1 }; }
  return { m: meshes.ball, s: C.BALL_R };
}
function carMesh(look, team) {
  const k = [look.body, look.paint, look.topper, team].join('|');
  if (MODELS) {
    if (!meshes.cars[k]) meshes.cars[k] = buildCarModel(look, team) || buildCar(Object.assign({}, look, { topper: 'h_none' }), team);
    if (!meshes.wheels[look.wheel]) meshes.wheels[look.wheel] = buildWheelModel(look.wheel) || buildWheel(look.wheel);
    const tp = look.topper && look.topper !== 'h_none' ? look.topper : null;
    if (tp && meshes.toppers[tp] === undefined) meshes.toppers[tp] = buildTopper(tp);
    const mm = MMETA[String(look.body || '').slice(2)] || { roof: [-10, 22] };
    return { body: meshes.cars[k], wheel: meshes.wheels[look.wheel], topper: tp ? meshes.toppers[tp] : null, roof: mm.roof };
  }
  if (!meshes.cars[k]) meshes.cars[k] = buildCar(look, team);
  if (!meshes.wheels[look.wheel]) meshes.wheels[look.wheel] = buildWheel(look.wheel);
  return { body: meshes.cars[k], wheel: meshes.wheels[look.wheel] };
}
/* ---------------- fx ---------------- */
const FX = { add: { a: new Float32Array(10 * 6 * 5000), n: 0 }, alpha: { a: new Float32Array(10 * 6 * 1500), n: 0 } };
let camR = [1, 0, 0], camU = [0, 1, 0], camF = [0, 0, -1], camE = [0, 0, 0];
function fxQuad(B, cx, cy, cz, ax, ay, az, bx, by, bz, r, g, b, a, k) {
  const A = B.a; if ((B.n + 6) * 10 > A.length) return;
  const Q = [[cx - ax - bx, cy - ay - by, cz - az - bz, 0, 0], [cx + ax - bx, cy + ay - by, cz + az - bz, 1, 0], [cx + ax + bx, cy + ay + by, cz + az + bz, 1, 1], [cx - ax + bx, cy - ay + by, cz - az + bz, 0, 1]];
  for (const i of [0, 1, 2, 0, 2, 3]) { const p = Q[i], o = B.n * 10; A[o] = p[0]; A[o + 1] = p[1]; A[o + 2] = p[2]; A[o + 3] = p[3]; A[o + 4] = p[4]; A[o + 5] = r; A[o + 6] = g; A[o + 7] = b; A[o + 8] = a; A[o + 9] = k; B.n++; }
}
const fx = {
  glow(x, y, z, s, c, a, add = true) { fxQuad(add ? FX.add : FX.alpha, x, y, z, camR[0] * s, camR[1] * s, camR[2] * s, camU[0] * s, camU[1] * s, camU[2] * s, c[0], c[1], c[2], a, 0); },
  disc(x, y, z, s, c, a, add = true) { fxQuad(add ? FX.add : FX.alpha, x, y, z, camR[0] * s, camR[1] * s, camR[2] * s, camU[0] * s, camU[1] * s, camU[2] * s, c[0], c[1], c[2], a, 3); },
  ring(x, y, z, s, c, a) { fxQuad(FX.add, x, y, z, camR[0] * s, camR[1] * s, camR[2] * s, camU[0] * s, camU[1] * s, camU[2] * s, c[0], c[1], c[2], a, 2); },
  floorRing(x, y, z, s, c, a) { fxQuad(FX.add, x, y, z, s, 0, 0, 0, 0, s, c[0], c[1], c[2], a, 2); },
  floorGlow(x, y, z, s, c, a) { fxQuad(FX.add, x, y, z, s, 0, 0, 0, 0, s, c[0], c[1], c[2], a, 0); },
  shadow(x, y, z, sx, sz, a) { fxQuad(FX.alpha, x, y, z, sx, 0, 0, 0, 0, sz, 0, 0, 0, a, 0); },
  beam(x0, y0, z0, x1, y1, z1, w, c, a) {
    const d = [x1 - x0, y1 - y0, z1 - z0], l = Math.hypot(d[0], d[1], d[2]) || 1, mid = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    const tc = norm([camE[0] - mid[0], camE[1] - mid[1], camE[2] - mid[2]]), s = norm(cross(d, tc));
    fxQuad(FX.add, mid[0], mid[1], mid[2], d[0] / 2, d[1] / 2, d[2] / 2, s[0] * w, s[1] * w, s[2] * w, c[0], c[1], c[2], a, 1);
  }
};
function drawFx(B, VPm, additive) {
  if (!B.n) return;
  const p = P.fx; gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.VP, false, VPm);
  gl.bindBuffer(gl.ARRAY_BUFFER, B.buf); gl.bufferData(gl.ARRAY_BUFFER, B.a.subarray(0, B.n * 10), gl.DYNAMIC_DRAW);
  for (let i = 0; i < 4; i++) gl.enableVertexAttribArray(i);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 40, 12); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 20); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 40, 36);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  gl.drawArrays(gl.TRIANGLES, 0, B.n);
  gl.depthMask(true); gl.disable(gl.BLEND); gl.disableVertexAttribArray(3);
}
const TQ = { list: [] };
function texQuad(name, p, ax, ay, op) { TQ.list.push([name, p, ax, ay, op]); }
function drawTex(VPm) {
  if (!TQ.list.length) return;
  const p = P.tex; gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.VP, false, VPm); gl.uniform1i(p.u.T, 0);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  gl.bindBuffer(gl.ARRAY_BUFFER, TQ.buf); gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.disableVertexAttribArray(2);
  for (const [name, c, a, b, op] of TQ.list) {
    const t = tex[name]; if (!t || !t.ok) continue;
    const q = (sa, sb) => [c[0] + a[0] * sa + b[0] * sb, c[1] + a[1] * sa + b[1] * sb, c[2] + a[2] * sa + b[2] * sb];
    const v = [...q(-1, -1), 0, 1, ...q(1, -1), 1, 1, ...q(1, 1), 1, 0, ...q(-1, -1), 0, 1, ...q(1, 1), 1, 0, ...q(-1, 1), 0, 0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t.t); gl.uniform1f(p.u.op, op); gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  gl.depthMask(true); gl.disable(gl.BLEND);
}

/* ---------------- frame ---------------- */
let VP = null, viewRect = [0, 0, 1, 1];
function beginMesh(VPm, e) {
  const p = P.mesh; gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.VP, false, VPm);
  gl.uniform3fv(p.u.L, norm([0.3, 0.9, 0.4])); gl.uniform3fv(p.u.eye, e); gl.uniform3fv(p.u.fogC, [0.035, 0.04, 0.08]); gl.uniform2fv(p.u.fog, [9000, 30000]);
  gl.uniform1f(p.u.alpha, 1); gl.uniform1f(p.u.tintA, 0); gl.uniform3fv(p.u.tint, [1, 1, 1]); gl.uniform1f(p.u.emit, 0);
  gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2); gl.disableVertexAttribArray(3);
}
const I4 = trs(0, 0, 0);
function draw(m, M = I4, opt) {
  if (!m) return; const p = P.mesh;
  gl.uniformMatrix4fv(p.u.M, false, M);
  if (opt) { if (opt.tintA != null) gl.uniform1f(p.u.tintA, opt.tintA); if (opt.tint) gl.uniform3fv(p.u.tint, opt.tint); if (opt.emit != null) gl.uniform1f(p.u.emit, opt.emit); if (opt.alpha != null) gl.uniform1f(p.u.alpha, opt.alpha); }
  gl.bindBuffer(gl.ARRAY_BUFFER, m.b);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
  gl.drawArrays(gl.TRIANGLES, 0, m.n);
  if (opt) { gl.uniform1f(p.u.tintA, 0); gl.uniform1f(p.u.emit, 0); gl.uniform1f(p.u.alpha, 1); }
}
/**
 * S = { views:[{rect:[x,y,w,h] (0..1), eye, target, fov(vertical rad)}], cars:[{p,f,u,look,team,wr,dead,flash}], ball:{p,f,u,hide,glow}, pads:[t], fxCb(fx, viewIndex), time }
 */
function render(S) {
  if (!gl) return; resize();
  gl.viewport(0, 0, W, Hh); gl.disable(gl.SCISSOR_TEST); gl.clearColor(0.02, 0.025, 0.05, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.SCISSOR_TEST);
  S.views.forEach((v, vi) => {
    const r = v.rect, x = Math.round(r[0] * W), y = Math.round((1 - r[1] - r[3]) * Hh), w = Math.max(1, Math.round(r[2] * W)), h = Math.max(1, Math.round(r[3] * Hh));
    gl.viewport(x, y, w, h); gl.scissor(x, y, w, h); gl.clear(gl.DEPTH_BUFFER_BIT);
    const sh = v.shake || 0, e = [v.eye[0] + (Math.random() - 0.5) * sh, v.eye[1] + (Math.random() - 0.5) * sh, v.eye[2] + (Math.random() - 0.5) * sh];
    const view = lookAt(e, v.target, [0, 1, 0]), proj = persp(v.fov, w / h, 10, 60000), VPm = mul(proj, view);
    camR = [view[0], view[4], view[8]]; camU = [view[1], view[5], view[9]]; camE = e;
    if (vi === 0) { VP = VPm; viewRect = r; }
    beginMesh(VPm, e);
    draw(meshes.stadium); draw(meshes.floor); draw(meshes.arenaO);
    for (const c of S.cars) {
      if (c.dead) continue;
      const m = carMesh(c.look, c.team), M = basisM(c.p, c.f, c.u, c.scale || 1);
      draw(m.body, M, c.flash ? { tintA: c.flash, tint: [1, 1, 1] } : null);
      for (const [wx, wz] of [[-C.WX, HW - 8], [C.WX, HW - 8], [-C.WX, -HW + 8], [C.WX, -HW + 8]]) draw(m.wheel, mul(M, trs(wx, -17, wz, -(c.wr || 0))));
      if (m.topper) draw(m.topper, mul(M, trs(m.roof[0], m.roof[1] + 0.5, 0)));
    }
    if (S.ball && !S.ball.hide) { const bm = ballMesh(); draw(bm.m, basisM(S.ball.p, S.ball.f, S.ball.u, bm.s), S.ball.glow ? { emit: S.ball.glow } : null); }
    if (S.extra) S.extra(draw, basisM, trs);
    // transparent walls
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    draw(meshes.walls, I4, { alpha: S.wallAlpha || 0.3 });
    gl.depthMask(true); gl.disable(gl.BLEND);
    beginMesh(VPm, e);
    texQuad('logo', [0, 3, 0], [700, 0, 0], [0, 0, 350], 0.35);
    for (const sg of [-1, 1]) texQuad('logo', [sg * (LX + 2590), 3400, 0], [0, 0, sg * -1300], [0, 650, 0], 0.95);
    drawTex(VPm);
    // pads
    if (S.pads) NL.PADS.forEach((pd, i) => { const on = !(S.pads[i] > 0), col = [1, 0.75, 0.15]; if (pd.big) { if (on) { fx.glow(pd.x, 110, pd.z, 120, col, 0.9); fx.glow(pd.x, 110, pd.z, 260, col, 0.25); } fx.floorRing(pd.x, 5, pd.z, 150, col, on ? 0.9 : 0.25); } else { fx.floorGlow(pd.x, 5, pd.z, 90, col, on ? 0.7 : 0.08); fx.floorRing(pd.x, 5, pd.z, 95, col, on ? 0.6 : 0.15); } });
    if (S.fxCb) S.fxCb(fx, vi, v);
    drawFx(FX.alpha, VPm, false); drawFx(FX.add, VPm, true);
    FX.alpha.n = 0; FX.add.n = 0; TQ.list.length = 0;
  });
  gl.disable(gl.SCISSOR_TEST);
}
function project(x, y, z) {
  const v = VP; if (!v) return null; const X = v[0] * x + v[4] * y + v[8] * z + v[12], Y = v[1] * x + v[5] * y + v[9] * z + v[13], Wc = v[3] * x + v[7] * y + v[11] * z + v[15];
  if (Wc <= 0) return null; const r = viewRect;
  return [(r[0] + (X / Wc * 0.5 + 0.5) * r[2]) * cv.clientWidth, (r[1] + (1 - (Y / Wc * 0.5 + 0.5)) * r[3]) * cv.clientHeight];
}
window.NLGL = { loadModels, get hasModels() { return !!MODELS; }, init, render, resize, setQuality, loadTex, fx, project, carMesh, BODIES, hex, get size() { return [cv.clientWidth, cv.clientHeight]; }, get ok() { return !!gl; } };
})();
