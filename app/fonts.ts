import { Albert_Sans, JetBrains_Mono, Onest } from "next/font/google";

// Three families, each with one job, and every one of them has to carry
// Azerbaijani: "latin" alone does not include ə, ğ, ş, ı or İ (they live in
// "latin-ext"), and several popular faces (Manrope, Figtree, Outfit, Sora,
// Rubik) have no ə at all, so the browser draws it from a fallback font in the
// middle of a word. All three below were checked letter by letter.
//
//   Albert Sans     display and titles: tight and heavy
//   Onest           interface and reading text
//   JetBrains Mono  technical annotations only (dimension labels, durations,
//                   counts) — never words people have to read
//
// Declared once here because three documents use them: the [lang] root
// layout, and global-not-found / global-error, which render their own <html>.
export const display = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const sans = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const mono = JetBrains_Mono({
  variable: "--font-jbm",
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  display: "swap",
});

/** The class list every document's <html> carries. */
export const htmlClassName = `${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`;

/** The class list every document's <body> carries. */
export const bodyClassName = "min-h-full flex flex-col bg-paper text-ink";
