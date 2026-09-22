import { cn } from "@/lib/utils/cn";

/**
 * The AzTU shield as inline vector (the university's mark, traced), so it
 * takes `currentColor`: navy on paper, warm ink at night, paper or gold on the
 * navy spread — with no image request and no flash between schemes.
 *
 * Decorative (`aria-hidden`) unless `title` is given.
 */
export function Shield({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 276 512"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path fill="currentColor" d="M0 0 138 47 276 0v112H0Z" />
      <path
        fill="currentColor"
        d="M0 195h97v158c0 9 3 14 10 19l31 24 31-24c7-5 10-10 10-19V195h97v201c0 38-15 62-47 80L138 512 57 476C15 458 0 434 0 396Z"
      />
    </svg>
  );
}

/**
 * The shield in a box the caller sizes (`size-*`); it letterboxes inside, so
 * it keeps its proportions at any size. Kept for existing callers; new code
 * uses `Shield` or `Logo`.
 */
export function AztuMark({
  className,
  tone = "auto",
}: {
  className?: string;
  /** `onDeep` is for the navy spread. */
  tone?: "auto" | "onDeep";
}) {
  return (
    <span
      className={cn(
        "inline-grid size-9 shrink-0 place-items-center",
        tone === "onDeep" ? "text-spread-ink" : "text-shield",
        className,
      )}
    >
      <Shield className="h-full w-auto" title="AzTU" />
    </span>
  );
}
