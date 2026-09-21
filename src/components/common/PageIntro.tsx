import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Eyebrow } from "./SectionHeading";

/**
 * The opening of every inner page — catalogue, categories, experts, the
 * student area. It sits directly on the page background rather than in a
 * banded strip, so the first card below it is the first object on the page.
 *
 * `aside` takes the right-hand column on wide screens (a search box, a
 * primary action) and drops below the text on narrow ones. `children` runs
 * full width underneath, for tabs or filter chips that belong to the intro.
 */
export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
  breadcrumbs,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  breadcrumbs?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("container-fluid pt-8 pb-8 sm:pt-12 sm:pb-10", className)}>
      {breadcrumbs ? <div className="mb-6">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-2xl">
          {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
          <h1 className="font-display text-balance text-4xl leading-[1.05] sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {aside ? <div className="w-full shrink-0 lg:w-auto lg:min-w-[22rem]">{aside}</div> : null}
      </div>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  );
}
