import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getT } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { CategorySwatch } from "@/components/cover/CourseCover";
import { Kicker } from "@/components/editorial/Kicker";
import { catAttrs, type CategoryRef } from "../style";

export type CategoryIndexItem = {
  ref: CategoryRef;
  /** Published courses; null = unknown (its fetch failed), still shown as a link. */
  count: number | null;
  /** categoryDescription() — the API text, when it says more than the name. */
  description?: string | null;
  /** The newest course's title, the fallback second line ("Ən yeni: …"). */
  latestTitle?: string | null;
};

/**
 * The category index: one big row per category that has courses (a swatch,
 * the Fraunces name, a line of context and the count), in sortOrder. A
 * category with no published course is never a link (D6): it collapses into
 * the muted tags under "Digər sahələr — …".
 *
 * Server component: never import it from a "use client" file.
 */
export async function CategoryIndexList({
  entries,
  locale,
  hrefFor,
  numbered = false,
  className,
}: {
  entries: CategoryIndexItem[];
  locale: Locale;
  /** Already localised, e.g. (ref) => localeHref(locale, `/courses?categoryId=${ref.id}`). */
  hrefFor: (ref: CategoryRef) => string;
  numbered?: boolean;
  className?: string;
}) {
  const t = await getT(locale);
  const sorted = [...entries].sort(
    (a, b) => a.ref.sortOrder - b.ref.sortOrder || (a.ref.slug < b.ref.slug ? -1 : a.ref.slug > b.ref.slug ? 1 : 0),
  );
  const rows = sorted.filter((e) => e.count === null || e.count > 0);
  const zero = sorted.filter((e) => e.count === 0).map((e) => e.ref);

  return (
    <div className={className}>
      {rows.length ? (
        <ul className="catlist">
          {rows.map((e, i) => {
            const second = e.description || (e.latestTitle ? t("ui.latestCourse", { title: e.latestTitle }) : null);
            return (
              <li key={e.ref.id}>
                <Link
                  href={hrefFor(e.ref)}
                  className={cn("catrow", !numbered && "lg:grid-cols-[72px_minmax(0,1fr)_auto]")}
                  {...catAttrs(e.ref)}
                >
                  {numbered ? (
                    <span className="no" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  ) : null}
                  <span className="tile">
                    <CategorySwatch category={e.ref} />
                  </span>
                  <span className="min-w-0">
                    <span lang={e.ref.lang} className="nm block">
                      {e.ref.name}
                    </span>
                    {second ? <span className="ds line-clamp-2">{second}</span> : null}
                  </span>
                  <span className="ct">
                    {e.count !== null ? (
                      <span>{t("ui.courseCount", { n: formatNumber(e.count, locale), count: e.count })}</span>
                    ) : null}
                    <ArrowRight aria-hidden="true" strokeWidth={1.75} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
      {zero.length ? (
        <MutedTags label={t("ui.otherFields")} items={zero} className={rows.length ? "mt-8" : undefined} />
      ) : null}
    </div>
  );
}

/**
 * Categories without published courses, as muted dashed tags that are never
 * links, under a kicker that says why.
 */
export function MutedTags({
  label,
  items,
  className,
}: {
  label: string;
  items: CategoryRef[];
  className?: string;
}) {
  return (
    <div className={className}>
      <Kicker className="mb-3">{label}</Kicker>
      <ul className="mtags">
        {items.map((ref) => (
          <li key={ref.id} lang={ref.lang} className="mtag" {...catAttrs(ref)}>
            {ref.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
