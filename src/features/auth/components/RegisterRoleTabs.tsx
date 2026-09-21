import Link from "next/link";
import { GraduationCap, UserRound } from "lucide-react";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  active: "student" | "tutor";
  studentLabel: string;
  tutorLabel: string;
};

/**
 * A segmented pill switch between the two sign-up routes. They are real links
 * (each form is its own page), styled as one control.
 */
export function RegisterRoleTabs({ locale, active, studentLabel, tutorLabel }: Props) {
  const base =
    "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-full px-3 text-center text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 [&_svg]:size-4 [&_svg]:shrink-0";
  const on = "bg-card text-foreground elev-2 dark:bg-accent";
  const off = "text-muted-foreground hover:text-foreground";

  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 ring-1 ring-inset ring-border/70">
      <Link
        href={localeHref(locale, "/register")}
        className={cn(base, active === "student" ? on : off)}
        aria-current={active === "student" ? "page" : undefined}
      >
        <UserRound aria-hidden />
        <span className="truncate">{studentLabel}</span>
      </Link>
      <Link
        href={localeHref(locale, "/register/tutor")}
        className={cn(base, active === "tutor" ? on : off)}
        aria-current={active === "tutor" ? "page" : undefined}
      >
        <GraduationCap aria-hidden />
        <span className="truncate">{tutorLabel}</span>
      </Link>
    </div>
  );
}
