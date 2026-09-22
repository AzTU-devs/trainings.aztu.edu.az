import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * The editorial pill button. The API is unchanged from the previous design, so
 * every existing caller keeps compiling; only the look moved to the tokens.
 * An icon marked `data-go` (the trailing arrow) nudges 3px on hover. Focus
 * uses the global :focus-visible ring (the action colour, offset 3px).
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full",
    "font-sans font-semibold leading-none tracking-[-0.005em] no-underline",
    "transition-[background-color,color,box-shadow,transform,background-size] duration-(--dur-2) ease-out",
    "active:translate-y-px active:scale-[.99]",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    "[&_svg]:size-[1.125em] [&_svg]:shrink-0",
    "[&_[data-go]]:transition-transform [&_[data-go]]:duration-(--dur-2) hover:[&_[data-go]]:translate-x-[3px]",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Primary action: navy in the day edition, gold at night. */
        default: "bg-action text-on-action hover:bg-ink hover:text-paper",
        /** Gold, reserved for the navy spread (home finder). */
        gold: "bg-gold text-[#0e1a2b] hover:bg-[#dcc073] hover:text-[#0e1a2b]",
        secondary: "bg-paper-2 text-ink hover:bg-line",
        soft: "bg-paper-2 text-ink hover:bg-line",
        /** The ghost look: a hairline ring that firms up on hover. */
        outline:
          "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--c-line-2)] hover:shadow-[inset_0_0_0_1.5px_var(--c-ink)]",
        /** The ghost ring on the navy spread. */
        onDeep:
          "bg-transparent text-spread-ink shadow-[inset_0_0_0_1px_var(--c-spread-line)] hover:shadow-[inset_0_0_0_1.5px_var(--c-spread-ink)]",
        ghost: "bg-transparent text-ink hover:bg-paper-2",
        /** Transparent until hover (header sign-in, toolbar actions). */
        quiet: "bg-transparent text-ink hover:bg-paper-2",
        /** An inline link with the gold underline that grows on hover. */
        link: [
          "rounded-none bg-transparent text-ink",
          "bg-[linear-gradient(var(--c-gold),var(--c-gold))] bg-size-[0%_2px] bg-bottom-left bg-no-repeat hover:bg-size-[100%_2px]",
        ].join(" "),
        destructive: "bg-danger text-on-status hover:bg-ink hover:text-paper",
      },
      size: {
        default: "h-13 px-6 text-base",
        sm: "h-10 px-4 text-[15px]",
        lg: "h-14 px-7 text-[17px]",
        icon: "size-11 px-0",
        "icon-sm": "size-9 px-0",
      },
    },
    compoundVariants: [
      { variant: "quiet", size: ["default", "sm", "lg"], class: "px-3.5" },
      { variant: "link", class: "h-auto px-0 py-1" },
    ],
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
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
