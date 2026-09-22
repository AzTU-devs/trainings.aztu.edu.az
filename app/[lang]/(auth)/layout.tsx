import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Languages, MonitorPlay, RefreshCcw } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Shield } from "@/components/layout/AztuMark";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Kicker } from "@/components/editorial/Kicker";
import { CategorySwatch } from "@/components/cover/CourseCover";
import { categoryKey } from "@/features/category/style";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { localeHref } from "@/i18n/href";

type Props = {
  children: ReactNode;
  params: Promise<{ lang: string }>;
};

/**
 * The four poster tiles on the cover panel. Purely decorative (the swatches
 * of four real categories, no names, no counts), so they are fixed here
 * rather than fetched: the auth pages make no API call of their own. Each
 * takes its seed from its slug, so it is the same mark the category shows in
 * the menu, the chips and the category rows.
 */
const PANEL_TILES = ["information-technology", "data-ai", "engineering", "construction-architecture"].map(
  (slug) => ({ slug, key: categoryKey(slug) }),
);

/**
 * The auth shell: a navy cover panel beside a quiet, typographic form column.
 *
 * The panel is the page's one dark moment. It only says what the platform is
 * and does: no figures and no quotes, because nothing here is backed by live
 * data. It is sticky with a fixed height, so a long form (the expert
 * application) scrolls past it instead of stretching it. Phones get no panel;
 * the form column takes the width.
 */
export default async function AuthLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

  const points = [
    { icon: MonitorPlay, text: t("auth.panelPoint1") },
    { icon: RefreshCcw, text: t("auth.panelPoint2") },
    { icon: Languages, text: t("auth.panelPoint3") },
  ];

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:p-5">
      {/* The panel and the top row come before the form; the skip link lets
          keyboard users go straight to it, as on every other layout. */}
      <a href="#main" className="skip-link">
        {t("nav.skipToContent")}
      </a>

      <div className="mx-auto grid w-full max-w-[90rem] flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-5">
        <aside className="relative isolate hidden overflow-hidden rounded-card bg-spread text-spread-ink lg:sticky lg:top-5 lg:flex lg:h-[calc(100dvh-2.5rem)] lg:min-h-[40rem] lg:flex-col lg:self-start lg:p-10 xl:p-12 dark:shadow-[inset_0_0_0_1px_var(--c-spread-line)] [&_:focus-visible]:outline-gold">
          {/* The shield as a 3.5% watermark, bled off the top right like the
              home page's navy spread. */}
          <Shield className="pointer-events-none absolute -top-[6%] -right-[8%] -z-10 h-[118%] w-auto text-spread-ink opacity-[0.035]" />

          <Link href={localeHref(locale, "/")} className="w-fit">
            <Logo tone="onDeep" />
          </Link>

          {/* The panel is as tall as the viewport, so what it holds steps down
              with the height rather than being clipped: the tiles go first
              (below 880px), then the lead (below 800px). */}
          <div className="mt-auto max-w-[34rem] pt-10">
            <div aria-hidden="true" className="mb-8 flex gap-2.5 [@media(max-height:879px)]:hidden">
              {PANEL_TILES.map((c) => (
                <CategorySwatch key={c.slug} category={c} className="size-14 rounded-poster" />
              ))}
            </div>
            <Kicker className="text-spread-gold">{t("auth.panelKicker")}</Kicker>
            {/* A paragraph, not a heading: the page's h1 is the form's title,
                and this sits before it in the document. */}
            <p className="t-display-l mt-4 text-spread-ink">{t("auth.panelTitle")}</p>
            <p className="t-lead mt-5 max-w-[46ch] text-spread-2 [@media(max-height:799px)]:hidden">
              {t("auth.panelSub")}
            </p>

            <ul className="mt-9 border-t border-spread-line">
              {points.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3.5 border-b border-spread-line py-3.5 text-[15px] leading-snug text-spread-ink"
                >
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-[18px] shrink-0 text-spread-gold" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4 text-sm text-spread-2">
            <a
              href="https://aztu.edu.az"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1 font-mono text-xs tracking-[0.06em] transition-colors hover:text-spread-ink"
            >
              aztu.edu.az
              <ArrowUpRight aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
            </a>
            <span className="text-right">{t("footer.rights", { year: new Date().getFullYear() })}</span>
          </div>
        </aside>

        {/* The form column */}
        <div className="flex min-w-0 flex-col px-(--margin) lg:px-0">
          <header className="flex h-[4.5rem] items-center justify-between gap-4 border-b border-line lg:h-10 lg:border-0">
            <Link href={localeHref(locale, "/")} className="lg:hidden">
              <Logo />
            </Link>
            <Link
              href={localeHref(locale, "/")}
              className="group hidden h-10 items-center gap-2 rounded-full px-3.5 text-[15px] font-medium text-ink-2 transition-colors duration-(--dur-1) hover:bg-paper-2 hover:text-ink lg:inline-flex"
            >
              <ArrowLeft
                aria-hidden="true"
                strokeWidth={1.75}
                className="size-4 transition-transform duration-(--dur-2) ease-out group-hover:-translate-x-[3px]"
              />
              {t("common.home")}
            </Link>
            {/* The switch's chips stay 32px, but each code gets a 44px touch
                target (as in the mobile menu): a transparent ::after grows
                the hit area 6px up and down and 12px outward, away from its
                neighbour, so the two targets meet without overlapping. */}
            <LocaleSwitcher className="[&>a]:relative [&>a]:after:absolute [&>a]:after:inset-y-[-6px] [&>a]:after:content-[''] [&>a:first-child]:after:-left-3 [&>a:first-child]:after:right-0 [&>a:last-child]:after:-right-3 [&>a:last-child]:after:left-0" />
          </header>

          {/* Every page is top-aligned at the same offset (never centred on
              its own height), so the kicker and the title stay put when the
              reader moves between sign-in, sign-up and recovery. */}
          <main
            id="main"
            className="flex flex-1 flex-col items-center pt-10 pb-14 sm:pt-14 lg:pt-[clamp(2.5rem,9vh,6rem)] lg:pb-12"
          >
            {children}
          </main>

          {/* Phones have no panel, so its sign-off row closes the column instead. */}
          <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line py-5 text-sm text-ink-3 lg:hidden">
            <a
              href="https://aztu.edu.az"
              target="_blank"
              rel="noopener noreferrer"
              className="-my-2.5 inline-flex items-center gap-1 py-2.5 font-mono text-xs tracking-[0.06em] transition-colors hover:text-ink"
            >
              aztu.edu.az
              <ArrowUpRight aria-hidden="true" strokeWidth={1.75} className="size-3.5" />
            </a>
            <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
