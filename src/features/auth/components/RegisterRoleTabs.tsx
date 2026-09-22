import Link from "next/link";
import { GraduationCap, UserRound } from "lucide-react";
import { localeHref } from "@/i18n/href";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  active: "student" | "tutor";
  /** The accessible name of the switch ("Account type"). */
  label: string;
  studentLabel: string;
  tutorLabel: string;
};

/**
 * The switch between the two sign-up routes, drawn like the Segmented control
 * (a paper-2 track, the current one lifted onto a card chip). They are real
 * links, since each form is its own page, so the current one is marked with
 * `aria-current="page"` rather than `aria-pressed`.
 */
export function RegisterRoleTabs({ locale, active, label, studentLabel, tutorLabel }: Props) {
  const items = [
    { key: "student", href: "/register", icon: UserRound, text: studentLabel },
    { key: "tutor", href: "/register/tutor", icon: GraduationCap, text: tutorLabel },
  ] as const;

  return (
    <nav aria-label={label} className="grid grid-cols-2 gap-0.5 rounded-full bg-paper-2 p-[3px]">
      {items.map(({ key, href, icon: Icon, text }) => {
        const on = active === key;
        return (
          <Link
            key={key}
            href={localeHref(locale, href)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-full px-3 text-[15px] font-medium transition-colors duration-(--dur-1)",
              on
                ? // line-2, not line: the night card is close to its track, so the ring carries the state.
                  "bg-card text-ink shadow-[0_1px_2px_rgb(14_26_43/0.12),0_0_0_1px_var(--c-line-2)]"
                : "text-ink-2 hover:text-ink",
            )}
          >
            <Icon aria-hidden="true" strokeWidth={1.75} className="size-[18px] shrink-0" />
            <span className="truncate">{text}</span>
          </Link>
        );
      })}
    </nav>
  );
}
