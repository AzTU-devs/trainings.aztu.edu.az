import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * The text input (`.input`: 52px, radius 10, card ground, a hairline that
 * turns into the action-colour focus ring; `aria-invalid` turns it red). The
 * API is unchanged, so react-hook-form's `register()` spreads straight in.
 */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "input",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
