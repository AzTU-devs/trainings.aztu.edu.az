import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { isLong } from "@/features/course/catalog";
import { Kicker } from "@/components/editorial/Kicker";

/**
 * The editorial page head for inner pages (categories, experts, the
 * participant area): breadcrumbs, a mono kicker, the h1 with an optional gold
 * superscript count, the dek at columns 1–7 and `aside` (a search box, a
 * LinkGo) at columns 8–12, bottom-aligned. `children` runs full width below.
 */
export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
  breadcrumbs,
  count,
  titleClassName,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  breadcrumbs?: ReactNode;
  /** A mono superscript after the title, e.g. the number of experts. */
  count?: string;
  titleClassName?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("wrap pt-6 lg:pt-8", className)}>
      {breadcrumbs ? <div className="mb-8 lg:mb-10">{breadcrumbs}</div> : null}
      <div className="g12 items-end gap-y-6">
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          {eyebrow ? <Kicker className="mb-4">{eyebrow}</Kicker> : null}
          <h1 className={cn("t-display-xl", typeof title === "string" && isLong(title) && "is-long", titleClassName)}>
            {title}
            {count ? (
              <sup className="ml-2 align-super font-mono text-[0.75rem] font-medium tracking-[0.06em] text-gold-ink sm:text-[0.875rem]">
                {count}
              </sup>
            ) : null}
          </h1>
          {description ? <div className="t-lead mt-5 max-w-[52ch]">{description}</div> : null}
        </div>
        {aside ? <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8">{aside}</div> : null}
      </div>
      {children ? <div className="mt-8 lg:mt-10">{children}</div> : null}
    </section>
  );
}
