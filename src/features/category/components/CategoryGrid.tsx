import Link from "next/link";
import {
  ArrowRight,
  Atom,
  BrainCircuit,
  Briefcase,
  Building2,
  Calculator,
  Camera,
  Code2,
  Cog,
  GraduationCap,
  HeartPulse,
  Languages,
  Megaphone,
  Music,
  Palette,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "../types";

/**
 * Categories carry no icon of their own (`iconUrl` is empty in practice), so
 * the tile picks one from the words in the slug and name — "data-ai" gets a
 * circuit brain, "transport-logistics" a truck. Anything unrecognised falls
 * back to a stable hash over a neutral set, so a new category still gets a
 * consistent icon rather than a random one on every render.
 */
const KEYWORD_ICONS: readonly [RegExp, LucideIcon][] = [
  [/\b(data|ai|artificial|intelligence|machine)\b/, BrainCircuit],
  [/(information|software|programming|computer|web|\bit\b|techn)/, Code2],
  [/(business|management|finance|econom|entrepreneur|account)/, Briefcase],
  [/(research|academic|science|scholar|education|teach)/, GraduationCap],
  [/(construction|architect|civil|building|urban)/, Building2],
  [/(transport|logistic|automotive|vehicle|aviation|maritime)/, Truck],
  [/(engineer|mechanic|electr|energy|industr)/, Cog],
  [/(design|\bart\b|creative)/, Palette],
  [/(language|linguist)/, Languages],
  [/(math|statist)/, Calculator],
  [/(market|media|communicat)/, Megaphone],
  [/(health|medic|bio)/, HeartPulse],
  [/(music|sound)/, Music],
  [/(photo|video|film)/, Camera],
  [/(physic|chemi)/, Atom],
];

const FALLBACK_ICONS: LucideIcon[] = [Code2, GraduationCap, Cog, Briefcase, Atom];

function pickIcon(category: Category): LucideIcon {
  const words = `${category.slug} ${category.name}`.toLowerCase().replace(/[-_&]/g, " ");
  const match = KEYWORD_ICONS.find(([re]) => re.test(words));
  if (match) return match[1];
  let h = 0;
  for (let i = 0; i < category.slug.length; i++) h = (h * 31 + category.slug.charCodeAt(i)) | 0;
  return FALLBACK_ICONS[Math.abs(h) % FALLBACK_ICONS.length];
}

/**
 * The grid only lays tiles out; the page decides what each one says — the
 * name in the page's language and a description only where it has one (see
 * `../label.ts`).
 */
export function CategoryGrid({
  categories,
  hrefFor,
  labelFor,
  descriptionFor,
  exploreLabel,
}: {
  categories: Category[];
  hrefFor: (category: Category) => string;
  labelFor: (category: Category) => string;
  descriptionFor: (category: Category) => string | null;
  exploreLabel: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {categories.map((c) => {
        const Icon = pickIcon(c);
        const description = descriptionFor(c);
        return (
          <li key={c.id} className="min-w-0">
            <Link
              href={hrefFor(c)}
              className="group flex h-full flex-col rounded-3xl border border-border/80 bg-card p-4 elev-1 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:elev-3 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-6"
            >
              <span
                aria-hidden
                className="grid size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground dark:bg-navy-900/60 dark:text-navy-100 sm:size-12"
              >
                <Icon className="size-5 sm:size-[22px]" strokeWidth={1.75} />
              </span>
              <h3 className="mt-5 text-pretty break-words font-display text-base leading-snug text-foreground sm:mt-6 sm:text-lg">
                {labelFor(c)}
              </h3>
              {description ? (
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  {description}
                </p>
              ) : null}
              <span className="mt-auto flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-muted-foreground transition-colors duration-200 group-hover:text-primary sm:pt-5 sm:text-sm">
                {exploreLabel}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
