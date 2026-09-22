import { cn } from "@/lib/utils/cn";

/**
 * The empty-state plate: a dotted, dashed-edge frame with a mono label chip
 * ("0 nəticə", "0 dərs", "404"). Decorative: the state itself is always said
 * in text next to it, so the plate is hidden from assistive tech.
 */
export function BlankPlate({
  label,
  square = false,
  className,
}: {
  label: string;
  square?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("blank", square && "aspect-square", className)}>
      <span>{label}</span>
    </div>
  );
}
