import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Tag } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LinkGo } from "@/components/ui/link-go";
import { Dept } from "@/components/editorial/Dept";
import { Kicker } from "@/components/editorial/Kicker";
import { Note } from "@/components/editorial/Note";
import { ExpertAvatar } from "@/features/expert/components/ExpertAvatar";
import { expertServerApi } from "@/features/expert/api.server";
import { externalHref } from "@/features/expert/links";
import { fullExpertName, type ExpertApprovalStatus } from "@/features/expert/types";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { formatRating } from "@/lib/utils/format";
import { AccountIntro } from "../_components/AccountIntro";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  // The section's own name ("Ekspert"), as in the account index: the page is
  // an invitation for most participants, a profile only for applicants.
  return { title: t("nav.tutor") };
}

const STATUS: Record<ExpertApprovalStatus, { key: string; variant: "mono" | "gold" | "ink"; className?: string }> = {
  PENDING: { key: "student.tutorStatusPending", variant: "gold" },
  APPROVED: { key: "student.tutorStatusApproved", variant: "ink" },
  REJECTED: { key: "student.tutorStatusRejected", variant: "mono", className: "border-danger text-danger" },
  SUSPENDED: { key: "student.tutorStatusSuspended", variant: "mono", className: "text-ink-3" },
};

export default async function MyExpertProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const profile = await expertServerApi.myProfile().catch(() => null);

  // No application yet: the page is the invitation itself, so the heading is
  // "Ekspert olun" (Become an expert) rather than "My expert profile" — there
  // is no profile to speak of — and the card under it carries only the pitch
  // and the button, not the same heading a second time.
  if (!profile) {
    return (
      <div>
        <AccountIntro eyebrow={t("student.areaEyebrow")} title={t("auth.tutorRegisterTitle")} />
        {/* The same dashed gold invitation the home page uses. */}
        <section className="invite mt-10 p-6 md:mt-14 md:p-10">
          <Kicker tone="gold">{t("nav.tutor")}</Kicker>
          <p className="t-lead mt-4 max-w-[52ch] text-ink">{t("auth.tutorRegisterSubtitle")}</p>
          <Link
            href={localeHref(locale, "/register/tutor")}
            className={`${buttonVariants()} mt-7 w-full sm:w-auto`}
          >
            {t("student.tutorApplyCta")}
            <ArrowRight aria-hidden="true" data-go />
          </Link>
        </section>
      </div>
    );
  }

  const name = fullExpertName(profile);
  const status = STATUS[profile.approvalStatus];
  const approved = profile.approvalStatus === "APPROVED";
  const affiliation = [profile.academicTitle, profile.department].filter(Boolean).join(" · ");
  const links = [
    { href: externalHref(profile.websiteUrl), label: t("experts.website") },
    { href: externalHref(profile.linkedinUrl), label: t("experts.linkedin") },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));
  const facts = [
    profile.yearsExperience ? t("experts.years", { count: profile.yearsExperience }) : null,
    // No rating yet is simply left out: never "0,0" or an empty star.
    profile.ratingCount > 0
      ? `★ ${formatRating(profile.ratingAvg, locale)} · ${t("experts.reviews", { count: profile.ratingCount })}`
      : null,
    profile.expertiseCategoryIds.length
      ? t("experts.specialties", { count: profile.expertiseCategoryIds.length })
      : null,
  ].filter((f): f is string => Boolean(f));

  return (
    <div>
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("experts.myProfile")}
        description={t("student.tutorSubtitle")}
        aside={
          approved ? (
            <LinkGo href={localeHref(locale, `/experts/${profile.id}`)}>{t("student.tutorPublicProfile")}</LinkGo>
          ) : null
        }
      />

      <section className="mt-10 grid gap-6 border-t border-line-strong pt-8 md:mt-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="flex min-w-0 items-start gap-5">
          <ExpertAvatar name={name} avatarUrl={profile.avatarUrl} sizes="72px" size={72} />
          <div className="min-w-0">
            <h2 className="t-title-l break-words">{name}</h2>
            {affiliation ? <p className="t-meta mt-1 text-[15px]">{affiliation}</p> : null}
            {profile.headline ? <p className="t-body mt-3 max-w-[56ch]">{profile.headline}</p> : null}
          </div>
        </div>
        <div className="md:text-right">
          <Kicker tone="ink-3">{t("student.tutorStatus")}</Kicker>
          <div className="mt-2">
            <Tag variant={status.variant} className={status.className}>
              {t(status.key)}
            </Tag>
          </div>
        </div>
      </section>

      {profile.approvalStatus === "PENDING" ? (
        <Note className="mt-8">{t("auth.tutorApprovalNote")}</Note>
      ) : null}

      {facts.length ? (
        <ul className="mt-8 flex flex-wrap gap-2">
          {facts.map((f) => (
            <li key={f}>
              <Tag variant="case">{f}</Tag>
            </li>
          ))}
        </ul>
      ) : null}

      {profile.bio ? (
        <section aria-labelledby="tutor-about" className="mt-12 md:mt-16">
          <Dept number="01" id="tutor-about" label={t("experts.about")} />
          <div className="prose mt-6">
            {profile.bio
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
          </div>
        </section>
      ) : null}

      {links.length ? (
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
          {links.map((l) => (
            <LinkGo key={l.href} href={l.href} external className="t-small">
              {l.label}
            </LinkGo>
          ))}
        </div>
      ) : null}
    </div>
  );
}
