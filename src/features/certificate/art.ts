import { hash } from "@/lib/art";

/*
 * The certificate's drawn layer: paper grain, the double frame, the navy
 * ribbon with its guilloche lattice, a large guilloche rosette as the
 * watermark and the gold seal. Same approach as src/lib/art.ts — pure
 * functions that return SVG markup, drawn on the server, deterministic from a
 * seed (the certificate id), so every course gets its own rosette and the
 * same one on every render.
 *
 * Unlike the covers, the certificate is a paper artifact: it keeps its
 * ivory, navy and gold in dark mode, so it paints with fixed colours (the
 * --cert-* variables in certificate.css) instead of the hue-engine roles.
 *
 * Units are millimetres of an A4 landscape sheet (297 × 210), which keeps
 * the geometry readable; the SVG scales with the sheet.
 */

export const SHEET = { w: 297, h: 210 } as const;
/** The navy ribbon, edge to edge; the text column stops short of it. */
export const RIBBON = { x: 226, w: 42 } as const;
/** Where the seal sits on the ribbon. */
export const SEAL = { cx: RIBBON.x + RIBBON.w / 2, cy: 92, r: 21.6 } as const;

/* deterministic PRNG from a numeric seed (the same mulberry variant as art.ts) */
function rng(seed: number): () => number {
  let t = (seed >>> 0) + 0x9e3779b9;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** One decimal is 0.1 mm — finer than a pixel at any size the sheet is shown. */
const n = (v: number) => (Math.round(v * 10) / 10).toString();

/**
 * A closed wavy ring, r(θ) = rm + a·sin(lobes·θ): the basic stroke of a
 * guilloche. Drawn once; the lattice comes from rotated copies (<use>),
 * which costs a few bytes each instead of another few hundred points.
 */
function waveRing(cx: number, cy: number, rm: number, a: number, lobes: number, perLobe = 9): string {
  const steps = lobes * perLobe;
  let d = "";
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = rm + a * Math.sin(lobes * t);
    d += (i ? "L" : "M") + n(cx + r * Math.cos(t)) + " " + n(cy + r * Math.sin(t));
  }
  return d + "Z";
}

/** A petal flower, r(θ) = r0 + a·cos(petals·θ), for the rosette's heart. */
function flower(cx: number, cy: number, r0: number, a: number, petals: number, perPetal = 12): string {
  const steps = petals * perPetal;
  let d = "";
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = r0 + a * Math.cos(petals * t);
    d += (i ? "L" : "M") + n(cx + r * Math.cos(t)) + " " + n(cy + r * Math.sin(t));
  }
  return d + "Z";
}

/** `copies` rotated instances of one path, spread over one lobe's angle. */
function lattice(id: string, d: string, cx: number, cy: number, lobes: number, copies: number, cls: string): string {
  const step = 360 / lobes / copies;
  let uses = "";
  for (let k = 1; k < copies; k++) uses += `<use href="#${id}" transform="rotate(${n(step * k)} ${n(cx)} ${n(cy)})"/>`;
  return `<g class="${cls}"><path id="${id}" d="${d}"/>${uses}</g>`;
}

/**
 * A sine strand down the ribbon as a chain of quadratic curves: points on the
 * centre line, control points on alternating sides (the `T` command reflects
 * the previous control point), which is a close, cheap stand-in for a sine.
 */
function strand(cx: number, amp: number, period: number, offset: number, y0: number, y1: number): string {
  const half = period / 2;
  let y = y0 - period + (offset % period);
  let d = `M${n(cx)} ${n(y)}Q${n(cx + amp * 2)} ${n(y + half / 2)} ${n(cx)} ${n(y + half)}`;
  for (y += half; y < y1 + period; y += half) d += `T${n(cx)} ${n(y + half)}`;
  return d;
}

/** The seal's scalloped rim: a ring of small semicircular bumps. */
function scallops(r: number, bumps: number): string {
  const pt = (i: number) => {
    const a = (i / bumps) * Math.PI * 2 - Math.PI / 2;
    return [r * Math.cos(a), r * Math.sin(a)];
  };
  const chord = 2 * r * Math.sin(Math.PI / bumps);
  const br = n(chord / 2 + 0.05);
  const [x0, y0] = pt(0);
  let d = `M${n(x0)} ${n(y0)}`;
  for (let i = 1; i <= bumps; i++) {
    const [x, y] = pt(i);
    d += `A${br} ${br} 0 0 1 ${n(x)} ${n(y)}`;
  }
  return d + "Z";
}

/**
 * The whole drawn layer. `uid` keeps element ids unique when several
 * certificates share a page; `sealText` is the university's name, already in
 * capitals (it is set around the seal).
 */
export function certificateArt(seedSource: string, uid: string, sealText: string): string {
  const r = rng(hash(seedSource));
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
  const { w, h } = SHEET;
  const rx = RIBBON.x;
  const rw = RIBBON.w;
  const rc = rx + rw / 2;

  // Watermark rosette behind the text column: three latticed rings and a
  // flower, with lobe counts and depths drawn from the seed.
  const wx = 118;
  const wy = 116;
  const lobesA = pick([36, 40, 44]);
  const lobesB = pick([24, 28, 30]);
  const lobesC = pick([16, 18, 20]);
  const petals = pick([8, 10, 12]);
  const rosette =
    `<circle cx="${wx}" cy="${wy}" r="70" class="cert-wm-line"/><circle cx="${wx}" cy="${wy}" r="68.6" class="cert-wm-line"/>` +
    lattice(`${uid}-ra`, waveRing(wx, wy, 60, 3.2 + r() * 1.4, lobesA, 8), wx, wy, lobesA, 4, "cert-wm") +
    lattice(`${uid}-rb`, waveRing(wx, wy, 45, 5 + r() * 2, lobesB, 9), wx, wy, lobesB, 4, "cert-wm") +
    lattice(`${uid}-rc`, waveRing(wx, wy, 29, 4 + r() * 2, lobesC, 10), wx, wy, lobesC, 3, "cert-wm") +
    lattice(`${uid}-rf`, flower(wx, wy, 11, 8.5, petals), wx, wy, petals, 3, "cert-wm") +
    `<circle cx="${wx}" cy="${wy}" r="52.4" class="cert-wm-line"/><circle cx="${wx}" cy="${wy}" r="36.8" class="cert-wm-line"/>`;

  // Double frame: navy hairline outside, gold inside with notched corners.
  const o = 6;
  const i = 8.6;
  const k = 4.2; // corner notch radius
  const inner =
    `M${i + k} ${i}H${w - i - k}A${k} ${k} 0 0 0 ${w - i} ${i + k}V${h - i - k}A${k} ${k} 0 0 0 ${w - i - k} ${h - i}` +
    `H${i + k}A${k} ${k} 0 0 0 ${i} ${h - i - k}V${i + k}A${k} ${k} 0 0 0 ${i + k} ${i}Z`;
  const corners = [
    [i, i],
    [w - i, i],
    [w - i, h - i],
    [i, h - i],
  ]
    .map(([x, y]) => `<rect x="${n(x - 1)}" y="${n(y - 1)}" width="2" height="2" transform="rotate(45 ${x} ${y})" class="cert-gold-fill"/>`)
    .join("");
  const frame =
    `<rect x="${o}" y="${o}" width="${w - 2 * o}" height="${h - 2 * o}" class="cert-frame-navy"/>` +
    `<path d="${inner}" class="cert-frame-gold"/>${corners}`;

  // The ribbon: navy, with a two-family guilloche lattice in gold and a
  // double gold edge. It runs over the frame, like a sash on the paper.
  const period = pick([26, 28, 30]);
  let waves = "";
  for (let j = 0; j < 5; j++) waves += strand(rc, 7.6, period, (period / 5) * j, 0, h);
  let fine = "";
  for (let j = 0; j < 4; j++) fine += strand(rc, 3.4, period / 2, (period / 8) * j, 0, h);
  const ribbon =
    `<clipPath id="${uid}-rib"><rect x="${rx}" y="0" width="${rw}" height="${h}"/></clipPath>` +
    `<rect x="${rx}" y="0" width="${rw}" height="${h}" class="cert-ribbon"/>` +
    `<g clip-path="url(#${uid}-rib)"><path d="${waves}" class="cert-rib-wave"/><path d="${fine}" class="cert-rib-fine"/></g>` +
    `<path d="M${rx + 2.2} 0V${h}M${rx + rw - 2.2} 0V${h}" class="cert-rib-edge"/>` +
    `<path d="M${rx + 3.2} 0V${h}M${rx + rw - 3.2} 0V${h}" class="cert-rib-edge2"/>`;

  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs>
      <filter id="${uid}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${hash(seedSource) % 97}" result="t"/><feColorMatrix in="t" values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .25  0 0 0 .55 0"/></filter>
      ${sealDefs(uid)}
    </defs>
    <rect width="${w}" height="${h}" filter="url(#${uid}-grain)" class="cert-grain"/>
    ${rosette}
    ${frame}
    ${ribbon}
    ${seal(uid, sealText, r)}
  </svg>`;
}

function sealDefs(uid: string): string {
  return (
    `<radialGradient id="${uid}-gold" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#fbeab0"/><stop offset=".45" stop-color="#dcb95c"/><stop offset="1" stop-color="#a47d2c"/></radialGradient>` +
    `<linearGradient id="${uid}-tail" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c36d"/><stop offset="1" stop-color="#a07a2a"/></linearGradient>`
  );
}

/** The gold seal: ribbon tails, scalloped rim, the university's name around a guilloche ring, the shield in the middle. */
function seal(uid: string, text: string, r: () => number): string {
  const { cx, cy, r: R } = SEAL;
  const tr = 16.4; // text radius
  const circle = `M0 ${-tr}A${tr} ${tr} 0 1 1 0 ${tr}A${tr} ${tr} 0 1 1 0 ${-tr}`;
  const lobes = [20, 22, 24][Math.floor(r() * 3)];
  const esc = text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  // The text runs clockwise from the top of the ring; turn it back by half
  // the first phrase (up to the first ✦, the university's name) so that
  // phrase is centred over the top. The trailing no-break space keeps a gap
  // where the end of the text meets its start.
  const cut = text.indexOf("✦");
  const spin = n(-((cut > 0 ? cut : text.length) / (text.length + 1)) * 180);
  // Shield proportions from /brand/aztu-mark-white.png (276 × 512).
  const sh = 11.6;
  const sw = (sh * 276) / 512;
  return `<g transform="translate(${n(cx)} ${cy})">
    <path d="M-12.5 6L-3 6L-8.5 44L-12.8 39.6L-18 44Z" fill="url(#${uid}-tail)"/>
    <path d="M12.5 6L3 6L8.5 44L12.8 39.6L18 44Z" fill="url(#${uid}-tail)"/>
    <path d="M-8.5 44L-12.8 39.6L-18 44Z M8.5 44L12.8 39.6L18 44Z" class="cert-tail-shade"/>
    <circle r="${R + 0.6}" class="cert-seal-halo"/>
    <path d="${scallops(R, 54)}" fill="url(#${uid}-gold)"/>
    <circle r="${R - 2.1}" class="cert-seal-ring"/>
    <circle r="${R - 2.9}" class="cert-seal-ring thin"/>
    <path id="${uid}-tp" d="${circle}" fill="none"/>
    <text class="cert-seal-text" transform="rotate(${spin})" textLength="${n(2 * Math.PI * tr - 0.6)}" lengthAdjust="spacing"><textPath href="#${uid}-tp">${esc}&#160;</textPath></text>
    <circle r="13.4" class="cert-seal-ring"/>
    ${lattice(`${uid}-sg`, waveRing(0, 0, 11.2, 1.5, lobes, 8), 0, 0, lobes, 4, "cert-seal-guil")}
    <circle r="8.4" class="cert-seal-core"/>
    <circle r="7.6" class="cert-seal-core-ring"/>
    <image href="/brand/aztu-mark-white.png" x="${n(-sw / 2)}" y="${n(-sh / 2)}" width="${n(sw)}" height="${n(sh)}"/>
  </g>`;
}
