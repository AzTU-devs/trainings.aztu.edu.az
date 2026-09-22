import { Fraunces, IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";

// Three families, each chosen because it carries every Azerbaijani letter in
// every style the design uses. "latin" alone does not include ə, ğ, ş, ı or İ —
// they live in "latin-ext" — so both subsets are always loaded; otherwise the
// browser draws those letters from a fallback font in the middle of a word.
//
// Declared once here because three documents use them: the [lang] root
// layout, and global-not-found / global-error, which render their own <html>.

// Display / editorial voice. Variable wght 100–900 plus the optical-size,
// SOFT and WONK axes: display classes use "SOFT" 30, the italic highlighter
// "SOFT" 100 "WONK" 1, the brand word "SOFT" 50 at opsz 36.
export const display = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

// UI and body text. Variable 400–900; no italic file, nothing in the design
// sets sans italic.
export const sans = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Kickers, numbers, poster labels. 500 is the label weight, 400 the numerals
// in index rows.
export const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

/** The class list every document's <html> carries. */
export const htmlClassName = `${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`;

/** The class list every document's <body> carries. */
export const bodyClassName = "min-h-full flex flex-col bg-paper text-ink";
