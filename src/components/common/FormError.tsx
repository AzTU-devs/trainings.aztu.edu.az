import { CircleAlert } from "lucide-react";

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-destructive">
      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
