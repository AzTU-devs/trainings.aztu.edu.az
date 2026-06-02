import Link from "next/link";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  active: "student" | "tutor";
  studentLabel: string;
  tutorLabel: string;
};

export function RegisterRoleTabs({ locale, active, studentLabel, tutorLabel }: Props) {
  const base =
    "flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors";
  const on = "bg-background text-foreground shadow-sm";
  const off = "text-muted-foreground hover:text-foreground";

  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
      <Link
        href={localeHref(locale, "/register")}
        className={cn(base, active === "student" ? on : off)}
        aria-current={active === "student" ? "page" : undefined}
      >
        {studentLabel}
      </Link>
      <Link
        href={localeHref(locale, "/register/tutor")}
        className={cn(base, active === "tutor" ? on : off)}
        aria-current={active === "tutor" ? "page" : undefined}
      >
        {tutorLabel}
      </Link>
    </div>
  );
}
