import Link from "next/link";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/utils/format";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { CoverArt } from "@/components/cover/CoverArt";
import s from "./Shelf.module.css";

/** More spines than this stop reading as books on a shelf. */
const MAX_SPINES = 10;

/**
 * The closing shelf: every category that has courses as a tall poster
 * spine (sortOrder, at most ten; eight where the shelf is narrow, see the
 * CSS), linking to the catalogue filtered to it.
 * Empty categories are left off (D6), so every spine leads somewhere.
 */
export async function Shelf({
  locale,
  items,
}: {
  locale: Locale;
  /** Categories with at least one published course, in sortOrder. */
  items: { ref: CategoryRef; count: number }[];
}) {
  const t = await getT(locale);
  const shown = items.slice(0, MAX_SPINES);
  if (!shown.length) return null;
  // A spine is roughly 1.2 / n as wide as the shelf is tall. From four spines
  // up the prototype's thin 0.3 drawing holds; fewer, wider spines are drawn
  // closer to their real shape, so the motif is not cropped to a few blocks.
  const ratio = Math.max(0.3, 1.2 / shown.length);

  return (
    <nav aria-label={t("ui.fields")} className={s.shelf}>
      {shown.map(({ ref, count }, i) => (
        <Link
          key={ref.id}
          href={localeHref(locale, `/courses?categoryId=${ref.id}`)}
          className={s.spine}
          aria-label={t("home.spineLabel", { name: ref.name, n: formatNumber(count, locale), count })}
          {...catAttrs(ref)}
        >
          <CoverArt cat={ref.key} seed={i * 5 + 1} ratio={ratio} noTech className="absolute inset-0 size-full" />
          <b className={s.label} aria-hidden="true">
            {ref.short}
          </b>
        </Link>
      ))}
    </nav>
  );
}
