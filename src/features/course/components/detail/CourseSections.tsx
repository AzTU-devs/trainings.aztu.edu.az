import type { ReactNode } from "react";
import { CalendarDays, Check, Clock, MapPin, type LucideIcon } from "lucide-react";
import { catAttrs, type CategoryRef } from "@/features/category/style";
import { SecHead } from "@/components/editorial/SecHead";

export type CourseSection = { id: string; title: string; body: ReactNode };

/** "01", "02", … from the sections actually rendered, so a dropped one leaves no gap. */
export const sectionNumber = (i: number) => String(i + 1).padStart(2, "0");

/**
 * The article column: one numbered section per entry. Empty sections are
 * never passed in (the page drops them), so the numbers stay consecutive and
 * match the table of contents in the rail.
 */
export function CourseArticle({ sections }: { sections: CourseSection[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          aria-labelledby={`${s.id}-h`}
          className="scroll-mt-[calc(var(--hdr)+24px)] pt-14 lg:pt-20"
        >
          {/* SecHead prints the number above the title; the design sets them
              on one baseline, number first. */}
          <SecHead
            number={sectionNumber(i)}
            title={s.title}
            id={`${s.id}-h`}
            className="flex items-baseline gap-4 pt-3.5 [&>h2]:mt-0 [&>h2]:min-w-0"
          />
          {s.body}
        </section>
      ))}
    </>
  );
}

/** "Nə öyrənəcəksiniz": the outcomes as a numbered two-column list. */
export function OutcomesList({ items }: { items: string[] }) {
  return (
    <ol className="olist mt-8">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ol>
  );
}

/** "Tələblər": one line each, with a gold check. */
export function RequirementsList({ items }: { items: string[] }) {
  return (
    <ul className="mt-8">
      {items.map((item, i) => (
        <li
          key={i}
          className="grid grid-cols-[24px_minmax(0,1fr)] gap-2.5 border-t border-line py-3 text-ink-2"
        >
          <Check aria-hidden="true" strokeWidth={1.75} className="mt-[3px] size-[18px] text-gold-ink" />
          <span className="[overflow-wrap:anywhere]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The description, split on blank lines. When the first sentence is 60–220
 * characters it becomes the standfirst (Fraunces, a rule in the category's
 * colour); shorter or longer openings stay ordinary paragraphs, since a
 * two-word or half-page "standfirst" reads wrong. No drop cap: it splits
 * short Azerbaijani words.
 */
export function splitDescription(text: string | null | undefined): { standfirst: string | null; paras: string[] } {
  const blocks = (text ?? "")
    .split(/\r?\n[ \t]*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (!blocks.length) return { standfirst: null, paras: [] };
  const first = blocks[0];
  const m = first.match(/^(.{60,220}?[.!?])\s+(\S[\s\S]*)$/);
  if (m) return { standfirst: m[1], paras: [m[2], ...blocks.slice(1)] };
  if (blocks.length > 1 && first.length >= 60 && first.length <= 220 && /[.!?]$/.test(first) && !first.includes("\n")) {
    return { standfirst: first, paras: blocks.slice(1) };
  }
  return { standfirst: null, paras: blocks };
}

export type AboutFact = { icon: "calendar" | "clock" | "pin"; label: string; value: string };
const ABOUT_ICONS: Record<AboutFact["icon"], LucideIcon> = { calendar: CalendarDays, clock: Clock, pin: MapPin };

/** "Kurs haqqında": the description, and for an in-person course its dates, load and place. */
export function AboutCourse({
  description,
  category,
  facts,
}: {
  description: string | null | undefined;
  category: CategoryRef | null;
  facts: AboutFact[];
}) {
  const { standfirst, paras } = splitDescription(description);
  return (
    <>
      {standfirst || paras.length ? (
        <div className="prose mt-8" {...catAttrs(category)}>
          {standfirst ? <p className="standfirst">{standfirst}</p> : null}
          {paras.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      ) : null}
      {facts.length ? (
        <dl className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
          {facts.map((f) => {
            const Icon = ABOUT_ICONS[f.icon];
            return (
              <div key={f.icon} className="min-w-0">
                <dt className="t-kicker flex items-center gap-2 text-ink-3">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-4" />
                  {f.label}
                </dt>
                <dd className="t-small mt-2 text-ink [overflow-wrap:anywhere]">{f.value}</dd>
              </div>
            );
          })}
        </dl>
      ) : null}
    </>
  );
}
