import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Kicker } from "@/components/editorial/Kicker";
import { LinkGo } from "@/components/ui/link-go";

/**
 * The page every auth route is set on: no card and no icon, just type — a
 * mono kicker, the Fraunces title and a short dek, then the form. `footer`
 * holds the ways out of the page (the "no account? / have an account?"
 * switch, the way back to sign-in) under an ink rule; `note` is small print
 * below it.
 */
export function AuthCard({
  kicker,
  title,
  subtitle,
  children,
  footer,
  note,
}: {
  kicker: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  note?: ReactNode;
}) {
  // One width for every auth page: the sign-up forms need 34rem for their
  // two-column rows, and the shorter pages share it so that moving between
  // them (sign-in ↔ sign-up, sign-in → forgot password) leaves the kicker and
  // the title where they were.
  return (
    <div className="w-full max-w-[34rem]">
      <header>
        <Kicker tone="gold">{kicker}</Kicker>
        <h1 className="t-display-m mt-4">{title}</h1>
        {subtitle ? <p className="t-body mt-3 max-w-[44ch]">{subtitle}</p> : null}
      </header>

      <div className="mt-9">{children}</div>

      {footer ? <div className="mt-12">{footer}</div> : null}

      {note ? <p className="t-meta mt-6">{note}</p> : null}
    </div>
  );
}

/**
 * The ways out of an auth page as index rows under an ink rule: a quiet
 * question on the left, the link on the right (wrapping under it on narrow
 * phones). `portal` links leave for the expert portal in the same tab, as
 * they always have, so they get the up-right arrow without a new tab.
 */
export function AuthLinks({
  items,
}: {
  items: { label: ReactNode; href: string; cta: ReactNode; portal?: boolean }[];
}) {
  return (
    <ul className="border-t border-line-strong">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-line py-3.5"
        >
          <span className="t-meta">{item.label}</span>
          {item.portal ? (
            <a href={item.href} className="link-go t-small">
              {item.cta}
              <ArrowUpRight aria-hidden="true" strokeWidth={1.75} />
            </a>
          ) : (
            <LinkGo href={item.href} className="t-small">
              {item.cta}
            </LinkGo>
          )}
        </li>
      ))}
    </ul>
  );
}

/** The quiet way back to sign-in on the recovery pages. */
export function AuthBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="border-t border-line-strong pt-4">
      <Link
        href={href}
        className="link-go t-small hover:[&>svg]:-translate-x-[3px]"
      >
        <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
        {children}
      </Link>
    </div>
  );
}
