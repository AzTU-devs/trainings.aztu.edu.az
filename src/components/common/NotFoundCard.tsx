import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The 404 card shared by the root not-found (bilingual, no site chrome) and
 * the localised one under [lang] (one language, inside the header and
 * footer): a white card with the code on an inset navy panel, then whatever
 * copy and actions the caller puts below it.
 */
export function NotFoundCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full max-w-lg rounded-4xl border border-border/80 bg-card p-2 elev-3",
        className,
      )}
    >
      <div className="surface-deep overflow-hidden rounded-3xl px-6 py-12 text-center">
        <p
          aria-hidden
          className="font-display text-[6.5rem] font-extrabold leading-none tracking-[-0.06em] text-white sm:text-[8rem]"
        >
          4<span className="text-gold-300">0</span>4
        </p>
      </div>
      <div className="px-5 pb-6 pt-7 text-center sm:px-8 sm:pb-8">{children}</div>
    </div>
  );
}

/** The soft navy wash that sits behind the card, so the page is not bare grey. */
export function NotFoundWash() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(26_91_165/0.14),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgb(66_118_179/0.18),transparent_70%)]"
    />
  );
}
