/**
 * Characters that must not reach the page raw inside a <script> element.
 *
 * JSON.stringify escapes quotes and backslashes but leaves `<`, `>` and `&`
 * alone, and the HTML parser ends a script element at the first `</script`
 * regardless of JSON quoting. This data includes author-controlled text — a
 * course's subtitle and description — so a subtitle of
 * `</script><script>…</script>` would close this tag early and run as page
 * script. The CSP does not stop it: it allows inline scripts for Next's
 * hydration. Escaping them to their \u forms is still valid JSON, and parses
 * back to exactly the same strings.
 *
 * U+2028 and U+2029 are included because some parsers treat them as line
 * terminators inside a script, which would break the JSON.
 */
const UNSAFE_IN_SCRIPT = new RegExp("[<>&\\u2028\\u2029]", "g");

function escapeForScript(json: string): string {
  return json.replace(
    UNSAFE_IN_SCRIPT,
    (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeForScript(JSON.stringify(data)) }}
    />
  );
}
