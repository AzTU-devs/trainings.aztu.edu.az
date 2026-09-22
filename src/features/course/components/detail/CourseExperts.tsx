import Link from "next/link";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import type { CategoryRef } from "@/features/category/style";
import { Tag } from "@/components/ui/badge";
import { LinkGo } from "@/components/ui/link-go";
import { ExpertPortrait } from "@/features/expert/components/ExpertAvatar";
import type { CourseTutor } from "./CourseTitlePage";

/**
 * Tags hold one line by design, but an academic title or a field name is free
 * text from the dashboard: past the column's width it wraps inside its frame
 * instead of pushing a 320px page sideways.
 */
const WRAP_TAG = "h-auto min-h-[26px] max-w-full whitespace-normal py-1 [overflow-wrap:anywhere]";

/**
 * The "Ekspert" section: per expert a portrait (photo, or large initials in
 * their field's colour), the name, department, academic badges, headline and
 * bio, and a link to the full profile. Only profile fields are shown — no
 * course or participant stats here (they need the whole catalogue walk).
 * When the profile could not be loaded, the name, initials and link remain.
 */
export async function CourseExperts({
  tutors,
  locale,
  expertise,
}: {
  tutors: CourseTutor[];
  locale: Locale;
  /** tutorId → the expert's fields (categories), already localised. */
  expertise: Record<string, CategoryRef[]>;
}) {
  const t = await getT(locale);
  return (
    <div className="mt-8 grid gap-14">
      {tutors.map((tutor) => {
        const p = tutor.profile;
        const href = localeHref(locale, `/experts/${tutor.tutorId}`);
        const years = p?.yearsExperience && p.yearsExperience > 0 ? p.yearsExperience : null;
        const fields = expertise[tutor.tutorId] ?? [];
        // The first paragraph only, clamped: the profile has the whole bio,
        // and a clamp across a paragraph break ends on a lone "…" line.
        const bio = p?.bio?.split(/\r?\n\s*\r?\n/)[0]?.trim();
        return (
          <article
            key={tutor.tutorId}
            className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-x-5 gap-y-5 sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-x-6 lg:gap-x-8"
          >
            <ExpertPortrait
              name={tutor.displayName}
              avatarUrl={p?.avatarUrl}
              category={tutor.category}
              sizes="(max-width: 639px) 112px, 184px"
            />
            <div className="min-w-0">
              <h3 className="t-title-l [overflow-wrap:anywhere]">
                <Link
                  href={href}
                  className="decoration-gold decoration-2 underline-offset-[0.18em] hover:underline"
                >
                  {tutor.displayName}
                </Link>
              </h3>
              {p?.department ? <p className="t-meta mt-1">{p.department}</p> : null}
              {p?.academicTitle || years ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p?.academicTitle ? (
                    <Tag variant="case" className={WRAP_TAG}>
                      {p.academicTitle}
                    </Tag>
                  ) : null}
                  {years ? <Tag variant="case">{t("experts.years", { count: years })}</Tag> : null}
                </div>
              ) : null}
              {p?.headline ? (
                <p className="t-small mt-4 max-w-[48ch] text-ink-2 max-sm:hidden">{p.headline}</p>
              ) : null}
            </div>
            <div className="col-span-2 min-w-0">
              {p?.headline ? <p className="t-small mb-4 text-ink-2 sm:hidden">{p.headline}</p> : null}
              {bio ? <p className="t-body line-clamp-6 max-w-[60ch]">{bio}</p> : null}
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                {fields.length ? (
                  <ul className="flex flex-wrap gap-1.5" aria-label={t("experts.expertise")}>
                    {fields.map((f) => (
                      <li key={f.id} className="max-w-full">
                        <Tag className={WRAP_TAG}>{f.name}</Tag>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <LinkGo href={href} className="t-small">
                  {t("ui.viewProfile")}
                </LinkGo>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
