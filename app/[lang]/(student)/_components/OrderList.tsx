import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tag } from "@/components/ui/badge";
import { getT } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { bakuDate, bakuTime, formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

// Mirrors the API's OrderDto (payment/web/dto/OrderDto.java). Only the fields
// this page renders are declared; the rest of the record (userId, subtotal,
// tax, discount, paidAt, items) is not needed here. Note `total`/`placedAt` —
// NOT `totalAmount`/`createdAt`, which the API has never sent.
export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  // BigDecimal with no Jackson customization on the API side, so it arrives as
  // a JSON number; formatPrice accepts either.
  total: string | number;
  currency: string;
  placedAt: string;
};

/** OrderStatus on the API: PENDING, PAID, FAILED, REFUNDED, CANCELLED. */
const STATUS: Record<string, { key: string; variant: "mono" | "gold"; icon?: LucideIcon; className?: string }> = {
  PENDING: { key: "student.orderStatusPending", variant: "gold" },
  PAID: { key: "student.orderStatusPaid", variant: "mono", icon: Check, className: "text-success" },
  FAILED: { key: "student.orderStatusFailed", variant: "mono", className: "border-danger text-danger" },
  REFUNDED: { key: "student.orderStatusRefunded", variant: "mono", className: "text-ink-3" },
  CANCELLED: { key: "student.orderStatusCancelled", variant: "mono", className: "text-ink-3" },
};

/*
 * Dates and times in Baku time (the university's clock), built from the same
 * month tables as the rest of the site (the shared bakuDate/bakuTime).
 * Amounts use formatPrice, in the page's language.
 */
function placed(iso: string, locale: Locale) {
  const date = bakuDate(iso, locale);
  return date ? `${date}, ${bakuTime(iso)}` : "—";
}

/**
 * The order history as a hairline ledger: order number (mono), date, amount
 * and status. The column heads are visual only; each row says its own values
 * in reading order, and on phones the columns fold into two lines.
 */
export async function OrderList({ orders, locale }: { orders: Order[]; locale: Locale }) {
  const t = await getT(locale);
  const cols = "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]";

  return (
    <div>
      <div
        aria-hidden="true"
        className={cn("t-kicker hidden gap-x-5 border-t border-line-strong py-3 text-ink-3 sm:grid", cols)}
      >
        <span>{t("student.orderIndexNumber")}</span>
        <span>{t("student.orderIndexDate")}</span>
        <span className="text-right">{t("student.orderIndexTotal")}</span>
        <span className="text-right">{t("student.indexStatus")}</span>
      </div>
      <ul className="border-y border-line-strong sm:border-t-line">
        {orders.map((o) => {
          const status = STATUS[o.status];
          return (
            <li
              key={o.id}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1.5 border-t border-line py-4 first:border-t-0",
                cols,
              )}
            >
              <p className="min-w-0 font-mono text-sm text-ink [overflow-wrap:anywhere]">
                <span className="sr-only">{t("student.orderIndexNumber")}: </span>
                {o.orderNumber || o.id}
              </p>
              <p className="t-meta col-start-1 row-start-2 sm:col-start-auto sm:row-start-auto sm:text-[15px] sm:text-ink-2">
                {o.placedAt ? placed(o.placedAt, locale) : "—"}
              </p>
              <p className="col-start-2 row-start-1 text-right font-semibold tabular-nums text-ink sm:col-start-auto sm:row-start-auto">
                {formatPrice(o.total, o.currency, locale)}
              </p>
              <div className="col-start-2 row-start-2 text-right sm:col-start-auto sm:row-start-auto">
                <Tag variant={status?.variant ?? "mono"} icon={status?.icon} className={status?.className}>
                  {status ? t(status.key) : o.status}
                </Tag>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
