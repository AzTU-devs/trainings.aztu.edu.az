import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm transition-[border-color,box-shadow]",
      "placeholder:text-muted-foreground",
      "focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
