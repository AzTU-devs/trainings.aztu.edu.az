import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * The editorial search field: a big underlined input with a round submit
 * button, as a plain GET form (works without JavaScript). `hidden` carries the
 * current params over as hidden inputs, so searching keeps the active filters
 * exactly as the catalogue always has.
 */
export function SearchField({
  action,
  name = "q",
  defaultValue,
  placeholder,
  label,
  submitLabel,
  hidden,
  id,
  size = "xl",
  autoFocus,
  className,
}: {
  /** Already localised (localeHref(locale, "/courses")). */
  action: string;
  name?: "q";
  defaultValue?: string;
  placeholder: string;
  label: string;
  submitLabel: string;
  hidden?: Record<string, string>;
  id: string;
  size?: "xl" | "md";
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <form role="search" action={action} method="get" className={cn("field-xl", size === "md" && "is-md", className)}>
      <Search aria-hidden="true" strokeWidth={1.75} />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        autoFocus={autoFocus}
      />
      {hidden
        ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      <button type="submit" aria-label={submitLabel}>
        <ArrowRight aria-hidden="true" strokeWidth={1.75} />
      </button>
    </form>
  );
}
