import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MonitorPlay, RefreshCcw, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

/**
 * Two objects on the canvas: a quiet panel that says what the platform is
 * and does — no figures or quotes, because nothing here is backed by live
 * data — and the page's own form card.
 */
export default async function AuthLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const points = [
    { icon: MonitorPlay, text: t("auth.panelPoint1") },
    { icon: ShieldCheck, text: t("auth.panelPoint2") },
    { icon: RefreshCcw, text: t("auth.panelPoint3") },
  ];

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:p-5">
      <div className="mx-auto grid w-full max-w-[90rem] flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-5">
        {/* Brand panel — desktop only. Sticky with a fixed height so a long
            form (the expert application) scrolls past it instead of
            stretching it. */}
        <aside className="hidden rounded-[16px] bg-paper-2 text-ink lg:sticky lg:top-5 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:min-h-[36rem] lg:flex-col lg:justify-between lg:self-start lg:p-10 xl:p-12">
          <Link href={localeHref(locale, "/")} className="flex w-fit rounded-2xl outline-offset-4" aria-label="AzTU EduPlatform">
            <Logo size="lg" />
          </Link>

          <div className="max-w-md">
            <p className="kicker">
              <span className="rule" />
              {t("home.university")}
            </p>
            <h2 className="d-lg mt-4">{t("auth.panelTitle")}</h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-ink-2">{t("auth.panelSub")}</p>

            <ul className="mt-8 space-y-3">
              {points.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3.5 text-[15px] text-ink-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface text-navy shadow-[0_0_0_1px_var(--line)]">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-ink-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
            <a
              href="https://aztu.edu.az"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 rounded-full hover:underline"
            >
              aztu.edu.az
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
            <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
          </div>
        </aside>

        {/* Form column */}
        <div className="flex min-w-0 flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-0 lg:pb-4 lg:pt-0">
          <header className="flex items-center justify-between gap-4 lg:pl-1">
            <Link href={localeHref(locale, "/")} className="flex rounded-2xl lg:hidden">
              <Logo />
            </Link>
            <Link
              href={localeHref(locale, "/")}
              className="hidden h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {t("common.home")}
            </Link>
            <LocaleSwitcher />
          </header>

          <main className="flex flex-1 flex-col items-center justify-start py-6 sm:justify-center sm:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
