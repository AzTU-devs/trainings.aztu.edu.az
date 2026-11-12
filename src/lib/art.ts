/*
 * Generative course covers, drawn for the participant area's course cards
 * (the public site shows a course's photo or a plain header with its
 * category's icon instead), and the hash the certificate and room pages seed
 * their details with.
 *
 * Pure functions that return SVG markup, so the art is drawn on the server and
 * costs the browser no JavaScript. Shapes paint only with role classes (f100,
 * s700, fg…) defined in globals.css, which resolve through the category hue
 * engine — so one drawing re-themes for every category and for dark mode.
 *
 * Deterministic: the seed is an FNV-1a hash of the course id or slug, so a
 * course looks the same on every page and on the server and in the browser.
 * No caller-supplied text reaches the markup.
 */

/** The eight subject families the art (and the hue engine) knows about. */
export type ArtKind = "it" | "data" | "eng" | "biz" | "res" | "build" | "trans" | "energy";

type Motif = (r: () => number, label: string) => string;

/* deterministic PRNG from a numeric seed */
function rng(seed: number): () => number {
  let t = (seed >>> 0) + 0x9e3779b9;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
/* FNV-1a: course id / slug -> seed */
export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];

function gridPath(w: number, h: number, step: number): string {
  let d = '';
  for (let x = step; x < w; x += step) d += `M${x} 0V${h}`;
  for (let y = step; y < h; y += step) d += `M0 ${y}H${w}`;
  return `<path class="grid" d="${d}"/>`;
}
/* engineering-drawing dimension line with end ticks and a mono label */
function dimH(x1: number, x2: number, y: number, label: string): string {
  const mid = (x1 + x2) / 2;
  return `<path class="dimline" d="M${x1} ${y}H${x2}M${x1} ${y - 5}V${y + 5}M${x2} ${y - 5}V${y + 5}"/>` +
    `<text class="dim" x="${mid}" y="${y - 8}" text-anchor="middle">${label}</text>`;
}
function dimV(x: number, y1: number, y2: number, label: string): string {
  const mid = (y1 + y2) / 2, left = x > 240;
  return `<path class="dimline" d="M${x} ${y1}V${y2}M${x - 5} ${y1}H${x + 5}M${x - 5} ${y2}H${x + 5}"/>` +
    `<text class="dim" x="${left ? x - 9 : x + 9}" y="${mid + 4}" text-anchor="${left ? 'end' : 'start'}">${label}</text>`;
}
const cross = (x: number, y: number, s = 7) => `<path class="dimline" d="M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}"/>`;

const LABELS: Record<ArtKind, string[]> = {
  it: ['&lt;/&gt;', '0x2F', 'λ → ƒ'],
  data: ['σ = 0.82', 'n = 128', 'R² 0.94'],
  eng: ['Ø 112', 'R 56', '45°'],
  biz: ['Q1 → Q4', '+12%', 'ROI'],
  res: ['p &lt; 0.05', '[1] [2]', 'H₀'],
  build: ['1:50', '±0.00', 'R 40'],
  trans: ['A → B', '12 km', 'ETA'],
  energy: ['220 V', 'kWh', '50 Hz'],
};

/* ---------- cover motifs: 320 x 200 ---------- */
const M: Partial<Record<ArtKind, Motif[]>> = {};

M.it = [
  function window(r: () => number, L: string): string {
    return `<g class="pa"><circle cx="92" cy="104" r="66" class="f300"/></g>
    <g class="pb">
      <rect x="132" y="38" width="160" height="120" rx="18" class="f0"/>
      <circle cx="152" cy="58" r="4.5" class="f300"/><circle cx="166" cy="58" r="4.5" class="f300"/><circle cx="180" cy="58" r="4.5" class="fg"/>
      <rect x="152" y="82" width="62" height="9" rx="4.5" class="f500"/><rect x="222" y="82" width="48" height="9" rx="4.5" class="f200"/>
      <rect x="168" y="100" width="90" height="9" rx="4.5" class="f300"/>
      <rect x="168" y="118" width="50" height="9" rx="4.5" class="f700"/><rect x="226" y="118" width="22" height="9" rx="4.5" class="f200"/>
      <rect x="152" y="136" width="96" height="9" rx="4.5" class="f200"/>
    </g>
    <path d="M80 76 L52 104 L80 132" class="s900 rnd" stroke-width="12" fill="none"/>
    ${dimH(26, 158, 184, L)}`;
  },
  function stairs(r: () => number, L: string): string {
    let sq = '';
    const fills = ['f500', 'f300', 'f700', 'f0', 'f500', 'f200'];
    for (let i = 0; i < 5; i++) for (let j = 0; j <= i; j++) {
      const cls = (i === 4 && j === 4) ? 'fg' : fills[(i + j * 2) % fills.length];
      sq += `<rect x="${34 + i * 30}" y="${146 - j * 30}" width="24" height="24" rx="6" class="${cls}"/>`;
    }
    return `<g class="pa"><circle cx="236" cy="78" r="70" class="f200"/></g>
    <g class="pb">${sq}</g>
    <path d="M226 74 L262 100 L226 126" class="s900 rnd" stroke-width="12" fill="none"/>
    <rect x="270" y="118" width="28" height="9" rx="4.5" class="fg"/>
    ${dimV(300, 30, 96, L)}`;
  },
  function terminal(r: () => number, L: string): string {
    return `<g class="pa"><path d="M320 0V96A96 96 0 0 1 224 0Z" class="f300"/><circle cx="268" cy="156" r="34" class="f200"/></g>
    <g class="pb">
      <rect x="34" y="40" width="206" height="124" rx="18" class="f900"/>
      <path d="M54 72 L66 80 L54 88" class="s300 rnd" stroke-width="4" fill="none"/>
      <rect x="76" y="76" width="70" height="8" rx="4" class="f300"/>
      <rect x="54" y="98" width="120" height="8" rx="4" class="f500"/>
      <rect x="54" y="116" width="84" height="8" rx="4" class="f300" opacity=".7"/>
      <path d="M54 136 L66 144 L54 152" class="s300 rnd" stroke-width="4" fill="none"/>
      <rect x="74" y="138" width="16" height="12" rx="3" class="fg"/>
    </g>
    ${cross(268, 156)}
    <text class="dim" x="248" y="36">${L}</text>`;
  },
];

M.data = [
  function scatter(r: () => number, L: string): string {
    let pts = '';
    for (let i = 0; i < 17; i++) {
      const x = 56 + i * 14 + (r() - .5) * 10;
      const y = 150 - (x - 50) * 0.38 + (r() - .5) * 46;
      const rad = 4 + r() * 5;
      const cls = i === 12 ? 'fg' : (r() > .55 ? 'f700' : (r() > .4 ? 'f0' : 'f500'));
      pts += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" class="${cls}"/>`;
    }
    return `<g class="pa"><circle cx="206" cy="92" r="82" class="f200"/></g>
    <path d="M40 166H292M40 166V34" class="s700" stroke-width="2" fill="none" opacity=".7"/>
    <g class="pb">${pts}</g>
    <path d="M50 160 L294 54" class="s900 rnd" stroke-width="3.5" fill="none"/>
    <text class="dim" x="250" y="186">${L}</text>`;
  },
  function network(r: () => number, L: string): string {
    const cols: [number, number][] = [[70, 3], [160, 4], [250, 2]];
    const nodes = cols.map(([x, n]) => Array.from({ length: n }, (_, i) => [x, 100 + (i - (n - 1) / 2) * 38]));
    let lines = '';
    for (let c = 0; c < 2; c++) for (const a of nodes[c]) for (const b of nodes[c + 1])
      lines += `M${a[0]} ${a[1]}L${b[0]} ${b[1]}`;
    let dots = '', k = 0;
    nodes.flat().forEach(([x, y]) => {
      const cls = k === 5 ? 'fg' : (k % 3 === 0 ? 'f500' : 'f0');
      dots += `<circle cx="${x}" cy="${y}" r="13" class="${cls} s700" stroke-width="3"/>`; k++;
    });
    return `<g class="pa"><path d="M0 200V70A130 130 0 0 1 130 200Z" class="f200"/></g>
    <path d="${lines}" class="s300" stroke-width="2.5" fill="none"/>
    <g class="pb">${dots}</g>
    ${dimH(222, 296, 34, L)}`;
  },
  function radial(r: () => number, L: string): string {
    const cx = 108, cy = 108;
    const arc = (rad: number, frac: number) => {
      const a = frac * Math.PI * 2 - Math.PI / 2;
      const x = cx + rad * Math.cos(a), y = cy + rad * Math.sin(a);
      return `M${cx} ${cy - rad}A${rad} ${rad} 0 ${frac > .5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
    };
    let bars = '';
    [44, 70, 58, 96, 80].forEach((h, i) => bars += `<rect x="${206 + i * 20}" y="${166 - h}" width="12" height="${h}" rx="6" class="${i === 3 ? 'f700' : 'f300'}"/>`);
    return `<g class="pa"><circle cx="${cx}" cy="${cy}" r="92" class="f50" opacity=".7"/></g>
    <g class="pc" style="--ox:${cx}px;--oy:${cy}px">
      <circle cx="${cx}" cy="${cy}" r="72" class="s200 fnone" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="48" class="s200 fnone" stroke-width="14"/>
      <path d="${arc(72, .72)}" class="s500 rnd fnone" stroke-width="14"/>
      <path d="${arc(48, .46)}" class="s700 rnd fnone" stroke-width="14"/>
      <circle cx="${cx}" cy="${cy}" r="18" class="fg"/>
    </g>
    <g class="pb">${bars}</g>
    ${dimH(202, 298, 186, L)}`;
  },
];

M.eng = [
  function gear(r: () => number, L: string): string {
    const g = (cx: number, cy: number, R: number, n: number, tw: number, th: number, cls: string, hole: number) => {
      let t = '';
      for (let i = 0; i < n; i++) t += `<rect x="${-tw / 2}" y="${-R - th + 4}" width="${tw}" height="${th}" rx="4" transform="rotate(${(360 / n) * i})" class="${cls}"/>`;
      return `<g transform="translate(${cx} ${cy})">${t}<circle r="${R}" class="${cls}"/><circle r="${hole}" class="f100"/></g>`;
    };
    return `<circle cx="118" cy="102" r="86" class="s700 fnone" stroke-width="1.2" stroke-dasharray="3 6" opacity=".6"/>
    <g class="pc" style="--ox:118px;--oy:102px">${g(118, 102, 52, 10, 20, 20, 'f500', 20)}</g>
    <g class="pb">${g(236, 64, 26, 8, 12, 12, 'f300', 9)}<circle cx="236" cy="64" r="4" class="fg"/></g>
    ${cross(118, 102, 12)}
    ${dimV(292, 110, 190, L)}`;
  },
  function drafting(r: () => number, L: string): string {
    return `<g class="pa"><polygon points="152,172 296,172 296,36" class="f300"/><polygon points="198,158 282,158 282,78" class="f100"/></g>
    <g class="pb">
      <circle cx="104" cy="92" r="58" class="f0"/>
      <circle cx="104" cy="92" r="38" class="s700 fnone" stroke-width="2.5"/>
      <circle cx="104" cy="92" r="9" class="f700"/>
      <circle cx="146" cy="52" r="7" class="fg"/>
    </g>
    <path class="dimline" d="M104 18V168M28 92H182" stroke-dasharray="6 5"/>
    ${dimH(46, 162, 186, L)}`;
  },
];

M.biz = [
  function bars(r: () => number, L: string): string {
    const hs = [40, 64, 54, 94, 124];
    const fills = ['f300', 'f300', 'f500', 'f500', 'f700'];
    let b = '';
    const pts: number[][] = [];
    hs.forEach((h, i) => { const x = 48 + i * 46; b += `<rect x="${x}" y="${166 - h}" width="32" height="${h}" rx="9" class="${fills[i]}"/>`; pts.push([x + 16, 150 - h]); });
    const line = 'M' + pts.map(p => p.join(' ')).join('L');
    return `<g class="pa"><circle cx="252" cy="54" r="64" class="f200"/></g>
    <g class="pb">${b}</g>
    <path d="${line}" class="sg rnd fnone" stroke-width="4"/>
    ${pts.map((p, i) => i === pts.length - 1 ? `<circle cx="${p[0]}" cy="${p[1]}" r="7" class="fg"/>` : '').join('')}
    <path d="M30 166H300" class="s700" stroke-width="1.5" opacity=".7"/>
    <text class="dim" x="34" y="190">${L}</text>`;
  },
  function pie(r: () => number, L: string): string {
    return `<g class="pa"><rect x="190" y="-30" width="160" height="160" rx="80" class="f200"/></g>
    <g class="pc" style="--ox:112px;--oy:104px">
      <circle cx="112" cy="104" r="66" class="f300"/>
      <path d="M112 104 L112 38 A66 66 0 0 1 174.8 124.4 Z" class="f500"/>
      <path d="M118 108 L181 128 A66 66 0 0 1 140 164 Z" class="f700"/>
      <circle cx="112" cy="104" r="24" class="f100"/>
    </g>
    <g class="pb">
      <rect x="214" y="92" width="14" height="14" rx="4" class="f500"/><rect x="236" y="95" width="62" height="8" rx="4" class="f0"/>
      <rect x="214" y="118" width="14" height="14" rx="4" class="f700"/><rect x="236" y="121" width="44" height="8" rx="4" class="f0"/>
      <rect x="214" y="144" width="14" height="14" rx="4" class="fg"/><rect x="236" y="147" width="54" height="8" rx="4" class="f0"/>
    </g>
    ${dimH(46, 178, 190, L)}`;
  },
];

M.res = [
  function book(r: () => number, L: string): string {
    let lines = '';
    for (let i = 0; i < 4; i++) {
      lines += `<rect x="${80}" y="${76 + i * 16}" width="${60 - (i % 2) * 16}" height="6" rx="3" class="f200"/>`;
      lines += `<rect x="${176}" y="${76 + i * 16}" width="${56 - (i % 3) * 10}" height="6" rx="3" class="f200"/>`;
    }
    return `<g class="pa"><circle cx="70" cy="56" r="54" class="f300"/></g>
    <g class="pb">
      <path d="M160 58 C130 44 92 44 62 54 V160 C92 150 130 150 160 162 Z" class="f0"/>
      <path d="M160 58 C190 44 228 44 258 54 V160 C228 150 190 150 160 162 Z" class="f0"/>
      <path d="M160 58V162" class="s300" stroke-width="2"/>
      ${lines}
    </g>
    <g class="pc" style="--ox:246px;--oy:128px">
      <circle cx="246" cy="128" r="30" class="f200 s900" stroke-width="9" fill-opacity=".55"/>
      <path d="M268 150 L292 174" class="s900 rnd" stroke-width="12"/>
    </g>
    <text class="dim" x="30" y="186">${L}</text>`;
  },
  function ripples(r: () => number, L: string): string {
    let papers = '';
    ([[196, 44, -6], [212, 64, 4], [206, 86, -2]] as const).forEach(([x, y, a], i) => {
      papers += `<g transform="rotate(${a} ${x + 44} ${y + 34})"><rect x="${x}" y="${y}" width="88" height="68" rx="10" class="${i === 2 ? 'f0' : 'f200'}"/>` +
        (i === 2 ? `<rect x="${x + 12}" y="${y + 14}" width="50" height="6" rx="3" class="f500"/><rect x="${x + 12}" y="${y + 28}" width="62" height="6" rx="3" class="f200"/><rect x="${x + 12}" y="${y + 42}" width="40" height="6" rx="3" class="f200"/><circle cx="${x + 74}" cy="${y + 52}" r="5" class="fg"/>` : '') + `</g>`;
    });
    return `<circle cx="104" cy="112" r="86" class="s200 fnone" stroke-width="3"/>
    <circle cx="104" cy="112" r="64" class="s300 fnone" stroke-width="3"/>
    <g class="pa"><circle cx="104" cy="112" r="42" class="s500 fnone" stroke-width="3.5"/></g>
    <circle cx="104" cy="112" r="20" class="f700"/>
    <g class="pb">${papers}</g>
    <text class="dim" x="212" y="186">${L}</text>`;
  },
];

M.build = [
  function arches(r: () => number, L: string): string {
    return `<g class="pa"><circle cx="156" cy="66" r="74" class="f200"/></g>
    <g class="pb">
      <path d="M36 170V104A32 32 0 0 1 100 104V170Z" class="f500"/>
      <path d="M114 170V90A42 42 0 0 1 198 90V170Z" class="f0"/>
      <path d="M136 170V108A20 20 0 0 1 176 108V170Z" class="f300"/>
      <path d="M212 170V116A30 30 0 0 1 272 116V170Z" class="f700"/>
    </g>
    <circle cx="284" cy="46" r="12" class="fg"/>
    <path d="M20 170H300" class="s700" stroke-width="2"/>
    ${dimH(114, 198, 188, L)}`;
  },
  function skyline(r: () => number, L: string): string {
    let win = '';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) win += `<rect x="${112 + i * 14}" y="${74 + j * 18}" width="8" height="10" rx="2" class="${i === 2 && j === 1 ? 'fg' : 'f0'}"/>`;
    return `<g class="pa"><circle cx="96" cy="70" r="62" class="f200"/></g>
    <g class="pb">
      <rect x="36" y="100" width="56" height="70" rx="6" class="f300"/>
      <rect x="100" y="58" width="62" height="112" rx="6" class="f500"/>${win}
      <rect x="170" y="112" width="42" height="58" rx="6" class="f700"/>
      <path d="M170 112 L191 94 L212 112Z" class="f700"/>
      <rect x="220" y="88" width="36" height="82" rx="6" class="f0"/>
    </g>
    <path d="M278 170V34M244 34H310M292 34V64M252 34V48" class="s900 rnd fnone" stroke-width="4"/>
    <rect x="286" y="64" width="12" height="10" rx="2" class="fg"/>
    <path d="M20 170H300" class="s700" stroke-width="2"/>
    ${dimH(36, 162, 188, L)}`;
  },
];

M.trans = [
  function route(r: () => number, L: string): string {
    return `<g class="pa"><circle cx="72" cy="160" r="84" class="f200"/></g>
    <path d="M40 150 C 96 150, 92 62, 150 62 S 214 150, 272 74" class="s500 rnd fnone" stroke-width="16"/>
    <path d="M40 150 C 96 150, 92 62, 150 62 S 214 150, 272 74" class="s0 fnone" stroke-width="2.5" stroke-dasharray="7 9"/>
    <g class="pb">
      <circle cx="40" cy="150" r="12" class="f0 s900" stroke-width="4"/>
      <circle cx="150" cy="62" r="9" class="f900"/>
      <path d="M272 78 C260 64 254 56 254 46 A18 18 0 0 1 290 46 C290 56 284 64 272 78Z" class="fg"/>
      <circle cx="272" cy="46" r="6.5" class="f0"/>
    </g>
    ${dimH(170, 300, 186, L)}`;
  },
  function tram(r: () => number, L: string): string {
    return `<g class="pa"><circle cx="258" cy="46" r="56" class="f200"/></g>
    <path d="M150 58 L136 34 L166 18" class="s900 rnd fnone" stroke-width="3"/>
    <g class="pb">
      <rect x="44" y="58" width="220" height="90" rx="24" class="f500"/>
      <rect x="64" y="76" width="46" height="34" rx="9" class="f0"/><rect x="120" y="76" width="46" height="34" rx="9" class="f0"/><rect x="176" y="76" width="46" height="34" rx="9" class="f0"/>
      <rect x="232" y="76" width="18" height="50" rx="7" class="f300"/>
      <rect x="64" y="122" width="158" height="6" rx="3" class="f700"/>
    </g>
    <circle cx="98" cy="156" r="16" class="f900"/><circle cx="98" cy="156" r="5" class="f0"/>
    <circle cx="210" cy="156" r="16" class="f900"/><circle cx="210" cy="156" r="5" class="f0"/>
    <path d="M16 174H304" class="s700" stroke-width="3"/>
    <path d="M40 174v8M80 174v8M120 174v8M160 174v8M200 174v8M240 174v8M280 174v8" class="s700" stroke-width="2" opacity=".6"/>
    <circle cx="44" cy="40" r="8" class="fg"/>
    <text class="dim" x="232" y="194">${L}</text>`;
  },
];

M.energy = [
  function sun(r: () => number, L: string): string {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x1 = 108 + Math.cos(a) * 54, y1 = 88 + Math.sin(a) * 54, x2 = 108 + Math.cos(a) * 68, y2 = 88 + Math.sin(a) * 68;
      rays += `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
    const wave = (y: number, amp: number, ph: number) => { let d = `M0 ${y}`; for (let x = 0; x <= 320; x += 10) d += `L${x} ${(y + Math.sin(x / 26 + ph) * amp).toFixed(1)}`; return d; };
    return `<g class="pc" style="--ox:108px;--oy:88px"><path d="${rays}" class="s500 rnd" stroke-width="7"/></g>
    <circle cx="108" cy="88" r="40" class="f500"/>
    <circle cx="96" cy="76" r="12" class="f300"/>
    <g class="pb"><path d="${wave(152, 8, 0)}" class="s300 rnd fnone" stroke-width="7"/><path d="${wave(174, 8, 1.4)}" class="s700 rnd fnone" stroke-width="7"/></g>
    <circle cx="266" cy="56" r="10" class="fg"/>
    ${dimH(196, 300, 104, L)}`;
  },
  function panel(r: () => number, L: string): string {
    let g = '';
    for (let i = 1; i < 4; i++) { const t = i / 4; g += `M${70 + 160 * t} 150L${110 + 160 * t} 70`; }
    for (let j = 1; j < 3; j++) { const t = j / 3; g += `M${70 + 40 * t} ${150 - 80 * t}L${230 + 40 * t} ${150 - 80 * t}`; }
    return `<g class="pa"><circle cx="262" cy="46" r="30" class="fg"/><circle cx="262" cy="46" r="48" class="s200 fnone" stroke-width="6"/></g>
    <g class="pb">
      <polygon points="70,150 230,150 270,70 110,70" class="f700"/>
      <path d="${g}" class="s300" stroke-width="3"/>
      <path d="M150 150V176M120 176H180" class="s900 rnd" stroke-width="6"/>
    </g>
    <path d="M40 66 l14 -22 h-10 l8 -18" class="s500 rnd fnone" stroke-width="5"/>
    ${dimH(70, 230, 190, L)}`;
  },
];

/* seed -> {variant, label}; `variant` may be forced for previews */
function coverSvg(cat: ArtKind, seed: number, opts: { variant?: number } = {}): string {
  const r = rng(seed);
  const list = M[cat] ?? M.it!;
  const v = opts.variant != null ? opts.variant % list.length : Math.floor(r() * list.length);
  const L = pick(r, LABELS[cat] || LABELS.it);
  const body = list[v](r, L);
  return `<svg class="art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <rect width="320" height="200" class="f100"/>${gridPath(320, 200, 20)}${body}</svg>`;
}

/** A 320×200 course cover in the category's colours. */
export function coverArt(kind: ArtKind, seedSource: string, variant?: number): string {
  return coverSvg(kind, hash(seedSource), variant == null ? {} : { variant });
}
