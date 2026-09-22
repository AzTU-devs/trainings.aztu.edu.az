import { Cormorant_Garamond } from "next/font/google";

// The certificate's one serif. A formal document reads as one partly through
// its type, and none of the site's three faces (app/fonts.ts) is a serif.
// Cormorant Garamond was checked letter by letter for Azerbaijani (ə, Ə, İ, ı,
// ğ, ş) — Cinzel, Marcellus, DM Serif and Bodoni Moda, the usual certificate
// faces, have no ə. Variable weight, both styles: the title and course use the
// upright, the recipient's name the italic.
//
// Not preloaded: the certificate sits below the fold on every page that shows
// it, and a preload here would compete with the hero for the first paint.
export const certSerif = Cormorant_Garamond({
  variable: "--font-cert-serif",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});
