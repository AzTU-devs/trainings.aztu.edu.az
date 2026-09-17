import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EmptyState } from "@/components/common/EmptyState";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Page } from "@/types/api";

export const metadata: Metadata = { title: "Orders" };

// Mirrors the API's OrderDto (payment/web/dto/OrderDto.java). Only the fields
// this page renders are declared; the rest of the record (userId, subtotal,
// tax, discount, paidAt, items) is not needed here. Note `total`/`placedAt` —
// NOT `totalAmount`/`createdAt`, which the API has never sent.
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  // BigDecimal with no Jackson customization on the API side, so it arrives as
  // a JSON number; formatPrice accepts either.
  total: string | number;
  currency: string;
  placedAt: string;
};

type Props = { params: Promise<{ lang: string }> };

export default async function OrdersPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getT(lang as Locale);

  // GET /api/portal/orders/mine returns ApiResponse<PageResponse<OrderDto>>.
  // serverFetch's unwrap() strips only the ApiResponse envelope, so the page
  // itself has to read `.content` — typing this as `Order[]` is what made the
  // page throw "orders.map is not a function" on every render.
  let orders: Order[] = [];
  try {
    const page = await serverFetch<Page<Order>>(endpoints.portal.myOrders, {
      auth: true,
      cache: "no-store",
    });
    orders = page?.content ?? [];
  } catch {
    orders = [];
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl leading-tight">{t("nav.orders")}</h1>
      {orders.length === 0 ? (
        <EmptyState
          title={t("student.ordersEmpty")}
          description={t("student.ordersEmptyHint")}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="font-mono text-xs text-muted-foreground">
                    {o.orderNumber || o.id}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {o.placedAt
                      ? new Date(o.placedAt).toLocaleString(lang)
                      : "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatPrice(o.total, o.currency)}
                  </div>
                  <Badge variant="secondary">{o.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
