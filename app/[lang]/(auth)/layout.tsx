import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, MonitorPlay, RefreshCcw, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Eyebrow } from "@/components/common/SectionHeading";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

/**
 * Two objects on the grey canvas: a contained deep-navy brand panel and the
 * page's own form card. The panel only says what the platform is and does —
 * no figures or quotes, because nothing here is backed by live data.
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
        <aside className="surface-deep hidden overflow-hidden rounded-4xl dark:ring-1 dark:ring-inset dark:ring-white/10 lg:sticky lg:top-5 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:min-h-[36rem] lg:flex-col lg:justify-between lg:self-start lg:p-10 xl:p-12">
          <Link
            href={localeHref(locale, "/")}
            className="w-fit rounded-2xl outline-offset-4"
          >
            <Logo tone="onDeep" />
          </Link>

          <div className="max-w-md">
            <Eyebrow tone="deep">{t("home.university")}</Eyebrow>
            <h2 className="mt-6 font-display text-balance text-4xl font-extrabold leading-[1.08] text-white xl:text-[2.75rem]">
              {t("auth.panelTitle")}
            </h2>
            <p className="mt-5 text-pretty text-base leading-relaxed text-white/70">
              {t("auth.panelSub")}
            </p>

            <ul className="mt-9 space-y-3">
              {points.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3.5 text-[15px] text-white/85">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-gold-200 ring-1 ring-inset ring-white/15">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-white/55 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
            <a
              href="https://aztu.edu.az"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 rounded-full transition-colors hover:text-white"
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
            <Link href={localeHref(locale, "/")} className="rounded-2xl lg:hidden">
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
