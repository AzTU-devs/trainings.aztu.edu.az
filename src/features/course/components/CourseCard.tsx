import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocaleLink } from "@/i18n/LocaleLink";
import { formatPrice, formatRating, formatCompact } from "@/lib/utils/format";
import type { CourseSummary } from "../types";

/**
 * Courses have no cover art yet, so each card generates one. The previous
 * version hashed the slug into a random hue, which produced a rainbow grid at
 * odds with the brand; this walks a fixed set of navy-and-gold gradients
 * instead, so the catalogue reads as one family while cards stay distinct.
 */
const COVERS = [
  "from-navy-500 via-navy-700 to-navy-950",
  "from-navy-600 via-navy-800 to-[#0b2545]",
  "from-[#1f6d8c] via-navy-700 to-navy-950",
  "from-gold-500 via-gold-700 to-navy-800",
  "from-navy-400 via-navy-600 to-navy-900",
  "from-[#2a5f7a] via-navy-800 to-navy-950",
] as const;

function coverFor(slug: string) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return COVERS[Math.abs(h) % COVERS.length];
}

export function CourseCard({ course }: { course: CourseSummary }) {
  const initials = course.title
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <LocaleLink
      href={`/courses/${course.slug}`}
      prefetch
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-3"
    >
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br ${coverFor(course.slug)}`}
      >
        <span
          aria-hidden
          className="absolute -right-8 -top-12 size-40 rounded-full bg-[radial-gradient(circle,rgba(200,169,81,0.4)_0%,transparent_65%)] blur-2xl"
        />
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center font-display text-5xl tracking-tight text-white/25 transition-transform duration-500 group-hover:scale-105"
        >
          {initials}
        </span>
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge variant="onDeep">
            {course.courseType === "ONLINE" ? "Online" : "Offline"}
          </Badge>
          {course.free ? <Badge variant="gold">Free</Badge> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <span>{course.level === "ALL" ? "All levels" : course.level.toLowerCase()}</span>
          <span aria-hidden className="size-0.5 rounded-full bg-current" />
          <span>{course.language?.toUpperCase()}</span>
        </div>

        <h3 className="mt-2.5 line-clamp-2 font-display text-[17px] leading-snug transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        {course.subtitle ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.subtitle}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">{course.tutorDisplayName}</p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 text-xs">
          <div className="flex items-center gap-3.5">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Star className="size-3.5 fill-gold-500 text-gold-500" />
              {formatRating(course.ratingAvg)}
              <span className="font-normal text-muted-foreground">
                ({formatCompact(course.ratingCount)})
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              {formatCompact(course.enrolledCount)}
            </span>
          </div>
          <div className="font-display text-base">
            {course.free ? "Free" : formatPrice(course.price, course.currency)}
          </div>
        </div>
      </div>
    </LocaleLink>
  );
}
