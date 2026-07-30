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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => {
        const Icon = pickIcon(c.slug);
        return (
          <Link
            key={c.id}
            href={hrefFor(c)}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 text-primary transition-colors group-hover:from-primary/20 group-hover:to-violet-500/20">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium leading-snug">{c.name}</div>
              <div className="text-xs text-muted-foreground">{exploreLabel}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
