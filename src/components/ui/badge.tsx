import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
        gold: "border-gold-500/30 bg-gold-500/15 text-gold-700 dark:text-gold-300",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        /** Sits on top of imagery / the deep navy canvas. */
        onDeep: "border-white/20 bg-black/35 text-white backdrop-blur-md",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
