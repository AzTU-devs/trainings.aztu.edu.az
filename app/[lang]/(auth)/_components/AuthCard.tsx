import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The white card every auth page is built on: an icon squircle, the page
 * title and a short lead, then the form. `footer` sits inside the card under a
 * hairline (the "already have an account?" switch); `note` sits below it on
 * the canvas (legal small print), so the card itself holds only what a person
 * acts on.
 */
export function AuthCard({
  icon,
  title,
  subtitle,
  children,
  footer,
  note,
  size = "default",
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  note?: ReactNode;
  /**
   * `wide` gives the sign-up forms room for two-column rows. Both sign-up
   * pages use it, so switching between the participant and expert tabs keeps
   * the card (and the tabs) in place.
   */
  size?: "default" | "wide";
}) {
  return (
    <div className={cn("w-full", size === "wide" ? "max-w-[40rem]" : "max-w-[30rem]")}>
      <div className="rounded-3xl border border-border/80 bg-card p-6 elev-2 sm:p-10">
        <header className="mb-8">
          <span
            aria-hidden
            className="grid size-12 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100 [&_svg]:size-5"
          >
            {icon}
          </span>
          <h1 className="mt-6 font-display text-balance text-3xl leading-[1.1] sm:text-[2rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2.5 text-pretty text-[15px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </header>

        {children}

        {footer ? (
          <div className="mt-8 border-t border-border/80 pt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>

      {note ? (
        <p className="mx-auto mt-5 max-w-sm text-balance text-center text-xs leading-relaxed text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

/** The quiet way back to sign-in, used in the card footer of the recovery pages. */
export function AuthBackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-full px-4 font-semibold text-primary transition-colors hover:bg-accent"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  );
}

/**
 * The "no account? / have an account?" switch in the card footer. Padding
 * grows the tap target to 40px; the negative margin keeps the line height.
 */
export function AuthFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="-my-2.5 inline-flex items-center py-2.5 font-semibold text-primary underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
