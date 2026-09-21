/**
 * Turns a profile's stored link fields into hrefs that are safe to render.
 *
 * The API validates new values as http(s) URLs, but `websiteUrl` and
 * `linkedinUrl` were accepted unchecked at application time, so older rows can
 * hold a bare "www.example.az" (which would render as a link relative to this
 * site) or a non-web scheme. Anything that is not plainly a web address is
 * dropped rather than rendered.
 */
export function externalHref(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^https?:\/\/[^\s]+$/i.test(value)) return value;
  // A host with at least one dot and no scheme: "linkedin.com/in/x". The dot
  // requirement is what keeps "javascript:…" and similar out.
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#:][^\s]*)?$/i.test(value)) {
    return `https://${value}`;
  }
  return null;
}

const ORCID_ID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;

/**
 * The API stores the bare ORCID iD, so the profile URL is built here. A value
 * someone pasted as a full URL still works through `externalHref`.
 */
export function orcidHref(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (ORCID_ID.test(value)) return `https://orcid.org/${value.toUpperCase()}`;
  return externalHref(value);
}
