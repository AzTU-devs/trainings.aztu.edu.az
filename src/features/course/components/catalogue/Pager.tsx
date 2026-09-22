import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getT } from "@/i18n/server";
import { localeHref } from "@/i18n/href";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils/cn";

type Slot = number | "gap-start" | "gap-end";

/**
 * Which page numbers to print (0-based), with gaps. Every page up to `max`
 * pages; past that the first, the last and the current with `around` pages on
 * each side.
 */
function windowOf(current: number, total: number, max: number, around: number): Slot[] {
  if (total <= max) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set([0, total - 1]);
  for (let i = current - around; i <= current + around; i++) if (i >= 0 && i < total) pages.add(i);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Slot[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p > current ? "gap-end" : "gap-start");
    out.push(p);
  });
  return out;
}

const CIRCLE =
  "grid h-11 min-w-11 place-items-center rounded-full px-1 font-mono text-sm text-ink-2 transition-colors duration-(--dur-1) hover:bg-paper-2 hover:text-ink";
const CURRENT = "bg-action text-on-action hover:bg-action hover:text-on-action";
// On phones the steps are arrow-only, so they get the same 44px square target
// as the page circles; the label comes back (left-aligned) from 640px. The
// square spills 12px into the page margin (PREV_EDGE / NEXT_EDGE) so the arrows
// still line up with the ends of the rule above them.
const STEP = "link-go min-h-11 min-w-11 justify-center sm:justify-start";
const PREV_EDGE = "max-sm:-ml-3";
const NEXT_EDGE = "max-sm:-mr-3";

/**
 * The pager: an ink rule, "← Əvvəlki", the page numbers as mono circles
 * ("01 02 …", the current one in the action colour) and "Növbəti →". Every
 * link keeps all the current params and only changes `page` (0-based), as
 * the catalogue always has. Phones get a shorter run of numbers (at most four
 * circles, or first · current · last) so two 44px steps and the numbers fit a
 * 360px screen without a sideways scroll.
 */
export async function Pager({
  locale,
  page,
  totalPages,
  params,
  className,
}: {
  locale: Locale;
  /** 0-based. */
  page: number;
  totalPages: number;
  /** The raw search params of the request. */
  params: Record<string, string | string[] | undefined>;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const t = await getT(locale);

  const make = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "page") continue;
      if (v) u.set(k, String(v));
    }
    u.set("page", String(p));
    return localeHref(locale, `/courses?${u.toString()}`);
  };
  const prev = Math.max(0, page - 1);
  const next = Math.min(totalPages - 1, page + 1);
  const atStart = page === 0;
  const atEnd = page >= totalPages - 1;

  const numbers = (slots: Slot[]) =>
    slots.map((s) =>
      typeof s === "number" ? (
        <Link
          key={s}
          href={make(s)}
          aria-current={s === page ? "page" : undefined}
          aria-label={t("courses.pageN", { n: s + 1 })}
          className={cn(CIRCLE, s === page && CURRENT)}
        >
          {String(s + 1).padStart(2, "0")}
        </Link>
      ) : (
        <span key={s} aria-hidden="true" className="grid h-11 w-6 place-items-center font-mono text-sm text-ink-3">
          …
        </span>
      ),
    );

  return (
    <nav
      aria-label={t("courses.pagesNav")}
      className={cn("flex items-center justify-between gap-4 border-t border-line-strong pt-[18px]", className)}
    >
      <Link
        href={make(prev)}
        aria-disabled={atStart}
        tabIndex={atStart ? -1 : undefined}
        aria-label={t("common.previous")}
        // .link-go nudges its arrow forward; the back arrow nudges back.
        className={cn(
          STEP,
          PREV_EDGE,
          "hover:[&>svg]:[transform:translateX(-3px)]",
          atStart && "pointer-events-none opacity-30",
        )}
      >
        <ArrowLeft aria-hidden="true" strokeWidth={1.75} />
        <span className="hidden sm:inline">{t("common.previous")}</span>
      </Link>
      <div className="flex gap-1 sm:hidden">{numbers(windowOf(page, totalPages, 4, 0))}</div>
      <div className="hidden gap-1 sm:flex">{numbers(windowOf(page, totalPages, 7, 1))}</div>
      <Link
        href={make(next)}
        aria-disabled={atEnd}
        tabIndex={atEnd ? -1 : undefined}
        aria-label={t("common.next")}
        className={cn(STEP, NEXT_EDGE, atEnd && "pointer-events-none opacity-30")}
      >
        <span className="hidden sm:inline">{t("common.next")}</span>
        <ArrowRight aria-hidden="true" strokeWidth={1.75} />
      </Link>
    </nav>
  );
}
