import type { ReactNode } from "react";
import Link from "next/link";
import { X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CategoryRef } from "@/features/category/style";
import { CategorySwatch } from "@/components/cover/CourseCover";

const CHIP =
  "inline-flex h-[34px] max-w-full items-center gap-1.5 rounded-full bg-paper-2 pr-2.5 pl-3 text-sm text-ink transition-colors duration-(--dur-1) hover:bg-line [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-ink-3 hover:[&>svg]:text-ink";

/**
 * A removable filter chip ("Seçilib: Onlayn ×"). Give it exactly one of `href`
 * (a link to the URL without that filter) or `onRemove` (client callers).
 */
export function Chip({
  children,
  href,
  onRemove,
  removeLabel,
  className,
}: {
  children: ReactNode;
  href?: string;
  onRemove?: () => void;
  /** The accessible name, e.g. t("ui.removeFilter", { label }). */
  removeLabel: string;
  className?: string;
}) {
  const inner = (
    <>
      <span className="min-w-0 truncate">{children}</span>
      <X aria-hidden="true" strokeWidth={1.75} />
    </>
  );
  if (href) {
    return (
      <Link href={href} scroll={false} aria-label={removeLabel} className={cn(CHIP, className)}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onRemove} aria-label={removeLabel} className={cn(CHIP, className)}>
      {inner}
    </button>
  );
}

/** A quick-link chip under a search field ("Onlayn kurslar 19"). The count is mono. */
export function QuickChip({
  href,
  icon: Icon,
  label,
  count,
  className,
}: {
  href: string;
  icon?: LucideIcon;
  label: string;
  count?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("qchip", className)}>
      {Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
      <span>{label}</span>
      {count ? <span className="n">{count}</span> : null}
    </Link>
  );
}

/**
 * A category filter chip: a 44px pill with the category's round swatch and a
 * mono superscript count. `category: null` is the "Hamısı" chip. `current`
 * fills it with ink; `disabled` (a facet count of 0) makes it dashed and
 * muted, and it is then a <span>, never a link.
 */
export function CategoryChip({
  href,
  category,
  label,
  count,
  current = false,
  disabled = false,
  className,
}: {
  href: string;
  category: CategoryRef | null;
  label: string;
  count?: string;
  current?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const cls = cn(
    "inline-flex h-11 max-w-full shrink-0 items-center gap-2.5 rounded-full border border-line-2 pr-3.5 text-[15px] font-medium whitespace-nowrap text-ink",
    "transition-[border-color,background-color,color] duration-(--dur-1) hover:border-ink",
    category ? "pl-[5px]" : "pl-4",
    current && "border-ink bg-ink text-paper",
    disabled && "pointer-events-none border-dashed opacity-[.42]",
    className,
  );
  const inner = (
    <>
      {category ? (
        <span className={cn("size-[34px] shrink-0 overflow-hidden rounded-full", disabled && "grayscale")}>
          <CategorySwatch category={category} className="h-full rounded-none" />
        </span>
      ) : null}
      <span className="min-w-0 truncate">{label}</span>
      {count ? (
        <sup className={cn("top-0 font-mono text-xs text-ink-3", current && "text-paper opacity-75")}>{count}</sup>
      ) : null}
    </>
  );
  if (disabled && !current) {
    return (
      <span aria-disabled="true" className={cls}>
        {inner}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} aria-current={current ? "true" : undefined} className={cls}>
      {inner}
    </Link>
  );
}
