import Link from "next/link";
import {
  Code2,
  Palette,
  Languages,
  Calculator,
  Megaphone,
  Camera,
  Briefcase,
  HeartPulse,
  Music,
  Atom,
  type LucideIcon,
} from "lucide-react";
import type { Category } from "../types";

const ICONS: LucideIcon[] = [
  Code2,
  Palette,
  Languages,
  Calculator,
  Megaphone,
  Camera,
  Briefcase,
  HeartPulse,
  Music,
  Atom,
];

function pickIcon(slug: string): LucideIcon {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return ICONS[Math.abs(h) % ICONS.length];
}

export function CategoryGrid({
  categories,
  hrefFor,
  exploreLabel,
}: {
  categories: Category[];
  hrefFor: (category: Category) => string;
  exploreLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => {
        const Icon = pickIcon(c.slug);
        return (
          <Link
            key={c.id}
            href={hrefFor(c)}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:elev-2"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-500 to-navy-800 text-white ring-1 ring-inset ring-white/15 transition-transform duration-300 group-hover:scale-105">
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium leading-snug">{c.name}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground transition-colors group-hover:text-gold-700 dark:group-hover:text-gold-400">
                {exploreLabel}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
