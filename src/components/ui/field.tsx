import * as React from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Label } from "./label";

/**
 * A labelled form row: label, the control, an optional hint and the error
 * line. It only lays things out — ids, `aria-describedby`, `aria-invalid` and
 * the error's `role` stay with the form, exactly as before, so no form's
 * behaviour or validation changes.
 */
export function Field({
  id,
  label,
  hint,
  hintId,
  error,
  errorId,
  errorRole,
  className,
  children,
}: {
  /** The control's id (the label's htmlFor). */
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  hintId?: string;
  error?: React.ReactNode;
  errorId?: string;
  errorRole?: "alert";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? (
        <p id={hintId} className="text-sm text-ink-3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role={errorRole} className="flex items-center gap-1.5 text-sm text-danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

/** A native select in the field style (chevron drawn in CSS). */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn("select", className)} {...props} />,
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn("textarea", className)} {...props} />,
);
Textarea.displayName = "Textarea";

/** A checkbox with its label to the right (`.check`). */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label: React.ReactNode; labelClassName?: string }
>(({ className, label, labelClassName, ...props }, ref) => (
  <label className={cn("check", labelClassName)}>
    <input ref={ref} type="checkbox" className={className} {...props} />
    <span>{label}</span>
  </label>
));
Checkbox.displayName = "Checkbox";
