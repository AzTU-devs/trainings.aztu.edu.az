import type { ReactNode } from "react";
import { hasRichText, isRichHtml, sanitizeRichHtml } from "@/lib/rich-text.server";
import { cn } from "@/lib/utils/cn";

/**
 * A rich-text field (see src/lib/rich-text.server.ts), rendered by the one
 * rule every reader applies: HTML is sanitized to the allowlist and set as
 * HTML, styled by `.rich` (globals.css); anything else is plain text with its
 * line breaks kept. Renders nothing for an empty value, "<p></p>" included.
 *
 * A server component: the sanitizer stays on the server. A client component
 * that shows one of these fields gets it already rendered, as a prop.
 *
 * `plain` lays out a plain-text value another way — the course page turns an
 * older course's one-outcome-per-line text into its checklist — and is never
 * used for HTML, so it cannot bypass the sanitizer.
 */
export function RichText({
  value,
  className,
  plain,
}: {
  value: string | null | undefined;
  className?: string;
  plain?: (text: string) => ReactNode;
}) {
  if (!hasRichText(value)) return null;
  if (isRichHtml(value)) {
    return <div className={cn("rich", className)} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(value) }} />;
  }
  const text = value.trim();
  return plain ? plain(text) : <div className={cn("whitespace-pre-line", className)}>{text}</div>;
}
