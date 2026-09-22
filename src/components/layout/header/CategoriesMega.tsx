"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { LocaleLink } from "@/i18n/LocaleLink";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { toCategoryRef } from "@/features/category/style";
import { CategorySwatch } from "@/components/cover/CourseCover";
import { LinkGo } from "@/components/ui/link-go";
import { usePopover } from "./usePopover";
import { menuOrder, useCategoryCounts, useHeaderCategories } from "./useCategoryCounts";
import { NAV_ITEM } from "./navItem";

/**
 * "Kateqoriyalar ▾": a full-width panel under the bar with every category as
 * its poster swatch, name and real course count. A category with no courses
 * is muted and not a link (D6). While the counts load, names show without a
 * count and stay links.
 *
 * The root is deliberately not positioned: the panel is placed against the
 * sticky <header>, so it spans the whole bar.
 */
export function CategoriesMega({ active }: { active: boolean }) {
  const t = useT();
  const locale = useLocale();
  const { open, setOpen, rootRef, triggerRef, panelRef, panelId, onBlur, onPanelKeyDown, onTriggerKeyDown } =
    usePopover();
  // Categories are fetched only once someone shows interest in the menu —
  // hovering or focusing the trigger warms the cache before the click.
  const [wanted, setWanted] = useState(false);
  const { categories: all, isPending, isError } = useHeaderCategories(wanted || open);
  // Counts load on the same interest signal, so they are usually in by the click.
  const counts = useCategoryCounts(all, wanted || open);
  const categories = menuOrder(all, counts);
  // The fields a visitor can open: every category not known to be empty.
  const fieldCount = all.filter((c) => counts[c.id] !== 0).length;
  const close = () => setOpen(false);

  return (
    <div ref={rootRef} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        onPointerEnter={() => setWanted(true)}
        onFocus={() => setWanted(true)}
        data-current={active || undefined}
        className={cn(NAV_ITEM, "pr-3 after:right-[30px]")}
      >
        {t("nav.categories")}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.75}
          className={cn(
            "size-4 text-ink-3 transition-transform duration-(--dur-2) ease-out",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        ref={panelRef}
        role="region"
        aria-label={t("nav.categories")}
        onKeyDown={onPanelKeyDown}
        className={cn(
          "absolute inset-x-0 top-full border-b border-line-strong bg-card shadow-pop",
          open ? "block motion-safe:animate-[drop-in_var(--dur-2)_var(--ease-out)]" : "hidden",
        )}
      >
        <div className="wrap pt-7 pb-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line-strong pt-3">
            {/* The gold slot before a label holds a section number everywhere
                else, and "12 Sahələr" is not Azerbaijani, so the count is a
                superscript, as on the page titles ("Kateqoriyalar¹²"). */}
            <span className="t-kicker text-ink-2">
              {t("ui.fields")}
              {fieldCount ? (
                <>
                  <sup aria-hidden="true" className="ml-1.5 font-mono text-xs font-medium text-gold-ink">
                    {formatNumber(fieldCount, locale)}
                  </sup>
                  <span className="sr-only"> · {t("ui.fieldCount", { n: formatNumber(fieldCount, locale), count: fieldCount })}</span>
                </>
              ) : null}
            </span>
            <span className="flex flex-wrap items-baseline gap-x-6">
              <LinkGo href={localeHref(locale, "/categories")} className="t-small">
                {t("nav.allCategories")}
              </LinkGo>
              <LinkGo href={localeHref(locale, "/courses")} className="t-small">
                {t("ui.allCourses")}
              </LinkGo>
            </span>
          </div>

          {isPending && !categories.length ? (
            <div className="grid grid-cols-4 gap-x-(--gutter) gap-y-1" aria-busy="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex items-center gap-3.5 py-3">
                  <div className="size-14 rounded-tag bg-paper-2" />
                  <div className="h-3 w-2/3 rounded-tag bg-paper-2" />
                </div>
              ))}
            </div>
          ) : isError || !categories.length ? (
            <p className="t-small py-3 text-ink-3">{t("nav.categoriesUnavailable")}</p>
          ) : (
            <ul className="grid grid-cols-4 gap-x-(--gutter) gap-y-1">
              {categories.map((c) => {
                const ref = toCategoryRef(c, t, locale);
                const n = counts[c.id];
                const zero = n === 0;
                const inner = (
                  <>
                    <CategorySwatch category={ref} className={cn("rounded-tag", zero && "grayscale-[.85]")} />
                    <span className="min-w-0">
                      <b lang={ref.lang} className="block text-[15px] leading-[1.3] font-semibold text-ink [overflow-wrap:anywhere]">
                        {ref.name}
                      </b>
                      <small className="mt-[3px] block font-mono text-xs tracking-[0.06em] text-ink-3 uppercase">
                        {n === undefined
                          ? " "
                          : zero
                            ? t("ui.noCoursesYet")
                            : t("ui.courseCount", { n: formatNumber(n, locale), count: n })}
                      </small>
                    </span>
                  </>
                );
                const cls =
                  "-mx-3 grid grid-cols-[56px_minmax(0,1fr)] items-center gap-3.5 rounded-[6px] p-3 transition-colors duration-(--dur-1)";
                return (
                  <li key={c.id}>
                    {zero ? (
                      <span aria-disabled="true" className={cn(cls, "opacity-55")}>
                        {inner}
                      </span>
                    ) : (
                      <LocaleLink
                        href={`/courses?categoryId=${c.id}`}
                        onClick={close}
                        className={cn(cls, "hover:bg-paper-2 focus-visible:bg-paper-2")}
                      >
                        {inner}
                      </LocaleLink>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
