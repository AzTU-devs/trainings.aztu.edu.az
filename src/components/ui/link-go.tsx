import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The editorial "read more" link: 600 weight, a gold underline that grows on
 * hover and an arrow that nudges. `href` is already localised (localeHref).
 * `external` opens a new tab with the up-right arrow and a safe `rel`.
 */
export function LinkGo({
  href,
  children,
  external = false,
  className,
  "aria-label": ariaLabel,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  if (external || /^(mailto:|tel:)/.test(href)) {
    const newTab = external;
    return (
      <a
        href={href}
        className={cn("link-go", className)}
        aria-label={ariaLabel}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
        {newTab ? (
          <ArrowUpRight aria-hidden="true" strokeWidth={1.75} />
        ) : (
          <ArrowRight aria-hidden="true" strokeWidth={1.75} />
        )}
      </a>
    );
  }
  return (
    <Link href={href} className={cn("link-go", className)} aria-label={ariaLabel}>
      {children}
      <ArrowRight aria-hidden="true" strokeWidth={1.75} />
    </Link>
  );
}
