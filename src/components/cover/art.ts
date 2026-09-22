/**
 * Generative covers — Swiss-style geometric posters, one motif family per
 * category, three variants each, deterministic from a seed (the course id's
 * hash). A line-for-line TypeScript port of the prototype's cover.js, so the
 * posters look exactly like the design shots.
 *
 * Pure and universal: numbers in, an SVG body string out. Colours only ever
 * come from `var(--cv-bg|fg|ac)` inline styles, set by `[data-cat=…]` on an
 * ancestor, so the day and night palettes swap without a re-render. No API
 * text ever enters the markup (see CoverArt for why that matters).
 */
import type { CatKey } from "@/features/category/style";

type Rng = () => number;
type Ink = "bg" | "fg" | "ac";

/** mulberry32 seeded from a Knuth multiplicative hash of the seed. */
export function rng(seed: number): Rng {
  // Math.imul keeps the multiply exact for any 32-bit seed (and matches the
  // prototype's plain multiply for its small seeds), so every JS engine draws
  // the same poster for the same course.
  let a = Math.imul(seed, 2654435761) >>> 0 || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const F = (c: Ink, o?: number) => `style="fill:var(--cv-${c})${o ? `;opacity:${o}` : ""}"`;
const S = (c: Ink, w: number, extra = "") => `style="fill:none;stroke:var(--cv-${c});stroke-width:${w}${extra}"`;
const n2 = (v: number) => Math.round(v * 10) / 10;


/* ---- Information technology: bits, brackets, code lines ------------- */
function it(W: number, H: number, r: Rng, v: number): string {
  const m = W * 0.07, out: string[] = [];
  if (v === 0) {
    const cols = 9 + Math.floor(r() * 3), cell = (W - 2 * m) / cols;
    const rows = Math.max(3, Math.floor((H - m - H * 0.2) / cell)), y0 = H - m - rows * cell;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const p = 0.06 + 0.86 * ((x / (cols - 1)) * 0.45 + (y / (rows - 1)) * 0.55), q = r();
      const X = m + x * cell + cell * 0.07, Y = y0 + y * cell + cell * 0.07, s = cell * 0.86;
      if (q < p * 0.72) out.push(`<rect x="${n2(X)}" y="${n2(Y)}" width="${n2(s)}" height="${n2(s)}" ${F("fg")}/>`);
      else if (q < p * 0.84) out.push(`<rect x="${n2(X)}" y="${n2(Y)}" width="${n2(s)}" height="${n2(s)}" ${F("ac")}/>`);
      else if (q < p) out.push(`<rect x="${n2(X + 1)}" y="${n2(Y + 1)}" width="${n2(s - 2)}" height="${n2(s - 2)}" ${S("fg", 1.4)}/>`);
    }
  } else if (v === 1) {
    const a = Math.min(W, H) * 0.25, cy = H * 0.62, c = W / 2 + (r() - 0.5) * W * 0.08, sw = a * 0.3;
    out.push(`<polyline points="${n2(c - a * 0.5)},${n2(cy - a)} ${n2(c - a * 1.45)},${n2(cy)} ${n2(c - a * 0.5)},${n2(cy + a)}" ${S("fg", sw, ";stroke-linejoin:miter;stroke-miterlimit:10")}/>`);
    out.push(`<line x1="${n2(c + a * 0.3)}" y1="${n2(cy - a * 1.15)}" x2="${n2(c - a * 0.3)}" y2="${n2(cy + a * 1.15)}" ${S("ac", sw)}/>`);
    out.push(`<polyline points="${n2(c + a * 0.5)},${n2(cy - a)} ${n2(c + a * 1.45)},${n2(cy)} ${n2(c + a * 0.5)},${n2(cy + a)}" ${S("fg", sw, ";stroke-linejoin:miter;stroke-miterlimit:10")}/>`);
    // cursor
    out.push(`<rect x="${n2(W - m - a * 0.34)}" y="${n2(H - m - a * 0.5)}" width="${n2(a * 0.34)}" height="${n2(a * 0.5)}" ${F("ac")}/>`);
  } else {
    const lh = H * 0.052, gap = lh * 0.7, top = H * 0.24;
    const n = Math.floor((H - m - top) / (lh + gap));
    let ind = 0;
    for (let i = 0; i < n; i++) {
      const y = top + i * (lh + gap), x = m + ind * W * 0.08;
      const len = W * (0.12 + r() * 0.42), col = r() < 0.2 ? "ac" : "fg";
      out.push(`<rect x="${n2(x)}" y="${n2(y)}" width="${n2(Math.min(len, W - m - x))}" height="${n2(lh)}" ${F(col)}/>`);
      if (r() < 0.45) {
        const x2 = x + len + lh * 1.1, l2 = W * (0.06 + r() * 0.16);
        if (x2 + l2 < W - m) out.push(`<rect x="${n2(x2)}" y="${n2(y)}" width="${n2(l2)}" height="${n2(lh)}" ${F(col === "ac" ? "fg" : "ac", col === "ac" ? 0.55 : 1)}/>`);
      }
      const q = r();
      ind = q < 0.38 ? Math.min(3, ind + 1) : q < 0.62 ? Math.max(0, ind - 1) : ind;
    }
  }
  return out.join("");
}

/* ---- Data & AI: halftone field, scatter + fit, network --------------- */
function data(W: number, H: number, r: Rng, v: number): string {
  const m = W * 0.07, out: string[] = [];
  if (v === 0) {
    const g = W / 13, fx = W * (0.55 + r() * 0.35), fy = H * (0.62 + r() * 0.3), maxd = Math.hypot(W, H) * 0.72;
    let best: [number, number] | null = null, bd = 1e9;
    for (let y = H * 0.21 + g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) {
      const d = Math.hypot(x - fx, y - fy), t = Math.max(0, 1 - d / maxd), rad = g * 0.5 * Math.pow(t, 1.5);
      if (d < bd) { bd = d; best = [x, y]; }
      if (rad > 0.7) out.push(`<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(rad)}" ${F("fg")}/>`);
    }
    if (best) out.push(`<circle cx="${n2(best[0])}" cy="${n2(best[1])}" r="${n2(g * 0.5)}" ${F("ac")}/>`);
  } else if (v === 1) {
    const x0 = m, x1 = W - m, y0 = H * 0.26, y1 = H - m;
    out.push(`<path d="M${n2(x0)} ${n2(y0)} V${n2(y1)} H${n2(x1)}" ${S("fg", 2)}/>`);
    for (let i = 1; i <= 5; i++) out.push(`<line x1="${n2(x0 + (i * (x1 - x0)) / 5)}" y1="${n2(y1)}" x2="${n2(x0 + (i * (x1 - x0)) / 5)}" y2="${n2(y1 + 6)}" ${S("fg", 2)}/>`);
    const a = y1 - (y1 - y0) * 0.12, b = y0 + (y1 - y0) * (0.08 + r() * 0.2);
    const ly = (x: number) => a + ((b - a) * (x - x0)) / (x1 - x0);
    for (let i = 0; i < 52; i++) {
      const x = x0 + 12 + r() * (x1 - x0 - 20), g = (r() + r() + r() - 1.5) * (y1 - y0) * 0.2;
      const y = Math.min(y1 - 6, Math.max(y0 + 6, ly(x) + g));
      out.push(`<circle cx="${n2(x)}" cy="${n2(y)}" r="${n2(W * 0.011)}" ${F("fg")}/>`);
    }
    out.push(`<line x1="${n2(x0)}" y1="${n2(a)}" x2="${n2(x1)}" y2="${n2(b)}" ${S("ac", W * 0.012)}/>`);
    for (let i = 0; i < 3; i++) { const x = x0 + (x1 - x0) * (0.25 + i * 0.25 + (r() - 0.5) * 0.1); out.push(`<circle cx="${n2(x)}" cy="${n2(ly(x))}" r="${n2(W * 0.026)}" ${F("ac")} /><circle cx="${n2(x)}" cy="${n2(ly(x))}" r="${n2(W * 0.026)}" ${S("fg", 2)}/>`); }
  } else {
    const L = 4, xs: number[] = [], layers: number[][] = [];
    for (let i = 0; i < L; i++) xs.push(W * 0.13 + (i * W * 0.74) / (L - 1));
    for (let i = 0; i < L; i++) {
      const k = i === L - 1 ? 2 : 3 + Math.floor(r() * 3), ys: number[] = [];
      for (let j = 0; j < k; j++) ys.push(H * 0.3 + ((j + 0.5) * (H * 0.62)) / k);
      layers.push(ys);
    }
    const path = layers.map((ys) => Math.floor(r() * ys.length));
    for (let i = 0; i < L - 1; i++) for (const a of layers[i]) for (const b of layers[i + 1]) out.push(`<line x1="${n2(xs[i])}" y1="${n2(a)}" x2="${n2(xs[i + 1])}" y2="${n2(b)}" ${S("fg", 1.2, ";opacity:.45")}/>`);
    for (let i = 0; i < L - 1; i++) out.push(`<line x1="${n2(xs[i])}" y1="${n2(layers[i][path[i]])}" x2="${n2(xs[i + 1])}" y2="${n2(layers[i + 1][path[i + 1]])}" ${S("fg", W * 0.014)}/>`);
    layers.forEach((ys, i) => ys.forEach((y, j) => {
      const on = path[i] === j;
      out.push(`<circle cx="${n2(xs[i])}" cy="${n2(y)}" r="${n2(W * (on ? 0.034 : 0.024))}" ${F(on ? "ac" : "fg")}/>`);
      if (on) out.push(`<circle cx="${n2(xs[i])}" cy="${n2(y)}" r="${n2(W * 0.034)}" ${S("fg", 2.4)}/>`);
    }));
  }
  return out.join("");
}

/* ---- Engineering: gear, hex nut + dimensions, waveforms -------------- */
function eng(W: number, H: number, r: Rng, v: number): string {
  const out: string[] = [];
  if (v === 0) {
    const cx = W * (0.6 + r() * 0.12), cy = H * (0.68 + r() * 0.08), R = Math.min(W, H) * 0.46, n = 14 + Math.floor(r() * 4);
    out.push(`<line x1="0" y1="${n2(cy)}" x2="${W}" y2="${n2(cy)}" ${S("ac", 1.4, ";stroke-dasharray:14 6 3 6")}/>`);
    out.push(`<line x1="${n2(cx)}" y1="${n2(H * 0.2)}" x2="${n2(cx)}" y2="${H}" ${S("ac", 1.4, ";stroke-dasharray:14 6 3 6")}/>`);
    for (let i = 0; i < n; i++) out.push(`<rect x="${n2(cx - R * 0.11)}" y="${n2(cy - R)}" width="${n2(R * 0.22)}" height="${n2(R * 0.3)}" transform="rotate(${n2((360 / n) * i)} ${n2(cx)} ${n2(cy)})" ${F("fg")}/>`);
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * 0.8)}" ${F("fg")}/>`);
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * 0.56)}" ${S("ac", 1.6, ";stroke-dasharray:4 5")}/>`);
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * 0.28)}" ${F("bg")}/>`);
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * 0.28)}" ${S("ac", 2)}/>`);
  } else if (v === 1) {
    const cx = W * (0.46 + r() * 0.1), cy = H * 0.64, R = Math.min(W, H) * 0.3;
    const pts: string[] = []; for (let i = 0; i < 6; i++) { const t = (Math.PI / 3) * i + Math.PI / 6; pts.push(`${n2(cx + R * Math.cos(t))},${n2(cy + R * Math.sin(t))}`); }
    out.push(`<polygon points="${pts.join(" ")}" ${F("fg")}/>`);
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * 0.5)}" ${F("bg")}/>`);
    for (let k = 0; k < 3; k++) out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * (0.5 - k * 0.07))}" ${S("fg", 1.2, ";opacity:.6")}/>`);
    const dy = cy - R - H * 0.06, x0 = cx - R * 0.866, x1 = cx + R * 0.866;
    out.push(`<line x1="${n2(x0)}" y1="${n2(dy)}" x2="${n2(x1)}" y2="${n2(dy)}" ${S("fg", 1.4)}/>`);
    [x0, x1].forEach((x) => out.push(`<line x1="${n2(x)}" y1="${n2(dy - 8)}" x2="${n2(x)}" y2="${n2(cy - R * 0.5)}" ${S("fg", 1.2, ";opacity:.7")}/><line x1="${n2(x - 5)}" y1="${n2(dy + 5)}" x2="${n2(x + 5)}" y2="${n2(dy - 5)}" ${S("fg", 2)}/>`));
    const dx = cx + R + W * 0.08;
    out.push(`<line x1="${n2(dx)}" y1="${n2(cy - R)}" x2="${n2(dx)}" y2="${n2(cy + R)}" ${S("ac", 2)}/>`);
    [cy - R, cy + R].forEach((y) => out.push(`<line x1="${n2(dx - 6)}" y1="${n2(y + 6)}" x2="${n2(dx + 6)}" y2="${n2(y - 6)}" ${S("ac", 2.4)}/>`));
    out.push(`<line x1="${n2(cx)}" y1="${n2(cy - R - H * 0.12)}" x2="${n2(cx)}" y2="${H}" ${S("ac", 1.2, ";stroke-dasharray:14 5 3 5")}/>`);
  } else {
    const n = 7, top = H * 0.3, span = H * 0.62, hi = Math.floor(r() * n);
    for (let i = 0; i < n; i++) {
      const A = H * 0.025 + i * H * 0.01, y0 = top + (i * span) / n, k = (2 * Math.PI * (1.4 + r() * 0.9)) / W, ph = r() * 6.28;
      let d = ""; for (let x = 0; x <= W; x += 6) d += `${x === 0 ? "M" : "L"}${x} ${n2(y0 + A * Math.sin(k * x + ph))}`;
      out.push(`<path d="${d}" ${S(i === hi ? "ac" : "fg", i === hi ? W * 0.013 : W * 0.0075)}/>`);
    }
    for (let i = 1; i < 6; i++) out.push(`<line x1="${n2((W * i) / 6)}" y1="${n2(H * 0.24)}" x2="${n2((W * i) / 6)}" y2="${H}" ${S("fg", 1, ";opacity:.25")}/>`);
  }
  return out.join("");
}

/* ---- Construction & architecture: arcade, stairs, building section --- */
function arch(W: number, H: number, r: Rng, v: number): string {
  const m = W * 0.07, out: string[] = [];
  if (v === 0) {
    const n = 4 + Math.floor(r() * 2), gw = (W - 2 * m) / n, dir = r() < 0.5 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const w = gw * 0.8, x = m + i * gw + (gw - w) / 2, t = dir > 0 ? i / (n - 1) : 1 - i / (n - 1);
      const h = H * (0.3 + t * 0.4), top = H - h, kind = i % 3;
      const d = `M${n2(x)} ${H} V${n2(top + w / 2)} A${n2(w / 2)} ${n2(w / 2)} 0 0 1 ${n2(x + w)} ${n2(top + w / 2)} V${H} Z`;
      out.push(kind === 0 ? `<path d="${d}" ${F("fg")}/>` : kind === 1 ? `<path d="${d}" ${F("ac")}/>` : `<path d="${d}" ${S("fg", 2.4)}/>`);
    }
  } else if (v === 1) {
    const n = 6, sw = W / n, sh = (H * 0.6) / n;
    let d = `M0 ${H}`; for (let i = 0; i < n; i++) d += ` V${n2(H - (i + 1) * sh)} H${n2((i + 1) * sw)}`; d += ` V${H} Z`;
    out.push(`<circle cx="${n2(W * (0.28 + r() * 0.1))}" cy="${n2(H * 0.42)}" r="${n2(W * 0.11)}" ${F("ac")}/>`);
    out.push(`<path d="${d}" ${F("fg")}/>`);
    for (let i = 0; i < n; i++) out.push(`<line x1="${n2(i * sw)}" y1="${n2(H - (i + 1) * sh)}" x2="${n2(i * sw)}" y2="${H}" ${S("bg", 1.2, ";opacity:.35")}/>`);
  } else {
    const floors = 5, t = H * 0.026, fh = (H * 0.68) / floors, gold = 1 + Math.floor(r() * (floors - 1));
    const cols = 5, x0 = m, x1 = W - m;
    for (let f = 0; f < floors; f++) {
      const yB = H - m - f * fh;
      if (f === gold) out.push(`<rect x="${n2(x0)}" y="${n2(yB - fh)}" width="${n2(x1 - x0)}" height="${n2(fh)}" ${F("ac")}/>`);
      out.push(`<rect x="${n2(x0 - W * 0.03)}" y="${n2(yB - t)}" width="${n2(x1 - x0 + W * 0.06)}" height="${n2(t)}" ${F("fg")}/>`);
      for (let c = 0; c < cols; c++) { const x = x0 + (c * (x1 - x0 - W * 0.02)) / (cols - 1); out.push(`<rect x="${n2(x)}" y="${n2(yB - fh)}" width="${n2(W * 0.02)}" height="${n2(fh - t)}" ${F("fg")}/>`); }
    }
    const yt = H - m - floors * fh;
    out.push(`<rect x="${n2(x0 - W * 0.03)}" y="${n2(yt - t)}" width="${n2(x1 - x0 + W * 0.06)}" height="${n2(t)}" ${F("fg")}/>`);
    out.push(`<line x1="0" y1="${n2(H - m)}" x2="${W}" y2="${n2(H - m)}" ${S("fg", 2)}/>`);
  }
  return out.join("");
}

/* ---- Transport & logistics: route map, chevrons, lanes -------------- */
function trans(W: number, H: number, r: Rng, v: number): string {
  const m = W * 0.07, out: string[] = [];
  if (v === 0) {
    const s = W / 7, sw = W * 0.042;
    const route = (y: number, up: number, col: Ink): number[][] => {
      const pts: number[][] = [[-10, y]]; let x = 0;
      while (x < W + s) { x += s; const q = r(); if (q < 0.42 && y - s > H * 0.3) y -= up * s; else if (q > 0.85 && y + s < H - m) y += up * s; pts.push([x, y]); }
      out.push(`<polyline points="${pts.map((p) => p.map(n2).join(",")).join(" ")}" ${S(col, sw, ";stroke-linejoin:round;stroke-linecap:round")}/>`);
      return pts;
    };
    const p2 = route(H * 0.62, -1, "ac");
    const p1 = route(H * 0.86, 1, "fg");
    [p1[2], p1[4], p2[3], p2[5]].forEach((p) => p && out.push(`<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="${n2(sw * 0.95)}" ${F("fg")}/><circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="${n2(sw * 0.45)}" ${F("bg")}/>`));
  } else if (v === 1) {
    const per = 5, cw = W / (per + 0.5), ch = cw * 0.95, sw = cw * 0.2, rows = [H * 0.4, H * 0.62, H * 0.84], hi = Math.floor(r() * 3);
    rows.forEach((y, ri) => {
      const off = (r() - 0.5) * cw * 0.6;
      for (let i = -1; i <= per; i++) { const x = i * cw + off + cw * 0.3; out.push(`<polyline points="${n2(x)},${n2(y - ch / 2)} ${n2(x + cw * 0.46)},${n2(y)} ${n2(x)},${n2(y + ch / 2)}" ${S(ri === hi ? "ac" : "fg", sw, ";stroke-linejoin:miter")}/>`); }
    });
  } else {
    const hi = 2 + Math.floor(r() * 3);
    for (let i = 0; i < 8; i++) {
      const R = W * (0.26 + i * 0.11);
      out.push(`<path d="M0 ${n2(H - R)} A${n2(R)} ${n2(R)} 0 0 1 ${n2(R)} ${H}" ${S(i === hi ? "ac" : "fg", W * (i % 2 ? 0.012 : 0.03), i % 2 ? ";stroke-dasharray:16 12" : "")}/>`);
    }
    const R = W * (0.26 + hi * 0.11), a = -Math.PI / 2 + (0.3 + r() * 0.4) * (Math.PI / 2);
    out.push(`<circle cx="${n2(R * Math.cos(a))}" cy="${n2(H + R * Math.sin(a))}" r="${n2(W * 0.04)}" ${F("fg")}/><circle cx="${n2(R * Math.cos(a))}" cy="${n2(H + R * Math.sin(a))}" r="${n2(W * 0.018)}" ${F("bg")}/>`);
  }
  return out.join("");
}

/* ---- Business & management: rising bars, quarter tiles, exploded pie - */
function biz(W: number, H: number, r: Rng, v: number): string {
  const m = W * 0.07, out: string[] = [];
  if (v === 0) {
    const n = 6, slot = (W - 2 * m) / n, bw = slot * 0.62, base = H - m; let val = 0.16 + r() * 0.08;
    for (let i = 0; i < n; i++) {
      val = Math.min(0.7, Math.max(0.12, val + (r() * 0.17 - 0.03)));
      const h = val * H, x = m + i * slot + (slot - bw) / 2;
      out.push(`<rect x="${n2(x)}" y="${n2(base - h)}" width="${n2(bw)}" height="${n2(h)}" ${F(i === n - 1 ? "ac" : "fg")}/>`);
    }
    out.push(`<line x1="${n2(m * 0.5)}" y1="${n2(base)}" x2="${n2(W - m * 0.5)}" y2="${n2(base)}" ${S("fg", 2)}/>`);
  } else if (v === 1) {
    const cols = 3, t = W / cols, rows = Math.max(2, Math.round((H * 0.76) / t)), y0 = H - rows * t;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const X = x * t, Y = y0 + y * t, o = Math.floor(r() * 4), q = r();
      const c = [[X, Y + t], [X, Y], [X + t, Y], [X + t, Y + t]][o];
      const a0 = [[X, Y], [X + t, Y], [X + t, Y + t], [X, Y + t]][o], a1 = [[X + t, Y + t], [X, Y + t], [X, Y], [X + t, Y]][o];
      const d = `M${n2(c[0])} ${n2(c[1])} L${n2(a0[0])} ${n2(a0[1])} A${n2(t)} ${n2(t)} 0 0 1 ${n2(a1[0])} ${n2(a1[1])} Z`;
      out.push(q < 0.5 ? `<path d="${d}" ${F("fg")}/>` : q < 0.72 ? `<path d="${d}" ${F("ac")}/>` : `<path d="${d}" ${S("fg", 2)}/>`);
    }
  } else {
    const cx = W * 0.5, cy = H * 0.62, R = Math.min(W, H) * 0.32, a0 = r() * 6.28, sp = 6.28 * (0.16 + r() * 0.12);
    const P = (a: number, rr: number, ox = 0, oy = 0) => `${n2(cx + ox + rr * Math.cos(a))} ${n2(cy + oy + rr * Math.sin(a))}`;
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * 1.2)}" ${S("fg", 1.4, ";stroke-dasharray:3 6")}/>`);
    out.push(`<path d="M${n2(cx)} ${n2(cy)} L${P(a0 + sp, R)} A${n2(R)} ${n2(R)} 0 1 1 ${P(a0, R)} Z" ${F("fg")}/>`);
    const mid = a0 + sp / 2, ox = Math.cos(mid) * R * 0.18, oy = Math.sin(mid) * R * 0.18;
    out.push(`<path d="M${n2(cx + ox)} ${n2(cy + oy)} L${P(a0, R, ox, oy)} A${n2(R)} ${n2(R)} 0 0 1 ${P(a0 + sp, R, ox, oy)} Z" ${F("ac")}/>`);
  }
  return out.join("");
}

/* ---- Research & academic: rings, page fan, footnote asterisk -------- */
function res(W: number, H: number, r: Rng, v: number): string {
  const m = W * 0.07, out: string[] = [];
  if (v === 0) {
    const cx = W * (0.6 + r() * 0.2), cy = H * (0.6 + r() * 0.16), g = W * 0.042;
    for (let i = 1; i < 26; i++) out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(i * g)}" ${S("fg", i % 4 === 0 ? 3.2 : 1.3)}/>`);
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(g * 0.62)}" ${F("ac")}/>`);
    out.push(`<rect x="0" y="0" width="${W}" height="${n2(H * 0.19)}" ${F("bg")}/>`);
  } else if (v === 1) {
    const ox = W / 2, oy = H - m * 0.4, L = H * 0.64, n = 19;
    for (let i = 0; i < n; i++) { const a = Math.PI + (Math.PI * (i + 0.5)) / n; out.push(`<line x1="${n2(ox)}" y1="${n2(oy)}" x2="${n2(ox + L * Math.cos(a))}" y2="${n2(oy + L * Math.sin(a))}" ${S("fg", i === 9 ? 4 : 1.4)}/>`); }
    out.push(`<path d="M${n2(ox - L * 0.52)} ${n2(oy)} A${n2(L * 0.52)} ${n2(L * 0.52)} 0 0 1 ${n2(ox + L * 0.52)} ${n2(oy)}" ${S("ac", W * 0.03)}/>`);
    out.push(`<rect x="0" y="${n2(oy)}" width="${W}" height="${n2(H - oy)}" ${F("fg")}/>`);
  } else {
    const cx = W * (0.56 + r() * 0.1), cy = H * 0.6, R = Math.min(W, H) * 0.34, aw = R * 0.3;
    for (let i = 0; i < 3; i++) out.push(`<rect x="${n2(cx - aw / 2)}" y="${n2(cy - R)}" width="${n2(aw)}" height="${n2(2 * R)}" transform="rotate(${i * 60} ${n2(cx)} ${n2(cy)})" ${F("fg")}/>`);
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R * 0.22)}" ${F("ac")}/>`);
    for (let i = 0; i < 3; i++) out.push(`<rect x="${n2(m)}" y="${n2(H - m - i * H * 0.045)}" width="${n2(W * (0.18 + r() * 0.14))}" height="${n2(H * 0.016)}" ${F("fg", 0.7)}/>`);
  }
  return out.join("");
}

/* ---- Energy: striped sun, stepped bolt, solar field ----------------- */
function nrg(W: number, H: number, r: Rng, v: number): string {
  const m = W * 0.07, out: string[] = [];
  if (v === 0) {
    const cx = W * (0.36 + r() * 0.28), cy = H * 0.9, R = Math.min(W, H) * 0.56;
    out.push(`<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R)}" ${F("ac")}/>`);
    const n = 7, top = cy - R, band = (H - top) / (n * 2);
    for (let i = 0; i < n; i++) { const y = top + band * (i * 2 + 1) + i * band * 0.12; out.push(`<rect x="0" y="${n2(y)}" width="${W}" height="${n2(band * (0.35 + i * 0.12))}" ${F("bg")}/>`); }
    out.push(`<line x1="${n2(m)}" y1="${n2(H - m)}" x2="${n2(W - m)}" y2="${n2(H - m)}" ${S("fg", 2.4)}/>`);
  } else if (v === 1) {
    const g = W / 10;
    for (let x = 1; x < 10; x++) out.push(`<line x1="${n2(x * g)}" y1="${n2(H * 0.24)}" x2="${n2(x * g)}" y2="${H}" ${S("fg", 1, ";opacity:.28")}/>`);
    for (let y = H * 0.24 + g; y < H; y += g) out.push(`<line x1="0" y1="${n2(y)}" x2="${W}" y2="${n2(y)}" ${S("fg", 1, ";opacity:.28")}/>`);
    const x0 = W * (0.42 + r() * 0.12), y0 = H * 0.26, s = g;
    const pts = [[x0 + s, y0], [x0 - s * 1.2, y0 + (H - y0) * 0.52], [x0 + s * 0.4, y0 + (H - y0) * 0.52], [x0 - s * 1.4, H], [x0 + s * 2.2, y0 + (H - y0) * 0.4], [x0 + s * 0.5, y0 + (H - y0) * 0.4], [x0 + s * 2, y0]];
    out.push(`<polygon points="${pts.map((p) => p.map(n2).join(",")).join(" ")}" ${F("fg")}/>`);
    out.push(`<circle cx="${n2(W - m - g * 0.6)}" cy="${n2(H * 0.24 + g * 1.6)}" r="${n2(g * 0.6)}" ${F("ac")}/>`);
  } else {
    const cols = 6, rows = 4, x0 = m, x1 = W - m, y0 = H * 0.4, y1 = H - m;
    const cw = (x1 - x0) / cols, rh = (y1 - y0) / rows, hi = Math.floor(r() * cols * rows);
    out.push(`<circle cx="${n2(W * (0.2 + r() * 0.6))}" cy="${n2(H * 0.3)}" r="${n2(W * 0.09)}" ${F("ac")}/>`);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const k = y * cols + x, X = x0 + x * cw + 2, Y = y0 + y * rh + 2;
      out.push(`<rect x="${n2(X)}" y="${n2(Y)}" width="${n2(cw - 4)}" height="${n2(rh - 4)}" ${k === hi ? F("ac") : F("fg")}/>`);
      out.push(`<line x1="${n2(X + (cw - 4) / 2)}" y1="${n2(Y)}" x2="${n2(X + (cw - 4) / 2)}" y2="${n2(Y + rh - 4)}" ${S("bg", 1, ";opacity:.5")}/>`);
    }
  }
  return out.join("");
}

/* ---- Fallback for any future category: Bauhaus studies -------------- */
function oth(W: number, H: number, r: Rng, v: number): string {
  const cx = W * (0.35 + r() * 0.3), cy = H * 0.66, R = Math.min(W, H) * 0.3;
  if (v === 1) {
    const out: string[] = [], n = 5, w = W / n;
    for (let i = 0; i < n; i++) { const h = H * (0.3 + ((i * 37 + Math.floor(r() * 50)) % 50) / 100); out.push(`<path d="M${n2(i * w)} ${H} V${n2(H - h + w / 2)} A${n2(w / 2)} ${n2(w / 2)} 0 0 1 ${n2((i + 1) * w)} ${n2(H - h + w / 2)} V${H} Z" ${F(i % 2 ? "ac" : "fg")}/>`); }
    return out.join("");
  }
  if (v === 2) {
    return `<rect x="${n2(W * 0.1)}" y="${n2(H * 0.34)}" width="${n2(W * 0.46)}" height="${n2(H * 0.56)}" ${F("fg")}/><circle cx="${n2(W * 0.62)}" cy="${n2(H * 0.58)}" r="${n2(Math.min(W, H) * 0.24)}" ${F("ac")}/><polygon points="${n2(W * 0.5)},${n2(H * 0.9)} ${n2(W * 0.9)},${n2(H * 0.9)} ${n2(W * 0.9)},${n2(H * 0.5)}" ${S("fg", 3)}/>`;
  }
  return `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(R)}" ${F("fg")}/><path d="M${n2(cx)} ${n2(cy - R * 1.25)} A${n2(R * 1.25)} ${n2(R * 1.25)} 0 0 1 ${n2(cx)} ${n2(cy + R * 1.25)} Z" ${F("ac")}/><rect x="${n2(cx - R * 1.4)}" y="${n2(cy + R * 1.05)}" width="${n2(R * 2.8)}" height="${n2(H * 0.03)}" ${F("fg")}/>`;
}

/* ---- Technical marks: a registration crosshair and a scale ruler ---
   No numbers — they are drawing conventions, not data. Hidden on
   thumbnails by a container query (.cover svg .tech). */
function tech(W: number, H: number): string {
  const m = W * 0.07, s = W * 0.03, cx = m + s, cy = H - m - s * 0.2;
  const rx1 = W - m, rx0 = rx1 - W * 0.22, ry = H - m * 0.62;
  let o = `<g class="tech">`;
  o += `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(s * 0.5)}" ${S("fg", 1.2)}/>`;
  o += `<line x1="${n2(cx - s)}" y1="${n2(cy)}" x2="${n2(cx + s)}" y2="${n2(cy)}" ${S("fg", 1.2)}/><line x1="${n2(cx)}" y1="${n2(cy - s)}" x2="${n2(cx)}" y2="${n2(cy + s)}" ${S("fg", 1.2)}/>`;
  o += `<line x1="${n2(rx0)}" y1="${n2(ry)}" x2="${n2(rx1)}" y2="${n2(ry)}" ${S("fg", 1.2)}/>`;
  for (let i = 0; i <= 10; i++) { const x = rx0 + ((rx1 - rx0) * i) / 10, t = i % 5 === 0 ? s * 0.62 : s * 0.3; o += `<line x1="${n2(x)}" y1="${n2(ry)}" x2="${n2(x)}" y2="${n2(ry - t)}" ${S("fg", 1.2)}/>`; }
  return o + `</g>`;
}

/* ---- Format diptych art (home finder spread) -----------------------
   Flat, text-free product mocks in the poster language — they show what
   learning looks like without inventing a schedule, a time or an address. */
function online(W: number, H: number): string {
  const out: string[] = [], m = W * 0.06, top = H * 0.1, bot = H - m;
  const vx = m, vw = W * 0.58, vy = top, vh = (bot - top) * 0.78;
  out.push(`<rect x="${n2(m * 0.6)}" y="${n2(top - m * 0.5)}" width="${n2(W - m * 1.2)}" height="${n2(bot - top + m * 0.8)}" rx="10" ${F("fg", 0.07)}/>`);
  out.push(`<rect x="${n2(vx)}" y="${n2(vy)}" width="${n2(vw)}" height="${n2(vh)}" rx="6" ${F("fg")}/>`);
  const pcx = vx + vw / 2, pcy = vy + vh / 2, pr = vh * 0.2;
  out.push(`<circle cx="${n2(pcx)}" cy="${n2(pcy)}" r="${n2(pr * 1.35)}" ${S("bg", 2, ";opacity:.35")}/>`);
  out.push(`<polygon points="${n2(pcx - pr * 0.45)},${n2(pcy - pr * 0.7)} ${n2(pcx + pr * 0.75)},${n2(pcy)} ${n2(pcx - pr * 0.45)},${n2(pcy + pr * 0.7)}" ${F("bg")}/>`);
  const sy = vy + vh + (bot - vy - vh) * 0.5, px = vx + vw * 0.62;
  out.push(`<rect x="${n2(vx)}" y="${n2(sy - 2)}" width="${n2(vw)}" height="4" rx="2" ${F("fg", 0.25)}/>`);
  out.push(`<rect x="${n2(vx)}" y="${n2(sy - 2)}" width="${n2(px - vx)}" height="4" rx="2" ${F("ac")}/>`);
  out.push(`<circle cx="${n2(px)}" cy="${n2(sy)}" r="7" ${F("ac")}/><circle cx="${n2(px)}" cy="${n2(sy)}" r="7" ${S("fg", 1.6)}/>`);
  const lx = vx + vw + W * 0.045, lw = W - m - lx, rows = 5, rh = vh / rows;
  for (let i = 0; i < rows; i++) {
    const y = vy + i * rh + rh / 2, cur = i === 2, done = i < 2;
    if (cur) out.push(`<rect x="${n2(lx - 6)}" y="${n2(y - rh * 0.4)}" width="${n2(lw + 6)}" height="${n2(rh * 0.8)}" rx="5" ${F("ac", 0.9)}/>`);
    out.push(done ? `<circle cx="${n2(lx + 9)}" cy="${n2(y)}" r="7" ${F("fg")}/><path d="M${n2(lx + 5.5)} ${n2(y)} l2.6 2.6 l4.6 -5" ${S("bg", 1.8)}/>` : `<circle cx="${n2(lx + 9)}" cy="${n2(y)}" r="6.4" ${S("fg", 1.6)}/>`);
    out.push(`<rect x="${n2(lx + 24)}" y="${n2(y - 3)}" width="${n2((lw - 30) * (0.55 + ((i * 37) % 40) / 100))}" height="6" rx="3" ${F("fg", cur ? 0.9 : 0.35)}/>`);
  }
  return out.join("");
}
function offline(W: number, H: number, r: Rng): string {
  const out: string[] = [], m = W * 0.06;
  out.push(`<rect x="${n2(W * 0.2)}" y="${n2(H * 0.09)}" width="${n2(W * 0.6)}" height="${n2(H * 0.04)}" rx="2" ${F("fg")}/>`);
  const gx = m, gw = W * 0.5, gy = H * 0.24, cols = 5, rws = 4, cw = gw / cols, ch = (H * 0.68) / rws;
  for (let c = 0; c < cols; c++) out.push(`<rect x="${n2(gx + c * cw + cw * 0.3)}" y="${n2(gy)}" width="${n2(cw * 0.4)}" height="4" rx="2" ${F("fg", 0.55)}/>`);
  const hit: number[][] = [[1, 2], [3, 2]];
  for (let y = 0; y < rws - 1; y++) for (let c = 0; c < cols; c++) {
    const X = gx + c * cw + 3, Y = gy + 14 + y * ch, on = hit.some(([hc, hr]) => hc === c && hr === y + 1);
    out.push(on ? `<rect x="${n2(X)}" y="${n2(Y)}" width="${n2(cw - 6)}" height="${n2(ch - 8)}" rx="4" ${F("fg")}/>` : `<rect x="${n2(X + 0.8)}" y="${n2(Y + 0.8)}" width="${n2(cw - 7.6)}" height="${n2(ch - 9.6)}" rx="4" ${S("fg", 1.4, ";opacity:.45")}/>`);
  }
  const sx = gx + gw + W * 0.07, sw = W - m - sx, sc = 5, g = sw / sc, sy0 = gy + 18;
  for (let y = 0; y < 5; y++) for (let x = 0; x < sc; x++) {
    const cx = sx + x * g + g / 2, cy = sy0 + y * g * 0.92, taken = r() < 0.6;
    out.push(taken ? `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(g * 0.28)}" ${F("fg")}/>` : `<circle cx="${n2(cx)}" cy="${n2(cy)}" r="${n2(g * 0.28 - 0.8)}" ${S("fg", 1.6)}/>`);
  }
  out.push(`<circle cx="${n2(sx + 3 * g + g / 2)}" cy="${n2(sy0 + 3 * g * 0.92)}" r="${n2(g * 0.3)}" ${F("ac")}/><circle cx="${n2(sx + 3 * g + g / 2)}" cy="${n2(sy0 + 3 * g * 0.92)}" r="${n2(g * 0.3)}" ${S("fg", 1.6)}/>`);
  return out.join("");
}

type Motif = (W: number, H: number, r: Rng, v: number) => string;
const MOTIFS: Record<CatKey, Motif> = { it, data, eng, arch, trans, biz, res, nrg, oth, brand: oth };
const SPECIAL = { online, offline } as const;
export type CoverSpecial = keyof typeof SPECIAL;

/**
 * Per-course variation, all derived from the seed: which of the three motifs,
 * mirrored or not, and (about one in five) the "night" palette — navy ground
 * with the category tint as the figure.
 */
export function pick(seed: number): { v: number; flip: boolean; inv: boolean } {
  const r = rng((seed || 1) * 7 + 13);
  const a = r(), b = r(), c = r();
  return { v: Math.floor(a * 3), flip: b < 0.5, inv: c < 0.2 };
}

/**
 * The poster for a category and seed at a drawn aspect ratio (width / height):
 * the background rect first, then the (possibly mirrored) motif, then the
 * technical marks. W is fixed at 400 and H follows the ratio, so the geometry
 * is identical to the prototype's.
 */
export function artSvg({
  cat,
  seed,
  ratio,
  special,
  noTech,
}: {
  cat: CatKey;
  seed: number;
  ratio: number;
  special?: CoverSpecial;
  noTech?: boolean;
}): { viewBox: string; inner: string } {
  const W = 400;
  const H = Math.round(400 / (ratio || 4 / 3));
  const r = rng(seed || 1);
  const p = pick(seed);
  let body = special ? SPECIAL[special](W, H, r) : (MOTIFS[cat] ?? oth)(W, H, r, p.v);
  if (!special && p.flip) body = `<g transform="translate(${W} 0) scale(-1 1)">${body}</g>`;
  const marks = special || noTech ? "" : tech(W, H);
  return { viewBox: `0 0 ${W} ${H}`, inner: `<rect width="${W}" height="${H}" ${F("bg")}/>${body}${marks}` };
}

/** Parse a CSS aspect ratio ("4 / 3", "16/9", "1") into width / height. */
export function ratioOf(css: string): number {
  const [a, b] = css.split("/").map((s) => parseFloat(s));
  if (!a) return 4 / 3;
  return b ? a / b : a;
}
