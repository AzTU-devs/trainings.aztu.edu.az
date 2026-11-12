import type { ReactNode } from "react";
import { LocaleLink } from "@/i18n/LocaleLink";

export type Crumb = { label: string; href?: string };

/** The breadcrumb trail: every step a link but the last, which is the current page. */
export function Breadcrumb({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label} className="crumbs">
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="contents">
          {i > 0 ? <span aria-hidden>/</span> : null}
          {c.href ? (
            <LocaleLink href={c.href}>{c.label}</LocaleLink>
          ) : (
            <span aria-current="page">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * The head of every inner public page: the breadcrumb, the title and one
 * line under it, with an optional `aside` (the catalogue's search field, the
 * rooms' figures) beside them from 1024px, and `children` under both (a
 * filter row). No art: the page's content starts right below.
 */
export function PageHeader({
  id,
  title,
  lead,
  crumbs,
  crumbsLabel,
  above,
  aside,
  children,
}: {
  /** The h1's id, which labels the section. */
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: Crumb[];
  crumbsLabel?: string;
  /** A line above the title, e.g. a "sample" pill. */
  above?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="page-head" aria-labelledby={id}>
      <div className="wrap">
        {crumbs?.length ? <Breadcrumb items={crumbs} label={crumbsLabel ?? ""} /> : null}
        <div className="mt-4 grid items-end gap-x-12 gap-y-6 lg:mt-6 lg:grid-cols-12">
          <div className={aside ? "lg:col-span-6" : "lg:col-span-8"}>
            {above ? <div className="mb-3">{above}</div> : null}
            <h1 id={id} className="d-lg">
              {title}
            </h1>
            {lead ? <p className="lead mt-3 max-w-[40rem]">{lead}</p> : null}
          </div>
          {aside ? <div className="min-w-0 lg:col-span-6">{aside}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
