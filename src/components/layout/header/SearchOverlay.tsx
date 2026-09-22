"use client";

import { useRef, type RefObject } from "react";
import { Building2, Monitor, X } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { localeHref } from "@/i18n/href";
import { SearchField } from "@/components/ui/search-field";
import { QuickChip } from "@/components/ui/chip";
import { LinkGo } from "@/components/ui/link-go";
import { Kicker } from "@/components/editorial/Kicker";
import { useModal } from "./useModal";

/**
 * The header search ("/" or the search button): a panel that drops from the
 * top over a blurred scrim, holding the big catalogue search field, the two
 * format shortcuts and a link to the whole catalogue. No suggested topics (D16) — they would be invented. Mount
 * it only while open.
 */
export function SearchOverlay({
  onClose,
  returnFocusRef,
}: {
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const t = useT();
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLElement | null>(null);
  useModal({ open: true, onClose, containerRef: ref, initialFocusRef: inputRef, returnFocusRef });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={t("ui.searchLabel")}
      className="fixed inset-0 z-70"
      // A shortcut link navigates on the client: close behind it.
      onClick={(e) => (e.target as Element).closest("a[href]") && onClose()}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-[rgb(14_26_43/0.42)] backdrop-blur-[6px] motion-safe:animate-[fade-in_var(--dur-2)_var(--ease-out)]"
      />
      <div className="relative border-b border-line-strong bg-paper motion-safe:animate-[drop-in_var(--dur-2)_var(--ease-out)]">
        <div className="wrap py-6 lg:py-10">
          <div className="mb-2 flex items-center justify-between">
            <Kicker as="span">{t("ui.searchLabel")}</Kicker>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("ui.searchClose")}
              className="grid size-11 place-items-center rounded-full text-ink transition-colors duration-(--dur-1) hover:bg-paper-2"
            >
              <X aria-hidden="true" strokeWidth={1.75} className="size-[22px]" />
            </button>
          </div>
          <div
            ref={(el) => {
              inputRef.current = el?.querySelector("input") ?? null;
            }}
          >
            <SearchField
              id="header-search"
              action={localeHref(locale, "/courses")}
              placeholder={t("common.search")}
              label={t("ui.searchLabel")}
              submitLabel={t("ui.searchSubmit")}
            />
          </div>
          {/* The catalogue link is for a visitor who opened search to browse:
              without it the only way on is submitting an empty query. */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="qchips mt-0">
              <QuickChip href={localeHref(locale, "/courses?type=ONLINE")} icon={Monitor} label={t("ui.onlineCourses")} />
              <QuickChip href={localeHref(locale, "/courses?type=OFFLINE")} icon={Building2} label={t("ui.offlineCourses")} />
            </div>
            <LinkGo href={localeHref(locale, "/courses")} className="t-small">
              {t("ui.browseCatalogue")}
            </LinkGo>
          </div>
        </div>
      </div>
    </div>
  );
}
