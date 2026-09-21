import type { ReactNode } from "react";
import { Eyebrow } from "@/components/common/SectionHeading";
import { cn } from "@/lib/utils/cn";

/**
 * The opening of every page in the signed-in area — the same anatomy as
 * PageIntro (eyebrow pill, bold sans title, lead paragraph, an optional
 * action column) but sized for a content column that already shares the row
 * with the account sidebar, so it carries no page gutters of its own.
 */
export function AccountIntro({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
        <h1 className="font-display text-balance text-3xl leading-[1.1] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
    </header>
  );
}
