import "server-only";
import sanitizeHtml from "sanitize-html";

/*
 * Rich text: the fields authors now write in the dashboard's Word-style editor
 * — a course's description, requirements and learning outcomes, each syllabus
 * item's description, and module and lesson descriptions. They hold HTML, but
 * older rows still hold plain text, so every reader applies one rule:
 *
 *   contains an HTML tag  → render it as SANITIZED HTML
 *   anything else         → plain text, line breaks kept (white-space: pre-line)
 *
 * The API sanitizes on write with the allowlist below and this repeats it on
 * render, so nothing reaches the page on the strength of the database alone:
 * an older row, a direct insert or a bug on the way in cannot put markup
 * outside the list into a public page.
 *
 * sanitize-html rather than DOMPurify: it parses with htmlparser2 in plain
 * JavaScript, so it runs in server components without a DOM (DOMPurify on the
 * server needs jsdom), and its options map one-to-one onto the allowlist —
 * tags, per-tag attributes, per-tag URL schemes and per-property style values.
 * This module is server-only, so none of it ships to the browser.
 */

/** The API's own test for "this value is HTML". */
const HTML_TAG = /<\/?[a-z][^>]*>/i;

export function isRichHtml(value: string | null | undefined): boolean {
  return !!value && HTML_TAG.test(value);
}

const TEXT_ALIGN = { "text-align": [/^(?:left|center|right|justify)$/] };

const LINK_HREF = /^(?:https?:\/\/|mailto:)/i;

const RICH_TEXT: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "del", "strike",
    "mark", "sub", "sup", "blockquote", "ul", "ol", "li", "a", "code", "pre", "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    ol: ["start"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
  },
  // Only text-align survives a style attribute; any other declaration, or a
  // value outside these four, is dropped (and an emptied attribute with it).
  allowedStyles: { p: TEXT_ALIGN, h2: TEXT_ALIGN, h3: TEXT_ALIGN, h4: TEXT_ALIGN },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  // Elements whose text must go with them, not stay behind as loose text.
  nonTextTags: ["script", "style", "textarea", "option", "xmp", "noscript", "iframe", "noembed", "noframes", "template", "title", "svg", "math"],
  transformTags: {
    // Every link opens in a new tab and passes on no referrer, opener or rank.
    // One whose href is not an absolute http(s) or mailto address loses every
    // attribute: an <a> without href is inert text (`.rich a:not([href])`).
    // It keeps its tag on purpose. Renaming it to a disallowed tag looks
    // neater but trips sanitize-html (2.17): the discarded tag leaves its new
    // name behind, and the next link at that depth is closed with it.
    a: (tagName, attribs): sanitizeHtml.Tag => {
      const href = attribs.href?.trim();
      return href && LINK_HREF.test(href)
        ? { tagName, attribs: { href, target: "_blank", rel: "noopener noreferrer nofollow" } }
        : { tagName, attribs: {} };
    },
    ol: (tagName, attribs): sanitizeHtml.Tag => {
      const start = attribs.start?.trim() ?? "";
      return { tagName, attribs: /^-?\d{1,6}$/.test(start) ? { start } : {} };
    },
  },
};

/** Author HTML reduced to the allowlist. For values isRichHtml() accepts. */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, RICH_TEXT);
}

const PLAIN: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  nonTextTags: RICH_TEXT.nonTextTags,
};

/** A closing block tag or a <br>: where text from separate blocks must not run together. */
const BLOCK_END = /<\/(?:p|h[1-6]|li|blockquote|pre|div|ul|ol|tr)\s*>|<br\s*\/?>|<hr\b[^>]*>/gi;

/**
 * A rich-text value as plain text: tags removed, entities decoded, whitespace
 * collapsed. What metadata and JSON-LD need, since neither may carry markup —
 * a description placed there raw would show its tags in search results, and
 * JSON-LD is where a stored XSS was closed before (see JsonLd). Plain text
 * passes through with its whitespace collapsed.
 */
export function richTextToPlain(value: string | null | undefined): string {
  if (!value) return "";
  if (!isRichHtml(value)) return value.replace(/\s+/g, " ").trim();
  // sanitize-html escapes exactly &, < and > in the text it keeps, so those
  // three are all there is to decode, and &amp; goes last.
  const text = sanitizeHtml(value.replace(BLOCK_END, "$& "), PLAIN)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
  return text.replace(/\s+/g, " ").trim();
}

/** Plain text cut to at most `max` characters, at a word boundary where there is one. */
export function plainExcerpt(value: string | null | undefined, max = 160): string {
  const text = richTextToPlain(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** Whether a rich-text value has anything to show; "<p></p>" does not. */
export function hasRichText(value: string | null | undefined): value is string {
  return richTextToPlain(value) !== "";
}
