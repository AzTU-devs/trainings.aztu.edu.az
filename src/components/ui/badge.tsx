import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Legacy `Badge` API, restyled onto the editorial tags (mono, hairline, 3px
 * radius). New code uses `Tag` for facts and `StatusBadge` for statuses that
 * must read as words.
 */
const badgeVariants = cva("tag", {
  variants: {
    variant: {
      default: "tag-ink",
      secondary: "",
      outline: "",
      soft: "tag-case",
      gold: "tag-gold",
      success: "text-success",
      destructive: "border-danger bg-danger text-on-status",
      /** On imagery or the navy spread. */
      onDeep: "border-spread-line text-spread-ink",
    },
  },
  defaultVariants: { variant: "default" },
});

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const TAG_VARIANTS = {
  mono: "",
  case: "tag-case",
  ink: "tag-ink",
  gold: "tag-gold",
} as const;

/**
 * A fact tag: Plex Mono 12px uppercase, 28px tall, hairline, radius 3 ("case"
 * is the sans, sentence-case version for academic badges). Pass text in
 * sentence case; CSS uppercases the mono variants.
 */
export function Tag({
  icon: Icon,
  variant = "mono",
  className,
  children,
}: {
  icon?: LucideIcon;
  variant?: keyof typeof TAG_VARIANTS;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("tag", TAG_VARIANTS[variant], className)}>
      {Icon ? <Icon aria-hidden="true" strokeWidth={1.75} /> : null}
      {children}
    </span>
  );
}

/**
 * A status that must read as words, in the sans: "Yeni" (`new`, a paper-2
 * pill) or "Hələ qiymət yoxdur" / "Tezliklə" (`muted`, plain ink-3 text).
 */
export function StatusBadge({
  tone = "muted",
  className,
  children,
}: {
  tone?: "new" | "muted";
  className?: string;
  children: ReactNode;
}) {
  return <span className={cn("badge", tone === "new" && "badge-new", className)}>{children}</span>;
}

export { badgeVariants };
