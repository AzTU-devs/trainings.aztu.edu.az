import { ReceiptText } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { getT } from "@/i18n/server";
import type { Locale } from "@/i18n/config";

// Mirrors the API's OrderDto (payment/web/dto/OrderDto.java). Only the fields
// this page renders are declared; the rest of the record (userId, subtotal,
// tax, discount, paidAt, items) is not needed here. Note `total`/`placedAt` —
// NOT `totalAmount`/`createdAt`, which the API has never sent.
export type Order = {
  id: string;
  orderNumber: string;
  status: string;
  // BigDecimal with no Jackson customization on the API side, so it arrives as
  // a JSON number; price() below accepts either.
  total: string | number;
  currency: string;
  placedAt: string;
};

/** OrderStatus on the API: PENDING, PAID, FAILED, REFUNDED, CANCELLED. */
const STATUS: Record<string, { key: string; variant: BadgeProps["variant"]; className?: string }> = {
  PENDING: { key: "student.orderStatusPending", variant: "gold" },
  PAID: { key: "student.orderStatusPaid", variant: "success" },
  FAILED: {
    key: "student.orderStatusFailed",
    variant: "outline",
    className: "border-transparent bg-destructive/10 text-destructive",
  },
  REFUNDED: { key: "student.orderStatusRefunded", variant: "secondary" },
  CANCELLED: { key: "student.orderStatusCancelled", variant: "secondary" },
};

/*
 * Amounts and dates are formatted in the page's language, not the server's
 * default, and times in Baku time — the university's clock.
 */
function price(amount: string | number, currency: string, locale: string) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    // An unknown currency code — show the number with the code beside it.
    return `${new Intl.NumberFormat(locale).format(n)} ${currency}`;
  }
}

function placed(iso: string, locale: string) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Baku",
  }).format(d);
}

export async function OrderList({ orders, locale }: { orders: Order[]; locale: Locale }) {
  const t = await getT(locale);

  return (
    <ul className="divide-y divide-border/70 overflow-hidden rounded-3xl border border-border/80 bg-card elev-1">
      {orders.map((o) => {
        const status = STATUS[o.status];
        return (
          <li key={o.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
            <span
              aria-hidden
              className="hidden size-11 shrink-0 place-items-center rounded-2xl bg-navy-50 text-navy-700 dark:bg-navy-900/60 dark:text-navy-100 sm:grid"
            >
              <ReceiptText className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[15px] font-semibold leading-snug text-foreground [overflow-wrap:anywhere]">
                {t("student.orderNumber", { number: o.orderNumber || o.id })}
              </p>
              <p className="text-sm text-muted-foreground">
                {o.placedAt ? placed(o.placedAt, locale) : "—"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
              <span className="font-display text-lg leading-none tabular-nums">
                {price(o.total, o.currency, locale)}
              </span>
              <Badge variant={status?.variant ?? "secondary"} className={status?.className}>
                {status ? t(status.key) : o.status}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
