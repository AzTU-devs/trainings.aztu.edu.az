import { CircleAlert } from "lucide-react";

/** An inline error line under a field or form (danger text with the alert icon). */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-start gap-1.5 text-sm leading-snug text-danger">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
      <span>{message}</span>
    </p>
  );
}
