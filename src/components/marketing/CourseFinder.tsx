"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { cn } from "@/lib/utils/cn";
import { formatNumber } from "@/lib/utils/format";
import { buttonVariants } from "@/components/ui/button";
import s from "./Spread.module.css";

type Option = { value: string; label: string };
type SlotKey = "category" | "level" | "format";
type Values = Record<SlotKey, string>;

const EMPTY: Values = { category: "", level: "", format: "" };
const SLOT_RE = /(\{(?:category|level|format)\})/;

/**
 * "Mən [istənilən sahədə ▾] [istənilən səviyyədə ▾] [onlayn və ya əyani ▾]
 * kurs axtarıram." Three native selects set inside a sentence, with the live
 * number of matching courses on the button.
 *
 * It is a plain GET form to the catalogue with the catalogue's own param
 * names (categoryId, level, type), so it works before hydration and without
 * JavaScript. With JavaScript, empty params are dropped and the router
 * navigates. Counts come from `matrix` (catalog.ts finderMatrix, keyed
 * "cat|level|type", "" = any), computed on the server; null means the
 * catalogue walk failed, and then no number is shown at all.
 */
export function CourseFinder({
  action,
  categories,
  matrix,
}: {
  /** Already localised (localeHref(locale, "/courses")). */
  action: string;
  /** Categories with courses, labelled for the sentence on the server ("{name} sahəsində"). */
  categories: Option[];
  matrix: Record<string, number> | null;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const sentenceRef = useRef<HTMLParagraphElement>(null);

  const slots: Record<SlotKey, { id: string; name: string; label: string; options: Option[] }> = {
    category: {
      id: "finder-category",
      name: "categoryId",
      label: t("home.finderCategoryLabel"),
      options: [{ value: "", label: t("home.finderAnyCategory") }, ...categories],
    },
    level: {
      id: "finder-level",
      name: "level",
      label: t("home.finderLevelLabel"),
      options: [
        { value: "", label: t("home.finderAnyLevel") },
        { value: "BEGINNER", label: t("home.finderBeginner") },
        { value: "INTERMEDIATE", label: t("home.finderIntermediate") },
        { value: "ADVANCED", label: t("home.finderAdvanced") },
      ],
    },
    format: {
      id: "finder-format",
      name: "type",
      label: t("home.finderFormatLabel"),
      options: [
        { value: "", label: t("home.finderAnyFormat") },
        { value: "ONLINE", label: t("home.finderOnline") },
        { value: "OFFLINE", label: t("home.finderOffline") },
      ],
    },
  };

  const count = matrix ? (matrix[`${values.category}|${values.level}|${values.format}`] ?? 0) : null;
  const submitLabel =
    count === null
      ? t("home.finderShowAny")
      : count > 0
        ? t("home.finderShow", { n: formatNumber(count, locale), count })
        : t("ui.goToCatalogue");

  // Browsers without `field-sizing: content` (Safari, Firefox today) would
  // size each select to its longest option; measure the chosen words instead,
  // again once the web font has loaded.
  useEffect(() => {
    const sentence = sentenceRef.current;
    if (!sentence || CSS.supports?.("field-sizing", "content")) return;
    const probe = document.createElement("span");
    probe.className = s.probe;
    probe.setAttribute("aria-hidden", "true");
    sentence.appendChild(probe);
    const fit = () => {
      sentence.querySelectorAll("select").forEach((select) => {
        probe.textContent = select.options[select.selectedIndex]?.text ?? "";
        select.style.width = `calc(${probe.getBoundingClientRect().width}px + 0.8em)`;
      });
    };
    fit();
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
      probe.remove();
    };
  }, [values]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Nothing matches: the button says "Kataloqa keçin", so open it unfiltered.
    if (count === 0) {
      router.push(action);
      return;
    }
    const params = new URLSearchParams();
    if (values.category) params.set("categoryId", values.category);
    if (values.level) params.set("level", values.level);
    if (values.format) params.set("type", values.format);
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }

  const parts = t("home.finderSentence").split(SLOT_RE);

  return (
    <form action={action} method="get" onSubmit={onSubmit} className="mt-10 lg:mt-14">
      <p ref={sentenceRef} className={s.sentence}>
        {parts.map((part, i) => {
          const key = part.slice(1, -1) as SlotKey;
          const slot = SLOT_RE.test(part) ? slots[key] : null;
          if (!slot) return part ? <span key={i}>{part}</span> : null;
          return (
            <span key={i} className={s.slot}>
              <label htmlFor={slot.id} className="sr-only">
                {slot.label}
              </label>
              <select
                id={slot.id}
                name={slot.name}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className={s.select}
              >
                {slot.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" strokeWidth={1.5} className={s.chev} />
            </span>
          );
        })}
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 lg:mt-12">
        <button type="submit" className={cn(buttonVariants({ variant: "gold", size: "lg" }))}>
          {submitLabel}
          <ArrowRight data-go="" aria-hidden="true" strokeWidth={1.75} />
        </button>
        <p aria-live="polite" className="t-small max-w-[44ch] text-spread-2">
          {count === 0 ? t("home.finderNoteEmpty") : t("home.finderNote")}
        </p>
      </div>
    </form>
  );
}
