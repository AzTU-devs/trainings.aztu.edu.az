"use client";

import { useState } from "react";
import { ArrowRight, MapPin, MonitorPlay, Search } from "lucide-react";
import { useLocale } from "@/i18n/client";
import { localeHref } from "@/i18n/href";

type Format = "" | "ONLINE" | "OFFLINE";

/**
 * The hero search: format tabs sitting on the field like index tabs on a
 * folder. It is a plain GET form to the catalogue, so it works before
 * JavaScript loads; the tabs only fill the hidden `type` field, which is the
 * catalogue's own format filter.
 */
export function HeroSearch({
  labels,
}: {
  labels: { all: string; online: string; inPerson: string; format: string; placeholder: string; field: string; submit: string };
}) {
  const locale = useLocale();
  const [type, setType] = useState<Format>("");
  const tabs: [Format, string, React.ReactNode][] = [
    ["", labels.all, null],
    ["ONLINE", labels.online, <MonitorPlay key="o" className="i" aria-hidden />],
    ["OFFLINE", labels.inPerson, <MapPin key="p" className="i" aria-hidden />],
  ];
  return (
    <form className="hsearch mt-9 max-w-[36rem] lg:mt-11" role="search" action={localeHref(locale, "/courses")}>
      <div className="tabs-f" role="radiogroup" aria-label={labels.format}>
        {tabs.map(([value, label, icon]) => (
          <button
            key={value || "all"}
            type="button"
            role="radio"
            aria-checked={type === value}
            onClick={() => setType(value)}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
      <div className="field">
        <Search className="i" aria-hidden />
        <label className="sr-only" htmlFor="hero-q">
          {labels.field}
        </label>
        <input id="hero-q" name="q" type="search" placeholder={labels.placeholder} autoComplete="off" />
        {type ? <input type="hidden" name="type" value={type} /> : null}
        <button className="btn btn-primary go" type="submit" aria-label={labels.submit}>
          <span className="t">{labels.submit}</span>
          <ArrowRight className="i i-arrow" aria-hidden />
        </button>
      </div>
    </form>
  );
}
