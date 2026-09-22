import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { Dept } from "@/components/editorial/Dept";
import { LinkGo } from "@/components/ui/link-go";
import { PosterGrid } from "../PosterCard";
import type { CourseSummary } from "../../types";

/**
 * "Bu sahədə digər kurslar": up to three other courses from the course's
 * primary category, as poster cards. With none it leaves a plain spacer, so
 * the page never ends on an empty heading.
 */
export async function RelatedCourses({
  category,
  items,
  locale,
  now,
}: {
  category: CategoryRef | null;
  items: { course: CourseSummary; category: CategoryRef | null }[];
  locale: Locale;
  /** Server render time, for the cards' "Yeni" badge. */
  now: number;
}) {
  if (!category || !items.length) return <div aria-hidden="true" className="h-24 lg:h-32" />;
  const t = await getT(locale);
  return (
    <section className="wrap section" aria-labelledby="related-h" {...catAttrs(category)}>
      <Dept
        number="+"
        label={category.name}
        as="span"
        // On the narrowest phones the link drops under a long category name
        // rather than pushing the page sideways.
        className="max-[359px]:flex-wrap max-[359px]:gap-y-2"
        aside={
          <LinkGo
            href={localeHref(locale, `/courses?categoryId=${category.id}`)}
            className="t-small"
          >
            {t("courseDetail.relatedAll")}
          </LinkGo>
        }
      />
      <h2 id="related-h" className="t-display-l mt-8 mb-10 lg:mb-14">
        {t("courseDetail.relatedTitle")}
      </h2>
      <PosterGrid items={items} locale={locale} now={now} />
    </section>
  );
}
