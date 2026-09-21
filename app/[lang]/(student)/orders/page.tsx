import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { serverFetch } from "@/lib/api/server";
import { endpoints } from "@/lib/api/endpoints";
import { getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/config";
import type { Page } from "@/types/api";
import { AccountIntro } from "../_components/AccountIntro";
import { OrderList, type Order } from "../_components/OrderList";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getT(lang);
  return { title: t("nav.orders") };
}

export default async function OrdersPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale = lang as Locale;
  const t = await getT(locale);

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
    <div className="space-y-8">
      <AccountIntro
        eyebrow={t("student.areaEyebrow")}
        title={t("nav.orders")}
        description={t("student.ordersSubtitle")}
      />
      {orders.length === 0 ? (
        <EmptyState
          icon={<ReceiptText strokeWidth={1.75} />}
          title={t("student.ordersEmpty")}
          description={t("student.ordersEmptyHint")}
        />
      ) : (
        <OrderList orders={orders} locale={locale} />
      )}
    </div>
  );
}
