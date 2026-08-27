import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-tight transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Primary action — the navy pill. */
        default:
          "sheen bg-primary text-primary-foreground elev-2 hover:bg-navy-600 hover:elev-3 active:translate-y-px dark:bg-navy-100 dark:text-navy-900 dark:hover:bg-white",
        /** The gold call to action, reserved for the single most wanted click. */
        gold:
          "sheen bg-gold-500 text-navy-950 elev-2 hover:bg-gold-400 hover:elev-3 active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent",
        outline:
          "border border-border bg-background hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
        /** For placing on the deep navy canvas. */
        onDeep:
          "border border-white/20 bg-white/10 text-white backdrop-blur hover:border-white/35 hover:bg-white/20",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "rounded-none px-0 text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-7 text-[15px]",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { loading?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
