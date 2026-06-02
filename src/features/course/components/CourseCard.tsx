import { Star, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LocaleLink } from "@/i18n/LocaleLink";
import { formatPrice, formatRating, formatCompact } from "@/lib/utils/format";
import type { CourseSummary } from "../types";

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

export function CourseCard({ course }: { course: CourseSummary }) {
  const h1 = hashHue(course.slug);
  const h2 = (h1 + 60) % 360;
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-primary/5"
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, hsl(${h1} 78% 60%), hsl(${h2} 78% 45%))`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-5xl font-black tracking-tight text-white/90 mix-blend-overlay"
        >
          {initials}
        </span>
        <span
          aria-hidden
          className="absolute -inset-y-12 -right-12 w-32 rotate-12 bg-white/15 blur-xl"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge
            variant={course.courseType === "ONLINE" ? "default" : "secondary"}
            className="border-0 backdrop-blur-md bg-black/40 text-white"
          >
            {course.courseType === "ONLINE" ? "Online" : "Offline"}
          </Badge>
          {course.free ? (
            <Badge className="border-0 bg-emerald-500/90 text-white">Free</Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{course.level === "ALL" ? "All levels" : course.level.toLowerCase()}</span>
          <span aria-hidden>·</span>
          <span>{course.language?.toUpperCase()}</span>
        </div>
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-primary">
          {course.title}
        </h3>
        {course.subtitle ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">{course.tutorDisplayName}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {formatRating(course.ratingAvg)}
              <span className="text-muted-foreground">
                ({formatCompact(course.ratingCount)})
              </span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="size-3.5" />
              {formatCompact(course.enrolledCount)}
            </span>
          </div>
          <div className="text-base font-semibold">
            {course.free ? "Free" : formatPrice(course.price, course.currency)}
          </div>
        </div>
      </div>
    </LocaleLink>
  );
}
