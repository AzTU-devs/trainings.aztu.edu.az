import type { ReactNode } from "react";
import { Kicker } from "@/components/editorial/Kicker";
import { cn } from "@/lib/utils/cn";

/**
 * The opening of every page in the signed-in area: a mono kicker, the title
 * in the display face and a lead, with an optional action column on the
 * right. The same anatomy as PageIntro, one step smaller, because it shares
 * the row with the section index and carries no page gutters of its own.
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
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10",
        className,
      )}
    >
      <div className="min-w-0 max-w-[46rem]">
        {eyebrow ? <Kicker tone="ink-3">{eyebrow}</Kicker> : null}
        <h1 className="t-display-l mt-4">{title}</h1>
        {description ? <p className="t-lead mt-4 max-w-[52ch]">{description}</p> : null}
      </div>
      {aside ? <div className="flex shrink-0 flex-wrap items-center gap-3 md:pb-1.5">{aside}</div> : null}
    </header>
  );
}
