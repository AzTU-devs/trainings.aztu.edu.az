import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

// One family for both text and headings; headings differ by weight and
// tracking alone. It has to carry Azerbaijani, and that decides the choice:
// "latin" alone does not include ə, ğ, ş, ı or İ — they live in "latin-ext" —
// and several popular faces (Manrope, Figtree, Outfit, Sora, Rubik) have no ə
// at all, so the browser drew it from a fallback font in the middle of a word.
// Plus Jakarta Sans has every letter of the alphabet in both cases.
//
// Declared once here because three documents use them: the [lang] root
// layout, and global-not-found / global-error, which render their own <html>.
export const sans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

/** The class list every document's <html> carries. */
export const htmlClassName = `${sans.variable} ${mono.variable} h-full antialiased`;

/** The class list every document's <body> carries. */
export const bodyClassName = "min-h-full flex flex-col bg-background text-foreground";
