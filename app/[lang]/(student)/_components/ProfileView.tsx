import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  Languages,
  Mail,
  MailWarning,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ResendVerificationButton } from "@/features/auth/components/ResendVerificationButton";
import { getT } from "@/i18n/server";
import { isLocale, localeNames, type Locale } from "@/i18n/config";
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

  return (
    <div className="space-y-8">
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("student.profileTitle")}
        description={t("student.profileSubtitle")}
        aside={
          <Link
            href={localeHref(locale, "/settings")}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil /> {t("student.editProfile")}
          </Link>
        }
      />
      {!user.emailVerified ? <ResendVerificationButton /> : null}

      <section className="overflow-hidden rounded-3xl border border-border/80 bg-card elev-1">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
          <span
            aria-hidden
            className="grid size-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-navy-500 to-navy-800 font-display text-2xl text-white shadow-[inset_0_1px_0_0_rgb(255_255_255/0.2),0_16px_32px_-16px_rgb(0_31_69/0.6)]"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl leading-tight">{fullName(user)}</h2>
            <p className="mt-1 truncate text-[15px] text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((key) => (
                <Badge key={key} variant="soft">
                  {t(key)}
                </Badge>
              ))}
              {user.emailVerified ? (
                <Badge variant="success">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  {t("student.verified")}
                </Badge>
              ) : (
                <Badge variant="gold">
                  <MailWarning className="size-3.5" aria-hidden />
                  {t("student.notVerified")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border/80 px-6 pb-2 pt-6 sm:px-8">
          <h3 className="font-display text-lg leading-snug">{t("student.detailsTitle")}</h3>
        </div>
        <ul className="grid gap-1 px-2 pb-4 sm:grid-cols-2 sm:px-4 sm:pb-5">
          <Field icon={<UserRound />} label={t("student.fullName")} value={fullName(user)} />
          <Field icon={<Mail />} label={t("auth.email")} value={user.email} />
          {user.phone ? (
            <Field icon={<Phone />} label={t("auth.phone")} value={user.phone} />
          ) : null}
          <Field
            icon={user.emailVerified ? <BadgeCheck /> : <MailWarning />}
            label={t("student.emailStatus")}
            value={user.emailVerified ? t("student.verified") : t("student.notVerified")}
          />
          {user.locale ? (
            <Field
              icon={<Languages />}
              label={t("student.locale")}
              value={isLocale(user.locale) ? localeNames[user.locale] : user.locale}
            />
          ) : null}
        </ul>
      </section>
    </div>
  );
}

function Field({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl px-4 py-3">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100 [&_svg]:size-[18px]"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-muted-foreground">{label}</div>
        <div className="mt-0.5 break-words font-medium text-foreground">{value}</div>
      </div>
    </li>
  );
}
