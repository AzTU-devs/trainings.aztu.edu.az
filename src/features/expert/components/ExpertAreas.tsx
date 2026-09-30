import { cn } from "@/lib/utils/cn";
import { LocaleLink } from "@/i18n/LocaleLink";
import type { PickedArea } from "../areas";

/*
 * An expert's areas of expertise: the catalogue categories they picked, each
 * in its category's colour, then the areas they typed themselves. Their own
 * areas are marked differently (a hollow square, an outlined chip) because
 * they are not categories: nothing in the catalogue is filed under them, so
 * they never link anywhere. `ownTitle` says so to anyone who hovers.
 */

/** The compact line on an expert card; past `max` areas it ends in "+N". */
export function ExpertAreaLabels({
  picked,
  own,
  ownTitle,
  max = 2,
  className,
}: {
  picked: PickedArea[];
  own: string[];
  ownTitle: string;
  max?: number;
  className?: string;
}) {
  const all = [
    ...picked.map((c) => ({ key: `c:${c.id}`, name: c.name, k: c.k })),
    ...own.map((name) => ({ key: `o:${name}`, name, k: null })),
  ];
  if (!all.length) return null;
  const shown = all.slice(0, max);
  const rest = all.slice(max);
  return (
    <p className={cn("areas", className)}>
      {shown.map((a) =>
        a.k ? (
          <span key={a.key} className={cn("cat-label", a.k)}>
            {a.name}
          </span>
        ) : (
          <span key={a.key} className="own-label" title={ownTitle}>
            {a.name}
          </span>
        ),
      )}
      {rest.length ? (
        <span className="more" title={rest.map((a) => a.name).join(", ")}>
          +{rest.length}
        </span>
      ) : null}
    </p>
  );
}

/** The full set as chips, on the expert's own page. */
export function ExpertAreaChips({
  picked,
  own,
  ownTitle,
  className,
}: {
  picked: PickedArea[];
  own: string[];
  ownTitle: string;
  className?: string;
}) {
  if (!picked.length && !own.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {picked.map((c) => (
        <li key={c.id}>
          {c.href ? (
            <LocaleLink href={c.href} className={cn("chip plain", c.k)}>
              <span className="sq" aria-hidden />
              {c.name}
            </LocaleLink>
          ) : (
            <span className={cn("chip plain static", c.k)}>
              <span className="sq" aria-hidden />
              {c.name}
            </span>
          )}
        </li>
      ))}
      {own.map((name) => (
        <li key={name}>
          <span className="chip plain own" title={ownTitle}>
            {name}
          </span>
        </li>
      ))}
    </ul>
  );
}
