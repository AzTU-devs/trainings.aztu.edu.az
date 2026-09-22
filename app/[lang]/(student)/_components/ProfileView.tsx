import Link from "next/link";
import type { CSSProperties } from "react";
import { BadgeCheck, MailWarning, Pencil } from "lucide-react";
import { Tag } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Dept } from "@/components/editorial/Dept";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerificationButton";
import { catAttrs } from "@/features/category/style";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";
import { fullName, type User } from "@/types/user";
import { AccountIntro } from "./AccountIntro";

/** RoleCode on the API: USER, TUTOR, ADMIN, SUPER_ADMIN. */
const ROLE_KEYS: Record<string, string> = {
  USER: "student.roleUser",
  TUTOR: "student.roleTutor",
  ADMIN: "student.roleAdmin",
  SUPER_ADMIN: "student.roleAdmin",
};

export async function ProfileView({ user, locale }: { user: User; locale: Locale }) {
  const t = await getT(locale);
  const roles = Array.from(
    new Set(user.roles.map((r) => ROLE_KEYS[r]).filter((k): k is string => Boolean(k))),
  );
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;

  const rows: { label: string; value: string }[] = [
    { label: t("student.fullName"), value: fullName(user) },
    { label: t("auth.email"), value: user.email },
    ...(user.phone ? [{ label: t("auth.phone"), value: user.phone }] : []),
    {
      label: t("student.emailStatus"),
      value: user.emailVerified ? t("student.verified") : t("student.notVerified"),
    },
    // The language named in the page's language ("İngilis dili" on /az), as
    // everywhere else on the site; an unknown code is shown as it is.
    ...(user.locale
      ? [
          {
            label: t("student.locale"),
            value: isLocale(user.locale)
              ? t("student.languageName", { name: t(`languages.${user.locale}`) })
              : user.locale,
          },
        ]
      : []),
  ];

  return (
    <div>
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("student.profileTitle")}
        description={t("student.profileSubtitle")}
        aside={
          <Link href={localeHref(locale, "/settings")} className={buttonVariants({ variant: "outline" })}>
            <Pencil aria-hidden="true" strokeWidth={1.75} /> {t("student.editProfile")}
          </Link>
        }
      />
      {!user.emailVerified ? (
        <div className="mt-10">
          <ResendVerificationButton />
        </div>
      ) : null}

      {/* Identity: initials on the navy brand ground (the account has no photo). */}
      <section className="mt-10 flex items-center gap-5 border-t border-line-strong pt-8 md:mt-14 md:gap-6">
        <span
          aria-hidden="true"
          {...catAttrs(null)}
          className="avatar"
          style={{ "--s": "72px" } as CSSProperties}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <h2 className="t-title-l break-words">{fullName(user)}</h2>
          <p className="t-meta mt-1 truncate text-[15px]">{user.email}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((key) => (
              <Tag key={key} variant="case">
                {t(key)}
              </Tag>
            ))}
            {user.emailVerified ? (
              <Tag variant="case" icon={BadgeCheck} className="text-success">
                {t("student.verified")}
              </Tag>
            ) : (
              <Tag variant="gold" icon={MailWarning}>
                {t("student.notVerified")}
              </Tag>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="profile-details" className="mt-12 md:mt-16">
        <Dept number="01" id="profile-details" label={t("student.detailsTitle")} />
        <dl className="mt-2">
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid gap-1 border-b border-line py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] sm:gap-5"
            >
              <dt className="t-kicker pt-1 text-ink-3">{r.label}</dt>
              <dd className="min-w-0 text-[1.0625rem] font-medium text-ink [overflow-wrap:anywhere]">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
